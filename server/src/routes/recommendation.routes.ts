import { Router } from 'express';
import { RecommendationController } from '../controllers/recommendation.controller';
import { authMiddleware } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';

const router = Router();

// Публичные роуты
router.get(
  '/skills/trending',
  rateLimit({ windowMs: 60 * 1000, max: 30 }),
  RecommendationController.getTrendingSkills
);

// Защищенные роуты
router.get(
  '/projects',
  authMiddleware,
  rateLimit({ windowMs: 60 * 1000, max: 30 }),
  RecommendationController.getProjectRecommendations
);

router.get(
  '/project/:projectId/freelancers',
  authMiddleware,
  rateLimit({ windowMs: 60 * 1000, max: 30 }),
  RecommendationController.getFreelancerRecommendations
);

router.get(
  '/smart-matches',
  authMiddleware,
  rateLimit({ windowMs: 60 * 1000, max: 30 }),
  RecommendationController.getSmartMatches
);

router.get(
  '/analytics',
  authMiddleware,
  rateLimit({ windowMs: 60 * 1000, max: 30 }),
  RecommendationController.getFreelancerAnalytics
);

router.post(
  '/feedback',
  authMiddleware,
  rateLimit({ windowMs: 60 * 1000, max: 10 }),
  RecommendationController.saveFeedback
);

export default router;