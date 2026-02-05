// /web/scripts/fix-project-files.js
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Конфигурация
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const STORAGE_BUCKET = 'project-images'

async function main() {
  console.log('🚀 Начинаем миграцию файлов проектов...')
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Не указаны переменные окружения')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  })

  // 1. Получаем все проекты
  const { data: projects, error } = await supabase
    .from('projects')
    .select('id, title, images')

  if (error) {
    console.error('❌ Ошибка получения проектов:', error)
    process.exit(1)
  }

  console.log(`📊 Найдено ${projects.length} проектов`)

  // 2. Для каждого проекта проверяем и исправляем файлы
  for (const project of projects) {
    console.log(`\n🔄 Обработка проекта: ${project.title} (${project.id})`)
    
    if (!project.images || !Array.isArray(project.images)) {
      console.log('   ℹ️ Нет изображений')
      continue
    }

    const oldImages = [...project.images]
    const newImages = []
    const filesToMove = []
    const filesToDelete = []

    // 3. Проверяем каждое изображение
    for (const imageUrl of oldImages) {
      // Если это наш файл в Storage
      if (imageUrl.includes('supabase.co') && imageUrl.includes(STORAGE_BUCKET)) {
        // Извлекаем путь
        const match = imageUrl.match(new RegExp(`${STORAGE_BUCKET}/(.+)`))
        if (match && match[1]) {
          const oldPath = match[1]
          
          // Проверяем, находится ли файл в правильной папке проекта
          if (!oldPath.startsWith(`projects/${project.id}/`)) {
            // Нужно переместить файл в правильную папку
            const filename = path.basename(oldPath)
            const newPath = `projects/${project.id}/${filename}`
            
            filesToMove.push({ oldPath, newPath })
            newImages.push(imageUrl.replace(oldPath, newPath))
          } else {
            // Файл уже в правильной папке
            newImages.push(imageUrl)
          }
        }
      } else {
        // Внешний URL (unsplash и т.д.) - оставляем как есть
        newImages.push(imageUrl)
      }
    }

    // 4. Перемещаем файлы если нужно
    if (filesToMove.length > 0) {
      console.log(`   🚚 Перемещаем ${filesToMove.length} файлов...`)
      
      for (const { oldPath, newPath } of filesToMove) {
        try {
          // Копируем файл
          const { data: downloadData, error: downloadError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .download(oldPath)

          if (downloadError) {
            console.error(`     ❌ Ошибка скачивания ${oldPath}:`, downloadError)
            continue
          }

          // Загружаем в новое место
          const { error: uploadError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(newPath, downloadData, {
              contentType: 'image/jpeg',
              upsert: true
            })

          if (uploadError) {
            console.error(`     ❌ Ошибка загрузки ${newPath}:`, uploadError)
            continue
          }

          // Удаляем старый файл
          const { error: deleteError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .remove([oldPath])

          if (deleteError) {
            console.error(`     ⚠️ Не удалось удалить старый файл ${oldPath}:`, deleteError)
          }

          console.log(`     ✅ ${oldPath} → ${newPath}`)

        } catch (err) {
          console.error(`     🔥 Ошибка обработки файла:`, err)
        }
      }
    }

    // 5. Обновляем проект с новыми URL
    if (JSON.stringify(oldImages) !== JSON.stringify(newImages)) {
      const { error: updateError } = await supabase
        .from('projects')
        .update({ images: newImages })
        .eq('id', project.id)

      if (updateError) {
        console.error(`   ❌ Ошибка обновления проекта:`, updateError)
      } else {
        console.log(`   ✅ Обновлены URL изображений`)
      }
    }
  }

  console.log('\n🎉 Миграция завершена!')
}

main().catch(console.error)