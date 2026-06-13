#!/bin/bash
# FractionPay — wallet balance dashboard. Run anytime: ./prep/check-balances.sh
export PATH="$HOME/.foundry/bin:$PATH"
BASE=https://sepolia.base.org
ARC=https://rpc.testnet.arc.network

declare -a WALLETS=(
  "buyer      0x45763cE2De66E3261278228aA998AAC917FA14E1"
  "coffeeshop 0x24f098DD3a7260DCcfdD9D74714289B9131DD745"
  "supplier   0xfb98F38B40751422356f5eEa6bBB663831fd5E04"
  "agent      0x69C4b79F998e92267f116f12A3D9764ac77b8F30"
  "metamask   0xce22e02b82a20bE9c59dc11161778469B2Bf7C26"
)

# Base Sepolia USDC (Circle): 0x036CbD53842c5426634e7929541eC2318f3dCF7e
USDC_BASE_SEPOLIA=0x036CbD53842c5426634e7929541eC2318f3dCF7e

printf "%-12s %-22s %-22s %-18s\n" "WALLET" "BaseSep ETH" "BaseSep USDC" "Arc native(USDC)"
printf "%.0s-" {1..76}; echo
for entry in "${WALLETS[@]}"; do
  name=$(echo "$entry" | awk '{print $1}')
  addr=$(echo "$entry" | awk '{print $2}')
  eth=$(cast balance "$addr" --rpc-url $BASE --ether 2>/dev/null || echo "?")
  usdc_raw=$(cast call $USDC_BASE_SEPOLIA "balanceOf(address)(uint256)" "$addr" --rpc-url $BASE 2>/dev/null | awk '{print $1}' || echo "0")
  usdc=$(echo "scale=2; ${usdc_raw:-0} / 1000000" | bc 2>/dev/null || echo "?")
  arc=$(cast balance "$addr" --rpc-url $ARC --ether 2>/dev/null || echo "?")
  printf "%-12s %-22s %-22s %-18s\n" "$name" "$eth" "$usdc" "$arc"
done
echo
echo "Explorers: https://sepolia.basescan.org/address/<addr>"
echo "           Arc testnet: see docs for explorer URL"
