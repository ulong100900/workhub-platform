'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  ThumbsUp, 
  AlertCircle,
  Percent,
  Clock,
  CheckCircle
} from 'lucide-react'

interface PaymentOptionsProps {
  orderAmount: number
  onPaymentOptionChange: (option: PaymentOption) => void
  defaultOption?: PaymentOption
}

export type PaymentOption = {
  type: 'prepayment' | 'postpayment' | 'installments'
  percentage?: number // Процент предоплаты (20, 30, 50, 100)
  installments?: number // Количество платежей
}

export default function PaymentOptions({ 
  orderAmount, 
  onPaymentOptionChange,
  defaultOption = { type: 'prepayment', percentage: 30 }
}: PaymentOptionsProps) {
  const [selectedOption, setSelectedOption] = useState<PaymentOption>(defaultOption)
  const [selectedPercentage, setSelectedPercentage] = useState<number>(defaultOption.percentage || 30)

  const paymentOptions = [
    {
      type: 'prepayment' as const,
      title: 'С предоплатой',
      description: 'Оплата части суммы заранее',
      icon: Shield,
      badge: 'Популярно',
      badgeColor: 'bg-blue-100 text-blue-800',
      percentages: [20, 30, 50, 100]
    },
    {
      type: 'postpayment' as const,
      title: 'Без предоплаты',
      description: 'Оплата после выполнения работы',
      icon: ThumbsUp,
      badge: 'Для доверия',
      badgeColor: 'bg-green-100 text-green-800'
    },
    {
      type: 'installments' as const,
      title: 'Рассрочка',
      description: 'Оплата частями',
      icon: Percent,
      badge: 'Гибко',
      badgeColor: 'bg-purple-100 text-purple-800',
      installments: [2, 3, 4]
    }
  ]

  const calculateAmounts = (option: PaymentOption) => {
    if (option.type === 'prepayment' && option.percentage) {
      const prepaymentAmount = (orderAmount * option.percentage) / 100
      const remainingAmount = orderAmount - prepaymentAmount
      return { prepaymentAmount, remainingAmount }
    }
    
    if (option.type === 'installments' && option.installments) {
      const installmentAmount = orderAmount / option.installments
      return { installmentAmount, installments: option.installments }
    }
    
    return {}
  }

  const handleOptionChange = (optionType: PaymentOption['type']) => {
    const newOption: PaymentOption = { type: optionType }
    
    if (optionType === 'prepayment') {
      newOption.percentage = selectedPercentage
    } else if (optionType === 'installments') {
      newOption.installments = 2
    }
    
    setSelectedOption(newOption)
    onPaymentOptionChange(newOption)
  }

  const handlePercentageChange = (percentage: number) => {
    setSelectedPercentage(percentage)
    const newOption = { type: 'prepayment' as const, percentage }
    setSelectedOption(newOption)
    onPaymentOptionChange(newOption)
  }

  const handleInstallmentsChange = (installments: number) => {
    const newOption = { type: 'installments' as const, installments }
    setSelectedOption(newOption)
    onPaymentOptionChange(newOption)
  }

  const currentAmounts = calculateAmounts(selectedOption)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Способ оплаты</CardTitle>
        <p className="text-sm text-gray-500">
          Выберите удобный для вас способ оплаты заказа
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Выбор типа оплаты */}
        <RadioGroup 
          value={selectedOption.type} 
          onValueChange={handleOptionChange}
          className="space-y-4"
        >
          {paymentOptions.map((option) => {
            const Icon = option.icon
            return (
              <div key={option.type} className="relative">
                <div className={`
                  flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-all
                  ${selectedOption.type === option.type ? 'border-primary bg-blue-50' : 'hover:bg-gray-50'}
                `}>
                  <RadioGroupItem 
                    value={option.type} 
                    id={option.type}
                    className="mt-1"
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={option.type} className="cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Icon className="h-5 w-5" />
                          <span className="font-medium">{option.title}</span>
                        </div>
                      </Label>
                      
                      {option.badge && (
                        <Badge className={option.badgeColor}>
                          {option.badge}
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mt-1">
                      {option.description}
                    </p>
                    
                    {/* Проценты для предоплаты */}
                    {option.type === 'prepayment' && selectedOption.type === 'prepayment' && (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm font-medium">Размер предоплаты:</p>
                        <div className="flex flex-wrap gap-2">
                          {option.percentages?.map((percent) => (
                            <button
                              key={percent}
                              type="button"
                              onClick={() => handlePercentageChange(percent)}
                              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                                selectedPercentage === percent
                                  ? 'bg-primary text-primary-foreground border-primary'
                                  : 'bg-white border-gray-300 hover:border-primary'
                              }`}
                            >
                              {percent}%
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Рассрочка */}
                    {option.type === 'installments' && selectedOption.type === 'installments' && (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm font-medium">Количество платежей:</p>
                        <div className="flex flex-wrap gap-2">
                          {option.installments?.map((count) => (
                            <button
                              key={count}
                              type="button"
                              onClick={() => handleInstallmentsChange(count)}
                              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                                selectedOption.installments === count
                                  ? 'bg-primary text-primary-foreground border-primary'
                                  : 'bg-white border-gray-300 hover:border-primary'
                              }`}
                            >
                              {count} платежа
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Дополнительная информация для выбранного варианта */}
                {selectedOption.type === option.type && option.type === 'prepayment' && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-800">Защита предоплаты</p>
                        <p className="text-blue-700">
                          Предоплата защищена платформой и будет передана исполнителю только после 
                          подтверждения начала работ
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {selectedOption.type === option.type && option.type === 'postpayment' && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <ThumbsUp className="h-4 w-4 text-green-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-green-800">Повышение доверия</p>
                        <p className="text-green-700">
                          Исполнители охотнее берут заказы без предоплаты — это показывает их уверенность в качестве работ
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </RadioGroup>

        {/* Сводка по выбранному варианту */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-3">Сводка по оплате</h4>
          
          <div className="space-y-3">
            {/* Общая сумма */}
            <div className="flex justify-between">
              <span className="text-gray-600">Стоимость заказа:</span>
              <span className="font-medium">{orderAmount.toLocaleString()} ₽</span>
            </div>
            
            {/* Для предоплаты */}
            {selectedOption.type === 'prepayment' && currentAmounts.prepaymentAmount && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600">Предоплата ({selectedPercentage}%):</span>
                  <span className="font-medium text-blue-600">
                    {currentAmounts.prepaymentAmount.toLocaleString()} ₽
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Остаток после выполнения:</span>
                  <span className="font-medium">
                    {currentAmounts.remainingAmount?.toLocaleString()} ₽
                  </span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>Предоплата будет заблокирована на платформе до начала работ</span>
                  </div>
                </div>
              </>
            )}
            
            {/* Для рассрочки */}
            {selectedOption.type === 'installments' && currentAmounts.installmentAmount && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600">Количество платежей:</span>
                  <span className="font-medium">{selectedOption.installments}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Сумма каждого платежа:</span>
                  <span className="font-medium text-purple-600">
                    {currentAmounts.installmentAmount.toLocaleString()} ₽
                  </span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>Платежи распределяются равномерно на весь срок выполнения работ</span>
                  </div>
                </div>
              </>
            )}
            
            {/* Для оплаты после */}
            {selectedOption.type === 'postpayment' && (
              <div className="pt-2 border-t">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Полная оплата после приемки и одобрения выполненных работ</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Информация о комиссии */}
        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-800">Внимание!</p>
              <p className="text-amber-700">
                Комиссия платформы ({selectedOption.type === 'postpayment' ? '15%' : '10%'}) 
                будет удержана из суммы заказа. 
                {selectedOption.type === 'postpayment' && ' При оплате без предоплаты комиссия выше.'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}