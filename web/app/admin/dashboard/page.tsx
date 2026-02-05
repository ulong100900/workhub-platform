'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  Briefcase,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  BarChart3,
  Shield,
  MessageSquare,
  FileText,
  Download,
  Filter,
  Search,
  RefreshCw,
} from 'lucide-react'
import { DataTable } from '@/components/admin/DataTable'
import { AdminStats } from '@/components/admin/AdminStats'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeProjects: 0,
    totalRevenue: 0,
    pendingModeration: 0,
    activeSessions: 0,
    growthRate: 0,
  })
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState('overview')

  const loadStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error loading admin stats:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
    // Обновляем статистику каждые 30 секунд
    const interval = setInterval(loadStats, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="p-6">
      {/* Заголовок и кнопки */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Административная панель
          </h1>
          <p className="text-gray-600">
            Управление платформой и мониторинг активности
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Экспорт отчетов
          </Button>
          <Button onClick={loadStats} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Обновить
          </Button>
        </div>
      </div>

      {/* Основные метрики */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Пользователи</p>
                <p className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</p>
                <p className="text-xs text-green-600">
                  +{stats.growthRate}% за месяц
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Активные проекты</p>
                <p className="text-2xl font-bold">{stats.activeProjects}</p>
                <p className="text-xs text-blue-600">+12 сегодня</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Briefcase className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Общая выручка</p>
                <p className="text-2xl font-bold">
                  {stats.totalRevenue.toLocaleString()} ₽
                </p>
                <p className="text-xs text-green-600">+8% за месяц</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">На модерации</p>
                <p className="text-2xl font-bold">{stats.pendingModeration}</p>
                <p className="text-xs text-red-600">Требуют внимания</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Активные сессии</p>
                <p className="text-2xl font-bold">{stats.activeSessions}</p>
                <p className="text-xs text-blue-600">Сейчас онлайн</p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Статус системы</p>
                <p className="text-2xl font-bold text-green-600">OK</p>
                <p className="text-xs text-green-600">Все системы работают</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Табы */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Обзор
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Пользователи
          </TabsTrigger>
          <TabsTrigger value="projects">
            <Briefcase className="h-4 w-4 mr-2" />
            Проекты
          </TabsTrigger>
          <TabsTrigger value="moderation">
            <Shield className="h-4 w-4 mr-2" />
            Модерация
          </TabsTrigger>
          <TabsTrigger value="support">
            <MessageSquare className="h-4 w-4 mr-2" />
            Поддержка
          </TabsTrigger>
          <TabsTrigger value="reports">
            <FileText className="h-4 w-4 mr-2" />
            Отчеты
          </TabsTrigger>
        </TabsList>

        {/* Обзор */}
        <TabsContent value="overview">
          <AdminStats />
        </TabsContent>

        {/* Пользователи */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Управление пользователями</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                endpoint="/api/admin/users"
                columns={[
                  { key: 'id', label: 'ID' },
                  { key: 'email', label: 'Email' },
                  { key: 'full_name', label: 'Имя' },
                  { key: 'role', label: 'Роль' },
                  { key: 'status', label: 'Статус' },
                  { key: 'created_at', label: 'Дата регистрации' },
                ]}
                actions={[
                  { label: 'Просмотреть', action: 'view' },
                  { label: 'Редактировать', action: 'edit' },
                  { label: 'Заблокировать', action: 'block' },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Проекты */}
        <TabsContent value="projects">
          <Card>
            <CardHeader>
              <CardTitle>Модерация проектов</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                endpoint="/api/admin/projects"
                columns={[
                  { key: 'title', label: 'Название' },
                  { key: 'user', label: 'Автор' },
                  { key: 'category', label: 'Категория' },
                  { key: 'budget', label: 'Бюджет' },
                  { key: 'status', label: 'Статус' },
                  { key: 'created_at', label: 'Дата создания' },
                ]}
                actions={[
                  { label: 'Просмотреть', action: 'view' },
                  { label: 'Одобрить', action: 'approve' },
                  { label: 'Отклонить', action: 'reject' },
                  { label: 'Редактировать', action: 'edit' },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Модерация */}
        <TabsContent value="moderation">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Жалобы */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  Жалобы
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">Жалоба на проект #{i}</div>
                        <Badge variant="destructive">Новая</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Нарушение правил платформы
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm">Просмотреть</Button>
                        <Button size="sm" variant="outline">Игнорировать</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Отзывы на модерации */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-yellow-600" />
                  Отзывы на проверке
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">Отзыв от пользователя</div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Одобрить
                          </Button>
                          <Button size="sm" variant="outline">
                            <XCircle className="h-3 w-3 mr-1" />
                            Отклонить
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Поддержка */}
        <TabsContent value="support">
          <Card>
            <CardHeader>
              <CardTitle>Тикеты поддержки</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                endpoint="/api/admin/support-tickets"
                columns={[
                  { key: 'id', label: 'Тикет' },
                  { key: 'user', label: 'Пользователь' },
                  { key: 'subject', label: 'Тема' },
                  { key: 'priority', label: 'Приоритет' },
                  { key: 'status', label: 'Статус' },
                  { key: 'created_at', label: 'Дата создания' },
                ]}
                actions={[
                  { label: 'Открыть', action: 'open' },
                  { label: 'Закрыть', action: 'close' },
                  { label: 'Принять', action: 'assign' },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Отчеты */}
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Финансовые отчеты</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold">245,000 ₽</div>
                        <div className="text-sm text-gray-600">Выручка за месяц</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold">24,500 ₽</div>
                        <div className="text-sm text-gray-600">Комиссия платформы</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold">89</div>
                        <div className="text-sm text-gray-600">Успешных сделок</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="flex gap-4">
                  <Button>
                    <Download className="h-4 w-4 mr-2" />
                    Скачать отчет за месяц
                  </Button>
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Фильтровать по дате
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}