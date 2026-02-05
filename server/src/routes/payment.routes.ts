import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authMiddleware } from '../middleware/auth';
import { createRateLimit } from '../middleware/rateLimit'; // Изменено: createRateLimit вместо rateLimit
import { validate } from '../middleware/validate';
import { paymentSchema } from '../utils/validation';

const router = Router();

// Webhook для обработки платежей (без аутентификации)
router.post('/webhook', PaymentController.handleWebhook);

// Защищенные роуты
router.post(
  '/deposit',
  authMiddleware,
  createRateLimit({ windowMs: 15 * 60 * 1000, max: 5 }), // Изменено: createRateLimit
  validate(paymentSchema),
  PaymentController.createDeposit
);

router.post(
  '/withdraw',
  authMiddleware,
  createRateLimit({ windowMs: 15 * 60 * 1000, max: 3 }), // Изменено: createRateLimit
  PaymentController.createWithdrawal
);

router.get(
  '/transactions',
  authMiddleware,
  createRateLimit({ windowMs: 60 * 1000, max: 30 }), // Изменено: createRateLimit
  PaymentController.getUserTransactions
);

router.post(
  '/project/:projectId/bid/:bidId/pay',
  authMiddleware,
  createRateLimit({ windowMs: 15 * 60 * 1000, max: 10 }), // Изменено: createRateLimit
  PaymentController.createProjectPayment
);

router.post(
  '/project/:projectId/release',
  authMiddleware,
  createRateLimit({ windowMs: 15 * 60 * 1000, max: 5 }), // Изменено: createRateLimit
  PaymentController.releaseEscrow
);

router.post(
  '/project/:projectId/refund',
  authMiddleware,
  createRateLimit({ windowMs: 15 * 60 * 1000, max: 3 }), // Изменено: createRateLimit
  PaymentController.refundEscrow
);

router.get(
  '/stats',
  authMiddleware,
  createRateLimit({ windowMs: 60 * 1000, max: 30 }), // Изменено: createRateLimit
  PaymentController.getFinanceStats
);

router.get(
  '/project/:projectId/payments',
  authMiddleware,
  createRateLimit({ windowMs: 60 * 1000, max: 30 }), // Изменено: createRateLimit
  PaymentController.getProjectPayments
);

export default router;