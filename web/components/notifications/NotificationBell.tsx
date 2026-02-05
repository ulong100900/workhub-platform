'use client'

import { useState } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'

export default function NotificationBell() {
  const [notifications] = useState([
    { id: 1, text: 'Новый проект в вашей категории', time: '5 минут назад' },
    { id: 2, text: 'Ваше предложение принято', time: '2 часа назад' },
    { id: 3, text: 'Оплата получена', time: 'Вчера' },
  ])
  const [unreadCount] = useState(2)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-2">
          <h4 className="font-bold text-sm">Уведомления</h4>
          <div className="space-y-2">
            {notifications.map((notification) => (
              <div 
                key={notification.id} 
                className="p-3 border rounded hover:bg-gray-50 cursor-pointer"
              >
                <div className="text-sm">{notification.text}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {notification.time}
                </div>
              </div>
            ))}
          </div>
          {notifications.length === 0 && (
            <div className="text-center py-4 text-gray-500 text-sm">
              Нет новых уведомлений
            </div>
          )}
          <Button variant="outline" size="sm" className="w-full mt-2">
            Показать все
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}