import { Router } from 'express';
import authRoutes from './auth.routes';
import accountsRoutes from './accounts.routes';
import paymentsRoutes from './payments.routes';
import cardsRoutes from './cards.routes';
import loansRoutes from './loans.routes';
import chatRoutes from './chat.routes';
import payeesRoutes from './payees.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/accounts', accountsRoutes);
router.use('/payments', paymentsRoutes);
router.use('/cards', cardsRoutes);
router.use('/loans', loansRoutes);
router.use('/chat', chatRoutes);
router.use('/payees', payeesRoutes);

export default router;
