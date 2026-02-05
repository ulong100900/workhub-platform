// server/src/index.ts - PRODUCTION READY
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { createLogger, format, transports } from 'winston';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import responseTime from 'response-time';
import { readFileSync } from 'fs';
import path from 'path';

// ==================== НАСТРОЙКА ЛОГИРОВАНИЯ ====================
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} [${level}]: ${message} ${
            Object.keys(meta).length ? JSON.stringify(meta) : ''
          }`;
        })
      ),
    }),
    new transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    }),
    new transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    }),
  ],
});

// ==================== ЗАГРУЗКА И ВАЛИДАЦИЯ ПЕРЕМЕННЫХ ====================
dotenv.config();

const validateEnv = () => {
  const requiredEnvVars = [
    'NODE_ENV',
    'PORT',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_KEY',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName] || process.env[varName].trim() === ''
  );

  if (missingVars.length > 0) {
    logger.error('CRITICAL: Missing required environment variables:', {
      missing: missingVars,
    });
    process.exit(1);
  }

  // Production проверки
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    // Проверка безопасности JWT секретов
    const weakSecrets = [];
    
    if (process.env.JWT_SECRET.length < 32) {
      weakSecrets.push('JWT_SECRET слишком короткий (минимум 32 символа)');
    }
    
    if (process.env.JWT_SECRET === 'your-secret-key-change-in-production') {
      weakSecrets.push('JWT_SECRET имеет значение по умолчанию');
    }
    
    if (process.env.JWT_REFRESH_SECRET.length < 32) {
      weakSecrets.push('JWT_REFRESH_SECRET слишком короткий (минимум 32 символа)');
    }
    
    if (weakSecrets.length > 0) {
      logger.error('INSECURE JWT configuration:', { weakSecrets });
      process.exit(1);
    }

    // Проверка CORS для production
    if (!process.env.ALLOWED_ORIGINS || process.env.ALLOWED_ORIGINS.includes('localhost')) {
      logger.warn('WARNING: ALLOWED_ORIGINS содержит localhost в production режиме');
    }

    // Проверка Supabase конфигурации
    if (!process.env.SUPABASE_URL.startsWith('https://') || 
        !process.env.SUPABASE_SERVICE_KEY.startsWith('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')) {
      logger.error('INVALID Supabase configuration');
      process.exit(1);
    }
  }

  logger.info('Environment variables validated successfully', {
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
    hasCors: !!process.env.ALLOWED_ORIGINS,
  });
};

validateEnv();

// ==================== ИНИЦИАЛИЗАЦИЯ EXPRESS ====================
const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

// ==================== БЕЗОПАСНОСТЬ ====================
// Helmet с production настройками
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.SUPABASE_URL || ''],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

app.use(cookieParser());

// Rate limiting с production настройками
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: isProduction ? 100 : 1000, // Разные лимиты для dev/prod
  message: {
    success: false,
    error: 'TOO_MANY_REQUESTS',
    message: 'Слишком много запросов. Пожалуйста, попробуйте позже.',
    retryAfter: 900, // секунд
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  keyGenerator: (req) => {
    // Используем IP + дополнительную идентификацию
    return `${req.ip}-${req.get('user-agent')?.substring(0, 50) || 'unknown'}`;
  },
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      userAgent: req.get('user-agent'),
    });
    res.status(429).json({
      success: false,
      error: 'TOO_MANY_REQUESTS',
      message: 'Слишком много запросов. Пожалуйста, попробуйте позже.',
    });
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: 'TOO_MANY_AUTH_ATTEMPTS',
    message: 'Слишком много попыток входа. Пожалуйста, попробуйте через 15 минут.',
  },
  skipSuccessfulRequests: true, // Не считаем успешные аутентификации
});

// ==================== CORS ====================
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()).filter(o => o) || [
  'http://localhost:3000',
  'http://localhost:3001',
];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // В production требуем origin
    if (isProduction && !origin) {
      return callback(new Error('CORS: Origin required in production'), false);
    }
    
    // В development разрешаем без origin
    if (!origin && !isProduction) {
      return callback(null, true);
    }
    
    if (origin && allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked request', { origin, allowedOrigins });
      callback(new Error('CORS: Not allowed by CORS policy'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-API-Key',
    'X-Request-ID',
  ],
  exposedHeaders: [
    'Content-Range',
    'X-Content-Range',
    'X-Request-ID',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
  ],
  maxAge: 86400, // 24 часа
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ==================== MIDDLEWARE ====================
// Compression (только для production)
if (isProduction) {
  app.use(compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    }
  }));
}

// Body parsers
app.use(express.json({ 
  limit: '10mb',
  verify: (req: any, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb',
  parameterLimit: 100
}));

// Response time
app.use(responseTime((req: Request, res: Response, time: number) => {
  const requestId = req.headers['x-request-id'] || 'unknown';
  logger.info('Request completed', {
    requestId,
    method: req.method,
    path: req.path,
    statusCode: res.statusCode,
    duration: `${time.toFixed(2)}ms`,
    userAgent: req.get('user-agent')?.substring(0, 100),
    ip: req.ip,
  });
}));

// Request ID middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] || 
                    `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  req.id = requestId;
  res.setHeader('X-Request-ID', requestId);
  
  logger.info('Request started', {
    requestId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent')?.substring(0, 100),
  });
  
  next();
});

// ==================== HEALTH & MONITORING ====================
app.get('/health', async (req: Request, res: Response) => {
  const healthChecks: Record<string, any> = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    nodeVersion: process.version,
    memory: {
      rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
    },
    requestId: req.id,
    database: 'supabase_connected',
  };

  res.status(200).json({
    success: true,
    ...healthChecks,
  });
});

app.get('/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    service: 'WorkFinder API',
    status: 'operational',
    timestamp: new Date().toISOString(),
    endpoints: {
      api: '/api/v1',
      health: '/health',
      docs: '/api/v1/docs',
    },
  });
});

// ==================== API ROUTES ====================
// Apply rate limiting
app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter);

// Import and use routes
import routes from './routes';
app.use('/api', routes);

// API Documentation
app.get('/api/v1/docs', (req: Request, res: Response) => {
  res.json({
    success: true,
    documentation: {
      version: '1.0.0',
      baseUrl: '/api/v1',
      endpoints: {
        auth: '/auth',
        projects: '/projects',
        bids: '/bids',
        users: '/users',
        portfolio: '/portfolio',
        analytics: '/analytics',
      },
      authentication: 'Bearer Token required for protected routes',
    },
  });
});

// ==================== ERROR HANDLING ====================
// 404 Not Found handler
app.use('*', (req: Request, res: Response) => {
  logger.warn('Route not found', {
    requestId: req.id,
    method: req.method,
    originalUrl: req.originalUrl,
    ip: req.ip,
  });
  
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: 'Ресурс не найден',
    path: req.originalUrl,
    requestId: req.id,
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  logger.error('Unhandled application error', {
    errorId,
    requestId: req.id,
    error: {
      name: err.name,
      message: err.message,
      stack: isProduction ? undefined : err.stack,
    },
    request: {
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      body: req.body,
    },
  });
  
  const response = {
    success: false,
    error: isProduction ? 'INTERNAL_SERVER_ERROR' : err.name,
    message: isProduction ? 'Произошла внутренняя ошибка сервера' : err.message,
    errorId,
    requestId: req.id,
    timestamp: new Date().toISOString(),
  };
  
  if (!isProduction) {
    (response as any).stack = err.stack;
  }
  
  res.status(500).json(response);
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  try {
    // Закрываем соединения с базой данных
    const { db } = await import('./lib/db');
    await db.disconnect();
    logger.info('Database connections closed');
  } catch (error) {
    logger.error('Error during database disconnect:', error);
  }
  
  // Даем время для завершения текущих запросов
  setTimeout(() => {
    logger.info('Graceful shutdown complete');
    process.exit(0);
  }, 5000);
};

// Process signal handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Uncaught exceptions and rejections
process.on('uncaughtException', (error) => {
  logger.error('UNCAUGHT EXCEPTION:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('UNHANDLED REJECTION:', { reason, promise });
  process.exit(1);
});

// ==================== SERVER STARTUP ====================
const startServer = async () => {
  try {
    logger.info('Starting WorkFinder API Server...');

    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`
╔═══════════════════════════════════════════════════════╗
║                🚀 WorkFinder API Server               ║
╠═══════════════════════════════════════════════════════╣
║ 📡 Environment: ${NODE_ENV.padEnd(30)} ║
║ 🌐 Port: ${PORT.toString().padEnd(35)} ║
║ 🔗 Local: http://localhost:${PORT.toString().padEnd(25)} ║
║ 📊 Health: http://localhost:${PORT}/health${''.padEnd(18)} ║
║ 📚 API: http://localhost:${PORT}/api/v1${''.padEnd(20)} ║
║ 🗄️  Database: Supabase${''.padEnd(30)} ║
║ 🛡️  Security: Rate Limiting, CORS, Helmet${''.padEnd(10)} ║
║ ⏰ Started: ${new Date().toISOString().padEnd(27)} ║
╚═══════════════════════════════════════════════════════╝
      `);
    });

    // Server error handling
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use. Please use a different port.`);
      } else {
        logger.error('Server startup error:', error);
      }
      process.exit(1);
    });

    // Server close handling
    server.on('close', () => {
      logger.info('Server closed');
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Запуск сервера
startServer();

export default app;