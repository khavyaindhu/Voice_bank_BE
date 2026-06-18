import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getLoans,
  getLoanById,
  getEmiProgressByType,
  getLoanEmiProgress,
  applyForLoan,
} from '../controllers/loans.controller';

const router = Router();
router.use(authenticate);

router.get('/emi-progress', getEmiProgressByType);
router.get('/:id/emi-progress', getLoanEmiProgress);
router.get('/', getLoans);
router.get('/:id', getLoanById);
router.post('/apply', applyForLoan);

export default router;
