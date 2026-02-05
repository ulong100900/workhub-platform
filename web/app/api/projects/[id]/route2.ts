// /web/app/api/projects/[id]/route.ts - ИСПРАВЛЕННАЯ ВЕРСИЯ ДЛЯ ПРОДАКШЕНА
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const projectId = params.id
  
  try {
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

    console.log('🗑️ Запрос на ПОЛНОЕ удаление проекта ID:', projectId)

    // 2. Создаем клиент Supabase
    const supabase = await createServerClient()
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

    // 6. Проверяем, что проект можно удалить (только draft или published)
    if (!['draft', 'published'].includes(project.status)) {
      console.error('🚫 Нельзя удалить проект в статусе:', project.status)
      return NextResponse.json(
        { 
          success: false, 
          message: 'Нельзя удалить проект в текущем статусе',
          error: 'Project cannot be deleted in current status'
        }, 
        { status: 400 }
      )
    }

    console.log('🔄 Начинаем полное удаление проекта...')

    // 7. ПОЛУЧАЕМ ВСЕ ФАЙЛЫ ПРОЕКТА ИЗ STORAGE
    let storageFilesToDelete: string[] = []
    
    if (project.images && Array.isArray(project.images) && project.images.length > 0) {
      console.log(`📸 Проект содержит ${project.images.length} изображений`)
      
      // Получаем все файлы проекта из Storage
      const { data: filesList, error: listError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .list(`projects/${projectId}`)
      
      if (listError) {
        console.error('⚠️ Не удалось получить список файлов из Storage:', listError)
      } else if (filesList && filesList.length > 0) {
        // Добавляем все файлы проекта для удаления
        filesList.forEach(file => {
          storageFilesToDelete.push(`projects/${projectId}/${file.name}`)
        })
        console.log(`📂 Найдено ${filesList.length} файлов проекта в Storage`)
      }
      
      // Также проверяем URL в images на случай, если есть старые ссылки
      project.images.forEach((url: string) => {
        if (url.includes('supabase.co') && url.includes(STORAGE_BUCKET)) {
          // Извлекаем путь из URL
          const match = url.match(new RegExp(`${STORAGE_BUCKET}/(.+)`))
          if (match && match[1] && !storageFilesToDelete.includes(match[1])) {
            storageFilesToDelete.push(match[1])
          }
        }
      })
    }

    // 8. УДАЛЯЕМ ВСЕ ФАЙЛЫ ПРОЕКТА ИЗ STORAGE
    let deletedStorageFilesCount = 0
    if (storageFilesToDelete.length > 0) {
      try {
        console.log(`🗑️ Удаляем ${storageFilesToDelete.length} файлов проекта из Storage...`)
        
        // Удаляем файлы пачками по 100 (ограничение Supabase)
        const batchSize = 100
        for (let i = 0; i < storageFilesToDelete.length; i += batchSize) {
          const batch = storageFilesToDelete.slice(i, i + batchSize)
          
          const { error: storageError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .remove(batch)
          
          if (storageError) {
            console.error(`⚠️ Ошибка удаления файлов из Storage (batch ${i/batchSize + 1}):`, storageError)
          } else {
            deletedStorageFilesCount += batch.length
            console.log(`✅ Удалено ${batch.length} файлов (${i/batchSize + 1} пачка)`)
          }
        }
        
        console.log(`📊 Итого удалено ${deletedStorageFilesCount} файлов из Storage`)
        
      } catch (storageError) {
        console.error('⚠️ Ошибка при работе с Storage:', storageError)
      }
    } else {
      console.log('ℹ️ Нет файлов в Storage для удаления')
    }

    // 9. УДАЛЯЕМ ВСЕ СВЯЗАННЫЕ ДАННЫЕ ИЗ ТАБЛИЦ
    console.log('🗑️ Удаляем связанные данные из таблиц...')
    
    // Массив таблиц для удаления
    const tablesToClean = [
      { name: 'bids', field: 'project_id' },
      { name: 'messages', field: 'project_id' },
      { name: 'notifications', field: 'project_id' },
      { name: 'reviews', field: 'project_id' },
      { name: 'orders', field: 'project_id' },
      { name: 'jobs', field: 'project_id' },
      { name: 'project_views', field: 'project_id' },
      { name: 'project_favorites', field: 'project_id' }
    ]

    // Удаляем данные из всех таблиц
    const deletePromises = tablesToClean.map(table => 
      supabase.from(table.name)
        .delete()
        .eq(table.field, projectId)
        .then(({ error, count }) => {
          if (error) {
            console.error(`⚠️ Ошибка удаления из ${table.name}:`, error)
            return { table: table.name, success: false, error: error.message }
          }
          console.log(`✅ Удалено из ${table.name}: ${count || 0} записей`)
          return { table: table.name, success: true, count: count || 0 }
        })
        .catch(err => {
          console.error(`⚠️ Исключение при удалении из ${table.name}:`, err)
          return { table: table.name, success: false, error: err.message }
        })
    )

    // Ждем завершения всех операций удаления
    const deleteResults = await Promise.allSettled(deletePromises)
    
    console.log('📊 Результаты удаления связанных данных:')
    deleteResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`  • ${tablesToClean[index].name}: ${result.value.success ? 'OK' : 'ERROR'}`)
      }
    })

    // 10. УДАЛЯЕМ САМ ПРОЕКТ
    console.log('🔄 Удаляем основной проект из таблицы projects...')
    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)

    if (deleteError) {
      console.error('❌ Ошибка удаления проекта:', deleteError)
      return NextResponse.json(
        { 
          success: false, 
          message: 'Ошибка удаления проекта',
          error: deleteError.message
        }, 
        { status: 500 }
      )
    }

    console.log('🎉 ПРОЕКТ И ВСЕ ДАННЫЕ УСПЕШНО УДАЛЕНЫ!', {
      projectId,
      filesDeleted: deletedStorageFilesCount,
      tablesCleaned: tablesToClean.length
    })

    return NextResponse.json(
      { 
        success: true, 
        message: 'Проект и все связанные данные успешно удалены',
        deletedData: {
          projectId,
          storage: {
            totalFiles: storageFilesToDelete.length,
            deletedFiles: deletedStorageFilesCount
          },
          tables: tablesToClean.map(t => t.name),
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

// GET: Получение одного проекта
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const projectId = params.id
  
  try {
    // Валидация ID
    if (!projectId || projectId.length < 1) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Неверный ID проекта'
        }, 
        { status: 400 }
      )
    }

    console.log('📄 Получение проекта ID:', projectId)

    const supabase = await createServerClient()

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