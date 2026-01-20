import { Router } from 'express';
import { ordersController } from '../controllers/ordersController';

const router = Router();

// GET /orders
router.get('/', ordersController.getOrders);

export default router;
