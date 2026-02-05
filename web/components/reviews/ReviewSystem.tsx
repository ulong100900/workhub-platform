'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Star, 
  MessageSquare, 
  CheckCircle, 
  Clock, 
  ThumbsUp,
  AlertTriangle
} from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

interface Review {
  id: string
  rating: number
  comment: string
  reply?: string
  reply_created_at?: string
  is_verified: boolean
  created_at: string
  reviewer: {
    id: string
    full_name: string
    avatar_url?: string
  }
  criteria_scores?: {
    quality: number
    deadline: number
    communication: number
    price: number
  }
}

interface ReviewSystemProps {
  userId: string
  userType: 'client' | 'freelancer'
  onReviewSubmit?: (review: Omit<Review, 'id' | 'created_at' | 'reviewer'>) => void
  onReplySubmit?: (reviewId: string, reply: string) => void
}

const criteriaLabels = {
  quality: 'Качество работы',
  deadline: 'Соблюдение сроков',
  communication: 'Коммуникация',
  price: 'Соотношение цены и качества'
}

export default function ReviewSystem({ 
  userId, 
  userType,
  onReviewSubmit,
  onReplySubmit 
}: ReviewSystemProps) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [criteriaScores, setCriteriaScores] = useState({
    quality: 5,
    deadline: 5,
    communication: 5,
    price: 5
  })
  const [replyText, setReplyText] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [reviews, setReviews] = useState<Review[]>([])
  const [showReviewForm, setShowReviewForm] = useState(false)

  // Загрузка отзывов
  const loadReviews = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/reviews`)
      if (response.ok) {
        const data = await response.json()
        setReviews(data.reviews || [])
      }
    } catch (error) {
      console.error('Error loading reviews:', error)
    }
  }

  // Отправка отзыва
  const handleSubmitReview = async () => {
    if (!comment.trim() || rating < 1) return
    
    setSubmitting(true)
    try {
      const reviewData = {
        rating,
        comment: comment.trim(),
        criteria_scores: criteriaScores,
        reviewee_id: userId
      }

      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData)
      })

      if (response.ok) {
        const newReview = await response.json()
        setReviews(prev => [newReview, ...prev])
        setComment('')
        setRating(5)
        setCriteriaScores({
          quality: 5,
          deadline: 5,
          communication: 5,
          price: 5
        })
        setShowReviewForm(false)
        
        onReviewSubmit?.(reviewData)
      }
    } catch (error) {
      console.error('Error submitting review:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Отправка ответа на отзыв
  const handleSubmitReply = async (reviewId: string) => {
    const reply = replyText[reviewId]?.trim()
    if (!reply) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/reviews/${reviewId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply })
      })

      if (response.ok) {
        const updatedReview = await response.json()
        setReviews(prev => prev.map(r => 
          r.id === reviewId ? updatedReview : r
        ))
        setReplyText(prev => ({ ...prev, [reviewId]: '' }))
        
        onReplySubmit?.(reviewId, reply)
      }
    } catch (error) {
      console.error('Error submitting reply:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Расчет среднего рейтинга
  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0

  const verifiedReviews = reviews.filter(r => r.is_verified)

  return (
    <div className="space-y-6">
      {/* Статистика отзывов */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {averageRating.toFixed(1)}
              </div>
              <div className="flex justify-center mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(averageRating)
                        ? 'text-yellow-500 fill-yellow-500'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-gray-600 text-sm">
                {reviews.length} отзывов
              </p>
            </div>

            <div className="md:col-span-2">
              <h4 className="font-semibold mb-3">Детальные оценки</h4>
              <div className="space-y-3">
                {Object.entries(criteriaLabels).map(([key, label]) => {
                  const avgScore = reviews.length > 0
                    ? reviews.reduce((sum, r) => 
                        sum + (r.criteria_scores?.[key as keyof typeof criteriaScores] || 0), 0
                      ) / reviews.length
                    : 0
                  
                  return (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{label}</span>
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < Math.floor(avgScore)
                                  ? 'text-yellow-500 fill-yellow-500'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="font-medium text-sm w-8">
                          {avgScore.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Форма отзыва */}
      {!showReviewForm ? (
        <Button onClick={() => setShowReviewForm(true)} className="w-full">
          <MessageSquare className="h-4 w-4 mr-2" />
          Оставить отзыв
        </Button>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Оставить отзыв</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Общий рейтинг */}
            <div className="space-y-3">
              <label className="font-medium">Общая оценка</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`p-2 rounded-full transition-colors ${
                      rating >= star
                        ? 'bg-yellow-100 text-yellow-600'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    <Star className="h-6 w-6" />
                  </button>
                ))}
              </div>
            </div>

            {/* Детальные оценки */}
            <div className="space-y-4">
              <label className="font-medium">Детальные оценки</label>
              {Object.entries(criteriaLabels).map(([key, label]) => (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">{label}</span>
                    <span className="text-sm font-medium">
                      {criteriaScores[key as keyof typeof criteriaScores]}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={score}
                        type="button"
                        onClick={() => setCriteriaScores(prev => ({
                          ...prev,
                          [key]: score
                        }))}
                        className={`flex-1 py-2 rounded-lg text-center text-sm transition-colors ${
                          criteriaScores[key as keyof typeof criteriaScores] === score
                            ? 'bg-blue-100 text-blue-700 font-medium'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Комментарий */}
            <div className="space-y-2">
              <label className="font-medium">Комментарий</label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Расскажите о своем опыте работы..."
                rows={4}
              />
              <p className="text-sm text-gray-500">
                Отзыв будет опубликован после верификации
              </p>
            </div>

            {/* Кнопки */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowReviewForm(false)}
                className="flex-1"
              >
                Отмена
              </Button>
              <Button
                onClick={handleSubmitReview}
                disabled={submitting || !comment.trim()}
                className="flex-1"
              >
                {submitting ? 'Отправка...' : 'Отправить отзыв'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Список отзывов */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          Отзывы ({verifiedReviews.length})
        </h3>
        
        {verifiedReviews.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Пока нет отзывов</p>
            </CardContent>
          </Card>
        ) : (
          verifiedReviews.map((review) => (
            <Card key={review.id} className="overflow-hidden">
              <CardContent className="p-6">
                {/* Заголовок отзыва */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {review.reviewer.avatar_url ? (
                      <img
                        src={review.reviewer.avatar_url}
                        alt={review.reviewer.full_name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="font-medium text-blue-600">
                          {review.reviewer.full_name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="font-medium">
                        {review.reviewer.full_name}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${
                                i < review.rating
                                  ? 'text-yellow-500 fill-yellow-500'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span>•</span>
                        <span>{format(new Date(review.created_at), 'dd MMMM yyyy', { locale: ru })}</span>
                        {review.is_verified && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-3 w-3" />
                              Верифицирован
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Детальные оценки */}
                {review.criteria_scores && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(review.criteria_scores).map(([key, score]) => (
                        <div key={key} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">
                            {criteriaLabels[key as keyof typeof criteriaLabels]}
                          </span>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < score
                                    ? 'text-yellow-500 fill-yellow-500'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Комментарий */}
                <div className="mb-4">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {review.comment}
                  </p>
                </div>

                {/* Ответ на отзыв */}
                {review.reply ? (
                  <div className="ml-4 pl-4 border-l-2 border-blue-200">
                    <div className="mb-2 flex items-center gap-2 text-sm text-gray-600">
                      <ThumbsUp className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">Ответ исполнителя</span>
                      {review.reply_created_at && (
                        <span className="text-gray-500">
                          {format(new Date(review.reply_created_at), 'dd MMMM yyyy', { locale: ru })}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {review.reply}
                    </p>
                  </div>
                ) : userType === 'freelancer' && (
                  // Форма ответа для фрилансера
                  <div className="mt-4 pt-4 border-t">
                    <Textarea
                      value={replyText[review.id] || ''}
                      onChange={(e) => setReplyText(prev => ({
                        ...prev,
                        [review.id]: e.target.value
                      }))}
                      placeholder="Ответить на отзыв..."
                      rows={2}
                      className="mb-2"
                    />
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        onClick={() => handleSubmitReply(review.id)}
                        disabled={!replyText[review.id]?.trim() || submitting}
                      >
                        Ответить
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}