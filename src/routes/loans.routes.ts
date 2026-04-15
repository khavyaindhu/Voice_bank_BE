import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getLoans, getLoanById, applyForLoan } from '../controllers/loans.controller';

const router = Router();
router.use(authenticate);

router.get('/', getLoans);
router.get('/:id', getLoanById);
router.post('/apply', applyForLoan);

export default router;
