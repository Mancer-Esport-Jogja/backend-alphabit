import { Router } from 'express';
import { marketController } from '../controllers/marketController';

const router = Router();

// GET /market/klines - Proxy Binance historical data
router.get('/klines', marketController.getBinanceKlines);

// GET /market/ticker - Proxy Binance ticker price
router.get('/ticker', marketController.getBinanceTicker);

export default router;
