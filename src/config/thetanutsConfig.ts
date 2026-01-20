/**
 * Thetanuts V4 Configuration
 * Contains contract addresses, ABIs, and constants for Thetanuts integration
 */

// Base Mainnet (r10) - Current Deployment
export const THETANUTS_CHAIN_ID = 8453;

export const CONTRACTS = {
  chainId: THETANUTS_CHAIN_ID,
  optionBook: '0xd58b814C7Ce700f251722b5555e25aE0fa8169A1',
  deploymentBlock: 36596854,
  tokens: {
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    WETH: '0x4200000000000000000000000000000000000006',
    CBBTC: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
    aBasUSDC: '0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB',
    aBasWETH: '0xD4a0e0b9149BCee3C920d2E00b5dE09138fd8bb7',
    aBascbBTC: '0xBdb9300b7CDE636d9cD4AFF00f6F009fFBBc8EE6',
  },
  priceFeeds: {
    BTC: '0x64c911996D3c6aC71f9b455B1E8E7266BcbD848F',
    ETH: '0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70',
  },
  implementations: {
    CALL_SPREAD: '0x2Db5aFA04aeE616157Beb53b96612947b3d13eE3',
    PUT_SPREAD: '0x571471B2f823cC6B5683FC99ac6781209BC85F55',
    CALL_BUTTERFLY: '0xb727690FDD4Bb0ff74f2f0CC3E68297850A634c5',
    PUT_BUTTERFLY: '0x78b02119007F9EFc2297A9738b9a47A3bc3c2777',
    CALL_CONDOR: '0x7D3C622852d71B932D0903F973cafF45BCdBa4F1',
    PUT_CONDOR: '0x5cc960B56049b6f850730FacB4F3EB45417c7679',
    IRON_CONDOR: '0xb200253b68Fbf18f31D813AECEf97be3A6246b79',
  },
};

/**
 * Minimal OptionBook ABI for fillOrder and fees
 */
export const OPTION_BOOK_ABI = [
  {
    inputs: [
      {
        components: [
          { internalType: 'address', name: 'maker', type: 'address' },
          { internalType: 'uint256', name: 'orderExpiryTimestamp', type: 'uint256' },
          { internalType: 'address', name: 'collateral', type: 'address' },
          { internalType: 'bool', name: 'isCall', type: 'bool' },
          { internalType: 'address', name: 'priceFeed', type: 'address' },
          { internalType: 'address', name: 'implementation', type: 'address' },
          { internalType: 'bool', name: 'isLong', type: 'bool' },
          { internalType: 'uint256', name: 'maxCollateralUsable', type: 'uint256' },
          { internalType: 'uint256[]', name: 'strikes', type: 'uint256[]' },
          { internalType: 'uint256', name: 'expiry', type: 'uint256' },
          { internalType: 'uint256', name: 'price', type: 'uint256' },
          { internalType: 'uint256', name: 'numContracts', type: 'uint256' },
          { internalType: 'bytes', name: 'extraOptionData', type: 'bytes' },
        ],
        internalType: 'struct OptionBook.Order',
        name: 'order',
        type: 'tuple',
      },
      { internalType: 'bytes', name: 'signature', type: 'bytes' },
      { internalType: 'address', name: 'referrer', type: 'address' },
    ],
    name: 'fillOrder',
    outputs: [{ internalType: 'address', name: 'optionAddress', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'token', type: 'address' },
      { internalType: 'address', name: 'referrer', type: 'address' },
    ],
    name: 'fees',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'token', type: 'address' }],
    name: 'claimFees',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

/**
 * Minimal ERC20 ABI for approve and allowance
 */
export const ERC20_ABI = [
  {
    inputs: [
      { internalType: 'address', name: 'spender', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'address', name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
];

/**
 * Get option type label from strikes count
 */
export function getOptionStructureType(strikesCount: number): string {
  switch (strikesCount) {
    case 2:
      return 'SPREAD';
    case 3:
      return 'BUTTERFLY';
    case 4:
      return 'CONDOR';
    default:
      return 'UNKNOWN';
  }
}

/**
 * Get implementation address from option type
 */
export function getImplementationAddress(
  strikesCount: number,
  isCall: boolean,
  isIronCondor: boolean = false
): string | null {
  if (strikesCount === 2) {
    return isCall ? CONTRACTS.implementations.CALL_SPREAD : CONTRACTS.implementations.PUT_SPREAD;
  }
  if (strikesCount === 3) {
    return isCall ? CONTRACTS.implementations.CALL_BUTTERFLY : CONTRACTS.implementations.PUT_BUTTERFLY;
  }
  if (strikesCount === 4) {
    if (isIronCondor) return CONTRACTS.implementations.IRON_CONDOR;
    return isCall ? CONTRACTS.implementations.CALL_CONDOR : CONTRACTS.implementations.PUT_CONDOR;
  }
  return null;
}
