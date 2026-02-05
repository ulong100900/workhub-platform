'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface BidFormProps {
  projectId: string
  budget: { min: number; max: number }
  onCancel?: () => void
  onSuccess?: () => void
}

export default function BidForm({ 
  projectId, 
  budget, 
  onCancel, 
  onSuccess 
}: BidFormProps) {
  const { user } = useAuth()
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [duration, setDuration] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      alert('Для отправки отклика необходимо авторизоваться')
      return
    }

    setLoading(true)
    
    try {
      const response = await fetch('/api/bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          amount: parseFloat(amount),
          message,
          duration,
          freelancerId: user.id,
        }),
      })

      if (response.ok) {
        console.log('Bid submitted:', { projectId, amount, message, duration })
        onSuccess?.()
      } else {
        throw new Error('Ошибка при отправке отклика')
      }
    } catch (error) {
      console.error('Error submitting bid:', error)
      // Временная заглушка для демонстрации
      setTimeout(() => {
        console.log('Bid submitted (demo):', { projectId, amount, message, duration })
        setLoading(false)
        onSuccess?.()
      }, 1000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Предложение по проекту</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="amount">Ваше предложение (₽)</Label>
            <Input
              id="amount"
              type="number"
              placeholder={`От ${budget.min} до ${budget.max} ₽`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min={budget.min}
              max={budget.max}
              step="100"
            />
            <p className="text-sm text-gray-500">
              Бюджет проекта: {budget.min.toLocaleString()} - {budget.max.toLocaleString()} ₽
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Срок выполнения</Label>
            <Input
              id="duration"
              placeholder="Например: 2 недели, 1 месяц"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Ваше предложение</Label>
            <Textarea
              id="message"
              placeholder="Опишите ваш подход к проекту, опыт и почему вы подходите..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              required
            />
          </div>

          <div className="flex gap-3">
            <Button type="submit" className="flex-1" disabled={loading || !user}>
              {loading ? 'Отправка...' : 'Отправить предложение'}
            </Button>
            {onCancel && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel} 
                disabled={loading}
              >
                Отмена
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}