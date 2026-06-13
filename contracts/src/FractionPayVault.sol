// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

/// @title FractionPayVault — a yield-bearing RWA liquidity & payment protocol on Arc.
/// @notice Liquidity providers deposit USDC and receive fpUSDC shares (ERC-4626).
/// The vault is the settlement liquidity for RWA-backed payments. Two yield
/// streams accrue to LPs, both reflected in the USD-denominated NAV:
///   1. PROTOCOL FEES — every payment retains a fee as the spread between the
///      RWA taken in (full USD value) and the stablecoin paid out (net).
///   2. RWA YIELD — the RWAs the vault accumulates accrue yield on-chain
///      (their oracle price grows at the asset's APY), lifting NAV over time.
///
/// Payments settle in any registered stablecoin (USDC / EURC) using oracle FX,
/// and the agent's yield-preserving liquidation (sell the lowest-yield slice)
/// is quantified on-chain. NAV = USDC + Σ(otherStable·fx) + Σ(RWA·price).
contract FractionPayVault is ERC4626, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct RWAInfo {
        AggregatorV3Interface feed; // 8-dec USD price (yield-accruing)
        uint16 apyBps;
        bool active;
    }

    struct StableInfo {
        AggregatorV3Interface feed; // 8-dec USD price; address(0) => pegged $1 (the asset)
        bool active;
    }

    struct Payment {
        address payer;
        address merchant;
        address rwaToken;
        uint256 rwaAmount;
        address payToken;
        uint256 payOut;
        uint256 usdValue;
        uint256 feeUsd;
        uint64 timestamp;
    }

    mapping(address => RWAInfo) public rwaInfo;
    address[] public rwaList;
    mapping(address => StableInfo) public stableInfo;
    address[] public stableList;

    Payment[] public payments;

    uint16 public feeBps = 50; // 0.50% — retained by the vault for LPs
    uint16 public constant MAX_FEE_BPS = 200;
    uint256 public constant MAX_PRICE_AGE = 2 days;

    uint256 public totalFeesUsd; // lifetime protocol revenue (accounting)
    uint256 public totalYieldPreservedUsd; // lifetime annualized yield the agent preserved

    event RWARegistered(address indexed token, address feed, uint16 apyBps);
    event StableRegistered(address indexed token, address feed);
    event FeeBpsUpdated(uint16 feeBps);
    event Settled(
        uint256 indexed id,
        address indexed payer,
        address indexed merchant,
        address rwaToken,
        uint256 rwaAmount,
        address payToken,
        uint256 payOut,
        uint256 usdValue,
        uint256 feeUsd,
        uint256 yieldPreservedPerYearUsd
    );

    error UnsupportedRWA(address token);
    error UnsupportedStable(address token);
    error InvalidPrice(address feed);
    error StalePrice(address feed);
    error SlippageExceeded(uint256 payOut, uint256 minOut);
    error InsufficientLiquidity(uint256 needed, uint256 available);
    error FeeTooHigh();

    constructor(IERC20 usdc_)
        ERC20("FractionPay LP USDC", "fpUSDC")
        ERC4626(usdc_)
        Ownable(msg.sender)
    {
        // The vault asset (USDC) is itself a payable stablecoin, pegged at $1.
        stableInfo[address(usdc_)] = StableInfo(AggregatorV3Interface(address(0)), true);
        stableList.push(address(usdc_));
    }

    // --- Admin --------------------------------------------------------------

    function registerRWA(address token, address feed, uint16 apyBps) external onlyOwner {
        if (!rwaInfo[token].active) rwaList.push(token);
        rwaInfo[token] = RWAInfo(AggregatorV3Interface(feed), apyBps, true);
        emit RWARegistered(token, feed, apyBps);
    }

    /// @param feed 8-dec USD price feed for FX; address(0) means pegged $1.
    function registerStable(address token, address feed) external onlyOwner {
        if (!stableInfo[token].active) stableList.push(token);
        stableInfo[token] = StableInfo(AggregatorV3Interface(feed), true);
        emit StableRegistered(token, feed);
    }

    function setFeeBps(uint16 newFeeBps) external onlyOwner {
        if (newFeeBps > MAX_FEE_BPS) revert FeeTooHigh();
        feeBps = newFeeBps;
        emit FeeBpsUpdated(newFeeBps);
    }

    // --- Oracle helpers -----------------------------------------------------

    function _price(AggregatorV3Interface feed) internal view returns (uint256) {
        (, int256 answer,, uint256 updatedAt,) = feed.latestRoundData();
        if (answer <= 0) revert InvalidPrice(address(feed));
        if (block.timestamp - updatedAt > MAX_PRICE_AGE) revert StalePrice(address(feed));
        return uint256(answer); // 8-dec
    }

    /// USD value (6-dec, USDC terms) of an RWA amount (18-dec).
    function rwaUsdValue(address token, uint256 amount) public view returns (uint256) {
        RWAInfo memory r = rwaInfo[token];
        if (!r.active) revert UnsupportedRWA(token);
        return (amount * _price(r.feed)) / 1e20; // 18 + 8 - 6 = 20
    }

    /// USD value (6-dec) of a stablecoin balance (6-dec); USDC pegged $1.
    function stableUsdValue(address token, uint256 amount) public view returns (uint256) {
        StableInfo memory s = stableInfo[token];
        if (!s.active) revert UnsupportedStable(token);
        if (address(s.feed) == address(0)) return amount; // $1 peg
        return (amount * _price(s.feed)) / 1e8;
    }

    /// Convert a USD amount (6-dec) into units of a registered stablecoin (6-dec).
    function usdToStable(address token, uint256 usdAmount) public view returns (uint256) {
        StableInfo memory s = stableInfo[token];
        if (!s.active) revert UnsupportedStable(token);
        if (address(s.feed) == address(0)) return usdAmount; // $1 peg
        return (usdAmount * 1e8) / _price(s.feed);
    }

    // --- ERC-4626 NAV (USD-denominated, in USDC terms) ----------------------

    /// @notice Total vault NAV = USDC + Σ(other stable · fx) + Σ(RWA · price).
    function totalAssets() public view override returns (uint256 nav) {
        for (uint256 i; i < stableList.length; ++i) {
            address t = stableList[i];
            if (stableInfo[t].active) {
                nav += stableUsdValue(t, IERC20(t).balanceOf(address(this)));
            }
        }
        for (uint256 i; i < rwaList.length; ++i) {
            address t = rwaList[i];
            if (rwaInfo[t].active) {
                nav += rwaUsdValue(t, IERC20(t).balanceOf(address(this)));
            }
        }
    }

    /// Withdrawals are capped by available USDC liquidity (NAV can hold RWA/EURC).
    function maxWithdraw(address owner) public view override returns (uint256) {
        uint256 byShares = super.maxWithdraw(owner);
        uint256 liquid = IERC20(asset()).balanceOf(address(this));
        return byShares < liquid ? byShares : liquid;
    }

    function maxRedeem(address owner) public view override returns (uint256) {
        uint256 liquid = IERC20(asset()).balanceOf(address(this));
        uint256 liquidShares = _convertToShares(liquid, Math.Rounding.Floor);
        uint256 bal = balanceOf(owner);
        return bal < liquidShares ? bal : liquidShares;
    }

    // --- Payment engine -----------------------------------------------------

    /// @notice Quote a payment: how much `payToken` a merchant receives for an RWA slice.
    function quote(address rwaToken, uint256 rwaAmount, address payToken)
        public
        view
        returns (uint256 payOut, uint256 usdValue, uint256 feeUsd)
    {
        usdValue = rwaUsdValue(rwaToken, rwaAmount);
        feeUsd = (usdValue * feeBps) / 10_000;
        payOut = usdToStable(payToken, usdValue - feeUsd);
    }

    /// @notice Liquidate an RWA slice and settle a merchant in their chosen stablecoin.
    /// The vault keeps the RWA (full USD value) and pays out net — the fee compounds to LPs.
    function pay(
        address merchant,
        address rwaToken,
        uint256 rwaAmount,
        address payToken,
        uint256 minOut
    ) external nonReentrant returns (uint256 id, uint256 payOut) {
        if (!rwaInfo[rwaToken].active) revert UnsupportedRWA(rwaToken);
        if (!stableInfo[payToken].active) revert UnsupportedStable(payToken);

        uint256 usdValue = rwaUsdValue(rwaToken, rwaAmount);
        uint256 feeUsd = (usdValue * feeBps) / 10_000;
        payOut = usdToStable(payToken, usdValue - feeUsd);
        if (payOut < minOut) revert SlippageExceeded(payOut, minOut);

        uint256 available = IERC20(payToken).balanceOf(address(this));
        if (payOut > available) revert InsufficientLiquidity(payOut, available);

        uint256 yieldPreserved = _yieldPreservedPerYear(rwaToken, usdValue);

        IERC20(rwaToken).safeTransferFrom(msg.sender, address(this), rwaAmount);
        IERC20(payToken).safeTransfer(merchant, payOut);

        totalFeesUsd += feeUsd;
        totalYieldPreservedUsd += yieldPreserved;

        id = payments.length;
        payments.push(
            Payment({
                payer: msg.sender,
                merchant: merchant,
                rwaToken: rwaToken,
                rwaAmount: rwaAmount,
                payToken: payToken,
                payOut: payOut,
                usdValue: usdValue,
                feeUsd: feeUsd,
                timestamp: uint64(block.timestamp)
            })
        );

        emit Settled(
            id, msg.sender, merchant, rwaToken, rwaAmount, payToken, payOut, usdValue, feeUsd, yieldPreserved
        );
    }

    /// Annualized USD yield preserved by liquidating `soldToken` instead of the
    /// highest-APY held asset for the same USD value — the optimizer agent's edge.
    function _yieldPreservedPerYear(address soldToken, uint256 usdValue)
        internal
        view
        returns (uint256)
    {
        uint16 soldApy = rwaInfo[soldToken].apyBps;
        uint16 maxApy;
        for (uint256 i; i < rwaList.length; ++i) {
            uint16 a = rwaInfo[rwaList[i]].apyBps;
            if (rwaInfo[rwaList[i]].active && a > maxApy) maxApy = a;
        }
        if (maxApy <= soldApy) return 0;
        return (usdValue * (maxApy - soldApy)) / 10_000;
    }

    // --- Views --------------------------------------------------------------

    function pricePerShare() external view returns (uint256) {
        return convertToAssets(10 ** decimals());
    }

    function paymentsCount() external view returns (uint256) {
        return payments.length;
    }

    function rwaCount() external view returns (uint256) {
        return rwaList.length;
    }
}
