// app/api/auth/telegram/send-code/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { telegramBot } from '@/lib/telegram/bot'
import { validatePhoneNumber, normalizePhoneNumber } from '@/lib/utils/phone'

/**
 * Генерирует случайный 6-значный код
 */
function generateVerificationCode(): string {
  // Используем криптографически безопасный генератор
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  const code = (array[0] % 900000 + 100000).toString()
  return code.padStart(6, '0')
}

/**
 * Ищет Telegram ID пользователя по номеру телефона
 */
async function findTelegramUserIdByPhone(
  supabase: ReturnType<typeof createServiceRoleClient>,
  phone: string
): Promise<number | null> {
  try {
    // 1. Сначала ищем в таблице telegram_users
    const { data: telegramUser } = await supabase
      .from('telegram_users')
      .select('telegram_id')
      .eq('phone', phone)
      .eq('is_active', true)
      .single()

    if (telegramUser) {
      return telegramUser.telegram_id
    }

    // 2. Ищем в таблице users (если у нас там хранятся телеграм ID)
    const { data: user } = await supabase
      .from('users')
      .select('telegram_id')
      .eq('phone', phone)
      .single()

    if (user?.telegram_id) {
      return user.telegram_id
    }

    // 3. Проверяем таблицу profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('telegram_id')
      .eq('phone', phone)
      .single()

    if (profile?.telegram_id) {
      return profile.telegram_id
    }

    return null
  } catch (error) {
    console.error('Ошибка поиска Telegram ID по телефону:', error)
    return null
  }
}

/**
 * Проверяет лимит запросов кодов для номера телефона
 */
async function checkRateLimit(
  supabase: ReturnType<typeof createServiceRoleClient>,
  phone: string
): Promise<{ allowed: boolean; message?: string; waitSeconds?: number }> {
  try {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

    // Считаем количество запросов за последний час
    const { count, error } = await supabase
      .from('telegram_verifications')
      .select('*', { count: 'exact', head: true })
      .eq('phone', phone)
      .gte('created_at', oneHourAgo.toISOString())
      .in('status', ['pending', 'sent', 'verified'])

    if (error) {
      console.error('Ошибка проверки лимита:', error)
      return { allowed: true } // В случае ошибки разрешаем запрос
    }

    // Максимум 5 запросов в час
    const MAX_REQUESTS_PER_HOUR = 5
    if (count && count >= MAX_REQUESTS_PER_HOUR) {
      // Находим время последнего запроса
      const { data: lastRequest } = await supabase
        .from('telegram_verifications')
        .select('created_at')
        .eq('phone', phone)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (lastRequest) {
        const lastRequestTime = new Date(lastRequest.created_at).getTime()
        const waitTime = Math.ceil((lastRequestTime + 60 * 60 * 1000 - now.getTime()) / 1000)
        return {
          allowed: false,
          message: `Превышен лимит запросов. Попробуйте через ${Math.ceil(waitTime / 60)} минут`,
          waitSeconds: waitTime
        }
      }
    }

    return { allowed: true }
  } catch (error) {
    console.error('Ошибка в checkRateLimit:', error)
    return { allowed: true }
  }
}

/**
 * API для отправки кода верификации в Telegram
 * POST /api/auth/telegram/send-code
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let requestId: string | undefined

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
          code: 'INVALID_JSON'
        },
        { status: 400 }
      )
    }

    const { phone, userId, sessionId } = body

    // Валидация обязательных полей
    if (!phone) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Номер телефона обязателен',
          code: 'PHONE_REQUIRED'
        },
        { status: 400 }
      )
    }

    // Нормализуем номер телефона
    const normalizedPhone = normalizePhoneNumber(phone)
    if (!normalizedPhone) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Неверный формат номера телефона',
          code: 'INVALID_PHONE_FORMAT'
        },
        { status: 400 }
      )
    }

    // Создаем сервисного клиента Supabase
    const supabase = createServiceRoleClient()

    // Проверяем лимит запросов
    const rateLimit = await checkRateLimit(supabase, normalizedPhone)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: rateLimit.message || 'Превышен лимит запросов',
          code: 'RATE_LIMIT_EXCEEDED',
          waitSeconds: rateLimit.waitSeconds
        },
        { status: 429 }
      )
    }

    // 1. Проверяем, есть ли уже активный код для этого номера
    const { data: existingVerification } = await supabase
      .from('telegram_verifications')
      .select('id, code, attempts, expires_at, status')
      .eq('phone', normalizedPhone)
      .in('status', ['pending', 'sent'])
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (existingVerification) {
      // Проверяем, не превышено ли количество попыток
      if (existingVerification.attempts >= 3) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Превышено количество попыток. Запросите новый код',
            code: 'MAX_ATTEMPTS_EXCEEDED'
          },
          { status: 400 }
        )
      }

      requestId = existingVerification.id
      const expiresIn = Math.floor((new Date(existingVerification.expires_at).getTime() - Date.now()) / 1000)

      return NextResponse.json({
        success: true,
        requestId: existingVerification.id,
        message: 'Код уже отправлен ранее',
        expiresIn,
        canResend: expiresIn < 300, // Можно отправить повторно через 5 минут
        resendAfter: Math.max(0, 300 - expiresIn)
      })
    }

    // 2. Генерируем новый код
    const code = generateVerificationCode()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 минут

    // 3. Сохраняем в базу данных
    const { data: verification, error: insertError } = await supabase
      .from('telegram_verifications')
      .insert({
        phone: normalizedPhone,
        code,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
        attempts: 0,
        max_attempts: 3,
        metadata: {
          userId,
          sessionId,
          userAgent: request.headers.get('user-agent'),
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
          timestamp: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (insertError) {
      console.error('Ошибка сохранения кода верификации:', insertError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Ошибка создания кода верификации',
          code: 'DATABASE_ERROR'
        },
        { status: 500 }
      )
    }

    requestId = verification.id

    // 4. Ищем Telegram ID пользователя
    const telegramUserId = await findTelegramUserIdByPhone(supabase, normalizedPhone)

    // 5. Отправляем код через Telegram Bot
    if (telegramUserId) {
      try {
        const result = await telegramBot.sendVerificationCode(
          normalizedPhone,
          code,
          telegramUserId
        )

        if (result.success) {
          // Обновляем статус на "отправлен" с информацией о сообщении
          await supabase
            .from('telegram_verifications')
            .update({ 
              status: 'sent',
              telegram_user_id: telegramUserId,
              metadata: {
                ...verification.metadata,
                messageId: result.messageId,
                sentAt: new Date().toISOString(),
                sentSuccessfully: true
              }
            })
            .eq('id', verification.id)

          // Логируем успешную отправку
          console.log(`✅ Код отправлен пользователю ${telegramUserId} (${normalizedPhone})`)

          return NextResponse.json({
            success: true,
            requestId: verification.id,
            message: 'Код отправлен в Telegram',
            expiresIn: 600,
            telegramUserId,
            sent: true,
            canResend: false,
            resendAfter: 300
          })
        } else {
          // Ошибка отправки через Telegram
          console.error('Ошибка отправки через Telegram:', result.error)
          
          await supabase
            .from('telegram_verifications')
            .update({ 
              status: 'failed',
              metadata: {
                ...verification.metadata,
                telegramError: result.error,
                sentAt: new Date().toISOString(),
                sentSuccessfully: false
              }
            })
            .eq('id', verification.id)

          return NextResponse.json({
            success: false,
            requestId: verification.id,
            error: result.error || 'Не удалось отправить код в Telegram',
            code: 'TELEGRAM_SEND_ERROR',
            telegramUserId,
            sent: false,
            canRetry: true
          })
        }
      } catch (telegramError) {
        console.error('Исключение при отправке в Telegram:', telegramError)
        
        await supabase
          .from('telegram_verifications')
          .update({ 
            status: 'failed',
            metadata: {
              ...verification.metadata,
              telegramError: telegramError instanceof Error ? telegramError.message : String(telegramError),
              sentAt: new Date().toISOString(),
              sentSuccessfully: false
            }
          })
          .eq('id', verification.id)

        return NextResponse.json({
          success: false,
          requestId: verification.id,
          error: 'Ошибка при отправке кода',
          code: 'TELEGRAM_EXCEPTION',
          sent: false,
          canRetry: true
        })
      }
    } else {
      // Telegram ID не найден
      await supabase
        .from('telegram_verifications')
        .update({ 
          status: 'failed',
          metadata: {
            ...verification.metadata,
            error: 'Telegram ID not found',
            sentAt: new Date().toISOString(),
            sentSuccessfully: false
          }
        })
        .eq('id', verification.id)

      return NextResponse.json({
        success: false,
        requestId: verification.id,
        error: 'Не найден аккаунт Telegram с этим номером телефона',
        code: 'TELEGRAM_ID_NOT_FOUND',
        message: 'Пожалуйста, убедитесь что:\n1. У вас установлен Telegram\n2. Этот номер привязан к Telegram\n3. Вы начали диалог с ботом @register_injob_bot',
        sent: false,
        helpSteps: [
          'Установите Telegram, если еще не установлен',
          'Привяжите этот номер телефона к Telegram',
          'Найдите и начните диалог с ботом @register_injob_bot',
          'Нажмите /start в диалоге с ботом',
          'Повторите попытку входа'
        ],
        canRetry: true
      })
    }

  } catch (error) {
    console.error('Критическая ошибка отправки кода Telegram:', error)
    
    // Пытаемся сохранить информацию об ошибке если requestId известен
    if (requestId) {
      try {
        const supabase = createServiceRoleClient()
        await supabase
          .from('telegram_verifications')
          .update({ 
            status: 'failed',
            metadata: {
              error: error instanceof Error ? error.message : String(error),
              errorStack: error instanceof Error ? error.stack : undefined,
              timestamp: new Date().toISOString()
            }
          })
          .eq('id', requestId)
      } catch (dbError) {
        console.error('Не удалось сохранить информацию об ошибке:', dbError)
      }
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
    console.log(`⏱️ Обработка запроса send-code заняла ${processingTime}ms`)
  }
}

/**
 * Получить статус кода верификации
 * GET /api/auth/telegram/send-code?requestId=:id
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const requestId = searchParams.get('requestId')

    if (!requestId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ID запроса обязателен',
          code: 'REQUEST_ID_REQUIRED'
        },
        { status: 400 }
      )
    }

    // Валидация UUID
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestId)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Неверный формат ID запроса',
          code: 'INVALID_REQUEST_ID'
        },
        { status: 400 }
      )
    }

    const supabase = createServiceRoleClient()

    const { data: verification, error } = await supabase
      .from('telegram_verifications')
      .select('*')
      .eq('id', requestId)
      .single()

    if (error || !verification) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Код верификации не найден',
          code: 'VERIFICATION_NOT_FOUND'
        },
        { status: 404 }
      )
    }

    const now = new Date()
    const expiresAt = new Date(verification.expires_at)
    const isExpired = expiresAt < now
    const isActive = verification.status === 'sent' && !isExpired
    const remainingSeconds = isExpired ? 0 : Math.floor((expiresAt.getTime() - now.getTime()) / 1000)
    const canResend = remainingSeconds < 300 // Можно отправить повторно через 5 минут

    return NextResponse.json({
      success: true,
      verification: {
        id: verification.id,
        phone: verification.phone,
        status: verification.status,
        attempts: verification.attempts,
        maxAttempts: verification.max_attempts,
        expiresAt: verification.expires_at,
        createdAt: verification.created_at,
        updatedAt: verification.updated_at,
        telegramUserId: verification.telegram_user_id,
        isActive,
        isExpired,
        remainingSeconds,
        canResend,
        resendAfter: canResend ? 0 : Math.max(0, 300 - remainingSeconds)
      }
    })

  } catch (error) {
    console.error('Ошибка получения статуса:', error)
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

/**
 * OPTIONS для CORS
 */
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
      'Access-Control-Max-Age': '86400'
    }
  })
}