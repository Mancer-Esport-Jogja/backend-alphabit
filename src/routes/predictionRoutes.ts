import { Router } from 'express';
import { getActivePrediction, createPrediction, votePrediction } from '../controllers/predictionController';

const router = Router();

router.get('/active', getActivePrediction);
router.post('/', createPrediction);
router.post('/vote', votePrediction);

export default router;
