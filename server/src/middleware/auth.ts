import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { db } from '../lib/db';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    userId: string; // для обратной совместимости
    email: string;
    type: 'CLIENT' | 'FREELANCER' | 'ADMIN';
    user_type?: 'client' | 'freelancer' | 'admin'; // старая версия
    firstName?: string;
    lastName?: string;
  };
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: 'NO_TOKEN',
        message: 'Токен авторизации не предоставлен',
      });
      return;
    }

    if (!authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'INVALID_TOKEN_FORMAT',
        message: 'Неверный формат токена. Используйте: Bearer <token>',
      });
      return;
    }

    const token = authHeader.substring(7);
    
    // Инициализируем Supabase клиент
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    
    if (!url || !key) {
      res.status(500).json({
        success: false,
        error: 'SERVER_ERROR',
        message: 'Конфигурация сервера неполная',
      });
      return;
    }

    const supabase = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    });

    // Проверяем токен
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Недействительный токен',
      });
      return;
    }

    // Получаем профиль пользователя из базы
    const profile = await db.findOneBy<any>('profiles', 'id', user.id);

    if (!profile) {
      res.status(401).json({
        success: false,
        error: 'PROFILE_NOT_FOUND',
        message: 'Профиль пользователя не найден',
      });
      return;
    }

    // Конвертируем user_type в верхний регистр для совместимости
    const userType = profile.user_type?.toUpperCase() as 'CLIENT' | 'FREELANCER' | 'ADMIN' || 'FREELANCER';

    // Добавляем пользователя в запрос
    req.user = {
      id: user.id,
      userId: user.id, // для обратной совместимости
      email: user.email || profile.email || '',
      type: userType,
      user_type: profile.user_type, // старая версия
      firstName: profile.first_name,
      lastName: profile.last_name,
    };

    next();
  } catch (error: any) {
    console.error('[Auth] Middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'AUTH_ERROR',
      message: 'Ошибка при проверке авторизации',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const optionalAuthMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);
    
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    
    if (!url || !key) {
      next();
      return;
    }

    const supabase = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    });

    const { data: { user } } = await supabase.auth.getUser(token);

    if (user) {
      // Получаем профиль пользователя из базы
      const profile = await db.findOneBy<any>('profiles', 'id', user.id);
      
      if (profile) {
        const userType = profile.user_type?.toUpperCase() as 'CLIENT' | 'FREELANCER' | 'ADMIN' || 'FREELANCER';
        
        req.user = {
          id: user.id,
          userId: user.id,
          email: user.email || profile.email || '',
          type: userType,
          user_type: profile.user_type,
          firstName: profile.first_name,
          lastName: profile.last_name,
        };
      }
    }

    next();
  } catch (error) {
    // В optional middleware просто продолжаем без аутентификации
    next();
  }
};

export const requireRole = (...allowedRoles: Array<'CLIENT' | 'FREELANCER' | 'ADMIN'>) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Требуется авторизация',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.type)) {
      res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Недостаточно прав для выполнения операции',
      });
      return;
    }

    next();
  };
};

export const clientMiddleware = requireRole('CLIENT');
export const freelancerMiddleware = requireRole('FREELANCER');
export const adminMiddleware = requireRole('ADMIN');