// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {FractionPay} from "../src/FractionPay.sol";
import {MockUSDC} from "../src/MockUSDC.sol";
import {MockRWA} from "../src/MockRWA.sol";
import {MockAggregator} from "../src/MockAggregator.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// Deploys the full FractionPay demo stack to any chain:
///   MockUSDC (settlement), 3 RWAs (T-bill / gold / REIT) each with a
///   Chainlink-compatible feed, FractionPay router seeded with liquidity,
///   buyer wallet funded with a $200k RWA portfolio.
///
/// Usage:
///   forge script script/Deploy.s.sol --rpc-url $RPC --broadcast \
///     --private-key $DEPLOYER_PRIVATE_KEY
contract Deploy is Script {
    address constant BUYER = 0x45763cE2De66E3261278228aA998AAC917FA14E1;

    function run() external {
        vm.startBroadcast();

        MockUSDC usdc = new MockUSDC();
        FractionPay pay = new FractionPay(IERC20(address(usdc)));

        // --- RWAs: token + feed (8-dec USD prices, Chainlink convention) ---
        MockRWA tbill = new MockRWA("US T-Bill 3M 2026", "TBILL", 450);
        MockAggregator tbillFeed = new MockAggregator(100_00000000, "TBILL / USD"); // $100
        pay.registerRWA(address(tbill), address(tbillFeed));

        MockRWA gold = new MockRWA("Tokenized Gold oz", "XAUM", 0);
        MockAggregator goldFeed = new MockAggregator(2400_00000000, "XAUM / USD"); // $2,400
        pay.registerRWA(address(gold), address(goldFeed));

        MockRWA reit = new MockRWA("Manhattan REIT Share", "MREIT", 610);
        MockAggregator reitFeed = new MockAggregator(50_00000000, "MREIT / USD"); // $50
        pay.registerRWA(address(reit), address(reitFeed));

        // --- Seed: $50k pool liquidity; buyer gets a $200k portfolio ---
        usdc.mint(msg.sender, 50_000e6);
        usdc.approve(address(pay), 50_000e6);
        pay.depositLiquidity(50_000e6);

        tbill.mint(BUYER, 500e18); //  $50,000 T-bills
        gold.mint(BUYER, 12.5e18); //  $30,000 gold
        reit.mint(BUYER, 2400e18); // $120,000 REIT

        vm.stopBroadcast();

        console.log("=== FractionPay deployment ===");
        console.log("chainid:            ", block.chainid);
        console.log("MockUSDC:           ", address(usdc));
        console.log("FractionPay:        ", address(pay));
        console.log("TBILL:              ", address(tbill));
        console.log("TBILL feed:         ", address(tbillFeed));
        console.log("XAUM:               ", address(gold));
        console.log("XAUM feed:          ", address(goldFeed));
        console.log("MREIT:              ", address(reit));
        console.log("MREIT feed:         ", address(reitFeed));
    }
}
