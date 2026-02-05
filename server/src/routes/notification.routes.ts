import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authMiddleware } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';

const router = Router();

// Все роуты требуют аутентификации
router.get(
  '/',
  authMiddleware,
  rateLimit({ windowMs: 60 * 1000, max: 30 }),
  NotificationController.getUserNotifications
);

router.patch(
  '/:id/read',
  authMiddleware,
  rateLimit({ windowMs: 60 * 1000, max: 30 }),
  NotificationController.markAsRead
);

router.patch(
  '/read-all',
  authMiddleware,
  rateLimit({ windowMs: 60 * 1000, max: 5 }),
  NotificationController.markAllAsRead
);

router.delete(
  '/:id',
  authMiddleware,
  rateLimit({ windowMs: 60 * 1000, max: 30 }),
  NotificationController.deleteNotification
);

router.delete(
  '/read',
  authMiddleware,
  rateLimit({ windowMs: 60 * 1000, max: 5 }),
  NotificationController.deleteAllRead
);

router.get(
  '/settings',
  authMiddleware,
  rateLimit({ windowMs: 60 * 1000, max: 30 }),
  NotificationController.getNotificationSettings
);

router.put(
  '/settings',
  authMiddleware,
  rateLimit({ windowMs: 60 * 1000, max: 10 }),
  NotificationController.updateNotificationSettings
);

router.post(
  '/test',
  authMiddleware,
  rateLimit({ windowMs: 15 * 60 * 1000, max: 3 }),
  NotificationController.sendTestNotification
);

export default router;