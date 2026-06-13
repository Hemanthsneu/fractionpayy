// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {FractionPay} from "../src/FractionPay.sol";
import {MockUSDC} from "../src/MockUSDC.sol";
import {MockRWA} from "../src/MockRWA.sol";
import {MockAggregator} from "../src/MockAggregator.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract FractionPayTest is Test {
    FractionPay pay;
    MockUSDC usdc;
    MockRWA tbill;
    MockAggregator tbillFeed;

    address buyer = makeAddr("buyer");
    address merchant = makeAddr("merchant");

    // T-bill priced at $100.00 (8 feed decimals).
    int256 constant TBILL_PRICE = 100_00000000;

    function setUp() public {
        usdc = new MockUSDC();
        tbill = new MockRWA("Mock T-Bill 2026", "TBILL", 450);
        tbillFeed = new MockAggregator(TBILL_PRICE, "TBILL / USD");
        pay = new FractionPay(IERC20(address(usdc)));

        pay.registerRWA(address(tbill), address(tbillFeed));

        // Seed pool with 10,000 USDC and buyer with 500 TBILL (= $50,000).
        usdc.mint(address(this), 10_000e6);
        usdc.approve(address(pay), type(uint256).max);
        pay.depositLiquidity(10_000e6);
        tbill.mint(buyer, 500e18);
    }

    function test_quote() public view {
        // 0.06 TBILL @ $100 = $6.00 = 6e6 USDC
        (uint256 usdcOut, int256 price) = pay.quote(address(tbill), 0.06e18);
        assertEq(usdcOut, 6e6);
        assertEq(price, TBILL_PRICE);
    }

    function test_payWithRWA_settlesMerchant() public {
        vm.startPrank(buyer);
        tbill.approve(address(pay), 0.06e18);
        (uint256 id, uint256 usdcOut) = pay.payWithRWA(merchant, address(tbill), 0.06e18, 6e6);
        vm.stopPrank();

        assertEq(id, 0);
        assertEq(usdcOut, 6e6);
        assertEq(usdc.balanceOf(merchant), 6e6); // merchant got $6 USDC
        assertEq(tbill.balanceOf(buyer), 500e18 - 0.06e18); // fraction sold
        assertEq(pay.paymentsCount(), 1);
    }

    function test_emitsReceipt() public {
        vm.startPrank(buyer);
        tbill.approve(address(pay), 1e18);
        vm.expectEmit(true, true, true, true);
        emit FractionPay.PaymentSettled(0, buyer, merchant, address(tbill), 1e18, 100e6, TBILL_PRICE);
        pay.payWithRWA(merchant, address(tbill), 1e18, 0);
        vm.stopPrank();
    }

    function test_revert_unsupportedRWA() public {
        MockRWA gold = new MockRWA("Mock Gold", "XAUM", 0);
        vm.expectRevert(abi.encodeWithSelector(FractionPay.UnsupportedRWA.selector, address(gold)));
        pay.quote(address(gold), 1e18);
    }

    function test_revert_stalePrice() public {
        vm.warp(block.timestamp + 2 days); // feed last updated at deploy
        vm.expectRevert();
        pay.quote(address(tbill), 1e18);
    }

    function test_revert_slippage() public {
        vm.startPrank(buyer);
        tbill.approve(address(pay), 0.06e18);
        vm.expectRevert(abi.encodeWithSelector(FractionPay.SlippageExceeded.selector, 6e6, 7e6));
        pay.payWithRWA(merchant, address(tbill), 0.06e18, 7e6);
        vm.stopPrank();
    }

    function test_revert_insufficientLiquidity() public {
        vm.startPrank(buyer);
        tbill.approve(address(pay), 200e18); // $20,000 > $10,000 pool
        vm.expectRevert(
            abi.encodeWithSelector(FractionPay.InsufficientLiquidity.selector, 20_000e6, 10_000e6)
        );
        pay.payWithRWA(merchant, address(tbill), 200e18, 0);
        vm.stopPrank();
    }

    function test_priceUpdateChangesQuote() public {
        tbillFeed.setAnswer(102_00000000); // T-bill reprices to $102
        (uint256 usdcOut,) = pay.quote(address(tbill), 1e18);
        assertEq(usdcOut, 102e6);
    }

    function test_onlyOwnerCanRegister() public {
        vm.prank(buyer);
        vm.expectRevert();
        pay.registerRWA(address(tbill), address(tbillFeed));
    }
}
