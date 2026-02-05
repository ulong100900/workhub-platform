import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // 1. Проверяем авторизацию
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      )
    }

    // 2. Получаем данные из запроса
    const { reason, feedback } = await request.json()

    // 3. Создаем запрос на удаление с задержкой 30 дней
    const deleteAt = new Date()
    deleteAt.setDate(deleteAt.getDate() + 30)

    // 4. Сохраняем запрос в базу
    const { error } = await supabase
      .from('account_deletion_requests')
      .insert({
        user_id: user.id,
        reason,
        feedback,
        delete_at: deleteAt.toISOString(),
        status: 'pending',
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Ошибка при создании запроса на удаление:', error)
      return NextResponse.json(
        { error: 'Ошибка при создании запроса' },
        { status: 500 }
      )
    }

    // 5. Отправляем email уведомление
    // Здесь должен быть код отправки email
    
    // 6. Возвращаем успех
    return NextResponse.json({
      success: true,
      message: 'Запрос на удаление аккаунта принят. Аккаунт будет удален через 30 дней.',
      deleteDate: deleteAt.toISOString()
    })

  } catch (error) {
    console.error('Ошибка в API удаления аккаунта:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// Отмена запроса на удаление
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      )
    }

    // Удаляем запрос на удаление
    const { error } = await supabase
      .from('account_deletion_requests')
      .delete()
      .eq('user_id', user.id)
      .eq('status', 'pending')

    if (error) {
      return NextResponse.json(
        { error: 'Ошибка при отмене запроса' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Запрос на удаление отменен'
    })

  } catch (error) {
    console.error('Ошибка при отмене удаления:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}