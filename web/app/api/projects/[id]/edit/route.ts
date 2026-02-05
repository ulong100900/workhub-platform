// /web/app/api/projects/[id]/edit/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    
    console.log('📝 Получение проекта для редактирования ID:', projectId)

    if (!projectId || projectId.length < 1) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Неверный ID проекта'
        }, 
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Проверяем авторизацию
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Не авторизован'
        }, 
        { status: 401 }
      )
    }

    // Получаем проект
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      console.error('❌ Проект не найден:', projectError)
      return NextResponse.json(
        { 
          success: false, 
          message: 'Проект не найден',
          error: 'Project not found'
        }, 
        { status: 404 }
      )
    }

    // Проверяем права доступа
    if (project.client_id !== user.id) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'У вас нет прав на редактирование этого проекта'
        }, 
        { status: 403 }
      )
    }

    console.log('✅ Проект получен для редактирования:', { 
      id: project.id,
      title: project.title
    })

    return NextResponse.json({
      success: true,
      data: project,
      message: 'Проект успешно получен для редактирования'
    })
    
  } catch (error: any) {
    console.error('🔥 Ошибка при получении проекта для редактирования:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Внутренняя ошибка сервера',
        error: error.message || 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}