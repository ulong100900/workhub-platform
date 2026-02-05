'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Briefcase, 
  DollarSign, 
  MessageSquare, 
  Star, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  Users,
  Award,
  Target,
  Calendar,
  FileText,
  Bell
} from 'lucide-react'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'

interface FreelancerStats {
  activeBids: number
  acceptedBids: number
  totalEarnings: number
  avgRating: number
  responseTime: number
  completionRate: number
  activeOrders: number
}

interface RecentActivity {
  id: string
  type: string
  title: string
  description: string
  time: string
  status: string
}

export default function FreelancerDashboardPage() {
  const { user } = useAuth()
  const { stats: notificationStats } = useNotifications()
  const [stats, setStats] = useState<FreelancerStats | null>(null)
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [activeBids, setActiveBids] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Временные данные для демонстрации
    setTimeout(() => {
      setStats({
        activeBids: 5,
        acceptedBids: 12,
        totalEarnings: 325000,
        avgRating: 4.8,
        responseTime: 2, // часа
        completionRate: 95,
        activeOrders: 3
      })

      setRecentActivities([
        { id: '1', type: 'bid_accepted', title: 'Заявка принята', description: 'Заказ "Дизайн логотипа для стартапа"', time: '2 часа назад', status: 'success' },
        { id: '2', type: 'new_message', title: 'Новое сообщение', description: 'От клиента по проекту "Разработка сайта"', time: '5 часов назад', status: 'info' },
        { id: '3', type: 'order_completed', title: 'Проект завершен', description: 'Заказ "Копирайтинг для сайта" выполнен и оплачен', time: '1 день назад', status: 'success' },
        { id: '4', type: 'deadline_reminder', title: 'Напоминание о дедлайне', description: 'До сдачи проекта "SEO оптимизация" осталось 3 дня', time: '2 дня назад', status: 'warning' }
      ])

      setActiveBids([
        { id: '1', title: 'Разработка лендинга', price: 50000, status: 'pending', daysLeft: 3 },
        { id: '2', title: 'Дизайн интерфейса', price: 35000, status: 'pending', daysLeft: 5 },
        { id: '3', title: 'Настройка SEO', price: 25000, status: 'accepted', daysLeft: 7 }
      ])

      setIsLoading(false)
    }, 1000)
  }, [])

  const quickActions = [
    {
      title: 'Найти заказы',
      description: 'Просмотреть новые доступные проекты',
      icon: <Briefcase className="h-6 w-6 text-blue-500" />,
      href: '/dashboard/orders',
      color: 'bg-blue-50 hover:bg-blue-100'
    },
    {
      title: 'Мои заявки',
      description: 'Управление отправленными предложениями',
      icon: <FileText className="h-6 w-6 text-green-500" />,
      href: '/dashboard/freelancer/bids',
      color: 'bg-green-50 hover:bg-green-100'
    },
    {
      title: 'Активные проекты',
      description: 'Проекты в работе',
      icon: <Target className="h-6 w-6 text-purple-500" />,
      href: '/dashboard/freelancer/orders',
      color: 'bg-purple-50 hover:bg-purple-100'
    },
    {
      title: 'Сообщения',
      description: 'Общение с клиентами',
      icon: <MessageSquare className="h-6 w-6 text-orange-500" />,
      href: '/dashboard/messages',
      color: 'bg-orange-50 hover:bg-orange-100'
    }
  ]

  const achievementBadges = [
    { name: 'Первая работа', icon: '🎯', progress: 100, earned: true },
    { name: '10 проектов', icon: '🏆', progress: 80, earned: false },
    { name: 'Отличный рейтинг', icon: '⭐', progress: 90, earned: false },
    { name: 'Быстрый отклик', icon: '⚡', progress: 75, earned: false },
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
      {/* Приветствие */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            Добро пожаловать, {user?.user_metadata?.name || 'Фрилансер'}!
          </h1>
          <p className="text-gray-600 mt-2">
            Управляйте своими проектами и находите новые возможности
          </p>
        </div>
        <div className="flex items-center gap-2">
          {notificationStats.unread > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <Bell className="h-3 w-3" />
              {notificationStats.unread} новых
            </Badge>
          )}
          <Button asChild>
            <Link href="/dashboard/orders">
              <Briefcase className="mr-2 h-4 w-4" />
              Найти заказы
            </Link>
          </Button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Активные заявки</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeBids}</div>
            <div className="flex items-center text-xs text-gray-500 mt-1">
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              <span>+2 за неделю</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Общий заработок</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalEarnings.toLocaleString()} ₽
            </div>
            <div className="flex items-center text-xs text-gray-500 mt-1">
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              <span>+25% за месяц</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Рейтинг</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.avgRating}/5</div>
            <div className="flex items-center text-xs text-gray-500 mt-1">
              <Users className="mr-1 h-3 w-3 text-gray-500" />
              <span>на основе 18 отзывов</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Процент выполнения</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completionRate}%</div>
            <Progress value={stats?.completionRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Быстрые действия и активность */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Быстрые действия */}
          <Card>
            <CardHeader>
              <CardTitle>Быстрые действия</CardTitle>
              <CardDescription>
                Часто используемые функции для эффективной работы
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {quickActions.map((action, index) => (
                  <Link key={index} href={action.href}>
                    <Card className={`cursor-pointer transition-all hover:shadow-md ${action.color}`}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium mb-1">{action.title}</div>
                            <div className="text-sm text-gray-600">{action.description}</div>
                          </div>
                          {action.icon}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Активные заявки */}
          <Card>
            <CardHeader>
              <CardTitle>Активные заявки</CardTitle>
              <CardDescription>
                Ваши последние предложения клиентам
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeBids.map((bid) => (
                  <div key={bid.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                    <div>
                      <div className="font-medium">{bid.title}</div>
                      <div className="text-sm text-gray-600">
                        {bid.price.toLocaleString()} ₽ • {bid.daysLeft} дней до ответа
                      </div>
                    </div>
                    <Badge 
                      variant={bid.status === 'accepted' ? 'success' : 'secondary'}
                      className="capitalize"
                    >
                      {bid.status === 'accepted' ? 'Принята' : 'На рассмотрении'}
                    </Badge>
                  </div>
                ))}
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/dashboard/freelancer/bids">
                    Показать все заявки
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Правая колонка */}
        <div className="space-y-6">
          {/* Последняя активность */}
          <Card>
            <CardHeader>
              <CardTitle>Последняя активность</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      activity.status === 'success' ? 'bg-green-100 text-green-600' :
                      activity.status === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {activity.type === 'bid_accepted' && <CheckCircle className="h-4 w-4" />}
                      {activity.type === 'new_message' && <MessageSquare className="h-4 w-4" />}
                      {activity.type === 'order_completed' && <Award className="h-4 w-4" />}
                      {activity.type === 'deadline_reminder' && <Clock className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{activity.title}</div>
                      <div className="text-sm text-gray-600">{activity.description}</div>
                      <div className="text-xs text-gray-500 mt-1">{activity.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Достижения */}
          <Card>
            <CardHeader>
              <CardTitle>Достижения</CardTitle>
              <CardDescription>
                Прогресс по выполнению целей
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {achievementBadges.map((badge, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{badge.icon}</div>
                      <div>
                        <div className="font-medium">{badge.name}</div>
                        <Progress value={badge.progress} className="w-32 mt-1" />
                      </div>
                    </div>
                    {badge.earned ? (
                      <Badge variant="success">Получено</Badge>
                    ) : (
                      <span className="text-sm text-gray-500">{badge.progress}%</span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Советы */}
          <Card>
            <CardHeader>
              <CardTitle>Советы для роста</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Обновляйте портфолио новыми работами</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Быстро отвечайте на новые заказы</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Просите клиентов оставлять отзывы</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Следите за сроками выполнения</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Статистика по месяцам */}
      <Card>
        <CardHeader>
          <CardTitle>Статистика заработка</CardTitle>
          <CardDescription>
            Динамика ваших доходов по месяцам
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Январь 2024</div>
              <div className="text-sm font-medium">85,000 ₽</div>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 w-3/4"></div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Декабрь 2023</div>
              <div className="text-sm font-medium">75,000 ₽</div>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 w-2/3"></div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Ноябрь 2023</div>
              <div className="text-sm font-medium">65,000 ₽</div>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 w-1/2"></div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Октябрь 2023</div>
              <div className="text-sm font-medium">45,000 ₽</div>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 w-1/3"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}