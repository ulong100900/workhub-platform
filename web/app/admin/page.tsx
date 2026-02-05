'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Users,
  Flag,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  UserPlus,
  FileText,
  MessageSquare,
  Settings,
  BarChart,
  Shield
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'

interface DashboardStats {
  totalUsers: number
  newUsersToday: number
  pendingReports: number
  pendingPayouts: number
  totalRevenue: number
  activeProjects: number
  systemHealth: 'good' | 'warning' | 'error'
}

interface RecentActivity {
  id: string
  type: 'user_registered' | 'report_created' | 'payout_processed' | 'system_alert'
  title: string
  description: string
  timestamp: string
  user?: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activities, setActivities] = useState<RecentActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Временные моковые данные
    setTimeout(() => {
      setStats({
        totalUsers: 1542,
        newUsersToday: 24,
        pendingReports: 12,
        pendingPayouts: 8,
        totalRevenue: 1254000,
        activeProjects: 89,
        systemHealth: 'good'
      })

      setActivities([
        {
          id: '1',
          type: 'user_registered',
          title: 'Новый пользователь',
          description: 'Анна Смирнова зарегистрировалась как исполнитель',
          timestamp: '10 минут назад',
          user: 'anna.smirnova@example.com'
        },
        {
          id: '2',
          type: 'report_created',
          title: 'Создана новая жалоба',
          description: 'Жалоба на мошенничество в проекте #456',
          timestamp: '45 минут назад',
          user: 'ivan.petrov@example.com'
        },
        {
          id: '3',
          type: 'payout_processed',
          title: 'Выплата завершена',
          description: 'Выплата 50,000₽ пользователю Дмитрий Козлов',
          timestamp: '2 часа назад'
        },
        {
          id: '4',
          type: 'system_alert',
          title: 'Системное уведомление',
          description: 'Обновление правил платформы вступило в силу',
          timestamp: '5 часов назад'
        },
        {
          id: '5',
          type: 'report_created',
          title: 'Некорректное поведение',
          description: 'Жалоба на оскорбительные сообщения',
          timestamp: '6 часов назад',
          user: 'olga.kuznetsova@example.com'
        }
      ])

      setIsLoading(false)
    }, 1000)
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registered':
        return <UserPlus className="h-5 w-5 text-green-600" />
      case 'report_created':
        return <Flag className="h-5 w-5 text-red-600" />
      case 'payout_processed':
        return <DollarSign className="h-5 w-5 text-blue-600" />
      case 'system_alert':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      default:
        return <MessageSquare className="h-5 w-5 text-gray-600" />
    }
  }

 const getSystemHealthBadge = (health: string) => {
  switch (health) {
    case 'good':
      return (
        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-800 text-sm">
          <CheckCircle className="h-3 w-3" />
          Отлично
        </div>
      )
    case 'warning':
      return (
        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm border border-yellow-300">
          <AlertTriangle className="h-3 w-3" />
          Внимание
        </div>
      )
    case 'error':
      return (
        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-800 text-sm">
          <XCircle className="h-3 w-3" />
          Ошибка
        </div>
      )
    default:
      return (
        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-800 text-sm">
          <HelpCircle className="h-3 w-3" />
          Неизвестно
        </div>
      )
  }
}

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Панель администратора</h1>
          <p className="text-gray-600 mt-2">
            Обзор системы и управление платформой
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Настройки
          </Button>
          <Button>
            <Shield className="mr-2 h-4 w-4" />
            Защита системы
          </Button>
        </div>
      </div>

      {/* Статистика */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  <div className="text-sm text-gray-600">Всего пользователей</div>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600">+{stats.newUsersToday} сегодня</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{stats.pendingReports}</div>
                  <div className="text-sm text-gray-600">Жалоб на рассмотрении</div>
                </div>
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <Flag className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="mt-4">
                <Link href="/admin/reports" className="text-sm text-blue-600 hover:text-blue-800">
                  Перейти к обработке →
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{stats.pendingPayouts}</div>
                  <div className="text-sm text-gray-600">Выплат в ожидании</div>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4">
                <Link href="/admin/payouts" className="text-sm text-blue-600 hover:text-blue-800">
                  Управление выплатами →
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
                  <div className="text-sm text-gray-600">Общая выручка</div>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <BarChart className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600">+12% за месяц</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Быстрые действия */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Быстрые действия</CardTitle>
            <CardDescription>
              Часто используемые функции администратора
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/admin/users">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-bold">Управление пользователями</div>
                        <div className="text-sm text-gray-600">
                          Редактирование, блокировка, просмотр статистики
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/admin/reports">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                        <Flag className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <div className="font-bold">Обработка жалоб</div>
                        <div className="text-sm text-gray-600">
                          Рассмотрение жалоб и разрешение конфликтов
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/admin/payouts">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <div className="font-bold">Управление выплатами</div>
                        <div className="text-sm text-gray-600">
                          Обработка выплат и финансовый контроль
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                      <Settings className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                      <div className="font-bold">Настройки системы</div>
                      <div className="text-sm text-gray-600">
                        Конфигурация платформы и параметры
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Состояние системы */}
        <Card>
          <CardHeader>
            <CardTitle>Состояние системы</CardTitle>
            <CardDescription>
              Мониторинг работоспособности
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="font-medium">Общее состояние</div>
                {stats && getSystemHealthBadge(stats.systemHealth)}
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm">API сервер</div>
                  <Badge variant="success">Работает</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm">База данных</div>
                  <Badge variant="success">Активна</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm">Платежная система</div>
                  <Badge variant="success">Доступна</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm">Загрузка сервера</div>
                  <Badge variant="default">42%</Badge>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="text-sm font-medium mb-2">Активные проекты</div>
                <div className="text-2xl font-bold">{stats?.activeProjects || 0}</div>
                <div className="text-sm text-gray-600">
                  В работе на данный момент
                </div>
              </div>

              <Button className="w-full" variant="outline">
                <AlertCircle className="mr-2 h-4 w-4" />
                Показать все метрики
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Последние действия */}
      <Card>
        <CardHeader>
          <CardTitle>Последние действия</CardTitle>
          <CardDescription>
            Недавние события на платформе
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-lg">
                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{activity.title}</div>
                    <div className="text-sm text-gray-500">{activity.timestamp}</div>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">{activity.description}</div>
                  {activity.user && (
                    <div className="text-sm text-gray-500 mt-1">
                      Пользователь: {activity.user}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6">
            <Link href="/admin/activity">
              <Button variant="outline" className="w-full">
                <FileText className="mr-2 h-4 w-4" />
                Показать всю историю
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Уведомления и предупреждения */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Уведомления</CardTitle>
              <CardDescription>
                Требуют вашего внимания
              </CardDescription>
            </div>
            <Badge variant="destructive">3 новых</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-3 bg-red-50 rounded-lg border border-red-200">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-medium text-red-800">Критическая жалоба</div>
                <div className="text-sm text-red-700 mt-1">
                  Требуется немедленное рассмотрение жалобы на мошенничество
                </div>
                <div className="mt-2">
                  <Link href="/admin/reports">
                    <Button variant="destructive" size="sm">
                      Перейти к жалобе
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <Clock className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-medium text-yellow-800">Выплаты в ожидании</div>
                <div className="text-sm text-yellow-700 mt-1">
                  8 выплат ожидают вашего утверждения более 24 часов
                </div>
                <div className="mt-2">
                  <Link href="/admin/payouts">
                    <Button variant="outline" size="sm" className="text-yellow-700 border-yellow-300">
                      Просмотреть выплаты
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-medium text-blue-800">Проверка безопасности</div>
                <div className="text-sm text-blue-700 mt-1">
                  Рекомендуется проверить подозрительную активность пользователя
                </div>
                <div className="mt-2">
                  <Link href="/admin/users">
                    <Button variant="outline" size="sm" className="text-blue-700 border-blue-300">
                      Проверить пользователя
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}