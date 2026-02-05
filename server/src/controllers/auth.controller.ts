import { Request, Response } from 'express';
import { db } from '../lib/db';
import { Profile } from '../types/database';
import logger from '../utils/logger';
import { createClient } from '@supabase/supabase-js';

export class AuthController {
  // Инициализация Supabase клиента для сервера
  private static getSupabaseClient() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    
    if (!url || !key) {
      throw new Error('Supabase credentials not configured');
    }
    
    return createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    });
  }

  // Регистрация пользователя с Supabase
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, first_name, last_name, phone, user_type = 'freelancer' } = req.body;

      // Валидация
      if (!email || !password || !first_name || !last_name) {
        res.status(400).json({
          success: false,
          message: 'Все обязательные поля должны быть заполнены'
        });
        return;
      }

      // Создаем пользователя в Supabase Auth
      const supabase = this.getSupabaseClient();
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name,
            last_name,
            user_type
          }
        }
      });

      if (authError) {
        logger.error('Supabase registration error:', authError);
        
        if (authError.message.includes('already registered')) {
          res.status(400).json({
            success: false,
            message: 'Пользователь с таким email уже существует'
          });
        } else {
          res.status(400).json({
            success: false,
            message: 'Ошибка при регистрации',
            error: authError.message
          });
        }
        return;
      }

      if (!authData.user) {
        res.status(500).json({
          success: false,
          message: 'Ошибка создания пользователя'
        });
        return;
      }

      // Создаем профиль в основной базе
      const profileData: Partial<Profile> = {
        id: authData.user.id,
        email,
        first_name,
        last_name,
        phone: phone || null,
        user_type,
        status: 'active',
        is_verified: false,
        balance: 0,
        rating: 0,
        reviews_count: 0,
        completed_projects: 0,
        total_earned: 0,
        total_spent: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const profile = await db.create<Profile>('profiles', profileData);

      res.status(201).json({
        success: true,
        message: 'Регистрация успешно завершена',
        data: {
          user: profile,
          auth: authData
        }
      });

    } catch (error: any) {
      logger.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при регистрации',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Вход пользователя через Supabase
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Email и пароль обязательны'
        });
        return;
      }

      // Аутентификация через Supabase
      const supabase = this.getSupabaseClient();
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        logger.error('Supabase login error:', authError);
        
        if (authError.message.includes('Invalid login credentials')) {
          res.status(401).json({
            success: false,
            message: 'Неверные учетные данные'
          });
        } else {
          res.status(401).json({
            success: false,
            message: 'Ошибка при входе',
            error: authError.message
          });
        }
        return;
      }

      if (!authData.user) {
        res.status(401).json({
          success: false,
          message: 'Пользователь не найден'
        });
        return;
      }

      // Получаем профиль пользователя
      const profile = await db.findOneBy<Profile>('profiles', 'id', authData.user.id);
      
      if (!profile) {
        res.status(404).json({
          success: false,
          message: 'Профиль не найден'
        });
        return;
      }

      // Проверка статуса аккаунта
      if (profile.status !== 'active') {
        res.status(403).json({
          success: false,
          message: `Аккаунт ${profile.status}`,
          status: profile.status
        });
        return;
      }

      // Обновление времени последнего входа
      await db.update<Profile>('profiles', profile.id, {
        last_login: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      res.json({
        success: true,
        message: 'Вход выполнен успешно',
        data: {
          user: profile,
          session: authData.session,
          access_token: authData.session?.access_token,
          refresh_token: authData.session?.refresh_token
        }
      });

    } catch (error: any) {
      logger.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при входе в систему',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Получение профиля текущего пользователя через Supabase сессию
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const supabase = this.getSupabaseClient();
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          message: 'Требуется авторизация'
        });
        return;
      }

      const token = authHeader.substring(7);

      // Проверяем токен через Supabase
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        res.status(401).json({
          success: false,
          message: 'Неверный токен'
        });
        return;
      }

      // Получаем профиль
      const profile = await db.findOne<Profile>('profiles', user.id);
      
      if (!profile) {
        res.status(404).json({
          success: false,
          message: 'Профиль не найден'
        });
        return;
      }

      res.json({
        success: true,
        data: profile
      });

    } catch (error: any) {
      logger.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при получении профиля',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Выход из системы
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const supabase = this.getSupabaseClient();
      const authHeader = req.headers.authorization;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        await supabase.auth.signOut(token);
      }

      res.json({
        success: true,
        message: 'Выход выполнен успешно'
      });
    } catch (error: any) {
      logger.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при выходе из системы'
      });
    }
  }

  // Запрос сброса пароля через Supabase
  static async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          message: 'Email обязателен'
        });
        return;
      }

      const supabase = this.getSupabaseClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password`
      });

      if (error) {
        logger.error('Forgot password error:', error);
        // В целях безопасности не сообщаем об ошибке
      }

      res.json({
        success: true,
        message: 'Если email существует, инструкции по сбросу пароля будут отправлены'
      });

    } catch (error: any) {
      logger.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при запросе сброса пароля'
      });
    }
  }

  // Сброс пароля
  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        res.status(400).json({
          success: false,
          message: 'Токен и новый пароль обязательны'
        });
        return;
      }

      const supabase = this.getSupabaseClient();
      const { error } = await supabase.auth.updateUser({
        password
      });

      if (error) {
        logger.error('Reset password error:', error);
        res.status(400).json({
          success: false,
          message: 'Ошибка при сбросе пароля',
          error: error.message
        });
        return;
      }

      res.json({
        success: true,
        message: 'Пароль успешно изменен'
      });

    } catch (error: any) {
      logger.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при сбросе пароля'
      });
    }
  }

  // Обновление пароля (для авторизованных пользователей)
  static async updatePassword(req: Request, res: Response): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body;
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          message: 'Требуется авторизация'
        });
        return;
      }

      if (!currentPassword || !newPassword) {
        res.status(400).json({
          success: false,
          message: 'Текущий и новый пароль обязательны'
        });
        return;
      }

      const token = authHeader.substring(7);
      const supabase = this.getSupabaseClient();

      // Получаем пользователя
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);

      if (userError || !user) {
        res.status(401).json({
          success: false,
          message: 'Неверный токен'
        });
        return;
      }

      // Обновляем пароль через Supabase
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        res.status(400).json({
          success: false,
          message: 'Ошибка при обновлении пароля',
          error: error.message
        });
        return;
      }

      res.json({
        success: true,
        message: 'Пароль успешно обновлен'
      });

    } catch (error: any) {
      logger.error('Update password error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при обновлении пароля'
      });
    }
  }
}