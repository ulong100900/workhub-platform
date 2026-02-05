'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Bell, CheckCircle, XCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default function PushNotificationRequest() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
      
      // Проверяем подписку в OneSignal
      if (window.OneSignal) {
        window.OneSignal.getUserId().then((userId: string) => {
          setIsSubscribed(!!userId)
        })
      }
    }
  }, [])

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('Ваш браузер не поддерживает уведомления')
      return
    }

    setIsLoading(true)
    
    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      
      if (result === 'granted') {
        // Инициализируем OneSignal
        if (window.OneSignal) {
          await window.OneSignal.registerForPushNotifications()
          await window.OneSignal.setSubscription(true)
          setIsSubscribed(true)
          alert('Уведомления включены!')
        }
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (permission === 'granted' || isSubscribed) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800">
                Уведомления включены
              </p>
              <p className="text-sm text-green-600">
                Вы будете получать уведомления о новых откликах и сообщениях
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (permission === 'denied') {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <XCircle className="h-5 w-5 text-red-600" />
            <div>
              <p className="font-medium text-red-800">
                Уведомления отключены
              </p>
              <p className="text-sm text-red-600">
                Разрешите уведомления в настройках браузера
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-blue-600" />
            <div>
              <p className="font-medium text-blue-800">
                Включите уведомления
              </p>
              <p className="text-sm text-blue-600">
                Получайте уведомления о новых откликах и сообщениях
              </p>
            </div>
          </div>
          <Button
            onClick={requestPermission}
            disabled={isLoading}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? 'Загрузка...' : 'Включить'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}