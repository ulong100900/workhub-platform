'use client'

import { useState } from 'react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Star, 
  ThumbsUp, 
  Flag, 
  MessageSquare, 
  CheckCircle,
  Calendar,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { Review } from '@/types/review.types'
import { useAuth } from '@/hooks/useAuth'
import { useReviews } from '@/hooks/useReviews'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import { toast } from '@/components/ui/use-toast'

interface ReviewCardProps {
  review: Review
  showReplyForm?: boolean
  onReply?: (reply: string) => Promise<void>
  onEdit?: () => void
  onDelete?: () => void
}

export default function ReviewCard({ 
  review, 
  showReplyForm = false,
  onReply,
  onEdit,
  onDelete 
}: ReviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showReportForm, setShowReportForm] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [isMarkingHelpful, setIsMarkingHelpful] = useState(false)
  
  const { user } = useAuth()
  const { markReviewAsHelpful, reportReview, isLoading } = useReviews()
  
  const isOwner = user?.id === review.reviewerId
  const formattedDate = formatDistanceToNow(new Date(review.createdAt), { 
    addSuffix: true,
    locale: ru 
  })

  const handleMarkHelpful = async () => {
    if (!user) {
      toast({
        title: 'Требуется авторизация',
        description: 'Войдите в систему, чтобы отметить отзыв как полезный',
        variant: 'destructive'
      })
      return
    }

    setIsMarkingHelpful(true)
    try {
      await markReviewAsHelpful(review.id)
      toast({
        title: 'Спасибо за вашу оценку!',
        description: 'Вы отметили этот отзыв как полезный',
      })
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось отметить отзыв',
        variant: 'destructive'
      })
    } finally {
      setIsMarkingHelpful(false)
    }
  }

  const handleReport = async () => {
    if (!user) {
      toast({
        title: 'Требуется авторизация',
        description: 'Войдите в систему, чтобы пожаловаться на отзыв',
        variant: 'destructive'
      })
      return
    }

    if (!reportReason.trim()) {
      toast({
        title: 'Укажите причину',
        description: 'Пожалуйста, укажите причину жалобы',
        variant: 'destructive'
      })
      return
    }

    try {
      await reportReview(review.id, reportReason)
      toast({
        title: 'Жалоба отправлена',
        description: 'Спасибо за ваше сообщение. Мы рассмотрим этот отзыв.',
      })
      setShowReportForm(false)
      setReportReason('')
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить жалобу',
        variant: 'destructive'
      })
    }
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating 
                ? 'text-yellow-500 fill-current' 
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-6">
        {/* Заголовок */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={review.reviewer?.avatar} />
              <AvatarFallback>
                {review.reviewer?.name?.split(' ').map(n => n[0]).join('') || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-bold">{review.reviewer?.name || 'Анонимный пользователь'}</div>
              <div className="text-sm text-gray-600">
                {review.project?.title || 'Проект'}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center gap-2 mb-1">
              {renderStars(review.rating)}
              <span className="font-bold">{review.rating}.0</span>
            </div>
            <div className="text-sm text-gray-500 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formattedDate}
            </div>
          </div>
        </div>

        {/* Заголовок отзыва */}
        {review.title && (
          <h4 className="font-bold text-lg mb-2">{review.title}</h4>
        )}

        {/* Текст отзыва */}
        <div className="mb-4">
          <p className={`text-gray-700 ${!isExpanded && 'line-clamp-3'}`}>
            {review.content}
          </p>
          {review.content.length > 200 && (
            <Button
              variant="link"
              className="p-0 h-auto"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Свернуть
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Читать полностью
                </>
              )}
            </Button>
          )}
        </div>

        {/* Сильные и слабые стороны */}
        <div className="space-y-3 mb-4">
          {review.strengths && review.strengths.length > 0 && (
            <div>
              <div className="text-sm font-medium text-green-700 mb-1">Сильные стороны:</div>
              <div className="flex flex-wrap gap-1">
                {review.strengths.map((strength) => (
                  <Badge key={strength} variant="outline" className="bg-green-50 text-green-700">
                    {strength}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {review.weaknesses && review.weaknesses.length > 0 && (
            <div>
              <div className="text-sm font-medium text-red-700 mb-1">Что можно улучшить:</div>
              <div className="flex flex-wrap gap-1">
                {review.weaknesses.map((weakness) => (
                  <Badge key={weakness} variant="outline" className="bg-red-50 text-red-700">
                    {weakness}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Рекомендация */}
        <div className="mb-4">
          <Badge variant={review.wouldRecommend ? "default" : "destructive"} className="gap-1">
            {review.wouldRecommend ? (
              <>
                <ThumbsUp className="h-3 w-3" />
                Рекомендует
              </>
            ) : (
              <>
                <ThumbsUp className="h-3 w-3" />
                Не рекомендует
              </>
            )}
          </Badge>
        </div>

        {/* Проверенный отзыв */}
        {review.isVerified && (
          <div className="flex items-center gap-2 text-sm text-green-600 mb-4">
            <CheckCircle className="h-4 w-4" />
            <span>Проверенный отзыв (проект успешно завершен)</span>
          </div>
        )}

        {/* Форма жалобы */}
        {showReportForm && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="font-medium text-red-800 mb-2">Пожаловаться на отзыв</div>
            <textarea
              className="w-full p-2 border rounded mb-2 text-sm"
              placeholder="Опишите причину жалобы..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2">
              <Button size="sm" variant="destructive" onClick={handleReport}>
                Отправить жалобу
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowReportForm(false)}>
                Отмена
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="border-t pt-4 px-6 flex justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkHelpful}
            disabled={isMarkingHelpful || isLoading}
          >
            <ThumbsUp className="h-4 w-4 mr-1" />
            Полезно
          </Button>
          
          {!isOwner && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReportForm(!showReportForm)}
            >
              <Flag className="h-4 w-4 mr-1" />
              Пожаловаться
            </Button>
          )}
        </div>

        {/* Действия владельца */}
        {isOwner && (
          <div className="flex gap-2">
            {onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                Редактировать
              </Button>
            )}
            {onDelete && (
              <Button variant="destructive" size="sm" onClick={onDelete}>
                Удалить
              </Button>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  )
}