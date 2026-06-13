// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

/// @notice Chainlink-compatible price feed for RWA tokens on testnets where
/// no canonical feed exists. Implements AggregatorV3Interface exactly, so
/// FractionPay consumes it identically to a production Chainlink feed
/// (8 decimals, USD quote), and a real feed address can be dropped in.
contract MockAggregator is AggregatorV3Interface {
    int256 private _answer;
    uint256 private _updatedAt;
    uint80 private _roundId;
    string private _desc;

    constructor(int256 initialAnswer, string memory desc_) {
        _answer = initialAnswer;
        _updatedAt = block.timestamp;
        _roundId = 1;
        _desc = desc_;
    }

    /// @notice Update the price (demo: simulate live RWA repricing).
    function setAnswer(int256 newAnswer) external {
        _answer = newAnswer;
        _updatedAt = block.timestamp;
        _roundId += 1;
    }

    function decimals() external pure override returns (uint8) {
        return 8;
    }

    function description() external view override returns (string memory) {
        return _desc;
    }

    function version() external pure override returns (uint256) {
        return 1;
    }

    function getRoundData(uint80 roundId_)
        external
        view
        override
        returns (uint80, int256, uint256, uint256, uint80)
    {
        return (roundId_, _answer, _updatedAt, _updatedAt, roundId_);
    }

    function latestRoundData()
        external
        view
        override
        returns (uint80, int256, uint256, uint256, uint80)
    {
        return (_roundId, _answer, _updatedAt, _updatedAt, _roundId);
    }
}
