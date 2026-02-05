// app/api/auth/telegram/resend/[requestId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import TelegramBotService from '@/lib/telegram/bot'

export async function POST(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  try {
    const requestId = params.requestId

    const supabase = createServiceRoleClient()

    // Получаем существующую верификацию
    const { data: verification } = await supabase
      .from('telegram_verifications')
      .select('*')
      .eq('id', requestId)
      .single()

    if (!verification) {
      return NextResponse.json(
        { success: false, error: 'Запрос не найден' },
        { status: 404 }
      )
    }

    // Проверяем можно ли повторно отправить
    const now = new Date()
    const lastSent = new Date(verification.updated_at)
    const cooldown = 30 * 1000 // 30 секунд

    if (now.getTime() - lastSent.getTime() < cooldown) {
      const waitSeconds = Math.ceil((cooldown - (now.getTime() - lastSent.getTime())) / 1000)
      return NextResponse.json(
        { 
          success: false, 
          error: `Подождите ${waitSeconds} секунд перед повторной отправкой` 
        },
        { status: 429 }
      )
    }

    // Отправляем код через Telegram
    const botService = TelegramBotService.getInstance()
    const sent = await botService.sendVerificationCode(
      verification.phone,
      verification.code,
      verification.telegram_user_id
    )

    if (!sent) {
      return NextResponse.json(
        { success: false, error: 'Не удалось отправить код в Telegram' },
        { status: 500 }
      )
    }

    // Обновляем время отправки
    await supabase
      .from('telegram_verifications')
      .update({ updated_at: now.toISOString() })
      .eq('id', requestId)

    return NextResponse.json({
      success: true,
      message: 'Код отправлен повторно',
      expiresIn: Math.floor((new Date(verification.expires_at).getTime() - now.getTime()) / 1000)
    })

  } catch (error) {
    console.error('Ошибка повторной отправки кода:', error)
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// app/api/auth/telegram/check/[phone]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { phone: string } }
) {
  try {
    const phone = decodeURIComponent(params.phone)
    const cleanedPhone = phone.replace(/\D/g, '')

    const supabase = createServiceRoleClient()

    // Проверяем, есть ли пользователь с таким номером
    const { data: user } = await supabase
      .from('users')
      .select('id, phone, telegram_user_id, telegram_username')
      .eq('phone', cleanedPhone)
      .single()

    return NextResponse.json({
      success: true,
      exists: !!user,
      hasTelegram: !!user?.telegram_user_id,
      user: user || null
    })

  } catch (error) {
    return NextResponse.json({
      success: true,
      exists: false,
      hasTelegram: false,
      user: null
    })
  }
}