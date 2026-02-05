'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DollarSign, Clock, MapPin, User, TrendingUp, Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'

interface Project {
  id: string
  title: string
  description: string
  budget: {
    amount: number
    type: 'fixed' | 'hourly'
    currency: string
  }
  category: string
  skills: string[]
  createdAt: string
  location: {
    city: string
    country: string
    isRemote: boolean
  }
  status: string
  isUrgent: boolean
  _count?: {
    bids: number
  }
}

export default function FeaturedProjects() {
  const router = useRouter()
  const { toast } = useToast()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchFeaturedProjects()
  }, [])

  const fetchFeaturedProjects = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔄 Загружаем рекомендуемые проекты...')
      
      const response = await fetch('/api/projects?limit=3&featured=true', {
        cache: 'no-store',
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success && result.data?.projects) {
        console.log(`✅ Загружено ${result.data.projects.length} проектов`)
        setProjects(result.data.projects)
      } else {
        // Если нет реальных данных, оставляем пустой массив
        setProjects([])
      }
    } catch (err: any) {
      console.error('❌ Ошибка загрузки проектов:', err)
      setError('Не удалось загрузить проекты')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)
      
      if (diffMins < 60) {
        return `${diffMins} мин. назад`
      } else if (diffHours < 24) {
        return `${diffHours} час. назад`
      } else if (diffDays < 30) {
        return `${diffDays} дн. назад`
      } else {
        return 'Более месяца назад'
      }
    } catch {
      return dateString
    }
  }

  const handleProjectClick = (projectId: string) => {
    console.log('Переход к проекту ID:', projectId)
    router.push(`/projects/${projectId}`)
  }

  const handleRetry = () => {
    fetchFeaturedProjects()
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
          <div>
            <h2 className="text-3xl font-bold mb-2">Рекомендуемые проекты</h2>
            <p className="text-gray-600">Лучшие проекты для начала работы</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleRetry} disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <TrendingUp className="mr-2 h-4 w-4" />
              )}
              Обновить
            </Button>
            <Link href="/projects">
              <Button>Все проекты</Button>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-6"></div>
                  <div className="flex gap-2 mb-6">
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Не удалось загрузить проекты</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button onClick={handleRetry}>
                <Loader2 className="mr-2 h-4 w-4" />
                Попробовать снова
              </Button>
            </CardContent>
          </Card>
        ) : projects.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Пока нет проектов</h3>
              <p className="text-gray-600 mb-6">
                Рекомендуемые проекты появятся здесь позже
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
            {projects.map((project) => (
              <Card key={project.id} className="hover:shadow-xl transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 
                        className="font-bold text-lg mb-2 line-clamp-2 cursor-pointer hover:text-blue-600"
                        onClick={() => handleProjectClick(project.id)}
                      >
                        {project.title}
                      </h3>
                      <div className="flex gap-2 mb-3">
                        <Badge variant={project.isUrgent ? 'destructive' : 'secondary'}>
                          {project.isUrgent ? 'Срочно' : project.category}
                        </Badge>
                        {project.location.isRemote && (
                          <Badge variant="outline" className="border-green-500 text-green-600">
                            Удаленно
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-6 line-clamp-3">{project.description}</p>

                  {project.skills && project.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {project.skills.slice(0, 3).map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {project.skills.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{project.skills.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <div className="text-gray-600 flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Бюджет:
                      </div>
                      <div className="font-bold">
                        {project.budget.type === 'fixed' 
                          ? `${project.budget.amount.toLocaleString()} ₽`
                          : `${project.budget.amount} ₽/час`
                        }
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-gray-600 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Предложений:
                      </div>
                      <div className="font-medium">{project._count?.bids || 0}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-gray-600 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Локация:
                      </div>
                      <div className="font-medium">
                        {project.location.isRemote ? 'Удаленно' : project.location.city}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-gray-600 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Опубликовано:
                      </div>
                      <div className="font-medium">{formatDate(project.createdAt)}</div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4 px-6">
                  <div className="flex gap-3 w-full">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleProjectClick(project.id)}
                    >
                      Подробнее
                    </Button>
                    <Button 
                      className="flex-1"
                      onClick={() => {
                        if (project.status === 'PUBLISHED') {
                          router.push(`/dashboard/orders/${project.id}/bid`)
                        } else {
                          toast({
                            title: "Проект недоступен",
                            description: "Этот проект уже закрыт для заявок",
                            variant: "destructive"
                          })
                        }
                      }}
                      disabled={project.status !== 'PUBLISHED'}
                    >
                      Подать заявку
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="text-xl font-bold mb-2">Начинающим фрилансерам</h3>
              <p className="text-gray-600">
                Получите первый заказ с гарантией оплаты и поддержкой от опытных менторов
              </p>
            </div>
            <Link href="/freelancer/start">
              <Button size="lg" variant="default">
                Начать зарабатывать
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}