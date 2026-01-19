import { Router } from 'express';
import userRoutes from './users';
import systemRoutes from './system';

const router = Router();

router.use('/users', userRoutes);
router.use('/system', systemRoutes);

export default router;
