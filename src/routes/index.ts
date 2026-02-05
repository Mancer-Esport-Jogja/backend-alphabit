import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './users';
import systemRoutes from './system';
import nutsRoutes from './nuts';
import marketRoutes from './market';

import analyticsRoutes from './analytics';
import leaderboardRoutes from './leaderboard';

import predictionRoutes from './predictionRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/system', systemRoutes);
router.use('/nuts', nutsRoutes);
router.use('/market', marketRoutes);
router.use('/user/analytics', analyticsRoutes);
router.use('/leaderboard', leaderboardRoutes);
router.use('/prediction', predictionRoutes);

export default router;
