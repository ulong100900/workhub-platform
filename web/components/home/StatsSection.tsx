'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Users, 
  Briefcase, 
  Clock, 
  CheckCircle, 
  TrendingUp,
  MessageSquare
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import CountUp from 'react-countup'

interface StatsData {
  totalUsers: number
  activeProjects: number
  projectsInProgress: number
  completedProjects: number
  recentBids: number
  averageRating: number
}

export default function StatsSection() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/stats')
      
      if (response.ok) {
        const result = await response.json()
        setStats(result.data)
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Пользователей',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'Зарегистрировано на платформе'
    },
    {
      title: 'Активных проектов',
      value: stats?.activeProjects || 0,
      icon: Briefcase,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Опубликовано и ищет исполнителя'
    },
    {
      title: 'В работе',
      value: stats?.projectsInProgress || 0,
      icon: Clock,
      color: 'bg-orange-500',
      textColor: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: 'Проектов выполняется сейчас'
    },
    {
      title: 'Завершено',
      value: stats?.completedProjects || 0,
      icon: CheckCircle,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'Успешно выполненных проектов'
    }
  ]

  return (
    <section className="py-12 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            WorkFinder в цифрах
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Присоединяйтесь к растущему сообществу профессионалов и заказчиков
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {statCards.map((card, index) => (
            <Card key={index} className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-full ${card.bgColor}`}>
                    <card.icon className={`h-6 w-6 ${card.textColor}`} />
                  </div>
                  {loading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <div className="text-3xl font-bold text-gray-900">
                      <CountUp 
                        end={card.value} 
                        duration={2.5}
                        separator=" "
                      />
                      {card.title === 'Пользователей' && '+'}
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {card.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Дополнительная статистика */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-50 rounded-full">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold">Активность за 30 дней</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Откликов на проекты</span>
                    <span className="font-bold text-xl text-blue-600">
                      <CountUp end={stats.recentBids} duration={2} />
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(stats.recentBids / 500 * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-50 rounded-full">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold">Удовлетворенность</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Средний рейтинг исполнителей</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xl text-green-600">
                        {stats.averageRating.toFixed(1)}
                      </span>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-5 h-5 ${i < Math.floor(stats.averageRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    На основе {stats.completedProjects} завершенных проектов
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </section>
  )
}