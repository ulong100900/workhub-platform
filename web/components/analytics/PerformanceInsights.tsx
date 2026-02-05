'use client'

import { ExecutorPerformance } from '@/lib/analytics'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Star,
  Clock,
  Users,
  Award,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface PerformanceInsightsProps {
  performance: ExecutorPerformance
  isLoading?: boolean
}

export default function PerformanceInsights({ performance, isLoading }: PerformanceInsightsProps) {
  
  const formatMetric = (metric: string, value: number) => {
    switch (metric) {
      case 'revenue':
        return new Intl.NumberFormat('ru-RU', {
          style: 'currency',
          currency: 'RUB',
          minimumFractionDigits: 0
        }).format(value)
      case 'averageRating':
        return value.toFixed(1)
      case 'onTimeDelivery':
      case 'customerSatisfaction':
      case 'cancellationRate':
        return `${value.toFixed(1)}%`
      case 'responseTime':
        return `${value.toFixed(1)} ч`
      default:
        return value.toString()
    }
  }

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'revenue':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'ordersCompleted':
        return <Target className="h-4 w-4 text-blue-500" />
      case 'averageRating':
        return <Star className="h-4 w-4 text-amber-500" />
      case 'onTimeDelivery':
        return <Clock className="h-4 w-4 text-green-500" />
      case 'customerSatisfaction':
        return <Users className="h-4 w-4 text-purple-500" />
      case 'responseTime':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'cancellationRate':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Award className="h-4 w-4 text-gray-500" />
    }
  }

  const getMetricLabel = (metric: string) => {
    const labels: Record<string, string> = {
      'revenue': 'Доход',
      'ordersCompleted': 'Завершено заказов',
      'averageRating': 'Средний рейтинг',
      'onTimeDelivery': 'Выполнение вовремя',
      'customerSatisfaction': 'Удовлетворенность клиентов',
      'responseTime': 'Время ответа',
      'cancellationRate': 'Процент отмен'
    }
    return labels[metric] || metric
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="animate-pulse h-6 bg-gray-200 rounded w-1/3"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-2 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          Производительность за {performance.period}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Ключевые метрики */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(performance.metrics).map(([metric, value]) => (
            <div key={metric} className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                {getMetricIcon(metric)}
                <span className="text-sm font-medium text-gray-700">
                  {getMetricLabel(metric)}
                </span>
              </div>
              <div className="text-xl font-bold text-gray-900">
                {formatMetric(metric, value)}
              </div>
              {performance.comparisons.vsPreviousPeriod[metric] !== undefined && (
                <div className={`text-xs mt-1 ${
                  performance.comparisons.vsPreviousPeriod[metric] > 0 ? 'text-green-600' :
                  performance.comparisons.vsPreviousPeriod[metric] < 0 ? 'text-red-600' :
                  'text-gray-500'
                }`}>
                  {performance.comparisons.vsPreviousPeriod[metric] > 0 ? '+' : ''}
                  {performance.comparisons.vsPreviousPeriod[metric].toFixed(1)}%
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Сравнение с платформой */}
        <div>
          <h4 className="font-medium mb-3">Сравнение со средним по платформе</h4>
          <div className="space-y-4">
            {Object.entries(performance.comparisons.vsPlatformAverage).map(([metric, value]) => (
              <div key={metric} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{getMetricLabel(metric)}</span>
                  <span className={`font-medium ${
                    value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {value > 0 ? 'Выше на ' : 'Ниже на '}{Math.abs(value).toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={50 + value} 
                  className="h-2"
                  indicatorClassName={
                    value > 0 ? 'bg-green-500' : value < 0 ? 'bg-red-500' : 'bg-gray-500'
                  }
                />
              </div>
            ))}
          </div>
        </div>

        {/* Инсайты */}
        {performance.insights.length > 0 && (
          <div>
            <h4 className="font-medium mb-3">Рекомендации и инсайты</h4>
            <div className="space-y-3">
              {performance.insights.map((insight, index) => (
                <div 
                  key={index}
                  className={`p-3 rounded-lg border ${
                    insight.type === 'positive' ? 'bg-green-50 border-green-200' :
                    insight.type === 'negative' ? 'bg-red-50 border-red-200' :
                    'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {insight.type === 'positive' && <CheckCircle className="h-5 w-5 text-green-600" />}
                      {insight.type === 'negative' && <XCircle className="h-5 w-5 text-red-600" />}
                      {insight.type === 'neutral' && <AlertCircle className="h-5 w-5 text-gray-600" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{insight.metric}</span>
                        <Badge variant={
                          insight.type === 'positive' ? 'default' :
                          insight.type === 'negative' ? 'destructive' : 'outline'
                        }>
                          {insight.value} {insight.metric === 'averageRating' ? '' : '%'}
                        </Badge>
                        {insight.change !== 0 && (
                          <span className={`text-sm ${
                            insight.change > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {insight.change > 0 ? '↑' : '↓'} {Math.abs(insight.change)}%
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700">{insight.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Быстрые действия для улучшения */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-800 mb-2">Как улучшить показатели:</h4>
          <ul className="space-y-2 text-sm text-blue-700">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Отвечайте на сообщения быстрее (цель: менее 1 часа)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Публикуйте фотоотчеты по завершении работ</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Просите клиентов оставлять отзывы после завершения заказа</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Обновляйте календарь доступности регулярно</span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}