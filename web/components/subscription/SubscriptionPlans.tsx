'use client'

import { useState, useEffect } from 'react'
import { SubscriptionService, SubscriptionPlan } from '@/lib/subscription'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle, 
  XCircle, 
  Star, 
  Zap,
  Shield,
  TrendingUp,
  Users,
  Clock
} from 'lucide-react'

interface SubscriptionPlansProps {
  onSelectPlan: (planId: string) => void
  currentPlanId?: string
  isLoading?: boolean
}

export default function SubscriptionPlans({ 
  onSelectPlan, 
  currentPlanId,
  isLoading = false 
}: SubscriptionPlansProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<string>()

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      const plansData = await SubscriptionService.getPlans()
      setPlans(plansData)
      
      // Выбираем популярный план по умолчанию
      const popularPlan = plansData.find(p => p.isPopular)
      if (popularPlan) {
        setSelectedPlanId(popularPlan.id)
      }
    } catch (error) {
      console.error('Error loading plans:', error)
    }
  }

  const formatPrice = (price: number, currency: string, period: string) => {
    const formatted = new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(price)
    
    const periodText = {
      'month': 'месяц',
      'quarter': '3 месяца',
      'year': 'год'
    }[period]
    
    return `${formformed} / ${periodText}`
  }

  const getPlanIcon = (planName: string) => {
    if (planName.includes('Старт') || planName.includes('Start')) {
      return <Zap className="h-6 w-6 text-blue-500" />
    } else if (planName.includes('Про') || planName.includes('Pro')) {
      return <TrendingUp className="h-6 w-6 text-purple-500" />
    } else if (planName.includes('Бизнес') || planName.includes('Business')) {
      return <Shield className="h-6 w-6 text-green-500" />
    }
    return <Star className="h-6 w-6 text-gray-500" />
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((j) => (
                  <div key={j} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {plans.map((plan) => (
        <Card 
          key={plan.id}
          className={`relative transition-all duration-200 hover:shadow-lg ${
            plan.isPopular ? 'border-2 border-primary' : ''
          } ${
            currentPlanId === plan.id ? 'ring-2 ring-primary' : ''
          }`}
        >
          {plan.isPopular && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="px-3 py-1">
                Популярный
              </Badge>
            </div>
          )}
          
          {currentPlanId === plan.id && (
            <div className="absolute -top-3 right-4">
              <Badge variant="secondary" className="px-3 py-1">
                Текущий
              </Badge>
            </div>
          )}
          
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {getPlanIcon(plan.name)}
                  {plan.name}
                </CardTitle>
                <p className="text-gray-500 text-sm mt-1">{plan.description}</p>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="text-3xl font-bold">
                {formatPrice(plan.price, plan.currency, plan.period)}
              </div>
              {plan.period === 'year' && (
                <p className="text-sm text-green-600 mt-1">
                  Экономия 20% по сравнению с помесячной оплатой
                </p>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Активных заказов одновременно</span>
                <span className="font-bold">{plan.features.maxActiveOrders}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Комиссия платформы</span>
                <span className="font-bold text-green-600">
                  {plan.features.commissionRate * 100}%
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Можно без предоплаты</span>
                {plan.features.canSkipPrepayment ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-gray-300" />
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Выделение в каталоге</span>
                {plan.features.featuredListing ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-gray-300" />
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Приоритетная поддержка</span>
                {plan.features.prioritySupport ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-gray-300" />
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Расширенная аналитика</span>
                {plan.features.analyticsAccess ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-gray-300" />
                )}
              </div>
              
              {plan.features.customDomain && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">Свой домен</span>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
              )}
              
              {plan.features.apiAccess && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">API доступ</span>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
              )}
            </div>
          </CardContent>
          
          <CardFooter>
            <Button 
              className="w-full"
              variant={plan.isPopular ? 'default' : 'outline'}
              onClick={() => {
                setSelectedPlanId(plan.id)
                onSelectPlan(plan.id)
              }}
              disabled={currentPlanId === plan.id}
            >
              {currentPlanId === plan.id ? 'Текущий тариф' : 'Выбрать тариф'}
            </Button>
          </CardFooter>
        </Card>
      ))}
      
      {/* Бесплатный тариф (до запуска монетизации) */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-6 w-6 text-amber-500" />
            Бесплатный период
          </CardTitle>
          <p className="text-gray-500 text-sm mt-1">
            Для новых исполнителей на время запуска платформы
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-3xl font-bold text-green-600">
            Бесплатно
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Длительность</span>
              <span className="font-bold">14 дней</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Активных заказов</span>
              <span className="font-bold">2 одновременно</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Комиссия платформы</span>
              <span className="font-bold text-green-600">10%</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>Требуется предоплата 30%</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="h-4 w-4" />
              <span>Доступ к базовым функциям</span>
            </div>
          </div>
        </CardContent>
        
        <CardFooter>
          <Button 
            className="w-full"
            variant="outline"
            onClick={() => onSelectPlan('trial')}
          >
            Начать бесплатный период
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}