import { Router } from 'express';
import { translate, translateToEnglishCommand } from '../controllers/translate.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/to-english', authenticate, translateToEnglishCommand);
router.post('/', authenticate, translate);

export default router;
