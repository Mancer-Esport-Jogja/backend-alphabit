import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './users';
import systemRoutes from './system';
import ordersRoutes from './orders';
import positionsRoutes from './positions';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/system', systemRoutes);
router.use('/orders', ordersRoutes);
router.use('/positions', positionsRoutes);

export default router;
