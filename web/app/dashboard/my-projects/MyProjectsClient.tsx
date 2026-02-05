// /web/app/dashboard/my-projects/MyProjectsClient.tsx - ОБНОВЛЕННЫЙ ВИД
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import { 
  Plus,
  Layers,
  CheckCircle,
  FileText,
  Clock,
  CheckSquare,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  MapPin,
  MessageSquare,
  Calendar,
  Image as ImageIcon,
  Bell,
  AlertCircle,
  Loader2,
  Briefcase
} from 'lucide-react'
import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import BidList from '@/components/projects/BidList'

interface Project {
  id: string
  title: string
  description: string
  category: string
  budget: number
  budget_type: string
  status: 'draft' | 'published' | 'pending' | 'completed' | 'cancelled'
  location_city: string
  is_remote: boolean
  created_at: string
  views_count: number
  proposals_count: number
  images: string[]
  client_id: string
}

interface Notification {
  id: string
  title: string
  message: string
  project_id: string
  bid_id: string
  type: string
  is_read: boolean
  created_at: string
}

interface MyProjectsClientProps {
  initialProjects: Project[]
}

export default function MyProjectsClient({ initialProjects = [] }: MyProjectsClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  
  const [projects, setProjects] = useState<Project[]>(Array.isArray(initialProjects) ? initialProjects : [])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [activeTab, setActiveTab] = useState<string>('all')
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [deleteDialog, setDeleteDialog] = useState<{open: boolean, projectId: string | null}>({
    open: false,
    projectId: null
  })
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [globalLoading, setGlobalLoading] = useState(true)

  useEffect(() => {
    if (!Array.isArray(initialProjects) || initialProjects.length === 0) {
      fetchProjects()
    } else {
      setGlobalLoading(false)
    }
  }, [])

  useEffect(() => {
    loadNotifications()
    
    // Обновляем уведомления каждые 30 секунд
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchProjects = async () => {
    try {
      setGlobalLoading(true)
      const response = await fetch('/api/projects/me')
      const result = await response.json()
      
      if (result.success && Array.isArray(result.data)) {
        setProjects(result.data)
      }
    } catch (error) {
      console.error('Ошибка загрузки проектов:', error)
    } finally {
      setGlobalLoading(false)
    }
  }

  const loadNotifications = async () => {
    try {
      const response = await fetch('/api/notifications')
      
      if (response.ok) {
        const result = await response.json()
        setNotifications(result.data || [])
      }
    } catch (error) {
      console.error('Ошибка загрузки уведомлений:', error)
    }
  }

  const handleProjectClick = (projectId: string) => {
    router.push(`/projects/${projectId}`)
  }

  const handleEdit = (projectId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    router.push(`/dashboard/projects/${projectId}/edit`)
  }

  const handleUnpublish = async (projectId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    
    setLoading(prev => ({ ...prev, [projectId]: true }))
    
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'draft' })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Ошибка при снятии с публикации')
      }

      setProjects(prev => prev.map(project => 
        project.id === projectId 
          ? { ...project, status: 'draft' }
          : project
      ))

      toast({
        title: 'Успешно!',
        description: 'Проект снят с публикации и перемещен в черновики',
        variant: 'default',
      })

    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(prev => ({ ...prev, [projectId]: false }))
    }
  }

  const handlePublish = async (projectId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    
    setLoading(prev => ({ ...prev, [projectId]: true }))
    
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'published' })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Ошибка при публикации')
      }

      setProjects(prev => prev.map(project => 
        project.id === projectId 
          ? { ...project, status: 'published' }
          : project
      ))

      toast({
        title: 'Успешно!',
        description: 'Проект опубликован',
        variant: 'default',
      })

    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(prev => ({ ...prev, [projectId]: false }))
    }
  }

  const handleDelete = async (projectId: string) => {
    setLoading(prev => ({ ...prev, [projectId]: true }))
    
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Ошибка при удалении')
      }

      setProjects(prev => prev.filter(project => project.id !== projectId))

      toast({
        title: 'Успешно!',
        description: 'Проект удален',
        variant: 'default',
      })

    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(prev => ({ ...prev, [projectId]: false }))
      setDeleteDialog({ open: false, projectId: null })
    }
  }

  const handleViewBids = (projectId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    setSelectedProject(selectedProject === projectId ? null : projectId)
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST'
      })
      
      if (response.ok) {
        setNotifications(prev => prev.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        ))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const handleBidAccepted = (bidId: string, freelancerId: string) => {
    // Обновляем статус проекта
    setProjects(prev => prev.map(project => 
      project.id === selectedProject 
        ? { ...project, status: 'completed' }
        : project
    ))
    
    toast({
      title: 'Успешно!',
      description: 'Отклик принят! Исполнитель получил уведомление.',
      variant: 'default',
    })
  }

  const getProjectStats = () => {
    const total = projects.length
    const published = projects.filter(p => p.status === 'published').length
    const drafts = projects.filter(p => p.status === 'draft').length
    const pending = projects.filter(p => p.status === 'pending').length
    const completed = projects.filter(p => p.status === 'completed').length

    return { total, published, drafts, pending, completed }
  }

  const stats = getProjectStats()

  const filteredProjects = Array.isArray(projects) 
    ? projects.filter(project => {
        switch (activeTab) {
          case 'published':
            return project.status === 'published'
          case 'drafts':
            return project.status === 'draft'
          case 'pending':
            return project.status === 'pending'
          case 'completed':
            return project.status === 'completed'
          case 'all':
          default:
            return true
        }
      })
    : []

  const projectsWithNotifications = filteredProjects.map(project => {
    const projectNotifications = notifications.filter(
      n => n.project_id === project.id && !n.is_read
    )
    return {
      ...project,
      new_bids: projectNotifications.length
    }
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatBudget = (budget: number, budgetType: string) => {
    if (budgetType === 'price_request') {
      return 'Запрос цены'
    }
    return new Intl.NumberFormat('ru-RU').format(budget) + ' ₽'
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'published':
        return {
          icon: CheckCircle,
          color: 'from-green-500 to-emerald-500',
          bgColor: 'bg-gradient-to-r from-green-500 to-emerald-500',
          text: 'Опубликован',
          textColor: 'text-green-700'
        }
      case 'draft':
        return {
          icon: FileText,
          color: 'from-gray-400 to-gray-500',
          bgColor: 'bg-gradient-to-r from-gray-400 to-gray-500',
          text: 'Черновик',
          textColor: 'text-gray-700'
        }
      case 'pending':
        return {
          icon: Clock,
          color: 'from-amber-500 to-orange-500',
          bgColor: 'bg-gradient-to-r from-amber-500 to-orange-500',
          text: 'На модерации',
          textColor: 'text-amber-700'
        }
      case 'completed':
        return {
          icon: CheckSquare,
          color: 'from-blue-500 to-indigo-500',
          bgColor: 'bg-gradient-to-r from-blue-500 to-indigo-500',
          text: 'Завершен',
          textColor: 'text-blue-700'
        }
      default:
        return {
          icon: Layers,
          color: 'from-gray-500 to-gray-600',
          bgColor: 'bg-gradient-to-r from-gray-500 to-gray-600',
          text: status,
          textColor: 'text-gray-700'
        }
    }
  }

  const statCards = [
    {
      id: 'all',
      title: 'Всего проектов',
      count: stats.total,
      icon: Layers,
      color: 'from-blue-500 to-indigo-500',
      bgColor: 'bg-blue-100'
    },
    {
      id: 'published',
      title: 'Опубликованные',
      count: stats.published,
      icon: CheckCircle,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-100'
    },
    {
      id: 'drafts',
      title: 'Черновики',
      count: stats.drafts,
      icon: FileText,
      color: 'from-gray-400 to-gray-500',
      bgColor: 'bg-gray-100'
    },
    {
      id: 'pending',
      title: 'На модерации',
      count: stats.pending,
      icon: Clock,
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-100'
    },
    {
      id: 'completed',
      title: 'Завершенные',
      count: stats.completed,
      icon: CheckSquare,
      color: 'from-blue-500 to-indigo-500',
      bgColor: 'bg-indigo-100'
    }
  ]

  if (globalLoading) {
    return (
      <div className="space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">
            Мои проекты
          </h1>
          <p className="text-gray-600 text-lg">
            Управляйте своими проектами, отслеживайте статистику и находите исполнителей
          </p>
        </div>
        
        <Card>
          <CardContent className="py-16 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold">Загрузка проектов...</h2>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Заголовок и описание */}
      <div className="space-y-4">
        <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
          <Briefcase className="h-10 w-10" />
          Мои проекты
        </h1>
        <p className="text-gray-600 text-lg">
          Управляйте своими проектами, отслеживайте статистику и находите исполнителей
        </p>
      </div>

      {/* Уведомления */}
      {notifications.filter(n => !n.is_read).length > 0 && (
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                  <Bell className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-blue-800 text-lg">
                    Новые уведомления
                  </h3>
                  <p className="text-blue-600">
                    У вас {notifications.filter(n => !n.is_read).length} непрочитанных уведомлений
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="border-blue-300 text-blue-600 hover:bg-blue-50"
                onClick={() => router.push('/dashboard/notifications')}
              >
                Просмотреть все
              </Button>
            </div>

            {/* Список уведомлений */}
            <div className="mt-6 space-y-3">
              {notifications
                .filter(n => !n.is_read)
                .slice(0, 3)
                .map(notification => (
                  <div 
                    key={notification.id} 
                    className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm flex items-start justify-between hover:shadow-md transition-shadow"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-4 w-4 text-blue-500" />
                        <span className="font-semibold text-gray-900">
                          {notification.title}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-2">
                        {notification.message}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {new Date(notification.created_at).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'long',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-blue-600 to-indigo-600"
                        onClick={() => {
                          if (notification.project_id) {
                            setSelectedProject(notification.project_id)
                          }
                          handleMarkAsRead(notification.id)
                        }}
                      >
                        Перейти
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        Прочитано
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Кнопка создания проекта */}
      <div className="flex justify-end">
        <Button 
          onClick={() => router.push('/dashboard/projects/create')}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-12 px-8 shadow-lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          Создать проект
        </Button>
      </div>

      {/* Карточки статистики */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          const isActive = activeTab === stat.id
          
          return (
            <Card 
              key={stat.id}
              className={cn(
                "cursor-pointer transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1",
                isActive && "ring-2 ring-offset-2 ring-blue-500",
                "border"
              )}
              onClick={() => setActiveTab(stat.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {stat.count}
                    </p>
                  </div>
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center",
                    stat.bgColor
                  )}>
                    <Icon className={cn("h-6 w-6", stat.color.replace('from-', 'text-').split(' ')[0])} />
                  </div>
                </div>
                
                {/* Индикатор активности */}
                <div className={cn(
                  "h-1 mt-4 rounded-full transition-all duration-300",
                  isActive ? "bg-gradient-to-r " + stat.color : "bg-gray-200"
                )} />
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Табы для фильтрации */}
      <div className="border-b border-gray-200">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-transparent border-b-0 p-0 h-auto">
            <TabsTrigger 
              value="all" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 text-gray-600 px-4 py-3"
            >
              Все проекты
            </TabsTrigger>
            <TabsTrigger 
              value="published" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-green-600 data-[state=active]:text-green-600 text-gray-600 px-4 py-3"
            >
              Опубликованные
            </TabsTrigger>
            <TabsTrigger 
              value="drafts" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-gray-600 data-[state=active]:text-gray-600 text-gray-600 px-4 py-3"
            >
              Черновики
            </TabsTrigger>
            <TabsTrigger 
              value="pending" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-amber-600 data-[state=active]:text-amber-600 text-gray-600 px-4 py-3"
            >
              На модерации
            </TabsTrigger>
            <TabsTrigger 
              value="completed" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 text-gray-600 px-4 py-3"
            >
              Завершенные
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Список проектов */}
      <div className="space-y-6">
        {projectsWithNotifications.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="py-16 px-6 text-center">
              <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <Layers className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {activeTab === 'published' && 'Нет опубликованных проектов'}
                {activeTab === 'drafts' && 'Нет черновиков'}
                {activeTab === 'pending' && 'Нет проектов на модерации'}
                {activeTab === 'completed' && 'Нет завершенных проектов'}
                {activeTab === 'all' && 'У вас пока нет проектов'}
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {activeTab === 'published' && 'Опубликуйте свой первый проект, чтобы найти исполнителей'}
                {activeTab === 'drafts' && 'Начните создавать проект, и он появится здесь как черновик'}
                {activeTab === 'all' && 'Начните с создания своего первого проекта'}
              </p>
              <Button 
                onClick={() => router.push('/dashboard/projects/create')}
                className="px-8 bg-gradient-to-r from-blue-600 to-indigo-600"
              >
                <Plus className="h-5 w-5 mr-2" />
                Создать проект
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {projectsWithNotifications.map(project => {
              const statusInfo = getStatusInfo(project.status)
              const StatusIcon = statusInfo.icon
              
              return (
                <div key={project.id} className="space-y-4">
                  {/* Карточка проекта */}
                  <Card 
                    className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group"
                    onClick={() => handleProjectClick(project.id)}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Изображение проекта */}
                        <div className="flex-shrink-0">
                          <div className="w-48 h-48 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 shadow-md group-hover:shadow-lg transition-shadow">
                            {project.images && project.images.length > 0 ? (
                              <img
                                src={project.images[0]}
                                alt={project.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-4">
                                <ImageIcon className="h-12 w-12 mb-3" />
                                <span className="text-sm text-center">Нет изображения</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Информация о проекте */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                            <div className="flex-1">
                              {/* Статус проекта */}
                              <div className="flex items-center gap-3 mb-4">
                                <Badge className={cn(
                                  "px-3 py-1.5 border-0 shadow-sm",
                                  statusInfo.bgColor,
                                  "text-white"
                                )}>
                                  <StatusIcon className="h-3.5 w-3.5 mr-1.5" />
                                  {statusInfo.text}
                                </Badge>
                              </div>
                              
                              {/* Название проекта */}
                              <h3 
                                className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors"
                              >
                                {project.title}
                              </h3>
                              
                              {/* Описание */}
                              <p className="text-gray-600 mb-6 line-clamp-2">
                                {project.description}
                              </p>
                              
                              {/* Мета-информация */}
                              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full">
                                  <MapPin className="h-4 w-4" />
                                  <span className="font-medium">
                                    {project.is_remote ? '🌐 Удаленно' : project.location_city || 'Не указан'}
                                  </span>
                                </div>
                                
                                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full">
                                  <Eye className="h-4 w-4" />
                                  <span className="font-medium">
                                    {project.views_count || 0} просмотров
                                  </span>
                                </div>
                                
                                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full">
                                  <MessageSquare className="h-4 w-4" />
                                  <span className="font-medium">
                                    {project.proposals_count || 0} предложений
                                  </span>
                                </div>
                                
                                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full">
                                  <Calendar className="h-4 w-4" />
                                  <span className="font-medium">
                                    Создан {formatDate(project.created_at)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Блок бюджета */}
                            <div className="flex-shrink-0">
                              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100 shadow-sm text-center min-w-[140px]">
                                <div className="text-sm font-medium text-gray-600 mb-2">
                                  Бюджет
                                </div>
                                <div className={cn(
                                  "text-xl font-bold",
                                  project.budget_type === 'price_request' 
                                    ? "text-gray-700"
                                    : "text-blue-700"
                                )}>
                                  {formatBudget(project.budget, project.budget_type)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>

                    {/* Кнопки действий */}
                    
<CardFooter 
  className="bg-gradient-to-r from-gray-50 to-gray-100/50 px-6 py-4 border-t border-gray-200/50 flex justify-between items-center"
  onClick={(e) => e.stopPropagation()}
>
  <div className="flex items-center gap-3">
    {/* Кнопка просмотра откликов (только для опубликованных проектов) */}
    {project.status === 'published' && (
      <Button
        variant={selectedProject === project.id ? "default" : "outline"}
        onClick={(e) => handleViewBids(project.id, e)}
        className="gap-2 relative bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
      >
        <MessageSquare className="h-4 w-4" />
        Просмотреть отклики
        {project.new_bids > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {project.new_bids}
          </span>
        )}
      </Button>
    )}
    
    {/* Кнопка завершения проекта (только для проектов в работе) */}
    {project.status === 'published' && (
      <Button
        variant="outline"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          router.push(`/projects/${project.id}/complete`);
        }}
        disabled={loading[project.id]}
        className="gap-2 border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700 hover:border-green-600 shadow-sm"
      >
        <CheckCircle className="h-4 w-4" />
        Завершить
      </Button>
    )}
  </div>
  
  <div className="flex items-center gap-3">
    {/* Кнопка снять/опубликовать */}
    {project.status === 'published' ? (
      <Button
        variant="outline"
        size="sm"
        onClick={(e) => handleUnpublish(project.id, e)}
        disabled={loading[project.id]}
        className="gap-2 border-amber-500 text-amber-600 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-600 shadow-sm"
      >
        <EyeOff className="h-4 w-4" />
        Скрыть
      </Button>
    ) : project.status === 'draft' ? (
      <Button
        variant="outline"
        size="sm"
        onClick={(e) => handlePublish(project.id, e)}
        disabled={loading[project.id]}
        className="gap-2 border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700 hover:border-green-600 shadow-sm"
      >
        <Eye className="h-4 w-4" />
        Опубликовать
      </Button>
    ) : null}
    
    {/* Кнопка редактирования */}
    <Button
      variant="outline"
      size="sm"
      onClick={(e) => handleEdit(project.id, e)}
      disabled={loading[project.id]}
      className="gap-2 border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-600 shadow-sm"
    >
      <Edit className="h-4 w-4" />
      Редактировать
    </Button>
    
    {/* Кнопка удаления */}
    <Button
      variant="outline"
      size="sm"
      onClick={(e) => {
        e.stopPropagation()
        setDeleteDialog({ open: true, projectId: project.id })
      }}
      disabled={loading[project.id]}
      className="gap-2 border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-600 shadow-sm"
    >
      <Trash2 className="h-4 w-4" />
      Удалить
    </Button>
  </div>
</CardFooter>
                  </Card>

                  {/* Список откликов (открывается по клику на кнопку) */}
                  {selectedProject === project.id && project.status === 'published' && (
                    <div className="ml-4 md:ml-8 border-l-2 border-blue-200 pl-4 md:pl-6">
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                        <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                          <MessageSquare className="h-6 w-6 text-blue-600" />
                          Отклики на проект "{project.title}"
                        </h4>
                        <BidList 
                          projectId={project.id}
                          isOwner={true}
                          onBidAccepted={handleBidAccepted}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Диалог подтверждения удаления */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, projectId: null })}>
        <AlertDialogContent className="rounded-2xl max-w-md">
          <AlertDialogHeader>
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-red-100 to-red-50 rounded-full flex items-center justify-center mb-6">
              <Trash2 className="h-10 w-10 text-red-600" />
            </div>
            <AlertDialogTitle className="text-center text-2xl font-bold text-gray-900">
              Удалить проект?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-gray-600 text-lg">
              Это действие нельзя отменить. Все данные проекта будут безвозвратно удалены.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-3">
            <AlertDialogCancel className="flex-1 h-12 rounded-xl border-gray-300 hover:bg-gray-50">
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.stopPropagation()
                if (deleteDialog.projectId) {
                  handleDelete(deleteDialog.projectId)
                }
              }}
              className="flex-1 h-12 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 rounded-xl shadow-lg"
            >
              Да, удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}