'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { 
  Search,
  Filter,
  FileText,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  MessageSquare,
  Eye
} from 'lucide-react'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'

interface Bid {
  id: string
  price: number
  delivery_days: number
  status: string
  created_at: string
  order: {
    id: string
    title: string
    budget: number
    deadline: string
    client: {
      user_metadata: {
        name: string
      }
    }
  }
}

export default function FreelancerBidsPage() {
  const { user } = useAuth()
  const [bids, setBids] = useState<Bid[]>([])
  const [filteredBids, setFilteredBids] = useState<Bid[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    // Временные моковые данные
    setTimeout(() => {
      const mockBids: Bid[] = [
        {
          id: '1',
          price: 50000,
          delivery_days: 14,
          status: 'pending',
          created_at: '2024-01-20T10:30:00Z',
          order: {
            id: '1',
            title: 'Разработка лендинга для стоматологии',
            budget: 50000,
            deadline: '2024-02-15',
            client: {
              user_metadata: {
                name: 'Анна Иванова'
              }
            }
          }
        },
        {
          id: '2',
          price: 35000,
          delivery_days: 10,
          status: 'accepted',
          created_at: '2024-01-18T14:20:00Z',
          order: {
            id: '2',
            title: 'Дизайн логотипа для стартапа',
            budget: 25000,
            deadline: '2024-02-10',
            client: {
              user_metadata: {
                name: 'Петр Сидоров'
              }
            }
          }
        },
        {
          id: '3',
          price: 25000,
          delivery_days: 7,
          status: 'rejected',
          created_at: '2024-01-15T09:15:00Z',
          order: {
            id: '3',
            title: 'Копирайтинг для сайта турфирмы',
            budget: 30000,
            deadline: '2024-01-30',
            client: {
              user_metadata: {
                name: 'Мария Петрова'
              }
            }
          }
        },
        {
          id: '4',
          price: 70000,
          delivery_days: 21,
          status: 'pending',
          created_at: '2024-01-22T16:45:00Z',
          order: {
            id: '4',
            title: 'SEO оптимизация интернет-магазина',
            budget: 75000,
            deadline: '2024-03-01',
            client: {
              user_metadata: {
                name: 'Дмитрий Смирнов'
              }
            }
          }
        },
        {
          id: '5',
          price: 120000,
          delivery_days: 30,
          status: 'accepted',
          created_at: '2024-01-19T11:20:00Z',
          order: {
            id: '5',
            title: 'Разработка мобильного приложения',
            budget: 150000,
            deadline: '2024-03-15',
            client: {
              user_metadata: {
                name: 'Ольга Кузнецова'
              }
            }
          }
        }
      ]

      setBids(mockBids)
      setFilteredBids(mockBids)
      setIsLoading(false)
    }, 1000)
  }, [])

  useEffect(() => {
    let result = [...bids]

    // Фильтр по статусу
    if (activeTab !== 'all') {
      result = result.filter(bid => bid.status === activeTab)
    }

    // Поиск
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(bid =>
        bid.order.title.toLowerCase().includes(query) ||
        bid.order.client.user_metadata.name.toLowerCase().includes(query)
      )
    }

    setFilteredBids(result)
  }, [activeTab, searchQuery, bids])

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: string; icon: any }> = {
      pending: { label: 'На рассмотрении', variant: 'secondary', icon: Clock },
      accepted: { label: 'Принята', variant: 'success', icon: CheckCircle },
      rejected: { label: 'Отклонена', variant: 'destructive', icon: XCircle },
      withdrawn: { label: 'Отозвана', variant: 'outline', icon: Eye }
    }
    
    const statusInfo = statusMap[status] || { label: status, variant: 'default', icon: Clock }
    const Icon = statusInfo.icon
    
    return (
      <Badge variant={statusInfo.variant as any} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {statusInfo.label}
      </Badge>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short'
    })
  }

  const getStatusCount = (status: string) => {
    return bids.filter(bid => status === 'all' ? true : bid.status === status).length
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
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
          <h1 className="text-3xl font-bold">Мои заявки</h1>
          <p className="text-gray-600 mt-2">
            Управление вашими предложениями клиентам
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/orders">
            <FileText className="mr-2 h-4 w-4" />
            Найти новые заказы
          </Link>
        </Button>
      </div>

      {/* Фильтры */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Поиск по названию заказа или клиенту..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Фильтры
              </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full">
                <TabsTrigger value="all" className="flex-1">
                  Все ({getStatusCount('all')})
                </TabsTrigger>
                <TabsTrigger value="pending" className="flex-1">
                  На рассмотрении ({getStatusCount('pending')})
                </TabsTrigger>
                <TabsTrigger value="accepted" className="flex-1">
                  Принятые ({getStatusCount('accepted')})
                </TabsTrigger>
                <TabsTrigger value="rejected" className="flex-1">
                  Отклоненные ({getStatusCount('rejected')})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{bids.length}</div>
              <div className="text-sm text-gray-600">Всего заявок</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{getStatusCount('pending')}</div>
              <div className="text-sm text-gray-600">На рассмотрении</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{getStatusCount('accepted')}</div>
              <div className="text-sm text-gray-600">Принятые</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {formatCurrency(bids.reduce((sum, bid) => sum + bid.price, 0))}
              </div>
              <div className="text-sm text-gray-600">Общая сумма</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Список заявок */}
      {filteredBids.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FileText className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">Заявки не найдены</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery 
                ? 'Попробуйте изменить параметры поиска'
                : activeTab !== 'all'
                ? `У вас нет заявок со статусом "${activeTab}"`
                : 'У вас пока нет отправленных заявок'}
            </p>
            <Button asChild>
              <Link href="/dashboard/orders">
                Найти заказы для работы
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredBids.map((bid) => (
            <Card key={bid.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Информация о заявке */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="mb-2">{getStatusBadge(bid.status)}</div>
                        <h3 className="text-xl font-bold hover:text-blue-600 transition-colors">
                          {bid.order.title}
                        </h3>
                      </div>
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(bid.price)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-2" />
                        Бюджет заказа: {formatCurrency(bid.order.budget)}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        Срок: {bid.delivery_days} дней
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        Дедлайн: {formatDate(bid.order.deadline)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="text-sm text-gray-600">
                        Клиент: {bid.order.client.user_metadata.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        Отправлена: {formatDate(bid.created_at)}
                      </div>
                    </div>
                  </div>

                  {/* Действия */}
                  <div className="lg:w-48 space-y-3">
                    <div className="space-y-2">
                      <Button className="w-full" size="sm" asChild>
                        <Link href={`/dashboard/bids/${bid.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          Подробнее
                        </Link>
                      </Button>
                      
                      {bid.status === 'pending' && (
                        <Button variant="outline" className="w-full" size="sm">
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Написать клиенту
                        </Button>
                      )}

                      {bid.status === 'accepted' && (
                        <Button variant="outline" className="w-full" size="sm" asChild>
                          <Link href={`/dashboard/orders/${bid.order.id}`}>
                            Перейти к проекту
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Статистика по заявкам */}
      <Card>
        <CardHeader>
          <CardTitle>Статистика по заявкам</CardTitle>
          <CardDescription>
            Анализ эффективности ваших предложений
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Процент принятых заявок</div>
              <div className="text-sm font-medium">
                {bids.length > 0 
                  ? Math.round((getStatusCount('accepted') / bids.length) * 100) 
                  : 0}%
              </div>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500" 
                style={{ 
                  width: `${bids.length > 0 
                    ? Math.round((getStatusCount('accepted') / bids.length) * 100) 
                    : 0}%` 
                }}
              ></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Средняя цена заявки</div>
                <div className="text-lg font-bold">
                  {formatCurrency(
                    bids.length > 0 
                      ? bids.reduce((sum, bid) => sum + bid.price, 0) / bids.length 
                      : 0
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Средний срок выполнения</div>
                <div className="text-lg font-bold">
                  {bids.length > 0 
                    ? Math.round(bids.reduce((sum, bid) => sum + bid.delivery_days, 0) / bids.length) 
                    : 0} дней
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}