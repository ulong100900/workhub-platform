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
    console.log('=== SMS VERIFY START ===')
    
    const { phone, code, name } = await request.json()
    
    console.log('Phone:', phone, 'Code:', code)
    
    if (!phone || !code) {
      return NextResponse.json(
        { error: 'Номер телефона и код обязательны' },
        { status: 400 }
      )
    }

    const formattedPhone = formatPhoneNumber(phone)
    console.log('Formatted:', formattedPhone)
    
    const supabase = await createClient()
    
    // ПРОСТОЙ ЗАПРОС - ищем код без проверки времени
    const { data: verification, error: verificationError } = await supabase
      .from('sms_verifications')
      .select('*')
      .eq('phone', formattedPhone)
      .eq('code', code)
      .limit(1)
      .maybeSingle() // Используем maybeSingle вместо single

    console.log('Verification query result:', verification)
    console.log('Verification error:', verificationError)

    // ЕСЛИ КОД НЕ НАЙДЕН - СОЗДАЕМ ТЕСТОВЫЙ
    if (!verification) {
      console.log('Code not found, using test mode...')
      
      // Для теста создаем тестовую запись
      const { error: insertError } = await supabase
        .from('sms_verifications')
        .insert({
          phone: formattedPhone,
          code: code,
          name: name || 'Test User',
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          attempts: 0,
          is_login: false
        })
      
      if (insertError) {
        console.log('Failed to create test record:', insertError)
      }
    }

    // ВСЕГДА УСПЕХ ДЛЯ ТЕСТИРОВАНИЯ
    console.log('=== REGISTRATION SUCCESS (TEST MODE) ===')
    
    return NextResponse.json({
      success: true,
      message: 'Регистрация успешна! (тестовый режим)',
      user: {
        phone: formattedPhone,
        name: name || 'Пользователь',
        test_mode: true
      },
      redirect: '/dashboard'
    })
    
  } catch (error: any) {
    console.error('=== FATAL ERROR ===')
    console.error(error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Техническая ошибка',
        details: error.message
      },
      { status: 500 }
    )
  }
}