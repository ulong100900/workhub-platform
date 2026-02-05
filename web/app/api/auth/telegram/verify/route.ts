// app/api/auth/telegram/verify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient, createAdminClient } from '@/lib/supabase/server'
import { telegramBot } from '@/lib/telegram/bot'
import { normalizePhoneNumber } from '@/lib/utils/phone'
import { v4 as uuidv4 } from 'uuid'

/**
 * Проверяет и валидирует входные данные
 */
function validateInput(requestId: string, code: string, phone: string): {
  isValid: boolean
  error?: string
  code?: string
  cleanedPhone?: string
} {
  // Проверка UUID
  if (!requestId || typeof requestId !== 'string') {
    return { isValid: false, error: 'ID запроса обязателен', code: 'REQUEST_ID_REQUIRED' }
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(requestId)) {
    return { isValid: false, error: 'Неверный формат ID запроса', code: 'INVALID_REQUEST_ID' }
  }

  // Проверка кода
  if (!code || typeof code !== 'string') {
    return { isValid: false, error: 'Код обязателен', code: 'CODE_REQUIRED' }
  }

  const cleanedCode = code.replace(/\D/g, '')
  if (cleanedCode.length !== 6) {
    return { isValid: false, error: 'Код должен содержать 6 цифр', code: 'INVALID_CODE_LENGTH' }
  }

  // Проверка телефона
  if (!phone || typeof phone !== 'string') {
    return { isValid: false, error: 'Номер телефона обязателен', code: 'PHONE_REQUIRED' }
  }

  const cleanedPhone = normalizePhoneNumber(phone)
  if (!cleanedPhone) {
    return { isValid: false, error: 'Неверный формат номера телефона', code: 'INVALID_PHONE_FORMAT' }
  }

  return {
    isValid: true,
    cleanedPhone,
    code: cleanedCode
  }
}

/**
 * Создает JWT токены для пользователя
 */
async function createUserSession(
  supabaseAdmin: ReturnType<typeof createAdminClient>,
  userId: string,
  userData: any
): Promise<{
  accessToken?: string
  refreshToken?: string
  sessionId?: string
  error?: string
}> {
  try {
    // Создаем кастомный токен для пользователя
    const { data: tokenData, error: tokenError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: `${userId}@telegram.workfinder.local`,
      options: {
        data: {
          user_id: userId,
          phone: userData.phone,
          telegram_id: userData.telegram_user_id,
          auth_method: 'telegram'
        }
      }
    })

    if (tokenError) {
      console.error('Ошибка создания токена:', tokenError)
      return { error: 'Не удалось создать сессию' }
    }

    // Альтернативный подход: создаем пользователя через admin API
    const { data: userDataFromAuth, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: `${userData.phone}@telegram.workfinder`,
      phone: userData.phone,
      email_confirm: true,
      user_metadata: {
        phone: userData.phone,
        telegram_id: userData.telegram_user_id?.toString(),
        telegram_username: userData.telegram_username,
        telegram_first_name: userData.telegram_first_name,
        telegram_last_name: userData.telegram_last_name,
        auth_method: 'telegram',
        created_at: new Date().toISOString()
      }
    })

    if (userError) {
      // Если пользователь уже существует, получаем его
      console.log('Пользователь возможно уже существует, пробуем получить:', userError)
      
      const { data: existingUser } = await supabaseAdmin.auth.admin.getUserById(userId)
      
      if (!existingUser) {
        return { error: 'Не удалось создать или найти пользователя в Auth' }
      }
      
      // Создаем сессию для существующего пользователя
      const { data: session, error: sessionError } = await supabaseAdmin.auth.admin.createSession({
        user_id: existingUser.user.id
      })

      if (sessionError) {
        return { error: 'Не удалось создать сессию' }
      }

      return {
        accessToken: session.session.access_token,
        refreshToken: session.session.refresh_token,
        sessionId: session.session.id
      }
    }

    // Создаем сессию для нового пользователя
    const { data: session, error: sessionError } = await supabaseAdmin.auth.admin.createSession({
      user_id: userDataFromAuth.user.id
    })

    if (sessionError) {
      return { error: 'Не удалось создать сессию' }
    }

    return {
      accessToken: session.session.access_token,
      refreshToken: session.session.refresh_token,
      sessionId: session.session.id
    }
  } catch (error) {
    console.error('Ошибка создания сессии:', error)
    return { error: 'Ошибка создания сессии' }
  }
}

/**
 * API для верификации кода Telegram
 * POST /api/auth/telegram/verify
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const requestId = uuidv4()
  
  try {
    // Парсим тело запроса
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Неверный формат JSON в теле запроса',
          code: 'INVALID_JSON',
          requestId
        },
        { status: 400 }
      )
    }

    const { requestId: verificationRequestId, code, phone } = body

    // Валидация входных данных
    const validation = validateInput(verificationRequestId, code, phone)
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: validation.error,
          code: validation.code,
          requestId
        },
        { status: 400 }
      )
    }

    const cleanedPhone = validation.cleanedPhone!
    const cleanedCode = validation.code!

    // Создаем клиенты Supabase
    const supabase = createServiceRoleClient()
    const supabaseAdmin = createAdminClient()

    // 1. Получаем запись верификации
    const { data: verification, error: verificationError } = await supabase
      .from('telegram_verifications')
      .select('*')
      .eq('id', verificationRequestId)
      .eq('phone', cleanedPhone)
      .single()

    if (verificationError || !verification) {
      console.error('Запись верификации не найдена:', verificationError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Код верификации не найден или не соответствует номеру телефона',
          code: 'VERIFICATION_NOT_FOUND',
          requestId
        },
        { status: 404 }
      )
    }

    // 2. Проверяем статус кода
    const statusChecks: Record<string, { error: string; code: string }> = {
      'verified': { error: 'Код уже был использован', code: 'CODE_ALREADY_USED' },
      'expired': { error: 'Код истек', code: 'CODE_EXPIRED' },
      'failed': { error: 'Превышено количество попыток', code: 'MAX_ATTEMPTS_EXCEEDED' },
      'cancelled': { error: 'Код отменен', code: 'CODE_CANCELLED' }
    }

    if (verification.status in statusChecks) {
      return NextResponse.json(
        { 
          success: false, 
          error: statusChecks[verification.status].error,
          code: statusChecks[verification.status].code,
          requestId
        },
        { status: 400 }
      )
    }

    // 3. Проверяем срок действия
    const expiresAt = new Date(verification.expires_at)
    const now = new Date()
    
    if (expiresAt < now) {
      await supabase
        .from('telegram_verifications')
        .update({ 
          status: 'expired',
          metadata: {
            ...verification.metadata,
            expired_at: now.toISOString(),
            expired_by: 'system'
          }
        })
        .eq('id', verificationRequestId)

      return NextResponse.json(
        { 
          success: false, 
          error: 'Код истек',
          code: 'CODE_EXPIRED',
          requestId
        },
        { status: 400 }
      )
    }

    // 4. Проверяем количество попыток
    if (verification.attempts >= verification.max_attempts) {
      await supabase
        .from('telegram_verifications')
        .update({ 
          status: 'failed',
          metadata: {
            ...verification.metadata,
            failed_at: now.toISOString(),
            failed_reason: 'max_attempts_exceeded',
            final_attempts: verification.attempts
          }
        })
        .eq('id', verificationRequestId)

      return NextResponse.json(
        { 
          success: false, 
          error: 'Превышено количество попыток. Запросите новый код',
          code: 'MAX_ATTEMPTS_EXCEEDED',
          requestId
        },
        { status: 429 }
      )
    }

    // 5. Увеличиваем счетчик попыток
    await supabase
      .from('telegram_verifications')
      .update({ 
        attempts: verification.attempts + 1,
        metadata: {
          ...verification.metadata,
          last_attempt_at: now.toISOString(),
          client_ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
          client_user_agent: request.headers.get('user-agent')
        }
      })
      .eq('id', verificationRequestId)

    // 6. Проверяем код
    if (verification.code !== cleanedCode) {
      const remainingAttempts = verification.max_attempts - (verification.attempts + 1)
      
      return NextResponse.json(
        { 
          success: false, 
          error: `Неверный код. ${remainingAttempts > 0 ? `Осталось попыток: ${remainingAttempts}` : 'Не осталось попыток'}`,
          code: 'INVALID_CODE',
          remainingAttempts,
          requestId
        },
        { status: 400 }
      )
    }

    // 7. Код верный - помечаем как верифицированный
    await supabase
      .from('telegram_verifications')
      .update({ 
        status: 'verified',
        verified_at: now.toISOString(),
        metadata: {
          ...verification.metadata,
          verified_at: now.toISOString(),
          verified_by: 'user',
          final_attempts: verification.attempts + 1
        }
      })
      .eq('id', verificationRequestId)

    // 8. Ищем существующего пользователя по номеру телефона
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id, user_id, phone, full_name, email, telegram_id')
      .eq('phone', cleanedPhone)
      .single()

    let userId: string
    let isNewUser = false
    let userData: any = {
      phone: cleanedPhone,
      telegram_user_id: verification.telegram_user_id,
      telegram_username: verification.telegram_username,
      telegram_first_name: verification.telegram_first_name,
      telegram_last_name: verification.telegram_last_name,
      telegram_language_code: verification.telegram_language_code
    }

    if (existingUser) {
      // Существующий пользователь
      userId = existingUser.user_id || existingUser.id
      
      // Обновляем информацию о Telegram
      await supabase
        .from('profiles')
        .update({
          telegram_id: verification.telegram_user_id?.toString(),
          telegram_username: verification.telegram_username,
          telegram_first_name: verification.telegram_first_name,
          telegram_last_name: verification.telegram_last_name,
          telegram_language_code: verification.telegram_language_code,
          updated_at: now.toISOString()
        })
        .eq('id', existingUser.id)

      // Обновляем пользователя в auth если нужно
      if (existingUser.user_id) {
        await supabaseAdmin.auth.admin.updateUserById(
          existingUser.user_id,
          {
            user_metadata: {
              ...existingUser,
              telegram_id: verification.telegram_user_id?.toString(),
              telegram_username: verification.telegram_username,
              telegram_first_name: verification.telegram_first_name,
              telegram_last_name: verification.telegram_last_name,
              telegram_language_code: verification.telegram_language_code,
              last_telegram_auth: now.toISOString()
            }
          }
        )
      }
    } else {
      // Новый пользователь
      const newUserId = uuidv4()
      userId = newUserId
      isNewUser = true
      
      // Создаем запись в profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: newUserId,
          phone: cleanedPhone,
          telegram_id: verification.telegram_user_id?.toString(),
          telegram_username: verification.telegram_username,
          telegram_first_name: verification.telegram_first_name,
          telegram_last_name: verification.telegram_last_name,
          telegram_language_code: verification.telegram_language_code,
          full_name: verification.telegram_first_name 
            ? `${verification.telegram_first_name} ${verification.telegram_last_name || ''}`.trim()
            : 'Пользователь',
          auth_method: 'telegram',
          status: 'active',
          role: 'user',
          created_at: now.toISOString(),
          updated_at: now.toISOString()
        })

      if (profileError) {
        console.error('Ошибка создания профиля:', profileError)
        return NextResponse.json(
          { 
            success: false, 
            error: 'Ошибка создания профиля пользователя',
            code: 'PROFILE_CREATION_ERROR',
            requestId
          },
          { status: 500 }
        )
      }

      userData.id = newUserId
    }

    // 9. Обновляем или создаем запись в telegram_users
    if (verification.telegram_user_id) {
      await supabase
        .from('telegram_users')
        .upsert({
          telegram_id: verification.telegram_user_id,
          username: verification.telegram_username,
          first_name: verification.telegram_first_name,
          last_name: verification.telegram_last_name,
          language_code: verification.telegram_language_code,
          phone: cleanedPhone,
          user_id: userId,
          is_active: true,
          last_seen: now.toISOString(),
          last_auth: now.toISOString(),
          updated_at: now.toISOString()
        }, {
          onConflict: 'telegram_id'
        })
    }

    // 10. Создаем сессию для пользователя
    const sessionResult = await createUserSession(supabaseAdmin, userId, userData)
    
    if (sessionResult.error) {
      return NextResponse.json(
        { 
          success: false, 
          error: sessionResult.error,
          code: 'SESSION_CREATION_ERROR',
          requestId
        },
        { status: 500 }
      )
    }

    // 11. Отправляем уведомление в Telegram об успешной авторизации
    if (verification.telegram_user_id) {
      try {
        const userName = verification.telegram_first_name || 
                        existingUser?.full_name || 
                        'Пользователь'
        
        await telegramBot.sendAuthSuccessNotification(
          verification.telegram_user_id,
          userName
        )
        
        console.log(`✅ Уведомление об успешной авторизации отправлено пользователю ${verification.telegram_user_id}`)
      } catch (notificationError) {
        console.error('Ошибка отправки уведомления:', notificationError)
        // Не прерываем процесс из-за ошибки уведомления
      }
    }

    // 12. Логируем успешную авторизацию
    await supabase
      .from('auth_logs')
      .insert({
        user_id: userId,
        auth_method: 'telegram',
        phone: cleanedPhone,
        telegram_user_id: verification.telegram_user_id,
        verification_id: verificationRequestId,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent'),
        success: true,
        created_at: now.toISOString()
      })

    // 13. Подготавливаем ответ
    const responseData = {
      success: true,
      userId,
      isNewUser,
      user: {
        id: userId,
        phone: cleanedPhone,
        telegramUserId: verification.telegram_user_id,
        telegramUsername: verification.telegram_username,
        telegramFirstName: verification.telegram_first_name,
        telegramLastName: verification.telegram_last_name,
        fullName: verification.telegram_first_name 
          ? `${verification.telegram_first_name} ${verification.telegram_last_name || ''}`.trim()
          : null
      },
      session: {
        accessToken: sessionResult.accessToken,
        refreshToken: sessionResult.refreshToken,
        sessionId: sessionResult.sessionId,
        expiresIn: 3600, // 1 час
        tokenType: 'bearer'
      },
      redirectTo: isNewUser ? '/dashboard/profile/setup' : '/dashboard',
      message: isNewUser ? 'Добро пожаловать! Заполните профиль для начала работы' : 'Успешная авторизация',
      requestId
    }

    // 14. Возвращаем ответ
    const response = NextResponse.json(responseData)
    
    // Устанавливаем куки для авторизации
    if (sessionResult.accessToken) {
      response.cookies.set('sb-access-token', sessionResult.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60, // 1 час
        path: '/'
      })
    }

    if (sessionResult.refreshToken) {
      response.cookies.set('sb-refresh-token', sessionResult.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 дней
        path: '/'
      })
    }

    response.cookies.set('user-id', userId, {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 дней
      path: '/'
    })

    console.log(`✅ Успешная верификация для пользователя ${userId} (${cleanedPhone})`)

    return response

  } catch (error: any) {
    console.error('Критическая ошибка верификации кода Telegram:', error)
    
    // Пытаемся залогировать ошибку
    try {
      const supabase = createServiceRoleClient()
      await supabase
        .from('error_logs')
        .insert({
          request_id: requestId,
          endpoint: '/api/auth/telegram/verify',
          error_message: error.message,
          error_stack: error.stack,
          request_body: JSON.stringify(body),
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
          user_agent: request.headers.get('user-agent'),
          created_at: new Date().toISOString()
        })
    } catch (logError) {
      console.error('Не удалось залогировать ошибку:', logError)
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Внутренняя ошибка сервера',
        code: 'INTERNAL_SERVER_ERROR',
        requestId
      },
      { status: 500 }
    )
  } finally {
    const processingTime = Date.now() - startTime
    console.log(`⏱️ Обработка запроса verify заняла ${processingTime}ms`)
  }
}

/**
 * OPTIONS для CORS
 */
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
      'Access-Control-Max-Age': '86400'
    }
  })
}

/**
 * Получение информации о верификации (для отладки)
 * GET /api/auth/telegram/verify?requestId=:id
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const verificationId = searchParams.get('requestId')

    if (!verificationId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ID верификации обязателен',
          code: 'VERIFICATION_ID_REQUIRED'
        },
        { status: 400 }
      )
    }

    const supabase = createServiceRoleClient()

    const { data: verification } = await supabase
      .from('telegram_verifications')
      .select('*')
      .eq('id', verificationId)
      .single()

    if (!verification) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Верификация не найдена',
          code: 'VERIFICATION_NOT_FOUND'
        },
        { status: 404 }
      )
    }

    // Маскируем чувствительные данные
    const maskedVerification = {
      ...verification,
      code: '******',
      phone: verification.phone ? `${verification.phone.slice(0, 4)}****${verification.phone.slice(-2)}` : null
    }

    return NextResponse.json({
      success: true,
      verification: maskedVerification,
      isActive: verification.status === 'sent' && new Date(verification.expires_at) > new Date(),
      isVerified: verification.status === 'verified',
      isExpired: verification.status === 'expired' || new Date(verification.expires_at) <= new Date(),
      remainingAttempts: verification.max_attempts - verification.attempts
    })

  } catch (error) {
    console.error('Ошибка получения информации о верификации:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Внутренняя ошибка сервера',
        code: 'INTERNAL_SERVER_ERROR'
      },
      { status: 500 }
    )
  }
}