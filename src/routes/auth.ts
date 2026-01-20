import { Router } from 'express';
import { authController } from '../controllers/authController';

const router = Router();

// POST /auth - Authenticate user (create if not exists)
router.post('/', authController.authenticate);

export default router;
