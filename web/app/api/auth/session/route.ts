import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Получаем текущую сессию
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      throw error
    }

    if (!session) {
      return NextResponse.json({
        success: true,
        authenticated: false,
        data: null,
      })
    }

    // Получаем профиль пользователя
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (profileError) {
      console.error('Ошибка получения профиля:', profileError)
    }

    // Получаем статистику пользователя
    let userStats = null
    if (profile?.role === 'executor') {
      const { data: stats } = await supabase
        .from('executor_stats')
        .select('*')
        .eq('user_id', session.user.id)
        .single()
      
      userStats = stats
    }

    // Проверяем непрочитанные уведомления
    const { count: unreadNotifications } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id)
      .eq('is_read', false)

    return NextResponse.json({
      success: true,
      authenticated: true,
      data: {
        session,
        profile: profile || null,
        stats: userStats,
        notifications: {
          unread: unreadNotifications || 0,
        },
      },
    })
  } catch (error: any) {
    console.error('Ошибка получения сессии:', error)

    return NextResponse.json(
      {
        success: false,
        authenticated: false,
        error: 'Не удалось проверить сессию',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Обновляем сессию
    const { data: { session }, error } = await supabase.auth.refreshSession()

    if (error) {
      throw error
    }

    if (!session) {
      return NextResponse.json({
        success: false,
        authenticated: false,
        error: 'Сессия не найдена',
      })
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      data: { session },
    })
  } catch (error: any) {
    console.error('Ошибка обновления сессии:', error)

    return NextResponse.json(
      {
        success: false,
        authenticated: false,
        error: 'Не удалось обновить сессию',
      },
      { status: 500 }
    )
  }
}