'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Search,
  Filter,
  Plus,
  Clock,
  DollarSign,
  MapPin,
  User,
  Star,
  ArrowUpDown,
  Eye
} from 'lucide-react'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'

interface Order {
  id: string
  title: string
  description: string
  budget: number
  status: string
  deadline: string
  location_type: string
  location_city?: string
  skills: string[]
  created_at: string
  client: {
    user_metadata: {
      name: string
    }
  }
  category: {
    name: string
  }
  bids_count: number
  views_count: number
}

export default function OrdersPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    category: 'all',
    budgetMin: '',
    budgetMax: '',
    status: 'open',
    sortBy: 'newest'
  })

  useEffect(() => {
    fetchOrders()
  }, [filters])

  const fetchOrders = async () => {
    try {
      // Временные моковые данные
      // Позже заменим на реальный API
      const mockOrders: Order[] = [
        {
          id: '1',
          title: 'Разработка лендинга для стоматологии',
          description: 'Требуется создать современный лендинг для стоматологической клиники с онлайн-записью.',
          budget: 50000,
          status: 'open',
          deadline: '2024-02-15',
          location_type: 'remote',
          location_city: 'Москва',
          skills: ['HTML/CSS', 'JavaScript', 'React', 'UI/UX'],
          created_at: '2024-01-20T10:30:00Z',
          client: {
            user_metadata: {
              name: 'Анна Иванова'
            }
          },
          category: {
            name: 'Веб-разработка'
          },
          bids_count: 8,
          views_count: 156
        },
        {
          id: '2',
          title: 'Дизайн логотипа для стартапа',
          description: 'Нужен современный и запоминающийся логотип для IT-стартапа в сфере образования.',
          budget: 25000,
          status: 'open',
          deadline: '2024-02-10',
          location_type: 'remote',
          skills: ['Logo Design', 'Branding', 'Adobe Illustrator'],
          created_at: '2024-01-22T14:20:00Z',
          client: {
            user_metadata: {
              name: 'Петр Сидоров'
            }
          },
          category: {
            name: 'Дизайн'
          },
          bids_count: 12,
          views_count: 234
        },
        {
          id: '3',
          title: 'Копирайтинг для сайта турфирмы',
          description: 'Написание продающих текстов для главной страницы и категорий туристического сайта.',
          budget: 30000,
          status: 'in_progress',
          deadline: '2024-01-30',
          location_type: 'remote',
          skills: ['Копирайтинг', 'SEO', 'Маркетинг'],
          created_at: '2024-01-18T09:15:00Z',
          client: {
            user_metadata: {
              name: 'Мария Петрова'
            }
          },
          category: {
            name: 'Тексты и переводы'
          },
          bids_count: 5,
          views_count: 89
        },
        {
          id: '4',
          title: 'SEO оптимизация интернет-магазина',
          description: 'Комплексная SEO оптимизация существующего интернет-магазина детских товаров.',
          budget: 75000,
          status: 'open',
          deadline: '2024-03-01',
          location_type: 'hybrid',
          location_city: 'Санкт-Петербург',
          skills: ['SEO', 'Аналитика', 'Google Analytics'],
          created_at: '2024-01-25T16:45:00Z',
          client: {
            user_metadata: {
              name: 'Дмитрий Смирнов'
            }
          },
          category: {
            name: 'Маркетинг'
          },
          bids_count: 3,
          views_count: 112
        },
        {
          id: '5',
          title: 'Разработка мобильного приложения',
          description: 'Создание кроссплатформенного мобильного приложения для управления финансами.',
          budget: 150000,
          status: 'open',
          deadline: '2024-03-15',
          location_type: 'remote',
          skills: ['React Native', 'TypeScript', 'Firebase', 'UI/UX'],
          created_at: '2024-01-24T11:20:00Z',
          client: {
            user_metadata: {
              name: 'Ольга Кузнецова'
            }
          },
          category: {
            name: 'Мобильные приложения'
          },
          bids_count: 6,
          views_count: 198
        }
      ]

      // Фильтрация и сортировка (временная логика)
      let filteredOrders = [...mockOrders]

      // Фильтр по статусу
      if (filters.status !== 'all') {
        filteredOrders = filteredOrders.filter(order => order.status === filters.status)
      }

      // Фильтр по категории
      if (filters.category !== 'all') {
        filteredOrders = filteredOrders.filter(order => 
          order.category.name.toLowerCase().includes(filters.category.toLowerCase())
        )
      }

      // Фильтр по бюджету
      if (filters.budgetMin) {
        filteredOrders = filteredOrders.filter(order => 
          order.budget >= parseInt(filters.budgetMin)
        )
      }
      if (filters.budgetMax) {
        filteredOrders = filteredOrders.filter(order => 
          order.budget <= parseInt(filters.budgetMax)
        )
      }

      // Сортировка
      filteredOrders.sort((a, b) => {
        switch (filters.sortBy) {
          case 'newest':
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          case 'oldest':
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          case 'budget_high':
            return b.budget - a.budget
          case 'budget_low':
            return a.budget - b.budget
          default:
            return 0
        }
      })

      // Поиск
      if (searchQuery) {
        filteredOrders = filteredOrders.filter(order =>
          order.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      }

      setOrders(filteredOrders)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: string }> = {
      open: { label: 'Открыт', variant: 'default' },
      in_progress: { label: 'В работе', variant: 'secondary' },
      completed: { label: 'Завершен', variant: 'success' },
      cancelled: { label: 'Отменен', variant: 'destructive' },
      disputed: { label: 'Спор', variant: 'warning' }
    }
    
    return statusMap[status] || { label: status, variant: 'default' }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Сегодня'
    if (diffDays === 1) return 'Вчера'
    if (diffDays < 7) return `${diffDays} дня назад`
    
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short'
    })
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchOrders()
  }

  const categories = [
    'Все категории',
    'Веб-разработка',
    'Дизайн',
    'Маркетинг',
    'Тексты и переводы',
    'Видео и анимация',
    'Бизнес и консалтинг',
    'IT и программирование',
    'Мобильные приложения'
  ]

  return (
    <div className="space-y-6">
      {/* Заголовок и кнопка создания */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Поиск заказов</h1>
          <p className="text-gray-600 mt-2">
            Найдите подходящие проекты для работы или разместите свой заказ
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/orders/create" className="flex items-center">
            <Plus className="mr-2 h-4 w-4" />
            Разместить заказ
          </Link>
        </Button>
      </div>

      {/* Поиск и фильтры */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Строка поиска */}
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Поиск по названию, описанию или навыкам..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit">Найти</Button>
            </form>

            {/* Фильтры */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Категория</label>
                <Select
                  value={filters.category}
                  onValueChange={(value) => setFilters({ ...filters, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Все категории" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category === 'Все категории' ? 'all' : category.toLowerCase()}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Статус</label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters({ ...filters, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Статус" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все статусы</SelectItem>
                    <SelectItem value="open">Открытые</SelectItem>
                    <SelectItem value="in_progress">В работе</SelectItem>
                    <SelectItem value="completed">Завершенные</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Бюджет от</label>
                <Input
                  type="number"
                  placeholder="₽ 0"
                  value={filters.budgetMin}
                  onChange={(e) => setFilters({ ...filters, budgetMin: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Бюджет до</label>
                <Input
                  type="number"
                  placeholder="₽ 1000000"
                  value={filters.budgetMax}
                  onChange={(e) => setFilters({ ...filters, budgetMax: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Сортировка</label>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value) => setFilters({ ...filters, sortBy: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Сортировать" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Сначала новые</SelectItem>
                    <SelectItem value="oldest">Сначала старые</SelectItem>
                    <SelectItem value="budget_high">По убыванию цены</SelectItem>
                    <SelectItem value="budget_low">По возрастанию цены</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <Button variant="ghost" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Дополнительные фильтры
              </Button>
              <div className="text-sm text-gray-600">
                Найдено: <span className="font-medium">{orders.length} заказов</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Список заказов */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Search className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium mb-2">Заказы не найдены</h3>
          <p className="text-gray-600 mb-6">
            Попробуйте изменить параметры поиска или разместите свой заказ
          </p>
          <Button asChild>
            <Link href="/dashboard/orders/create">
              <Plus className="mr-2 h-4 w-4" />
              Разместить первый заказ
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusBadge = getStatusBadge(order.status)
            
            return (
              <Card 
                key={order.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/dashboard/orders/${order.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Основная информация */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={statusBadge.variant as any}>
                              {statusBadge.label}
                            </Badge>
                            <Badge variant="outline">
                              {order.category.name}
                            </Badge>
                          </div>
                          <h3 className="text-xl font-bold hover:text-blue-600 transition-colors">
                            {order.title}
                          </h3>
                        </div>
                        <div className="text-2xl font-bold text-blue-600">
                          {formatCurrency(order.budget)}
                        </div>
                      </div>

                      <p className="text-gray-600 line-clamp-2">
                        {order.description}
                      </p>

                      {/* Навыки */}
                      <div className="flex flex-wrap gap-2">
                        {order.skills.slice(0, 4).map((skill, index) => (
                          <Badge key={index} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                        {order.skills.length > 4 && (
                          <Badge variant="outline">
                            +{order.skills.length - 4} ещё
                          </Badge>
                        )}
                      </div>

                      {/* Мета-информация */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          {order.client.user_metadata.name}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {order.location_type === 'remote' ? 'Удаленно' : order.location_city}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {formatDate(order.created_at)}
                        </div>
                        <div className="flex items-center">
                          Срок: {new Date(order.deadline).toLocaleDateString('ru-RU')}
                        </div>
                      </div>
                    </div>

                    {/* Статистика и действия */}
                    <div className="lg:w-48 space-y-4">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-blue-50 p-3 rounded-lg text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {order.bids_count}
                          </div>
                          <div className="text-xs text-gray-600">заявок</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg text-center">
                          <div className="text-2xl font-bold text-gray-700">
                            {order.views_count}
                          </div>
                          <div className="text-xs text-gray-600">просмотров</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Button className="w-full" size="sm">
                          Подать заявку
                        </Button>
                        <Button variant="outline" className="w-full" size="sm">
                          <Eye className="mr-2 h-4 w-4" />
                          Подробнее
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Пагинация */}
      {orders.length > 0 && (
        <div className="flex justify-center">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" disabled>
              Назад
            </Button>
            <Button variant="outline" size="sm" className="bg-blue-50 text-blue-600">
              1
            </Button>
            <Button variant="outline" size="sm">
              2
            </Button>
            <Button variant="outline" size="sm">
              3
            </Button>
            <span className="px-2">...</span>
            <Button variant="outline" size="sm">
              10
            </Button>
            <Button variant="outline" size="sm">
              Вперед
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}