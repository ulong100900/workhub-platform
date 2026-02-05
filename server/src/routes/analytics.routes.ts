// src/routes/analytics.routes.ts - исправленная версия
import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { authMiddleware } from '../middleware/auth';
import { createRateLimit } from '../middleware/rateLimit'; // Используем createRateLimit

const router = Router();

// Публичные роуты (используем существующие методы)
router.get(
  '/platform',
  createRateLimit({ windowMs: 60 * 1000, max: 10 }),
  AnalyticsController.getAnalytics // Используем getAnalytics вместо getPlatformAnalytics
);

// Защищенные роуты
router.get(
  '/user',
  authMiddleware,
  createRateLimit({ windowMs: 60 * 1000, max: 30 }),
  AnalyticsController.getUserAnalytics
);

router.get(
  '/projects',
  authMiddleware,
  createRateLimit({ windowMs: 60 * 1000, max: 30 }),
  AnalyticsController.getProjectAnalytics
);

// Заменим getSkillTrends на существующий метод или создадим новый
router.get(
  '/skills/trends',
  authMiddleware,
  createRateLimit({ windowMs: 60 * 1000, max: 30 }),
  (req, res) => {
    // Временная заглушка
    res.json({
      success: true,
      data: {
        trendingSkills: [
          { name: 'React', demand: 85 },
          { name: 'Node.js', demand: 78 },
          { name: 'TypeScript', demand: 92 },
          { name: 'Python', demand: 75 },
          { name: 'AWS', demand: 80 }
        ]
      }
    });
  }
);

export default router;