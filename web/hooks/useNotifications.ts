'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'

export interface Notification {
  id: string
  type: string
  title: string
  message: string
  data?: any
  is_read: boolean
  created_at: string
  order_id?: string
  bid_id?: string
}

interface NotificationStats {
  unread: number
  total: number
  byType: Record<string, number>
}

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [stats, setStats] = useState<NotificationStats>({
    unread: 0,
    total: 0,
    byType: {}
  })
  const [isLoading, setIsLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([])
      setIsLoading(false)
      return
    }

    try {
      // Временные моковые данные
      // Позже заменим на реальный API
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'new_bid',
          title: 'Новый отклик на ваш заказ',
          message: 'Иван Петров откликнулся на заказ "Разработка лендинга для стоматологии"',
          data: { freelancerName: 'Иван Петров', orderTitle: 'Разработка лендинга для стоматологии' },
          is_read: false,
          created_at: new Date().toISOString(),
          order_id: '1',
          bid_id: '1'
        },
        {
          id: '2',
          type: 'bid_accepted',
          title: 'Ваша заявка принята!',
          message: 'Клиент Анна Иванова приняла вашу заявку на проект "Дизайн логотипа"',
          data: { clientName: 'Анна Иванова', orderTitle: 'Дизайн логотипа' },
          is_read: true,
          created_at: new Date(Date.now() - 3600000).toISOString(),
          order_id: '2',
          bid_id: '2'
        },
        {
          id: '3',
          type: 'new_message',
          title: 'Новое сообщение',
          message: 'У вас новое сообщение от Дмитрия Смирнова по заказу "SEO оптимизация"',
          data: { senderName: 'Дмитрий Смирнов', orderTitle: 'SEO оптимизация' },
          is_read: false,
          created_at: new Date(Date.now() - 7200000).toISOString(),
          order_id: '3'
        },
        {
          id: '4',
          type: 'payment_received',
          title: 'Оплата получена',
          message: 'На ваш баланс зачислено 25,000 ₽ за проект "Разработка мобильного приложения"',
          data: { amount: 25000, orderTitle: 'Разработка мобильного приложения' },
          is_read: true,
          created_at: new Date(Date.now() - 86400000).toISOString(),
          order_id: '4'
        },
        {
          id: '5',
          type: 'deadline_reminder',
          title: 'Напоминание о дедлайне',
          message: 'До сдачи проекта "Копирайтинг для сайта" осталось 2 дня',
          data: { daysLeft: 2, orderTitle: 'Копирайтинг для сайта' },
          is_read: false,
          created_at: new Date(Date.now() - 172800000).toISOString(),
          order_id: '5'
        }
      ]

      setNotifications(mockNotifications)
      
      // Рассчитываем статистику
      const unread = mockNotifications.filter(n => !n.is_read).length
      const byType: Record<string, number> = {}
      
      mockNotifications.forEach(notification => {
        byType[notification.type] = (byType[notification.type] || 0) + 1
      })

      setStats({
        unread,
        total: mockNotifications.length,
        byType
      })
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchNotifications()
    
    // Опционально: подписка на реальные обновления через WebSocket
    // const interval = setInterval(fetchNotifications, 30000) // Обновление каждые 30 секунд
    // return () => clearInterval(interval)
  }, [fetchNotifications])

  const markAsRead = async (notificationId: string) => {
    try {
      // Временная логика
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true }
            : notification
        )
      )
      
      setStats(prev => ({
        ...prev,
        unread: Math.max(0, prev.unread - 1)
      }))

      // Позже добавим вызов API
      // await fetch(`/api/notifications/${notificationId}/read`, { method: 'POST' })
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      // Временная логика
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, is_read: true }))
      )
      
      setStats(prev => ({
        ...prev,
        unread: 0
      }))

      // Позже добавим вызов API
      // await fetch('/api/notifications/read-all', { method: 'POST' })
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const archive = async (notificationId: string) => {
    try {
      setNotifications(prev => 
        prev.filter(notification => notification.id !== notificationId)
      )
      
      const notification = notifications.find(n => n.id === notificationId)
      if (notification && !notification.is_read) {
        setStats(prev => ({
          ...prev,
          unread: Math.max(0, prev.unread - 1),
          total: prev.total - 1
        }))
      } else if (notification) {
        setStats(prev => ({
          ...prev,
          total: prev.total - 1
        }))
      }

      // Позже добавим вызов API
      // await fetch(`/api/notifications/${notificationId}/archive`, { method: 'POST' })
    } catch (error) {
      console.error('Error archiving notification:', error)
    }
  }

  const createNotification = async (notificationData: {
    type: string
    title: string
    message: string
    data?: any
    userId?: string
    orderId?: string
    bidId?: string
  }) => {
    try {
      // Здесь будет логика создания уведомления через API
      // Пока просто обновляем локальное состояние для демонстрации
      
      const newNotification: Notification = {
        id: Date.now().toString(),
        ...notificationData,
        is_read: false,
        created_at: new Date().toISOString()
      }

      setNotifications(prev => [newNotification, ...prev])
      setStats(prev => ({
        ...prev,
        unread: prev.unread + 1,
        total: prev.total + 1,
        byType: {
          ...prev.byType,
          [notificationData.type]: (prev.byType[notificationData.type] || 0) + 1
        }
      }))

      // Позже добавим вызов API
      // await fetch('/api/notifications', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(notificationData)
      // })
    } catch (error) {
      console.error('Error creating notification:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, string> = {
      new_bid: '👤',
      bid_accepted: '✅',
      bid_rejected: '❌',
      new_message: '💬',
      payment_received: '💰',
      deadline_reminder: '⏰',
      order_completed: '🏆',
      system_alert: '🔔'
    }
    return icons[type] || '🔔'
  }

  const getNotificationColor = (type: string) => {
    const colors: Record<string, string> = {
      new_bid: 'bg-blue-100 text-blue-800',
      bid_accepted: 'bg-green-100 text-green-800',
      bid_rejected: 'bg-red-100 text-red-800',
      new_message: 'bg-purple-100 text-purple-800',
      payment_received: 'bg-yellow-100 text-yellow-800',
      deadline_reminder: 'bg-orange-100 text-orange-800',
      order_completed: 'bg-indigo-100 text-indigo-800',
      system_alert: 'bg-gray-100 text-gray-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'только что'
    if (diffMins < 60) return `${diffMins} мин назад`
    if (diffHours < 24) return `${diffHours} ч назад`
    if (diffDays < 7) return `${diffDays} дн назад`
    
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short'
    })
  }

  return {
    notifications,
    stats,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    archive,
    createNotification,
    getNotificationIcon,
    getNotificationColor,
    formatTime
  }
}