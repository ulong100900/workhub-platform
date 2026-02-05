import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getUserIdFromSession } from '@/lib/auth'

// GET /api/bids/[id] - получить информацию о заявке
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserIdFromSession()
    if (!userId) {
      return NextResponse.json(
        { error: 'Требуется авторизация' },
        { status: 401 }
      )
    }

    const { data: bid, error } = await supabase
      .from('bids')
      .select(`
        *,
        order:order_id (*, client:client_id (*)),
        freelancer:freelancer_id (*)
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching bid:', error)
      return NextResponse.json(
        { error: 'Заявка не найдена' },
        { status: 404 }
      )
    }

    // Проверяем права доступа
    if (bid.order.client_id !== userId && bid.freelancer_id !== userId) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    return NextResponse.json({ bid })
  } catch (error) {
    console.error('Error in GET bid:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// PUT /api/bids/[id] - обновить заявку
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserIdFromSession()
    if (!userId) {
      return NextResponse.json(
        { error: 'Требуется авторизация' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { proposal, price, deliveryDays, status } = body

    // Проверяем существование заявки и права
    const { data: existingBid, error: fetchError } = await supabase
      .from('bids')
      .select('freelancer_id, status, order_id')
      .eq('id', params.id)
      .single()

    if (fetchError) {
      return NextResponse.json(
        { error: 'Заявка не найдена' },
        { status: 404 }
      )
    }

    // Только фрилансер может обновлять свою заявку, и только если она еще не принята
    if (existingBid.freelancer_id !== userId) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    if (existingBid.status !== 'pending') {
      return NextResponse.json(
        { error: 'Нельзя изменить заявку в этом статусе' },
        { status: 400 }
      )
    }

    // Обновляем заявку
    const { data: bid, error } = await supabase
      .from('bids')
      .update({
        proposal,
        price: price ? parseFloat(price) : undefined,
        delivery_days: deliveryDays ? parseInt(deliveryDays) : undefined,
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating bid:', error)
      return NextResponse.json(
        { error: 'Не удалось обновить заявку' },
        { status: 400 }
      )
    }

    return NextResponse.json({ bid })
  } catch (error) {
    console.error('Error in PUT bid:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// DELETE /api/bids/[id] - отозвать заявку
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserIdFromSession()
    if (!userId) {
      return NextResponse.json(
        { error: 'Требуется авторизация' },
        { status: 401 }
      )
    }

    // Проверяем существование заявки и права
    const { data: existingBid, error: fetchError } = await supabase
      .from('bids')
      .select('freelancer_id, status')
      .eq('id', params.id)
      .single()

    if (fetchError) {
      return NextResponse.json(
        { error: 'Заявка не найдена' },
        { status: 404 }
      )
    }

    // Только фрилансер может отозвать свою заявку, и только если она еще не принята
    if (existingBid.freelancer_id !== userId) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    if (existingBid.status !== 'pending') {
      return NextResponse.json(
        { error: 'Нельзя отозвать заявку в этом статусе' },
        { status: 400 }
      )
    }

    // Обновляем статус на withdrawn
    const { error } = await supabase
      .from('bids')
      .update({
        status: 'withdrawn',
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)

    if (error) {
      console.error('Error withdrawing bid:', error)
      return NextResponse.json(
        { error: 'Не удалось отозвать заявку' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE bid:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// POST /api/bids/[id]/accept - принять заявку (для клиента)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserIdFromSession()
    if (!userId) {
      return NextResponse.json(
        { error: 'Требуется авторизация' },
        { status: 401 }
      )
    }

    // Проверяем существование заявки и права
    const { data: bid, error: fetchError } = await supabase
      .from('bids')
      .select('*, order:order_id (*)')
      .eq('id', params.id)
      .single()

    if (fetchError) {
      return NextResponse.json(
        { error: 'Заявка не найдена' },
        { status: 404 }
      )
    }

    // Только клиент может принять заявку на свой заказ
    if (bid.order.client_id !== userId) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    if (bid.status !== 'pending') {
      return NextResponse.json(
        { error: 'Заявка уже обработана' },
        { status: 400 }
      )
    }

    // Начинаем транзакцию
    const { error: bidError } = await supabase
      .from('bids')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)

    if (bidError) throw bidError

    // Обновляем заказ
    const { error: orderError } = await supabase
      .from('orders')
      .update({
        freelancer_id: bid.freelancer_id,
        status: 'in_progress',
        updated_at: new Date().toISOString()
      })
      .eq('id', bid.order_id)

    if (orderError) throw orderError

    // Отклоняем все остальные заявки на этот заказ
    const { error: rejectError } = await supabase
      .from('bids')
      .update({
        status: 'rejected',
        updated_at: new Date().toISOString()
      })
      .eq('order_id', bid.order_id)
      .neq('id', params.id)
      .eq('status', 'pending')

    if (rejectError) throw rejectError

    return NextResponse.json({ 
      success: true,
      message: 'Заявка принята, заказ перешел в работу' 
    })
  } catch (error) {
    console.error('Error in accepting bid:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}