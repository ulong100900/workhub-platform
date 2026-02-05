// src/services/push.service.ts - упрощенная версия
import logger from '../utils/logger';

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  data?: Record<string, any>;
}

export interface UserPushSubscription {
  userId: string;
  endpoint: string;
  keys?: {
    p256dh: string;
    auth: string;
  };
}

export class PushNotificationService {
  private isConfigured: boolean;

  constructor() {
    // Простая проверка - всегда "configured" для разработки
    this.isConfigured = process.env.NODE_ENV === 'development' || !!process.env.VAPID_PUBLIC_KEY;
    
    if (!this.isConfigured) {
      logger.warn('Push notifications running in development mode');
    }
  }

  // Упрощенная отправка push-уведомления
  async sendPushNotification(
    subscription: UserPushSubscription,
    payload: PushNotificationPayload
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // В режиме разработки просто логируем
      if (process.env.NODE_ENV === 'development') {
        logger.info(`[DEV PUSH] To user ${subscription.userId}: ${payload.title}`, {
          body: payload.body,
          endpoint: subscription.endpoint?.substring(0, 30) + '...'
        });
        return { success: true };
      }

      // В реальном приложении здесь будет вызов web-push
      // const webpush = require('web-push');
      // await webpush.sendNotification(subscription, JSON.stringify(payload));
      
      logger.info(`[PUSH] Simulated send: ${payload.title}`);
      return { success: true };
    } catch (error: any) {
      logger.error('Push notification error:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Отправка уведомления о новом биде
  async sendBidNotification(
    subscription: UserPushSubscription,
    projectTitle: string,
    bidAmount: number,
    bidderName: string
  ) {
    return this.sendPushNotification(subscription, {
      title: 'New Bid Received',
      body: `${bidderName} bid $${bidAmount} on "${projectTitle}"`,
      data: { type: 'bid' }
    });
  }

  // Отправка уведомления о сообщении
  async sendMessageNotification(
    subscription: UserPushSubscription,
    senderName: string,
    messagePreview: string
  ) {
    return this.sendPushNotification(subscription, {
      title: `New Message from ${senderName}`,
      body: messagePreview,
      data: { type: 'message' }
    });
  }

  // Простая проверка подписки
  async validateSubscription(subscription: UserPushSubscription): Promise<boolean> {
    return !!subscription.endpoint && subscription.endpoint.startsWith('http');
  }

  // Получение статуса сервиса
  getStatus() {
    return {
      configured: this.isConfigured,
      mode: process.env.NODE_ENV === 'development' ? 'development' : 'production'
    };
  }
}

// Экспорт синглтона
export default new PushNotificationService();