'use client'

import { useState, useEffect } from 'react'
import { SubscriptionService, ExecutorSubscription, SubscriptionPlan } from '@/lib/subscription'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Calendar, 
  CreditCard, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

interface CurrentSubscriptionProps {
  executorId: string
  onUpgrade?: () => void
  onManage?: () => void
}

export default function CurrentSubscription({ 
  executorId, 
  onUpgrade,
  onManage 
}: CurrentSubscriptionProps) {
  const [subscription, setSubscription] = useState<ExecutorSubscription | null>(null)
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [daysLeft, setDaysLeft] = useState(0)

  useEffect(() => {
    loadSubscription()
  }, [executorId])

  const loadSubscription = async () => {
    setIsLoading(true)
    try {
      const subscriptionData = await SubscriptionService.getExecutorSubscription(executorId)
      setSubscription(subscriptionData)
      
      if (subscriptionData) {
        // Рассчитываем оставшиеся дни
        const now = new Date()
        const end = subscriptionData.currentPeriodEnd
        const diffTime = end.getTime() - now.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        setDaysLeft(diffDays)
      }
    } catch (error) {
      console.error('Error loading subscription:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Активна
          </Badge>
        )
      case 'pending':
        return (
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
            <Clock className="h-3 w-3 mr-1" />
            Ожидает оплаты
          </Badge>
        )
      case 'cancelled':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <XCircle className="h-3 w-3 mr-1" />
            Отменена
          </Badge>
        )
      case 'expired':
        return (
          <Badge variant="outline" className="text-gray-600">
            Истекла
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleCancel = async () => {
    if (!subscription || !confirm('Вы уверены, что хотите отменить подписку?')) {
      return
    }
    
    try {
      await SubscriptionService.cancelSubscription(subscription.id, executorId, false)
      loadSubscription() // Перезагружаем данные
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      alert('Ошибка при отмене подписки')
    }
  }

  const handleRenew = async () => {
    if (!subscription) return
    
    try {
      // Логика возобновления подписки
      alert('Функция возобновления подписки будет доступна в ближайшее время')
    } catch (error) {
      console.error('Error renewing subscription:', error)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Подписка</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Подписка не активна</h3>
            <p className="text-gray-500 mt-2">
              Для принятия заказов требуется активная подписка
            </p>
            <Button className="mt-6" onClick={onUpgrade}>
              Выбрать тариф
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const progressPercentage = subscription.metadata?.is_trial ? 
    ((14 - daysLeft) / 14) * 100 : 
    daysLeft > 0 ? ((30 - daysLeft) / 30) * 100 : 100

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Текущая подписка</CardTitle>
          {getStatusBadge(subscription.status)}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Основная информация */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-lg">
                {subscription.metadata?.plan?.name || 'Базовый тариф'}
              </h4>
              <p className="text-sm text-gray-500 mt-1">
                {subscription.metadata?.is_trial ? 'Пробный период' : 'Ежемесячная подписка'}
              </p>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold">
                {subscription.price === 0 ? 'Бесплатно' : `${subscription.price} ${subscription.currency}`}
              </div>
              <p className="text-sm text-gray-500">
                {subscription.autoRenew ? 'Автопродление включено' : 'Без автопродления'}
              </p>
            </div>
          </div>
          
          {/* Прогресс подписки */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                {subscription.metadata?.is_trial ? 'Осталось пробных дней' : 'До конца периода'}
              </span>
              <span className="font-medium">{daysLeft} дней</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>
                {format(subscription.currentPeriodStart, 'dd.MM.yyyy', { locale: ru })}
              </span>
              <span>
                {format(subscription.currentPeriodEnd, 'dd.MM.yyyy', { locale: ru })}
              </span>
            </div>
          </div>
        </div>
        
        {/* Особенности тарифа */}
        {subscription.metadata?.plan?.features && (
          <div className="space-y-3">
            <h5 className="font-medium">Ваши возможности:</h5>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">
                  {subscription.metadata.plan.features.maxActiveOrders} активных заказов
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">
                  Комиссия {subscription.metadata.plan.features.commissionRate * 100}%
                </span>
              </div>
              {subscription.metadata.plan.features.canSkipPrepayment && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Без предоплаты</span>
                </div>
              )}
              {subscription.metadata.plan.features.featuredListing && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Выделение в каталоге</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Информация о следующем платеже */}
        {!subscription.metadata?.is_trial && subscription.autoRenew && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                Следующий платеж
              </span>
            </div>
            <p className="text-sm text-blue-700">
              {format(subscription.currentPeriodEnd, 'dd MMMM yyyy', { locale: ru })} — {subscription.price} {subscription.currency}
            </p>
          </div>
        )}
        
        {/* Триальная подписка */}
        {subscription.metadata?.is_trial && (
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">
                Пробный период
              </span>
            </div>
            <p className="text-sm text-amber-700">
              Через {daysLeft} дней подписка завершится. Выберите тариф, чтобы продолжить работу.
            </p>
          </div>
        )}
        
        {/* Кнопки управления */}
        <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
          {subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
            <>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={onManage}
              >
                Управление
              </Button>
              
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={onUpgrade}
              >
                Изменить тариф
              </Button>
              
              <Button 
                variant="outline" 
                className="flex-1 text-red-600 hover:text-red-700"
                onClick={handleCancel}
              >
                Отменить
              </Button>
            </>
          )}
          
          {subscription.cancelAtPeriodEnd && (
            <div className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <span className="text-sm">Подписка будет отменена в конце периода</span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRenew}
              >
                Возобновить
              </Button>
            </div>
          )}
          
          {subscription.status === 'pending' && (
            <Button className="w-full">
              <CreditCard className="h-4 w-4 mr-2" />
              Оплатить подписку
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}