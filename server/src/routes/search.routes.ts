import { Router } from 'express';
import { SearchController } from '../controllers/search.controller';
import { rateLimit } from '../middleware/rateLimit';

const router = Router();

// Публичные роуты поиска
router.get(
  '/projects',
  rateLimit({ windowMs: 60 * 1000, max: 60 }),
  SearchController.searchProjects
);

router.get(
  '/freelancers',
  rateLimit({ windowMs: 60 * 1000, max: 60 }),
  SearchController.searchFreelancers
);

router.get(
  '/autocomplete',
  rateLimit({ windowMs: 60 * 1000, max: 100 }),
  SearchController.autocomplete
);

router.get(
  '/tag/:tag',
  rateLimit({ windowMs: 60 * 1000, max: 60 }),
  SearchController.searchByTag
);

router.get(
  '/popular',
  rateLimit({ windowMs: 60 * 1000, max: 30 }),
  SearchController.getPopularSearches
);

router.get(
  '/location',
  rateLimit({ windowMs: 60 * 1000, max: 60 }),
  SearchController.searchByLocation
);

export default router;