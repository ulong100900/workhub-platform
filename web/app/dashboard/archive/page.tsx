'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Archive, 
  Search, 
  Calendar, 
  DollarSign, 
  Star,
  User,
  Loader2,
  MessageSquare,
  Download
} from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

interface CompletedProject {
  id: string
  title: string
  description: string
  budget: number
  final_amount?: number
  category: string
  status: 'completed'
  completed_at: string
  freelancer?: {
    id: string
    full_name: string
    avatar_url?: string
    rating?: number
  }
  review?: {
    rating: number
    comment: string
    created_at: string
  }
}

export default function ArchivePage() {
  const [projects, setProjects] = useState<CompletedProject[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [exporting, setExporting] = useState(false)

  const loadCompletedProjects = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/projects/completed')
      
      if (response.ok) {
        const result = await response.json()
        setProjects(result.data || [])
      }
    } catch (error) {
      console.error('Error loading completed projects:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCompletedProjects()
  }, [])

  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.freelancer?.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const exportToCSV = async () => {
    try {
      setExporting(true)
      
      const headers = [
        'ID проекта',
        'Название',
        'Категория',
        'Исходный бюджет',
        'Итоговая сумма',
        'Исполнитель',
        'Рейтинг исполнителя',
        'Ваша оценка',
        'Дата завершения',
        'Статус'
      ]

      const csvData = filteredProjects.map(project => [
        project.id,
        `"${project.title.replace(/"/g, '""')}"`,
        project.category,
        project.budget,
        project.final_amount || project.budget,
        project.freelancer?.full_name || 'Не указан',
        project.freelancer?.rating?.toFixed(1) || 'Нет',
        project.review?.rating || 'Нет',
        format(new Date(project.completed_at), 'dd.MM.yyyy'),
        'Завершен'
      ])

      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.join(','))
      ].join('\n')

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `workfinder-archive-${format(new Date(), 'yyyy-MM-dd')}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
    } catch (error) {
      console.error('Error exporting CSV:', error)
      alert('Ошибка при экспорте')
    } finally {
      setExporting(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMMM yyyy', { locale: ru })
    } catch {
      return dateString
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-16 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold">Загрузка архива...</h2>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <Archive className="h-8 w-8" />
              Архив проектов
            </h1>
            <p className="text-gray-600">
              История всех завершенных проектов
            </p>
          </div>
          
          <Button
            onClick={exportToCSV}
            disabled={exporting || filteredProjects.length === 0}
            variant="outline"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Экспорт в CSV
          </Button>
        </div>

        {/* Поиск */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Поиск по проектам или исполнителям..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <Archive className="h-10 w-10 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Архив пуст
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Здесь появятся проекты после их завершения
            </p>
            <Button asChild>
              <a href="/dashboard/my-projects">
                Перейти к активным проектам
              </a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-4 text-gray-600">
            Найдено проектов: {filteredProjects.length}
          </div>
          
          <div className="space-y-6">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                    {/* Основная информация */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-xl mb-2">
                            {project.title}
                          </h3>
                          <div className="flex items-center gap-3 mb-3">
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              Завершен
                            </Badge>
                            <span className="text-gray-600 text-sm">
                              {formatDate(project.completed_at)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">
                            {project.final_amount || project.budget} ₽
                          </div>
                          {project.final_amount && project.final_amount !== project.budget && (
                            <div className="text-sm text-gray-500 line-through">
                              {project.budget} ₽
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-gray-600 mb-6 line-clamp-2">
                        {project.description}
                      </p>
                      
                      {/* Исполнитель */}
                      {project.freelancer && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          {project.freelancer.avatar_url ? (
                            <img 
                              src={project.freelancer.avatar_url} 
                              alt={project.freelancer.full_name}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <User className="h-5 w-5 text-blue-600" />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="font-medium">
                              {project.freelancer.full_name}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              {project.freelancer.rating && (
                                <>
                                  <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                  <span>{project.freelancer.rating.toFixed(1)}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <a href={`/dashboard/messages?user=${project.freelancer.id}`}>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Написать
                            </a>
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {/* Отзыв */}
                    {project.review && (
                      <div className="lg:w-80 border-l lg:border-l-0 lg:border-t lg:pt-6 lg:pl-6">
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">Ваш отзыв</h4>
                            <div className="flex items-center gap-2 mb-3">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < (project.review?.rating || 0)
                                      ? 'text-yellow-500 fill-yellow-500'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                              <span className="font-bold">{project.review.rating}.0</span>
                            </div>
                            <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg">
                              {project.review.comment}
                            </p>
                          </div>
                          
                          <div className="text-sm text-gray-500">
                            Оставлен {formatDate(project.review.created_at)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}