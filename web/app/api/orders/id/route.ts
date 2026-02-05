import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getUserIdFromSession } from '@/lib/auth'

// GET /api/orders/[id] - получить конкретный заказ
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

    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        client:client_id (id, email, user_metadata),
        freelancer:freelancer_id (id, email, user_metadata),
        category:category_id (*)
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching order:', error)
      return NextResponse.json(
        { error: 'Заказ не найден' },
        { status: 404 }
      )
    }

    // Проверяем права доступа
    if (order.client_id !== userId && order.freelancer_id !== userId) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Error in GET order:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// PUT /api/orders/[id] - обновить заказ
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
    const { title, description, budget, deadline, status, freelancer_id } = body

    // Проверяем существование заказа и права
    const { data: existingOrder, error: fetchError } = await supabase
      .from('orders')
      .select('client_id, status')
      .eq('id', params.id)
      .single()

    if (fetchError) {
      return NextResponse.json(
        { error: 'Заказ не найден' },
        { status: 404 }
      )
    }

    // Только клиент может обновлять заказ
    if (existingOrder.client_id !== userId) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    // Обновляем заказ
    const { data: order, error } = await supabase
      .from('orders')
      .update({
        title,
        description,
        budget,
        deadline,
        status,
        freelancer_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating order:', error)
      return NextResponse.json(
        { error: 'Не удалось обновить заказ' },
        { status: 400 }
      )
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Error in PUT order:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// DELETE /api/orders/[id] - удалить заказ
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

    // Проверяем существование заказа и права
    const { data: existingOrder, error: fetchError } = await supabase
      .from('orders')
      .select('client_id, status')
      .eq('id', params.id)
      .single()

    if (fetchError) {
      return NextResponse.json(
        { error: 'Заказ не найден' },
        { status: 404 }
      )
    }

    // Только клиент может удалить заказ, и только если он открыт
    if (existingOrder.client_id !== userId) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    if (existingOrder.status !== 'open') {
      return NextResponse.json(
        { error: 'Нельзя удалить заказ в работе' },
        { status: 400 }
      )
    }

    // Удаляем заказ
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting order:', error)
      return NextResponse.json(
        { error: 'Не удалось удалить заказ' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE order:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}