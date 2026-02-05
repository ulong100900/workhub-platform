
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Генерация 6-значного кода
function generateSMSCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Форматирование телефона для России
function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.startsWith('8')) {
    return '+7' + cleaned.substring(1)
  }
  
  if (cleaned.startsWith('7')) {
    return '+' + cleaned
  }
  
  if (cleaned.length === 10) {
    return '+7' + cleaned
  }
  
  return cleaned
}

export async function POST(request: NextRequest) {
  try {
    const { phone, name, isRegistration = false } = await request.json() // ← Добавил isRegistration
    
    if (!phone) {
      return NextResponse.json(
        { error: 'Номер телефона обязателен' },
        { status: 400 }
      )
    }

    const formattedPhone = formatPhoneNumber(phone)
    
    // Проверка формата номера
    if (!formattedPhone.startsWith('+7') || formattedPhone.length !== 12) {
      return NextResponse.json(
        { error: 'Введите корректный российский номер телефона' },
        { status: 400 }
      )
    }

    const code = generateSMSCode()
    const supabase = await createClient()
    
    // Проверяем существование пользователя
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', formattedPhone)
      .single()

    // ====== ИЗМЕНЕНИЕ ТУТ ======
    // Если это РЕГИСТРАЦИЯ и пользователь УЖЕ существует - ошибка
    if (isRegistration && existingUser) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Пользователь с таким номером уже зарегистрирован' 
        },
        { status: 400 }
      )
    }
    
    // Если это ВХОД и пользователь НЕ существует - ошибка
    if (!isRegistration && !existingUser) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Пользователь с этим номером не найден. Пройдите регистрацию.' 
        },
        { status: 404 }
      )
    }
    // ===========================

    // Удаляем старые коды для этого телефона
    await supabase
      .from('sms_verifications')
      .delete()
      .eq('phone', formattedPhone)

    // Сохраняем новый код
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()
    
    const { error: saveError } = await supabase
      .from('sms_verifications')
      .insert({
        phone: formattedPhone,
        code,
        name: name || null, // Сохраняем имя для регистрации
        expires_at: expiresAt,
        attempts: 0,
        created_at: new Date().toISOString(),
        is_login: !isRegistration // false для регистрации, true для входа
      })

    if (saveError) {
      console.error('Error saving SMS code:', saveError)
      return NextResponse.json(
        { error: 'Ошибка сохранения кода верификации' },
        { status: 500 }
      )
    }

    // В режиме разработки просто возвращаем код
    console.log(`[DEV] Код для ${isRegistration ? 'регистрации' : 'входа'} ${formattedPhone}: ${code}`)
    
    const responseData: any = {
      success: true,
      message: 'Код отправлен',
      phone: formattedPhone,
      isRegistration
    }
    
    if (process.env.NODE_ENV === 'development') {
      responseData.code = code
    }
    
    return NextResponse.json(responseData)
    
  } catch (error: any) {
    console.error('SMS API error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Ошибка отправки SMS',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
