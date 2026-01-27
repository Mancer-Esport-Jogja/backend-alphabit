import { Router } from 'express';
import { requireAuth } from '../middlewares/auth';
import { authController } from '../controllers/authController';

const router = Router();

// POST /auth - Authenticate user (requires Bearer token)
router.post('/', requireAuth, authController.authenticate);
router.post('/bind-wallet', requireAuth, authController.bindWallet);

export default router;
