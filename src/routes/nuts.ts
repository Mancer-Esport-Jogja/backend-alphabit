import { Router } from 'express';
import { nutsController } from '../controllers/nutsController';
import { tradeController } from '../controllers/tradeController';
import { requireAuth } from '../middlewares/auth';
import { requireAdminToken } from '../middlewares/adminToken';

const router = Router();

// GET /nuts/config - Get Thetanuts configuration for frontend
router.get('/config', nutsController.getConfig);

// GET /nuts/orders - Fetch orders from Thetanuts
router.get('/orders', nutsController.getOrders);

// POST /nuts/positions - Get user positions/history with optional referrer filtering
router.post('/positions', nutsController.getPositions);

// POST /nuts/update - Trigger sync after a trade
router.post('/update', nutsController.triggerUpdate);

// GET /nuts/stats - Get Thetanuts statistics
router.get('/stats', nutsController.getStats);

// POST /nuts/payout/calculate - Calculate payout for an order
router.post('/payout/calculate', nutsController.calculatePayout);

// ========== Trade endpoints (require authentication) ==========

// POST /nuts/trades/sync - Sync user trades from Thetanuts to DB
router.post('/trades/sync', requireAuth, tradeController.syncTrades);

// POST /nuts/trades/sync-all - Sync all user trades (admin token required)
router.post('/trades/sync-all', requireAdminToken, tradeController.syncAllTrades);

// GET /nuts/trades - Get user trades from DB
router.get('/trades', requireAuth, tradeController.getTrades);

// GET /nuts/trades/stats - Get user trade statistics
router.get('/trades/stats', requireAuth, tradeController.getTradeStats);

export default router;
