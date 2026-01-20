import { Router } from 'express';
import { nutsController } from '../controllers/nutsController';

const router = Router();

// GET /nuts/orders
router.get('/orders', nutsController.getOrders);

// POST /nuts/positions
router.post('/positions', nutsController.getPositions);

// GET /nuts/update
router.get('/update', nutsController.getUpdate);

// GET /nuts/stats
router.get('/stats', nutsController.getStats);

export default router;
