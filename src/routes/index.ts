import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './users';
import systemRoutes from './system';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/system', systemRoutes);

export default router;
