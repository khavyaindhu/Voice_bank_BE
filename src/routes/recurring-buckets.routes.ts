import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getBuckets,
  getBucket,
  createBucket,
  updateBucket,
  deleteBucket,
  addItem,
  updateItem,
  deleteItem,
  payAll,
} from '../controllers/recurring-buckets.controller';

const router = Router();
router.use(authenticate);

router.get('/', getBuckets);
router.get('/:id', getBucket);
router.post('/', createBucket);
router.patch('/:id', updateBucket);
router.delete('/:id', deleteBucket);
router.post('/:id/items', addItem);
router.patch('/:id/items/:itemId', updateItem);
router.delete('/:id/items/:itemId', deleteItem);
router.post('/:id/pay-all', payAll);

export default router;
