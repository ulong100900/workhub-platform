'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { CreditCard, Smartphone, Monitor } from 'lucide-react'

interface PaymentProps {
  amount: number
  orderId?: string
  userId: string
  onSuccess?: () => void
}

export default function YooKassaPayment({ amount, orderId, userId, onSuccess }: PaymentProps) {
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')

  const handlePayment = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/payment/yookassa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          orderId,
          userId,
          description: `Оплата заказа ${orderId || 'сервиса'}`
        })
      })

      const data = await response.json()
      
      if (data.confirmation_url) {
        window.location.href = data.confirmation_url
      } else if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error('Payment error:', error)
      alert('Ошибка при создании платежа')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Оплата услуг</CardTitle>
        <CardDescription>
          Выберите удобный способ оплаты
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Сумма */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Сумма к оплате:</span>
            <span className="text-2xl font-bold">{amount.toLocaleString()} ₽</span>
          </div>
        </div>

        {/* Способ оплаты */}
        <div>
          <Label className="mb-3 block">Способ оплаты</Label>
          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-3 gap-4">
            <div>
              <RadioGroupItem value="card" id="card" className="peer sr-only" />
              <Label
                htmlFor="card"
                className="flex flex-col items-center justify-between rounded-md border-2 border-gray-200 bg-white p-4 hover:bg-gray-50 hover:text-gray-900 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <CreditCard className="mb-2 h-6 w-6" />
                <span>Карта</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="sbp" id="sbp" className="peer sr-only" />
              <Label
                htmlFor="sbp"
                className="flex flex-col items-center justify-between rounded-md border-2 border-gray-200 bg-white p-4 hover:bg-gray-50 hover:text-gray-900 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <Smartphone className="mb-2 h-6 w-6" />
                <span>СБП</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="yoomoney" id="yoomoney" className="peer sr-only" />
              <Label
                htmlFor="yoomoney"
                className="flex flex-col items-center justify-between rounded-md border-2 border-gray-200 bg-white p-4 hover:bg-gray-50 hover:text-gray-900 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <Monitor className="mb-2 h-6 w-6" />
                <span>ЮMoney</span>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Email для чека */}
        <div>
          <Label htmlFor="email">Email для чека</Label>
          <Input
            id="email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1"
          />
          <p className="text-sm text-gray-500 mt-1">
            На этот email будет отправлен электронный чек
          </p>
        </div>

        {/* Кнопка оплаты */}
        <Button
          onClick={handlePayment}
          disabled={loading || !email}
          className="w-full py-6 text-lg"
        >
          {loading ? 'Обработка...' : `Оплатить ${amount.toLocaleString()} ₽`}
        </Button>

        <div className="text-center text-sm text-gray-500">
          Нажимая «Оплатить», вы соглашаетесь с условиями оферты
        </div>
      </CardContent>
    </Card>
  )
}