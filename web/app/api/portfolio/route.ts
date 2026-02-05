
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { portfolioItemSchema } from '@/types/user.types'

// GET: Получить работы портфолио пользователя
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const isPublicOnly = searchParams.get('public') !== 'false'
    
    // Проверка авторизации для получения своего портфолио
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!userId && !user) {
      return NextResponse.json(
        { success: false, error: 'Не авторизован' },
        { status: 401 }
      )
    }

    // Определяем, чье портфолио запрашиваем
    const targetUserId = userId || user?.id
    
    let query = supabase
      .from('portfolio')
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false })

    // Если запрашиваем для себя и хотим все работы (включая приватные)
    if (targetUserId === user?.id && !isPublicOnly) {
      // Показываем все работы пользователю
    } else {
      // Для других пользователей показываем только публичные
      query = query.eq('is_public', true)
    }

    const { data: portfolio, error } = await query

    if (error) {
      console.error('Ошибка получения портфолио:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: portfolio || []
    })

  } catch (error) {
    console.error('Неожиданная ошибка:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Внутренняя ошибка сервера',
        details: error instanceof Error ? error.message : 'Неизвестная ошибка'
      },
      { status: 500 }
    )
  }
}

// POST: Создать работу в портфолио с загрузкой изображений
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Не авторизован' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const duration = formData.get('duration') as string
    const clientName = formData.get('client_name') as string
    const projectUrl = formData.get('project_url') as string
    const completedDate = formData.get('completed_date') as string
    const isPublic = formData.get('is_public') === 'true'
    const skillsString = formData.get('skills') as string
    
    if (!title || !description) {
      return NextResponse.json(
        { success: false, error: 'Заполните название и описание' },
        { status: 400 }
      )
    }

    // Загружаем изображения
    const files = formData.getAll('images') as File[]
    let uploadedImages: string[] = []

    if (files.length > 0 && files[0].size > 0) {
      for (const file of files) {
        if (file.size > 0) {
          const uploadFormData = new FormData()
          uploadFormData.append('file', file)
          uploadFormData.append('folder', 'portfolio')
          uploadFormData.append('entityType', 'portfolio')

          const uploadResponse = await fetch(`${request.nextUrl.origin}/api/upload`, {
            method: 'POST',
            body: uploadFormData
          })

          const uploadResult = await uploadResponse.json()
          
          if (uploadResult.success && uploadResult.data?.url) {
            uploadedImages.push(uploadResult.data.url)
          }
        }
      }
    }

    // Парсим навыки
    const skills = skillsString ? skillsString.split(',').filter(skill => skill.trim()) : []

    // Создаем запись в портфолио
    const { data: portfolioItem, error } = await supabase
      .from('portfolio')
      .insert({
        user_id: user.id,
        title,
        description,
        duration: duration || null,
        client_name: clientName || null,
        project_url: projectUrl || null,
        completed_date: completedDate || null,
        is_public: isPublic,
        skills,
        images: uploadedImages,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Ошибка создания работы:', error)
      
      // Если таблицы нет, сообщаем об этом
      if (error.message.includes('relation "portfolio" does not exist')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Таблица portfolio не существует',
            details: 'Создайте таблицу portfolio в базе данных'
          },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: portfolioItem,
      message: 'Работа добавлена в портфолио'
    })

  } catch (error) {
    console.error('Неожиданная ошибка:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Внутренняя ошибка сервера',
        details: error instanceof Error ? error.message : 'Неизвестная ошибка'
      },
      { status: 500 }
    )
  }
}

// PUT: Обновить работу в портфолио с загрузкой изображений
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Не авторизован' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const itemId = formData.get('id') as string
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const duration = formData.get('duration') as string
    const clientName = formData.get('client_name') as string
    const projectUrl = formData.get('project_url') as string
    const completedDate = formData.get('completed_date') as string
    const isPublic = formData.get('is_public') === 'true'
    const skillsString = formData.get('skills') as string
    
    if (!itemId || !title || !description) {
      return NextResponse.json(
        { success: false, error: 'Заполните обязательные поля' },
        { status: 400 }
      )
    }

    // Проверяем, что работа принадлежит пользователю
    const { data: existingItem, error: fetchError } = await supabase
      .from('portfolio')
      .select('user_id, images')
      .eq('id', itemId)
      .single()

    if (fetchError || existingItem.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Работа не найдена или доступ запрещен' },
        { status: 404 }
      )
    }

    // Загружаем новые изображения
    const files = formData.getAll('images') as File[]
    let uploadedImages: string[] = existingItem.images || []

    if (files.length > 0 && files[0].size > 0) {
      // Загружаем каждое изображение
      for (const file of files) {
        if (file.size > 0) {
          const uploadFormData = new FormData()
          uploadFormData.append('file', file)
          uploadFormData.append('folder', 'portfolio')
          uploadFormData.append('entityType', 'portfolio')
          uploadFormData.append('entityId', itemId)

          const uploadResponse = await fetch(`${request.nextUrl.origin}/api/upload`, {
            method: 'POST',
            body: uploadFormData
          })

          const uploadResult = await uploadResponse.json()
          
          if (uploadResult.success && uploadResult.data?.url) {
            uploadedImages.push(uploadResult.data.url)
          }
        }
      }
    }

    // Парсим навыки
    const skills = skillsString ? skillsString.split(',').filter(skill => skill.trim()) : []

    // Обновляем данные
    const { data: updatedItem, error } = await supabase
      .from('portfolio')
      .update({
        title,
        description,
        duration: duration || null,
        client_name: clientName || null,
        project_url: projectUrl || null,
        completed_date: completedDate || null,
        is_public: isPublic,
        skills,
        images: uploadedImages,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Ошибка обновления работы:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updatedItem,
      message: 'Работа обновлена'
    })

  } catch (error) {
    console.error('Неожиданная ошибка:', error)
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// DELETE: Удалить работу из портфолио
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Не авторизован' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('id')
    
    if (!itemId) {
      return NextResponse.json(
        { success: false, error: 'ID работы не указан' },
        { status: 400 }
      )
    }

    // Проверяем, что работа принадлежит пользователю
    const { data: existingItem, error: fetchError } = await supabase
      .from('portfolio')
      .select('user_id')
      .eq('id', itemId)
      .single()

    if (fetchError || existingItem.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Работа не найдена или доступ запрещен' },
        { status: 404 }
      )
    }

    // Удаляем работу
    const { error } = await supabase
      .from('portfolio')
      .delete()
      .eq('id', itemId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Ошибка удаления работы:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Работа удалена из портфолио'
    })

  } catch (error) {
    console.error('Неожиданная ошибка:', error)
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
