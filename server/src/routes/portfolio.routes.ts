import { Router } from 'express';
import { PortfolioController } from '../controllers/portfolio.controller';
import { authMiddleware } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';

const router = Router();

// Публичные роуты
router.get('/user/:userId', PortfolioController.getUserPortfolio);
router.get('/popular', PortfolioController.getPopularItems);
router.get('/search', PortfolioController.searchPortfolio);
router.get('/:id', PortfolioController.viewPortfolioItem);
router.get('/:id/likes', PortfolioController.getItemLikes);

// Защищенные роуты
router.post(
  '/',
  authMiddleware,
  rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }),
  PortfolioController.createPortfolioItem
);

router.put(
  '/:id',
  authMiddleware,
  rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }),
  PortfolioController.updatePortfolioItem
);

router.delete(
  '/:id',
  authMiddleware,
  rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }),
  PortfolioController.deletePortfolioItem
);

router.post(
  '/:id/like',
  authMiddleware,
  rateLimit({ windowMs: 60 * 1000, max: 30 }),
  PortfolioController.toggleLike
);

router.post(
  '/profile/:userId/view',
  authMiddleware,
  rateLimit({ windowMs: 60 * 1000, max: 10 }),
  PortfolioController.viewProfile
);

router.get(
  '/profile/views',
  authMiddleware,
  rateLimit({ windowMs: 60 * 1000, max: 30 }),
  PortfolioController.getProfileViews
);

export default router;