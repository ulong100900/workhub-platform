// web/lib/telegram.ts
export interface TelegramMessage {
  message_id: number;
  text: string;
  chat: {
    id: number;
    first_name?: string;
    last_name?: string;
    username?: string;
  };
  from?: {
    id: number;
    is_bot: boolean;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
  };
}

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

/**
 * Отправляет сообщение через Telegram Bot API
 */
export async function sendTelegramMessage(chatId: number | string, text: string): Promise<boolean> {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.error('TELEGRAM_BOT_TOKEN не установлен в .env');
      return false;
    }

    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      }),
    });

    const data = await response.json();
    return data.ok === true;
  } catch (error) {
    console.error('Ошибка отправки сообщения в Telegram:', error);
    return false;
  }
}

/**
 * Получает информацию о пользователе по chat_id
 */
export async function getTelegramUser(chatId: number): Promise<TelegramUser | null> {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.error('TELEGRAM_BOT_TOKEN не установлен в .env');
      return null;
    }

    const response = await fetch(`https://api.telegram.org/bot${token}/getChat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
      }),
    });

    const data = await response.json();
    return data.ok ? data.result : null;
  } catch (error) {
    console.error('Ошибка получения информации о пользователе Telegram:', error);
    return null;
  }
}

/**
 * Генерирует 6-значный код
 */
export function generateTelegramCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Проверяет валидность номера телефона для Telegram
 */
export function validatePhoneForTelegram(phone: string): boolean {
  // Убираем все нецифровые символы
  const cleaned = phone.replace(/\D/g, '');
  
  // Проверяем минимальную длину (обычно 10-15 цифр)
  if (cleaned.length < 10 || cleaned.length > 15) {
    return false;
  }
  
  // Проверяем, что номер начинается с + или содержит код страны
  if (!phone.startsWith('+') && !phone.startsWith('7') && !phone.startsWith('8')) {
    return false;
  }
  
  return true;
}