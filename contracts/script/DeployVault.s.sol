// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {FractionPayVault} from "../src/FractionPayVault.sol";
import {MockStable} from "../src/MockStable.sol";
import {MockRWA} from "../src/MockRWA.sol";
import {YieldAggregator} from "../src/YieldAggregator.sol";
import {MockAggregator} from "../src/MockAggregator.sol";
import {PropertyToken} from "../src/PropertyToken.sol";
import {RWAMarket} from "../src/RWAMarket.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// Deploys the FractionPay v2 vault stack to Arc:
///   USDC + EURC stables, 3 yield-accruing RWAs (T-bill/gold/REIT), the
///   ERC-4626 vault seeded with USDC + EURC liquidity, and a buyer portfolio.
///
/// forge script script/DeployVault.s.sol --rpc-url $ARC --broadcast --private-key $PK
contract DeployVault is Script {
    address constant BUYER = 0x45763cE2De66E3261278228aA998AAC917FA14E1;
    address constant TREASURY = 0x69C4b79F998e92267f116f12A3D9764ac77b8F30; // protocol treasury

    function run() external {
        vm.startBroadcast();

        MockStable usdc = new MockStable("Mock USDC", "USDC");
        MockStable eurc = new MockStable("Mock EURC", "EURC");

        FractionPayVault vault = new FractionPayVault(IERC20(address(usdc)));

        // Yield-accruing RWAs: token + feed (8-dec USD, grows at APY).
        MockRWA tbill = new MockRWA("US T-Bill 3M", "TBILL", 450);
        YieldAggregator tbillFeed = new YieldAggregator(100_00000000, 450, "TBILL/USD");
        vault.registerRWA(address(tbill), address(tbillFeed), 450);

        MockRWA gold = new MockRWA("Tokenized Gold oz", "XAUM", 0);
        YieldAggregator goldFeed = new YieldAggregator(2400_00000000, 0, "XAUM/USD");
        vault.registerRWA(address(gold), address(goldFeed), 0);

        MockRWA reit = new MockRWA("Manhattan REIT", "MREIT", 610);
        YieldAggregator reitFeed = new YieldAggregator(50_00000000, 610, "MREIT/USD");
        vault.registerRWA(address(reit), address(reitFeed), 610);

        MockRWA bond = new MockRWA("Apple 2030 Corp Bond", "AAPL30", 520);
        YieldAggregator bondFeed = new YieldAggregator(98_00000000, 520, "AAPL30/USD"); // $98
        vault.registerRWA(address(bond), address(bondFeed), 520);

        MockRWA fund = new MockRWA("Tokenized Money Market Fund", "MMF", 480);
        YieldAggregator fundFeed = new YieldAggregator(10_00000000, 480, "MMF/USD"); // $10
        vault.registerRWA(address(fund), address(fundFeed), 480);

        // EURC as a second settlement currency (FX via feed, ~$1.08).
        MockAggregator eurcFeed = new MockAggregator(108_000000, "EURC/USD");
        vault.registerStable(address(eurc), address(eurcFeed));

        // Seed vault liquidity: 50k USDC (LP) + 25k EURC reserve.
        usdc.mint(msg.sender, 50_000e6);
        usdc.approve(address(vault), 50_000e6);
        vault.deposit(50_000e6, msg.sender);
        eurc.mint(address(vault), 25_000e6);

        // Buyer portfolio: $50k T-bill, $30k gold, $120k REIT.
        tbill.mint(BUYER, 500e18);
        gold.mint(BUYER, 12.5e18);
        reit.mint(BUYER, 2400e18);

        // --- Tokenized property (full RWA lifecycle: issue -> dividends -> spend) ---
        PropertyToken prop = new PropertyToken(
            "Manhattan Office Tower", "MNHTN", IERC20(address(usdc)), "350 5th Ave, New York, NY", 10_000_000e6, 600
        );
        YieldAggregator propFeed = new YieldAggregator(1000_00000000, 0, "MNHTN/USD"); // flat $1,000/share
        vault.registerRWA(address(prop), address(propFeed), 600); // spendable; 6% yield (preserve it)
        prop.issueShares(BUYER, 100e18); // primary distribution: $100k of the tower to the investor
        // Seed issuer USDC to run a demo quarterly dividend distribution from the app.
        usdc.mint(msg.sender, 100_000e6);
        usdc.approve(address(prop), type(uint256).max);

        // --- Primary market: list tokenized RWAs so users can invest (buy shares) ---
        RWAMarket market = new RWAMarket(IERC20(address(usdc)), TREASURY);
        market.list(address(tbill), address(tbillFeed), 450, "treasury", "US T-Bill 3M");
        market.list(address(gold), address(goldFeed), 0, "commodity", "Tokenized Gold");
        market.list(address(reit), address(reitFeed), 610, "real-estate", "Manhattan REIT");
        market.list(address(bond), address(bondFeed), 520, "bond", "Apple 2030 Corp Bond");
        market.list(address(fund), address(fundFeed), 480, "fund", "Money Market Fund");
        // Seed the investor with USDC to buy into the marketplace.
        usdc.mint(BUYER, 50_000e6);

        vm.stopBroadcast();

        console.log("=== FractionPay v2 (vault) ===");
        console.log("chainid:     ", block.chainid);
        console.log("USDC:        ", address(usdc));
        console.log("EURC:        ", address(eurc));
        console.log("Vault:       ", address(vault));
        console.log("TBILL:       ", address(tbill), " feed:", address(tbillFeed));
        console.log("XAUM:        ", address(gold), " feed:", address(goldFeed));
        console.log("MREIT:       ", address(reit), " feed:", address(reitFeed));
        console.log("EURC feed:   ", address(eurcFeed));
        console.log("AAPL30:      ", address(bond), " feed:", address(bondFeed));
        console.log("MMF:         ", address(fund), " feed:", address(fundFeed));
        console.log("PROPERTY(MNHTN):", address(prop), " feed:", address(propFeed));
        console.log("MARKET:      ", address(market));
    }
}
