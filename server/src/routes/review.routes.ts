import { Router } from 'express';
import { ReviewController } from '../controllers/review.controller';
import { authMiddleware } from '../middleware/auth';
import { createRateLimit } from '../middleware/rateLimit';
import { validate } from '../middleware/validate';
import { reviewSchema } from '../utils/validation';

const router = Router();

// Публичные роуты
router.get('/user/:userId', ReviewController.getUserReviews);
router.get('/summary/:userId', ReviewController.getRatingSummary);
router.get('/recent', ReviewController.getRecentReviews);

// Защищенные роуты (требуют аутентификации)
router.post(
  '/',
  authMiddleware,
  createRateLimit({ windowMs: 15 * 60 * 1000, max: 5 }), // Исправлено: createRateLimit вместо rateLimit
  validate(reviewSchema),
  ReviewController.createReview
);

router.put(
  '/:id',
  authMiddleware,
  createRateLimit({ windowMs: 15 * 60 * 1000, max: 10 }), // Исправлено: createRateLimit вместо rateLimit
  validate(reviewSchema),
  ReviewController.updateReview
);

router.delete(
  '/:id',
  authMiddleware,
  createRateLimit({ windowMs: 15 * 60 * 1000, max: 10 }), // Исправлено: createRateLimit вместо rateLimit
  ReviewController.deleteReview
);

router.post(
  '/:id/reply',
  authMiddleware,
  createRateLimit({ windowMs: 15 * 60 * 1000, max: 5 }), // Исправлено: createRateLimit вместо rateLimit
  ReviewController.replyToReview
);

router.post(
  '/:id/helpful',
  authMiddleware,
  createRateLimit({ windowMs: 15 * 60 * 1000, max: 20 }), // Исправлено: createRateLimit вместо rateLimit
  ReviewController.markHelpful
);

router.post(
  '/:id/report',
  authMiddleware,
  createRateLimit({ windowMs: 15 * 60 * 1000, max: 3 }), // Исправлено: createRateLimit вместо rateLimit
  ReviewController.reportReview
);

export default router;