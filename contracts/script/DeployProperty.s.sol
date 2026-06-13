// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {PropertyToken} from "../src/PropertyToken.sol";
import {YieldAggregator} from "../src/YieldAggregator.sol";
import {FractionPayVault} from "../src/FractionPayVault.sol";
import {MockStable} from "../src/MockStable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// Deploys the tokenized property (Manhattan office tower) and wires it into the
/// already-deployed FractionPayVault as a yield-bearing, spendable RWA.
///
/// Requires the v2 vault + USDC addresses from DeployVault.
/// forge script script/DeployProperty.s.sol --rpc-url $ARC --broadcast --private-key $PK
contract DeployProperty is Script {
    address constant BUYER = 0x45763cE2De66E3261278228aA998AAC917FA14E1; // investor + settlement wallet
    address constant VAULT = 0x81474BC97a075e47a718d901a11116C1e3CA4fA4;
    address constant USDC = 0xD85f3530aab65E0DB7EdE2e8d1E701dDbF049D20;

    function run() external {
        vm.startBroadcast();

        // $10M tower, 10,000 shares @ $1,000, 6% annual rent yield (paid as USDC dividends).
        PropertyToken prop = new PropertyToken(
            "Manhattan Office Tower", "MNHTN", IERC20(USDC), "350 5th Ave, New York, NY", 10_000_000e6, 600
        );
        // Price feed flat at $1,000/share (return comes via dividends, not price).
        YieldAggregator propFeed = new YieldAggregator(1000_00000000, 0, "MNHTN/USD");

        // Register as a spendable RWA in the vault; apyBps=600 so the optimizer
        // treats it as a high-yield asset to preserve (sells lower-yield first).
        FractionPayVault(VAULT).registerRWA(address(prop), address(propFeed), 600);

        // Primary distribution: issue 100 shares ($100k) of the tower to the investor.
        prop.issueShares(BUYER, 100e18);

        // Seed the issuer with USDC to run a demo quarterly dividend distribution.
        MockStable(USDC).mint(msg.sender, 100_000e6);
        MockStable(USDC).approve(address(prop), type(uint256).max);

        vm.stopBroadcast();

        console.log("=== Tokenized property ===");
        console.log("PropertyToken (MNHTN):", address(prop));
        console.log("Property feed:        ", address(propFeed));
        console.log("Issued to investor:   ", BUYER);
    }
}
