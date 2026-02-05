// /web/app/api/bids/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { sendPushNotification } from '@/lib/onesignal'

// Схемы валидации
const getBidsSchema = z.object({
  orderId: z.string().uuid().optional(),
  freelancerId: z.string().uuid().optional(),
  status: z.enum(['pending', 'accepted', 'rejected', 'withdrawn']).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
  offset: z.string().regex(/^\d+$/).transform(Number).default('0'),
})

const createBidSchema = z.object({
  projectId: z.string().uuid(),
  amount: z.number().positive(),
  message: z.string().min(10).max(2000),
  deliveryTime: z.string().optional(),
  duration: z.string().optional(),
  milestones: z.array(z.string()).optional(),
  delivery_days: z.number().int().positive().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Проверка авторизации
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Требуется авторизация' 
        },
        { status: 401 }
      )
    }

    // Валидация параметров
    const { searchParams } = new URL(request.url)
    const params = getBidsSchema.parse(Object.fromEntries(searchParams))

    let query = supabase
      .from('bids')
      .select(`
        *,
        project:projects!inner(
          id,
          title,
          budget,
          status,
          user_id,
          profiles!projects_user_id_fkey(full_name, avatar_url)
        ),
        freelancer:profiles!bids_freelancer_id_fkey(
          id,
          full_name,
          avatar_url,
          rating,
          completed_projects
        )
      `, { count: 'exact' })

    // Применяем фильтры
    if (params.orderId) {
      query = query.eq('project_id', params.orderId)
    }

    if (params.freelancerId) {
      query = query.eq('freelancer_id', params.freelancerId)
    }

    if (params.status) {
      query = query.eq('status', params.status)
    }

    // Проверка прав доступа
    // Если это не администратор, показываем только связанные с пользователем заявки
    const userRole = user.user_metadata?.role
    if (userRole !== 'admin') {
      const { data: userProjects } = await supabase
        .from('projects')
        .select('id')
        .or(`user_id.eq.${user.id},executor_id.eq.${user.id}`)

      const projectIds = userProjects?.map(p => p.id) || []
      
      query = query.or(
        `project_id.in.(${projectIds.join(',')}),` +
        `freelancer_id.eq.${user.id}`
      )
    }

    // Пагинация и сортировка
    const { data: bids, error, count } = await query
      .range(params.offset, params.offset + params.limit - 1)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching bids:', error)
      return NextResponse.json(
        { 
          success: false,
          error: 'Не удалось загрузить заявки' 
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        bids: bids || [],
        pagination: {
          total: count || 0,
          limit: params.limit,
          offset: params.offset,
          hasMore: (count || 0) > params.offset + params.limit
        }
      }
    })
  } catch (error) {
    console.error('Error in GET bids:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Неверные параметры запроса',
          details: error.errors 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Внутренняя ошибка сервера' 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Проверка авторизации
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Unauthorized' 
        },
        { status: 401 }
      )
    }

    // Валидация данных
    const body = await request.json()
    const validatedData = createBidSchema.parse(body)

    const { projectId, amount, message } = validatedData

    // Проверяем, есть ли уже отклик от этого пользователя
    const { data: existingBid } = await supabase
      .from('bids')
      .select('id')
      .eq('project_id', projectId)
      .eq('freelancer_id', user.id)
      .single()

    if (existingBid) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Вы уже откликнулись на этот проект' 
        },
        { status: 400 }
      )
    }

    // Получаем информацию о проекте и заказчике
    const { data: project } = await supabase
      .from('projects')
      .select('id, title, user_id, status')
      .eq('id', projectId)
      .single()

    if (!project) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Проект не найден' 
        },
        { status: 404 }
      )
    }

    // Проверяем статус проекта
    if (project.status !== 'published') {
      return NextResponse.json(
        { 
          success: false,
          error: 'На этот проект нельзя подать заявку' 
        },
        { status: 400 }
      )
    }

    // Проверяем, не является ли пользователь заказчиком
    if (project.user_id === user.id) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Нельзя подать заявку на собственный проект' 
        },
        { status: 400 }
      )
    }

    // Получаем информацию о фрилансере
    const { data: freelancer } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', user.id)
      .single()

    // Определяем delivery_days из deliveryTime или duration если нужно
    let deliveryDays = validatedData.delivery_days
    if (!deliveryDays) {
      if (validatedData.deliveryTime) {
        // Парсинг deliveryTime (например: "7 дней", "2 недели", "1 месяц")
        const timeString = validatedData.deliveryTime.toLowerCase()
        if (timeString.includes('недел')) {
          const weeks = parseInt(timeString.match(/\d+/)?.[0] || '1')
          deliveryDays = weeks * 7
        } else if (timeString.includes('месяц')) {
          const months = parseInt(timeString.match(/\d+/)?.[0] || '1')
          deliveryDays = months * 30
        } else if (timeString.includes('дн')) {
          deliveryDays = parseInt(timeString.match(/\d+/)?.[0] || '1')
        } else {
          deliveryDays = 14 // по умолчанию 2 недели
        }
      } else if (validatedData.duration) {
        // Альтернативный парсинг duration
        const durationString = validatedData.duration.toLowerCase()
        if (durationString.includes('недел')) {
          const weeks = parseInt(durationString.match(/\d+/)?.[0] || '1')
          deliveryDays = weeks * 7
        } else if (durationString.includes('месяц')) {
          const months = parseInt(durationString.match(/\d+/)?.[0] || '1')
          deliveryDays = months * 30
        } else if (durationString.includes('дн')) {
          deliveryDays = parseInt(durationString.match(/\d+/)?.[0] || '1')
        } else {
          deliveryDays = 14
        }
      } else {
        deliveryDays = 14 // по умолчанию 14 дней
      }
    }

    // Создаем отклик
    const { data: bid, error: bidError } = await supabase
      .from('bids')
      .insert({
        project_id: projectId,
        freelancer_id: user.id,
        amount: amount,
        message: message,
        proposal: message, // Для совместимости
        price: amount, // Для совместимости
        delivery_time: validatedData.deliveryTime,
        delivery_days: deliveryDays,
        milestones: validatedData.milestones,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select(`
        *,
        project:projects(id, title),
        freelancer:profiles!bids_freelancer_id_fkey(full_name)
      `)
      .single()

    if (bidError) {
      console.error('Error creating bid:', bidError)
      return NextResponse.json(
        { 
          success: false,
          error: 'Не удалось создать отклик' 
        },
        { status: 500 }
      )
    }

    // Создаем уведомление для заказчика в базе данных
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: project.user_id,
        project_id: projectId,
        bid_id: bid.id,
        type: 'bid_received',
        title: 'Новый отклик на ваш проект',
        message: `${freelancer?.full_name || 'Исполнитель'} откликнулся на ваш проект "${project.title}"`,
        metadata: {
          freelancer_id: user.id,
          freelancer_name: freelancer?.full_name,
          project_title: project.title,
          amount: amount,
          bid_id: bid.id
        },
        is_read: false,
        created_at: new Date().toISOString(),
      })

    if (notificationError) {
      console.error('Notification creation error:', notificationError)
    }

    // Отправляем пуш-уведомление через OneSignal
    try {
      await sendPushNotification({
        userId: project.user_id,
        title: 'Новый отклик на проект',
        message: `${freelancer?.full_name || 'Исполнитель'} откликнулся на "${project.title}"`,
        url: `/dashboard/my-projects?project=${projectId}`,
        data: {
          type: 'bid_received',
          projectId,
          bidId: bid.id
        }
      })
    } catch (pushError) {
      console.error('Push notification error:', pushError)
      // Не прерываем выполнение, если пуш-уведомление не отправилось
    }

    return NextResponse.json({ 
      success: true, 
      data: bid,
      message: 'Отклик успешно отправлен'
    })
  } catch (error) {
    console.error('Error in POST bid:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Неверные данные',
          details: error.errors 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Внутренняя ошибка сервера' 
      },
      { status: 500 }
    )
  }
}