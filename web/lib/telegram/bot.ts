// lib/telegram/bot.ts
import TelegramBot from 'node-telegram-bot-api'
import { createClient } from '@supabase/supabase-js'

interface TelegramUser {
  id: number
  username?: string
  first_name?: string
  last_name?: string
  language_code?: string
  phone?: string
}

interface VerificationRecord {
  id: string
  phone: string
  code: string
  status: 'pending' | 'sent' | 'verified' | 'expired' | 'failed'
  telegram_user_id?: number
  expires_at: Date
}

class TelegramBotService {
  private bot: TelegramBot
  private supabase: ReturnType<typeof createClient>
  private static instance: TelegramBotService
  private isInitialized = false
  private webhookUrl?: string

  private constructor() {
    // Инициализируем Supabase клиент
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    this.initializeBot()
  }

  public static getInstance(): TelegramBotService {
    if (!TelegramBotService.instance) {
      TelegramBotService.instance = new TelegramBotService()
    }
    return TelegramBotService.instance
  }

  private async initializeBot(): Promise<void> {
    const token = process.env.TELEGRAM_BOT_TOKEN
    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN не настроен в переменных окружения')
    }

    try {
      const isProduction = process.env.NODE_ENV === 'production'
      
      if (isProduction) {
        // В продакшене используем webhook
        this.webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/telegram/webhook`
        
        this.bot = new TelegramBot(token, {
          webHook: true,
          // Отключаем polling в продакшене
          polling: false
        })

        // Устанавливаем webhook
        await this.setupWebhook(this.webhookUrl)
      } else {
        // В разработке используем polling
        this.bot = new TelegramBot(token, {
          polling: {
            interval: 300,
            autoStart: true,
            params: {
              timeout: 10
            }
          }
        })
      }

      await this.setupCommands()
      await this.setupMessageHandlers()
      
      this.isInitialized = true
      console.log('🤖 Telegram Bot инициализирован успешно')
      console.log(`📱 Режим: ${isProduction ? 'Production (Webhook)' : 'Development (Polling)'}`)
      
      if (isProduction && this.webhookUrl) {
        console.log(`🔗 Webhook URL: ${this.webhookUrl}`)
      }
      
    } catch (error) {
      console.error('Ошибка инициализации Telegram бота:', error)
      throw error
    }
  }

  private async setupCommands(): Promise<void> {
    try {
      await this.bot.setMyCommands([
        {
          command: '/start',
          description: 'Запустить бота и получить информацию'
        },
        {
          command: '/help',
          description: 'Показать помощь'
        },
        {
          command: '/login',
          description: 'Войти в WorkFinder через Telegram'
        },
        {
          command: '/profile',
          description: 'Мой профиль WorkFinder'
        },
        {
          command: '/support',
          description: 'Связаться с поддержкой'
        }
      ])
      
      console.log('✅ Команды бота настроены')
    } catch (error) {
      console.error('Ошибка настройки команд:', error)
    }
  }

  private async setupMessageHandlers(): Promise<void> {
    // Обработчик команды /start
    this.bot.onText(/\/start(?: (.+))?/, async (msg, match) => {
      try {
        const chatId = msg.chat.id
        const referralCode = match?.[1]
        
        // Регистрируем пользователя в системе
        await this.registerOrUpdateUser(msg.from!, msg.chat)
        
        // Логируем реферальный код если есть
        if (referralCode) {
          await this.handleReferralCode(chatId, referralCode)
        }
        
        const welcomeMessage = this.createWelcomeMessage(msg.from!)
        
        await this.bot.sendMessage(chatId, welcomeMessage, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                { 
                  text: '🔐 Войти в WorkFinder', 
                  callback_data: 'start_login' 
                }
              ],
              [
                { 
                  text: '🌐 Открыть сайт', 
                  url: process.env.NEXT_PUBLIC_APP_URL || 'https://workfinder.example.com'
                }
              ]
            ]
          }
        })
        
        // Отправляем второе сообщение с инструкцией
        await this.sendMessageWithDelay(chatId, `
📱 <b>Как использовать бота:</b>

1. <b>На сайте:</b> Нажмите "Войти через Telegram"
2. <b>Введите номер телефона:</b> Тот, что привязан к этому Telegram аккаунту
3. <b>Получите код здесь:</b> Бот пришлет 6-значный код
4. <b>Введите код на сайте:</b> Для завершения входа

Используйте команду /login для начала процесса входа.
        `, 500)
        
      } catch (error) {
        console.error('Ошибка обработки /start:', error)
      }
    })

    // Обработчик команды /help
    this.bot.onText(/\/help/, async (msg) => {
      try {
        const chatId = msg.chat.id
        
        const helpMessage = `
🆘 <b>Помощь по боту WorkFinder</b>

<b>Основные команды:</b>
/start - Зарегистрироваться в системе
/login - Начать процесс входа
/profile - Посмотреть мой профиль
/support - Связаться с поддержкой

<b>Процесс входа:</b>
1. На сайте нажмите "Войти через Telegram"
2. Введите номер телефона этого Telegram аккаунта
3. Получите 6-значный код здесь
4. Введите код на сайте

<b>Безопасность:</b>
• Никогда не передавайте коды подтверждения
• Бот никогда не запросит ваш пароль
• Все коды действительны 10 минут

<b>Поддержка:</b>
Email: support@workfinder.com
Телефон: +7 (XXX) XXX-XX-XX
        `
        
        await this.bot.sendMessage(chatId, helpMessage, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                { 
                  text: '📞 Связаться с поддержкой', 
                  url: 'https://t.me/workfinder_support'
                }
              ],
              [
                { 
                  text: '📖 FAQ и инструкции', 
                  url: `${process.env.NEXT_PUBLIC_APP_URL}/help`
                }
              ]
            ]
          }
        })
      } catch (error) {
        console.error('Ошибка обработки /help:', error)
      }
    })

    // Обработчик команды /login
    this.bot.onText(/\/login/, async (msg) => {
      try {
        const chatId = msg.chat.id
        
        // Проверяем, есть ли активная сессия
        const userProfile = await this.getUserProfile(chatId)
        
        if (userProfile?.user_id) {
          // У пользователя уже есть аккаунт
          await this.bot.sendMessage(chatId, `
✅ <b>У вас уже есть аккаунт WorkFinder</b>

ID пользователя: <code>${userProfile.user_id}</code>
Имя: ${userProfile.first_name || 'Не указано'}
Телефон: ${userProfile.phone || 'Не указан'}

Чтобы войти на сайт:
1. Нажмите "Войти через Telegram" на сайте
2. Введите номер телефона: ${userProfile.phone || 'требуется ввести'}
3. Получите код здесь
4. Введите код на сайте
          `, {
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [
                  { 
                    text: '🚀 Быстрый вход', 
                    web_app: { 
                      url: `${process.env.NEXT_PUBLIC_APP_URL}/auth/telegram?userId=${chatId}` 
                    }
                  }
                ]
              ]
            }
          })
        } else {
          // Новый пользователь
          await this.bot.sendMessage(chatId, `
🔐 <b>Вход через Telegram</b>

Чтобы войти в WorkFinder:
1. Перейдите на сайт ${process.env.NEXT_PUBLIC_APP_URL || 'WorkFinder'}
2. Нажмите "Войти через Telegram"
3. Введите ваш номер телефона
4. Получите код подтверждения здесь
5. Введите код на сайте

Если у вас еще нет аккаунта - он создастся автоматически!
          `, {
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [
                  { 
                    text: '🌐 Открыть сайт для входа', 
                    url: `${process.env.NEXT_PUBLIC_APP_URL}/auth/telegram`
                  }
                ]
              ]
            }
          })
        }
      } catch (error) {
        console.error('Ошибка обработки /login:', error)
      }
    })

    // Обработчик команды /profile
    this.bot.onText(/\/profile/, async (msg) => {
      try {
        const chatId = msg.chat.id
        const userProfile = await this.getUserProfile(chatId)
        
        if (!userProfile) {
          await this.bot.sendMessage(chatId, `
👤 <b>Профиль не найден</b>

Вы еще не зарегистрированы в системе WorkFinder.

Используйте команду /start для регистрации.
          `, {
            parse_mode: 'HTML'
          })
          return
        }
        
        const profileMessage = `
👤 <b>Ваш профиль WorkFinder</b>

<b>Основная информация:</b>
🆔 ID: <code>${userProfile.user_id}</code>
📱 Телефон: ${userProfile.phone || 'Не указан'}
👤 Имя: ${userProfile.first_name || 'Не указано'}
📅 Регистрация: ${new Date(userProfile.created_at).toLocaleDateString('ru-RU')}

<b>Статистика:</b>
📊 Завершено заказов: ${userProfile.completed_orders || 0}
⭐ Рейтинг: ${userProfile.rating || 'Нет рейтинга'}
💼 Статус: ${userProfile.status || 'Активен'}

<b>Действия:</b>
Используйте /login для входа на сайт
        `
        
        await this.bot.sendMessage(chatId, profileMessage, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                { 
                  text: '✏️ Редактировать профиль', 
                  web_app: { 
                    url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/profile` 
                  }
                }
              ],
              [
                { 
                  text: '📊 Моя статистика', 
                  web_app: { 
                    url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/stats` 
                  }
                }
              ]
            ]
          }
        })
      } catch (error) {
        console.error('Ошибка обработки /profile:', error)
      }
    })

    // Обработчик callback query
    this.bot.on('callback_query', async (callbackQuery) => {
      try {
        const chatId = callbackQuery.message?.chat.id
        const data = callbackQuery.data
        
        if (!chatId || !data) return
        
        switch (data) {
          case 'start_login':
            await this.bot.sendMessage(chatId, `
🔐 <b>Начало процесса входа</b>

Перейдите на сайт WorkFinder и нажмите "Войти через Telegram".

Сайт: ${process.env.NEXT_PUBLIC_APP_URL}
            `, {
              parse_mode: 'HTML'
            })
            break
        }
        
        // Ответим на callback query
        await this.bot.answerCallbackQuery(callbackQuery.id)
      } catch (error) {
        console.error('Ошибка обработки callback query:', error)
      }
    })

    // Обработчик текстовых сообщений (для кодов подтверждения)
    this.bot.on('message', async (msg) => {
      try {
        // Игнорируем команды
        if (msg.text?.startsWith('/')) return
        
        const chatId = msg.chat.id
        const text = msg.text
        
        // Проверяем, не является ли сообщение кодом подтверждения
        if (text && /^\d{6}$/.test(text)) {
          await this.handlePossibleCode(chatId, text)
        }
      } catch (error) {
        console.error('Ошибка обработки сообщения:', error)
      }
    })
    
    console.log('✅ Обработчики сообщений настроены')
  }

  private async registerOrUpdateUser(user: TelegramUser, chat: any): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('telegram_users')
        .upsert({
          telegram_id: user.id,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          language_code: user.language_code,
          chat_id: chat.id,
          chat_type: chat.type,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'telegram_id'
        })

      if (error) {
        console.error('Ошибка регистрации пользователя:', error)
      } else {
        console.log(`✅ Пользователь ${user.id} зарегистрирован/обновлен`)
      }
    } catch (error) {
      console.error('Ошибка в registerOrUpdateUser:', error)
    }
  }

  private createWelcomeMessage(user: TelegramUser): string {
    const name = user.first_name || user.username || 'Друг'
    
    return `
👋 <b>Привет, ${name}!</b>

Добро пожаловать в <b>WorkFinder Bot</b> — вашего помощника для быстрого и безопасного доступа к платформе WorkFinder!

<b>С моей помощью вы можете:</b>
• 🔐 <b>Мгновенно входить</b> в аккаунт WorkFinder без пароля
• 📱 <b>Получать коды подтверждения</b> для безопасной авторизации
• 🔔 <b>Получать уведомления</b> о новых заказах и сообщениях
• 📊 <b>Следить за статистикой</b> и рейтингом
• ⚡ <b>Быстро переходить</b> на сайт прямо из Telegram

<b>Безопасность превыше всего:</b>
• 🔒 Все данные защищены шифрованием
• ⏱️ Коды действительны только 10 минут
• 📞 Подтверждение через ваш номер телефона

Начните с команды /login для входа в систему!

<code>Bot ID: ${user.id}</code>
    `
  }

  private async sendMessageWithDelay(chatId: number, text: string, delay: number): Promise<void> {
    setTimeout(async () => {
      try {
        await this.bot.sendMessage(chatId, text, {
          parse_mode: 'HTML'
        })
      } catch (error) {
        console.error('Ошибка отправки отложенного сообщения:', error)
      }
    }, delay)
  }

  private async handleReferralCode(chatId: number, code: string): Promise<void> {
    try {
      // Логируем реферальный код
      const { error } = await this.supabase
        .from('referral_logs')
        .insert({
          telegram_id: chatId,
          referral_code: code,
          created_at: new Date().toISOString()
        })

      if (!error) {
        console.log(`📊 Реферальный код ${code} залогирован для пользователя ${chatId}`)
      }
    } catch (error) {
      console.error('Ошибка обработки реферального кода:', error)
    }
  }

  private async getUserProfile(telegramId: number): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('telegram_users')
        .select(`
          *,
          profiles:user_id (
            id,
            phone,
            first_name,
            last_name,
            rating,
            completed_orders,
            status,
            created_at
          )
        `)
        .eq('telegram_id', telegramId)
        .single()

      if (error) {
        console.error('Ошибка получения профиля:', error)
        return null
      }

      return {
        ...data,
        ...(data.profiles ? data.profiles[0] : {})
      }
    } catch (error) {
      console.error('Ошибка в getUserProfile:', error)
      return null
    }
  }

  private async handlePossibleCode(chatId: number, code: string): Promise<void> {
    try {
      // Проверяем, есть ли активная верификация с этим кодом
      const { data: verification, error } = await this.supabase
        .from('telegram_verifications')
        .select('*')
        .eq('telegram_user_id', chatId)
        .eq('code', code)
        .eq('status', 'sent')
        .gt('expires_at', new Date().toISOString())
        .single()

      if (error || !verification) {
        // Это не код верификации, игнорируем
        return
      }

      // Отправляем предупреждение
      await this.bot.sendMessage(chatId, `
⚠️ <b>Обнаружен код подтверждения!</b>

Код <code>${code}</code> используется для входа в WorkFinder.

<b>Никому не сообщайте этот код!</b>

Если вы не пытаетесь войти в систему, проигнорируйте это сообщение.
      `, {
        parse_mode: 'HTML'
      })
    } catch (error) {
      console.error('Ошибка обработки возможного кода:', error)
    }
  }

  /**
   * Отправляет код верификации пользователю в Telegram
   */
  public async sendVerificationCode(
    phone: string,
    code: string,
    telegramUserId: number
  ): Promise<{
    success: boolean
    messageId?: number
    error?: string
  }> {
    if (!this.isInitialized || !this.bot) {
      return {
        success: false,
        error: 'Бот не инициализирован'
      }
    }

    try {
      // Сохраняем запись о верификации
      const { data: verification, error: verificationError } = await this.supabase
        .from('telegram_verifications')
        .insert({
          phone: phone,
          code: code,
          telegram_user_id: telegramUserId,
          status: 'sent',
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
        })
        .select()
        .single()

      if (verificationError) {
        console.error('Ошибка сохранения верификации:', verificationError)
        return {
          success: false,
          error: 'Ошибка сохранения кода'
        }
      }

      const message = `
🔐 <b>Код для входа в WorkFinder</b>

<code>${code}</code>

<b>Инструкции:</b>
1. Вернитесь на сайт WorkFinder
2. Введите этот 6-значный код
3. Нажмите "Подтвердить"

⏱️ <i>Код действителен 10 минут</i>
📱 <i>Для номера: ${phone}</i>

⚠️ <b>ВНИМАНИЕ:</b> Никогда не передавайте этот код третьим лицам!
      `

      const sentMessage = await this.bot.sendMessage(telegramUserId, message, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { 
                text: '🚀 Продолжить на сайте', 
                url: `${process.env.NEXT_PUBLIC_APP_URL}/auth/telegram/verify`
              }
            ]
          ]
        }
      })

      // Логируем отправку
      await this.supabase
        .from('message_logs')
        .insert({
          telegram_id: telegramUserId,
          message_type: 'verification_code',
          message_id: sentMessage.message_id,
          verification_id: verification.id,
          created_at: new Date().toISOString()
        })

      console.log(`✅ Код отправлен пользователю ${telegramUserId}`)

      return {
        success: true,
        messageId: sentMessage.message_id
      }

    } catch (error: any) {
      console.error('Ошибка отправки кода в Telegram:', error)
      
      let errorMessage = 'Неизвестная ошибка'
      let errorCode = 'UNKNOWN_ERROR'
      
      if (error.code === 'ETELEGRAM') {
        const errorCode = error.response?.body?.error_code
        
        switch (errorCode) {
          case 403:
            errorMessage = 'Пользователь заблокировал бота'
            break
          case 400:
            errorMessage = 'Пользователь не найден или не начинал диалог с ботом'
            break
          case 429:
            errorMessage = 'Превышен лимит отправки сообщений'
            break
          default:
            errorMessage = `Ошибка Telegram API: ${errorCode}`
        }
      }
      
      return {
        success: false,
        error: errorMessage
      }
    }
  }

  /**
   * Получает информацию о пользователе по его Telegram ID
   */
  public async getUserInfo(telegramUserId: number): Promise<TelegramUser | null> {
    if (!this.isInitialized || !this.bot) {
      return null
    }

    try {
      // Сначала пробуем получить из базы
      const { data: dbUser, error } = await this.supabase
        .from('telegram_users')
        .select('*')
        .eq('telegram_id', telegramUserId)
        .single()

      if (!error && dbUser) {
        return {
          id: dbUser.telegram_id,
          username: dbUser.username,
          first_name: dbUser.first_name,
          last_name: dbUser.last_name,
          language_code: dbUser.language_code
        }
      }

      // Если нет в базе, пробуем получить через API
      const user = await this.bot.getChat(telegramUserId)
      
      const telegramUser: TelegramUser = {
        id: user.id,
        username: (user as any).username,
        first_name: (user as any).first_name,
        last_name: (user as any).last_name,
        language_code: (user as any).language_code
      }

      // Сохраняем в базу
      await this.supabase
        .from('telegram_users')
        .upsert({
          telegram_id: telegramUser.id,
          username: telegramUser.username,
          first_name: telegramUser.first_name,
          last_name: telegramUser.last_name,
          language_code: telegramUser.language_code,
          chat_id: telegramUser.id,
          chat_type: 'private',
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      return telegramUser

    } catch (error: any) {
      console.error('Ошибка получения информации о пользователе:', error)
      
      // Если пользователь не начинал диалог с ботом
      if (error.code === 400 && error.response?.body?.description?.includes('chat not found')) {
        console.error(`Пользователь ${telegramUserId} не начинал диалог с ботом`)
      }
      
      return null
    }
  }

  /**
   * Отправляет уведомление о успешной авторизации
   */
  public async sendAuthSuccessNotification(
    telegramUserId: number,
    userName: string
  ): Promise<boolean> {
    if (!this.isInitialized || !this.bot) {
      return false
    }

    try {
      const message = `
✅ <b>Успешный вход в WorkFinder</b>

Добро пожаловать, ${userName}!

Вы успешно вошли в свой аккаунт WorkFinder.

<b>Безопасность:</b>
📱 Если это были не вы, немедленно сообщите в поддержку:
🔗 ${process.env.NEXT_PUBLIC_APP_URL}/support

<b>Что дальше?</b>
👤 Заполните профиль для получения больше заказов
📊 Отслеживайте статистику в разделе "Профиль"
🔔 Настройте уведомления о новых заказах

Рады видеть вас снова! 😊
      `

      await this.bot.sendMessage(telegramUserId, message, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { 
                text: '👤 Мой профиль', 
                web_app: { 
                  url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/profile` 
                }
              },
              { 
                text: '📊 Статистика', 
                web_app: { 
                  url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/stats` 
                }
              }
            ]
          ]
        }
      })

      console.log(`✅ Уведомление об успешной авторизации отправлено пользователю ${telegramUserId}`)
      return true

    } catch (error) {
      console.error('Ошибка отправки уведомления:', error)
      return false
    }
  }

  /**
   * Устанавливает webhook для продакшена
   */
  public async setupWebhook(webhookUrl: string): Promise<boolean> {
    if (!this.bot) return false

    try {
      // Удаляем старый webhook
      await this.bot.deleteWebHook()
      
      // Устанавливаем новый
      await this.bot.setWebHook(webhookUrl, {
        max_connections: 40,
        allowed_updates: ['message', 'callback_query', 'chat_member']
      })
      
      // Проверяем webhook
      const webhookInfo = await this.bot.getWebHookInfo()
      
      console.log('✅ Webhook установлен:', webhookUrl)
      console.log('📊 Информация о webhook:', {
        url: webhookInfo.url,
        has_custom_certificate: webhookInfo.has_custom_certificate,
        pending_update_count: webhookInfo.pending_update_count,
        last_error_date: webhookInfo.last_error_date,
        last_error_message: webhookInfo.last_error_message
      })
      
      return true
    } catch (error) {
      console.error('Ошибка установки webhook:', error)
      return false
    }
  }

  /**
   * Обработчик webhook (для продакшена)
   */
  public processUpdate(update: any): void {
    if (!this.isInitialized || !this.bot) {
      console.error('Бот не инициализирован для обработки update')
      return
    }

    try {
      this.bot.processUpdate(update)
    } catch (error) {
      console.error('Ошибка обработки update:', error)
    }
  }

  /**
   * Получает информацию о боте
   */
  public async getBotInfo(): Promise<any> {
    if (!this.isInitialized || !this.bot) {
      return null
    }

    try {
      const botInfo = await this.bot.getMe()
      const webhookInfo = await this.bot.getWebHookInfo()
      
      return {
        bot: {
          id: botInfo.id,
          username: botInfo.username,
          first_name: botInfo.first_name,
          can_join_groups: botInfo.can_join_groups,
          can_read_all_group_messages: botInfo.can_read_all_group_messages,
          supports_inline_queries: botInfo.supports_inline_queries
        },
        webhook: {
          url: webhookInfo.url,
          has_custom_certificate: webhookInfo.has_custom_certificate,
          pending_update_count: webhookInfo.pending_update_count,
          last_error_date: webhookInfo.last_error_date,
          last_error_message: webhookInfo.last_error_message
        },
        status: 'active',
        initialized: this.isInitialized,
        mode: process.env.NODE_ENV === 'production' ? 'webhook' : 'polling'
      }
    } catch (error) {
      console.error('Ошибка получения информации о боте:', error)
      return null
    }
  }

  /**
   * Останавливает бота
   */
  public async stop(): Promise<void> {
    if (this.bot) {
      try {
        if (process.env.NODE_ENV === 'development') {
          await this.bot.stopPolling()
        } else {
          await this.bot.deleteWebHook()
        }
        console.log('🛑 Telegram Bot остановлен')
      } catch (error) {
        console.error('Ошибка остановки бота:', error)
      }
    }
  }

  public getBot(): TelegramBot | null {
    return this.bot
  }

  public isBotInitialized(): boolean {
    return this.isInitialized
  }
}

export default TelegramBotService

// Создаем и экспортируем экземпляр бота
export const telegramBot = TelegramBotService.getInstance()