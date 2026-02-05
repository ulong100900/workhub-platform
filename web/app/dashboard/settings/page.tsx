// app/dashboard/settings/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  User, 
  Bell, 
  Shield,
  Palette,
  Download,
  LogOut,
  Loader2
} from 'lucide-react'

// Создаем простой диалог подтверждения прямо в файле
function ConfirmDialog({ 
  open, 
  onOpenChange, 
  title, 
  description, 
  confirmText, 
  cancelText, 
  onConfirm, 
  loading, 
  variant = 'default' 
}: { 
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmText: string
  cancelText: string
  onConfirm: () => void
  loading: boolean
  variant?: 'default' | 'destructive'
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{description}</p>
        <div className="flex justify-end gap-3">
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            variant={variant === 'destructive' ? 'destructive' : 'default'}
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [logoutLoading, setLogoutLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
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
      }
    } catch (error) {
      console.error('Error loading user:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    setLogoutLoading(true)
    setError(null)
    
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        throw error
      }
        
      // Редирект на главную страницу
      router.push('/register')
      router.refresh()
        
    } catch (error: any) {
      console.error('Logout error:', error)
      setError(error.message || 'Ошибка при выходе')
      setShowLogoutConfirm(false) // закрываем диалог при ошибке
    } finally {
      setLogoutLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    )
  }

  const settingsCategories = [
    {
      title: 'Личные данные',
      description: 'Управление профилем и контактной информацией',
      icon: <User className="h-5 w-5" />,
      items: [
        { name: 'Профиль', href: '/dashboard/settings/profile', description: 'Основная информация, фото, контакты' },
        { name: 'Навыки и специализация', href: '/dashboard/settings/skills', description: 'Ваши профессиональные навыки' },
        { name: 'Документы', href: '/dashboard/settings/documents', description: 'Паспорт, ИНН, другие документы' },
      ]
    },
    {
      title: 'Безопасность',
      description: 'Настройки безопасности аккаунта',
      icon: <Shield className="h-5 w-5" />,
      items: [
        { name: 'Пароль и вход', href: '/dashboard/settings/security', description: 'Смена пароля, двухфакторная аутентификация' },
        { name: 'Подключенные устройства', href: '/dashboard/settings/devices', description: 'Управление активными сессиями' },
        { name: 'Конфиденциальность', href: '/dashboard/settings/privacy', description: 'Настройки приватности' },
      ]
    },
    {
      title: 'Уведомления',
      description: 'Настройка уведомлений и почтовых рассылок',
      icon: <Bell className="h-5 w-5" />,
      items: [
        { name: 'Email уведомления', href: '/dashboard/settings/notifications', description: 'Настройка почтовых уведомлений' },
        { name: 'Push уведомления', href: '/dashboard/settings/push', description: 'Уведомления в браузере' },
        { name: 'SMS оповещения', href: '/dashboard/settings/sms', description: 'Настройка SMS уведомлений' },
      ]
    },
    {
      title: 'Внешний вид',
      description: 'Настройка интерфейса',
      icon: <Palette className="h-5 w-5" />,
      items: [
        { name: 'Тема оформления', href: '/dashboard/settings/theme', description: 'Светлая, темная или системная тема' },
        { name: 'Язык интерфейса', href: '/dashboard/settings/language', description: 'Выбор языка системы' },
      ]
    }

  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Настройки</h1>
        <p className="text-gray-600 mt-2">
          Управление настройками аккаунта и предпочтениями
        </p>
      </div>

      {/* Информация о пользователе */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl">
                {user?.profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {user?.profile?.full_name || 'Пользователь'}
                </h3>
                <p className="text-gray-600">{user?.email}</p>
                <div className="flex gap-2 mt-2">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {user?.profile?.role || 'Пользователь'}
                  </span>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    {user?.profile?.verification_status === 'verified' ? 'Верифицирован' : 'Не верифицирован'}
                  </span>
                </div>
              </div>
            </div>
            <Link href="/dashboard/settings/profile">
              <Button>
                <User className="h-4 w-4 mr-2" />
                Редактировать профиль
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Категории настроек */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {settingsCategories.map((category) => (
          <Card key={category.title}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  {category.icon}
                </div>
                <div>
                  <CardTitle className="text-lg">{category.title}</CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {category.items.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors"
                  >
                    <div>
                      <div className="font-medium text-gray-900">{item.name}</div>
                      <div className="text-sm text-gray-500">{item.description}</div>
                    </div>
                    <div className="text-gray-400">→</div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Панель выхода и опасные действия */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Безопасность и выход
          </CardTitle>
          <CardDescription className="text-red-600">
            Выход из аккаунта и опасные действия
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Кнопка выхода в карточке */}
            <Button
              onClick={() => setShowLogoutConfirm(true)}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-100 hover:text-red-800"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Выйти из аккаунта
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Диалог подтверждения выхода */}
      <ConfirmDialog
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
        title="Подтверждение выхода"
        description="Вы уверены, что хотите выйти из системы? Для повторного входа потребуется аутентификация."
        confirmText="Выйти"
        cancelText="Отмена"
        onConfirm={handleLogout}
        loading={logoutLoading}
        variant="destructive"
      />
    </div>
  )
}