// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {RWAMarket} from "../src/RWAMarket.sol";
import {MockStable} from "../src/MockStable.sol";
import {MockRWA} from "../src/MockRWA.sol";
import {YieldAggregator} from "../src/YieldAggregator.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract RWAMarketTest is Test {
    RWAMarket market;
    MockStable usdc;
    MockRWA tbill;
    YieldAggregator tbillFeed;

    address treasury = makeAddr("treasury");
    address investor = makeAddr("investor");

    function setUp() public {
        usdc = new MockStable("Mock USDC", "USDC");
        tbill = new MockRWA("T-Bill", "TBILL", 450);
        tbillFeed = new YieldAggregator(100_00000000, 450, "TBILL/USD"); // $100/share
        market = new RWAMarket(IERC20(address(usdc)), treasury);
        market.list(address(tbill), address(tbillFeed), 450, "treasury", "US T-Bill 3M");

        usdc.mint(investor, 10_000e6);
        vm.prank(investor);
        usdc.approve(address(market), type(uint256).max);
    }

    function test_pricePerShare() public view {
        assertEq(market.pricePerShareUsd(address(tbill)), 100e6); // $100
    }

    function test_invest_mintsSharesAndPaysTreasury() public {
        vm.prank(investor);
        uint256 shares = market.invest(address(tbill), 1_000e6); // $1,000 / $100 = 10 shares
        assertEq(shares, 10e18);
        assertEq(tbill.balanceOf(investor), 10e18);
        assertEq(usdc.balanceOf(treasury), 1_000e6);
        assertEq(usdc.balanceOf(investor), 9_000e6);
    }

    function test_quoteMatchesInvest() public {
        uint256 q = market.quoteShares(address(tbill), 500e6);
        vm.prank(investor);
        uint256 got = market.invest(address(tbill), 500e6);
        assertEq(q, got);
        assertEq(got, 5e18);
    }

    function test_revert_notListed() public {
        MockRWA other = new MockRWA("X", "X", 0);
        vm.expectRevert(abi.encodeWithSelector(RWAMarket.NotListed.selector, address(other)));
        market.quoteShares(address(other), 1e6);
    }

    function test_revert_zeroAmount() public {
        vm.prank(investor);
        vm.expectRevert(RWAMarket.ZeroAmount.selector);
        market.invest(address(tbill), 0);
    }

    function test_delistBlocksInvest() public {
        market.delist(address(tbill));
        vm.prank(investor);
        vm.expectRevert(abi.encodeWithSelector(RWAMarket.NotListed.selector, address(tbill)));
        market.invest(address(tbill), 100e6);
    }

    function test_onlyOwnerLists() public {
        vm.prank(investor);
        vm.expectRevert();
        market.list(address(tbill), address(tbillFeed), 450, "treasury", "x");
    }
}
