'use client'

import { PlatformStats } from '@/lib/admin'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Users, 
  Briefcase, 
  Wallet, 
  Star,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface StatsCardsProps {
  stats: PlatformStats
  isLoading?: boolean
}

export default function StatsCards({ stats, isLoading = false }: StatsCardsProps) {
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Пользователи */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Всего пользователей</p>
              <p className="text-3xl font-bold mt-2">{stats.users.total}</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3 text-blue-500" />
                  <span className="text-xs text-gray-600">{stats.users.executors} исп.</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-gray-600">{stats.users.customers} зак.</span>
                </div>
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-4">
            <TrendingUp className="h-3 w-3 text-green-500" />
            <span className="text-xs text-gray-600">
              +{stats.users.newToday} новых сегодня
            </span>
          </div>
        </CardContent>
      </Card>
      
      {/* Заказы */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Всего заказов</p>
              <p className="text-3xl font-bold mt-2">{stats.orders.total}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-amber-500" />
                  <span className="text-xs text-gray-600">{stats.orders.pending}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Briefcase className="h-3 w-3 text-blue-500" />
                  <span className="text-xs text-gray-600">{stats.orders.inProgress}</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-gray-600">{stats.orders.completed}</span>
                </div>
                <div className="flex items-center gap-1">
                  <XCircle className="h-3 w-3 text-red-500" />
                  <span className="text-xs text-gray-600">{stats.orders.cancelled}</span>
                </div>
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <Briefcase className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs text-gray-600">
              Выручка: {formatCurrency(stats.orders.revenue)}
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Финансы */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Финансы платформы</p>
              <p className="text-3xl font-bold mt-2">
                {formatCurrency(stats.finance.totalRevenue)}
              </p>
              <div className="space-y-1 mt-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Комиссия:</span>
                  <span className="font-medium">{formatCurrency(stats.finance.platformFee)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Выплаты:</span>
                  <span className="font-medium">{formatCurrency(stats.finance.withdrawals)}</span>
                </div>
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
              <Wallet className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs text-gray-600">
              Средний чек: {formatCurrency(stats.finance.averageOrderValue)}
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Отзывы */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Отзывы и рейтинги</p>
              <div className="flex items-center gap-2 mt-2">
                <p className="text-3xl font-bold">{stats.reviews.averageRating.toFixed(1)}</p>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= Math.round(stats.reviews.averageRating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'fill-gray-200 text-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-1 mt-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Всего отзывов:</span>
                  <span className="font-medium">{stats.reviews.total}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">С фото:</span>
                  <span className="font-medium">{stats.reviews.withPhotos}</span>
                </div>
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
              <Star className="h-6 w-6 text-amber-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs text-gray-600">
              Ответы на отзывы: {stats.reviews.responseRate.toFixed(1)}%
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}