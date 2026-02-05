import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Payment } from '@/types'

const supabase = createClientComponentClient()

// YooKassa платежи
export async function createYooKassaPayment(
  orderId: string,
  amount: number,
  description: string
) {
  try {
    // Получаем текущего пользователя
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Необходима авторизация')

    // Создаем платеж в YooKassa
    const response = await fetch('/api/payment/yookassa', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId,
        amount,
        description,
        userId: user.id,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Ошибка создания платежа')
    }

    const paymentData = await response.json()

    // Сохраняем платеж в базе данных
    const { data, error } = await supabase
      .from('payments')
      .insert([
        {
          order_id: orderId,
          user_id: user.id,
          amount,
          currency: 'RUB',
          status: 'pending',
          provider: 'yookassa',
          provider_payment_id: paymentData.id,
          metadata: paymentData,
        },
      ])
      .select()
      .single()

    if (error) throw error

    return {
      ...paymentData,
      dbPaymentId: data.id,
    }
  } catch (error) {
    console.error('Ошибка создания платежа YooKassa:', error)
    throw error
  }
}

// Tinkoff платежи
export async function createTinkoffPayment(
  orderId: string,
  amount: number,
  description: string
) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Необходима авторизация')

    const response = await fetch('/api/payment/tinkoff', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId,
        amount,
        description,
        userId: user.id,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Ошибка создания платежа')
    }

    const paymentData = await response.json()

    const { data, error } = await supabase
      .from('payments')
      .insert([
        {
          order_id: orderId,
          user_id: user.id,
          amount,
          currency: 'RUB',
          status: 'pending',
          provider: 'tinkoff',
          provider_payment_id: paymentData.PaymentId,
          metadata: paymentData,
        },
      ])
      .select()
      .single()

    if (error) throw error

    return {
      ...paymentData,
      dbPaymentId: data.id,
    }
  } catch (error) {
    console.error('Ошибка создания платежа Tinkoff:', error)
    throw error
  }
}

// Проверка статуса платежа
export async function checkPaymentStatus(paymentId: string): Promise<Payment> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single()

    if (error) throw error

    // Если платеж еще pending, проверяем статус у провайдера
    if (data.status === 'pending') {
      const provider = data.provider
      const providerPaymentId = data.provider_payment_id

      if (!providerPaymentId) {
        throw new Error('ID платежа у провайдера не найден')
      }

      // В реальном проекте здесь будет запрос к API провайдера
      // Это упрощенный пример
      const updatedStatus = 'paid' // Замените на реальную проверку

      if (updatedStatus !== data.status) {
        const { data: updatedData, error: updateError } = await supabase
          .from('payments')
          .update({ status: updatedStatus })
          .eq('id', paymentId)
          .select()
          .single()

        if (updateError) throw updateError
        return updatedData as Payment
      }
    }

    return data as Payment
  } catch (error) {
    console.error('Ошибка проверки статуса платежа:', error)
    throw error
  }
}

// Создание выплаты исполнителю
export async function createWithdrawal(
  userId: string,
  amount: number,
  method: 'card' | 'yoomoney' | 'bank_account'
) {
  try {
    // Проверяем баланс пользователя
    const { data: balanceData, error: balanceError } = await supabase
      .from('profiles')
      .select('balance')
      .eq('id', userId)
      .single()

    if (balanceError) throw balanceError

    if (balanceData.balance < amount) {
      throw new Error('Недостаточно средств на балансе')
    }

    // Минимальная сумма вывода
    if (amount < 100) {
      throw new Error('Минимальная сумма вывода - 100 ₽')
    }

    // Создаем запрос на вывод
    const { data, error } = await supabase
      .from('withdrawals')
      .insert([
        {
          user_id: userId,
          amount,
          method,
          status: 'pending',
          fee: amount * 0.05, // 5% комиссия
        },
      ])
      .select()
      .single()

    if (error) throw error

    // Списываем сумму с баланса
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        balance: balanceData.balance - amount 
      })
      .eq('id', userId)

    if (updateError) throw updateError

    return data
  } catch (error) {
    console.error('Ошибка создания выплаты:', error)
    throw error
  }
}

// Получение истории платежей пользователя
export async function getUserPayments(userId: string) {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Payment[]
  } catch (error) {
    console.error('Ошибка получения платежей:', error)
    throw error
  }
}

// Получение баланса пользователя
export async function getUserBalance(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('balance')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data.balance || 0
  } catch (error) {
    console.error('Ошибка получения баланса:', error)
    throw error
  }
}

// Пополнение баланса
export async function depositToBalance(userId: string, amount: number) {
  try {
    const currentBalance = await getUserBalance(userId)
    
    const { error } = await supabase
      .from('profiles')
      .update({ 
        balance: currentBalance + amount 
      })
      .eq('id', userId)

    if (error) throw error

    // Создаем запись о пополнении
    await supabase
      .from('balance_transactions')
      .insert([
        {
          user_id: userId,
          amount,
          type: 'deposit',
          status: 'completed',
        },
      ])

    return { success: true, newBalance: currentBalance + amount }
  } catch (error) {
    console.error('Ошибка пополнения баланса:', error)
    throw error
  }
}