import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Схемы валидации
const getOrdersSchema = z.object({
  category_id: z.string().uuid().optional(),
  status: z.enum(['draft', 'published', 'in_progress', 'completed', 'cancelled']).optional(),
  min_budget: z.string().regex(/^\d+$/).transform(Number).optional(),
  max_budget: z.string().regex(/^\d+$/).transform(Number).optional(),
  search: z.string().optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
  offset: z.string().regex(/^\d+$/).transform(Number).default('0'),
})

const createOrderSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(5000),
  category_id: z.string().uuid(),
  budget: z.number().positive(),
  deadline: z.string().datetime().optional(),
  location_type: z.enum(['remote', 'onsite', 'hybrid']).default('remote'),
  location_city: z.string().optional(),
  skills: z.array(z.string()).optional(),
  attachments: z.array(z.string().url()).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Валидация параметров
    const { searchParams } = new URL(request.url)
    const params = getOrdersSchema.parse(Object.fromEntries(searchParams))

    let query = supabase
      .from('orders')
      .select(`
        *,
        customer:profiles!orders_customer_id_fkey(
          id,
          full_name,
          avatar_url,
          rating,
          completed_projects
        ),
        executor:profiles!orders_executor_id_fkey(
          id,
          full_name,
          avatar_url,
          rating
        ),
        category:categories(*)
      `, { count: 'exact' })

    // Применяем фильтры только для опубликованных заказов для неавторизованных
    const { data: { user } } = await supabase.auth.getUser()
    const userRole = user?.user_metadata?.role

    if (!user || userRole !== 'admin') {
      // Для обычных пользователей показываем только опубликованные заказы
      query = query.eq('status', 'published')
      
      // Исключаем собственные заказы пользователя
      if (user) {
        query = query.neq('customer_id', user.id)
      }
    }

    if (params.category_id) {
      query = query.eq('category_id', params.category_id)
    }

    if (params.status) {
      query = query.eq('status', params.status)
    }

    if (params.min_budget) {
      query = query.gte('budget', params.min_budget)
    }

    if (params.max_budget) {
      query = query.lte('budget', params.max_budget)
    }

    if (params.search) {
      query = query.or(
        `title.ilike.%${params.search}%,` +
        `description.ilike.%${params.search}%`
      )
    }

    // Пагинация и сортировка
    const { data: orders, error, count } = await query
      .range(params.offset, params.offset + params.limit - 1)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching orders:', error)
      return NextResponse.json(
        { 
          success: false,
          error: 'Не удалось загрузить заказы' 
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        orders: orders || [],
        pagination: {
          total: count || 0,
          limit: params.limit,
          offset: params.offset,
          hasMore: (count || 0) > params.offset + params.limit
        }
      }
    })
  } catch (error) {
    console.error('Error in GET orders:', error)
    
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
    const supabase = await createClient()
    
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

    // Проверяем, может ли пользователь создавать заказы
    const userRole = user.user_metadata?.role
    if (userRole === 'freelancer') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Исполнители не могут создавать заказы' 
        },
        { status: 403 }
      )
    }

    // Валидация данных
    const body = await request.json()
    const validatedData = createOrderSchema.parse(body)

    // Создаем заказ
    const { data: order, error } = await supabase
      .from('orders')
      .insert([{
        title: validatedData.title,
        description: validatedData.description,
        category_id: validatedData.category_id,
        budget: validatedData.budget,
        deadline: validatedData.deadline,
        location_type: validatedData.location_type,
        location_city: validatedData.location_city,
        skills: validatedData.skills || [],
        attachments: validatedData.attachments || [],
        customer_id: user.id,
        status: 'draft' // По умолчанию создаем как черновик
      }])
      .select(`
        *,
        category:categories(*),
        customer:profiles!orders_customer_id_fkey(full_name)
      `)
      .single()

    if (error) {
      console.error('Error creating order:', error)
      return NextResponse.json(
        { 
          success: false,
          error: 'Не удалось создать заказ' 
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Заказ успешно создан',
      data: order
    })
  } catch (error) {
    console.error('Error in POST order:', error)
    
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