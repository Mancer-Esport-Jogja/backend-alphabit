import { Router } from 'express';
import { systemController } from '../controllers/systemController';

const router = Router();

// GET /system/info
router.get('/info', systemController.getInfo);

// GET /system/health
router.get('/health', systemController.getHealth);

export default router;
