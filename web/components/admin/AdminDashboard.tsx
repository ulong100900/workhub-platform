'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  DollarSign, 
  FileText, 
  AlertCircle, 
  TrendingUp, 
  Shield, 
  Settings,
  Bell,
  Calendar,
  BarChart,
  UserCheck,
  Flag,
  MessageSquare,
  Eye
} from 'lucide-react'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'

interface AdminStats {
  totalUsers: number
  newUsersToday: number
  totalOrders: number
  activeOrders: number
  totalRevenue: number
  pendingWithdrawals: number
  pendingReports: number
  pendingReviews: number
  systemAlerts: number
}

interface RecentActivity {
  id: string
  type: string
  user: string
  action: string
  time: string
  status: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Временные моковые данные
    setTimeout(() => {
      setStats({
        totalUsers: 12542,
        newUsersToday: 48,
        totalOrders: 8756,
        activeOrders: 324,
        totalRevenue: 12500000,
        pendingWithdrawals: 12,
        pendingReports: 8,
        pendingReviews: 23,
        systemAlerts: 3
      })

      setRecentActivities([
        { id: '1', type: 'user', user: 'Иван Петров', action: 'Зарегистрировался', time: '10 мин назад', status: 'success' },
        { id: '2', type: 'order', user: 'Анна Иванова', action: 'Создала заказ', time: '25 мин назад', status: 'info' },
        { id: '3', type: 'report', user: 'Дмитрий Смирнов', action: 'Пожаловался на отзыв', time: '1 час назад', status: 'warning' },
        { id: '4', type: 'withdrawal', user: 'Ольга Кузнецова', action: 'Запросила вывод 25,000 ₽', time: '2 часа назад', status: 'processing' },
        { id: '5', type: 'review', user: 'Петр Сидоров', action: 'Оставил отзыв с оценкой 1', time: '3 часа назад', status: 'alert' }
      ])

      setIsLoading(false)
    }, 1000)
  }, [])

  const quickActions = [
    {
      title: 'Модерация отзывов',
      description: 'Проверка новых отзывов',
      icon: <MessageSquare className="h-6 w-6 text-blue-500" />,
      href: '/admin/reviews',
      count: stats?.pendingReviews,
      color: 'bg-blue-50 hover:bg-blue-100'
    },
    {
      title: 'Жалобы',
      description: 'Обработка репортов',
      icon: <Flag className="h-6 w-6 text-red-500" />,
      href: '/admin/reports',
      count: stats?.pendingReports,
      color: 'bg-red-50 hover:bg-red-100'
    },
    {
      title: 'Выплаты',
      description: 'Обработка выводов',
      icon: <DollarSign className="h-6 w-6 text-green-500" />,
      href: '/admin/withdrawals',
      count: stats?.pendingWithdrawals,
      color: 'bg-green-50 hover:bg-green-100'
    },
    {
      title: 'Пользователи',
      description: 'Управление пользователями',
      icon: <UserCheck className="h-6 w-6 text-purple-500" />,
      href: '/admin/users',
      count: stats?.newUsersToday,
      color: 'bg-purple-50 hover:bg-purple-100'
    }
  ]

  const systemHealth = [
    { name: 'API', status: 'healthy', responseTime: '45ms' },
    { name: 'База данных', status: 'healthy', uptime: '99.9%' },
    { name: 'Платежная система', status: 'warning', message: 'Плановое обслуживание' },
    { name: 'Email рассылка', status: 'healthy', lastSent: '2 мин назад' },
    { name: 'CDN', status: 'healthy', performance: '98%' }
  ]

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Административная панель</h1>
          <p className="text-gray-600 mt-2">
            Управление платформой и мониторинг системы
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-50 text-green-700">
            <Shield className="h-3 w-3 mr-1" />
            Администратор
          </Badge>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Настройки
          </Button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Пользователи</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers.toLocaleString()}</div>
            <div className="flex items-center text-xs text-gray-500 mt-1">
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              <span>+{stats?.newUsersToday} сегодня</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Заказы</CardTitle>
            <FileText className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalOrders.toLocaleString()}</div>
            <div className="text-xs text-gray-500 mt-1">
              {stats?.activeOrders} активных
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Общий оборот</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.totalRevenue || 0).toLocaleString()} ₽
            </div>
            <div className="text-xs text-gray-500 mt-1">
              За все время работы
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Требуют внимания</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((stats?.pendingReports || 0) + (stats?.pendingWithdrawals || 0) + (stats?.pendingReviews || 0))}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              задач в обработке
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Быстрые действия */}
      <Card>
        <CardHeader>
          <CardTitle>Быстрые действия</CardTitle>
          <CardDescription>
            Часто используемые функции администратора
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Link key={index} href={action.href}>
                <Card className={`cursor-pointer transition-all hover:shadow-md ${action.color}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium mb-1">{action.title}</div>
                        <div className="text-sm text-gray-600">{action.description}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {action.icon}
                        {action.count && action.count > 0 && (
                          <Badge variant="destructive" className="h-6 w-6 p-0 flex items-center justify-center">
                            {action.count}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Последняя активность */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Последняя активность</CardTitle>
              <CardDescription>
                События на платформе за последние 24 часа
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        activity.status === 'success' ? 'bg-green-100 text-green-600' :
                        activity.status === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                        activity.status === 'alert' ? 'bg-red-100 text-red-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {activity.type === 'user' && <Users className="h-5 w-5" />}
                        {activity.type === 'order' && <FileText className="h-5 w-5" />}
                        {activity.type === 'report' && <Flag className="h-5 w-5" />}
                        {activity.type === 'withdrawal' && <DollarSign className="h-5 w-5" />}
                        {activity.type === 'review' && <MessageSquare className="h-5 w-5" />}
                      </div>
                      <div>
                        <div className="font-medium">{activity.user}</div>
                        <div className="text-sm text-gray-600">{activity.action}</div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">{activity.time}</div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                <Eye className="mr-2 h-4 w-4" />
                Вся история действий
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Состояние системы */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Состояние системы</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {systemHealth.map((service, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${
                        service.status === 'healthy' ? 'bg-green-500' :
                        service.status === 'warning' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`} />
                      <span className="text-sm">{service.name}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {service.status === 'healthy' ? service.responseTime || service.uptime : service.message}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Статистика за сегодня */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Сегодня
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Новые пользователи</span>
                  <span className="font-medium">{stats?.newUsersToday}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Новые заказы</span>
                  <span className="font-medium">24</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Выплачено</span>
                  <span className="font-medium">125,000 ₽</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Комиссия</span>
                  <span className="font-medium">12,500 ₽</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Быстрые ссылки */}
          <Card>
            <CardHeader>
              <CardTitle>Быстрые ссылки</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/admin/analytics">
                    <BarChart className="mr-2 h-4 w-4" />
                    Аналитика
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/admin/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Настройки системы
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/admin/notifications">
                    <Bell className="mr-2 h-4 w-4" />
                    Уведомления
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Графики и аналитика */}
      <Card>
        <CardHeader>
          <CardTitle>Аналитика</CardTitle>
          <CardDescription>
            Ключевые метрики за последний месяц
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="users">
            <TabsList>
              <TabsTrigger value="users">Пользователи</TabsTrigger>
              <TabsTrigger value="orders">Заказы</TabsTrigger>
              <TabsTrigger value="revenue">Доходы</TabsTrigger>
              <TabsTrigger value="reviews">Отзывы</TabsTrigger>
            </TabsList>
            
            <TabsContent value="users" className="space-y-4">
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <BarChart className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <div className="text-gray-600">График роста пользователей</div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="orders" className="space-y-4">
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <div className="text-gray-600">График заказов</div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}