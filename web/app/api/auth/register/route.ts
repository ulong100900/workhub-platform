import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email('Некорректный email адрес'),
  password: z.string().min(8, 'Пароль должен содержать минимум 8 символов'),
  fullName: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  phone: z.string().optional(),
  role: z.enum(['customer', 'executor', 'admin']),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'Необходимо согласиться с условиями использования',
  }),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validationResult = registerSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          errors: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      )
    }

    const { email, password, fullName, phone, role } = validationResult.data
    const supabase = createRouteHandlerClient({ cookies })

    // Проверяем, существует ли пользователь с таким email
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'Пользователь с таким email уже существует',
        },
        { status: 409 }
      )
    }

    // Регистрируем пользователя
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone || null,
          role,
        },
        emailRedirectTo: `${request.nextUrl.origin}/auth/callback`,
      },
    })

    if (authError) {
      throw authError
    }

    // Создаем профиль пользователя
    if (authData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: authData.user.id,
            email,
            full_name: fullName,
            phone: phone || null,
            role,
            status: 'pending_verification',
            notification_settings: {
              email: {
                order_updates: true,
                bid_updates: true,
                payment_updates: true,
                marketing: false,
                newsletter: true,
              },
              push: {
                order_updates: true,
                bid_updates: true,
                payment_updates: true,
              },
              sms: {
                important_updates: false,
                two_factor: false,
              },
            },
            preferences: {
              language: 'ru',
              timezone: 'Europe/Moscow',
              currency: 'RUB',
            },
          },
        ])

      if (profileError) {
        console.error('Ошибка создания профиля:', profileError)
        // Откатываем создание пользователя
        await supabase.auth.admin.deleteUser(authData.user.id)
        throw new Error('Не удалось создать профиль пользователя')
      }

      // Отправляем email с подтверждением
      const { error: emailError } = await supabase.auth.resend({
        type: 'signup',
        email,
      })

      if (emailError) {
        console.error('Ошибка отправки email:', emailError)
      }

      // Создаем уведомление о регистрации
      await supabase.from('notifications').insert([
        {
          user_id: authData.user.id,
          type: 'system',
          title: 'Добро пожаловать!',
          message: 'Спасибо за регистрацию на WorkFinder. Подтвердите ваш email для полного доступа.',
          is_read: false,
        },
      ])
    }

    return NextResponse.json({
      success: true,
      message: 'Регистрация успешна. Проверьте вашу почту для подтверждения email.',
      data: {
        userId: authData.user?.id,
        email: authData.user?.email,
      },
    })
  } catch (error: any) {
    console.error('Ошибка регистрации:', error)

    let errorMessage = 'Произошла ошибка при регистрации'
    let statusCode = 500

    if (error.message?.includes('already registered')) {
      errorMessage = 'Пользователь с таким email уже существует'
      statusCode = 409
    } else if (error.message?.includes('password')) {
      errorMessage = 'Пароль слишком слабый'
      statusCode = 400
    } else if (error.message?.includes('email')) {
      errorMessage = 'Некорректный email адрес'
      statusCode = 400
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: statusCode }
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'Метод не разрешен' },
    { status: 405 }
  )
}