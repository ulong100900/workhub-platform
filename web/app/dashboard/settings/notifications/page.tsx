'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Save, Bell, Mail, Smartphone, MessageSquare } from 'lucide-react'

export default function NotificationsSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const [notifications, setNotifications] = useState({
    // Email уведомления
    emailNewMessages: true,
    emailOrderUpdates: true,
    emailPromotions: false,
    emailNewsletter: false,
    
    // Push уведомления
    pushNewMessages: true,
    pushOrderUpdates: true,
    pushSystemAlerts: true,
    
    // SMS уведомления
    smsOrderConfirmation: true,
    smsSecurityAlerts: true,
    smsPromotional: false,
    
    // Общие настройки
    doNotDisturb: false,
    doNotDisturbStart: '22:00',
    doNotDisturbEnd: '08:00',
  })

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        // Здесь можно загрузить настройки из БД
        const { data: settings } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', session.user.id)
          .single()
        
        if (settings?.notifications) {
          setNotifications(prev => ({
            ...prev,
            ...settings.notifications
          }))
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = (key: keyof typeof notifications) => {
    if (key.includes('Start') || key.includes('End')) return
    
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handleTimeChange = (key: 'doNotDisturbStart' | 'doNotDisturbEnd', value: string) => {
    setNotifications(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        throw new Error('Пользователь не авторизован')
      }

      // Сохраняем настройки в БД
      const { error: saveError } = await supabase
        .from('user_settings')
        .upsert({
          user_id: session.user.id,
          notifications,
          updated_at: new Date().toISOString()
        })

      if (saveError) {
        throw saveError
      }

      setSuccess('Настройки уведомлений сохранены!')
      
      setTimeout(() => {
        setSuccess(null)
      }, 3000)
      
    } catch (error: any) {
      console.error('Error saving settings:', error)
      setError(error.message || 'Ошибка сохранения настроек')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Загрузка настроек...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Заголовок и навигация */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Уведомления</h1>
          <p className="text-gray-600 mt-2">
            Настройка уведомлений и почтовых рассылок
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

      {/* Email уведомления */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Email уведомления</CardTitle>
              <CardDescription>
                Настройка почтовых уведомлений
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emailNewMessages">Новые сообщения</Label>
              <p className="text-sm text-gray-500">
                Уведомлять о новых сообщениях от пользователей
              </p>
            </div>
            <Switch
              id="emailNewMessages"
              checked={notifications.emailNewMessages}
              onCheckedChange={() => handleToggle('emailNewMessages')}
              disabled={saving}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emailOrderUpdates">Обновления заказов</Label>
              <p className="text-sm text-gray-500">
                Уведомлять об изменениях статуса заказов
              </p>
            </div>
            <Switch
              id="emailOrderUpdates"
              checked={notifications.emailOrderUpdates}
              onCheckedChange={() => handleToggle('emailOrderUpdates')}
              disabled={saving}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emailPromotions">Акции и предложения</Label>
              <p className="text-sm text-gray-500">
                Получать информацию об акциях и специальных предложениях
              </p>
            </div>
            <Switch
              id="emailPromotions"
              checked={notifications.emailPromotions}
              onCheckedChange={() => handleToggle('emailPromotions')}
              disabled={saving}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emailNewsletter">Новостная рассылка</Label>
              <p className="text-sm text-gray-500">
                Получать еженедельную рассылку новостей
              </p>
            </div>
            <Switch
              id="emailNewsletter"
              checked={notifications.emailNewsletter}
              onCheckedChange={() => handleToggle('emailNewsletter')}
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>

      {/* Push уведомления */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Push уведомления</CardTitle>
              <CardDescription>
                Уведомления в браузере
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="pushNewMessages">Новые сообщения</Label>
              <p className="text-sm text-gray-500">
                Показывать уведомления о новых сообщениях
              </p>
            </div>
            <Switch
              id="pushNewMessages"
              checked={notifications.pushNewMessages}
              onCheckedChange={() => handleToggle('pushNewMessages')}
              disabled={saving}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="pushOrderUpdates">Обновления заказов</Label>
              <p className="text-sm text-gray-500">
                Уведомлять об изменениях статуса заказов
              </p>
            </div>
            <Switch
              id="pushOrderUpdates"
              checked={notifications.pushOrderUpdates}
              onCheckedChange={() => handleToggle('pushOrderUpdates')}
              disabled={saving}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="pushSystemAlerts">Системные оповещения</Label>
              <p className="text-sm text-gray-500">
                Важные системные уведомления и обновления
              </p>
            </div>
            <Switch
              id="pushSystemAlerts"
              checked={notifications.pushSystemAlerts}
              onCheckedChange={() => handleToggle('pushSystemAlerts')}
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>

      {/* SMS уведомления */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>SMS оповещения</CardTitle>
              <CardDescription>
                Настройка SMS уведомлений
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="smsOrderConfirmation">Подтверждение заказов</Label>
              <p className="text-sm text-gray-500">
                Отправлять SMS для подтверждения важных заказов
              </p>
            </div>
            <Switch
              id="smsOrderConfirmation"
              checked={notifications.smsOrderConfirmation}
              onCheckedChange={() => handleToggle('smsOrderConfirmation')}
              disabled={saving}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="smsSecurityAlerts">Оповещения безопасности</Label>
              <p className="text-sm text-gray-500">
                Критически важные уведомления о безопасности
              </p>
            </div>
            <Switch
              id="smsSecurityAlerts"
              checked={notifications.smsSecurityAlerts}
              onCheckedChange={() => handleToggle('smsSecurityAlerts')}
              disabled={saving}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="smsPromotional">Рекламные SMS</Label>
              <p className="text-sm text-gray-500">
                Получать рекламные предложения по SMS
              </p>
            </div>
            <Switch
              id="smsPromotional"
              checked={notifications.smsPromotional}
              onCheckedChange={() => handleToggle('smsPromotional')}
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>

      {/* Режим не беспокоить */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-yellow-50 flex items-center justify-center text-yellow-600">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Режим "Не беспокоить"</CardTitle>
              <CardDescription>
                Настройка времени тишины
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="doNotDisturb">Включить режим</Label>
              <p className="text-sm text-gray-500">
                Отключить все уведомления в указанное время
              </p>
            </div>
            <Switch
              id="doNotDisturb"
              checked={notifications.doNotDisturb}
              onCheckedChange={() => handleToggle('doNotDisturb')}
              disabled={saving}
            />
          </div>
          
          {notifications.doNotDisturb && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="doNotDisturbStart">Начало</Label>
                <input
                  type="time"
                  id="doNotDisturbStart"
                  value={notifications.doNotDisturbStart}
                  onChange={(e) => handleTimeChange('doNotDisturbStart', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doNotDisturbEnd">Окончание</Label>
                <input
                  type="time"
                  id="doNotDisturbEnd"
                  value={notifications.doNotDisturbEnd}
                  onChange={(e) => handleTimeChange('doNotDisturbEnd', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  disabled={saving}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Кнопка сохранения */}
      <div className="flex justify-end gap-3">
        <Link href="/dashboard/settings">
          <Button type="button" variant="outline" disabled={saving}>
            Отмена
          </Button>
        </Link>
        <Button onClick={handleSaveSettings} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          Сохранить настройки
        </Button>
      </div>
    </div>
  )
}