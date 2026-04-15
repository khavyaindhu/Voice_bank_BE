import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { sendMessage, getChatHistory } from '../controllers/chat.controller';

const router = Router();
router.use(authenticate);

router.post('/message', sendMessage);
router.get('/session/:sessionId', getChatHistory);

export default router;
