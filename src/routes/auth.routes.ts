import { Router } from 'express';
import { register, login, getMe, provisionAccounts } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.post('/provision-accounts', authenticate, provisionAccounts);  // one-time fix for existing users

export default router;
