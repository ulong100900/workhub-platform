'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  CheckCircle, 
  Star, 
  DollarSign, 
  Loader2,
  AlertCircle
} from 'lucide-react'

interface CompleteProjectFormProps {
  projectId: string
  projectTitle: string
  initialBudget: number
  freelancerName: string
  onSuccess?: () => void
  onCancel?: () => void
}

export default function CompleteProjectForm({
  projectId,
  projectTitle,
  initialBudget,
  freelancerName,
  onSuccess,
  onCancel
}: CompleteProjectFormProps) {
  const [rating, setRating] = useState<number>(5)
  const [review, setReview] = useState('')
  const [finalAmount, setFinalAmount] = useState(initialBudget.toString())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!rating || rating < 1 || rating > 5) {
      setError('Поставьте оценку от 1 до 5')
      return
    }

    if (finalAmount && parseFloat(finalAmount) <= 0) {
      setError('Укажите корректную итоговую сумму')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/projects/${projectId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          review: review.trim(),
          finalAmount: finalAmount ? parseFloat(finalAmount) : null
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Ошибка при завершении проекта')
      }

      // Показываем успешное сообщение
      alert('Проект успешно завершен! Исполнитель получил уведомление.')
      
      if (onSuccess) {
        onSuccess()
      }
      
    } catch (error: any) {
      console.error('Error completing project:', error)
      setError(error.message || 'Ошибка при завершении проекта')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-6 w-6 text-green-600" />
          Завершение проекта
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-blue-800">Информация о проекте</p>
              <p className="text-sm text-blue-600 mt-1">
                <strong>Проект:</strong> {projectTitle}<br />
                <strong>Исполнитель:</strong> {freelancerName}<br />
                <strong>Исходный бюджет:</strong> {initialBudget} ₽
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Оценка */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              Оцените работу исполнителя
            </Label>
            
            <div className="flex items-center gap-2">
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
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
              <span className="ml-2 text-lg font-semibold">{rating}.0</span>
            </div>
          </div>

          {/* Итоговая сумма */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              Итоговая сумма (₽)
            </Label>
            <Input
              type="number"
              placeholder="Оставьте пустым, если сумма не изменилась"
              value={finalAmount}
              onChange={(e) => setFinalAmount(e.target.value)}
              min="0"
              step="100"
            />
            <p className="text-sm text-gray-500">
              Укажите фактическую сумму, если она отличается от исходного бюджета
            </p>
          </div>

          {/* Отзыв */}
          <div className="space-y-2">
            <Label>Отзыв об исполнителе</Label>
            <Textarea
              placeholder="Расскажите о качестве работы, сроках, коммуникации..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={4}
            />
            <p className="text-sm text-gray-500">
              Ваш отзыв поможет другим заказчикам выбрать надежного исполнителя
            </p>
          </div>

          {/* Кнопки */}
          <div className="flex gap-3 pt-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1"
                disabled={isSubmitting}
              >
                Отмена
              </Button>
            )}
            
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Завершаем...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Завершить проект
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}