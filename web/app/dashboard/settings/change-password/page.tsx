'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Lock, Eye, EyeOff } from 'lucide-react'

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return 'Пароль должен содержать минимум 8 символов'
    }
    if (!/[A-Z]/.test(password)) {
      return 'Пароль должен содержать хотя бы одну заглавную букву'
    }
    if (!/[0-9]/.test(password)) {
      return 'Пароль должен содержать хотя бы одну цифру'
    }
    return null
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Валидация
      if (!currentPassword || !newPassword || !confirmPassword) {
        throw new Error('Заполните все поля')
      }

      if (newPassword !== confirmPassword) {
        throw new Error('Новые пароли не совпадают')
      }

      const passwordError = validatePassword(newPassword)
      if (passwordError) {
        throw new Error(passwordError)
      }

      // Обновляем пароль через Supabase
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) {
        throw updateError
      }

      setSuccess('Пароль успешно изменен!')
      
      // Очищаем форму
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      
      setTimeout(() => {
        router.push('/dashboard/settings/profile')
      }, 2000)
      
    } catch (error: any) {
      console.error('Error changing password:', error)
      setError(error.message || 'Ошибка смены пароля')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Заголовок и навигация */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Смена пароля</h1>
          <p className="text-gray-600 mt-2">
            Обновление пароля для входа в аккаунт
          </p>
        </div>
        <Link href="/dashboard/settings/profile">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к профилю
          </Button>
        </Link>
      </div>

      {/* Уведомления */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="bg-green-50 border-green-200 text-green-800">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Форма смены пароля */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Изменение пароля
          </CardTitle>
          <CardDescription>
            Для смены пароля введите текущий пароль и новый пароль
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Текущий пароль</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Введите текущий пароль"
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Новый пароль</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Введите новый пароль"
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-sm text-gray-500">
                Минимум 8 символов, одна заглавная буква и одна цифра
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Подтверждение пароля</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Повторите новый пароль"
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Link href="/dashboard/settings/profile">
                <Button type="button" variant="outline" disabled={loading}>
                  Отмена
                </Button>
              </Link>
              <Button type="submit" disabled={loading}>
                {loading ? 'Смена пароля...' : 'Сменить пароль'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Рекомендации по безопасности */}
      <Card>
        <CardHeader>
          <CardTitle>Рекомендации по безопасности</CardTitle>
          <CardDescription>
            Советы по созданию надежного пароля
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <ul className="space-y-1 text-sm text-gray-600 list-disc pl-5">
            <li>Используйте не менее 8 символов</li>
            <li>Сочетайте заглавные и строчные буквы</li>
            <li>Добавляйте цифры и специальные символы</li>
            <li>Не используйте личную информацию</li>
            <li>Не используйте один пароль на разных сайтах</li>
            <li>Регулярно меняйте пароли</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}