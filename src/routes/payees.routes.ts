import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getPayees, createPayee, deletePayee, recordPayment } from '../controllers/payees.controller';

const router = Router();
router.use(authenticate);

router.get('/',                     getPayees);
router.post('/',                    createPayee);
router.delete('/:id',               deletePayee);
router.patch('/:id/record-payment', recordPayment);

export default router;
