import { Request, Response } from 'express';
import { env } from '../config/env';
import { configService } from '../services/configService';
import { CONTRACTS, OPTION_BOOK_ABI, ERC20_ABI } from '../config/thetanutsConfig';
import { ThetanutsApiError, ErrorCodes, createErrorResponse } from '../lib/errors';
import { 
  calculateMaxPayout, 
  calculatePayoutAtPrice, 
  getOptionTypeLabel,
  calculateBreakeven 
} from '../lib/payoutCalculator';

// Position type from Thetanuts API
interface ThetanutsPosition {
  address: string;
  status: string;
  buyer: string;
  seller: string;
  referrer: string;
  createdBy: string;
  entryTimestamp: number;
  entryTxHash: string;
  entryPremium: string;
  entryFeePaid: string;
  collateralToken: string;
  collateralSymbol: string;
  collateralDecimals: number;
  underlyingAsset: string;
  priceFeed: string;
  strikes: string[];
  expiryTimestamp: number;
  numContracts: string;
  collateralAmount: string;
  optionType: number;
  settlement: {
    settlementPrice: string;
    payoutBuyer: string;
    payoutSeller: string;
  } | null;
  explicitClose: unknown | null;
}

export const nutsController = {
  /**
   * GET /nuts/config
   * Get Thetanuts configuration for frontend
   */
  getConfig: async (_req: Request, res: Response) => {
    try {
      res.status(200).json({
        success: true,
        data: {
          referrer: await configService.get('ALPHABIT_REFERRER_ADDRESS'),
          contracts: CONTRACTS,
          abi: {
            optionBook: OPTION_BOOK_ABI,
            erc20: ERC20_ABI,
          },
          urls: {
            indexer: await configService.get('THETANUTS_INDEXER_URL'),
            orders: env.THETANUTS_ORDERS_URL,
          },
        },
      });
    } catch (error) {
      console.error('[NutsController] getConfig error:', error);
      res.status(500).json(createErrorResponse(
        ErrorCodes.INTERNAL_ERROR,
        'Failed to get configuration'
      ));
    }
  },

  /**
   * GET /nuts/orders
   * Proxy to external orders API
   */
  getOrders: async (_req: Request, res: Response) => {
    try {
      const response = await fetch(env.THETANUTS_ORDERS_URL);
      
      if (!response.ok) {
        throw new ThetanutsApiError(
          `Thetanuts API error: ${response.status}`,
          502,
          ErrorCodes.EXTERNAL_API_ERROR
        );
      }

      const data = await response.json();
      res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('[NutsController] getOrders error:', error);
      
      if (error instanceof ThetanutsApiError) {
        return res.status(error.statusCode).json(createErrorResponse(
          error.code as typeof ErrorCodes[keyof typeof ErrorCodes],
          error.message
        ));
      }

      res.status(500).json(createErrorResponse(
        ErrorCodes.FETCH_ORDERS_FAILED,
        'Failed to fetch orders from Thetanuts'
      ));
    }
  },

  /**
   * POST /nuts/positions
   * Get user positions, history, or all open positions
   * Supports optional referrer filtering
   */
  getPositions: async (req: Request, res: Response) => {
    try {
      const { address, type, filterByReferrer = false } = req.body;

      if (!type || !['open', 'history', 'all'].includes(type)) {
        return res.status(400).json(createErrorResponse(
          ErrorCodes.INVALID_TYPE,
          'Type must be "open", "history", or "all"'
        ));
      }

      let url: string;

        if (type === 'all') {
        if (address) {
          return res.status(400).json(createErrorResponse(
            ErrorCodes.INVALID_ADDRESS,
            'Address must be null or empty when type is "all"'
          ));
        }
        url = `${await configService.get('THETANUTS_INDEXER_URL')}/open-positions`;
      } else {
        if (!address) {
          return res.status(400).json(createErrorResponse(
            ErrorCodes.MISSING_REQUIRED_FIELD,
            'Address is required for type "open" or "history"'
          ));
        }
        const endpoint = type === 'open' ? 'positions' : 'history';
        url = `${await configService.get('THETANUTS_INDEXER_URL')}/user/${address}/${endpoint}`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new ThetanutsApiError(
          `Thetanuts API error: ${response.status}`,
          502,
          ErrorCodes.EXTERNAL_API_ERROR
        );
      }

      let data: ThetanutsPosition[] = await response.json();

      // Filter by Alphabit referrer if requested and referrer is configured
      const referrerAddress = await configService.get('ALPHABIT_REFERRER_ADDRESS');
      if (filterByReferrer && referrerAddress && Array.isArray(data)) {
        data = data.filter(
          (position) => 
            position.referrer?.toLowerCase() === referrerAddress.toLowerCase()
        );
      }

      res.status(200).json({ 
        success: true, 
        data,
        meta: {
          count: data.length,
          filteredByReferrer: filterByReferrer,
          referrer: filterByReferrer ? referrerAddress : undefined,
        },
      });
    } catch (error) {
      console.error('[NutsController] getPositions error:', error);
      
      if (error instanceof ThetanutsApiError) {
        return res.status(error.statusCode).json(createErrorResponse(
          error.code as typeof ErrorCodes[keyof typeof ErrorCodes],
          error.message
        ));
      }

      res.status(500).json(createErrorResponse(
        ErrorCodes.FETCH_POSITIONS_FAILED,
        'Failed to fetch positions from Thetanuts'
      ));
    }
  },

  /**
   * POST /nuts/update
   * Trigger sync after a trade
   */
  triggerUpdate: async (_req: Request, res: Response) => {
    try {
      const indexerUrl = await configService.get('THETANUTS_INDEXER_URL');
      const response = await fetch(`${indexerUrl}/update`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new ThetanutsApiError(
          `Thetanuts API error: ${response.status}`,
          502,
          ErrorCodes.EXTERNAL_API_ERROR
        );
      }

      const data = await response.json();
      res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('[NutsController] triggerUpdate error:', error);
      
      if (error instanceof ThetanutsApiError) {
        return res.status(error.statusCode).json(createErrorResponse(
          error.code as typeof ErrorCodes[keyof typeof ErrorCodes],
          error.message
        ));
      }

      res.status(500).json(createErrorResponse(
        ErrorCodes.FETCH_UPDATE_FAILED,
        'Failed to trigger update on Thetanuts'
      ));
    }
  },

  /**
   * GET /nuts/stats
   * Get statistics from Thetanuts
   */
  getStats: async (_req: Request, res: Response) => {
    try {
      const indexerUrl = await configService.get('THETANUTS_INDEXER_URL');
      const response = await fetch(`${indexerUrl}/stats`);
      
      if (!response.ok) {
        throw new ThetanutsApiError(
          `Thetanuts API error: ${response.status}`,
          502,
          ErrorCodes.EXTERNAL_API_ERROR
        );
      }

      const data = await response.json();
      res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('[NutsController] getStats error:', error);
      
      if (error instanceof ThetanutsApiError) {
        return res.status(error.statusCode).json(createErrorResponse(
          error.code as typeof ErrorCodes[keyof typeof ErrorCodes],
          error.message
        ));
      }

      res.status(500).json(createErrorResponse(
        ErrorCodes.FETCH_STATS_FAILED,
        'Failed to fetch stats from Thetanuts'
      ));
    }
  },

  /**
   * POST /nuts/payout/calculate
   * Calculate payout for an order
   */
  calculatePayout: async (req: Request, res: Response) => {
    try {
      const { strikes, isCall, price, numContracts, settlementPrice } = req.body;

      if (!strikes || !Array.isArray(strikes) || strikes.length < 2) {
        return res.status(400).json(createErrorResponse(
          ErrorCodes.MISSING_REQUIRED_FIELD,
          'strikes array is required with at least 2 values'
        ));
      }

      if (typeof isCall !== 'boolean') {
        return res.status(400).json(createErrorResponse(
          ErrorCodes.MISSING_REQUIRED_FIELD,
          'isCall boolean is required'
        ));
      }

      if (typeof numContracts !== 'number' || numContracts <= 0) {
        return res.status(400).json(createErrorResponse(
          ErrorCodes.MISSING_REQUIRED_FIELD,
          'numContracts must be a positive number'
        ));
      }

      const maxPayout = calculateMaxPayout(strikes, numContracts);
      const optionType = getOptionTypeLabel(strikes.length, isCall);
      
      let payoutAtPrice = null;
      if (typeof settlementPrice === 'number') {
        payoutAtPrice = calculatePayoutAtPrice(
          { strikes, isCall },
          numContracts,
          settlementPrice
        );
      }

      let breakeven = null;
      if (price && strikes.length === 2) {
        breakeven = calculateBreakeven(strikes, isCall, price, numContracts);
      }

      res.status(200).json({
        success: true,
        data: {
          maxPayout,
          payoutAtPrice,
          breakeven,
          optionType,
          strikesCount: strikes.length,
        },
      });
    } catch (error) {
      console.error('[NutsController] calculatePayout error:', error);
      res.status(500).json(createErrorResponse(
        ErrorCodes.INTERNAL_ERROR,
        'Failed to calculate payout'
      ));
    }
  },
};
