import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getCards, getCardById, toggleCardFreeze } from '../controllers/cards.controller';

const router = Router();
router.use(authenticate);

router.get('/', getCards);
router.get('/:id', getCardById);
router.patch('/:id/toggle-freeze', toggleCardFreeze);

export default router;
