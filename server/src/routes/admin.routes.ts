import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { rateLimit } from '../middleware/rateLimit';

const router = Router();

// Все роуты требуют прав администратора
router.get(
  '/stats',
  rateLimit({ windowMs: 60 * 1000, max: 30 }),
  AdminController.getPlatformStats
);

router.get(
  '/users',
  rateLimit({ windowMs: 60 * 1000, max: 30 }),
  AdminController.getUsers
);

router.get(
  '/projects',
  rateLimit({ windowMs: 60 * 1000, max: 30 }),
  AdminController.getProjects
);

router.get(
  '/transactions',
  rateLimit({ windowMs: 60 * 1000, max: 30 }),
  AdminController.getTransactions
);

router.get(
  '/withdrawals',
  rateLimit({ windowMs: 60 * 1000, max: 30 }),
  AdminController.getWithdrawals
);

router.patch(
  '/withdrawals/:id',
  rateLimit({ windowMs: 60 * 1000, max: 30 }),
  AdminController.updateWithdrawalStatus
);

router.patch(
  '/users/:userId/status',
  rateLimit({ windowMs: 60 * 1000, max: 30 }),
  AdminController.toggleUserStatus
);

router.patch(
  '/projects/:projectId/status',
  rateLimit({ windowMs: 60 * 1000, max: 30 }),
  AdminController.updateProjectStatus
);

router.get(
  '/reports',
  rateLimit({ windowMs: 60 * 1000, max: 30 }),
  AdminController.getReports
);

export default router;