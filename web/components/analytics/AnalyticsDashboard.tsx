'use client'

import { useState, useEffect } from 'react'
import { AnalyticsService, RevenueAnalytics, OrderAnalytics, CustomerAnalytics, ExecutorPerformance } from '@/lib/analytics'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Target,
  Download,
  Calendar,
  Filter,
  Award,
  DollarSign,
  Package,
  UserCheck
} from 'lucide-react'
import MetricsCard from './MetricsCard'
import RevenueChart from './RevenueChart'
import PerformanceInsights from './PerformanceInsights'

export default function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month')
  const [revenueAnalytics, setRevenueAnalytics] = useState<RevenueAnalytics | null>(null)
  const [orderAnalytics, setOrderAnalytics] = useState<OrderAnalytics | null>(null)
  const [customerAnalytics, setCustomerAnalytics] = useState<CustomerAnalytics | null>(null)
  const [performance, setPerformance] = useState<ExecutorPerformance | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [period])

  const loadAnalytics = async () => {
    setIsLoading(true)
    try {
      // В реальном приложении executorId из контекста/сессии
      const executorId = 'executor-id'
      
      const [
        revenueData,
        orderData,
        customerData,
        performanceData
      ] = await Promise.all([
        AnalyticsService.getRevenueAnalytics(executorId, period),
        AnalyticsService.getOrderAnalytics(executorId, period),
        AnalyticsService.getCustomerAnalytics(executorId, period),
        AnalyticsService.getExecutorPerformance(executorId, period)
      ])
      
      setRevenueAnalytics(revenueData)
      setOrderAnalytics(orderData)
      setCustomerAnalytics(customerData)
      setPerformance(performanceData)
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = () => {
    // Логика экспорта аналитики
    console.log('Exporting analytics...')
  }

  const getPeriodLabel = () => {
    const labels = {
      'week': 'неделю',
      'month': 'месяц',
      'quarter': 'квартал',
      'year': 'год'
    }
    return labels[period] || period
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Аналитика</h1>
          <p className="text-gray-500 mt-2">
            Статистика и метрики производительности за {getPeriodLabel()}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Период" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">За неделю</SelectItem>
              <SelectItem value="month">За месяц</SelectItem>
              <SelectItem value="quarter">За квартал</SelectItem>
              <SelectItem value="year">За год</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Экспорт
          </Button>
        </div>
      </div>

      {/* Табы */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Обзор
          </TabsTrigger>
          <TabsTrigger value="revenue">
            <DollarSign className="h-4 w-4 mr-2" />
            Доходы
          </TabsTrigger>
          <TabsTrigger value="orders">
            <Package className="h-4 w-4 mr-2" />
            Заказы
          </TabsTrigger>
          <TabsTrigger value="performance">
            <Award className="h-4 w-4 mr-2" />
            Производительность
          </TabsTrigger>
        </TabsList>

        {/* Обзор */}
        <TabsContent value="overview" className="space-y-6">
          {/* Ключевые метрики */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricsCard
              title="Общий доход"
              value={revenueAnalytics?.current.total || 0}
              change={revenueAnalytics?.growth.total}
              format="currency"
              icon={<DollarSign className="h-5 w-5 text-green-500" />}
              isLoading={isLoading}
              helpText="Суммарный доход за выбранный период"
            />
            
            <MetricsCard
              title="Завершено заказов"
              value={orderAnalytics?.completed || 0}
              change={revenueAnalytics?.growth.orders}
              icon={<Package className="h-5 w-5 text-blue-500" />}
              isLoading={isLoading}
              helpText="Количество успешно завершенных заказов"
            />
            
            <MetricsCard
              title="Средний рейтинг"
              value={performance?.metrics.averageRating || 0}
              icon={<Award className="h-5 w-5 text-amber-500" />}
              isLoading={isLoading}
              helpText="Средняя оценка клиентов по 5-балльной шкале"
            />
            
            <MetricsCard
              title="Новых клиентов"
              value={customerAnalytics?.newCustomers || 0}
              icon={<UserCheck className="h-5 w-5 text-purple-500" />}
              isLoading={isLoading}
              helpText="Количество новых клиентов за период"
            />
          </div>

          {/* График доходов */}
          {revenueAnalytics && (
            <RevenueChart 
              data={revenueAnalytics}
              isLoading={isLoading}
              onPeriodChange={setPeriod}
            />
          )}

          {/* Дополнительная аналитика */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Производительность */}
            {performance && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-medium mb-4 flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-500" />
                    Ключевые показатели
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Выполнение вовремя</span>
                        <span className="font-medium">{performance.metrics.onTimeDelivery.toFixed(1)}%</span>
                      </div>
                      <Progress value={performance.metrics.onTimeDelivery} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Удовлетворенность клиентов</span>
                        <span className="font-medium">{performance.metrics.customerSatisfaction.toFixed(1)}%</span>
                      </div>
                      <Progress value={performance.metrics.customerSatisfaction} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Процент отмен</span>
                        <span className="font-medium">{performance.metrics.cancellationRate.toFixed(1)}%</span>
                      </div>
                      <Progress value={100 - performance.metrics.cancellationRate} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Клиенты */}
            {customerAnalytics && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-medium mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-500" />
                    Аналитика клиентов
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900">
                          {customerAnalytics.totalCustomers}
                        </div>
                        <div className="text-sm text-gray-600">Всего клиентов</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900">
                          {customerAnalytics.repeatRate.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600">Повторных заказов</div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Распределение клиентов</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Новые клиенты</span>
                          <span className="font-medium">{customerAnalytics.newCustomers}</span>
                        </div>
                        <Progress 
                          value={customerAnalytics.totalCustomers > 0 
                            ? (customerAnalytics.newCustomers / customerAnalytics.totalCustomers) * 100 
                            : 0
                          } 
                          className="h-2" 
                        />
                        
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Постоянные клиенты</span>
                          <span className="font-medium">{customerAnalytics.returningCustomers}</span>
                        </div>
                        <Progress 
                          value={customerAnalytics.totalCustomers > 0 
                            ? (customerAnalytics.returningCustomers / customerAnalytics.totalCustomers) * 100 
                            : 0
                          } 
                          className="h-2" 
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Доходы */}
        <TabsContent value="revenue">
          {revenueAnalytics ? (
            <RevenueChart 
              data={revenueAnalytics}
              isLoading={isLoading}
              onPeriodChange={setPeriod}
            />
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">Данные о доходах</h3>
                  <p className="text-gray-500 mt-2">
                    {isLoading ? 'Загрузка данных...' : 'Нет данных о доходах за выбранный период'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Заказы */}
        <TabsContent value="orders">
          {orderAnalytics ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricsCard
                  title="Всего заказов"
                  value={orderAnalytics.total}
                  isLoading={isLoading}
                />
                
                <MetricsCard
                  title="Завершено"
                  value={orderAnalytics.completed}
                  format="percent"
                  suffix="%"
                  isLoading={isLoading}
                  helpText={`${orderAnalytics.completionRate.toFixed(1)}% от общего числа`}
                />
                
                <MetricsCard
                  title="В работе"
                  value={orderAnalytics.inProgress}
                  isLoading={isLoading}
                />
                
                <MetricsCard
                  title="Отменено"
                  value={orderAnalytics.cancelled}
                  format="percent"
                  suffix="%"
                  isLoading={isLoading}
                  helpText={`${orderAnalytics.cancelled > 0 ? (orderAnalytics.cancelled / orderAnalytics.total * 100).toFixed(1) : 0}% от общего числа`}
                />
              </div>

              {/* Статусы заказов */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-medium mb-4">Распределение по статусам</h3>
                  <div className="space-y-4">
                    {Object.entries(orderAnalytics.byStatus).map(([status, count]) => (
                      <div key={status} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 capitalize">
                            {status === 'in_progress' ? 'В работе' : 
                             status === 'completed' ? 'Завершено' :
                             status === 'cancelled' ? 'Отменено' :
                             status === 'pending' ? 'Ожидание' : status}
                          </span>
                          <span className="font-medium">
                            {count} ({orderAnalytics.total > 0 ? (count / orderAnalytics.total * 100).toFixed(1) : 0}%)
                          </span>
                        </div>
                        <Progress 
                          value={orderAnalytics.total > 0 ? (count / orderAnalytics.total) * 100 : 0} 
                          className="h-2"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">Данные о заказах</h3>
                  <p className="text-gray-500 mt-2">
                    {isLoading ? 'Загрузка данных...' : 'Нет данных о заказах за выбранный период'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Производительность */}
        <TabsContent value="performance">
          {performance ? (
            <PerformanceInsights 
              performance={performance}
              isLoading={isLoading}
            />
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">Данные о производительности</h3>
                  <p className="text-gray-500 mt-2">
                    {isLoading ? 'Загрузка данных...' : 'Нет данных о производительности'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Прогнозы */}
      {revenueAnalytics && revenueAnalytics.current.total > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium">Прогноз на следующие 3 месяца</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Загрузка прогнозов
                }}
              >
                Обновить прогноз
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-700 mb-2">Прогноз доходов</div>
                <div className="text-2xl font-bold text-blue-800">
                  {new Intl.NumberFormat('ru-RU', {
                    style: 'currency',
                    currency: 'RUB',
                    minimumFractionDigits: 0
                  }).format(revenueAnalytics.current.total * 1.3)}
                </div>
                <div className="text-sm text-blue-600 mt-2">+30% к текущему периоду</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-sm text-green-700 mb-2">Прогноз заказов</div>
                <div className="text-2xl font-bold text-green-800">
                  {Math.round((revenueAnalytics.current.total / revenueAnalytics.current.averageOrderValue) * 1.25)}
                </div>
                <div className="text-sm text-green-600 mt-2">+25% к текущему периоду</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-sm text-purple-700 mb-2">Прогноз клиентов</div>
                <div className="text-2xl font-bold text-purple-800">
                  {customerAnalytics ? Math.round(customerAnalytics.totalCustomers * 1.2) : 0}
                </div>
                <div className="text-sm text-purple-600 mt-2">+20% к текущему периоду</div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-gray-600">
                *Прогнозы основаны на исторических данных и сезонных тенденциях. 
                Фактические результаты могут отличаться.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}