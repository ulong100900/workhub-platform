// hooks/use-telegram-auth.ts
import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { normalizePhoneNumber, maskPhoneNumber } from '@/lib/utils/phone'

interface TelegramAuthState {
  loading: boolean
  error: string | null
  errorCode: string | null
  requestId: string | null
  expiresIn: number | null
  canResend: boolean
  resendAfter: number
  attempts: number
  maxAttempts: number
  phone: string | null
  maskedPhone: string | null
  timer: number
}

interface SendCodeResult {
  success: boolean
  requestId?: string
  expiresIn?: number
  message?: string
  error?: string
  errorCode?: string
  telegramUserId?: number
  sent?: boolean
  canResend?: boolean
  resendAfter?: number
  waitSeconds?: number
}

interface VerifyCodeResult {
  success: boolean
  userId?: string
  isNewUser?: boolean
  user?: any
  session?: {
    accessToken: string
    refreshToken: string
    sessionId: string
    expiresIn: number
  }
  redirectTo?: string
  message?: string
  error?: string
  errorCode?: string
  remainingAttempts?: number
}

export function useTelegramAuth() {
  const [state, setState] = useState<TelegramAuthState>({
    loading: false,
    error: null,
    errorCode: null,
    requestId: null,
    expiresIn: null,
    canResend: false,
    resendAfter: 0,
    attempts: 0,
    maxAttempts: 3,
    phone: null,
    maskedPhone: null,
    timer: 0
  })
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()

  // Очистка таймеров
  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
      countdownRef.current = null
    }
  }, [])

  // Запуск таймера обратного отсчета
  const startCountdown = useCallback((seconds: number) => {
    clearTimers()
    
    setState(prev => ({ 
      ...prev, 
      expiresIn: seconds,
      timer: seconds 
    }))

    countdownRef.current = setInterval(() => {
      setState(prev => {
        const newTimer = prev.timer - 1
        
        if (newTimer <= 0) {
          clearInterval(countdownRef.current!)
          countdownRef.current = null
          
          return {
            ...prev,
            timer: 0,
            expiresIn: 0,
            canResend: true,
            resendAfter: 0
          }
        }

        const canResend = newTimer < 300 // Можно отправить повторно через 5 минут
        
        return {
          ...prev,
          timer: newTimer,
          expiresIn: newTimer,
          canResend,
          resendAfter: canResend ? 0 : Math.max(0, 300 - newTimer)
        }
      })
    }, 1000)
  }, [clearTimers])

  /**
   * Отправляет код верификации в Telegram
   */
  const sendVerificationCode = useCallback(async (phone: string): Promise<SendCodeResult> => {
    setState(prev => ({ 
      ...prev, 
      loading: true, 
      error: null,
      errorCode: null,
      phone,
      maskedPhone: maskPhoneNumber(phone)
    }))

    try {
      const normalizedPhone = normalizePhoneNumber(phone)
      if (!normalizedPhone) {
        throw new Error('Неверный формат номера телефона')
      }

      const response = await fetch('/api/auth/telegram/send-code', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Request-ID': crypto.randomUUID()
        },
        body: JSON.stringify({ phone: normalizedPhone })
      })

      const result: SendCodeResult = await response.json()

      if (!result.success) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Ошибка отправки кода',
          errorCode: result.errorCode || 'SEND_ERROR',
          canResend: result.errorCode !== 'RATE_LIMIT_EXCEEDED'
        }))

        if (result.errorCode === 'RATE_LIMIT_EXCEEDED' && result.waitSeconds) {
          // Запускаем таймер для разблокировки
          const unlockTime = Math.ceil(result.waitSeconds)
          startCountdown(unlockTime)
        }

        return result
      }

      // Сохраняем requestId и запускаем таймер
      const expiresIn = result.expiresIn || 600
      setState(prev => ({
        ...prev,
        loading: false,
        requestId: result.requestId || null,
        expiresIn,
        canResend: result.canResend || false,
        resendAfter: result.resendAfter || 300,
        error: null,
        errorCode: null
      }))

      // Запускаем обратный отсчет
      startCountdown(expiresIn)

      // Автоматически запрашиваем статус каждые 10 секунд
      if (result.requestId) {
        checkVerificationStatus(result.requestId)
      }

      return result
    } catch (error: any) {
      console.error('Ошибка отправки кода:', error)
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Не удалось отправить код. Проверьте соединение',
        errorCode: 'NETWORK_ERROR',
        canResend: true
      }))

      return {
        success: false,
        error: error.message || 'Network error',
        errorCode: 'NETWORK_ERROR'
      }
    }
  }, [startCountdown])

  /**
   * Проверяет код верификации
   */
  const verifyCode = useCallback(async (
    code: string, 
    requestId?: string, 
    phone?: string
  ): Promise<VerifyCodeResult> => {
    const currentRequestId = requestId || state.requestId
    const currentPhone = phone || state.phone

    if (!currentRequestId || !currentPhone || !code) {
      const error = 'Не все данные для верификации предоставлены'
      setState(prev => ({ ...prev, error, errorCode: 'INVALID_INPUT' }))
      return { success: false, error, errorCode: 'INVALID_INPUT' }
    }

    setState(prev => ({ 
      ...prev, 
      loading: true, 
      error: null,
      errorCode: null,
      attempts: prev.attempts + 1
    }))

    try {
      const response = await fetch('/api/auth/telegram/verify', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Request-ID': crypto.randomUUID()
        },
        body: JSON.stringify({ 
          requestId: currentRequestId, 
          code, 
          phone: currentPhone 
        })
      })

      const result: VerifyCodeResult = await response.json()

      if (!result.success) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Ошибка верификации кода',
          errorCode: result.errorCode || 'VERIFICATION_ERROR'
        }))

        return result
      }

      // Останавливаем таймеры
      clearTimers()

      // Сохраняем сессию
      if (result.session?.accessToken) {
        // Сохраняем в localStorage для клиентского использования
        localStorage.setItem('access_token', result.session.accessToken)
        localStorage.setItem('refresh_token', result.session.refreshToken || '')
        localStorage.setItem('user_id', result.userId || '')
        localStorage.setItem('user_data', JSON.stringify(result.user || {}))
        
        // Устанавливаем куки через API если нужно
        document.cookie = `access_token=${result.session.accessToken}; path=/; max-age=${result.session.expiresIn}`
        
        // Сохраняем время истечения токена
        const expiryTime = Date.now() + (result.session.expiresIn * 1000)
        localStorage.setItem('token_expiry', expiryTime.toString())
      }

      setState(prev => ({
        ...prev,
        loading: false,
        error: null,
        errorCode: null
      }))

      // Редирект
      if (result.redirectTo) {
        if (result.isNewUser) {
          // Для новых пользователей показываем приветственное сообщение
          router.push(result.redirectTo)
        } else {
          // Для существующих - сразу на дашборд
          router.push(result.redirectTo)
        }
      }

      return result
    } catch (error: any) {
      console.error('Ошибка верификации кода:', error)
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Не удалось проверить код. Проверьте соединение',
        errorCode: 'NETWORK_ERROR'
      }))

      return {
        success: false,
        error: error.message || 'Network error',
        errorCode: 'NETWORK_ERROR'
      }
    }
  }, [state.requestId, state.phone, clearTimers, router])

  /**
   * Проверяет статус верификации
   */
  const checkVerificationStatus = useCallback(async (requestId: string) => {
    try {
      const response = await fetch(`/api/auth/telegram/send-code?requestId=${requestId}`)
      const result = await response.json()

      if (result.success && result.verification) {
        setState(prev => ({
          ...prev,
          expiresIn: result.verification.remainingSeconds,
          canResend: result.verification.canResend,
          resendAfter: result.verification.resendAfter,
          timer: result.verification.remainingSeconds
        }))

        // Если код верифицирован, автоматически перенаправляем
        if (result.verification.status === 'verified') {
          // Можно запустить автоматический вход
          console.log('Код уже верифицирован, выполняем автоматический вход...')
        }
      }
    } catch (error) {
      console.error('Ошибка проверки статуса:', error)
    }
  }, [])

  /**
   * Повторно отправляет код
   */
  const resendCode = useCallback(async (): Promise<SendCodeResult> => {
    if (!state.requestId || !state.phone) {
      const error = 'Невозможно отправить код: отсутствуют необходимые данные'
      setState(prev => ({ ...prev, error, errorCode: 'RESEND_ERROR' }))
      return { success: false, error, errorCode: 'RESEND_ERROR' }
    }

    if (!state.canResend && state.resendAfter > 0) {
      const error = `Повторная отправка возможна через ${state.resendAfter} секунд`
      setState(prev => ({ ...prev, error, errorCode: 'RESEND_COOLDOWN' }))
      return { success: false, error, errorCode: 'RESEND_COOLDOWN' }
    }

    setState(prev => ({ ...prev, loading: true, error: null, errorCode: null }))

    try {
      // Используем существующий requestId или отправляем новый запрос
      const response = await fetch('/api/auth/telegram/resend', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Request-ID': crypto.randomUUID()
        },
        body: JSON.stringify({ 
          requestId: state.requestId,
          phone: state.phone 
        })
      })

      const result: SendCodeResult = await response.json()

      if (!result.success) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Ошибка повторной отправки',
          errorCode: result.errorCode || 'RESEND_ERROR'
        }))

        return result
      }

      // Обновляем состояние и запускаем новый таймер
      const expiresIn = result.expiresIn || 600
      setState(prev => ({
        ...prev,
        loading: false,
        requestId: result.requestId || prev.requestId,
        expiresIn,
        canResend: false,
        resendAfter: 300,
        attempts: 0,
        error: null,
        errorCode: null
      }))

      startCountdown(expiresIn)

      return result
    } catch (error: any) {
      console.error('Ошибка повторной отправки кода:', error)
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Не удалось отправить код повторно',
        errorCode: 'NETWORK_ERROR',
        canResend: true
      }))

      return {
        success: false,
        error: error.message || 'Network error',
        errorCode: 'NETWORK_ERROR'
      }
    }
  }, [state.requestId, state.phone, state.canResend, state.resendAfter, startCountdown])

  /**
   * Сбрасывает состояние
   */
  const reset = useCallback(() => {
    clearTimers()
    setState({
      loading: false,
      error: null,
      errorCode: null,
      requestId: null,
      expiresIn: null,
      canResend: false,
      resendAfter: 0,
      attempts: 0,
      maxAttempts: 3,
      phone: null,
      maskedPhone: null,
      timer: 0
    })
  }, [clearTimers])

  /**
   * Форматирует время для отображения
   */
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])

  /**
   * Проверяет, заблокирован ли запрос новых кодов
   */
  const isRateLimited = useCallback((): boolean => {
    return state.errorCode === 'RATE_LIMIT_EXCEEDED' && state.timer > 0
  }, [state.errorCode, state.timer])

  return {
    // Состояние
    ...state,
    
    // Форматированные значения
    formattedTime: state.timer > 0 ? formatTime(state.timer) : null,
    formattedResendAfter: state.resendAfter > 0 ? formatTime(state.resendAfter) : null,
    
    // Вспомогательные методы
    isRateLimited: isRateLimited(),
    
    // Основные методы
    sendVerificationCode,
    verifyCode,
    resendCode,
    reset,
    checkVerificationStatus,
    formatTime,
    
    // Очистка при размонтировании
    cleanup: clearTimers
  }
}

/**
 * Хук для проверки авторизации и редиректа
 */
export function useTelegramAuthGuard() {
  const router = useRouter()
  
  const checkAuth = useCallback((): boolean => {
    if (typeof window === 'undefined') return false
    
    const accessToken = localStorage.getItem('access_token')
    const tokenExpiry = localStorage.getItem('token_expiry')
    
    if (!accessToken || !tokenExpiry) {
      return false
    }
    
    // Проверяем не истек ли токен
    const expiryTime = parseInt(tokenExpiry, 10)
    if (Date.now() > expiryTime) {
      // Токен истек, очищаем
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('token_expiry')
      localStorage.removeItem('user_id')
      localStorage.removeItem('user_data')
      return false
    }
    
    return true
  }, [])
  
  const redirectIfNotAuthenticated = useCallback((redirectTo: string = '/auth/telegram') => {
    if (!checkAuth()) {
      router.push(redirectTo)
    }
  }, [checkAuth, router])
  
  const logout = useCallback(() => {
    // Очищаем localStorage
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('token_expiry')
    localStorage.removeItem('user_id')
    localStorage.removeItem('user_data')
    
    // Очищаем куки
    document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    
    // Редирект на страницу входа
    router.push('/auth/telegram')
  }, [router])
  
  const getUserData = useCallback((): any => {
    if (typeof window === 'undefined') return null
    
    try {
      const userData = localStorage.getItem('user_data')
      return userData ? JSON.parse(userData) : null
    } catch {
      return null
    }
  }, [])
  
  return {
    isAuthenticated: checkAuth(),
    checkAuth,
    redirectIfNotAuthenticated,
    logout,
    getUserData
  }
}