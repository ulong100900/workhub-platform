// app/api/telegram/init/route.ts
import { NextRequest, NextResponse } from 'next/server'
import TelegramBotService from '@/lib/telegram/bot'

export async function GET(request: NextRequest) {
  try {
    const botService = TelegramBotService.getInstance()
    const bot = botService.getBot()

    if (!bot) {
      return NextResponse.json(
        { success: false, error: 'Бот не инициализирован' },
        { status: 500 }
      )
    }

    // Получаем информацию о боте
    const botInfo = await bot.getMe()

    // Настраиваем webhook в продакшене
    if (process.env.NODE_ENV === 'production') {
      const webhookUrl = `${process.env.NEXTAUTH_URL}/api/telegram/webhook`
      await botService.setupWebhook(webhookUrl)
    }

    return NextResponse.json({
      success: true,
      bot: {
        id: botInfo.id,
        username: botInfo.username,
        firstName: botInfo.first_name,
        isBot: botInfo.is_bot
      },
      mode: process.env.NODE_ENV,
      webhook: process.env.NODE_ENV === 'production'
    })

  } catch (error) {
    console.error('Ошибка инициализации бота:', error)
    return NextResponse.json(
      { success: false, error: 'Ошибка инициализации Telegram бота' },
      { status: 500 }
    )
  }
}