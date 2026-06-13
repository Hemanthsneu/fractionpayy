import { parseAbi } from "viem";

/** FractionPay v2 — ERC-4626 yield-bearing vault + multi-stablecoin payment engine. */
export const vaultAbi = parseAbi([
  "function quote(address rwaToken, uint256 rwaAmount, address payToken) view returns (uint256 payOut, uint256 usdValue, uint256 feeUsd)",
  "function pay(address merchant, address rwaToken, uint256 rwaAmount, address payToken, uint256 minOut) returns (uint256 id, uint256 payOut)",
  "function rwaUsdValue(address token, uint256 amount) view returns (uint256)",
  "function totalAssets() view returns (uint256)",
  "function pricePerShare() view returns (uint256)",
  "function totalFeesUsd() view returns (uint256)",
  "function totalYieldPreservedUsd() view returns (uint256)",
  "function feeBps() view returns (uint16)",
  "function paymentsCount() view returns (uint256)",
  "function registerRWA(address token, address feed, uint16 apyBps)",
  "event Settled(uint256 indexed id, address indexed payer, address indexed merchant, address rwaToken, uint256 rwaAmount, address payToken, uint256 payOut, uint256 usdValue, uint256 feeUsd, uint256 yieldPreservedPerYearUsd)",
]);

/** RWAMarket — primary market: invest USDC -> mint RWA shares. */
export const marketAbi = parseAbi([
  "function pricePerShareUsd(address token) view returns (uint256)",
  "function quoteShares(address token, uint256 usdcAmount) view returns (uint256)",
  "function invest(address token, uint256 usdcAmount) returns (uint256 shares)",
  "function list(address token, address feed, uint16 apyBps, string assetType, string name)",
  "function assetCount() view returns (uint256)",
  "function treasury() view returns (address)",
  "event Invested(address indexed investor, address indexed token, uint256 usdcIn, uint256 shares)",
  "event Listed(address indexed token, string assetType, string name, address feed, uint16 apyBps)",
]);

/** PropertyToken — tokenized real estate with stablecoin dividends. */
export const propertyTokenAbi = parseAbi([
  "function propertyAddress() view returns (string)",
  "function valuationUsd() view returns (uint256)",
  "function annualYieldBps() view returns (uint16)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function totalDividendsDistributed() view returns (uint256)",
  "function distributionCount() view returns (uint32)",
  "function lastDistributionAt() view returns (uint64)",
  "function withdrawableDividendOf(address account) view returns (uint256)",
  "function distributeDividends(uint256 amount)",
  "function claimDividend() returns (uint256 amount)",
  "function issueShares(address investor, uint256 shares)",
  "event DividendsDistributed(uint256 indexed round, uint256 amount, uint256 perShareMagnified)",
  "event DividendClaimed(address indexed holder, uint256 amount)",
]);

export const erc20Abi = parseAbi([
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function mint(address to, uint256 amount)",
]);

export const aggregatorAbi = parseAbi([
  "function latestRoundData() view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)",
  "function decimals() view returns (uint8)",
  "function description() view returns (string)",
]);

export const erc8004IdentityAbi = parseAbi([
  "function register(string agentURI) returns (uint256 agentId)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "event Registered(uint256 indexed agentId, string agentURI, address indexed owner)",
]);

export const erc8004ReputationAbi = parseAbi([
  "function giveFeedback(uint256 agentId, int128 value, uint8 valueDecimals, string tag1, string tag2, string endpoint, string feedbackURI, bytes32 feedbackHash)",
]);

/** ERC-8004 registries (verified on-chain 2026-06-12). Same addresses on both Sepolias. */
export const ERC8004 = {
  identity: {
    mainnet: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
    baseSepolia: "0x8004A818BFB912233c491871b3d84c89A494BD9e",
    ethereumSepolia: "0x8004A818BFB912233c491871b3d84c89A494BD9e",
  },
  reputation: {
    mainnet: "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63",
    baseSepolia: "0x8004B663056A597Dffe9eCcC1965A193B7388713",
    ethereumSepolia: "0x8004B663056A597Dffe9eCcC1965A193B7388713",
  },
} as const;
