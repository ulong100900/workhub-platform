import TelegramBot from 'node-telegram-bot-api'
import { createClient } from '@supabase/supabase-js'

// Конфигурация
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!
const TELEGRAM_WEBHOOK_URL = process.env.TELEGRAM_WEBHOOK_URL!
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!

// Инициализация
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false })
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Хранилище временных данных (в продакшене используйте Redis)
const authSessions = new Map<string, {
  telegramId: number
  chatId: number
  expiresAt: number
}>()

// Генерация кода подтверждения
function generateAuthCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Создание сессии
export async function createTelegramAuthSession(telegramId: number, chatId: number) {
  const authCode = generateAuthCode()
  const expiresAt = Date.now() + 10 * 60 * 1000 // 10 минут
  
  authSessions.set(authCode, {
    telegramId,
    chatId,
    expiresAt
  })
  
  // Очистка старых сессий
  setTimeout(() => {
    authSessions.delete(authCode)
  }, 10 * 60 * 1000)
  
  return authCode
}

// Проверка кода
export function verifyTelegramAuthCode(authCode: string): {
  telegramId: number
  chatId: number
} | null {
  const session = authSessions.get(authCode)
  
  if (!session || session.expiresAt < Date.now()) {
    authSessions.delete(authCode)
    return null
  }
  
  authSessions.delete(authCode)
  return session
}

// Регистрация/логин пользователя
export async function handleTelegramUser(telegramUser: {
  id: number
  username?: string
  first_name: string
  last_name?: string
  photo_url?: string
}): Promise<{
  userId: string
  isNewUser: boolean
}> {
  // Проверяем, есть ли пользователь в базе
  const { data: existingUser } = await supabase
    .from('users')
    .select('id, telegram_id')
    .eq('telegram_id', telegramUser.id.toString())
    .single()

  if (existingUser) {
    // Обновляем информацию
    await supabase
      .from('users')
      .update({
        telegram_username: telegramUser.username,
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name,
        avatar_url: telegramUser.photo_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingUser.id)

    return {
      userId: existingUser.id,
      isNewUser: false
    }
  }

  // Создаем нового пользователя
  const { data: newUser, error } = await supabase
    .from('users')
    .insert({
      telegram_id: telegramUser.id.toString(),
      telegram_username: telegramUser.username,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name,
      email: telegramUser.username ? `${telegramUser.username}@telegram.user` : null,
      avatar_url: telegramUser.photo_url,
      auth_provider: 'telegram',
      is_active: true,
      email_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error

  // Создаем профиль
  await supabase
    .from('profiles')
    .insert({
      id: newUser.id,
      user_id: newUser.id,
      full_name: `${telegramUser.first_name} ${telegramUser.last_name || ''}`.trim(),
      avatar_url: telegramUser.photo_url,
      telegram_username: telegramUser.username,
      created_at: new Date().toISOString()
    })

  return {
    userId: newUser.id,
    isNewUser: true
  }
}

// Отправка приветственного сообщения
export async function sendWelcomeMessage(chatId: number, isNewUser: boolean) {
  const welcomeText = isNewUser 
    ? `🎉 Добро пожаловать в WorkFinder!

Вы успешно зарегистрировались через Telegram. Теперь вы можете:
• 🚀 Создавать проекты
• 💼 Откликаться на задания
• 💬 Общаться с клиентами
• ⭐ Получать отзывы

Начните с заполнения профиля для лучших результатов!`
    : `👋 С возвращением в WorkFinder!

Рады снова видеть вас на платформе. Ваши активные проекты и сообщения ждут вас.`

  await bot.sendMessage(chatId, welcomeText, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📋 Мои проекты', web_app: { url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/my-projects` } },
          { text: '👤 Профиль', web_app: { url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/profile` } }
        ],
        [
          { text: '➕ Создать проект', web_app: { url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/projects/create` } },
          { text: '🔍 Найти проекты', web_app: { url: `${process.env.NEXT_PUBLIC_APP_URL}/projects` } }
        ]
      ]
    }
  })
}

// Установка вебхука
export async function setupTelegramWebhook() {
  try {
    await bot.setWebHook(`${TELEGRAM_WEBHOOK_URL}/api/telegram/webhook`)
    console.log('Telegram webhook установлен')
  } catch (error) {
    console.error('Ошибка установки вебхука:', error)
  }
}