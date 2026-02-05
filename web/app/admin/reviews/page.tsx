'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Eye,
  Star,
  User,
  Calendar,
  Flag,
  AlertCircle,
  MoreVertical
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Review {
  id: string
  reviewer: {
    name: string
    avatar?: string
    rating: number
  }
  reviewedUser: {
    name: string
    type: 'freelancer' | 'client'
  }
  order: {
    title: string
    price: number
  }
  rating: number
  title?: string
  comment: string
  status: 'pending' | 'approved' | 'rejected' | 'reported'
  flags: number
  createdAt: string
  isVerified: boolean
  reportReason?: string
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilters, setSelectedFilters] = useState({
    rating: 'all',
    dateRange: 'all',
    verified: 'all'
  })

  useEffect(() => {
    // Временные моковые данные
    setTimeout(() => {
      const mockReviews: Review[] = [
        {
          id: '1',
          reviewer: {
            name: 'Анна Иванова',
            rating: 4.8
          },
          reviewedUser: {
            name: 'Иван Петров',
            type: 'freelancer'
          },
          order: {
            title: 'Разработка лендинга',
            price: 50000
          },
          rating: 5,
          title: 'Отличная работа!',
          comment: 'Иван выполнил работу качественно и в срок...',
          status: 'pending',
          flags: 0,
          createdAt: '2024-01-22T10:30:00Z',
          isVerified: true
        },
        {
          id: '2',
          reviewer: {
            name: 'Петр Сидоров',
            rating: 4.5
          },
          reviewedUser: {
            name: 'Мария Петрова',
            type: 'freelancer'
          },
          order: {
            title: 'Дизайн логотипа',
            price: 25000
          },
          rating: 1,
          title: 'Ужасный исполнитель',
          comment: 'Работа выполнена плохо, не соблюдены сроки...',
          status: 'reported',
          flags: 3,
          createdAt: '2024-01-21T14:20:00Z',
          isVerified: true,
          reportReason: 'Оскорбительный отзыв'
        },
        {
          id: '3',
          reviewer: {
            name: 'Дмитрий Смирнов',
            rating: 4.2
          },
          reviewedUser: {
            name: 'Ольга Кузнецова',
            type: 'client'
          },
          order: {
            title: 'SEO оптимизация',
            price: 75000
          },
          rating: 4,
          comment: 'Нормальный клиент, но были задержки с оплатой...',
          status: 'pending',
          flags: 0,
          createdAt: '2024-01-20T16:45:00Z',
          isVerified: false
        },
        {
          id: '4',
          reviewer: {
            name: 'Мария Петрова',
            rating: 4.9
          },
          reviewedUser: {
            name: 'Анна Иванова',
            type: 'client'
          },
          order: {
            title: 'Копирайтинг',
            price: 30000
          },
          rating: 5,
          title: 'Прекрасный клиент',
          comment: 'Приятно работать, четкое ТЗ, быстрая оплата...',
          status: 'approved',
          flags: 0,
          createdAt: '2024-01-19T09:15:00Z',
          isVerified: true
        },
        {
          id: '5',
          reviewer: {
            name: 'Ольга Кузнецова',
            rating: 4.7
          },
          reviewedUser: {
            name: 'Дмитрий Смирнов',
            type: 'freelancer'
          },
          order: {
            title: 'Мобильное приложение',
            price: 150000
          },
          rating: 2,
          title: 'Разочарован',
          comment: 'Много обещали, но результат слабый...',
          status: 'rejected',
          flags: 2,
          createdAt: '2024-01-18T11:20:00Z',
          isVerified: true,
          reportReason: 'Ложная информация'
        }
      ]

      setReviews(mockReviews)
      setFilteredReviews(mockReviews.filter(r => r.status === 'pending'))
      setIsLoading(false)
    }, 1000)
  }, [])

  useEffect(() => {
    let result = [...reviews]

    // Фильтр по статусу
    if (activeTab !== 'all') {
      result = result.filter(review => review.status === activeTab)
    }

    // Фильтр по рейтингу
    if (selectedFilters.rating !== 'all') {
      const rating = parseInt(selectedFilters.rating)
      result = result.filter(review => review.rating === rating)
    }

    // Фильтр по подтверждению
    if (selectedFilters.verified !== 'all') {
      const isVerified = selectedFilters.verified === 'verified'
      result = result.filter(review => review.isVerified === isVerified)
    }

    // Поиск
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(review =>
        review.reviewer.name.toLowerCase().includes(query) ||
        review.reviewedUser.name.toLowerCase().includes(query) ||
        review.order.title.toLowerCase().includes(query) ||
        (review.title && review.title.toLowerCase().includes(query))
      )
    }

    // Фильтр по дате
    if (selectedFilters.dateRange !== 'all') {
      const now = new Date()
      const dateRange = selectedFilters.dateRange
      
      result = result.filter(review => {
        const reviewDate = new Date(review.createdAt)
        
        if (dateRange === 'today') {
          return reviewDate.toDateString() === now.toDateString()
        } else if (dateRange === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          return reviewDate >= weekAgo
        } else if (dateRange === 'month') {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          return reviewDate >= monthAgo
        }
        
        return true
      })
    }

    setFilteredReviews(result)
  }, [activeTab, selectedFilters, searchQuery, reviews])

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: string; icon: any }> = {
      pending: { label: 'На модерации', variant: 'secondary', icon: Eye },
      approved: { label: 'Одобрено', variant: 'success', icon: CheckCircle },
      rejected: { label: 'Отклонено', variant: 'destructive', icon: XCircle },
      reported: { label: 'Жалоба', variant: 'warning', icon: Flag }
    }
    
    const statusInfo = statusMap[status] || { label: status, variant: 'default', icon: Eye }
    const Icon = statusInfo.icon
    
    return (
      <Badge variant={statusInfo.variant as any} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {statusInfo.label}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  const handleApprove = (reviewId: string) => {
    setReviews(prev => prev.map(review => 
      review.id === reviewId 
        ? { ...review, status: 'approved' }
        : review
    ))
  }

  const handleReject = (reviewId: string, reason?: string) => {
    setReviews(prev => prev.map(review => 
      review.id === reviewId 
        ? { ...review, status: 'rejected' }
        : review
    ))
  }

  const handleViewDetails = (reviewId: string) => {
    console.log('View details:', reviewId)
  }

  const stats = {
    pending: reviews.filter(r => r.status === 'pending').length,
    reported: reviews.filter(r => r.status === 'reported').length,
    total: reviews.length,
    lowRating: reviews.filter(r => r.rating <= 2).length
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Модерация отзывов</h1>
          <p className="text-gray-600 mt-2">
            Проверка и управление отзывами пользователей
          </p>
        </div>
        <Button>
          <Filter className="mr-2 h-4 w-4" />
          Экспорт отзывов
        </Button>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.pending}</div>
              <div className="text-sm text-gray-600">На модерации</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.reported}</div>
              <div className="text-sm text-gray-600">Жалобы</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-gray-600">Всего отзывов</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.lowRating}</div>
              <div className="text-sm text-gray-600">Низкий рейтинг</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Фильтры и поиск */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Поиск по имени пользователя, названию заказа..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Расширенные фильтры
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList>
                    <TabsTrigger value="all">Все ({reviews.length})</TabsTrigger>
                    <TabsTrigger value="pending">На модерации ({stats.pending})</TabsTrigger>
                    <TabsTrigger value="reported">Жалобы ({stats.reported})</TabsTrigger>
                    <TabsTrigger value="approved">Одобренные</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="flex gap-4">
                <Select 
                  value={selectedFilters.rating} 
                  onValueChange={(value) => setSelectedFilters(prev => ({ ...prev, rating: value }))}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Все оценки" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все оценки</SelectItem>
                    <SelectItem value="5">⭐⭐⭐⭐⭐</SelectItem>
                    <SelectItem value="4">⭐⭐⭐⭐</SelectItem>
                    <SelectItem value="3">⭐⭐⭐</SelectItem>
                    <SelectItem value="2">⭐⭐</SelectItem>
                    <SelectItem value="1">⭐</SelectItem>
                  </SelectContent>
                </Select>

                <Select 
                  value={selectedFilters.dateRange} 
                  onValueChange={(value) => setSelectedFilters(prev => ({ ...prev, dateRange: value }))}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="За все время" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">За все время</SelectItem>
                    <SelectItem value="today">Сегодня</SelectItem>
                    <SelectItem value="week">За неделю</SelectItem>
                    <SelectItem value="month">За месяц</SelectItem>
                  </SelectContent>
                </Select>

                <Select 
                  value={selectedFilters.verified} 
                  onValueChange={(value) => setSelectedFilters(prev => ({ ...prev, verified: value }))}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Все отзывы" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все отзывы</SelectItem>
                    <SelectItem value="verified">Подтвержденные</SelectItem>
                    <SelectItem value="unverified">Неподтвержденные</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Список отзывов */}
      {filteredReviews.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">Все отзывы обработаны</h3>
            <p className="text-gray-600 mb-6">
              На данный момент нет отзывов, требующих модерации
            </p>
            <Button onClick={() => {
              setActiveTab('all')
              setSearchQuery('')
              setSelectedFilters({ rating: 'all', dateRange: 'all', verified: 'all' })
            }}>
              Показать все отзывы
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <Card key={review.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Информация об отзыве */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusBadge(review.status)}
                          {review.isVerified && (
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              ✓ Подтвержден
                            </Badge>
                          )}
                          {review.flags > 0 && (
                            <Badge variant="outline" className="bg-red-50 text-red-700">
                              <Flag className="h-3 w-3 mr-1" />
                              {review.flags} жалоб
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 mb-1">
                          {renderStars(review.rating)}
                          {review.title && (
                            <span className="font-bold text-lg">{review.title}</span>
                          )}
                        </div>
                        
                        <p className="text-gray-700 line-clamp-2">
                          {review.comment}
                        </p>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(review.id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Подробнее
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleApprove(review.id)}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Одобрить
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleReject(review.id, 'Нарушение правил')}
                            className="text-red-600"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Отклонить
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Информация о заказе */}
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium text-gray-900">{review.order.title}</div>
                      <div className="flex items-center justify-between text-sm text-gray-600 mt-1">
                        <span>{formatCurrency(review.order.price)}</span>
                        <span>{formatDate(review.createdAt)}</span>
                      </div>
                    </div>

                    {/* Информация о пользователях */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600 mb-1">Автор отзыва:</div>
                        <div className="font-medium flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {review.reviewer.name}
                        </div>
                        <div className="text-gray-600 mt-1">
                          Рейтинг: {review.reviewer.rating}/5
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-gray-600 mb-1">Объект отзыва:</div>
                        <div className="font-medium">
                          {review.reviewedUser.name}
                          <Badge variant="outline" className="ml-2">
                            {review.reviewedUser.type === 'freelancer' ? 'Исполнитель' : 'Клиент'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Причина жалобы */}
                    {review.reportReason && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <div className="font-medium text-red-800">Причина жалобы:</div>
                        </div>
                        <div className="text-sm text-red-700">{review.reportReason}</div>
                      </div>
                    )}
                  </div>

                  {/* Действия */}
                  <div className="lg:w-64 space-y-3">
                    <div className="space-y-2">
                      <Button 
                        className="w-full"
                        onClick={() => handleApprove(review.id)}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Одобрить
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => handleReject(review.id, 'Нарушение правил')}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Отклонить
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        className="w-full"
                        onClick={() => handleViewDetails(review.id)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Подробнее
                      </Button>
                    </div>

                    {/* Быстрые действия */}
                    <div className="pt-4 border-t">
                      <div className="text-sm font-medium mb-2">Быстрые действия:</div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm">
                          Скрыть
                        </Button>
                        <Button variant="outline" size="sm">
                          Редактировать
                        </Button>
                        <Button variant="outline" size="sm">
                          Заблокировать автора
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Статистика модерации */}
      <Card>
        <CardHeader>
          <CardTitle>Статистика модерации</CardTitle>
          <CardDescription>
            Эффективность работы модераторов
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="text-sm font-medium">Среднее время обработки</div>
              <div className="text-2xl font-bold">2.4 часа</div>
              <div className="text-sm text-gray-600">За последнюю неделю</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Одобрено отзывов</div>
              <div className="text-2xl font-bold">84%</div>
              <div className="text-sm text-gray-600">От общего числа</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Модераторов онлайн</div>
              <div className="text-2xl font-bold">3</div>
              <div className="text-sm text-gray-600">Из 5 доступных</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}