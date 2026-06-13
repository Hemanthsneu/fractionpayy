// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

interface IMintable {
    function mint(address to, uint256 amount) external;
}

/// @title RWAMarket — primary market for tokenized real-world assets.
/// @notice An admin lists tokenized RWAs (real estate, T-bills, bonds, funds…)
/// with an oracle price + yield. Investors buy fractional shares with USDC at
/// the live oracle price; USDC flows to the issuer treasury and shares are
/// minted to the investor, building their on-chain portfolio. The same shares
/// are spendable via FractionPayVault — closing the issue → earn → spend loop.
contract RWAMarket is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;
    address public treasury;

    struct Listing {
        AggregatorV3Interface feed; // 8-dec USD price per whole share
        uint16 apyBps; // promised yield
        string assetType; // "real-estate" | "treasury" | "bond" | "fund" | "commodity"
        string name;
        bool active;
    }

    mapping(address => Listing) public listings;
    address[] public assets;

    event Listed(address indexed token, string assetType, string name, address feed, uint16 apyBps);
    event Delisted(address indexed token);
    event Invested(address indexed investor, address indexed token, uint256 usdcIn, uint256 shares);

    error NotListed(address token);
    error BadPrice(address feed);
    error ZeroAmount();

    constructor(IERC20 usdc_, address treasury_) Ownable(msg.sender) {
        usdc = usdc_;
        treasury = treasury_;
    }

    function setTreasury(address t) external onlyOwner {
        treasury = t;
    }

    /// @notice Admin lists (or updates) a tokenized RWA for sale.
    function list(
        address token,
        address feed,
        uint16 apyBps,
        string calldata assetType,
        string calldata name
    ) external onlyOwner {
        if (!listings[token].active) assets.push(token);
        listings[token] =
            Listing(AggregatorV3Interface(feed), apyBps, assetType, name, true);
        emit Listed(token, assetType, name, feed, apyBps);
    }

    function delist(address token) external onlyOwner {
        listings[token].active = false;
        emit Delisted(token);
    }

    /// @notice Price of one whole share in USDC terms (6-dec).
    function pricePerShareUsd(address token) public view returns (uint256) {
        Listing memory l = listings[token];
        if (!l.active) revert NotListed(token);
        (, int256 answer,,,) = l.feed.latestRoundData();
        if (answer <= 0) revert BadPrice(address(l.feed));
        return uint256(answer) / 100; // 8-dec USD -> 6-dec USDC per share
    }

    /// @notice Quote shares received for a USDC investment.
    function quoteShares(address token, uint256 usdcAmount) public view returns (uint256) {
        return (usdcAmount * 1e18) / pricePerShareUsd(token);
    }

    /// @notice Invest USDC into a listed RWA; mints fractional shares to the investor.
    function invest(address token, uint256 usdcAmount)
        external
        nonReentrant
        returns (uint256 shares)
    {
        if (usdcAmount == 0) revert ZeroAmount();
        if (!listings[token].active) revert NotListed(token);

        shares = (usdcAmount * 1e18) / pricePerShareUsd(token);
        usdc.safeTransferFrom(msg.sender, treasury, usdcAmount);
        IMintable(token).mint(msg.sender, shares);

        emit Invested(msg.sender, token, usdcAmount, shares);
    }

    function assetCount() external view returns (uint256) {
        return assets.length;
    }
}
