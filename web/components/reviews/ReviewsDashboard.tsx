'use client'

import { useState, useEffect } from 'react'
import { ReviewService, Review, ExecutorRating, ReviewStats } from '@/lib/reviews'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { 
  Star, 
  Filter, 
  Search, 
  Download, 
  MessageSquare,
  TrendingUp,
  Users,
  Clock
} from 'lucide-react'
import ReviewCard from './ReviewCard'
import RatingSummary from './RatingSummary'

export default function ReviewsDashboard() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [rating, setRating] = useState<ExecutorRating | null>(null)
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [sortBy, setSortBy] = useState<'recent' | 'rating'>('recent')
  const [filterRating, setFilterRating] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const loadData = async () => {
    setIsLoading(true)
    try {
      // Здесь будет реальный executorId из контекста/сессии
      const executorId = 'executor-id'
      
      // Загружаем рейтинг
      const ratingData = await ReviewService.getExecutorRating(executorId)
      setRating(ratingData)
      
      // Загружаем статистику
      const statsData = await ReviewService.getReviewStats(executorId)
      setStats(statsData)
      
      // Загружаем отзывы
      const { reviews: reviewsData, total } = await ReviewService.getExecutorReviews(
        executorId,
        page,
        10,
        sortBy
      )
      
      // Фильтрация по рейтингу
      let filteredReviews = reviewsData
      if (filterRating !== 'all') {
        const ratingValue = parseInt(filterRating)
        filteredReviews = reviewsData.filter(review => review.rating === ratingValue)
      }
      
      // Поиск по тексту
      if (searchQuery) {
        filteredReviews = filteredReviews.filter(review =>
          review.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (review.customerName?.toLowerCase() || '').includes(searchQuery.toLowerCase())
        )
      }
      
      setReviews(filteredReviews)
      setTotalPages(Math.ceil(total / 10))
    } catch (error) {
      console.error('Error loading reviews:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [page, sortBy, filterRating, searchQuery])

  const handleReply = async (reviewId: string, reply: string) => {
    try {
      const executorId = 'executor-id'
      await ReviewService.replyToReview(reviewId, executorId, reply)
      loadData() // Перезагружаем данные
    } catch (error) {
      console.error('Error replying to review:', error)
      throw error
    }
  }

  const handleHelpful = async (reviewId: string) => {
    try {
      const userId = 'user-id' // Из контекста/сессии
      await ReviewService.markHelpful(reviewId, userId)
    } catch (error) {
      console.error('Error marking review as helpful:', error)
      throw error
    }
  }

  const handleExport = () => {
    // Логика экспорта отзывов
    console.log('Exporting reviews...')
  }

  return (
    <div className="space-y-6">
      {/* Заголовок и статистика */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Отзывы и рейтинги</h1>
          <p className="text-gray-500 mt-2">
            Управляйте своей репутацией и общайтесь с клиентами
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Экспорт
          </Button>
        </div>
      </div>

      {/* Статистика в карточках */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Средний рейтинг</p>
                <p className="text-2xl font-bold mt-2">
                  {rating?.averageRating.toFixed(1) || '0.0'}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Star className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Всего отзывов</p>
                <p className="text-2xl font-bold mt-2">
                  {rating?.totalReviews || 0}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Процент ответов</p>
                <p className="text-2xl font-bold mt-2">
                  {stats?.responseRate || 0}%
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Новые (30 дн.)</p>
                <p className="text-2xl font-bold mt-2">
                  {stats?.recentReviews.length || 0}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Основной контент */}
        <div className="lg:col-span-2 space-y-6">
          {/* Фильтры и поиск */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Поиск по отзывам..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Select value={filterRating} onValueChange={setFilterRating}>
                    <SelectTrigger className="w-[140px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Рейтинг" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все оценки</SelectItem>
                      <SelectItem value="5">5 звезд</SelectItem>
                      <SelectItem value="4">4 звезды</SelectItem>
                      <SelectItem value="3">3 звезды</SelectItem>
                      <SelectItem value="2">2 звезды</SelectItem>
                      <SelectItem value="1">1 звезда</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={sortBy} onValueChange={(value: 'recent' | 'rating') => setSortBy(value)}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Сортировка" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Сначала новые</SelectItem>
                      <SelectItem value="rating">По рейтингу</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Табы для разных типов отзывов */}
          <Tabs defaultValue="all">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">Все отзывы</TabsTrigger>
              <TabsTrigger value="with-photos">С фото ({reviews.filter(r => r.photos?.length).length})</TabsTrigger>
              <TabsTrigger value="unanswered">Без ответа ({reviews.filter(r => !r.executorReply).length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i}>
                      <CardContent className="p-6">
                        <div className="animate-pulse space-y-3">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : reviews.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">Отзывов пока нет</h3>
                    <p className="text-gray-500 mt-2">
                      Когда клиенты оставят отзывы, они появятся здесь
                    </p>
                  </CardContent>
                </Card>
              ) : (
                reviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    showReplyForm
                    onReply={handleReply}
                    onHelpful={handleHelpful}
                  />
                ))
              )}
            </TabsContent>
          </Tabs>

          {/* Пагинация */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Назад
              </Button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (page <= 3) {
                  pageNum = i + 1
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = page - 2 + i
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                )
              })}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Вперед
              </Button>
            </div>
          )}
        </div>

        {/* Боковая панель */}
        <div className="space-y-6">
          {/* Сводка по рейтингу */}
          {rating && <RatingSummary rating={rating} />}
          
          {/* Лучшие категории */}
          {stats && stats.topCategories.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ваши сильные стороны</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.topCategories.map((category, index) => (
                    <div key={category.name} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">{category.name}</span>
                        <span className="text-lg font-bold text-green-600">
                          {category.rating.toFixed(1)}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500"
                          style={{ width: `${category.rating * 20}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Среднее: {(stats.averageRating / 5 * 100).toFixed(0)}%</span>
                        <span>Ваш результат: {(category.rating / 5 * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Советы по улучшению рейтинга */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Как улучшить рейтинг</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="h-3 w-3 text-blue-600" />
                </div>
                <p className="text-sm text-gray-600">
                  Отвечайте на все отзывы, даже критические
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-3 w-3 text-green-600" />
                </div>
                <p className="text-sm text-gray-600">
                  Всегда приходите вовремя, пунктуальность ценится
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Users className="h-3 w-3 text-purple-600" />
                </div>
                <p className="text-sm text-gray-600">
                  Просите довольных клиентов оставлять отзывы
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <Star className="h-3 w-3 text-orange-600" />
                </div>
                <p className="text-sm text-gray-600">
                  Делайте фотоотчеты — это повышает доверие
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}