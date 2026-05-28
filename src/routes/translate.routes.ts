import { Router } from 'express';
import { translate } from '../controllers/translate.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, translate);

export default router;
