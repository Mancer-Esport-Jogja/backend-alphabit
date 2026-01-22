import { Router } from 'express';
import { marketController } from '../controllers/marketController';

const router = Router();

// GET /market/klines - Proxy Binance historical data
router.get('/klines', marketController.getBinanceKlines);

export default router;
