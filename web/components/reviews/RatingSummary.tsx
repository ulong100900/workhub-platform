'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Star, TrendingUp, Users, CheckCircle, Award } from 'lucide-react'
import { RatingSummary as RatingSummaryType } from '@/types/review.types'

interface RatingSummaryProps {
  summary: RatingSummaryType
  type: 'freelancer' | 'client'
}

export default function RatingSummary({ summary, type }: RatingSummaryProps) {
  const totalRatings = Object.values(summary.ratingDistribution).reduce((a, b) => a + b, 0)
  
  const getRatingPercentage = (rating: number) => {
    return totalRatings > 0 ? (summary.ratingDistribution[rating as keyof typeof summary.ratingDistribution] / totalRatings) * 100 : 0
  }

  const getStarRating = (count: number) => {
    const stars = []
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`h-4 w-4 ${i < count ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
        />
      )
    }
    return stars
  }

  const getRatingLabel = (average: number) => {
    if (average >= 4.5) return { label: 'Превосходно', color: 'text-green-600', bg: 'bg-green-100' }
    if (average >= 4.0) return { label: 'Отлично', color: 'text-green-600', bg: 'bg-green-100' }
    if (average >= 3.5) return { label: 'Хорошо', color: 'text-yellow-600', bg: 'bg-yellow-100' }
    if (average >= 3.0) return { label: 'Удовлетворительно', color: 'text-yellow-600', bg: 'bg-yellow-100' }
    if (average >= 2.0) return { label: 'Плохо', color: 'text-orange-600', bg: 'bg-orange-100' }
    return { label: 'Ужасно', color: 'text-red-600', bg: 'bg-red-100' }
  }

  const ratingLabel = getRatingLabel(summary.averageRating)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          Рейтинг и отзывы
        </CardTitle>
        <CardDescription>
          Общая оценка на основе {summary.totalReviews} отзывов
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Основной рейтинг */}
        <div className="flex items-center justify-between">
          <div className="text-center">
            <div className="text-5xl font-bold mb-1">{summary.averageRating.toFixed(1)}</div>
            <div className="flex justify-center mb-2">
              {getStarRating(Math.round(summary.averageRating))}
            </div>
            <Badge variant="outline" className={`${ratingLabel.bg} ${ratingLabel.color} border-transparent`}>
              {ratingLabel.label}
            </Badge>
          </div>
          
          <div className="space-y-4">
            {/* Распределение рейтингов */}
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-16">
                  <span className="text-sm w-4">{rating}</span>
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                </div>
                <Progress 
                  value={getRatingPercentage(rating)} 
                  className="flex-1 h-2"
                />
                <span className="text-sm text-gray-600 w-10">
                  {summary.ratingDistribution[rating as keyof typeof summary.ratingDistribution]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Users className="h-4 w-4 text-blue-600" />
              <div className="text-2xl font-bold">{summary.totalReviews}</div>
            </div>
            <div className="text-sm text-gray-600">Всего отзывов</div>
          </div>
          
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div className="text-2xl font-bold">{summary.wouldRecommendRate}%</div>
            </div>
            <div className="text-sm text-gray-600">Рекомендуют</div>
          </div>
          
          {summary.categoryRatings && Object.entries(summary.categoryRatings).slice(0, 2).map(([category, rating]) => (
            <div key={category} className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Award className="h-4 w-4 text-purple-600" />
                <div className="text-2xl font-bold">{rating.toFixed(1)}</div>
              </div>
              <div className="text-sm text-gray-600 capitalize">
                {category.replace('-', ' ')}
              </div>
            </div>
          ))}
        </div>

        {/* Сильные стороны */}
        {Object.keys(summary.strengths).length > 0 && (
          <div>
            <div className="font-medium mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Сильные стороны
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(summary.strengths)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([strength, count]) => (
                  <Badge key={strength} variant="outline" className="bg-green-50 text-green-700">
                    {strength} ({count})
                  </Badge>
                ))}
            </div>
          </div>
        )}

        {/* Что можно улучшить */}
        {Object.keys(summary.weaknesses).length > 0 && (
          <div>
            <div className="font-medium mb-2 text-red-700">Что можно улучшить</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(summary.weaknesses)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([weakness, count]) => (
                  <Badge key={weakness} variant="outline" className="bg-red-50 text-red-700">
                    {weakness} ({count})
                  </Badge>
                ))}
            </div>
          </div>
        )}

        {/* Дополнительная информация */}
        <div className="text-sm text-gray-600 border-t pt-4">
          <p className="mb-2">
            <span className="font-medium">Как рассчитывается рейтинг:</span>
          </p>
          <ul className="space-y-1">
            <li>• Средний рейтинг рассчитывается на основе всех полученных оценок</li>
            <li>• Рейтинг обновляется в реальном времени</li>
            <li>• Проверенные отзывы имеют больший вес</li>
            <li>• Отзывы от постоянных клиентов учитываются отдельно</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}