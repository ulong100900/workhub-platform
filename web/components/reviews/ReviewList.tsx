'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Star, Filter, MessageSquare, TrendingUp, Clock } from 'lucide-react'
import { Review } from '@/types/review.types'
import ReviewCard from './ReviewCard'
import { useReviews } from '@/hooks/useReviews'

interface ReviewListProps {
  reviews: Review[]
  isLoading?: boolean
  showFilter?: boolean
  onReviewAction?: (action: 'edit' | 'delete' | 'reply', reviewId: string) => void
}

export default function ReviewList({ 
  reviews, 
  isLoading = false,
  showFilter = true,
  onReviewAction 
}: ReviewListProps) {
  const [sortBy, setSortBy] = useState('recent')
  const [filterRating, setFilterRating] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')

  const sortedReviews = [...reviews].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'rating-high':
        return b.rating - a.rating
      case 'rating-low':
        return a.rating - b.rating
      case 'helpful':
        // Здесь нужно добавить поле helpfulCount в тип Review
        return 0
      default:
        return 0
    }
  })

  const filteredReviews = sortedReviews.filter(review => {
    if (filterRating !== 'all' && review.rating !== parseInt(filterRating)) {
      return false
    }
    if (filterType !== 'all' && filterType !== review.type) {
      return false
    }
    return true
  })

  const ratingCounts = {
    5: reviews.filter(r => r.rating === 5).length,
    4: reviews.filter(r => r.rating === 4).length,
    3: reviews.filter(r => r.rating === 3).length,
    2: reviews.filter(r => r.rating === 2).length,
    1: reviews.filter(r => r.rating === 1).length,
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse">
            <div className="h-48 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Отзывов пока нет</h3>
        <p className="text-gray-600">
          Будьте первым, кто оставит отзыв
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Фильтры и сортировка */}
      {showFilter && (
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex flex-wrap gap-4">
            {/* Фильтр по рейтингу */}
            <div className="space-y-2">
              <div className="text-sm font-medium flex items-center gap-2">
                <Star className="h-4 w-4" />
                Рейтинг
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterRating === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterRating('all')}
                >
                  Все
                </Button>
                {[5, 4, 3, 2, 1].map(rating => (
                  <Button
                    key={rating}
                    variant={filterRating === rating.toString() ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterRating(rating.toString())}
                    className="gap-1"
                  >
                    <Star className="h-3 w-3" />
                    {rating}
                    <span className="text-gray-500 text-xs">({ratingCounts[rating as keyof typeof ratingCounts]})</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Фильтр по типу */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Тип отзыва</div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Все типы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все отзывы</SelectItem>
                  <SelectItem value="freelancer">О фрилансерах</SelectItem>
                  <SelectItem value="client">О клиентах</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Сортировка */}
          <div className="space-y-2">
            <div className="text-sm font-medium flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Сортировка
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Сортировать по" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Сначала новые
                  </div>
                </SelectItem>
                <SelectItem value="rating-high">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Высокий рейтинг
                  </div>
                </SelectItem>
                <SelectItem value="rating-low">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Низкий рейтинг
                  </div>
                </SelectItem>
                <SelectItem value="helpful">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Самые полезные
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Вкладки */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">Все отзывы ({filteredReviews.length})</TabsTrigger>
          <TabsTrigger value="positive">
            Положительные ({reviews.filter(r => r.rating >= 4).length})
          </TabsTrigger>
          <TabsTrigger value="negative">
            Критические ({reviews.filter(r => r.rating <= 2).length})
          </TabsTrigger>
          <TabsTrigger value="verified">
            Проверенные ({reviews.filter(r => r.isVerified).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6 mt-6">
          {filteredReviews.map(review => (
            <ReviewCard
              key={review.id}
              review={review}
              onEdit={() => onReviewAction?.('edit', review.id)}
              onDelete={() => onReviewAction?.('delete', review.id)}
            />
          ))}
        </TabsContent>

        <TabsContent value="positive" className="space-y-6 mt-6">
          {filteredReviews
            .filter(review => review.rating >= 4)
            .map(review => (
              <ReviewCard key={review.id} review={review} />
            ))}
        </TabsContent>

        <TabsContent value="negative" className="space-y-6 mt-6">
          {filteredReviews
            .filter(review => review.rating <= 2)
            .map(review => (
              <ReviewCard key={review.id} review={review} />
            ))}
        </TabsContent>

        <TabsContent value="verified" className="space-y-6 mt-6">
          {filteredReviews
            .filter(review => review.isVerified)
            .map(review => (
              <ReviewCard key={review.id} review={review} />
            ))}
        </TabsContent>
      </Tabs>

      {/* Пагинация */}
      {filteredReviews.length > 10 && (
        <div className="flex justify-center">
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              ← Назад
            </Button>
            <Button variant="outline" size="sm">
              1
            </Button>
            <Button variant="outline" size="sm">
              2
            </Button>
            <Button variant="outline" size="sm">
              3
            </Button>
            <Button variant="outline" size="sm">
              Вперед →
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}