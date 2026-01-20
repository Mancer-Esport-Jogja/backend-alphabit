import { Request, Response } from 'express';

export const ordersController = {
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
  }
};
