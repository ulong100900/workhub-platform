// src/middleware/rateLimit.ts - рабочая версия
import { rateLimit as expressRateLimit } from 'express-rate-limit';

// Основной middleware для всего API
export const rateLimitMiddleware = expressRateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // максимум 100 запросов за 15 минут
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Более строгий лимит для авторизации
export const authRateLimiter = expressRateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 5, // максимум 5 попыток входа за 15 минут
  message: 'Too many login attempts, please try again later.',
});

// Функция для создания кастомных лимитеров
export const createRateLimit = (options: {
  windowMs: number;
  max: number;
  message?: string;
}) => {
  return expressRateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: options.message || 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Для обратной совместимости с существующим кодом
export const rateLimit = createRateLimit;