import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Получаем текущего пользователя
    const { data: { user } } = await supabase.auth.getUser()

    // Выход из системы
    const { error } = await supabase.auth.signOut()

    if (error) {
      throw error
    }

    // Создаем запись о выходе
    if (user) {
      await supabase.from('user_activity').insert([
        {
          user_id: user.id,
          activity_type: 'logout',
          description: 'Пользователь вышел из системы',
          ip_address: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
        },
      ])
    }

    // Очищаем cookies
    const response = NextResponse.json({
      success: true,
      message: 'Выход выполнен успешно',
    })

    // Удаляем cookie remember_me
    response.cookies.delete('remember_me')

    return response
  } catch (error: any) {
    console.error('Ошибка выхода:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Произошла ошибка при выходе',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'Метод не разрешен' },
    { status: 405 }
  )
}