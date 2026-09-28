import { Router } from 'express';
import {
  createSubscription,
  getCurrentSubscription,
  cancelSubscription,
  renewSubscription,
  getUsage
} from '../controllers/subscription.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/', createSubscription);
router.get('/current', getCurrentSubscription);
router.get('/usage', getUsage);
router.patch('/:id/cancel', cancelSubscription);
router.patch('/:id/renew', renewSubscription);

export default router;
