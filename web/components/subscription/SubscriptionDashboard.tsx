'use client'

import { useState, useEffect } from 'react'
import { SubscriptionService, BillingHistory } from '@/lib/subscription'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  CreditCard, 
  History, 
  Download,
  AlertCircle,
  CheckCircle,
  TrendingUp
} from 'lucide-react'
import SubscriptionPlans from './SubscriptionPlans'
import CurrentSubscription from './CurrentSubscription'
import { Badge } from '@/components/ui/badge'
import { Star } from 'lucide-react'
import { Wallet } from 'lucide-react'

export default function SubscriptionDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [billingHistory, setBillingHistory] = useState<BillingHistory | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // В реальном приложении будет из контекста/сессии
  const executorId = 'executor-id'
  const hasActiveSubscription = true

  useEffect(() => {
    if (activeTab === 'billing') {
      loadBillingHistory()
    }
  }, [activeTab])

  const loadBillingHistory = async () => {
    setIsLoading(true)
    try {
      const history = await SubscriptionService.getBillingHistory(executorId)
      setBillingHistory(history)
    } catch (error) {
      console.error('Error loading billing history:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectPlan = async (planId: string) => {
    if (planId === 'trial') {
      try {
        await SubscriptionService.createTrialSubscription(executorId, 'basic')
        alert('Пробный период успешно активирован!')
        setActiveTab('overview')
      } catch (error) {
        console.error('Error creating trial:', error)
        alert('Ошибка при активации пробного периода')
      }
    } else {
      // Перенаправляем на страницу оплаты
      window.location.href = `/subscription/checkout?plan=${planId}`
    }
  }

  const handleExport = () => {
    // Логика экспорта платежей
    console.log('Exporting billing data...')
  }

  const formatCurrency = (amount: number, currency: string = 'RUB') => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Подписка и тарифы</h1>
          <p className="text-gray-500 mt-2">
            Управление подпиской, выбор тарифа и история платежей
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Экспорт платежей
          </Button>
        </div>
      </div>

      {/* Табы */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="overview">Обзор</TabsTrigger>
          <TabsTrigger value="plans">Тарифы</TabsTrigger>
          <TabsTrigger value="billing">Платежи</TabsTrigger>
        </TabsList>

        {/* Обзор */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Текущая подписка */}
            <div className="lg:col-span-2">
              <CurrentSubscription 
                executorId={executorId}
                onUpgrade={() => setActiveTab('plans')}
                onManage={() => setActiveTab('billing')}
              />
            </div>

            {/* Преимущества подписки */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Преимущества подписки</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Меньше комиссия</h4>
                      <p className="text-sm text-gray-600">
                        От 5% вместо стандартных 20%
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Работа без предоплаты</h4>
                      <p className="text-sm text-gray-600">
                        Завоевывайте доверие клиентов
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Приоритет в поиске</h4>
                      <p className="text-sm text-gray-600">
                        Ваши услуги видят первыми
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Расширенная аналитика</h4>
                      <p className="text-sm text-gray-600">
                        Подробные отчеты и статистика
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Быстрые действия */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Быстрые действия</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Изменить способ оплаты
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <History className="h-4 w-4 mr-2" />
                    Получить счет
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Поддержка
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Статистика */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Всего потрачено</p>
                    <p className="text-2xl font-bold mt-2">
                      {billingHistory ? formatCurrency(billingHistory.totalSpent) : '0 ₽'}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">С подписки</p>
                    <p className="text-2xl font-bold mt-2">
                      {hasActiveSubscription ? '14 дней' : 'Не активно'}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Экономия на комиссии</p>
                    <p className="text-2xl font-bold mt-2">
                      ~2 500 ₽
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Тарифы */}
        <TabsContent value="plans">
          <div className="space-y-6">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold mb-4">Выберите подходящий тариф</h2>
              <p className="text-gray-600">
                Начните с 14-дневного пробного периода. Все тарифы включают доступ к базе заказов
                и инструментам для работы с клиентами.
              </p>
            </div>
            
            <SubscriptionPlans 
              onSelectPlan={handleSelectPlan}
              isLoading={isLoading}
            />
            
            {/* FAQ */}
            <Card>
              <CardHeader>
                <CardTitle>Частые вопросы</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Можно ли отменить подписку?</h4>
                  <p className="text-gray-600 text-sm">
                    Да, вы можете отменить подписку в любой момент. При отмене она останется активной до конца оплаченного периода.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Что дает работа без предоплаты?</h4>
                  <p className="text-gray-600 text-sm">
                    Вы можете брать заказы без требования предоплаты от клиента. Это увеличивает доверие и количество заказов.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Как работает пробный период?</h4>
                  <p className="text-gray-600 text-sm">
                    14 дней бесплатного доступа ко всем функциям стартового тарифа. Никаких платежей не требуется.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Можно ли изменить тариф?</h4>
                  <p className="text-gray-600 text-sm">
                    Да, вы можете перейти на другой тариф в любой момент. Разница в стоимости будет пересчитана пропорционально.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Платежи */}
        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle>История платежей</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    Все платежи
                  </Button>
                  <Button variant="outline" size="sm">
                    Только подписка
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-32"></div>
                          <div className="h-3 bg-gray-200 rounded w-24"></div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-24"></div>
                          <div className="h-3 bg-gray-200 rounded w-16 ml-auto"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : billingHistory && billingHistory.payments.length > 0 ? (
                <div className="space-y-4">
                  {billingHistory.payments.map((payment) => (
                    <div key={payment.id} className="p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{payment.description}</h4>
                          <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                            <span>
                              {payment.createdAt.toLocaleDateString('ru-RU')}
                            </span>
                            <Badge variant={
                              payment.status === 'completed' ? 'default' :
                              payment.status === 'pending' ? 'outline' : 'secondary'
                            }>
                              {payment.status === 'completed' ? 'Завершен' :
                               payment.status === 'pending' ? 'Ожидание' : 'Ошибка'}
                            </Badge>
                            {payment.paymentMethod && (
                              <span>Способ: {payment.paymentMethod}</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className={`text-lg font-bold ${
                            payment.amount < 0 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {payment.amount < 0 ? '-' : '+'}{formatCurrency(Math.abs(payment.amount), payment.currency)}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {payment.type === 'subscription' ? 'Подписка' :
                             payment.type === 'commission' ? 'Комиссия' : 'Платеж'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">Платежей пока нет</h3>
                  <p className="text-gray-500 mt-2">
                    Когда вы совершите первый платеж, он появится здесь
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}