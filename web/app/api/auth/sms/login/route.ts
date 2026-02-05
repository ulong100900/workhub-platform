
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Генерация 6-значного кода
function generateSMSCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Форматирование телефона для России
function formatPhoneNumber(phone: string): string {
  // Убираем все нецифровые символы
  const cleaned = phone.replace(/\D/g, '')
  
  // Если начинается с 8, меняем на +7
  if (cleaned.startsWith('8')) {
    return '+7' + cleaned.substring(1)
  }
  
  // Если начинается с 7, добавляем +
  if (cleaned.startsWith('7')) {
    return '+' + cleaned
  }
  
  // Если нет кода страны, добавляем +7
  if (cleaned.length === 10) {
    return '+7' + cleaned
  }
  
  return cleaned
}

// Отправка SMS через sms.ru API
async function sendSMSviaSMSru(phone: string, message: string): Promise<boolean> {
  const API_KEY = process.env.SMS_RU_API_KEY || '19A24BB4-CCE8-3F10-7E57-811ED56FAB36'
  
  try {
    const params = new URLSearchParams({
      api_id: API_KEY,
      to: phone,
      msg: message,
      json: '1',
      from: 'WorkFinder' // Отправитель (до 11 символов)
    })

    const response = await fetch('https://sms.ru/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString()
    })

    const result = await response.json()
    
    if (result.status === 'OK') {
      console.log(`SMS отправлено на ${phone}, стоимость: ${result.sms[phone]?.cost || 0} руб.`)
      return true
    } else {
      console.error('Ошибка отправки SMS:', result.status_text)
      return false
    }
  } catch (error) {
    console.error('Ошибка при вызове SMS API:', error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json()
    
    if (!phone) {
      return NextResponse.json(
        { error: 'Номер телефона обязателен' },
        { status: 400 }
      )
    }

    const formattedPhone = formatPhoneNumber(phone)
    
    // Проверка формата номера (российский номер)
    if (!formattedPhone.startsWith('+7') || formattedPhone.length !== 12) {
      return NextResponse.json(
        { error: 'Введите корректный российский номер телефона' },
        { status: 400 }
      )
    }

    const code = generateSMSCode()
    const supabase = await createClient()
    
    // Проверяем, существует ли пользователь с этим телефоном
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', formattedPhone)
      .single()

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с этим номером не найден' },
        { status: 404 }
      )
    }

    // Удаляем старые коды для этого телефона
    await supabase
      .from('sms_verifications')
      .delete()
      .eq('phone', formattedPhone)

    // Сохраняем новый код (действителен 10 минут)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()
    
    const { error: saveError } = await supabase
      .from('sms_verifications')
      .insert({
        phone: formattedPhone,
        code,
        expires_at: expiresAt,
        attempts: 0,
        created_at: new Date().toISOString(),
        is_login: true // Флаг что это код для входа, а не регистрации
      })

    if (saveError) {
      console.error('Error saving SMS code:', saveError)
      return NextResponse.json(
        { error: 'Ошибка сохранения кода верификации' },
        { status: 500 }
      )
    }

    // Отправляем SMS через sms.ru
    const message = `Ваш код для входа в WorkFinder: ${code}. Никому не сообщайте код.`
    console.log(`Отправляю SMS на ${formattedPhone}: ${message}`)
    
    const smsSent = await sendSMSviaSMSru(formattedPhone, message)

    if (smsSent) {
      console.log(`✅ SMS успешно отправлено на ${formattedPhone}`)
      return NextResponse.json({ 
        success: true,
        message: 'Код отправлен на ваш телефон',
        phone: formattedPhone
      })
    } else {
      console.error(`❌ Ошибка отправки SMS на ${formattedPhone}`)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Не удалось отправить SMS. Попробуйте позже.' 
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Unexpected error in SMS login route:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Внутренняя ошибка сервера' 
      },
      { status: 500 }
    )
  }
}
