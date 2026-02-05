// server/src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';

// ==================== ТИПЫ ОШИБОК ====================
interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  code?: string;
  details?: any;
  stack?: string;
}

interface CustomError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

// ==================== LOGGER ====================
const logger = {
  error: (message: string, meta?: any) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ERROR:`, message);
    if (meta) {
      console.error('Meta:', JSON.stringify(meta, null, 2));
    }
  },
  warn: (message: string, meta?: any) => {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] WARN:`, message);
    if (meta) {
      console.warn('Meta:', JSON.stringify(meta, null, 2));
    }
  },
};

// ==================== ОСНОВНОЙ ОБРАБОТЧИК ====================
export const errorHandler = (
  error: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Логируем ошибку
  logger.error('Request failed', {
    error: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    body: req.method !== 'GET' ? req.body : undefined,
  });

  // Определяем статус код
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Внутренняя ошибка сервера';
  let code = error.code;
  let details = error.details;

  // ==================== ОБРАБОТКА СПЕЦИФИЧНЫХ ОШИБОК ====================

  // JWT ошибки
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Недействительный токен авторизации';
    code = 'INVALID_TOKEN';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Токен авторизации истек';
    code = 'TOKEN_EXPIRED';
  }

  // Ошибки валидации Joi
  else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Ошибка валидации данных';
    code = 'VALIDATION_ERROR';
    details = error.details;
  }

  // Ошибки Supabase
  else if (error.message?.includes('duplicate key') || error.code === '23505') {
    statusCode = 409;
    message = 'Запись с такими данными уже существует';
    code = 'DUPLICATE_ENTRY';
  } else if (error.message?.includes('foreign key') || error.code === '23503') {
    statusCode = 400;
    message = 'Невозможно выполнить операцию: связанные данные не найдены';
    code = 'FOREIGN_KEY_VIOLATION';
  } else if (error.message?.includes('not found') || error.code === 'PGRST116') {
    statusCode = 404;
    message = 'Запрашиваемый ресурс не найден';
    code = 'NOT_FOUND';
  }

  // Ошибки Stripe
  else if (error.name === 'StripeError') {
    statusCode = 400;
    message = 'Ошибка при обработке платежа';
    code = 'PAYMENT_ERROR';
  }

  // Ошибки парсинга JSON
  else if (error instanceof SyntaxError && 'body' in error) {
    statusCode = 400;
    message = 'Неверный формат JSON';
    code = 'INVALID_JSON';
  }

  // Ошибки мультипарта (загрузка файлов)
  else if (error.name === 'MulterError') {
    statusCode = 400;
    message = 'Ошибка при загрузке файла';
    code = 'FILE_UPLOAD_ERROR';
    if (error.message.includes('File too large')) {
      message = 'Файл слишком большой';
    }
  }

  // ==================== ФОРМИРОВАНИЕ ОТВЕТА ====================
  const errorResponse: ErrorResponse = {
    success: false,
    error: code || 'INTERNAL_ERROR',
    message,
  };

  // Добавляем детали только в режиме разработки или для клиентских ошибок
  if (process.env.NODE_ENV === 'development') {
    errorResponse.details = details;
    errorResponse.stack = error.stack;
  } else if (statusCode < 500 && details) {
    errorResponse.details = details;
  }

  // Отправляем ответ
  res.status(statusCode).json(errorResponse);
};

// ==================== ОБРАБОТЧИК 404 ====================
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: `Маршрут ${req.method} ${req.path} не найден`,
  });
};

// ==================== ASYNC WRAPPER ====================
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// ==================== CUSTOM ERRORS ====================
export class AppError extends Error {
  statusCode: number;
  code: string;
  details?: any;

  constructor(message: string, statusCode: number = 500, code?: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || 'APP_ERROR';
    this.details = details;
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Не авторизован') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Доступ запрещен') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Ресурс не найден') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Конфликт данных') {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

export default errorHandler;
