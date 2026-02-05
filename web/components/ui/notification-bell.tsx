'use client'

import { useState } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

export default function NotificationBell() {
  const [notifications] = useState([
    {
      id: 1,
      title: 'Новый отклик на ваш заказ',
      description: 'Иван Петров откликнулся на "Создание лендинга"',
      time: '5 минут назад',
      read: false,
      type: 'bid'
    },
    {
      id: 2,
      title: 'Оплата получена',
      description: 'Оплата за проект "Дизайн сайта" зачислена на баланс',
      time: '2 часа назад',
      read: true,
      type: 'payment'
    },
    {
      id: 3,
      title: 'Срок сдачи проекта',
      description: 'До сдачи проекта "Мобильное приложение" осталось 2 дня',
      time: '1 день назад',
      read: true,
      type: 'deadline'
    },
    {
      id: 4,
      title: 'Новое сообщение',
      description: 'У вас новое сообщение от Анны Смирновой',
      time: '2 дня назад',
      read: true,
      type: 'message'
    }
  ])

  const unreadCount = notifications.filter(n => !n.read).length

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'bid': return 'bg-blue-100 text-blue-800'
      case 'payment': return 'bg-green-100 text-green-800'
      case 'deadline': return 'bg-yellow-100 text-yellow-800'
      case 'message': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'bid': return 'Отклик'
      case 'payment': return 'Оплата'
      case 'deadline': return 'Дедлайн'
      case 'message': return 'Сообщение'
      default: return 'Уведомление'
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Уведомления</span>
          {unreadCount > 0 && (
            <Badge variant="destructive">{unreadCount} новых</Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-72">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="flex flex-col items-start p-3 cursor-pointer hover:bg-gray-50"
              >
                <div className="flex items-start justify-between w-full">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{notification.title}</span>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getTypeColor(notification.type)}`}
                      >
                        {getTypeLabel(notification.type)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      {notification.description}
                    </p>
                    <span className="text-xs text-gray-500">
                      {notification.time}
                    </span>
                  </div>
                  {!notification.read && (
                    <div className="ml-2 h-2 w-2 rounded-full bg-blue-500" />
                  )}
                </div>
              </DropdownMenuItem>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">
              Нет новых уведомлений
            </div>
          )}
        </ScrollArea>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="justify-center text-blue-600 cursor-pointer">
          Показать все уведомления
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}