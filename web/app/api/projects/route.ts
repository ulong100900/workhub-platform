// /web/app/api/projects/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { russianCities } from '@/data/russianCities'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

// Загрузка файлов проекта в Storage
async function uploadProjectFiles(
  supabase: any,
  projectId: string,
  files: File[],
  existingImages: string[] = []
): Promise<{ uploadedUrls: string[]; errors: string[] }> {
  const uploadedUrls: string[] = [...existingImages]
  const errors: string[] = []
  const STORAGE_BUCKET = 'project-images'

  console.log(`📤 Начинаем загрузку ${files.length} файлов для проекта ${projectId}...`)

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `projects/${projectId}/${fileName}`

    try {
      console.log(`📤 Загрузка файла ${i + 1}/${files.length}: ${file.name}`)

      const { error: uploadError, data } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error(`❌ Ошибка загрузки файла ${file.name}:`, uploadError)
        errors.push(`Файл "${file.name}": ${uploadError.message}`)
        continue
      }

      // Получаем публичный URL
      const { data: { publicUrl } } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath)

      if (publicUrl) {
        uploadedUrls.push(publicUrl)
        console.log(`✅ Файл загружен: ${filePath}`)
      } else {
        console.warn(`⚠️ Не удалось получить публичный URL для файла: ${filePath}`)
        errors.push(`Файл "${file.name}": не удалось получить ссылку`)
      }

    } catch (fileError: any) {
      console.error(`❌ Ошибка при обработке файла ${file.name}:`, fileError)
      errors.push(`Файл "${file.name}": ${fileError.message}`)
    }
  }

  console.log(`📊 Загрузка завершена: ${uploadedUrls.length - existingImages.length} новых файлов, ${errors.length} ошибок`)
  
  return { uploadedUrls, errors }
}

// Очистка старых изображений
async function cleanupOldImages(
  supabase: any,
  projectId: string,
  currentImageUrls: string[]
): Promise<void> {
  const STORAGE_BUCKET = 'project-images'
  
  try {
    // Получаем все файлы проекта из Storage
    const { data: filesList, error: listError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(`projects/${projectId}`)
    
    if (listError || !filesList) {
      console.error('⚠️ Не удалось получить список файлов для очистки:', listError)
      return
    }

    // Определяем какие файлы нужно удалить (те, которых нет в currentImageUrls)
    const filesToDelete: string[] = []
    
    for (const file of filesList) {
      const filePath = `projects/${projectId}/${file.name}`
      
      // Проверяем, есть ли этот файл в текущих URL
      const isStillUsed = currentImageUrls.some(url => 
        url.includes(file.name) || url.includes(filePath)
      )
      
      if (!isStillUsed) {
        filesToDelete.push(filePath)
      }
    }

    // Удаляем неиспользуемые файлы
    if (filesToDelete.length > 0) {
      console.log(`🗑️ Удаляем ${filesToDelete.length} старых файлов...`)
      
      const { error: deleteError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove(filesToDelete)
      
      if (deleteError) {
        console.error('⚠️ Ошибка удаления старых файлов:', deleteError)
      } else {
        console.log(`✅ Удалено ${filesToDelete.length} старых файлов`)
      }
    } else {
      console.log('ℹ️ Нет старых файлов для удаления')
    }

  } catch (error) {
    console.error('❌ Ошибка в cleanupOldImages:', error)
  }
}

// Функция для получения одного проекта (вспомогательная)
async function getSingleProject(supabase: any, projectId: string) {
  try {
    console.log('🔍 Получение одного проекта по ID:', projectId)
    
    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (error) {
      console.error('❌ Ошибка получения проекта:', error)
      return NextResponse.json(
        {
          success: false,
          message: 'Проект не найден'
        },
        { status: 404 }
      )
    }

    if (!project) {
      return NextResponse.json(
        {
          success: false,
          message: 'Проект не найден'
        },
        { status: 404 }
      )
    }

    console.log('✅ Проект получен:', {
      id: project.id,
      title: project.title
    })

    return NextResponse.json({
      success: true,
      data: project
    })
    
  } catch (error: any) {
    console.error('❌ Ошибка в getSingleProject:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Ошибка сервера'
      },
      { status: 500 }
    )
  }
}

// ==================== API ENDPOINTS ====================

// GET: Получение списка проектов
export async function GET(request: NextRequest) {
  console.log('=== GET ПРОЕКТЫ ===')
  
  try {
    const supabase = await createClient()
    
    // Проверяем подключение к БД
    console.log('🔍 Проверяем подключение к БД...')
    const { data: testData, error: testError } = await supabase
      .from('projects')
      .select('count', { count: 'exact', head: true })
    
    if (testError) {
      console.error('❌ Ошибка подключения к БД:', testError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Ошибка подключения к базе данных',
          message: testError.message
        },
        { status: 500 }
      )
    }
    
    console.log('✅ Подключение к БД успешно')

    const { searchParams } = new URL(request.url)
    
    // Параметры запроса
    const category = searchParams.get('category') || 'all'
    const subcategory = searchParams.get('subcategory')
    const city = searchParams.get('city')
    const searchQuery = searchParams.get('q') || searchParams.get('search') || ''
    const limit = parseInt(searchParams.get('limit') || '50')
    
    console.log('📋 Параметры запроса:', {
      category,
      subcategory,
      city,
      searchQuery,
      limit
    })

    // Базовый запрос
    let query = supabase
      .from('projects')
      .select('*', { count: 'exact' })
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(limit)

    // Фильтры
    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    if (subcategory) {
      query = query.eq('subcategory', subcategory)
    }

    if (city && city !== 'Вся Россия') {
      if (city === 'Удаленная работа') {
        query = query.eq('is_remote', true)
      } else {
        query = query.or(`location_city.ilike.%${city}%,is_remote.eq.true`)
      }
    }

    if (searchQuery) {
      query = query.or(
        `title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,detailed_description.ilike.%${searchQuery}%`
      )
    }

    const { data: projects, error, count } = await query

    if (error) {
      console.error('❌ Ошибка получения проектов:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Ошибка базы данных',
          message: error.message,
          details: error.details,
          hint: error.hint
        },
        { status: 500 }
      )
    }

    console.log(`✅ Найдено проектов: ${count || 0}`)
    
    // Логируем первый проект для отладки
    if (projects && projects.length > 0) {
      console.log('📋 Пример проекта:', {
        id: projects[0].id,
        title: projects[0].title,
        status: projects[0].status,
        images: projects[0].images?.length || 0
      })
    }

    if (!projects || projects.length === 0) {
      console.log('ℹ️ Проекты не найдены')
      return NextResponse.json({
        success: true,
        data: [],
        pagination: {
          page: 1,
          limit,
          total: 0,
          totalPages: 0
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: projects,
      pagination: {
        page: 1,
        limit,
        total: count || projects.length,
        totalPages: Math.ceil((count || projects.length) / limit)
      }
    })

  } catch (error: any) {
    console.error('🔥 Критическая ошибка GET проектов:', error)
    console.error('Stack trace:', error.stack)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Внутренняя ошибка сервера',
        message: error.message || 'Произошла непредвиденная ошибка'
      },
      { status: 500 }
    )
  }
}

// POST: Создание нового проекта
export async function POST(request: NextRequest) {
  console.log('=== СОЗДАНИЕ ПРОЕКТА ===')
  
  try {
    const supabase = await createClient()
    
    // 1. Проверка авторизации
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('❌ Пользователь не авторизован')
      return NextResponse.json(
        { 
          success: false, 
          error: 'Не авторизован',
          message: 'Пожалуйста, войдите в систему'
        },
        { status: 401 }
      )
    }

    console.log('✅ Пользователь авторизован:', user.email)

    // 2. Парсим FormData
    const formData = await request.formData()
    
    // 3. Извлекаем данные
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
    
    console.log('📋 Данные проекта:', {
      title,
      category,
      subcategory,
      budgetType,
      budgetAmount,
      isRemote,
      city,
      files: files.length,
      existingImages: existingImages.length,
      skills: skills.length
    })

    // 4. Валидация
    const errors: string[] = []
    if (!title?.trim()) errors.push('Введите название проекта')
    if (!description?.trim()) errors.push('Введите описание проекта')
    if (description.length < 20) errors.push('Описание должно быть не менее 20 символов')
    if (!category) errors.push('Выберите категорию')
    if (!isRemote && !city) errors.push('Укажите город или выберите удаленную работу')

    if (errors.length > 0) {
      console.error('❌ Ошибки валидации:', errors)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Ошибка валидации',
          message: errors.join('. '),
          details: errors
        },
        { status: 400 }
      )
    }

    // 5. Создаем проект в БД (сначала без изображений)
    console.log('💾 Создаем проект в БД...')
    
    const projectData = {
      title: title.trim(),
      description: description.trim(),
      detailed_description: detailedDescription.trim(),
      category,
      subcategory: subcategory || null,
      budget: budgetType === 'fixed' ? budgetAmount : 0,
      budget_type: budgetType,
      currency: 'RUB',
      status: 'published',
      client_id: user.id,
      
      is_remote: isRemote,
      location_city: isRemote ? null : (cityName || city),
      location_country: isRemote ? null : 'Россия',
      
      deadline: deadline || null,
      estimated_duration: estimatedDuration || null,
      skills: Array.isArray(skills) ? skills : [],
      
      images: existingImages, // Временно сохраняем существующие изображения
      
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      published_at: new Date().toISOString(),
      
      proposals_count: 0,
      views_count: 0,
      is_urgent: false,
      is_featured: false
    }

    const { data: project, error: insertError } = await supabase
      .from('projects')
      .insert(projectData)
      .select()
      .single()

    if (insertError) {
      console.error('❌ Ошибка создания проекта в БД:', insertError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Ошибка базы данных',
          message: insertError.message,
          code: insertError.code,
          hint: insertError.hint
        },
        { status: 500 }
      )
    }

    console.log('✅ Проект создан в БД, ID:', project.id)

    // 6. Загружаем новые файлы
    const { uploadedUrls, errors: uploadErrors } = await uploadProjectFiles(
      supabase,
      project.id,
      files,
      existingImages
    )

    // 7. Если файлы не загрузились, но проект создан - сохраняем без изображений
    if (uploadErrors.length > 0 && uploadedUrls.length === 0) {
      console.warn('⚠️ Не удалось загрузить файлы, но проект создан')
      // Проект уже создан с existingImages
      project.images = existingImages
    } else if (uploadedUrls.length > 0 || existingImages.length > 0) {
      console.log('🔄 Обновляем проект с изображениями...')
      
      const { error: updateError } = await supabase
        .from('projects')
        .update({ 
          images: uploadedUrls,
          updated_at: new Date().toISOString()
        })
        .eq('id', project.id)

      if (updateError) {
        console.error('❌ Ошибка обновления проекта:', updateError)
      } else {
        console.log(`✅ Проект обновлен с ${uploadedUrls.length} изображениями`)
        project.images = uploadedUrls
      }
    }

    // 8. Формируем ответ
    const response: any = {
      success: true,
      data: project,
      message: 'Проект успешно создан'
    }

    if (uploadedUrls.length > 0) {
      response.message = `Проект создан с ${uploadedUrls.length} изображениями`
    }

    if (uploadErrors.length > 0) {
      response.warnings = uploadErrors
      response.message += ` (с ${uploadErrors.length} предупреждениями)`
    }

    console.log('🎉 Проект полностью создан:', {
      id: project.id,
      title: project.title,
      imagesCount: project.images?.length || 0,
      storagePaths: project.images?.map((url: string) => {
        const match = url.match(/project-images\/(.+)/)
        return match ? match[1] : 'неизвестный путь'
      })
    })

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('🔥 Критическая ошибка при создании проекта:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Внутренняя ошибка сервера',
        message: error.message || 'Произошла непредвиденная ошибка'
      },
      { status: 500 }
    )
  }
}

// PUT: Обновление проекта - ИСПРАВЛЕННЫЙ ВАРИАНТ
export async function PUT(request: NextRequest) {
  console.log('=== ОБНОВЛЕНИЕ ПРОЕКТА ===')
  
  try {
    const supabase = await createClient()
    const searchParams = new URL(request.url).searchParams
    const projectId = searchParams.get('id')
    
    if (!projectId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Отсутствует ID проекта',
          message: 'ID проекта обязателен'
        },
        { status: 400 }
      )
    }

    // 1. Проверка авторизации
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('❌ Пользователь не авторизован')
      return NextResponse.json(
        { 
          success: false, 
          error: 'Не авторизован',
          message: 'Пожалуйста, войдите в систему'
        },
        { status: 401 }
      )
    }

    // 2. Проверяем права на проект
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
          error: 'Проект не найден',
          message: 'Проект не существует'
        },
        { status: 404 }
      )
    }

    if (project.client_id !== user.id) {
      console.error('🚫 Пользователь не является владельцем проекта')
      return NextResponse.json(
        { 
          success: false, 
          error: 'Нет прав',
          message: 'У вас нет прав на редактирование этого проекта'
        },
        { status: 403 }
      )
    }

    // 3. Парсим FormData
    const formData = await request.formData()
    
    // 4. Извлекаем данные
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

    // 5. Валидация
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

    // 6. Загружаем новые файлы
    let uploadedUrls = [...existingImages]
    if (files.length > 0) {
      const { uploadedUrls: newUrls, errors: uploadErrors } = await uploadProjectFiles(
        supabase,
        projectId,
        files,
        existingImages
      )
      uploadedUrls = newUrls
      
      if (uploadErrors.length > 0) {
        console.warn('⚠️ Ошибки при загрузке файлов:', uploadErrors)
      }
    }

    // 7. Удаляем старые изображения которые больше не нужны
    await cleanupOldImages(supabase, projectId, uploadedUrls)

    // 8. Обновляем проект
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

    // 9. Формируем ответ
    const response: any = {
      success: true,
      data: updatedProject,
      message: 'Проект успешно обновлен'
    }

    return NextResponse.json(response, { status: 200 })

  } catch (error: any) {
    console.error('🔥 Критическая ошибка при обновлении проекта:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Внутренняя ошибка сервера',
        message: error.message || 'Произошла непредвиденная ошибка'
      },
      { status: 500 }
    )
  }
}