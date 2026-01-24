/**
 * Payout calculation helpers for Thetanuts options
 */

interface OrderParams {
  strikes: string[];  // Array of strike prices (8 decimals)
  isCall: boolean;
  price?: string;     // Premium price (8 decimals)
}

/**
 * Calculate max payout for bounded structures
 * Max Payout = Strike Width × Number of Contracts
 */
export function calculateMaxPayout(strikes: string[], numContracts: number): number {
  const parsedStrikes = strikes.map(s => Number(s) / 1e8);
  
  let strikeWidth: number;
  
  switch (parsedStrikes.length) {
    case 2: // Spread
      strikeWidth = Math.abs(parsedStrikes[1] - parsedStrikes[0]);
      break;
    case 3: // Butterfly
      strikeWidth = parsedStrikes[1] - parsedStrikes[0]; // symmetric
      break;
    case 4: // Condor
      strikeWidth = parsedStrikes[1] - parsedStrikes[0]; // simplified
      break;
    default:
      return 0;
  }
  
  return strikeWidth * numContracts;
}

/**
 * Calculate payout at a given settlement price
 */
export function calculatePayoutAtPrice(
  order: OrderParams, 
  numContracts: number, 
  settlementPrice: number
): number {
  const K = order.strikes.map(s => Number(s) / 1e8);
  const S = settlementPrice;
  const isCall = order.isCall;

  // Spreads (2 strikes)
  if (K.length === 2) {
    const [L, U] = K;
    if (isCall) {
      if (S <= L) return 0;
      if (S >= U) return (U - L) * numContracts;
      return (S - L) * numContracts;
    } else {
      if (S >= U) return 0;
      if (S <= L) return (U - L) * numContracts;
      return (U - S) * numContracts;
    }
  }

  // Butterflies (3 strikes)
  if (K.length === 3) {
    const [L, M, U] = K;
    const w = M - L;
    if (S <= L || S >= U) return 0;
    if (S === M) return w * numContracts;
    return S < M 
      ? ((S - L) / w) * w * numContracts 
      : ((U - S) / w) * w * numContracts;
  }

  // Condors (4 strikes)
  if (K.length === 4) {
    const [K1, K2, K3, K4] = K;
    const max = (K2 - K1) * numContracts;
    if (S <= K1 || S >= K4) return 0;
    if (S >= K2 && S <= K3) return max;
    if (S < K2) return ((S - K1) / (K2 - K1)) * max;
    return ((K4 - S) / (K4 - K3)) * max;
  }

  return 0;
}

/**
 * Get option type label from strikes count and direction
 */
export function getOptionTypeLabel(strikesCount: number, isCall: boolean): string {
  const direction = isCall ? 'CALL' : 'PUT';
  switch (strikesCount) {
    case 1: return `${direction}_BASIC`;
    case 2: return `${direction}_SPREAD`;
    case 3: return `${direction}_BUTTERFLY`;
    case 4: return `${direction}_CONDOR`;
    default: return `UNKNOWN_${strikesCount}`;
  }
}

/**
 * Calculate break-even price for spreads
 */
export function calculateBreakeven(
  strikes: string[], 
  isCall: boolean,
  price: string,
  numContracts: number
): number | null {
  if (strikes.length !== 2) return null;
  
  const [lowerStrike, upperStrike] = strikes.map(s => Number(s) / 1e8);
  const premium = Number(price) / 1e8;
  const totalPremium = premium * numContracts;

  if (isCall) {
    return lowerStrike + totalPremium / numContracts;
  } else {
    return upperStrike - totalPremium / numContracts;
  }
}

/**
 * Parse strikes from raw format to human readable
 */
export function parseStrikes(strikes: string[]): number[] {
  return strikes.map(s => Number(s) / 1e8);
}

/**
 * Format strike price for display
 */
export function formatStrikePrice(strike: string | number): string {
  const value = typeof strike === 'string' ? Number(strike) / 1e8 : strike;
  return value.toLocaleString('en-US', { 
    style: 'currency', 
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}
