import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getAccounts, getAccountById, getAccountTransactions } from '../controllers/accounts.controller';

const router = Router();
router.use(authenticate);

router.get('/', getAccounts);
router.get('/:id', getAccountById);
router.get('/:id/transactions', getAccountTransactions);

export default router;
