import { Router } from 'express';
import authRoutes from './auth.routes';
import accountsRoutes from './accounts.routes';
import paymentsRoutes from './payments.routes';
import cardsRoutes from './cards.routes';
import loansRoutes from './loans.routes';
import chatRoutes from './chat.routes';
import payeesRoutes from './payees.routes';
import recurringBucketsRoutes from './recurring-buckets.routes';
import staffRoutes from './staff.routes';
import translateRoutes from './translate.routes';
import ttsRoutes from './tts.routes';
import configRoutes from './config.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/accounts', accountsRoutes);
router.use('/payments', paymentsRoutes);
router.use('/cards', cardsRoutes);
router.use('/loans', loansRoutes);
router.use('/chat', chatRoutes);
router.use('/payees', payeesRoutes);
router.use('/recurring-buckets', recurringBucketsRoutes);
router.use('/staff', staffRoutes);
router.use('/translate', translateRoutes);
router.use('/tts', ttsRoutes);
router.use('/config', configRoutes);

export default router;
