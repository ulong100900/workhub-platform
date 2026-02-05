import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { z } from 'zod'

const withdrawalSchema = z.object({
  amount: z.number().min(100, 'Минимальная сумма вывода - 100 ₽'),
  method: z.enum(['card', 'yoomoney', 'bank_account', 'crypto']),
  details: z.record(z.any()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Проверяем авторизацию
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validationResult = withdrawalSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          errors: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      )
    }

    const { amount, method, details } = validationResult.data

    // Получаем текущий баланс пользователя
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('balance, verification_status')
      .eq('id', user.id)
      .single()

    if (profileError) {
      throw profileError
    }

    // Проверяем баланс
    if (profile.balance < amount) {
      return NextResponse.json(
        {
          success: false,
          error: 'Недостаточно средств на балансе',
        },
        { status: 400 }
      )
    }

    // Проверяем верификацию для больших сумм
    if (amount > 15000 && profile.verification_status !== 'verified') {
      return NextResponse.json(
        {
          success: false,
          error: 'Для вывода суммы более 15,000 ₽ требуется верификация',
        },
        { status: 403 }
      )
    }

    // Проверяем лимиты на вывод
    const today = new Date().toISOString().split('T')[0]
    const { data: todayWithdrawals, error: withdrawalsError } = await supabase
      .from('withdrawals')
      .select('amount')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`)

    if (withdrawalsError) {
      throw withdrawalsError
    }

    const todayTotal = todayWithdrawals?.reduce((sum, w) => sum + w.amount, 0) || 0
    const dailyLimit = profile.verification_status === 'verified' ? 100000 : 50000

    if (todayTotal + amount > dailyLimit) {
      return NextResponse.json(
        {
          success: false,
          error: `Превышен дневной лимит на вывод. Доступно: ${dailyLimit - todayTotal} ₽`,
        },
        { status: 400 }
      )
    }

    // Рассчитываем комиссию
    const fee = calculateFee(amount, method)
    const netAmount = amount - fee

    // Создаем запрос на вывод
    const withdrawalData = {
      user_id: user.id,
      amount,
      net_amount: netAmount,
      fee,
      method,
      details: details || {},
      status: 'pending',
      currency: 'RUB',
    }

    const { data: withdrawal, error: withdrawalError } = await supabase
      .from('withdrawals')
      .insert([withdrawalData])
      .select()
      .single()

    if (withdrawalError) {
      throw withdrawalError
    }

    // Резервируем сумму на балансе
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        balance: profile.balance - amount,
        pending_withdrawal: (profile.pending_withdrawal || 0) + amount,
      })
      .eq('id', user.id)

    if (updateError) {
      throw updateError
    }

    // Создаем транзакцию
    await supabase.from('balance_transactions').insert([
      {
        user_id: user.id,
        amount: -amount,
        type: 'withdrawal_request',
        status: 'pending',
        reference_id: withdrawal.id,
        metadata: {
          method,
          fee,
          net_amount: netAmount,
        },
      },
    ])

    // Отправляем уведомление
    await supabase.from('notifications').insert([
      {
        user_id: user.id,
        type: 'withdrawal_requested',
        title: 'Запрос на вывод средств',
        message: `Запрошен вывод ${amount} ₽. Ожидайте обработки.`,
        metadata: {
          withdrawal_id: withdrawal.id,
          amount,
          method,
        },
        is_read: false,
      },
    ])

    // Отправляем email администратору для больших сумм
    if (amount > 50000) {
      await supabase.from('admin_notifications').insert([
        {
          type: 'large_withdrawal',
          title: 'Крупный запрос на вывод',
          message: `Пользователь ${user.email} запросил вывод ${amount} ₽`,
          metadata: {
            user_id: user.id,
            withdrawal_id: withdrawal.id,
            amount,
            method,
          },
          priority: 'high',
        },
      ])
    }

    return NextResponse.json({
      success: true,
      message: 'Запрос на вывод средств создан',
      data: {
        withdrawal,
        fee,
        netAmount,
        estimatedProcessing: '1-3 рабочих дня',
      },
    })
  } catch (error: any) {
    console.error('Ошибка создания запроса на вывод:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Не удалось создать запрос на вывод',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Проверяем авторизацию
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('withdrawals')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    const { data: withdrawals, error, count } = await query

    if (error) {
      throw error
    }

    // Получаем информацию о лимитах
    const { data: profile } = await supabase
      .from('profiles')
      .select('balance, verification_status, pending_withdrawal')
      .eq('id', user.id)
      .single()

    const limits = {
      minAmount: 100,
      maxAmount: profile.verification_status === 'verified' ? 100000 : 50000,
      dailyLimit: profile.verification_status === 'verified' ? 100000 : 50000,
      availableBalance: profile.balance || 0,
      pendingWithdrawal: profile.pending_withdrawal || 0,
      processingTime: '1-3 рабочих дня',
      fees: {
        card: { percent: 5, min: 50, max: 500 },
        yoomoney: { percent: 3, min: 30, max: 300 },
        bank_account: { percent: 2, min: 20, max: 200 },
        crypto: { percent: 1, min: 10, max: 100 },
      },
    }

    return NextResponse.json({
      success: true,
      data: {
        withdrawals: withdrawals || [],
        limits,
        pagination: {
          total: count || 0,
          limit,
          offset,
        },
      },
    })
  } catch (error: any) {
    console.error('Ошибка получения запросов на вывод:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Не удалось получить запросы на вывод',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}

// Вспомогательная функция для расчета комиссии
function calculateFee(amount: number, method: string): number {
  const fees: Record<string, { percent: number; min: number; max: number }> = {
    card: { percent: 5, min: 50, max: 500 },
    yoomoney: { percent: 3, min: 30, max: 300 },
    bank_account: { percent: 2, min: 20, max: 200 },
    crypto: { percent: 1, min: 10, max: 100 },
  }

  const feeConfig = fees[method] || fees.card
  const feeByPercent = amount * (feeConfig.percent / 100)
  
  return Math.max(
    feeConfig.min,
    Math.min(feeByPercent, feeConfig.max)
  )
}