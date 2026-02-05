// /web/app/api/projects/me/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Проверка авторизации
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Не авторизован',
          message: 'Пожалуйста, войдите в систему'
        },
        { status: 401 }
      )
    }

    // Получаем проекты пользователя
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .eq('client_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Ошибка получения проектов пользователя:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: projects,
      message: `Найдено ${projects?.length || 0} проектов`
    })

  } catch (error: any) {
    console.error('Неожиданная ошибка:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Внутренняя ошибка сервера',
        message: error.message
      },
      { status: 500 }
    )
  }
}