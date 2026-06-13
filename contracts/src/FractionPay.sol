// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

/// @title FractionPay — pay merchants in USDC by liquidating fractions of RWA tokens.
/// @notice Settlement router with Chainlink oracle pricing:
///   1. Merchant is identified off-chain by ENS; settlement lands at their address.
///   2. Buyer approves a fraction of an RWA token (chosen by the optimizer agent).
///   3. payWithRWA() prices the RWA via its Chainlink-compatible feed (staleness-
///      checked), pulls the RWA, and pays the merchant USDC from pool liquidity —
///      one atomic transaction, no partial failures.
contract FractionPay is Ownable {
    using SafeERC20 for IERC20;

    /// @notice Settlement token (USDC — native Circle USDC on Arc, mock elsewhere).
    IERC20 public immutable usdc;
    uint8 private immutable usdcDecimals;

    /// @notice Chainlink-compatible USD price feed per supported RWA token.
    mapping(address => AggregatorV3Interface) public priceFeeds;

    /// @notice Max age of an oracle answer before payments revert.
    uint256 public constant MAX_PRICE_AGE = 1 days;

    struct Payment {
        address payer;
        address merchant;
        address rwaToken;
        uint256 rwaAmount;
        uint256 usdcAmount;
        int256 priceUsed;
        uint64 timestamp;
    }

    Payment[] public payments;

    event RWARegistered(address indexed rwaToken, address indexed feed);
    event PaymentSettled(
        uint256 indexed paymentId,
        address indexed payer,
        address indexed merchant,
        address rwaToken,
        uint256 rwaAmount,
        uint256 usdcAmount,
        int256 priceUsed
    );
    event LiquidityDeposited(address indexed from, uint256 amount);
    event LiquidityWithdrawn(address indexed to, uint256 amount);

    error UnsupportedRWA(address token);
    error StalePrice(uint256 updatedAt);
    error InvalidPrice(int256 answer);
    error InsufficientLiquidity(uint256 needed, uint256 available);
    error SlippageExceeded(uint256 usdcOut, uint256 minUsdcOut);

    constructor(IERC20 usdc_) Ownable(msg.sender) {
        usdc = usdc_;
        usdcDecimals = IERC20Metadata(address(usdc_)).decimals();
    }

    /// @notice Register an RWA token with its Chainlink-compatible USD feed.
    function registerRWA(address rwaToken, address feed) external onlyOwner {
        priceFeeds[rwaToken] = AggregatorV3Interface(feed);
        emit RWARegistered(rwaToken, feed);
    }

    /// @notice Quote how much USDC a given RWA fraction is worth right now.
    function quote(address rwaToken, uint256 rwaAmount)
        public
        view
        returns (uint256 usdcOut, int256 price)
    {
        AggregatorV3Interface feed = priceFeeds[rwaToken];
        if (address(feed) == address(0)) revert UnsupportedRWA(rwaToken);

        (, int256 answer,, uint256 updatedAt,) = feed.latestRoundData();
        if (answer <= 0) revert InvalidPrice(answer);
        if (block.timestamp - updatedAt > MAX_PRICE_AGE) revert StalePrice(updatedAt);

        uint8 rwaDecimals = IERC20Metadata(rwaToken).decimals();
        uint8 feedDecimals = feed.decimals();

        // usdcOut = rwaAmount * price, normalized from (rwaDecimals + feedDecimals)
        // down to usdcDecimals.
        usdcOut = (rwaAmount * uint256(answer) * (10 ** usdcDecimals))
            / (10 ** (rwaDecimals + feedDecimals));
        price = answer;
    }

    /// @notice Atomically liquidate an RWA fraction and settle USDC to a merchant.
    /// @param merchant   Settlement address (resolved off-chain from the merchant's ENS).
    /// @param rwaToken   The RWA the optimizer agent chose to liquidate.
    /// @param rwaAmount  Fraction of the RWA to sell (must be approved beforehand).
    /// @param minUsdcOut Slippage guard for the oracle-priced conversion.
    function payWithRWA(
        address merchant,
        address rwaToken,
        uint256 rwaAmount,
        uint256 minUsdcOut
    ) external returns (uint256 paymentId, uint256 usdcOut) {
        int256 price;
        (usdcOut, price) = quote(rwaToken, rwaAmount);
        if (usdcOut < minUsdcOut) revert SlippageExceeded(usdcOut, minUsdcOut);

        uint256 available = usdc.balanceOf(address(this));
        if (usdcOut > available) revert InsufficientLiquidity(usdcOut, available);

        // Pull the RWA fraction from the buyer, pay the merchant from pool liquidity.
        IERC20(rwaToken).safeTransferFrom(msg.sender, address(this), rwaAmount);
        usdc.safeTransfer(merchant, usdcOut);

        paymentId = payments.length;
        payments.push(
            Payment({
                payer: msg.sender,
                merchant: merchant,
                rwaToken: rwaToken,
                rwaAmount: rwaAmount,
                usdcAmount: usdcOut,
                priceUsed: price,
                timestamp: uint64(block.timestamp)
            })
        );

        emit PaymentSettled(paymentId, msg.sender, merchant, rwaToken, rwaAmount, usdcOut, price);
    }

    /// @notice Seed the settlement pool with USDC.
    function depositLiquidity(uint256 amount) external {
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        emit LiquidityDeposited(msg.sender, amount);
    }

    /// @notice Withdraw pool USDC and/or accumulated RWA (owner only).
    function withdraw(address token, address to, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(to, amount);
        emit LiquidityWithdrawn(to, amount);
    }

    function paymentsCount() external view returns (uint256) {
        return payments.length;
    }
}
