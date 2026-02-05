// app/register/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Phone, Smartphone, User } from 'lucide-react'

export default function RegisterPage() {
  const [registrationMethod, setRegistrationMethod] = useState<'phone' | 'telegram'>('phone')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreeToTerms, setAgreeToTerms] = useState(false)
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

  // Регистрация по телефону
  const registerWithPhone = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Валидация
    if (!name.trim() || name.length < 2) {
      setError('Введите имя (минимум 2 символа)')
      return
    }

    if (phone.length < 16) {
      setError('Введите корректный номер телефона')
      return
    }

    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов')
      return
    }

    if (password !== confirmPassword) {
      setError('Пароли не совпадают')
      return
    }

    if (!agreeToTerms) {
      setError('Необходимо согласие с условиями использования')
      return
    }

    setLoading(true)

    try {
      const cleanedPhone = phone.replace(/\D/g, '')
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'phone',
          name: name.trim(),
          phone: cleanedPhone,
          password: password
        })
      })

      const result = await response.json()
      
      if (result.success) {
        // Если требуется подтверждение телефона через SMS
        if (result.requiresVerification) {
          router.push(`/verify-phone?phone=${cleanedPhone}`)
        } else {
          router.push('/dashboard')
        }
      } else {
        setError(result.error || 'Ошибка регистрации')
      }
    } catch (error: any) {
      console.error('Registration error:', error)
      setError('Ошибка регистрации. Проверьте соединение.')
    } finally {
      setLoading(false)
    }
  }

  // Регистрация через Telegram
  const registerWithTelegram = async () => {
    setError(null)

    if (!name.trim() || name.length < 2) {
      setError('Введите имя (минимум 2 символа)')
      return
    }

    if (phone.length < 16) {
      setError('Введите корректный номер телефона для Telegram')
      return
    }

    if (!agreeToTerms) {
      setError('Необходимо согласие с условиями использования')
      return
    }

    setLoading(true)

    try {
      const cleanedPhone = phone.replace(/\D/g, '')
      
      const response = await fetch('/api/auth/telegram/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: cleanedPhone
        })
      })

      const result = await response.json()
      
      if (result.success) {
        // Переходим на страницу подтверждения кода
        router.push(`/auth/telegram/verify?requestId=${result.requestId}&phone=${encodeURIComponent(phone)}`)
      } else {
        setError(result.error || 'Ошибка регистрации через Telegram')
      }
    } catch (error: any) {
      console.error('Telegram registration error:', error)
      setError('Ошибка регистрации. Проверьте номер телефона.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-8">
      <div className="mx-auto w-full max-w-md">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Регистрация в WorkFinder
            </CardTitle>
            <CardDescription className="text-center">
              Создайте аккаунт для начала работы
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              {/* Общие поля для всех методов */}
              <div className="space-y-2">
                <Label htmlFor="name">Ваше имя *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    placeholder="Иван Иванов"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                    maxLength={50}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              {/* Выбор метода регистрации */}
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={registrationMethod === 'phone' ? 'default' : 'outline'}
                    onClick={() => {
                      setRegistrationMethod('phone')
                      setError(null)
                    }}
                    className="flex-1"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Телефон
                  </Button>
                  <Button
                    type="button"
                    variant={registrationMethod === 'telegram' ? 'default' : 'outline'}
                    onClick={() => {
                      setRegistrationMethod('telegram')
                      setError(null)
                    }}
                    className="flex-1"
                  >
                    <Smartphone className="h-4 w-4 mr-2" />
                    Telegram
                  </Button>
                </div>

                {/* Поле для телефона (общее для обоих методов) */}
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    {registrationMethod === 'phone' ? 'Номер телефона *' : 'Номер Telegram *'}
                  </Label>
                  <div className="relative">
                    {registrationMethod === 'phone' ? (
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    ) : (
                      <Smartphone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    )}
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
                  {registrationMethod === 'telegram' && (
                    <p className="text-xs text-gray-500">
                      На этот номер придет код подтверждения в Telegram
                    </p>
                  )}
                </div>

                {/* Поля для пароля (только для регистрации по телефону) */}
                {registrationMethod === 'phone' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="password">Пароль *</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Минимум 6 символов"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Подтверждение пароля *</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Повторите пароль"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                  </>
                )}

                {/* Информация о Telegram регистрации */}
                {registrationMethod === 'telegram' && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Smartphone className="h-4 w-4 text-blue-600" />
                      <p className="text-sm font-medium text-blue-800">Регистрация через Telegram</p>
                    </div>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li>• На ваш Telegram придет код подтверждения</li>
                      <li>• Ваш Telegram аккаунт будет привязан к профилю</li>
                      <li>• В дальнейшем сможете входить через Telegram</li>
                      <li>• Номер телефона используется только для связи</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Согласие с условиями */}
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={agreeToTerms}
                  onCheckedChange={(checked) => setAgreeToTerms(checked === true)}
                  disabled={loading}
                />
                <label
                  htmlFor="terms"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Я согласен с{' '}
                  <Link href="/terms" className="text-blue-600 hover:underline">
                    условиями использования
                  </Link>{' '}
                  и{' '}
                  <Link href="/privacy" className="text-blue-600 hover:underline">
                    политикой конфиденциальности
                  </Link>
                </label>
              </div>

              {/* Кнопка регистрации */}
              <Button
                type="button"
                className="w-full"
                onClick={registrationMethod === 'phone' ? registerWithPhone : registerWithTelegram}
                disabled={loading || !name.trim() || !agreeToTerms || phone.length < 16}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {registrationMethod === 'phone' ? 'Регистрация...' : 'Отправка кода...'}
                  </>
                ) : (
                  `Зарегистрироваться через ${registrationMethod === 'phone' ? 'телефон' : 'Telegram'}`
                )}
              </Button>
            </div>

            <div className="mt-6 pt-6 border-t text-center text-sm">
              <p className="text-gray-600">
                Уже есть аккаунт?{' '}
                <Link
                  href="/login"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Войти
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}