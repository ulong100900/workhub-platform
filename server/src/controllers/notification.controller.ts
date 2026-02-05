import { Request, Response } from 'express';
import { db } from '../lib/db';  // Используем наш db вместо prisma
import { AuthRequest } from '../middleware/auth';
import { sendEmailNotification } from '../services/email.service';
import { sendPushNotification } from '../services/push.service';
import logger from '../utils/logger';

export class NotificationController {
  // Получение уведомлений пользователя
  static async getUserNotifications(req: AuthRequest, res: Response) {
    try {
      const { page = 1, limit = 20, unreadOnly } = req.query;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const take = parseInt(limit as string);

      // Строим условия WHERE
      const where: any[] = [
        { column: 'user_id', operator: 'eq', value: req.user.id }
      ];

      if (unreadOnly === 'true') {
        where.push({ column: 'is_read', operator: 'eq', value: false });
      }

      const [notificationsResult, totalResult] = await Promise.all([
        db.find<any>('notifications', {
          where,
          orderBy: {
            column: 'created_at',
            ascending: false
          },
          limit: take,
          offset: skip
        }),
        db.count('notifications', where)
      ]);

      // Получаем данные отправителей для уведомлений
      const notificationsWithSenders = await Promise.all(
        notificationsResult.data.map(async (notification: any) => {
          let sender = null;
          if (notification.sender_id) {
            const senderResult = await db.findOneBy<any>('profiles', 'id', notification.sender_id);
            if (senderResult) {
              sender = {
                id: senderResult.id,
                firstName: senderResult.first_name,
                lastName: senderResult.last_name,
                avatar: senderResult.avatar
              };
            }
          }

          return {
            id: notification.id,
            userId: notification.user_id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            data: notification.data,
            isRead: notification.is_read,
            readAt: notification.read_at,
            createdAt: notification.created_at,
            sender
          };
        })
      );

      // Количество непрочитанных
      const unreadCountResult = await db.count('notifications', [
        { column: 'user_id', operator: 'eq', value: req.user.id },
        { column: 'is_read', operator: 'eq', value: false }
      ]);

      const total = totalResult || 0;
      const unreadCount = unreadCountResult || 0;

      res.json({
        success: true,
        data: {
          notifications: notificationsWithSenders,
          unreadCount,
          pagination: {
            page: parseInt(page as string),
            limit: take,
            total,
            pages: Math.ceil(total / take),
          },
        },
      });
    } catch (error: any) {
      logger.error('Get user notifications error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при получении уведомлений',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Отметить уведомление как прочитанное
  static async markAsRead(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      // Поиск уведомления
      const notification = await db.findOne<any>('notifications', id);

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Уведомление не найдено',
        });
      }

      // Проверка прав доступа
      if (notification.user_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Нет прав для изменения этого уведомления',
        });
      }

      // Обновление уведомления
      await db.update<any>('notifications', id, {
        is_read: true,
        read_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      res.json({
        success: true,
        message: 'Уведомление отмечено как прочитанное',
      });
    } catch (error: any) {
      logger.error('Mark notification as read error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при обновлении уведомления',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Отметить все уведомления как прочитанные
  static async markAllAsRead(req: AuthRequest, res: Response) {
    try {
      await db.updateMany<any>('notifications', 
        [
          { column: 'user_id', operator: 'eq', value: req.user.id },
          { column: 'is_read', operator: 'eq', value: false }
        ],
        {
          is_read: true,
          read_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      );

      res.json({
        success: true,
        message: 'Все уведомления отмечены как прочитанные',
      });
    } catch (error: any) {
      logger.error('Mark all notifications as read error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при обновлении уведомлений',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Удалить уведомление
  static async deleteNotification(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      // Поиск уведомления
      const notification = await db.findOne<any>('notifications', id);

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Уведомление не найдено',
        });
      }

      // Проверка прав доступа
      if (notification.user_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Нет прав для удаления этого уведомления',
        });
      }

      // Удаление уведомления
      await db.delete('notifications', id);

      res.json({
        success: true,
        message: 'Уведомление удалено',
      });
    } catch (error: any) {
      logger.error('Delete notification error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при удалении уведомления',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Удалить все прочитанные уведомления
  static async deleteAllRead(req: AuthRequest, res: Response) {
    try {
      await db.deleteMany('notifications', [
        { column: 'user_id', operator: 'eq', value: req.user.id },
        { column: 'is_read', operator: 'eq', value: true }
      ]);

      res.json({
        success: true,
        message: 'Все прочитанные уведомления удалены',
      });
    } catch (error: any) {
      logger.error('Delete all read notifications error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при удалении уведомлений',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Получение настроек уведомлений
  static async getNotificationSettings(req: AuthRequest, res: Response) {
    try {
      const settings = await db.findOneBy<any>('notification_settings', 'user_id', req.user.id);

      // Если настроек нет, создаем дефолтные
      if (!settings) {
        const defaultSettings = await db.create<any>('notification_settings', {
          user_id: req.user.id,
          // Значения по умолчанию
          email_notifications: true,
          push_notifications: true,
          project_invites: true,
          bid_updates: true,
          project_updates: true,
          messages: true,
          reviews: true,
          promotions: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

        return res.json({
          success: true,
          data: {
            id: defaultSettings.id,
            userId: defaultSettings.user_id,
            emailNotifications: defaultSettings.email_notifications,
            pushNotifications: defaultSettings.push_notifications,
            projectInvites: defaultSettings.project_invites,
            bidUpdates: defaultSettings.bid_updates,
            projectUpdates: defaultSettings.project_updates,
            messages: defaultSettings.messages,
            reviews: defaultSettings.reviews,
            promotions: defaultSettings.promotions,
            createdAt: defaultSettings.created_at,
            updatedAt: defaultSettings.updated_at
          },
        });
      }

      res.json({
        success: true,
        data: {
          id: settings.id,
          userId: settings.user_id,
          emailNotifications: settings.email_notifications,
          pushNotifications: settings.push_notifications,
          projectInvites: settings.project_invites,
          bidUpdates: settings.bid_updates,
          projectUpdates: settings.project_updates,
          messages: settings.messages,
          reviews: settings.reviews,
          promotions: settings.promotions,
          createdAt: settings.created_at,
          updatedAt: settings.updated_at
        },
      });
    } catch (error: any) {
      logger.error('Get notification settings error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при получении настроек уведомлений',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Обновление настроек уведомлений
  static async updateNotificationSettings(req: AuthRequest, res: Response) {
    try {
      const {
        emailNotifications,
        pushNotifications,
        projectInvites,
        bidUpdates,
        projectUpdates,
        messages,
        reviews,
        promotions,
      } = req.body;

      // Проверяем существующие настройки
      const existingSettings = await db.findOneBy<any>('notification_settings', 'user_id', req.user.id);

      let settings;
      if (existingSettings) {
        // Обновляем существующие
        settings = await db.update<any>('notification_settings', existingSettings.id, {
          email_notifications: emailNotifications,
          push_notifications: pushNotifications,
          project_invites: projectInvites,
          bid_updates: bidUpdates,
          project_updates: projectUpdates,
          messages: messages,
          reviews: reviews,
          promotions: promotions,
          updated_at: new Date().toISOString()
        });
      } else {
        // Создаем новые
        settings = await db.create<any>('notification_settings', {
          user_id: req.user.id,
          email_notifications: emailNotifications,
          push_notifications: pushNotifications,
          project_invites: projectInvites,
          bid_updates: bidUpdates,
          project_updates: projectUpdates,
          messages: messages,
          reviews: reviews,
          promotions: promotions,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }

      res.json({
        success: true,
        message: 'Настройки уведомлений обновлены',
        data: {
          id: settings.id,
          userId: settings.user_id,
          emailNotifications: settings.email_notifications,
          pushNotifications: settings.push_notifications,
          projectInvites: settings.project_invites,
          bidUpdates: settings.bid_updates,
          projectUpdates: settings.project_updates,
          messages: settings.messages,
          reviews: settings.reviews,
          promotions: settings.promotions,
          createdAt: settings.created_at,
          updatedAt: settings.updated_at
        },
      });
    } catch (error: any) {
      logger.error('Update notification settings error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при обновлении настроек уведомлений',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Создание уведомления (внутренний метод)
  static async createNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    data?: any,
    senderId?: string
  ) {
    try {
      // Получение настроек пользователя
      const settings = await db.findOneBy<any>('notification_settings', 'user_id', userId);

      // Проверка, включены ли уведомления этого типа
      let shouldNotify = true;

      if (settings) {
        switch (type) {
          case 'PROJECT_INVITE':
            shouldNotify = settings.project_invites;
            break;
          case 'BID_UPDATE':
            shouldNotify = settings.bid_updates;
            break;
          case 'PROJECT_UPDATE':
            shouldNotify = settings.project_updates;
            break;
          case 'MESSAGE':
            shouldNotify = settings.messages;
            break;
          case 'REVIEW':
            shouldNotify = settings.reviews;
            break;
          case 'PROMOTION':
            shouldNotify = settings.promotions;
            break;
        }
      }

      if (!shouldNotify) {
        return null;
      }

      // Создание уведомления в базе
      const notification = await db.create<any>('notifications', {
        user_id: userId,
        type,
        title,
        message,
        data: data ? JSON.stringify(data) : null,
        sender_id: senderId,
        is_read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Отправка email уведомления
      if (!settings || settings.email_notifications) {
        await sendEmailNotification(userId, type, title, message, data);
      }

      // Отправка push уведомления
      if (!settings || settings.push_notifications) {
        await sendPushNotification(userId, type, title, message, data);
      }

      return notification;
    } catch (error: any) {
      logger.error('Create notification error:', error);
      return null;
    }
  }

  // Отправка тестового уведомления
  static async sendTestNotification(req: AuthRequest, res: Response) {
    try {
      const { type } = req.body;

      const testTypes = {
        PROJECT_INVITE: {
          title: 'Новое приглашение на проект',
          message: 'Вы получили приглашение на участие в проекте "Разработка сайта".',
        },
        BID_UPDATE: {
          title: 'Обновление по вашему предложению',
          message: 'Ваше предложение на проект "Дизайн логотипа" было обновлено.',
        },
        MESSAGE: {
          title: 'Новое сообщение',
          message: 'У вас новое сообщение от Алексея Иванова.',
        },
      };

      const testData = testTypes[type as keyof typeof testTypes] || {
        title: 'Тестовое уведомление',
        message: 'Это тестовое уведомление для проверки настроек.',
      };

      const notification = await this.createNotification(
        req.user.id,
        type || 'TEST',
        testData.title,
        testData.message,
        { isTest: true },
        req.user.id
      );

      if (!notification) {
        return res.status(400).json({
          success: false,
          message: 'Не удалось создать уведомление',
        });
      }

      res.json({
        success: true,
        message: 'Тестовое уведомление отправлено',
        data: notification,
      });
    } catch (error: any) {
      logger.error('Send test notification error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при отправке тестового уведомления',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}