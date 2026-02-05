// components/projects/AdvancedFilters.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { 
  X, 
  Filter, 
  DollarSign, 
  Calendar, 
  Target, 
  Tag,
  Clock,
  Star,
  Users,
  MapPin,
  Save,
  Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface FilterState {
  budget: {
    min: number
    max: number
  }
  deadline: string | null
  experienceLevel: string[]
  skills: string[]
  location: string[]
  projectType: string[]
  status: string[]
}

interface AdvancedFiltersProps {
  isOpen: boolean
  onClose: () => void
  onApplyFilters: (filters: FilterState) => void
  initialFilters?: FilterState
}

const experienceLevels = [
  { id: 'entry', label: 'Начальный уровень' },
  { id: 'intermediate', label: 'Средний уровень' },
  { id: 'expert', label: 'Эксперт' },
]

const projectTypes = [
  { id: 'fixed', label: 'Фиксированная цена' },
  { id: 'hourly', label: 'Почасовая оплата' },
  { id: 'milestone', label: 'По этапам' },
]

const statuses = [
  { id: 'urgent', label: 'Срочные', color: 'text-red-600' },
  { id: 'featured', label: 'Рекомендуемые', color: 'text-yellow-600' },
  { id: 'guaranteed', label: 'С гарантией', color: 'text-green-600' },
]

const popularSkills = [
  'React', 'TypeScript', 'Next.js', 'Node.js', 'Python',
  'UI/UX Design', 'Figma', 'WordPress', 'SEO', 'Content Writing',
  'Mobile Development', 'API Integration', 'Database Design', 'DevOps'
]

const locations = [
  'Удаленно', 'Москва', 'Санкт-Петербург', 'Новосибирск',
  'Екатеринбург', 'Казань', 'Любой город', 'Зарубеж'
]

const deadlineOptions = [
  { value: '3', label: 'До 3 дней' },
  { value: '7', label: 'До недели' },
  { value: '14', label: 'До 2 недель' },
  { value: '30', label: 'До месяца' },
]

export default function AdvancedFilters({ 
  isOpen, 
  onClose, 
  onApplyFilters,
  initialFilters 
}: AdvancedFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    budget: { min: 0, max: 500000 },
    deadline: null,
    experienceLevel: [],
    skills: [],
    location: [],
    projectType: [],
    status: []
  })

  const [tempBudget, setTempBudget] = useState([0, 500000])

  useEffect(() => {
    if (initialFilters) {
      setFilters(initialFilters)
      setTempBudget([initialFilters.budget.min, initialFilters.budget.max])
    }
  }, [initialFilters])

  // Закрытие по ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const handleSkillToggle = (skill: string) => {
    setFilters(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }))
  }

  const handleExperienceToggle = (level: string) => {
    setFilters(prev => ({
      ...prev,
      experienceLevel: prev.experienceLevel.includes(level)
        ? prev.experienceLevel.filter(l => l !== level)
        : [...prev.experienceLevel, level]
    }))
  }

  const handleLocationToggle = (location: string) => {
    setFilters(prev => ({
      ...prev,
      location: prev.location.includes(location)
        ? prev.location.filter(l => l !== location)
        : [...prev.location, location]
    }))
  }

  const handleProjectTypeToggle = (type: string) => {
    setFilters(prev => ({
      ...prev,
      projectType: prev.projectType.includes(type)
        ? prev.projectType.filter(t => t !== type)
        : [...prev.projectType, type]
    }))
  }

  const handleStatusToggle = (status: string) => {
    setFilters(prev => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...prev.status, status]
    }))
  }

  const handleDeadlineToggle = (value: string) => {
    setFilters(prev => ({
      ...prev,
      deadline: prev.deadline === value ? null : value
    }))
  }

  const handleBudgetChange = (value: number[]) => {
    setTempBudget(value)
    setFilters(prev => ({
      ...prev,
      budget: { min: value[0], max: value[1] }
    }))
  }

  const handleClearAll = () => {
    const defaultFilters = {
      budget: { min: 0, max: 500000 },
      deadline: null,
      experienceLevel: [],
      skills: [],
      location: [],
      projectType: [],
      status: []
    }
    setFilters(defaultFilters)
    setTempBudget([0, 500000])
  }

  const handleApply = () => {
    onApplyFilters(filters)
    onClose()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 0
    }).format(amount) + ' ₽'
  }

  const hasActiveFilters = () => {
    return filters.experienceLevel.length > 0 ||
      filters.skills.length > 0 ||
      filters.location.length > 0 ||
      filters.projectType.length > 0 ||
      filters.status.length > 0 ||
      filters.deadline !== null ||
      filters.budget.min > 0 ||
      filters.budget.max < 500000
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative z-50 w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden rounded-xl bg-white shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-6">
          <div className="flex items-center gap-3">
            <Filter className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold">Расширенная фильтрация</h2>
            {hasActiveFilters() && (
              <Badge variant="secondary" className="ml-2">
                {Object.values(filters).reduce((acc, val) => {
                  if (Array.isArray(val)) return acc + val.length
                  if (typeof val === 'object' && val !== null) {
                    if ('min' in val && val.min > 0) acc++
                    if ('max' in val && val.max < 500000) acc++
                    return acc
                  }
                  return val ? acc + 1 : acc
                }, 0)} активных
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          <div className="space-y-8">
            {/* Бюджет */}
            <div>
              <div className="mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-gray-500" />
                <h3 className="text-lg font-medium">Бюджет проекта</h3>
                <span className="ml-auto text-sm font-medium text-gray-700">
                  {formatCurrency(tempBudget[0])} - {formatCurrency(tempBudget[1])}
                </span>
              </div>
              <div className="px-2">
                <Slider
                  value={tempBudget}
                  onValueChange={handleBudgetChange}
                  min={0}
                  max={500000}
                  step={1000}
                />
              </div>
              <div className="mt-4 flex justify-between text-sm text-gray-500">
                <span>0 ₽</span>
                <span>500 000 ₽</span>
              </div>
            </div>

            {/* Срок выполнения */}
            <div>
              <div className="mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-500" />
                <h3 className="text-lg font-medium">Срок выполнения</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {deadlineOptions.map((item) => (
                  <Button
                    key={item.value}
                    type="button"
                    variant={filters.deadline === item.value ? "default" : "outline"}
                    onClick={() => handleDeadlineToggle(item.value)}
                    className="justify-start h-auto py-3"
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Уровень опыта */}
            <div>
              <div className="mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-gray-500" />
                <h3 className="text-lg font-medium">Уровень опыта</h3>
              </div>
              <div className="flex flex-wrap gap-3">
                {experienceLevels.map((level) => (
                  <Button
                    key={level.id}
                    type="button"
                    variant={filters.experienceLevel.includes(level.id) ? "default" : "outline"}
                    onClick={() => handleExperienceToggle(level.id)}
                    className={cn(
                      "h-auto py-2",
                      level.id === 'entry' && filters.experienceLevel.includes(level.id) && "bg-green-500 hover:bg-green-600",
                      level.id === 'intermediate' && filters.experienceLevel.includes(level.id) && "bg-blue-500 hover:bg-blue-600",
                      level.id === 'expert' && filters.experienceLevel.includes(level.id) && "bg-purple-500 hover:bg-purple-600"
                    )}
                  >
                    <Star className="mr-2 h-4 w-4" />
                    {level.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Навыки и технологии */}
            <div>
              <div className="mb-4 flex items-center gap-2">
                <Tag className="h-5 w-5 text-gray-500" />
                <h3 className="text-lg font-medium">Навыки и технологии</h3>
                <span className="ml-auto text-sm text-gray-500">
                  Выбрано: {filters.skills.length}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {popularSkills.map((skill) => (
                  <Badge
                    key={skill}
                    variant={filters.skills.includes(skill) ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer px-3 py-1.5 text-sm",
                      filters.skills.includes(skill) && "bg-primary hover:bg-primary/90"
                    )}
                    onClick={() => handleSkillToggle(skill)}
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Локация */}
            <div>
              <div className="mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-gray-500" />
                <h3 className="text-lg font-medium">Локация</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {locations.map((location) => (
                  <Button
                    key={location}
                    type="button"
                    variant={filters.location.includes(location) ? "default" : "outline"}
                    onClick={() => handleLocationToggle(location)}
                    className="justify-start h-auto py-3"
                  >
                    {location}
                  </Button>
                ))}
              </div>
            </div>

            {/* Тип проекта и статус */}
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="mb-3 text-lg font-medium">Тип проекта</h3>
                <div className="space-y-2">
                  {projectTypes.map((type) => (
                    <div
                      key={type.id}
                      className={cn(
                        "flex items-center rounded-lg border p-3 cursor-pointer transition-all hover:border-primary",
                        filters.projectType.includes(type.id)
                          ? "border-primary bg-primary/5"
                          : "hover:bg-gray-50"
                      )}
                      onClick={() => handleProjectTypeToggle(type.id)}
                    >
                      <div className={cn(
                        "mr-3 h-5 w-5 rounded-full border flex items-center justify-center",
                        filters.projectType.includes(type.id)
                          ? "border-primary bg-primary"
                          : "border-gray-300"
                      )}>
                        {filters.projectType.includes(type.id) && (
                          <div className="h-2 w-2 rounded-full bg-white" />
                        )}
                      </div>
                      <span className={cn(
                        filters.projectType.includes(type.id) && "font-medium"
                      )}>
                        {type.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-lg font-medium">Дополнительно</h3>
                <div className="space-y-2">
                  {statuses.map((status) => (
                    <div
                      key={status.id}
                      className={cn(
                        "flex items-center rounded-lg border p-3 cursor-pointer transition-all hover:border-primary",
                        filters.status.includes(status.id)
                          ? "border-primary bg-primary/5"
                          : "hover:bg-gray-50"
                      )}
                      onClick={() => handleStatusToggle(status.id)}
                    >
                      <div className={cn(
                        "mr-3 h-5 w-5 rounded-full border flex items-center justify-center",
                        filters.status.includes(status.id)
                          ? "border-primary bg-primary"
                          : "border-gray-300"
                      )}>
                        {filters.status.includes(status.id) && (
                          <div className="h-2 w-2 rounded-full bg-white" />
                        )}
                      </div>
                      <span className={cn(
                        filters.status.includes(status.id) && "font-medium",
                        status.color
                      )}>
                        {status.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t bg-white p-6">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handleClearAll}
              className="text-gray-500 hover:text-gray-700"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Очистить все
            </Button>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
              >
                Отмена
              </Button>
              <Button
                onClick={handleApply}
                className="min-w-[120px]"
              >
                <Filter className="mr-2 h-4 w-4" />
                Применить фильтры
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}