import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Создаем клиент с SERVICE_ROLE_KEY
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ИСПОЛЬЗУЙТЕ ПРАВИЛЬНОЕ ИМЯ
)

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()
    
    if (!code || typeof code !== 'string' || !/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { success: false, error: 'Неверный формат кода' },
        { status: 400 }
      )
    }
    
    // Временный mock вместо реальной проверки кода Telegram
    // Для сборки просто возвращаем ошибку
    return NextResponse.json(
      { 
        success: false, 
        error: 'Telegram auth is disabled for build',
        code: 'BUILD_DISABLED'
      },
      { status: 503 }
    )
    
  } catch (error: any) {
    console.error('Telegram auth error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Ошибка авторизации',
        code: 'AUTH_ERROR'
      },
      { status: 500 }
    )
  }
}

// GET метод для проверки статуса
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    service: 'Telegram Auth API',
    status: 'active',
    botUsername: process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'register_injob_bot',
    features: ['code_auth', 'user_registration', 'session_management']
  })
}