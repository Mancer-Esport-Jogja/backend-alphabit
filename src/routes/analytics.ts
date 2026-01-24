import { Router } from 'express';
import { analyticsController } from '../controllers/analyticsController';
import { requireAuth } from '../middlewares/auth';

const router = Router();

// All analytics routes require authentication
router.use(requireAuth);

router.get('/summary', analyticsController.getSummary);
router.get('/pnl-history', analyticsController.getPnLHistory);
router.get('/distribution', analyticsController.getDistribution);

export default router;
