import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import projectRoutes from './project.routes';
import bidRoutes from './bid.routes';
import messageRoutes from './message.routes';
import reviewRoutes from './review.routes';
import paymentRoutes from './payment.routes';
import notificationRoutes from './notification.routes';
import searchRoutes from './search.routes';
import adminRoutes from './admin.routes';
import recommendationRoutes from './recommendation.routes';
import portfolioRoutes from './portfolio.routes';
import analyticsRoutes from './analytics.routes';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Основные маршруты API
router.use('/auth', authRoutes);
router.use('/search', searchRoutes);
router.use('/projects', projectRoutes);
router.use('/users', userRoutes);
router.use('/portfolio', portfolioRoutes);
router.use('/analytics', analyticsRoutes);

// Защищенные маршруты (требуют аутентификации)
router.use('/bids', authMiddleware, bidRoutes);
router.use('/messages', authMiddleware, messageRoutes);
router.use('/reviews', authMiddleware, reviewRoutes);
router.use('/payments', authMiddleware, paymentRoutes);
router.use('/notifications', authMiddleware, notificationRoutes);
router.use('/recommendations', authMiddleware, recommendationRoutes);

// Админ роуты (дополнительная проверка)
router.use('/admin', authMiddleware, adminRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API работает нормально',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// API информация
router.get('/', (req, res) => {
  res.json({
    success: true,
    service: 'WorkFinder API',
    version: '1.0.0',
    endpoints: {
      auth: '/auth',
      projects: '/projects',
      users: '/users',
      bids: '/bids',
      messages: '/messages',
      reviews: '/reviews',
      payments: '/payments',
      portfolio: '/portfolio',
      analytics: '/analytics',
      search: '/search',
      admin: '/admin',
    },
    documentation: 'Доступно по запросу',
  });
});

// 404 обработчик для API
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API маршрут не найден',
    path: req.originalUrl,
  });
});

export default router;