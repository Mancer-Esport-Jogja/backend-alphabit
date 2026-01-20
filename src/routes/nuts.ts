import { Router } from 'express';
import ordersRoutes from './orders';
import positionsRoutes from './positions';

const router = Router();

// /nuts/orders
router.use('/orders', ordersRoutes);

// /nuts/positions
router.use('/positions', positionsRoutes);

export default router;
