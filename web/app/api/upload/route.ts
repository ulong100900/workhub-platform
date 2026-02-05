// /web/app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Разрешенные MIME типы
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/jfif',
];

// Вспомогательная функция для получения расширения
const getFileExtension = (mimeType: string): string => {
  const mimeToExt: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/jfif': 'jpg',
  };
  return mimeToExt[mimeType] || 'jpg';
};

export async function POST(request: NextRequest) {
  console.log('=== ЗАГРУЗКА ФАЙЛА (исправленная версия) ===')
  
  try {
    // 1. Получаем cookies и создаем клиент
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    
    // 2. Проверка авторизации
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('Ошибка авторизации:', authError.message)
      // Продолжаем даже если есть ошибка авторизации, проверяем через токен
    }
    
    if (!user) {
      console.error('Пользователь не найден в сессии')
      
      // Попробуем получить токен из заголовков
      const authHeader = request.headers.get('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        console.log('Получен токен из заголовка')
        
        // Проверяем токен через Supabase
        const { data: userData, error: tokenError } = await supabase.auth.getUser(token)
        if (tokenError) {
          console.error('Ошибка проверки токена:', tokenError)
          return NextResponse.json(
            { 
              success: false, 
              error: 'Не авторизован',
              message: 'Требуется авторизация для загрузки файлов'
            },
            { status: 401 }
          )
        }
        
        if (!userData.user) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Не авторизован',
              message: 'Токен недействителен'
            },
            { status: 401 }
          )
        }
        
        // Устанавливаем пользователя
        console.log('✅ Пользователь авторизован по токену:', userData.user.email)
      } else {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Не авторизован',
            message: 'Требуется авторизация для загрузки файлов'
          },
          { status: 401 }
        )
      }
    } else {
      console.log('✅ Пользователь авторизован в сессии:', user.email)
    }

    // 3. Парсим FormData
    const formData = await request.formData()
    
    // 4. Извлекаем данные
    const file = formData.get('file') as File
    const projectId = formData.get('projectId') as string

    // 5. Валидация файла
    if (!file) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Файл не указан',
          message: 'Файл обязателен для загрузки'
        },
        { status: 400 }
      )
    }

    // 6. Валидация типа файла
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      console.error('Недопустимый тип файла:', file.type)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Недопустимый тип файла',
          message: `Тип файла "${file.type}" не поддерживается. Разрешены только изображения`,
          allowedTypes: ALLOWED_MIME_TYPES
        },
        { status: 400 }
      )
    }

    // 7. Генерация уникального имени файла
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = getFileExtension(file.type)
    const uniqueFileName = `${timestamp}_${randomString}.${fileExtension}`
    
    // 8. Определяем путь для хранения
    let storagePath: string
    let bucketName = 'public' // Используем public бакет для простоты
    
    if (projectId && projectId.trim() !== '') {
      storagePath = `projects/${projectId}/${uniqueFileName}`
    } else {
      // Если нет проекта, используем временную папку
      storagePath = `temp/${uniqueFileName}`
    }

    console.log('Конфигурация загрузки:', {
      originalName: file.name,
      type: file.type,
      size: file.size,
      storagePath,
      bucketName,
      projectId: projectId || 'temp'
    })

    // 9. Конвертируем File в ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 10. Загружаем файл в Supabase Storage
    console.log('Загрузка в Supabase Storage...')
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Ошибка загрузки в Supabase:', uploadError)
      
      // Если public бакет не работает, попробуем project-images
      if (uploadError.message.includes('bucket') || uploadError.message.includes('not found')) {
        console.log('Пробуем бакет project-images...')
        bucketName = 'project-images'
        
        const { data: retryData, error: retryError } = await supabase.storage
          .from(bucketName)
          .upload(storagePath, buffer, {
            contentType: file.type,
            cacheControl: '3600',
            upsert: false
          })
          
        if (retryError) {
          console.error('Ошибка загрузки в project-images:', retryError)
          
          // Последняя попытка - создаем временный путь
          bucketName = 'public'
          storagePath = `${Date.now()}_${uniqueFileName}`
          
          const { data: finalData, error: finalError } = await supabase.storage
            .from(bucketName)
            .upload(storagePath, buffer, {
              contentType: file.type,
              cacheControl: '3600',
              upsert: false
            })
            
          if (finalError) {
            console.error('Финальная ошибка загрузки:', finalError)
            return NextResponse.json(
              { 
                success: false, 
                error: 'Ошибка загрузки файла',
                message: finalError.message || 'Не удалось загрузить файл',
                details: 'Проверьте настройки Storage в Supabase'
              },
              { status: 500 }
            )
          }
        }
      } else {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Ошибка загрузки файла',
            message: uploadError.message || 'Не удалось загрузить файл'
          },
          { status: 500 }
        )
      }
    }

    console.log('✅ Файл загружен в Storage')

    // 11. Получаем публичную ссылку
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(storagePath)

    const publicUrl = urlData.publicUrl
    console.log('Публичная ссылка:', publicUrl)

    // 12. Возвращаем успешный ответ
    return NextResponse.json({
      success: true,
      data: {
        url: publicUrl,
        originalName: file.name,
        fileName: uniqueFileName,
        size: file.size,
        type: file.type,
        storagePath,
        bucketName,
        projectId: projectId || null,
        uploadedAt: new Date().toISOString()
      },
      message: 'Файл успешно загружен'
    })

  } catch (error: any) {
    console.error('Критическая ошибка загрузки файла:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Внутренняя ошибка сервера',
        message: error.message || 'Произошла непредвиденная ошибка при загрузке файла'
      },
      { status: 500 }
    )
  }
}