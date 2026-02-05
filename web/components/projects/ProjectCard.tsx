// /web/components/projects/ProjectCard.tsx - С ИЗБРАННЫМ И МОДЕРАЦИЕЙ

"use client"
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Calendar, 
  MapPin, 
  DollarSign, 
  User, 
  Clock, 
  Star, 
  Eye, 
  MessageSquare,
  Image as ImageIcon,
  Briefcase,
  Zap,
  Heart,
  Shield,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProjectCardProps {
  project: {
    id: string
    title: string
    description: string
    category: string
    subcategory?: string
    budget: number
    budget_display?: string
    city: string
    region: string
    urgent?: boolean
    remote?: boolean
    is_remote?: boolean
    is_urgent?: boolean
    createdAt: string
    created_at?: string
    created_at_formatted?: string
    deadline?: string
    status?: string
    skills?: string[]
    proposalsCount?: number
    views_count?: number
    views?: number
    images?: string[]
    user?: {
      id: string
      name: string
      avatar?: string
      rating?: number
      company_name?: string
    } | null
    
    // Новые поля для модерации
    moderation_status?: 'pending' | 'approved' | 'rejected' | 'flagged'
    moderation_score?: number
    is_clean?: boolean
    moderation_violations?: string[]
    
    // Поля для избранного
    is_favorite?: boolean
    favorite_id?: string
  }
  onViewDetails?: (id: string) => void
  onApply?: (id: string) => void
  onToggleFavorite?: (projectId: string, isFavorite: boolean) => Promise<void>
  showModerationInfo?: boolean
  showFavoriteButton?: boolean
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onViewDetails,
  onApply,
  onToggleFavorite,
  showModerationInfo = false,
  showFavoriteButton = true
}) => {
  // Состояние избранного
  const [isFavorite, setIsFavorite] = useState(project.is_favorite || false)
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false)
  const [favoriteId, setFavoriteId] = useState(project.favorite_id)

  // Загружаем статус избранного при монтировании
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      try {
        const response = await fetch(`/api/projects/favorites/${project.id}/check`)
        if (response.ok) {
          const data = await response.json()
          setIsFavorite(data.isFavorite || false)
          setFavoriteId(data.favoriteId)
        }
      } catch (error) {
        console.error('Ошибка проверки избранного:', error)
      }
    }

    checkFavoriteStatus()
  }, [project.id])

  // Форматирование даты
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short'
      })
    } catch {
      return dateString
    }
  }

  // Форматирование бюджета
  const formatBudget = (budget: number) => {
    if (!budget || budget === 0) return 'По договоренности'
    
    if (budget >= 1000000) {
      return `${(budget / 1000000).toFixed(1)} млн ₽`
    } else if (budget >= 1000) {
      return `${(budget / 1000).toFixed(0)} тыс ₽`
    }
    return `${budget} ₽`
  }

  // Определяем категорию
  const getCategoryName = (category: string) => {
    const categories: Record<string, string> = {
      'construction': 'Строительство',
      'it_tech': 'IT и технологии',
      'design': 'Дизайн',
      'marketing': 'Маркетинг',
      'content': 'Контент',
      'repair': 'Ремонт',
      'business': 'Бизнес',
      'events': 'Мероприятия',
      'beauty': 'Красота',
      'education': 'Образование',
      'consulting': 'Консалтинг',
      'transport': 'Транспорт',
      'delivery': 'Доставка',
      'cleaning': 'Уборка',
      'other': 'Другое'
    }
    return categories[category] || category
  }

  // Обработчик избранного
  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isTogglingFavorite) return
    
    setIsTogglingFavorite(true)
    const newFavoriteStatus = !isFavorite
    
    try {
      if (onToggleFavorite) {
        await onToggleFavorite(project.id, newFavoriteStatus)
      } else {
        const method = newFavoriteStatus ? 'POST' : 'DELETE'
        const url = newFavoriteStatus 
          ? '/api/projects/favorites' 
          : `/api/projects/favorites/${favoriteId || project.id}`
        
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: newFavoriteStatus ? JSON.stringify({ projectId: project.id }) : undefined
        })
        
        if (!response.ok) {
          throw new Error('Ошибка при обновлении избранного')
        }
      }
      
      setIsFavorite(newFavoriteStatus)
      
      // Обновляем favoriteId если добавляем
      if (newFavoriteStatus) {
        const checkResponse = await fetch(`/api/projects/favorites/${project.id}/check`)
        if (checkResponse.ok) {
          const data = await checkResponse.json()
          setFavoriteId(data.favoriteId)
        }
      } else {
        setFavoriteId(undefined)
      }
      
    } catch (error) {
      console.error('Ошибка переключения избранного:', error)
    } finally {
      setIsTogglingFavorite(false)
    }
  }

  const isUrgent = project.urgent || project.is_urgent
  const isRemote = project.remote || project.is_remote
  const hasImages = project.images && project.images.length > 0
  const displayDate = project.created_at_formatted || formatDate(project.created_at || project.CreatedAt)
  const displayBudget = project.budget_display || formatBudget(project.budget)
  const proposalsCount = project.proposalsCount || 0
  const viewsCount = project.views_count || project.views || 0
  const skills = project.skills || []

  // Модерационные статусы
  const moderationStatus = project.moderation_status
  const moderationScore = project.moderation_score
  const isClean = project.is_clean
  const violations = project.moderation_violations || []

  // Определение цвета для модерации
  const getModerationColor = () => {
    if (moderationStatus === 'rejected' || (moderationScore && moderationScore > 70)) {
      return 'text-red-600 bg-red-50 border-red-200'
    }
    if (moderationStatus === 'flagged' || (moderationScore && moderationScore > 30)) {
      return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    }
    if (moderationStatus === 'approved' || isClean === true) {
      return 'text-green-600 bg-green-50 border-green-200'
    }
    return 'text-gray-600 bg-gray-50 border-gray-200'
  }

  // Иконка для модерации
  const getModerationIcon = () => {
    if (moderationStatus === 'rejected' || (moderationScore && moderationScore > 70)) {
      return <ShieldAlert className="h-3 w-3" />
    }
    if (moderationStatus === 'flagged' || (moderationScore && moderationScore > 30)) {
      return <Shield className="h-3 w-3" />
    }
    if (moderationStatus === 'approved' || isClean === true) {
      return <ShieldCheck className="h-3 w-3" />
    }
    return <Shield className="h-3 w-3" />
  }

  // Текст для модерации
  const getModerationText = () => {
    if (moderationStatus === 'rejected') return 'Заблокирован'
    if (moderationStatus === 'flagged') return 'На проверке'
    if (moderationStatus === 'approved') return 'Проверен'
    if (isClean === false) return 'Нарушения'
    if (moderationScore && moderationScore > 70) return 'Опасный контент'
    if (moderationScore && moderationScore > 30) return 'Проверяется'
    return 'Безопасный'
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 border-gray-200 hover:border-blue-300 group relative">
      {/* Кнопка избранного */}
      {showFavoriteButton && (
        <button
          onClick={handleToggleFavorite}
          disabled={isTogglingFavorite}
          className={cn(
            "absolute top-3 right-3 z-10 p-1.5 rounded-full transition-all duration-200",
            "hover:scale-110 active:scale-95",
            isFavorite 
              ? "text-red-500 bg-red-50 hover:bg-red-100" 
              : "text-gray-400 bg-white/80 hover:bg-gray-100 hover:text-red-400",
            "shadow-sm"
          )}
          aria-label={isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
        >
          {isTogglingFavorite ? (
            <div className="h-4 w-4 animate-pulse bg-gray-300 rounded-full" />
          ) : (
            <Heart 
              size={16} 
              fill={isFavorite ? "currentColor" : "none"}
              className={isFavorite ? "fill-current" : ""}
            />
          )}
        </button>
      )}

      {/* Бейдж модерации */}
      {showModerationInfo && (
        <div className="absolute top-3 left-3 z-10">
          <Badge 
            variant="outline" 
            className={cn(
              "text-xs font-medium flex items-center gap-1",
              getModerationColor()
            )}
          >
            {getModerationIcon()}
            <span>{getModerationText()}</span>
          </Badge>
        </div>
      )}

      {/* Предупреждение о нарушениях */}
      {violations.length > 0 && showModerationInfo && (
        <div className="absolute top-10 left-3 right-3 z-10">
          <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-xs">
            <div className="flex items-center gap-1 text-red-700 font-medium">
              <ShieldAlert className="h-3 w-3" />
              Обнаружены нарушения
            </div>
            <p className="text-red-600 text-xs mt-1 truncate">
              {violations.join(', ')}
            </p>
          </div>
        </div>
      )}

      <CardContent className="p-0">
        {/* Изображения проекта */}
        {hasImages ? (
          <div className="relative h-48 w-full overflow-hidden">
            <img
              src={project.images[0]}
              alt={project.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.currentTarget.src = 'https://placehold.co/600x400/e2e8f0/94a3b8?text=Project+Photo'
              }}
            />
            
            {/* Кнопка избранного поверх изображения */}
            {showFavoriteButton && (
              <button
                type="button"
                onClick={handleToggleFavorite}
                disabled={isTogglingFavorite}
                className={cn(
                  "absolute top-2 right-2 p-2 bg-white/90 backdrop-blur-sm rounded-full transition-all duration-200",
                  "hover:scale-110 active:scale-95 hover:bg-white",
                  isTogglingFavorite ? "opacity-70 cursor-not-allowed" : ""
                )}
                aria-label={isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
              >
                <Heart 
                  size={18} 
                  fill={isFavorite ? 'red' : 'none'} 
                  color={isFavorite ? 'red' : 'gray'} 
                  className={isTogglingFavorite ? 'animate-pulse' : ''}
                />
              </button>
            )}
            
            {project.images.length > 1 && (
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                +{project.images.length - 1}
              </div>
            )}
          </div>
        ) : (
          <div className="h-48 w-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative">
            <div className="text-center">
              <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Нет фотографий</p>
            </div>
            
            {/* Кнопка избранного для случая без изображений */}
            {showFavoriteButton && (
              <button
                type="button"
                onClick={handleToggleFavorite}
                disabled={isTogglingFavorite}
                className={cn(
                  "absolute top-2 right-2 p-2 bg-white/90 backdrop-blur-sm rounded-full transition-all duration-200",
                  "hover:scale-110 active:scale-95 hover:bg-white",
                  isTogglingFavorite ? "opacity-70 cursor-not-allowed" : ""
                )}
                aria-label={isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
              >
                <Heart 
                  size={18} 
                  fill={isFavorite ? 'red' : 'none'} 
                  color={isFavorite ? 'red' : 'gray'} 
                  className={isTogglingFavorite ? 'animate-pulse' : ''}
                />
              </button>
            )}
          </div>
        )}

        {/* Заголовок и категория */}
        <div className="p-4 border-b">
          <div className="flex items-start justify-between mb-2">
            <Badge variant="outline" className="text-xs font-medium bg-blue-50 text-blue-700 border-blue-200">
              <Briefcase className="h-3 w-3 mr-1" />
              {getCategoryName(project.category)}
            </Badge>
            
            <div className="flex gap-1">
              {isUrgent && (
                <Badge variant="destructive" className="text-xs animate-pulse flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Срочно
                </Badge>
              )}
              {isRemote && (
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 border-green-200">
                  Удалённо
                </Badge>
              )}
            </div>
          </div>
          
          <h3 
            className="font-semibold text-gray-900 line-clamp-2 text-sm leading-snug hover:text-blue-600 cursor-pointer"
            onClick={() => onViewDetails?.(project.id)}
          >
            {project.title}
          </h3>
        </div>

        {/* Описание */}
        <div className="p-4">
          <p className="text-gray-600 text-sm line-clamp-2 mb-3">
            {project.description}
          </p>

          {/* Навыки */}
          {skills.length > 0 && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-1">
                {skills.slice(0, 3).map((skill, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md hover:bg-gray-200 transition-colors"
                  >
                    {skill}
                  </span>
                ))}
                {skills.length > 3 && (
                  <span className="text-xs text-gray-500">
                    +{skills.length - 3}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Информация о проекте */}
          <div className="space-y-2">
            {/* Локация */}
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <span className="text-gray-700 truncate">
                {project.city || project.region || 'Не указано'}
                {isRemote && project.city && ' • Удаленно'}
              </span>
            </div>
            
            {/* Бюджет */}
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <span className="font-semibold text-gray-900">
                {displayBudget}
              </span>
            </div>
            
            {/* Дата публикации */}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <span className="text-gray-700">
                {displayDate}
              </span>
            </div>
            
            {/* Дедлайн */}
            {project.deadline && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                <span className="text-gray-700">
                  Дедлайн: {formatDate(project.deadline)}
                </span>
              </div>
            )}
            
            {/* Статистика */}
            <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t">
              {/* Рейтинг клиента */}
              {project.user?.rating && project.user.rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                  <span>{project.user.rating.toFixed(1)}</span>
                </div>
              )}
              
              {/* Количество заявок */}
              <div className="flex items-center gap-1">
                <User className="h-3 w-3 text-gray-400" />
                <span>{proposalsCount}</span>
              </div>
              
              {/* Просмотры */}
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3 text-gray-400" />
                <span>{viewsCount}</span>
              </div>

              {/* Счетчик избранного (опционально) */}
              {showFavoriteButton && isFavorite && (
                <div className="flex items-center gap-1">
                  <Heart className="h-3 w-3 text-red-400" size={12} />
                  <span>В избранном</span>
                </div>
              )}
            </div>

            {/* Клиент */}
            {project.user && (
              <div className="flex items-center gap-2 text-sm pt-2 border-t">
                <div className="flex items-center gap-2">
                  {project.user.avatar ? (
                    <img 
                      src={project.user.avatar} 
                      alt={project.user.name}
                      className="h-6 w-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-600">
                        {project.user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span className="text-gray-700 truncate">
                    {project.user.name}
                    {project.user.company_name && ` • ${project.user.company_name}`}
                  </span>
                </div>
              </div>
            )}

            {/* Дополнительная информация о модерации */}
            {showModerationInfo && moderationScore !== undefined && (
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Безопасность контента:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full",
                          moderationScore > 70 
                            ? "bg-red-500" 
                            : moderationScore > 30 
                              ? "bg-yellow-500" 
                              : "bg-green-500"
                        )}
                        style={{ width: `${Math.min(moderationScore, 100)}%` }}
                      />
                    </div>
                    <span className={cn(
                      "font-medium text-xs",
                      moderationScore > 70 
                        ? "text-red-600" 
                        : moderationScore > 30 
                          ? "text-yellow-600" 
                          : "text-green-600"
                    )}>
                      {moderationScore}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <div className="flex gap-2 w-full">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-sm h-9 hover:bg-gray-50"
            onClick={() => onViewDetails?.(project.id)}
          >
            Подробнее
          </Button>
          <Button
            size="sm"
            className="flex-1 text-sm h-9 bg-blue-600 hover:bg-blue-700"
            onClick={() => onApply?.(project.id)}
            disabled={moderationStatus === 'rejected'}
          >
            <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
            {moderationStatus === 'rejected' ? 'Заблокирован' : 'Откликнуться'}
          </Button>
        </div>

        {/* Предупреждение для заблокированных проектов */}
        {moderationStatus === 'rejected' && (
          <div className="mt-2 w-full">
            <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-700">
              <div className="flex items-center gap-1">
                <ShieldAlert className="h-3 w-3" />
                <span className="font-medium">Проект заблокирован</span>
              </div>
              <p className="mt-1 text-red-600">
                Содержит недопустимый контент
              </p>
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}

// Компонент для списка избранных проектов
interface FavoriteProjectsListProps {
  projects: any[]
  onToggleFavorite: (projectId: string, isFavorite: boolean) => Promise<void>
  onViewDetails: (projectId: string) => void
  onApply: (projectId: string) => void
}

export const FavoriteProjectsList: React.FC<FavoriteProjectsListProps> = ({
  projects,
  onToggleFavorite,
  onViewDetails,
  onApply
}) => {
  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Нет избранных проектов
        </h3>
        <p className="text-gray-600 max-w-md mx-auto">
          Добавляйте проекты в избранное, чтобы вернуться к ним позже
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onViewDetails={onViewDetails}
          onApply={onApply}
          onToggleFavorite={onToggleFavorite}
          showFavoriteButton={true}
          showModerationInfo={true}
        />
      ))}
    </div>
  )
}

// Компонент для отображения только безопасных проектов
interface SafeProjectsListProps {
  projects: any[]
  onToggleFavorite?: (projectId: string, isFavorite: boolean) => Promise<void>
  onViewDetails: (projectId: string) => void
  onApply: (projectId: string) => void
  showOnlyClean?: boolean
}

export const SafeProjectsList: React.FC<SafeProjectsListProps> = ({
  projects,
  onToggleFavorite,
  onViewDetails,
  onApply,
  showOnlyClean = true
}) => {
  // Фильтруем проекты по безопасности
  const safeProjects = showOnlyClean 
    ? projects.filter(p => 
        p.moderation_status === 'approved' || 
        p.is_clean === true || 
        (p.moderation_score !== undefined && p.moderation_score < 30)
      )
    : projects

  if (safeProjects.length === 0) {
    return (
      <div className="text-center py-12">
        <ShieldCheck className="h-16 w-16 text-green-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {showOnlyClean ? 'Нет безопасных проектов' : 'Нет проектов'}
        </h3>
        <p className="text-gray-600 max-w-md mx-auto">
          {showOnlyClean 
            ? 'Все проекты содержат потенциально опасный контент' 
            : 'Проекты не найдены'
          }
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {safeProjects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onViewDetails={onViewDetails}
          onApply={onApply}
          onToggleFavorite={onToggleFavorite}
          showFavoriteButton={true}
          showModerationInfo={true}
        />
      ))}
    </div>
  )
}


export default ProjectCard
