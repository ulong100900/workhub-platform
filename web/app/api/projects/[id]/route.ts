// /web/app/api/projects/[id]/route.ts - ИСПРАВЛЕННАЯ ВЕРСИЯ
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Распаковываем параметры
    const { id: projectId } = await params
    
    console.log('📄 Получение проекта ID:', projectId)

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

    // Увеличиваем счетчик просмотров
    await supabase
      .from('projects')
      .update({ 
        views_count: (project.views_count || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)

    console.log('✅ Проект получен:', { 
      id: project.id,
      title: project.title,
      views: (project.views_count || 0) + 1
    })

    return NextResponse.json({
      success: true,
      data: project,
      message: 'Проект успешно получен'
    })
    
  } catch (error: any) {
    console.error('🔥 Критическая ошибка при получении проекта:', error)
    
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    
    // 1. Валидация ID
    if (!projectId || projectId.length < 1) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Неверный ID проекта'
        }, 
        { status: 400 }
      )
    }

    console.log('✏️ Запрос на обновление проекта ID:', projectId)

    // 2. Создаем клиент Supabase
    const supabase = await createClient()

    // 3. Проверяем авторизацию пользователя
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('❌ Ошибка авторизации:', userError)
      return NextResponse.json(
        { 
          success: false, 
          message: 'Не авторизован',
          error: 'Unauthorized'
        }, 
        { status: 401 }
      )
    }

    // 4. Парсим FormData
    const formData = await request.formData()
    
    // 5. Извлекаем данные
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const detailedDescription = formData.get('detailedDescription') as string || description
    const category = formData.get('category') as string
    const subcategory = formData.get('subcategory') as string
    const budgetType = formData.get('budgetType') as string || 'fixed'
    const budgetAmount = parseFloat(formData.get('budgetAmount') as string || '0')
    const isRemote = formData.get('isRemote') === 'true'
    const city = formData.get('city') as string || ''
    const cityName = formData.get('cityName') as string || ''
    const deadline = formData.get('deadline') as string
    const estimatedDuration = formData.get('estimatedDuration') as string
    const skills = JSON.parse(formData.get('skills') as string || '[]')
    const existingImages = JSON.parse(formData.get('existingImages') as string || '[]')
    const files = formData.getAll('files') as File[]
    
    console.log('📋 Данные для обновления:', {
      projectId,
      title,
      category,
      files: files.length,
      existingImages: existingImages.length
    })

    // 6. Проверяем существование проекта
    const { data: existingProject, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (projectError || !existingProject) {
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

    // 7. Проверяем, что пользователь является владельцем
    if (existingProject.client_id !== user.id) {
      console.error('🚫 Пользователь не является владельцем проекта')
      return NextResponse.json(
        { 
          success: false, 
          message: 'У вас нет прав на редактирование этого проекта',
          error: 'Forbidden'
        }, 
        { status: 403 }
      )
    }

    // 8. Валидация данных
    const errors: string[] = []
    if (!title?.trim()) errors.push('Введите название проекта')
    if (!description?.trim()) errors.push('Введите описание проекта')
    if (!category) errors.push('Выберите категорию')

    if (errors.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Ошибка валидации',
          message: errors.join('. ')
        },
        { status: 400 }
      )
    }

    // 9. Загружаем новые файлы (если есть)
    let uploadedUrls = [...existingImages]
    if (files.length > 0) {
      const STORAGE_BUCKET = 'project-images'
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `projects/${projectId}/${fileName}`

        try {
          const { error: uploadError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            })

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from(STORAGE_BUCKET)
              .getPublicUrl(filePath)
            
            if (publicUrl) {
              uploadedUrls.push(publicUrl)
            }
          }
        } catch (error) {
          console.error('❌ Ошибка загрузки файла:', error)
        }
      }
    }

    // 10. Обновляем проект в БД
    const updateData = {
      title: title.trim(),
      description: description.trim(),
      detailed_description: detailedDescription.trim(),
      category,
      subcategory: subcategory || null,
      budget: budgetType === 'fixed' ? budgetAmount : 0,
      budget_type: budgetType,
      is_remote: isRemote,
      location_city: isRemote ? null : (cityName || city),
      location_country: isRemote ? null : 'Россия',
      deadline: deadline || null,
      estimated_duration: estimatedDuration || null,
      skills: Array.isArray(skills) ? skills : [],
      images: uploadedUrls,
      updated_at: new Date().toISOString()
    }

    console.log('🔄 Обновляем проект с данными:', {
      projectId,
      imagesCount: uploadedUrls.length
    })

    const { data: updatedProject, error: updateError } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', projectId)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Ошибка обновления проекта:', updateError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Ошибка базы данных',
          message: updateError.message
        },
        { status: 500 }
      )
    }

    console.log('✅ Проект обновлен:', {
      id: projectId,
      title: updatedProject.title,
      imagesCount: uploadedUrls.length
    })

    // 11. Возвращаем успешный ответ
    return NextResponse.json({
      success: true,
      data: updatedProject,
      message: 'Проект успешно обновлен'
    }, { status: 200 })

  } catch (error: any) {
    console.error('🔥 Критическая ошибка при обновлении проекта:', error)
    
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    
    // Валидация ID
    if (!projectId) {
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

    // Проверяем права на проект
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Проект не найден'
        }, 
        { status: 404 }
      )
    }

    if (project.client_id !== user.id) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Нет прав на редактирование'
        }, 
        { status: 403 }
      )
    }

    // Получаем данные для обновления
    const body = await request.json()
    const { status } = body

    // Валидация статуса
    const allowedStatuses = ['draft', 'published', 'pending', 'completed', 'cancelled']
    if (!status || !allowedStatuses.includes(status)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Неверный статус'
        }, 
        { status: 400 }
      )
    }

    // Обновляем проект
    const { data: updatedProject, error: updateError } = await supabase
      .from('projects')
      .update({ 
        status,
        updated_at: new Date().toISOString(),
        ...(status === 'published' && !project.published_at ? {
          published_at: new Date().toISOString()
        } : {})
      })
      .eq('id', projectId)
      .select()
      .single()

    if (updateError) {
      console.error('Ошибка обновления:', updateError)
      return NextResponse.json(
        { 
          success: false, 
          message: 'Ошибка обновления'
        }, 
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updatedProject,
      message: `Проект ${status === 'draft' ? 'снят с публикации' : 'опубликован'}`
    })

  } catch (error: any) {
    console.error('Ошибка:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Внутренняя ошибка'
      }, 
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    
    // 1. Валидация ID
    if (!projectId || projectId.length < 1) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Неверный ID проекта'
        }, 
        { status: 400 }
      )
    }

    console.log('🗑️ Запрос на удаление проекта ID:', projectId)

    // 2. Создаем клиент Supabase
    const supabase = await createClient()
    const STORAGE_BUCKET = 'project-images'

    // 3. Проверяем авторизацию пользователя
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('❌ Ошибка авторизации:', userError)
      return NextResponse.json(
        { 
          success: false, 
          message: 'Не авторизован',
          error: 'Unauthorized'
        }, 
        { status: 401 }
      )
    }

    const userId = user.id
    
    // 4. Проверяем существование проекта и права пользователя
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

    console.log('✅ Проект найден:', { 
      id: project.id,
      title: project.title, 
      clientId: project.client_id,
      status: project.status 
    })

    // 5. Проверяем, что пользователь является владельцем проекта
    if (project.client_id !== userId) {
      console.error('🚫 Пользователь не является владельцем проекта:', {
        userId,
        clientId: project.client_id
      })
      return NextResponse.json(
        { 
          success: false, 
          message: 'У вас нет прав на удаление этого проекта',
          error: 'Forbidden'
        }, 
        { status: 403 }
      )
    }

    console.log('🔄 Начинаем удаление проекта...')

    // 6. ПРЯМОЕ УДАЛЕНИЕ ФАЙЛОВ ИЗ STORAGE
    console.log('🗑️ Удаляем файлы проекта...')
    let deletedFilesCount = 0
    
    try {
      const { data: files, error: listError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .list(`projects/${projectId}`)
      
      if (!listError && files && files.length > 0) {
        const filePaths = files.map(file => `projects/${projectId}/${file.name}`)
        
        const { error: deleteError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .remove(filePaths)
        
        if (!deleteError) {
          deletedFilesCount = files.length
          console.log(`✅ Удалено ${files.length} файлов`)
        } else {
          console.error('❌ Ошибка удаления файлов:', deleteError.message)
        }
      }
    } catch (error: any) {
      console.error('⚠️ Ошибка удаления файлов:', error.message)
    }

    // 7. УДАЛЯЕМ ПРОЕКТ ИЗ БАЗЫ ДАННЫХ
    console.log('🔄 Удаляем проект из БД...')
    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)

    if (deleteError) {
      console.error('❌ Ошибка удаления проекта из БД:', deleteError)
      
      // Пробуем пометить как удаленный
      const { error: updateError } = await supabase
        .from('projects')
        .update({ 
          status: 'deleted',
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)
      
      if (updateError) {
        console.error('❌ Ошибка обновления статуса:', updateError)
        return NextResponse.json(
          { 
            success: false, 
            message: 'Ошибка удаления проекта',
            error: deleteError.message
          }, 
          { status: 500 }
        )
      }
      
      console.log('✅ Проект помечен как удаленный')
      
      return NextResponse.json(
        { 
          success: true, 
          message: 'Проект помечен как удаленный',
          warning: 'Файлы могут остаться в Storage',
          deletedData: {
            projectId,
            status: 'deleted',
            filesDeleted: deletedFilesCount,
            timestamp: new Date().toISOString()
          }
        }, 
        { status: 200 }
      )
    }

    console.log('✅ Проект удален из БД')

    // 8. ФИНАЛЬНЫЙ ОТВЕТ
    console.log('🎉 УДАЛЕНИЕ ЗАВЕРШЕНО')
    
    return NextResponse.json(
      { 
        success: true, 
        message: deletedFilesCount > 0 
          ? `Проект удален. Удалено ${deletedFilesCount} файлов.` 
          : 'Проект удален из БД.',
        deletedData: {
          projectId,
          storage: {
            attempted: true,
            deletedFiles: deletedFilesCount
          },
          database: {
            deleted: true
          },
          note: deletedFilesCount === 0 
            ? 'Если файлы остались в Storage, удалите их через Supabase Dashboard или настройте политики RLS'
            : null,
          timestamp: new Date().toISOString()
        }
      }, 
      { status: 200 }
    )
    
  } catch (error: any) {
    console.error('🔥 Критическая ошибка при удалении проекта:', error)
    
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