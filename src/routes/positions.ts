import { Router } from 'express';
import { positionsController } from '../controllers/positionsController';

const router = Router();

// POST /positions
router.post('/', positionsController.getPositions);

export default router;
