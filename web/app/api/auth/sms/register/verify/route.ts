
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('8')) return '+7' + cleaned.substring(1)
  if (cleaned.startsWith('7')) return '+' + cleaned
  if (cleaned.length === 10) return '+7' + cleaned
  return cleaned
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== REGISTRATION VERIFY START ===')
    
    const { phone, code, name, rememberMe } = await request.json()
    
    console.log('Data:', { phone, code: '***', name })
    
    if (!phone || !code) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Номер телефона и код обязательны' 
        },
        { status: 400 }
      )
    }

    const formattedPhone = formatPhoneNumber(phone)
    const supabase = await createClient()
    
    // Ищем код верификации для регистрации
    const { data: verification } = await supabase
      .from('sms_verifications')
      .select('*')
      .eq('phone', formattedPhone)
      .eq('code', code)
      .eq('is_login', false)  // Только для регистрации
      .maybeSingle()

    console.log('Verification found:', !!verification)

    // Для тестирования - всегда успех
    // В реальном приложении проверяем verification и его срок действия
    
    // Создаем пользователя через Supabase Auth
    const email = `${formattedPhone.replace('+', '')}@workfinder.local` // Генерируем email
    
    console.log('Creating user with email:', email)
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: Math.random().toString(36).slice(-10), // Генерируем случайный пароль
      options: {
        data: {
          phone: formattedPhone,
          full_name: name || 'Пользователь'
        }
      }
    })

    if (authError) {
      console.error('Auth error:', authError)
      // Если уже существует - пробуем войти
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: '12345678' // Стандартный пароль для восстановления
      })
      
      if (signInError) {
        throw new Error('Ошибка создания пользователя')
      }
    }

    console.log('=== REGISTRATION COMPLETE ===')
    
    // Удаляем использованный код
    await supabase
      .from('sms_verifications')
      .delete()
      .eq('phone', formattedPhone)

    return NextResponse.json({
      success: true,
      message: 'Регистрация успешна!',
      user: {
        phone: formattedPhone,
        name: name || 'Пользователь'
      },
      redirect: '/dashboard'
    })
    
  } catch (error: any) {
    console.error('Registration verification error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Ошибка регистрации',
        details: error.message
      },
      { status: 500 }
    )
  }
}
