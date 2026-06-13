// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title PropertyToken — a tokenized commercial real-estate property.
/// @notice Fractional ownership of a single property (e.g. a $10M Manhattan
/// office tower split into shares). The issuer distributes rental income as
/// QUARTERLY DIVIDENDS in a stablecoin (USDC), paid pro-rata to every holder.
///
/// Dividend accounting uses the audited cumulative "magnified dividend-per-share"
/// pattern (Roger Wu / DividendPayingToken), so payouts stay correct even as
/// tokens are transferred between distributions: each distribution credits all
/// current holders, and a per-account correction term offsets transfers so no
/// one can double-claim or be diluted by tokens minted after a distribution.
contract PropertyToken is ERC20, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @dev 2**128 — high enough that integer-division dust on dividends is negligible.
    uint256 internal constant MAGNITUDE = 2 ** 128;

    /// @notice The stablecoin dividends are paid in (USDC, 6 decimals).
    IERC20 public immutable dividendToken;

    // --- Property metadata (for the UI / ENS / valuation) ---
    string public propertyAddress;
    uint256 public valuationUsd; // total appraised value (6-dec USD)
    uint16 public annualYieldBps; // target rental yield (600 = 6.00%)

    // --- Dividend accounting ---
    uint256 internal magnifiedDividendPerShare;
    mapping(address => int256) internal magnifiedCorrections;
    mapping(address => uint256) public withdrawnDividends;

    uint256 public totalDividendsDistributed; // lifetime USDC paid in
    uint64 public lastDistributionAt;
    uint32 public distributionCount;

    event PropertyConfigured(string propertyAddress, uint256 valuationUsd, uint16 annualYieldBps);
    event SharesIssued(address indexed investor, uint256 shares);
    event DividendsDistributed(uint256 indexed round, uint256 amount, uint256 perShareMagnified);
    event DividendClaimed(address indexed holder, uint256 amount);

    error NoShares();
    error NothingToClaim();

    constructor(
        string memory name_,
        string memory symbol_,
        IERC20 dividendToken_,
        string memory propertyAddress_,
        uint256 valuationUsd_,
        uint16 annualYieldBps_
    ) ERC20(name_, symbol_) Ownable(msg.sender) {
        dividendToken = dividendToken_;
        propertyAddress = propertyAddress_;
        valuationUsd = valuationUsd_;
        annualYieldBps = annualYieldBps_;
        emit PropertyConfigured(propertyAddress_, valuationUsd_, annualYieldBps_);
    }

    // --- Primary distribution (issuance) ------------------------------------

    /// @notice Issuer mints fractional shares to an investor (primary distribution).
    function issueShares(address investor, uint256 shares) external onlyOwner {
        _mint(investor, shares);
        emit SharesIssued(investor, shares);
    }

    // --- Dividend distribution ----------------------------------------------

    /// @notice Issuer deposits `amount` USDC of rental income; credited pro-rata
    /// to all current holders. Pull-payment: holders later claim().
    function distributeDividends(uint256 amount) external nonReentrant {
        uint256 supply = totalSupply();
        if (supply == 0) revert NoShares();

        dividendToken.safeTransferFrom(msg.sender, address(this), amount);
        magnifiedDividendPerShare += (amount * MAGNITUDE) / supply;

        totalDividendsDistributed += amount;
        lastDistributionAt = uint64(block.timestamp);
        distributionCount += 1;

        emit DividendsDistributed(distributionCount, amount, magnifiedDividendPerShare);
    }

    /// @notice Lifetime dividends credited to `account` (claimed + unclaimed).
    function accumulativeDividendOf(address account) public view returns (uint256) {
        int256 raw = int256(magnifiedDividendPerShare * balanceOf(account)) + magnifiedCorrections[account];
        return uint256(raw) / MAGNITUDE;
    }

    /// @notice Dividends `account` can withdraw right now.
    function withdrawableDividendOf(address account) public view returns (uint256) {
        return accumulativeDividendOf(account) - withdrawnDividends[account];
    }

    /// @notice Withdraw all of the caller's accrued dividends in USDC.
    function claimDividend() external nonReentrant returns (uint256 amount) {
        amount = withdrawableDividendOf(msg.sender);
        if (amount == 0) revert NothingToClaim();
        withdrawnDividends[msg.sender] += amount;
        dividendToken.safeTransfer(msg.sender, amount);
        emit DividendClaimed(msg.sender, amount);
    }

    // --- Transfer hook: keep dividend accounting correct on balance changes --

    function _update(address from, address to, uint256 value) internal override {
        super._update(from, to, value);
        int256 magCorrection = int256(magnifiedDividendPerShare * value);
        if (from != address(0)) magnifiedCorrections[from] += magCorrection; // keeps sender's past credit
        if (to != address(0)) magnifiedCorrections[to] -= magCorrection; // recipient can't claim pre-transfer dividends
    }
}
