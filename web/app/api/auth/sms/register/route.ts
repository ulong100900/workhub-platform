
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Генерация 6-значного кода
function generateSMSCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Форматирование телефона
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
    const { phone, name } = await request.json()
    
    console.log('=== REGISTRATION SMS REQUEST ===')
    console.log('Phone:', phone, 'Name:', name)
    
    if (!phone || !name) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Номер телефона и имя обязательны' 
        },
        { status: 400 }
      )
    }

    const formattedPhone = formatPhoneNumber(phone)
    
    // Проверка формата номера
    if (!formattedPhone.startsWith('+7') || formattedPhone.length !== 12) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Введите корректный российский номер телефона' 
        },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Проверяем, НЕ существует ли пользователь с этим телефоном
    // Для регистрации пользователь НЕ должен существовать
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', formattedPhone)
      .single()

    console.log('Existing user check:', existingUser)

    // Если пользователь УЖЕ существует - это ошибка для регистрации
    if (existingUser) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Пользователь с таким номером уже зарегистрирован. Используйте вход.' 
        },
        { status: 400 }
      )
    }

    const code = generateSMSCode()
    
    // Удаляем старые коды для этого телефона
    await supabase
      .from('sms_verifications')
      .delete()
      .eq('phone', formattedPhone)

    // Сохраняем новый код с именем пользователя
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()
    
    const { error: saveError } = await supabase
      .from('sms_verifications')
      .insert({
        phone: formattedPhone,
        code,
        name: name.trim(),
        expires_at: expiresAt,
        attempts: 0,
        created_at: new Date().toISOString(),
        is_login: false // Флаг что это регистрация, а не вход
      })

    if (saveError) {
      console.error('Error saving SMS code:', saveError)
      return NextResponse.json(
        { 
          success: false,
          error: 'Ошибка сохранения кода верификации' 
        },
        { status: 500 }
      )
    }

    // Для разработки - не отправляем реальное SMS
    console.log(`✅ [DEV] Код для регистрации ${formattedPhone}: ${code}`)
    
    return NextResponse.json({ 
      success: true,
      message: 'Код отправлен на ваш телефон',
      phone: formattedPhone,
      code: code, // Для разработки возвращаем код
      test_mode: true
    })
    
  } catch (error: any) {
    console.error('Registration SMS error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Внутренняя ошибка сервера',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
