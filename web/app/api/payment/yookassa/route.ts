import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { supabase } from '@/lib/supabase'

const YOOKASSA_SHOP_ID = process.env.YOOKASSA_SHOP_ID!
const YOOKASSA_SECRET_KEY = process.env.YOOKASSA_SECRET_KEY!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, orderId, userId, description } = body

    // Создаем платеж в ЮKassa
    const paymentData = {
      amount: {
        value: amount.toFixed(2),
        currency: 'RUB'
      },
      capture: true,
      confirmation: {
        type: 'redirect',
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`
      },
      description: description || `Оплата заказа ${orderId}`,
      metadata: {
        orderId,
        userId
      }
    }

    const response = await axios.post(
      'https://api.yookassa.ru/v3/payments',
      paymentData,
      {
        auth: {
          username: YOOKASSA_SHOP_ID,
          password: YOOKASSA_SECRET_KEY
        },
        headers: {
          'Idempotence-Key': `${Date.now()}-${orderId}`
        }
      }
    )

    // Сохраняем транзакцию в базу
    await supabase.from('transactions').insert({
      executor_id: userId,
      order_id: orderId,
      type: 'income',
      amount,
      currency: 'RUB',
      status: 'pending',
      description,
      metadata: {
        payment_id: response.data.id,
        payment_status: response.data.status
      }
    })

    return NextResponse.json({
      success: true,
      payment: response.data,
      confirmation_url: response.data.confirmation?.confirmation_url
    })
  } catch (error) {
    console.error('Payment error:', error)
    return NextResponse.json(
      { error: 'Payment creation failed' },
      { status: 500 }
    )
  }
}

// Webhook для уведомлений от ЮKassa
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { event, object } = body

    if (event === 'payment.succeeded') {
      // Обновляем статус транзакции
      await supabase
        .from('transactions')
        .update({ 
          status: 'completed',
          metadata: { payment_status: 'succeeded' }
        })
        .eq('metadata->payment_id', object.id)

      // Если есть orderId, обновляем статус заказа
      if (object.metadata?.orderId) {
        await supabase
          .from('orders')
          .update({ status: 'paid' })
          .eq('id', object.metadata.orderId)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}