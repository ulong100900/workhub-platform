import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// Форматирование телефона
function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('8')) return '+7' + cleaned.substring(1)
  if (cleaned.startsWith('7')) return '+' + cleaned
  if (cleaned.length === 10) return '+7' + cleaned
  return cleaned
}

export async function POST(request: NextRequest) {
  try {
    const { phone, code, rememberMe = false } = await request.json()
    
    if (!phone || !code) {
      return NextResponse.json(
        { error: 'Номер телефона и код обязательны' },
        { status: 400 }
      )
    }

    const formattedPhone = formatPhoneNumber(phone)
    const supabase = await createClient()
    
    // Ищем код верификации (только для входа)
    const { data: verification, error: verificationError } = await supabase
      .from('sms_verifications')
      .select('*')
      .eq('phone', formattedPhone)
      .eq('code', code)
      .eq('is_login', true) // Только коды для входа
      .gt('expires_at', new Date().toISOString())
      .lt('attempts', 5) // Не больше 5 попыток
      .single()

    if (verificationError || !verification) {
      // Увеличиваем счетчик попыток
      await supabase
        .from('sms_verifications')
        .update({ 
          attempts: verification?.attempts ? verification.attempts + 1 : 1 
        })
        .eq('phone', formattedPhone)
      
      return NextResponse.json(
        { error: 'Неверный код или время истекло' },
        { status: 400 }
      )
    }

    // Находим пользователя по телефону
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('phone', formattedPhone)
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      )
    }

    // Проверяем статус аккаунта
    if (profile.status !== 'active') {
      return NextResponse.json(
        { error: `Аккаунт ${profile.status}` },
        { status: 403 }
      )
    }

    // Генерируем временный пароль для входа
    const tempPassword = `${formattedPhone}${code}`
    
    // Входим в систему
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password: tempPassword
    })

    if (signInError) {
      // Если не удалось войти с временным паролем, возможно пользователь добавил email
      // Пробуем найти реальный email
      if (profile.email && !profile.email.includes('@temp.workfinder')) {
        return NextResponse.json({
          error: 'Используйте вход по email и паролю',
          hasEmail: true
        })
      }
      
      throw signInError
    }

    // Настройка сессии
    if (rememberMe) {
      const cookieStore = cookies()
      cookieStore.set('remember_me', 'true', {
        maxAge: 30 * 24 * 60 * 60, // 30 дней
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      })
    }

    // Удаляем использованный код
    await supabase
      .from('sms_verifications')
      .delete()
      .eq('id', verification.id)

    // Обновляем время последнего входа
    await supabase
      .from('profiles')
      .update({
        last_login: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id)

    return NextResponse.json({
      success: true,
      message: 'Вход выполнен',
      user: {
        id: signInData.user.id,
        phone: formattedPhone,
        hasEmail: profile.email && !profile.email.includes('@temp.workfinder'),
        email: profile.email
      },
      session: signInData.session
    })
    
  } catch (error: any) {
    console.error('Login SMS verify error:', error)
    
    let errorMessage = 'Ошибка входа'
    
    if (error.message?.includes('Invalid login credentials')) {
      errorMessage = 'Неверный код'
    } else if (error.message?.includes('rate limit')) {
      errorMessage = 'Слишком много попыток. Попробуйте позже'
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}