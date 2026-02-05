// app/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, Phone, Smartphone } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function LoginPage() {
  const [loginMethod, setLoginMethod] = useState<'phone' | 'email' | 'telegram'>('phone')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()

  // Форматирование телефона
  const formatPhone = (input: string) => {
    const cleaned = input.replace(/\D/g, '')
    
    if (cleaned.length === 0) return ''
    if (cleaned.length <= 1) return `+7`
    if (cleaned.length <= 4) return `+7 (${cleaned.substring(1, 4)}`
    if (cleaned.length <= 7) return `+7 (${cleaned.substring(1, 4)}) ${cleaned.substring(4, 7)}`
    if (cleaned.length <= 9) return `+7 (${cleaned.substring(1, 4)}) ${cleaned.substring(4, 7)}-${cleaned.substring(7, 9)}`
    return `+7 (${cleaned.substring(1, 4)}) ${cleaned.substring(4, 7)}-${cleaned.substring(7, 9)}-${cleaned.substring(9, 11)}`
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    setPhone(formatted)
  }

  // Вход по телефону и паролю
  const loginWithPhone = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const cleanedPhone = phone.replace(/\D/g, '')
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'phone',
          phone: cleanedPhone,
          password: password
        })
      })

      const result = await response.json()
      
      if (result.success) {
        router.push('/dashboard')
        router.refresh()
      } else {
        setError(result.error || 'Неверный телефон или пароль')
      }
    } catch (error: any) {
      console.error('Login error:', error)
      setError('Ошибка входа. Проверьте соединение.')
    } finally {
      setLoading(false)
    }
  }

  // Вход по email и паролю
  const loginWithEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'email',
          email: email.trim(),
          password: password
        })
      })

      const result = await response.json()
      
      if (result.success) {
        router.push('/dashboard')
        router.refresh()
      } else {
        setError(result.error || 'Неверный email или пароль')
      }
    } catch (error: any) {
      console.error('Login error:', error)
      setError('Ошибка входа. Проверьте соединение.')
    } finally {
      setLoading(false)
    }
  }

  // Инициализация авторизации через Telegram
  const startTelegramAuth = () => {
    setLoginMethod('telegram')
    setError(null)
    // Не отправляем сразу, ждем пока пользователь введет номер
  }

  // Отправка номера Telegram для получения кода
  const sendTelegramCode = async () => {
    if (phone.length < 16) {
      setError('Введите корректный номер телефона')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const cleanedPhone = phone.replace(/\D/g, '')
      
      const response = await fetch('/api/auth/telegram/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanedPhone
        })
      })

      const result = await response.json()
      
      if (result.success) {
        // Переходим на страницу ввода кода
        router.push(`/auth/telegram/verify?requestId=${result.requestId}&phone=${encodeURIComponent(phone)}`)
      } else {
        setError(result.error || 'Не удалось отправить код в Telegram')
      }
    } catch (error: any) {
      console.error('Telegram auth error:', error)
      setError('Ошибка отправки кода. Проверьте номер телефона.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <div className="mx-auto w-full max-w-md">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Вход в WorkFinder
            </CardTitle>
            <CardDescription className="text-center">
              Выберите способ входа
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Tabs 
              defaultValue="phone" 
              value={loginMethod}
              className="w-full" 
              onValueChange={(v) => {
                setLoginMethod(v as 'phone' | 'email' | 'telegram')
                setError(null)
              }}
            >
              <TabsList className="grid grid-cols-3 mb-6">
                <TabsTrigger value="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Телефон
                </TabsTrigger>
                <TabsTrigger value="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="telegram" className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Telegram
                </TabsTrigger>
              </TabsList>

              {/* Вход по телефону */}
              <TabsContent value="phone">
                <form onSubmit={loginWithPhone} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Номер телефона</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="phone"
                        value={phone}
                        onChange={handlePhoneChange}
                        placeholder="+7 (999) 123-45-67"
                        className="pl-10"
                        maxLength={18}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Пароль</Label>
                      <Link
                        href="/forgot-password"
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Забыли пароль?
                      </Link>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Введите пароль"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Вход...
                      </>
                    ) : (
                      'Войти'
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Вход по email */}
              <TabsContent value="email">
                <form onSubmit={loginWithEmail} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Пароль</Label>
                      <Link
                        href="/forgot-password"
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Забыли пароль?
                      </Link>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Введите пароль"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Вход...
                      </>
                    ) : (
                      'Войти'
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Вход через Telegram */}
              <TabsContent value="telegram" className="space-y-4">
                <div className="text-center mb-4">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-3">
                    <Smartphone className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    Вход через Telegram
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Введите номер телефона, привязанный к вашему Telegram аккаунту
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tg-phone">Номер Telegram</Label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="tg-phone"
                      value={phone}
                      onChange={handlePhoneChange}
                      placeholder="+7 (999) 123-45-67"
                      className="pl-10"
                      maxLength={18}
                      required
                      disabled={loading}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Код будет отправлен в ваше приложение Telegram
                  </p>
                </div>

                <Button 
                  onClick={sendTelegramCode} 
                  className="w-full"
                  disabled={loading || phone.length < 16}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Отправка кода...
                    </>
                  ) : (
                    'Получить код в Telegram'
                  )}
                </Button>

                <div className="text-left text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium mb-1">Как это работает:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Введите номер телефона от Telegram</li>
                    <li>Получите код в приложении Telegram</li>
                    <li>Введите код на следующей странице</li>
                    <li>Автоматически войдете в систему</li>
                  </ol>
                </div>

                <div className="text-center">
                  <Button 
                    variant="link" 
                    onClick={() => setLoginMethod('phone')}
                    className="text-sm"
                  >
                    ← Вернуться к другим способам входа
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center text-sm">
              <p className="text-gray-600">
                Нет аккаунта?{' '}
                <Link
                  href="/register"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Зарегистрироваться
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}