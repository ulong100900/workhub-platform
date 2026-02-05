import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, message } = body

    // Валидация
    if (!phone || !message) {
      return NextResponse.json(
        { error: 'Необходимо указать phone и message' },
        { status: 400 }
      )
    }

    // Форматируем номер телефона
    const formattedPhone = phone.replace(/\D/g, '')
    
    // Отправляем SMS через SMS.ru API
    const smsApiKey = process.env.SMSRU_API_KEY
    
    if (!smsApiKey) {
      console.warn('SMSRU_API_KEY не настроен, используем заглушку')
      // В режиме разработки просто логируем
      console.log('SMS отправлено:', { to: formattedPhone, message })
      
      return NextResponse.json({ 
        success: true, 
        message: 'SMS отправлено (заглушка)' 
      })
    }

    // Реальная отправка через SMS.ru
    const response = await fetch('https://sms.ru/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        api_id: smsApiKey,
        to: formattedPhone,
        msg: message,
        json: '1'
      })
    })

    const result = await response.json()

    if (result.status !== 'OK') {
      console.error('SMS.ru error:', result)
      return NextResponse.json(
        { error: 'Ошибка при отправке SMS' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      data: result,
      message: 'SMS отправлено успешно' 
    })

  } catch (error) {
    console.error('Error sending SMS:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}