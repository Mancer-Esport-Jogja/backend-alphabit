import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './users';
import systemRoutes from './system';
import nutsRoutes from './nuts';
import marketRoutes from './market';

import analyticsRoutes from './analytics';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/system', systemRoutes);
router.use('/nuts', nutsRoutes);
router.use('/market', marketRoutes);
router.use('/user/analytics', analyticsRoutes);

export default router;
