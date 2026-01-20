import { Request, Response } from 'express';

const BASE_URL = 'https://optionbook-indexer.thetanuts.finance/api/v1/user';

export const positionsController = {
  getPositions: async (req: Request, res: Response) => {
    try {
      const { address, type } = req.body;

      if (!address) {
        return res.status(400).json({ 
          success: false, 
          message: 'Address is required' 
        });
      }

      if (!type || !['open', 'history'].includes(type)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Type must be either "open" or "history"' 
        });
      }

      const endpoint = type === 'open' ? 'positions' : 'history';
      const url = `${BASE_URL}/${address}/${endpoint}`;

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
  }
};
