'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { NotificationService, Notification, NotificationPreferences } from '@/lib/notifications'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  Bell, 
  Check, 
  Trash2, 
  Settings,
  Mail,
  Smartphone,
  Globe,
  Clock,
  Filter,
  Loader2,
  AlertCircle,
  XCircle,
  CheckCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Skeleton } from '@/components/ui/skeleton'

// Константы для типов уведомлений
const NOTIFICATION_TYPES = {
  ALL: 'all',
  UNREAD: 'unread',
  ORDER: 'order',
  PAYMENT: 'payment',
  REVIEW: 'review',
  INFO: 'info',
  WARNING: 'warning',
  SUCCESS: 'success',
  ERROR: 'error'
} as const

type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES]

// Типы для фильтров
type TimeFilter = 'all' | 'today' | 'week' | 'month'

// Тип для toast уведомлений
type ToastType = {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'info';
}

// Временное решение для получения userId - в продакшене нужно заменить на реальную аутентификацию
const getUserId = (): string => {
  // Попробуем получить userId из localStorage
  if (typeof window !== 'undefined') {
    const storedUserId = localStorage.getItem('userId')
    if (storedUserId) {
      return storedUserId
    }
    
    // Если нет в localStorage, создаем временный ID
    const tempUserId = `temp-user-${Date.now()}`
    localStorage.setItem('userId', tempUserId)
    return tempUserId
  }
  
  return 'temp-user-id'
}

export default function NotificationsCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [activeTab, setActiveTab] = useState<NotificationType>(NOTIFICATION_TYPES.ALL)
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingActions, setIsLoadingActions] = useState(false)
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set())
  const [toasts, setToasts] = useState<ToastType[]>([])
  const [userId, setUserId] = useState<string>('')
  
  // Инициализируем userId после монтирования компонента
  useEffect(() => {
    setUserId(getUserId())
  }, [])

  // Вспомогательная функция для toast уведомлений
  const showToast = useCallback((title: string, description?: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString()
    const newToast: ToastType = { id, title, description, type }
    
    setToasts(prev => [...prev, newToast])
    
    // Автоматически удаляем toast через 5 секунд
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id))
    }, 5000)
  }, [])

  // Функция для закрытия toast
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const loadData = useCallback(async () => {
    if (!userId) {
      showToast('Ошибка', 'Не удалось определить пользователя', 'error')
      return
    }
    
    setIsLoading(true)
    try {
      const filters: {
        isRead?: boolean
        type?: string
        timeFilter?: TimeFilter
      } = {}
      
      if (activeTab !== NOTIFICATION_TYPES.ALL) {
        if (activeTab === NOTIFICATION_TYPES.UNREAD) {
          filters.isRead = false
        } else {
          filters.type = activeTab
        }
      }
      
      if (timeFilter !== 'all') {
        filters.timeFilter = timeFilter
      }
      
      const { notifications: notificationsData } = await NotificationService.getUserNotifications(
        userId,
        filters,
        1,
        50
      )
      setNotifications(notificationsData || [])
      
      // Загружаем настройки
      const prefs = await NotificationService.getUserPreferences(userId)
      setPreferences(prefs)
    } catch (error) {
      console.error('Error loading notifications:', error)
      showToast('Ошибка загрузки', 'Не удалось загрузить уведомления. Пожалуйста, попробуйте позже.', 'error')
    } finally {
      setIsLoading(false)
    }
  }, [userId, activeTab, timeFilter, showToast])

  useEffect(() => {
    if (userId) {
      loadData()
    }
  }, [loadData, userId])

  const handleMarkAsRead = async (notificationId: string) => {
    if (!userId) {
      showToast('Ошибка', 'Не удалось определить пользователя', 'error')
      return
    }
    
    try {
      await NotificationService.markAsRead(notificationId, userId)
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      ))
      setSelectedNotifications(prev => {
        const newSet = new Set(prev)
        newSet.delete(notificationId)
        return newSet
      })
      showToast('Уведомление прочитано', 'Уведомление отмечено как прочитанное', 'success')
    } catch (error) {
      console.error('Error marking as read:', error)
      showToast('Ошибка', 'Не удалось отметить уведомление как прочитанное.', 'error')
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!userId) {
      showToast('Ошибка', 'Не удалось определить пользователя', 'error')
      return
    }
    
    setIsLoadingActions(true)
    try {
      await NotificationService.markAllAsRead(userId)
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setSelectedNotifications(new Set())
      showToast('Успешно', 'Все уведомления отмечены как прочитанные.', 'success')
    } catch (error) {
      console.error('Error marking all as read:', error)
      showToast('Ошибка', 'Не удалось отметить все уведомления как прочитанные.', 'error')
    } finally {
      setIsLoadingActions(false)
    }
  }

  const handleDelete = async (notificationId: string) => {
    if (!userId) {
      showToast('Ошибка', 'Не удалось определить пользователя', 'error')
      return
    }
    
    try {
      await NotificationService.deleteNotification(notificationId, userId)
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      setSelectedNotifications(prev => {
        const newSet = new Set(prev)
        newSet.delete(notificationId)
        return newSet
      })
      showToast('Уведомление удалено', 'Уведомление успешно удалено', 'success')
    } catch (error) {
      console.error('Error deleting notification:', error)
      showToast('Ошибка', 'Не удалось удалить уведомление.', 'error')
    }
  }

  const handleClearRead = async () => {
    if (!userId) {
      showToast('Ошибка', 'Не удалось определить пользователя', 'error')
      return
    }
    
    setIsLoadingActions(true)
    try {
      await NotificationService.clearReadNotifications(userId)
      setNotifications(prev => prev.filter(n => !n.isRead))
      showToast('Успешно', 'Все прочитанные уведомления удалены.', 'success')
    } catch (error) {
      console.error('Error clearing read notifications:', error)
      showToast('Ошибка', 'Не удалось очистить прочитанные уведомления.', 'error')
    } finally {
      setIsLoadingActions(false)
    }
  }

  const handleToggleSelection = (notificationId: string) => {
    setSelectedNotifications(prev => {
      const newSelected = new Set(prev)
      if (newSelected.has(notificationId)) {
        newSelected.delete(notificationId)
      } else {
        newSelected.add(notificationId)
      }
      return newSelected
    })
  }

  const handleSelectAll = () => {
    if (selectedNotifications.size === notifications.length) {
      setSelectedNotifications(new Set())
      showToast('Выбор сброшен', 'Все уведомления сняты с выбора', 'info')
    } else {
      setSelectedNotifications(new Set(notifications.map(n => n.id)))
      showToast('Все выбрано', `Выбрано ${notifications.length} уведомлений`, 'info')
    }
  }

  const handleBulkAction = async (action: 'read' | 'delete') => {
    if (!userId) {
      showToast('Ошибка', 'Не удалось определить пользователя', 'error')
      return
    }
    
    if (selectedNotifications.size === 0) {
      showToast('Нет выбранных уведомлений', 'Выберите уведомления для выполнения действия', 'info')
      return
    }
    
    setIsLoadingActions(true)
    try {
      const notificationIds = Array.from(selectedNotifications)
      
      if (action === 'read') {
        // Для массового чтения лучше использовать специальный метод API
        for (const id of notificationIds) {
          await NotificationService.markAsRead(id, userId)
        }
        setNotifications(prev => prev.map(n => 
          selectedNotifications.has(n.id) ? { ...n, isRead: true } : n
        ))
        showToast('Успешно', `Отмечено как прочитанное: ${selectedNotifications.size} уведомлений`, 'success')
      } else if (action === 'delete') {
        // Для массового удаления лучше использовать специальный метод API
        for (const id of notificationIds) {
          await NotificationService.deleteNotification(id, userId)
        }
        setNotifications(prev => prev.filter(n => !selectedNotifications.has(n.id)))
        showToast('Успешно', `Удалено: ${selectedNotifications.size} уведомлений`, 'success')
      }
      
      setSelectedNotifications(new Set())
    } catch (error) {
      console.error('Error performing bulk action:', error)
      showToast('Ошибка', 'Не удалось выполнить групповое действие.', 'error')
    } finally {
      setIsLoadingActions(false)
    }
  }

  const handlePreferenceChange = async (updates: Partial<NotificationPreferences>) => {
    if (!preferences || !userId) return
    
    try {
      const updatedPrefs = await NotificationService.updateUserPreferences(userId, updates)
      setPreferences(updatedPrefs)
      showToast('Настройки сохранены', 'Ваши настройки уведомлений обновлены.', 'success')
    } catch (error) {
      console.error('Error updating preferences:', error)
      showToast('Ошибка', 'Не удалось сохранить настройки.', 'error')
    }
  }

  const getNotificationTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      [NOTIFICATION_TYPES.ORDER]: 'Заказы',
      [NOTIFICATION_TYPES.PAYMENT]: 'Платежи',
      [NOTIFICATION_TYPES.REVIEW]: 'Отзывы',
      [NOTIFICATION_TYPES.INFO]: 'Информация',
      [NOTIFICATION_TYPES.WARNING]: 'Предупреждения',
      [NOTIFICATION_TYPES.SUCCESS]: 'Успех',
      [NOTIFICATION_TYPES.ERROR]: 'Ошибки'
    }
    return labels[type] || type
  }

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      [NOTIFICATION_TYPES.ORDER]: <div className="h-2 w-2 rounded-full bg-blue-500" />,
      [NOTIFICATION_TYPES.PAYMENT]: <div className="h-2 w-2 rounded-full bg-green-500" />,
      [NOTIFICATION_TYPES.REVIEW]: <div className="h-2 w-2 rounded-full bg-yellow-500" />,
      [NOTIFICATION_TYPES.INFO]: <div className="h-2 w-2 rounded-full bg-gray-500" />,
      [NOTIFICATION_TYPES.WARNING]: <div className="h-2 w-2 rounded-full bg-orange-500" />,
      [NOTIFICATION_TYPES.SUCCESS]: <div className="h-2 w-2 rounded-full bg-green-500" />,
      [NOTIFICATION_TYPES.ERROR]: <div className="h-2 w-2 rounded-full bg-red-500" />,
    }
    return icons[type] || <div className="h-2 w-2 rounded-full bg-gray-400" />
  }

  // Мемоизированные значения для оптимизации
  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.isRead).length
  }, [notifications])

  const hasReadNotifications = useMemo(() => {
    return notifications.some(n => n.isRead)
  }, [notifications])

  const canMarkAllAsRead = useMemo(() => {
    return notifications.length > 0 && unreadCount > 0
  }, [notifications, unreadCount])

  // Скелетон для загрузки
  const renderSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-24 w-full" />
      ))}
    </div>
  )

  // Функция для рендеринга toast уведомлений
  const renderToasts = () => (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center justify-between p-4 rounded-lg shadow-lg border ${
            toast.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800'
              : toast.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          <div className="flex items-start gap-3">
            {toast.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            ) : toast.type === 'error' ? (
              <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
            )}
            <div>
              <p className="font-medium">{toast.title}</p>
              {toast.description && (
                <p className="text-sm mt-1">{toast.description}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-4 text-gray-400 hover:text-gray-600"
            aria-label="Закрыть уведомление"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Toast уведомления */}
      {renderToasts()}
      
      <div className="space-y-6">
        {/* Заголовок */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Уведомления</h1>
            <p className="text-muted-foreground mt-2">
              Управление уведомлениями и настройками оповещений
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {selectedNotifications.size > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">
                  Выбрано: {selectedNotifications.size}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('read')}
                  disabled={isLoadingActions}
                >
                  {isLoadingActions ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Прочитать выбранные
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('delete')}
                  disabled={isLoadingActions}
                  className="text-destructive"
                >
                  {isLoadingActions ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Удалить выбранные
                </Button>
              </div>
            )}
            <Button
              variant="outline"
              onClick={handleMarkAllAsRead}
              disabled={isLoadingActions || !canMarkAllAsRead}
            >
              {isLoadingActions ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Прочитать все
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Основной контент */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle>История уведомлений</CardTitle>
                    {unreadCount > 0 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Непрочитанных: {unreadCount}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={timeFilter}
                      onValueChange={(value: TimeFilter) => setTimeFilter(value)}
                    >
                      <SelectTrigger className="w-[140px]">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все время</SelectItem>
                        <SelectItem value="today">Сегодня</SelectItem>
                        <SelectItem value="week">За неделю</SelectItem>
                        <SelectItem value="month">За месяц</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {/* Табы */}
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as NotificationType)} className="mb-6">
                  <TabsList className="flex flex-wrap h-auto">
                    <TabsTrigger value={NOTIFICATION_TYPES.ALL} className="flex-1 min-w-[80px]">
                      Все
                    </TabsTrigger>
                    <TabsTrigger value={NOTIFICATION_TYPES.UNREAD} className="flex-1 min-w-[80px]">
                      Непрочитанные
                      {unreadCount > 0 && (
                        <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1">
                          {unreadCount}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value={NOTIFICATION_TYPES.ORDER} className="flex-1 min-w-[80px]">
                      Заказы
                    </TabsTrigger>
                    <TabsTrigger value={NOTIFICATION_TYPES.PAYMENT} className="flex-1 min-w-[80px]">
                      Платежи
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                {/* Выбор всех */}
                {notifications.length > 0 && (
                  <div className="flex items-center justify-between mb-4 p-2 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedNotifications.size === notifications.length}
                        onChange={handleSelectAll}
                        className="h-4 w-4 rounded border-gray-300"
                        id="select-all"
                      />
                      <Label htmlFor="select-all" className="text-sm cursor-pointer">
                        Выбрать все
                      </Label>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {selectedNotifications.size} выбрано
                    </span>
                  </div>
                )}

                {isLoading ? (
                  renderSkeleton()
                ) : notifications.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">Уведомлений нет</h3>
                    <p className="text-muted-foreground mt-2">
                      Здесь будут появляться ваши уведомления
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border rounded-lg transition-colors ${
                          !notification.isRead 
                            ? 'bg-primary/5 border-primary/20' 
                            : 'hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            <input
                              type="checkbox"
                              checked={selectedNotifications.has(notification.id)}
                              onChange={() => handleToggleSelection(notification.id)}
                              className="h-4 w-4 rounded border-gray-300"
                              id={`notification-${notification.id}`}
                            />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  {getNotificationIcon(notification.type)}
                                  <h4 className="font-medium truncate">{notification.title}</h4>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {notification.message}
                                </p>
                              </div>
                              
                              <div className="text-right ml-4 flex-shrink-0">
                                <div className="text-xs text-muted-foreground">
                                  {format(new Date(notification.createdAt), 'dd.MM.yyyy HH:mm', { locale: ru })}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {getNotificationTypeLabel(notification.type)}
                                </div>
                              </div>
                            </div>
                            
                            {notification.data && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {notification.data.orderId && (
                                  <Badge variant="secondary" className="text-xs">
                                    Заказ #{notification.data.orderId.slice(0, 8)}
                                  </Badge>
                                )}
                                {notification.data.amount && (
                                  <Badge variant="secondary" className="text-xs">
                                    {new Intl.NumberFormat('ru-RU').format(notification.data.amount)} ₽
                                  </Badge>
                                )}
                              </div>
                            )}
                            
                            <div className="flex items-center gap-2 mt-3">
                              {!notification.isRead && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleMarkAsRead(notification.id)}
                                  className="text-xs h-7"
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  Прочитать
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(notification.id)}
                                className="text-xs h-7 text-destructive hover:text-destructive/90"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Удалить
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Кнопка очистки */}
                {hasReadNotifications && (
                  <div className="mt-6 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={handleClearRead}
                      className="w-full"
                      disabled={isLoadingActions}
                    >
                      {isLoadingActions ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Очистка...
                        </>
                      ) : (
                        'Очистить прочитанные'
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Настройки */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Настройки уведомлений
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {preferences ? (
                  <>
                    {/* Каналы уведомлений */}
                    <div className="space-y-4">
                      <h4 className="font-medium">Каналы уведомлений</h4>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <Label htmlFor="email-notifications" className="cursor-pointer">
                              Email уведомления
                            </Label>
                          </div>
                          <Switch
                            id="email-notifications"
                            checked={preferences.email}
                            onCheckedChange={(checked) => 
                              handlePreferenceChange({ email: checked })
                            }
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Smartphone className="h-4 w-4 text-muted-foreground" />
                            <Label htmlFor="push-notifications" className="cursor-pointer">
                              Push уведомления
                            </Label>
                          </div>
                          <Switch
                            id="push-notifications"
                            checked={preferences.push}
                            onCheckedChange={(checked) => 
                              handlePreferenceChange({ push: checked })
                            }
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <Label htmlFor="browser-notifications" className="cursor-pointer">
                              Браузерные уведомления
                            </Label>
                          </div>
                          <Switch
                            id="browser-notifications"
                            checked={preferences.browser}
                            onCheckedChange={(checked) => 
                              handlePreferenceChange({ browser: checked })
                            }
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Типы уведомлений */}
                    <div className="space-y-4">
                      <h4 className="font-medium">Типы уведомлений</h4>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="order-updates" className="cursor-pointer">
                            Обновления заказов
                          </Label>
                          <Switch
                            id="order-updates"
                            checked={preferences.orderUpdates}
                            onCheckedChange={(checked) => 
                              handlePreferenceChange({ orderUpdates: checked })
                            }
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="payment-updates" className="cursor-pointer">
                            Обновления платежей
                          </Label>
                          <Switch
                            id="payment-updates"
                            checked={preferences.paymentUpdates}
                            onCheckedChange={(checked) => 
                              handlePreferenceChange({ paymentUpdates: checked })
                            }
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="review-updates" className="cursor-pointer">
                            Обновления отзывов
                          </Label>
                          <Switch
                            id="review-updates"
                            checked={preferences.reviewUpdates}
                            onCheckedChange={(checked) => 
                              handlePreferenceChange({ reviewUpdates: checked })
                            }
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="marketing" className="cursor-pointer">
                            Маркетинговые рассылки
                          </Label>
                          <Switch
                            id="marketing"
                            checked={preferences.marketing}
                            onCheckedChange={(checked) => 
                              handlePreferenceChange({ marketing: checked })
                            }
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Дайджест */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <Label htmlFor="digest-frequency">Частота дайджеста</Label>
                      </div>
                      <Select
                        value={preferences.digestFrequency}
                        onValueChange={(value: 'never' | 'daily' | 'weekly') => 
                          handlePreferenceChange({ digestFrequency: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="never">Никогда</SelectItem>
                          <SelectItem value="daily">Ежедневно</SelectItem>
                          <SelectItem value="weekly">Еженедельно</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Сводка непрочитанных уведомлений за период
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Быстрые действия */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Быстрые действия</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    showToast('Тестовое уведомление', 'Это тестовое уведомление', 'info')
                  }}
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Тестовое уведомление
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    handlePreferenceChange({
                      email: true,
                      push: true,
                      browser: true,
                      orderUpdates: true,
                      paymentUpdates: true,
                      reviewUpdates: true,
                      marketing: false,
                      digestFrequency: 'daily'
                    })
                  }}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Настройки по умолчанию
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    showToast('Управление подписками', 'Для управления email подписками перейдите в настройки профиля', 'info')
                  }}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Управление email подписками
                </Button>
              </CardContent>
            </Card>

            {/* Информационная панель */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Информация
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    • Уведомления хранятся 90 дней
                  </div>
                  <div className="text-sm text-muted-foreground">
                    • Push-уведомления требуют разрешения браузера
                  </div>
                  <div className="text-sm text-muted-foreground">
                    • Email уведомления могут приходить с задержкой
                  </div>
                  <div className="text-sm text-muted-foreground">
                    • Для отключения всех уведомлений используйте "Настройки по умолчанию"
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}