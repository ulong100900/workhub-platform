// app/api/telegram/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import TelegramBotService from '@/lib/telegram/bot'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const update = await request.json()
    
    const botService = TelegramBotService.getInstance()
    const bot = botService.getBot()

    if (!bot) {
      return NextResponse.json(
        { success: false, error: 'Бот не инициализирован' },
        { status: 500 }
      )
    }

    // Обрабатываем сообщение
    if (update.message) {
      const message = update.message
      const chatId = message.chat.id
      const text = message.text || ''

      // Обрабатываем код из сообщения (если пользователь прислал код)
      if (/^\d{6}$/.test(text)) {
        const code = text
        
        // Ищем верификацию по коду
        const supabase = createServiceRoleClient()
        const { data: verification } = await supabase
          .from('telegram_verifications')
          .select('*')
          .eq('code', code)
          .eq('status', 'sent')
          .gt('expires_at', new Date().toISOString())
          .single()

        if (verification) {
          // Обновляем информацию о пользователе Telegram
          await supabase
            .from('telegram_verifications')
            .update({
              telegram_user_id: chatId,
              telegram_username: message.from?.username,
              telegram_first_name: message.from?.first_name,
              telegram_last_name: message.from?.last_name,
              telegram_language_code: message.from?.language_code
            })
            .eq('id', verification.id)

          // Отправляем подтверждение пользователю
          await bot.sendMessage(chatId, 
            `✅ Отлично! Код принят.\n\nТеперь вернитесь на сайт WorkFinder для завершения входа.`,
            { parse_mode: 'HTML' }
          )
        } else {
          await bot.sendMessage(chatId,
            `❌ Код не найден или истек.\n\nПожалуйста, запросите новый код на сайте.`,
            { parse_mode: 'HTML' }
          )
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Ошибка обработки webhook:', error)
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка' },
      { status: 500 }
    )
  }
}