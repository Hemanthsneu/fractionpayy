// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {PropertyToken} from "../src/PropertyToken.sol";
import {MockStable} from "../src/MockStable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract PropertyTokenTest is Test {
    PropertyToken prop;
    MockStable usdc;

    address issuer = address(this);
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address carol = makeAddr("carol");

    function setUp() public {
        usdc = new MockStable("Mock USDC", "USDC");
        prop = new PropertyToken(
            "Manhattan Office Tower", "MNHTN", IERC20(address(usdc)), "350 5th Ave, NYC", 10_000_000e6, 600
        );
        // 10,000 shares total: alice 6,000, bob 4,000.
        prop.issueShares(alice, 6_000e18);
        prop.issueShares(bob, 4_000e18);
        // Issuer holds USDC to pay rent dividends.
        usdc.mint(issuer, 1_000_000e6);
        usdc.approve(address(prop), type(uint256).max);
    }

    // dividend amounts carry <=1 wei ($0.000001) integer-division dust by design.
    uint256 constant DUST = 10;

    function test_proRataDistribution() public {
        prop.distributeDividends(100_000e6); // $100k rent
        assertApproxEqAbs(prop.withdrawableDividendOf(alice), 60_000e6, DUST); // 60%
        assertApproxEqAbs(prop.withdrawableDividendOf(bob), 40_000e6, DUST); // 40%
    }

    function test_claimTransfersUsdc() public {
        prop.distributeDividends(100_000e6);
        vm.prank(alice);
        uint256 got = prop.claimDividend();
        assertApproxEqAbs(got, 60_000e6, DUST);
        assertApproxEqAbs(usdc.balanceOf(alice), 60_000e6, DUST);
        assertEq(prop.withdrawableDividendOf(alice), 0); // can't double-claim
    }

    function test_cannotDoubleClaim() public {
        prop.distributeDividends(100_000e6);
        vm.startPrank(alice);
        prop.claimDividend();
        vm.expectRevert(PropertyToken.NothingToClaim.selector);
        prop.claimDividend();
        vm.stopPrank();
    }

    function test_multipleDistributionsAccumulate() public {
        prop.distributeDividends(100_000e6);
        prop.distributeDividends(50_000e6);
        assertApproxEqAbs(prop.withdrawableDividendOf(alice), 90_000e6, DUST); // 60% of 150k
        assertApproxEqAbs(prop.withdrawableDividendOf(bob), 60_000e6, DUST); // 40% of 150k
    }

    /// The hard case: a transfer BETWEEN distributions must not let the
    /// recipient claim the earlier distribution, nor dilute the sender's credit.
    function test_transferBetweenDistributions() public {
        prop.distributeDividends(100_000e6); // alice 60k, bob 40k credited
        // alice sends 6,000 shares to carol (alice -> 0, carol -> 6,000)
        vm.prank(alice);
        prop.transfer(carol, 6_000e18);
        // carol must NOT inherit alice's 60k from the first round.
        assertEq(prop.withdrawableDividendOf(carol), 0);
        assertApproxEqAbs(prop.withdrawableDividendOf(alice), 60_000e6, DUST); // alice keeps round-1 credit

        prop.distributeDividends(100_000e6); // now carol 60%, bob 40%
        assertApproxEqAbs(prop.withdrawableDividendOf(carol), 60_000e6, DUST); // round-2 only
        assertApproxEqAbs(prop.withdrawableDividendOf(alice), 60_000e6, DUST); // unchanged (no shares now)
        assertApproxEqAbs(prop.withdrawableDividendOf(bob), 80_000e6, DUST); // 40k + 40k
    }

    function test_newSharesDontClaimPastDividends() public {
        prop.distributeDividends(100_000e6);
        prop.issueShares(carol, 10_000e18); // minted AFTER round 1
        assertEq(prop.withdrawableDividendOf(carol), 0); // no claim on past
        // total supply now 20,000; next round splits accordingly
        prop.distributeDividends(200_000e6);
        assertApproxEqAbs(prop.withdrawableDividendOf(carol), 100_000e6, DUST); // 50% of round 2
    }

    function test_revert_distributeWithNoSupply() public {
        PropertyToken empty =
            new PropertyToken("Empty", "EMT", IERC20(address(usdc)), "nowhere", 0, 0);
        vm.expectRevert(PropertyToken.NoShares.selector);
        empty.distributeDividends(1e6);
    }

    function test_conservation_allClaimsLeqDistributed() public {
        prop.distributeDividends(100_000e6);
        prop.distributeDividends(33_333e6); // odd amount → dust
        vm.prank(alice);
        uint256 a = prop.claimDividend();
        vm.prank(bob);
        uint256 b = prop.claimDividend();
        // Sum of claims never exceeds what was distributed (dust stays locked).
        assertLe(a + b, 133_333e6);
        assertApproxEqAbs(a + b, 133_333e6, 10); // negligible dust
    }

    function test_onlyOwnerIssues() public {
        vm.prank(alice);
        vm.expectRevert();
        prop.issueShares(alice, 1e18);
    }

    function test_metadata() public view {
        assertEq(prop.valuationUsd(), 10_000_000e6);
        assertEq(prop.annualYieldBps(), 600);
    }
}
