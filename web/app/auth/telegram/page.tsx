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
  ExternalLink,
  Smartphone,
  Shield,
  Zap
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

function TelegramAuthContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'input' | 'success' | 'error'>('input')
  const [error, setError] = useState('')
  
  // Проверяем код из URL
  useEffect(() => {
    const urlCode = searchParams.get('code')
    if (urlCode && /^\d{6}$/.test(urlCode)) {
      setCode(urlCode)
      handleSubmit(urlCode)
    }
  }, [searchParams])
  
  const handleSubmit = async (submitCode?: string) => {
    const authCode = submitCode || code
    
    if (!/^\d{6}$/.test(authCode)) {
      setError('Код должен содержать 6 цифр')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: authCode })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Ошибка авторизации')
      }
      
      if (data.success) {
        setStep('success')
        
        toast({
          title: 'Успешная авторизация!',
          description: `Добро пожаловать${data.userName ? `, ${data.userName}` : ''}!`,
          variant: 'default'
        })
        
        // Редирект через 2 секунды
        setTimeout(() => {
          router.push(data.redirectTo || '/dashboard')
        }, 2000)
      } else {
        throw new Error(data.error || 'Неизвестная ошибка')
      }
      
    } catch (err: any) {
      setStep('error')
      setError(err.message || 'Ошибка авторизации')
      
      toast({
        title: 'Ошибка авторизации',
        description: err.message || 'Проверьте код и попробуйте снова',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }
  
  const openTelegram = () => {
    window.open('https://t.me/workfinder_bot', '_blank')
  }
  
  const handleOpenApp = () => {
    window.location.href = 'tg://resolve?domain=workfinder_bot'
  }
  
  if (step === 'success') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Успешная авторизация!
            </h2>
            <p className="text-gray-600 mb-6">
              Вы успешно вошли через Telegram. Перенаправляем...
            </p>
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          </div>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <Smartphone className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Вход через Telegram</CardTitle>
          <CardDescription>
            Авторизуйтесь в один клик с помощью Telegram
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Шаги */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">Как это работает:</h3>
            <ol className="space-y-2 text-sm text-blue-700">
              <li className="flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">1</span>
                <span>Откройте наш Telegram бот</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">2</span>
                <span>Отправьте команду /login</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">3</span>
                <span>Введите полученный код ниже</span>
              </li>
            </ol>
          </div>
          
          {/* Поле для кода */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Код из Telegram</label>
              <span className="text-xs text-gray-500">6 цифр</span>
            </div>
            
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="123456"
                value={code}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                  setCode(value)
                  if (error) setError('')
                }}
                className="h-12 text-center text-xl font-mono tracking-widest"
                maxLength={6}
                disabled={loading}
              />
              
              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
            </div>
            
            <Button
              onClick={() => handleSubmit()}
              disabled={loading || code.length !== 6}
              className="w-full h-12"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Проверка кода...
                </>
              ) : (
                'Войти'
              )}
            </Button>
          </div>
          
          {/* Кнопки для Telegram */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={openTelegram}
              className="h-12"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Открыть в браузере
            </Button>
            <Button
              variant="outline"
              onClick={handleOpenApp}
              className="h-12"
            >
              <Smartphone className="h-4 w-4 mr-2" />
              Открыть в приложении
            </Button>
          </div>
          
          {/* Преимущества */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-600" />
              Почему безопасно?
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500" />
                Telegram никогда не передает ваш номер телефона
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500" />
                Код подтверждения одноразовый
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500" />
                Данные защищены сквозным шифрованием
              </li>
            </ul>
          </div>
          
          {/* Ссылка на бота */}
          <div className="text-center">
            <a 
              href="https://t.me/workfinder_bot" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
            >
              <Zap className="h-4 w-4" />
              Перейти к боту @workfinder_bot
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Компонент с Suspense для useSearchParams
export default function TelegramAuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <TelegramAuthContent />
    </Suspense>
  )
}