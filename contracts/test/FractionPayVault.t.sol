// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {FractionPayVault} from "../src/FractionPayVault.sol";
import {MockStable} from "../src/MockStable.sol";
import {MockRWA} from "../src/MockRWA.sol";
import {YieldAggregator} from "../src/YieldAggregator.sol";
import {MockAggregator} from "../src/MockAggregator.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract FractionPayVaultTest is Test {
    FractionPayVault vault;
    MockStable usdc;
    MockStable eurc;
    MockRWA tbill;
    MockRWA gold;
    YieldAggregator tbillFeed;
    YieldAggregator goldFeed;
    MockAggregator eurcFeed;

    address lp = makeAddr("lp");
    address buyer = makeAddr("buyer");
    address merchant = makeAddr("merchant");

    function setUp() public {
        usdc = new MockStable("Mock USDC", "USDC");
        eurc = new MockStable("Mock EURC", "EURC");
        tbill = new MockRWA("T-Bill", "TBILL", 450); // 4.50% APY
        gold = new MockRWA("Gold", "XAUM", 0); // no yield
        tbillFeed = new YieldAggregator(100_00000000, 450, "TBILL/USD"); // $100, accrues
        goldFeed = new YieldAggregator(2400_00000000, 0, "XAUM/USD"); // $2400, no accrual
        eurcFeed = new MockAggregator(108_000000, "EURC/USD"); // $1.08

        vault = new FractionPayVault(IERC20(address(usdc)));
        vault.registerRWA(address(tbill), address(tbillFeed), 450);
        vault.registerRWA(address(gold), address(goldFeed), 0);
        vault.registerStable(address(eurc), address(eurcFeed));

        // LP seeds 100k USDC liquidity; vault also holds 50k EURC reserve.
        usdc.mint(lp, 100_000e6);
        vm.startPrank(lp);
        usdc.approve(address(vault), type(uint256).max);
        vault.deposit(100_000e6, lp);
        vm.stopPrank();
        eurc.mint(address(vault), 50_000e6);

        // Buyer holds RWA.
        gold.mint(buyer, 100e18); // $240k gold
        tbill.mint(buyer, 1000e18); // $100k t-bills
    }

    function test_lpSharesMatchDeposit() public view {
        // First deposit: 1:1 (NAV included the EURC reserve only after mint, but
        // deposit happened before EURC mint, so shares == assets).
        assertEq(vault.balanceOf(lp), 100_000e6);
    }

    function test_quote_usdc() public view {
        // 0.05 gold @ $2400 = $120; fee 0.5% = $0.60; net $119.40
        (uint256 payOut, uint256 usd, uint256 fee) = vault.quote(address(gold), 0.05e18, address(usdc));
        assertEq(usd, 120e6);
        assertEq(fee, 0.6e6);
        assertEq(payOut, 119.4e6);
    }

    function test_quote_eurc_fx() public view {
        // $119.40 net / $1.08 = 110.555... EURC
        (uint256 payOut,,) = vault.quote(address(gold), 0.05e18, address(eurc));
        assertApproxEqAbs(payOut, uint256(119.4e6) * 1e8 / 108_000000, 2);
    }

    function test_pay_usdc_feeAccruesToLPs() public {
        uint256 navBefore = vault.totalAssets();

        vm.startPrank(buyer);
        gold.approve(address(vault), 0.05e18);
        (, uint256 payOut) = vault.pay(merchant, address(gold), 0.05e18, address(usdc), 119e6);
        vm.stopPrank();

        assertEq(payOut, 119.4e6);
        assertEq(usdc.balanceOf(merchant), 119.4e6);
        // Vault took $120 of gold, paid $119.40 → NAV up by the $0.60 fee.
        assertApproxEqAbs(vault.totalAssets(), navBefore + 0.6e6, 1);
        assertEq(vault.totalFeesUsd(), 0.6e6);
    }

    function test_pay_eurc_settlesInEuro() public {
        vm.startPrank(buyer);
        gold.approve(address(vault), 0.05e18);
        (, uint256 payOut) = vault.pay(merchant, address(gold), 0.05e18, address(eurc), 0);
        vm.stopPrank();
        assertEq(eurc.balanceOf(merchant), payOut);
        assertGt(payOut, 0);
        assertEq(usdc.balanceOf(merchant), 0); // paid in EURC, not USDC
    }

    function test_yieldPreserved_sellingGoldOverTbill() public {
        // Selling $120 of zero-yield gold instead of 4.5% t-bills preserves
        // 4.5% * $120 = $5.40/yr.
        vm.startPrank(buyer);
        gold.approve(address(vault), 0.05e18);
        vault.pay(merchant, address(gold), 0.05e18, address(usdc), 0);
        vm.stopPrank();
        assertEq(vault.totalYieldPreservedUsd(), 5.4e6);
    }

    function test_yieldPreserved_zeroWhenSellingHighestYield() public {
        // Selling t-bills (the highest-APY asset) preserves nothing.
        vm.startPrank(buyer);
        tbill.approve(address(vault), 1e18); // $100
        vault.pay(merchant, address(tbill), 1e18, address(usdc), 0);
        vm.stopPrank();
        assertEq(vault.totalYieldPreservedUsd(), 0);
    }

    function test_rwaYieldLiftsNAVOverTime() public {
        // Move a chunk of RWA into the vault so accrual is visible.
        vm.startPrank(buyer);
        tbill.approve(address(vault), 100e18);
        vault.pay(merchant, address(tbill), 100e18, address(usdc), 0); // vault now holds 100 TBILL
        vm.stopPrank();

        uint256 navBefore = vault.totalAssets();
        uint256 ppsBefore = vault.pricePerShare();
        vm.warp(block.timestamp + 365 days); // one year of 4.5% accrual
        eurcFeed.setAnswer(108_000000); // oracle refresh (a fixed mock would go stale)
        uint256 navAfter = vault.totalAssets();

        // 100 TBILL @ ~$100 = ~$10k, +4.5% ≈ +$450 NAV from yield alone.
        assertGt(navAfter, navBefore);
        assertApproxEqAbs(navAfter - navBefore, 450e6, 5e6);
        assertGt(vault.pricePerShare(), ppsBefore); // LP shares appreciated
    }

    function test_maxWithdrawCappedByLiquidity() public {
        // Drain most USDC by paying out, then LP withdraw is capped to USDC on hand.
        vm.startPrank(buyer);
        gold.approve(address(vault), 100e18);
        vault.pay(merchant, address(gold), 40e18, address(usdc), 0); // pays ~$95.5k USDC
        vm.stopPrank();
        uint256 liquid = usdc.balanceOf(address(vault));
        // Withdrawals are capped to available USDC, far below the LP's ~$100k claim.
        assertLe(vault.maxWithdraw(lp), liquid);
        assertLt(vault.maxWithdraw(lp), 10_000e6);
        assertApproxEqAbs(vault.maxWithdraw(lp), liquid, 100);
    }

    function test_revert_slippage() public {
        vm.startPrank(buyer);
        gold.approve(address(vault), 0.05e18);
        vm.expectRevert(
            abi.encodeWithSelector(FractionPayVault.SlippageExceeded.selector, 119.4e6, 120e6)
        );
        vault.pay(merchant, address(gold), 0.05e18, address(usdc), 120e6);
        vm.stopPrank();
    }

    function test_revert_insufficientLiquidity() public {
        // Try to pay out more USDC than the vault holds.
        vm.startPrank(buyer);
        gold.approve(address(vault), 100e18);
        vm.expectRevert();
        vault.pay(merchant, address(gold), 100e18, address(usdc), 0); // $240k > 100k USDC
        vm.stopPrank();
    }

    function test_onlyOwnerRegisters() public {
        vm.prank(buyer);
        vm.expectRevert();
        vault.registerRWA(address(gold), address(goldFeed), 0);
    }

    // --- Audit fix: a stale/invalid feed must NOT brick the vault ------------

    function test_staleFeedDoesNotBrickVault() public {
        // EURC feed goes stale (no refresh for > maxPriceAge).
        vm.warp(block.timestamp + 8 days);
        // totalAssets must NOT revert; it just skips the stale EURC reserve.
        uint256 nav = vault.totalAssets();
        assertGt(nav, 0);
        // LP can still withdraw available USDC; deposits still work.
        vm.startPrank(lp);
        uint256 maxW = vault.maxWithdraw(lp);
        assertGt(maxW, 0);
        vault.withdraw(maxW, lp, lp);
        vm.stopPrank();
    }

    function test_zeroPriceFeedDoesNotBrickVault() public {
        eurcFeed.setAnswer(0); // malicious/incident: feed reports 0
        uint256 nav = vault.totalAssets(); // skips EURC, does not revert
        assertGt(nav, 0);
    }

    function test_ownerCanDeactivateDeadFeed() public {
        vm.warp(block.timestamp + 8 days);
        uint256 navWithStale = vault.totalAssets(); // EURC skipped
        vault.setStableActive(address(eurc), false); // remove dead feed
        assertEq(vault.totalAssets(), navWithStale); // unchanged; cleanly excluded
    }

    function test_feeTooHighReverts() public {
        vm.expectRevert(FractionPayVault.FeeTooHigh.selector);
        vault.setFeeBps(201);
        vault.setFeeBps(100);
        assertEq(vault.feeBps(), 100);
    }
}
