// app/auth/telegram/verify/page.tsx
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Smartphone,
  Shield,
  RefreshCw,
  ArrowLeft
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

function TelegramVerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [step, setStep] = useState<'input' | 'success' | 'error'>('input')
  const [error, setError] = useState('')
  const [timer, setTimer] = useState(60) // 60 секунд для повторной отправки
  const [canResend, setCanResend] = useState(false)
  
  const requestId = searchParams.get('requestId')
  const phone = searchParams.get('phone')

  // Таймер для повторной отправки
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1)
      }, 1000)
      return () => clearInterval(interval)
    } else {
      setCanResend(true)
    }
  }, [timer])

  // Проверка необходимых параметров
  useEffect(() => {
    if (!requestId || !phone) {
      toast({
        title: 'Ошибка',
        description: 'Неверная ссылка для проверки кода',
        variant: 'destructive'
      })
      router.push('/login')
    }
  }, [requestId, phone, router, toast])

  // Отправка кода на проверку
  const verifyCode = async () => {
    if (!/^\d{6}$/.test(code)) {
      setError('Код должен содержать 6 цифр')
      return
    }

    setVerifying(true)
    setError('')
    
    try {
      const response = await fetch('/api/auth/telegram/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          requestId,
          code 
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setStep('success')
        
        toast({
          title: 'Авторизация успешна!',
          description: `Добро пожаловать${data.userName ? `, ${data.userName}` : ''}!`,
          variant: 'default'
        })
        
        // Редирект через 2 секунды
        setTimeout(() => {
          router.push(data.redirectTo || '/dashboard')
        }, 2000)
      } else {
        setStep('error')
        setError(data.error || 'Неверный код')
      }
    } catch (err: any) {
      setStep('error')
      setError(err.message || 'Ошибка проверки кода')
    } finally {
      setVerifying(false)
    }
  }

  // Повторная отправка кода
  const resendCode = async () => {
    if (!canResend) return

    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/auth/telegram/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: 'Код отправлен повторно',
          description: 'Проверьте ваш Telegram',
          variant: 'default'
        })
        
        setTimer(60)
        setCanResend(false)
      } else {
        setError(data.error || 'Не удалось отправить код повторно')
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка отправки кода')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Авторизация успешна!
              </h2>
              <p className="text-gray-600 mb-6">
                Перенаправляем на главную страницу...
              </p>
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Ошибка
              </h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <div className="space-y-2">
                <Button onClick={() => {
                  setStep('input')
                  setError('')
                  setCode('')
                }}>
                  Попробовать снова
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/login')}
                  className="w-full"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Вернуться к авторизации
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <Smartphone className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Подтверждение Telegram</CardTitle>
          <CardDescription>
            Введите код, отправленный в ваш Telegram
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Информация о номере */}
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <p className="text-sm text-blue-800">
              Код отправлен на номер:
            </p>
            <p className="text-lg font-semibold text-blue-900 mt-1">
              {phone}
            </p>
            <p className="text-xs text-blue-600 mt-2">
              Проверьте уведомления в приложении Telegram
            </p>
          </div>

          {/* Поле для ввода кода */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Код из Telegram</label>
              <span className="text-xs text-gray-500">6 цифр</span>
            </div>
            
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Введите 6-значный код"
                value={code}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                  setCode(value)
                  if (error) setError('')
                }}
                className="h-12 text-center text-xl font-mono tracking-widest"
                maxLength={6}
                disabled={verifying}
                autoFocus
              />
              
              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
            </div>
            
            <Button
              onClick={verifyCode}
              disabled={verifying || code.length !== 6}
              className="w-full h-12"
            >
              {verifying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Проверка...
                </>
              ) : (
                'Подтвердить и войти'
              )}
            </Button>
          </div>

          {/* Повторная отправка */}
          <div className="text-center">
            <Button
              variant="outline"
              onClick={resendCode}
              disabled={loading || !canResend}
              className="w-full h-12"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {canResend ? 'Отправить код повторно' : `Отправить повторно через ${timer} сек.`}
            </Button>
            
            <p className="text-xs text-gray-500 mt-2">
              Не получили код? Проверьте номер и попробуйте отправить повторно
            </p>
          </div>

          {/* Инструкции */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Не получается войти?</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-blue-500">1.</span>
                <span>Убедитесь, что номер {phone} привязан к Telegram</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">2.</span>
                <span>Проверьте уведомления в Telegram</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">3.</span>
                <span>Подождите несколько минут - код может идти с задержкой</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">4.</span>
                <span>Если проблема сохраняется, попробуйте другой способ входа</span>
              </li>
            </ul>
          </div>

          {/* Альтернативные действия */}
          <div className="space-y-3">
            <Button
              variant="ghost"
              onClick={() => router.push('/login')}
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Вернуться к другим способам входа
            </Button>
          </div>

          {/* Безопасность */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-600" />
              Безопасность
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500" />
                Код действителен только 10 минут
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500" />
                Одноразовый код для однократного использования
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500" />
                Telegram никогда не передает ваш номер третьим лицам
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function TelegramVerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <TelegramVerifyContent />
    </Suspense>
  )
}