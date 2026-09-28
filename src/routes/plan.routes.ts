import { Router } from 'express';
import {
  getPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan
} from '../controllers/plan.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin.middleware';

const router = Router();

router.get('/', getPlans);
router.get('/:id', getPlanById);
router.post('/', authenticate, requireAdmin, createPlan);
router.patch('/:id', authenticate, requireAdmin, updatePlan);
router.delete('/:id', authenticate, requireAdmin, deletePlan);

export default router;
