'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star, ThumbsUp, ThumbsDown, X, Check } from 'lucide-react'
import { useReviews } from '@/hooks/useReviews'
import { useAuth } from '@/hooks/useAuth'
import { toast } from '@/components/ui/use-toast'

interface ReviewFormProps {
  projectId: string
  reviewedId: string
  type: 'freelancer' | 'client'
  onSuccess?: () => void
  onCancel?: () => void
  existingReview?: {
    id: string
    rating: number
    content: string
    strengths?: string[]
    weaknesses?: string[]
    wouldRecommend: boolean
  }
}

const strengthOptions = [
  'Качество работы',
  'Соблюдение сроков',
  'Коммуникация',
  'Профессионализм',
  'Креативность',
  'Внимание к деталям',
  'Технические навыки',
  'Гибкость',
  'Ответственность',
  'Решение проблем'
]

const weaknessOptions = [
  'Нарушение сроков',
  'Плохая коммуникация',
  'Низкое качество',
  'Неопытность',
  'Несоблюдение ТЗ',
  'Неадекватные ожидания',
  'Конфликтность',
  'Несоблюдение бюджета',
  'Нет обратной связи',
  'Слабые технические навыки'
]

export default function ReviewForm({
  projectId,
  reviewedId,
  type,
  onSuccess,
  onCancel,
  existingReview
}: ReviewFormProps) {
  const { createReview, updateReview, isLoading } = useReviews()
  const { isAuthenticated } = useAuth()
  
  const [rating, setRating] = useState(existingReview?.rating || 0)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState(existingReview?.content || '')
  const [strengths, setStrengths] = useState<string[]>(existingReview?.strengths || [])
  const [weaknesses, setWeaknesses] = useState<string[]>(existingReview?.weaknesses || [])
  const [wouldRecommend, setWouldRecommend] = useState(existingReview?.wouldRecommend ?? true)
  const [hoverRating, setHoverRating] = useState(0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isAuthenticated) {
      toast({
        title: 'Требуется авторизация',
        description: 'Войдите в систему, чтобы оставить отзыв',
        variant: 'destructive'
      })
      return
    }

    if (rating === 0) {
      toast({
        title: 'Оцените работу',
        description: 'Пожалуйста, поставьте оценку от 1 до 5 звезд',
        variant: 'destructive'
      })
      return
    }

    if (content.length < 10) {
      toast({
        title: 'Слишком короткий отзыв',
        description: 'Пожалуйста, напишите более подробный отзыв',
        variant: 'destructive'
      })
      return
    }

    try {
      const reviewData = {
        projectId,
        reviewedId,
        type,
        rating,
        title: title || undefined,
        content,
        strengths: strengths.length > 0 ? strengths : undefined,
        weaknesses: weaknesses.length > 0 ? weaknesses : undefined,
        wouldRecommend
      }

      if (existingReview) {
        await updateReview(existingReview.id, reviewData)
        toast({
          title: 'Отзыв обновлен',
          description: 'Ваш отзыв успешно обновлен',
        })
      } else {
        await createReview(reviewData)
        toast({
          title: 'Отзыв отправлен',
          description: 'Спасибо за ваш отзыв!',
        })
      }

      onSuccess?.()
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить отзыв',
        variant: 'destructive'
      })
    }
  }

  const toggleStrength = (strength: string) => {
    setStrengths(prev => 
      prev.includes(strength) 
        ? prev.filter(s => s !== strength)
        : [...prev, strength]
    )
  }

  const toggleWeakness = (weakness: string) => {
    setWeaknesses(prev => 
      prev.includes(weakness) 
        ? prev.filter(w => w !== weakness)
        : [...prev, weakness]
    )
  }

  const getRatingLabel = (rating: number) => {
    switch (rating) {
      case 1: return 'Ужасно'
      case 2: return 'Плохо'
      case 3: return 'Удовлетворительно'
      case 4: return 'Хорошо'
      case 5: return 'Отлично'
      default: return 'Оцените'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {existingReview ? 'Редактировать отзыв' : 'Оставить отзыв'}
        </CardTitle>
        <CardDescription>
          Поделитесь вашим опытом работы с {type === 'freelancer' ? 'фрилансером' : 'клиентом'}
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Рейтинг */}
          <div className="space-y-4">
            <div className="text-center mb-4">
              <div className="text-2xl font-bold mb-2">
                {getRatingLabel(rating)}
              </div>
              <div className="flex justify-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="p-1"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= (hoverRating || rating)
                          ? 'text-yellow-500 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Заголовок */}
          <div className="space-y-2">
            <Label htmlFor="title">Заголовок отзыва (необязательно)</Label>
            <Input
              id="title"
              placeholder="Кратко опишите ваше впечатление"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* Текст отзыва */}
          <div className="space-y-2">
            <Label htmlFor="content">
              Подробный отзыв *
              <span className="text-sm text-gray-500 ml-2">
                {content.length}/1000 символов
              </span>
            </Label>
            <Textarea
              id="content"
              placeholder="Опишите ваш опыт работы, что понравилось, что можно улучшить..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[120px]"
              maxLength={1000}
              required
            />
          </div>

          {/* Сильные стороны */}
          <div className="space-y-3">
            <Label>Сильные стороны (необязательно)</Label>
            <div className="flex flex-wrap gap-2">
              {strengthOptions.map((strength) => (
                <Badge
                  key={strength}
                  variant={strengths.includes(strength) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleStrength(strength)}
                >
                  {strengths.includes(strength) && (
                    <Check className="h-3 w-3 mr-1" />
                  )}
                  {strength}
                </Badge>
              ))}
            </div>
          </div>

          {/* Слабые стороны */}
          <div className="space-y-3">
            <Label>Что можно улучшить (необязательно)</Label>
            <div className="flex flex-wrap gap-2">
              {weaknessOptions.map((weakness) => (
                <Badge
                  key={weakness}
                  variant={weaknesses.includes(weakness) ? "destructive" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleWeakness(weakness)}
                >
                  {weaknesses.includes(weakness) && (
                    <X className="h-3 w-3 mr-1" />
                  )}
                  {weakness}
                </Badge>
              ))}
            </div>
          </div>

          {/* Рекомендация */}
          <div className="space-y-3">
            <Label>Вы бы порекомендовали этого {type === 'freelancer' ? 'фрилансера' : 'клиента'} другим?</Label>
            <div className="flex gap-4">
              <button
                type="button"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  wouldRecommend 
                    ? 'bg-green-100 text-green-800 border border-green-300' 
                    : 'border border-gray-300 hover:bg-gray-100'
                }`}
                onClick={() => setWouldRecommend(true)}
              >
                <ThumbsUp className="h-5 w-5" />
                <span>Да, рекомендую</span>
              </button>
              <button
                type="button"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  !wouldRecommend 
                    ? 'bg-red-100 text-red-800 border border-red-300' 
                    : 'border border-gray-300 hover:bg-gray-100'
                }`}
                onClick={() => setWouldRecommend(false)}
              >
                <ThumbsDown className="h-5 w-5" />
                <span>Не рекомендую</span>
              </button>
            </div>
          </div>

          {/* Подсказки */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">Советы для хорошего отзыва:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Опишите конкретные примеры работы</li>
              <li>• Укажите, что было сделано хорошо</li>
              <li>• Дайте конструктивные предложения по улучшению</li>
              <li>• Будьте объективны и честны</li>
              <li>• Избегайте эмоциональных выражений и личных оценок</li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between gap-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Отмена
            </Button>
          )}
          <Button
            type="submit"
            disabled={isLoading || rating === 0 || content.length < 10}
            className="flex-1"
          >
            {isLoading ? 'Отправка...' : existingReview ? 'Обновить отзыв' : 'Опубликовать отзыв'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}