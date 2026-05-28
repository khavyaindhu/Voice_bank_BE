import { Router } from 'express';
import { tts } from '../controllers/tts.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, tts);

export default router;
