import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { initiateACH, initiateWire, initiateZelle, makeCardPayment, getPaymentHistory } from '../controllers/payments.controller';

const router = Router();
router.use(authenticate);

router.post('/ach', initiateACH);
router.post('/wire', initiateWire);
router.post('/zelle', initiateZelle);
router.post('/card', makeCardPayment);
router.get('/history', getPaymentHistory);

export default router;
