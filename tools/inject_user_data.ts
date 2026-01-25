import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import prisma from '../src/lib/prisma';
import { TradeStatus } from '../src/generated/prisma/client';

type JsonValue = string | number | boolean | JsonValue[] | { [key: string]: JsonValue };

type UserRow = {
  id: string;
  primary_eth_address?: string | null;
};

type Templates = {
  tradeActivities: any[];
};

const DEFAULT_USER_ID = 'cmksadeto0000l0a3qi47rj3y';
const TRADES_PER_USER = parseInt(process.env.MOCK_TRADES_PER_USER || '50', 10);
const START_DAYS_AGO = parseInt(process.env.MOCK_START_DAYS_AGO || '60', 10);
const OPEN_RATE = Number.parseFloat(process.env.MOCK_OPEN_RATE || '0.2');

function readJsonFile<T>(relativePath: string): T {
  const filePath = path.resolve(__dirname, relativePath);
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw) as T;
}

function parseJsonField(value: unknown): JsonValue | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))
    ) {
      try {
        return JSON.parse(trimmed) as JsonValue;
      } catch {
        return value as JsonValue;
      }
    }
  }
  return value as JsonValue;
}

function parseJsonRequired(value: unknown, fieldName: string): JsonValue {
  const parsed = parseJsonField(value);
  if (parsed === undefined) {
    throw new Error(`[mock] Missing required JSON: ${fieldName}`);
  }
  return parsed;
}

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomHex(bytes: number): string {
  return crypto.randomBytes(bytes).toString('hex');
}

function randomAddress(): string {
  return `0x${randomHex(20)}`;
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function jitterNumber(base: number, pct: number, min?: number, max?: number): number {
  const scale = Math.max(Math.abs(base), 1);
  const next = base + randomFloat(-pct, pct) * scale;
  if (min !== undefined && next < min) {
    return min;
  }
  if (max !== undefined && next > max) {
    return max;
  }
  return next;
}

function randomUtcDateWithin(daysAgo: number): Date {
  const now = new Date();
  const start = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  const time = randomInt(start.getTime(), now.getTime());
  return new Date(time);
}

function decimalString(value: number, digits: number): string {
  return value.toFixed(digits);
}

function buildUserIds(users: UserRow[]): string[] {
  const envIds = (process.env.MOCK_USER_IDS || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
  if (envIds.length > 0) {
    return envIds;
  }
  if (users.length > 0) {
    return users.map((user) => user.id);
  }
  return [DEFAULT_USER_ID];
}

function loadTemplates(): Templates {
  const tradeActivitiesJson = readJsonFile<{ trade_activities: any[] }>('trade_activities.json');
  return {
    tradeActivities: tradeActivitiesJson.trade_activities,
  };
}

function loadUsers(): UserRow[] {
  try {
    const usersJson = readJsonFile<{ users: UserRow[] }>('users.json');
    return usersJson.users || [];
  } catch {
    return [];
  }
}

function buildUserAddressMap(users: UserRow[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const user of users) {
    if (user.primary_eth_address) {
      map.set(user.id, user.primary_eth_address);
    }
  }
  return map;
}

function createTradeActivities(userId: string, templates: any[], buyerAddress?: string) {
  const rows = [];
  const buyer = buyerAddress || randomAddress();
  const statusPool: TradeStatus[] = [TradeStatus.SETTLED, TradeStatus.EXPIRED];

  for (let i = 0; i < TRADES_PER_USER; i += 1) {
    const template = pick(templates);
    const isOpen = Math.random() < OPEN_RATE;
    const entryTimestamp = randomUtcDateWithin(START_DAYS_AGO);
    const expiryTimestamp = new Date(entryTimestamp.getTime() + randomInt(1, 7) * 24 * 60 * 60 * 1000);
    const closeTimestamp = isOpen
      ? undefined
      : new Date(expiryTimestamp.getTime() + randomInt(1, 6) * 60 * 60 * 1000);

    const entryBlockBase = Math.max(1, Math.round(toNumber(template.entry_block, 40000000)));
    const closeBlockBase = Math.max(entryBlockBase + 1, entryBlockBase + randomInt(1, 5000));

    // Generate accurate financials for consistent PnL
    const decimals = template.collateral_decimals ?? 6;
    const divisor = Math.pow(10, decimals);

    const basePremium = Math.max(1, Math.round(toNumber(template.entry_premium, 1_000_000)));
    const baseCollateral = Math.max(1, Math.round(toNumber(template.collateral_amount, 100_000_000)));
    
    // Vary values slightly
    const entryPremium = Math.round(jitterNumber(basePremium, 0.2, 1));
    const collateralAmount = Math.round(jitterNumber(baseCollateral, 0.2, 1));
    const entryFeePaid = String(Math.round(entryPremium * 0.01)); // 1% fee estimate
    const numContracts = String(Math.round(jitterNumber(toNumber(template.num_contracts, 1000), 0.5, 1)));

    let status: TradeStatus;
    let payoutBuyer = '0';
    let collateralReturnedSeller = String(collateralAmount);

    // Results containers
    let pnl: string | undefined = undefined;
    let roiPercent: string | undefined = undefined;

    if (isOpen) {
      status = TradeStatus.OPEN;
    } else {
      // Decide outcome mathematically
      const isWin = Math.random() > 0.5; // 50% chance win
      status = isWin ? TradeStatus.SETTLED : TradeStatus.EXPIRED;
      
      let rawPayout = 0;

      if (status === TradeStatus.SETTLED) {
          // WIN: Payout > Premium to be a "Win" in profit terms
          const profitMulti = randomFloat(1.1, 3.0);
          rawPayout = Math.round(entryPremium * profitMulti);
          
          // Cap payout to collateral amount (max payout in covered calls/puts)
          rawPayout = Math.min(rawPayout, collateralAmount);
          
          payoutBuyer = String(rawPayout);
          collateralReturnedSeller = String(collateralAmount - rawPayout);
      } else {
          // EXPIRED/LOSS
          payoutBuyer = '0';
          rawPayout = 0;
          collateralReturnedSeller = String(collateralAmount);
      }

      // Compute Analytics Data Fields
      // PnL = (Payout - Premium) / Multiplier
      const valPremium = entryPremium / divisor;
      const valPayout = rawPayout / divisor;
      const valPnL = valPayout - valPremium;
      pnl = decimalString(valPnL, 8);

      // ROI % = ((Payout - Premium) / Premium) * 100
      // Avoid division by zero
      if (entryPremium > 0) {
          const valRoi = ((rawPayout - entryPremium) / entryPremium) * 100;
          roiPercent = decimalString(valRoi, 2);
      } else {
          roiPercent = '0.00';
      }
    }

    const trade: any = {
      id: crypto.randomUUID(),
      userId,
      optionAddress: template.option_address || randomAddress(),
      txHash: `0x${randomHex(32)}`,
      status,
      underlyingAsset: template.underlying_asset || 'BTC',
      optionType: template.option_type || 'CALL_BASIC',
      optionTypeRaw: template.option_type_raw ?? 257,
      isCall: template.is_call ?? true,
      isLong: template.is_long ?? true,
      strikes: parseJsonRequired(template.strikes, 'trade_activities.strikes'),
      expiryTimestamp,
      buyer,
      seller: template.seller || randomAddress(),
      collateralToken: template.collateral_token || randomAddress(),
      collateralSymbol: template.collateral_symbol || 'USDC',
      collateralDecimals: decimals,
      
      entryPremium: String(entryPremium),
      entryFeePaid,
      numContracts,
      collateralAmount: String(collateralAmount),
      
      entryTimestamp,
      entryBlock: Math.round(jitterNumber(entryBlockBase, 0.02, 1)),
      
      createdAt: entryTimestamp,
      updatedAt: closeTimestamp || entryTimestamp,
      normalizedVolume: decimalString(Number(collateralAmount) / divisor, 8), 
      pnl,
      roiPercent,
    };

    if (!isOpen) {
        trade.closeTimestamp = closeTimestamp;
        trade.closeTxHash = `0x${randomHex(32)}`;
        trade.closeBlock = Math.round(jitterNumber(closeBlockBase, 0.02, entryBlockBase + 1));
        trade.settlementPrice = template.settlement_price;
        trade.payoutBuyer = payoutBuyer;
        trade.collateralReturnedSeller = collateralReturnedSeller;
        trade.exercised = true;
    }

    rows.push(trade);
  }

  return rows;
}

async function main() {
  const templates = loadTemplates();
  const users = loadUsers();
  const userAddressMap = buildUserAddressMap(users);
  const userIds = buildUserIds(users);

  if (templates.tradeActivities.length === 0) {
    throw new Error('[mock] Template files are empty.');
  }

  console.log('[mock] users:', userIds.length);
  console.log('[mock] trades per user:', TRADES_PER_USER);

  const tradeActivitiesData = [];

  for (const userId of userIds) {
    tradeActivitiesData.push(
      ...createTradeActivities(userId, templates.tradeActivities, userAddressMap.get(userId))
    );
  }

  // NOTE: We only inject TradeActivity now.
  // UserStats and UserDailyStats are removed because backend calculates them on-the-fly 
  // from TradeActivity, ensuring SSOT (Single Source of Truth).
  
  if (tradeActivitiesData.length > 0) {
    await prisma.tradeActivity.createMany({ data: tradeActivitiesData, skipDuplicates: true });
    console.log(`[mock] Inserted ${tradeActivitiesData.length} trade activities.`);
  }

  console.log('[mock] done');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
