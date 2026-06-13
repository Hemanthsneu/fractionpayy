// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

/// @title YieldAggregator — a Chainlink-compatible feed whose price ACCRUES yield.
/// @notice Models a yield-bearing RWA (e.g. a tokenized T-bill): the USD price
/// grows continuously at the asset's APY, so simply holding the token earns
/// yield on-chain. price(t) = basePrice * (1 + apyBps/1e4 * elapsed / 365d).
/// 8 decimals + AggregatorV3Interface, so it's a drop-in for a real Chainlink feed.
contract YieldAggregator is AggregatorV3Interface {
    int256 public immutable basePrice; // 8-dec USD price at startedAt
    uint16 public immutable apyBps; // annual yield in basis points (450 = 4.50%)
    uint256 public immutable startedAt;
    string private _desc;

    uint256 private constant YEAR = 365 days;

    constructor(int256 basePrice_, uint16 apyBps_, string memory desc_) {
        basePrice = basePrice_;
        apyBps = apyBps_;
        startedAt = block.timestamp;
        _desc = desc_;
    }

    /// @notice Current accrued price (linear APY accrual since deployment).
    function currentPrice() public view returns (int256) {
        uint256 elapsed = block.timestamp - startedAt;
        uint256 growth = (uint256(basePrice) * apyBps * elapsed) / (10_000 * YEAR);
        return basePrice + int256(growth);
    }

    function decimals() external pure override returns (uint8) {
        return 8;
    }

    function description() external view override returns (string memory) {
        return _desc;
    }

    function version() external pure override returns (uint256) {
        return 2;
    }

    function getRoundData(uint80 roundId_)
        external
        view
        override
        returns (uint80, int256, uint256, uint256, uint80)
    {
        return (roundId_, currentPrice(), startedAt, block.timestamp, roundId_);
    }

    function latestRoundData()
        external
        view
        override
        returns (uint80, int256, uint256, uint256, uint80)
    {
        // updatedAt = now: always fresh (price is computed, never stale).
        return (1, currentPrice(), startedAt, block.timestamp, 1);
    }
}
