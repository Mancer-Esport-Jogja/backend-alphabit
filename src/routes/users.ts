import { Router } from 'express';
import { requireAuth } from '../middlewares/auth';
import { userController } from '../controllers/userController';

const router = Router();

// GET /users/me
router.get('/me', requireAuth, userController.getMe);

export default router;
