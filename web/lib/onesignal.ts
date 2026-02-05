// Используем прямое обращение к OneSignal API без SDK
// Если нужен SDK, установите: npm install @onesignal/node-onesignal

export const oneSignalAppId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!;
export const oneSignalApiKey = process.env.ONESIGNAL_API_KEY!;

// Функция для получения push token из Supabase
async function getPushTokenFromSupabase(userId: string) {
  // Вместо импорта из несуществующего файла, используем Supabase напрямую
  // Создайте таблицу user_push_tokens в Supabase для хранения токенов
  console.log('Getting push token for user:', userId);
  
  // Временно возвращаем null, пока не настроите таблицу
  return null;
}

// Отправка пуш-уведомления
export async function sendPushNotification({
  userId,
  title,
  message,
  url = '',
  data = {},
}: {
  userId: string;
  title: string;
  message: string;
  url?: string;
  data?: Record<string, any>;
}) {
  try {
    // Получаем push token пользователя
    const pushToken = await getPushTokenFromSupabase(userId);
    
    if (!pushToken) {
      console.log('No push token for user:', userId);
      return;
    }

    const notification = {
      app_id: oneSignalAppId,
      include_player_ids: [pushToken],
      headings: { en: title, ru: title },
      contents: { en: message, ru: message },
      url,
      data,
      // Настройки для разных платформ
      ios_badgeType: 'Increase',
      ios_badgeCount: 1,
      android_channel_id: 'workfinder_notifications',
    };

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${oneSignalApiKey}`,
      },
      body: JSON.stringify(notification),
    });

    if (!response.ok) {
      throw new Error(`Push notification failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}

// Отправка пуш-уведомления всем пользователям
export async function sendPushToAllUsers({
  title,
  message,
  filters = [],
}: {
  title: string;
  message: string;
  filters?: any[];
}) {
  try {
    const notification = {
      app_id: oneSignalAppId,
      included_segments: ['Subscribed Users'],
      filters,
      headings: { en: title, ru: title },
      contents: { en: message, ru: message },
      android_channel_id: 'workfinder_notifications',
    };

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${oneSignalApiKey}`,
      },
      body: JSON.stringify(notification),
    });

    if (!response.ok) {
      throw new Error(`Push to all failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending push to all:', error);
  }
}