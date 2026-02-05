import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const registerSmsSchema = z.object({
  phone: z.string().min(10, 'Номер телефона слишком короткий'),
  name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validationResult = registerSmsSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Неверные данные',
          details: validationResult.error.errors 
        },
        { status: 400 }
      )
    }
    
    const { phone, name } = validationResult.data
    const supabase = await createClient()
    
    // Проверяем верификацию телефона
    const { data: verification } = await supabase
      .from('sms_verifications')
      .select('*')
      .eq('phone', phone)
      .eq('verified', true)
      .is('expires_at', null)
      .single()
    
    if (!verification) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Телефон не подтвержден или срок действия кода истек' 
        },
        { status: 400 }
      )
    }
    
    // Проверяем, существует ли уже пользователь с таким телефоном
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', phone)
      .single()
    
    if (existingUser) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Пользователь с таким телефоном уже существует' 
        },
        { status: 409 }
      )
    }
    
    // Генерируем email и пароль
    const cleanPhone = phone.replace(/\D/g, '')
    const email = `${cleanPhone}@sms.workfinder.local`
    const password = `${cleanPhone.slice(-6)}${Math.random().toString(36).slice(-6)}`
    
    // Создаем пользователя
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          phone,
          name,
          auth_method: 'sms',
        },
      },
    })
    
    if (authError) {
      console.error('Ошибка регистрации через SMS:', authError)
      return NextResponse.json(
        { 
          success: false,
          error: 'Ошибка создания аккаунта',
          details: process.env.NODE_ENV === 'development' ? authError.message : undefined
        },
        { status: 500 }
      )
    }
    
    // Создаем профиль
    if (authData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email,
          phone,
          full_name: name,
          auth_method: 'sms',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      
      if (profileError) {
        console.error('Ошибка создания профиля:', profileError)
        // Откатываем создание пользователя
        await supabase.auth.admin.deleteUser(authData.user.id)
        
        return NextResponse.json(
          { 
            success: false,
            error: 'Ошибка создания профиля' 
          },
          { status: 500 }
        )
      }
    }
    
    // Удаляем использованную верификацию
    await supabase
      .from('sms_verifications')
      .delete()
      .eq('id', verification.id)
    
    return NextResponse.json({
      success: true,
      message: 'Аккаунт успешно создан',
      data: {
        userId: authData.user?.id,
        requiresEmailVerification: !authData.session,
      }
    })
    
  } catch (error: any) {
    console.error('Ошибка регистрации через SMS:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Внутренняя ошибка сервера' 
      },
      { status: 500 }
    )
  }
}