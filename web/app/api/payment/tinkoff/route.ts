import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const TINKOFF_TERMINAL_KEY = process.env.TINKOFF_TERMINAL_KEY!
const TINKOFF_PASSWORD = process.env.TINKOFF_PASSWORD!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, orderId, userId, email, phone } = body

    const paymentData = {
      TerminalKey: TINKOFF_TERMINAL_KEY,
      Amount: amount * 100, // в копейках
      OrderId: orderId || `order_${Date.now()}`,
      Description: `Оплата заказа ${orderId}`,
      DATA: {
        Email: email,
        Phone: phone,
        UserId: userId
      },
      Receipt: {
        Email: email,
        Phone: phone,
        Taxation: 'osn',
        Items: [
          {
            Name: 'Услуги исполнителя',
            Price: amount * 100,
            Quantity: 1,
            Amount: amount * 100,
            Tax: 'vat20'
          }
        ]
      }
    }

    // Создаем подпись
    const signData = {
      Password: TINKOFF_PASSWORD,
      ...paymentData
    }
    delete signData.Receipt
    
    // Здесь нужна функция для создания подписи
    // const Token = createToken(signData)

    const response = await fetch('https://securepay.tinkoff.ru/v2/Init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData)
    })

    const data = await response.json()

    if (data.Success) {
      // Сохраняем транзакцию
      await supabase.from('transactions').insert({
        executor_id: userId,
        order_id: orderId,
        type: 'income',
        amount,
        currency: 'RUB',
        status: 'pending',
        description: `Оплата заказа ${orderId}`
      })

      return NextResponse.json({
        success: true,
        payment_url: data.PaymentURL,
        payment_id: data.PaymentId
      })
    } else {
      throw new Error(data.Message || 'Payment failed')
    }
  } catch (error) {
    console.error('Tinkoff payment error:', error)
    return NextResponse.json(
      { error: 'Payment creation failed' },
      { status: 500 }
    )
  }
}