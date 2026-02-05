// app/dashboard/settings/profile/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Shield } from 'lucide-react'
import { Switch } from '@/components/ui/switch' // Switch из вашей UI библиотеки
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, User, ArrowLeft, Save } from 'lucide-react'

export default function ProfileSettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    bio: ''
  })

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        setUser({
          ...session.user,
          profile: profile || {}
        })
        
        // Заполняем форму данными пользователя
        setFormData({
          full_name: profile?.full_name || '',
          email: session.user.email || '',
          phone: profile?.phone || '',
          bio: profile?.bio || ''
        })
      }
    } catch (error) {
      console.error('Error loading user:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        throw new Error('Пользователь не авторизован')
      }

      // Обновляем профиль в базе данных
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          bio: formData.bio,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id)

      if (updateError) {
        throw updateError
      }

      setSuccess('Профиль успешно обновлен!')
      
      // Обновляем данные пользователя
      setTimeout(() => {
        router.refresh()
      }, 1000)
      
    } catch (error: any) {
      console.error('Error saving profile:', error)
      setError(error.message || 'Ошибка сохранения профиля')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Загрузка профиля...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Заголовок и навигация */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Профиль</h1>
          <p className="text-gray-600 mt-2">
            Редактирование личной информации
          </p>
        </div>
        <Link href="/dashboard/settings">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к настройкам
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

      {/* Форма редактирования профиля */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Личная информация
          </CardTitle>
          <CardDescription>
            Основная информация о вашем профиле
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="full_name">Полное имя</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  placeholder="Иван Иванов"
                  disabled={saving}
                />
                <p className="text-sm text-gray-500">
                  Ваше имя, которое видят другие пользователи
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-sm text-gray-500">
                  Email нельзя изменить. Для смены email обратитесь в поддержку
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Телефон</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+7 (999) 123-45-67"
                  disabled={saving}
                />
                <p className="text-sm text-gray-500">
                  Номер телефона для связи
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Роль</Label>
                <Input
                  id="role"
                  value={user?.profile?.role || 'Пользователь'}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-sm text-gray-500">
                  Ваша роль в системе
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Link href="/dashboard/settings">
                <Button type="button" variant="outline" disabled={saving}>
                  Отмена
                </Button>
              </Link>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Сохранить изменения
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>


{/* Безопасность */}
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Shield className="h-5 w-5" />
      Безопасность аккаунта
    </CardTitle>
    <CardDescription>
      Настройки безопасности и аутентификации
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="flex items-center justify-between">
      <div>
        <div className="font-medium">Смена пароля</div>
        <p className="text-sm text-gray-500">
          Измените пароль для входа в аккаунт
        </p>
      </div>
      <Link href="/dashboard/settings/change-password">
        <Button variant="outline" size="sm">
          Изменить
        </Button>
      </Link>
    </div>
    
    <div className="flex items-center justify-between">
      <div>
        <div className="font-medium">Двухфакторная аутентификация</div>
        <p className="text-sm text-gray-500">
          Добавьте дополнительный уровень безопасности
        </p>
      </div>
      <Switch disabled />
    </div>
    
    <div className="flex items-center justify-between">
      <div>
        <div className="font-medium">Активные сессии</div>
        <p className="text-sm text-gray-500">
          Управление устройствами, с которых выполнен вход
        </p>
      </div>
      <Link href="/dashboard/settings/sessions">
        <Button variant="outline" size="sm">
          Управление
        </Button>
      </Link>
    </div>
  </CardContent>
</Card>

      {/* Статистика профиля */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">0</div>
              <p className="text-sm text-gray-600 mt-1">Выполненных заказов</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">0</div>
              <p className="text-sm text-gray-600 mt-1">Отзывов</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">100%</div>
              <p className="text-sm text-gray-600 mt-1">Рейтинг</p>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}