'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Bell, X } from 'lucide-react'
import { requestNotificationPermission } from '@/lib/firebase'
import { useToast } from '@/components/ui/use-toast'

interface NotificationRequestProps {
  userId: string
}

export default function NotificationRequest({ userId }: NotificationRequestProps) {
  const [visible, setVisible] = useState(true)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleEnable = async () => {
    setLoading(true)
    try {
      const token = await requestNotificationPermission(userId)
      
      if (token) {
        toast({
          title: 'Уведомления включены',
          description: 'Теперь вы будете получать уведомления о новых заказах и сообщениях',
        })
        setVisible(false)
      } else {
        toast({
          title: 'Разрешение не получено',
          description: 'Разрешите уведомления в настройках браузера',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось включить уведомления',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <div className="bg-white rounded-lg shadow-lg border p-4 max-w-sm">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold">Включите уведомления</h4>
              <p className="text-sm text-gray-500">
                Получайте уведомления о новых заказах и сообщениях
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setVisible(false)}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleEnable}
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Включение...' : 'Включить'}
          </Button>
          <Button
            variant="outline"
            onClick={() => setVisible(false)}
            className="flex-1"
          >
            Позже
          </Button>
        </div>
      </div>
    </div>
  )
}