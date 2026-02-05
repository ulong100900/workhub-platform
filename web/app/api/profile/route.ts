import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const updateProfileSchema = z.object({
  fullName: z.string().min(2, 'Имя должно содержать минимум 2 символа').optional(),
  phone: z.string().optional().nullable(),
  bio: z.string().max(1000, 'Описание не должно превышать 1000 символов').optional(),
  skills: z.array(z.string()).optional(),
  experienceYears: z.number().min(0).max(50).optional(),
  portfolioUrl: z.string().url('Некорректный URL').optional().nullable(),
  location: z.string().optional(),
  notificationSettings: z.record(z.any()).optional(),
  preferences: z.record(z.any()).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Проверяем авторизацию
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Необходима авторизация' 
        },
        { status: 401 }
      )
    }

    // Получаем профиль пользователя
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    let finalProfile = profile
    
    // Если профиль не найден, создаем его
    if (profileError && profileError.code === 'PGRST116') {
      const newProfileData = {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Пользователь',
        role: 'customer',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert([newProfileData])
        .select()
        .single()

      if (createError) {
        console.error('Error creating profile:', createError)
        throw createError
      }
      
      finalProfile = newProfile
    } else if (profileError) {
      console.error('Profile error:', profileError)
      throw profileError
    }

    // Базовая статистика
    const stats = {
      completed_projects: 0,
      rating: 5.0,
      success_rate: finalProfile.role === 'executor' ? 95 : 100,
      avg_response_time: finalProfile.role === 'executor' ? '2ч' : '1ч',
      total_earned: 0,
      active_orders: 0,
      total_reviews: 0,
    }

    // Проверяем наличие таблицы subscriptions
    let subscription = null
    try {
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle()
      
      subscription = subData
    } catch (error) {
      console.log('Subscriptions table not accessible')
    }

    return NextResponse.json({
      success: true,
      data: {
        profile: finalProfile,
        stats,
        subscription,
        verification: null,
        balance: {
          current: finalProfile.balance || 0,
          transactions: [],
        },
      },
    })
    
  } catch (error: any) {
    console.error('Error in profile API:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Не удалось получить профиль',
        details: process.env.NODE_ENV === 'development' ? {
          message: error.message,
          code: error.code,
        } : undefined,
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Проверяем авторизацию
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Необходима авторизация' 
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validationResult = updateProfileSchema.safeParse(body)

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

    const updates = validationResult.data

    // Подготавливаем данные для обновления
    const profileUpdates: any = {
      updated_at: new Date().toISOString(),
    }

    const authUpdates: any = {}

    if (updates.fullName !== undefined) {
      profileUpdates.full_name = updates.fullName
      authUpdates.data = { full_name: updates.fullName }
    }

    if (updates.phone !== undefined) profileUpdates.phone = updates.phone
    if (updates.bio !== undefined) profileUpdates.bio = updates.bio
    if (updates.skills !== undefined) profileUpdates.skills = updates.skills
    if (updates.experienceYears !== undefined) profileUpdates.experience_years = updates.experienceYears
    if (updates.portfolioUrl !== undefined) profileUpdates.portfolio_url = updates.portfolioUrl
    if (updates.location !== undefined) profileUpdates.location = updates.location
    
    if (updates.notificationSettings !== undefined) {
      profileUpdates.notification_settings = updates.notificationSettings
    }
    
    if (updates.preferences !== undefined) {
      profileUpdates.preferences = updates.preferences
    }

    // Обновляем профиль в базе данных
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .update(profileUpdates)
      .eq('id', user.id)
      .select()
      .single()

    if (profileError) {
      throw profileError
    }

    // Обновляем данные в auth, если есть изменения
    if (Object.keys(authUpdates).length > 0) {
      await supabase.auth.updateUser(authUpdates)
    }

    return NextResponse.json({
      success: true,
      message: 'Профиль успешно обновлен',
      data: { profile },
    })
  } catch (error: any) {
    console.error('Error updating profile:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Не удалось обновить профиль',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Проверяем авторизацию
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Необходима авторизация' 
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { field, value } = body

    if (!field || value === undefined) {
      return NextResponse.json(
        { error: 'Поле и значение обязательны' },
        { status: 400 }
      )
    }

    // Разрешенные поля для частичного обновления
    const allowedFields = [
      'bio',
      'skills',
      'portfolio_url',
      'location',
      'notification_settings',
      'preferences',
      'avatar_url',
    ]

    if (!allowedFields.includes(field)) {
      return NextResponse.json(
        { error: `Поле "${field}" не может быть обновлено через этот метод` },
        { status: 400 }
      )
    }

    const updates = { 
      [field]: value,
      updated_at: new Date().toISOString(),
    }

    // Обновляем поле в профиле
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (profileError) {
      throw profileError
    }

    return NextResponse.json({
      success: true,
      message: 'Поле успешно обновлено',
      data: { profile },
    })
  } catch (error: any) {
    console.error('Error updating field:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Не удалось обновить поле',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}