import { Request, Response } from 'express';

const BASE_URL = 'https://optionbook-indexer.thetanuts.finance/api/v1';

export const nutsController = {
  /**
   * GET /nuts/orders
   * Proxy to external orders API
   */
  getOrders: async (req: Request, res: Response) => {
    try {
      const response = await fetch('https://round-snowflake-9c31.devops-118.workers.dev/');
      
      if (!response.ok) {
        throw new Error(`External API responded with ${response.status}`);
      }

      const data = await response.json();
      res.status(200).json(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch orders from external provider' 
      });
    }
  },

  /**
   * POST /nuts/positions
   * Get user positions, history, or all open positions
   */
  getPositions: async (req: Request, res: Response) => {
    try {
      const { address, type } = req.body;

      if (!type || !['open', 'history', 'all'].includes(type)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Type must be "open", "history", or "all"' 
        });
      }

      let url: string;

      if (type === 'all') {
        if (address) {
          return res.status(400).json({ 
            success: false, 
            message: 'Address must be null or empty when type is "all"' 
          });
        }
        url = `${BASE_URL}/open-positions`;
      } else {
        if (!address) {
          return res.status(400).json({ 
            success: false, 
            message: 'Address is required for type "open" or "history"' 
          });
        }
        const endpoint = type === 'open' ? 'positions' : 'history';
        url = `${BASE_URL}/user/${address}/${endpoint}`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`External API responded with ${response.status}`);
      }

      const data = await response.json();
      res.status(200).json(data);
    } catch (error) {
      console.error('Error fetching positions:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch positions from external provider' 
      });
    }
  },

  /**
   * GET /nuts/update
   * Get update info from Thetanuts
   */
  getUpdate: async (req: Request, res: Response) => {
    try {
      const response = await fetch(`${BASE_URL}/update`);
      
      if (!response.ok) {
        throw new Error(`External API responded with ${response.status}`);
      }

      const data = await response.json();
      res.status(200).json(data);
    } catch (error) {
      console.error('Error fetching update:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch update from Thetanuts' 
      });
    }
  },

  /**
   * GET /nuts/stats
   * Get statistics from Thetanuts
   */
  getStats: async (req: Request, res: Response) => {
    try {
      const response = await fetch(`${BASE_URL}/stats`);
      
      if (!response.ok) {
        throw new Error(`External API responded with ${response.status}`);
      }

      const data = await response.json();
      res.status(200).json(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch stats from Thetanuts' 
      });
    }
  }
};
