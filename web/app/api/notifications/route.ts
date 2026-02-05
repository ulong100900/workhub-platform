import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getUserIdFromSession } from '@/lib/auth'

// GET /api/notifications - получить уведомления пользователя
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromSession()
    if (!userId) {
      return NextResponse.json(
        { error: 'Требуется авторизация' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') || '20'
    const offset = searchParams.get('offset') || '0'
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .eq('is_archived', false)

    if (unreadOnly) {
      query = query.eq('is_read', false)
    }

    // Пагинация и сортировка
    const { data: notifications, error, count } = await query
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1)

    if (error) {
      console.error('Error fetching notifications:', error)
      return NextResponse.json(
        { error: 'Не удалось загрузить уведомления' },
        { status: 500 }
      )
    }

    // Получаем статистику
    const { data: unreadCount } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)
      .eq('is_archived', false)

    return NextResponse.json({
      notifications,
      stats: {
        total: count,
        unread: unreadCount?.count || 0
      },
      pagination: {
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    })
  } catch (error) {
    console.error('Error in GET notifications:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// POST /api/notifications - создать уведомление
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      userId, 
      type, 
      title, 
      message, 
      data,
      orderId,
      bidId,
      messageId 
    } = body

    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { error: 'Необходимо указать userId, type, title и message' },
        { status: 400 }
      )
    }

    // Создаем уведомление
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert([{
        user_id: userId,
        type,
        title,
        message,
        data: data || null,
        order_id: orderId || null,
        bid_id: bidId || null,
        message_id: messageId || null,
        is_read: false,
        is_archived: false
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating notification:', error)
      return NextResponse.json(
        { error: 'Не удалось создать уведомление' },
        { status: 500 }
      )
    }

    // Здесь можно добавить отправку email или push-уведомлений
    // в зависимости от настроек пользователя

    return NextResponse.json({ 
      notification,
      message: 'Уведомление создано' 
    })
  } catch (error) {
    console.error('Error in POST notification:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}