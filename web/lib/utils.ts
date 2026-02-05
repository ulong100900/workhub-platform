// lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Типы для фильтров
export interface FilterState {
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

// Функция для сохранения фильтров в URL
export function saveFiltersToURL(filters: FilterState) {
  if (typeof window === 'undefined') return
  
  const params = new URLSearchParams()
  
  // Бюджет
  if (filters.budget.min > 0) {
    params.set('budget_min', filters.budget.min.toString())
  }
  if (filters.budget.max < 500000) {
    params.set('budget_max', filters.budget.max.toString())
  }
  
  // Дедлайн
  if (filters.deadline) {
    params.set('deadline', filters.deadline)
  }
  
  // Массивы
  const arrayFilters = [
    'experienceLevel',
    'skills', 
    'location',
    'projectType',
    'status'
  ] as const
  
  arrayFilters.forEach(key => {
    if (filters[key].length > 0) {
      params.set(key, filters[key].join(','))
    }
  })
  
  const newUrl = params.toString() 
    ? `${window.location.pathname}?${params.toString()}`
    : window.location.pathname
  
  window.history.pushState({}, '', newUrl)
}

// Функция для загрузки фильтров из URL
export function loadFiltersFromURL(): FilterState {
  if (typeof window === 'undefined') {
    return {
      budget: { min: 0, max: 500000 },
      deadline: null,
      experienceLevel: [],
      skills: [],
      location: [],
      projectType: [],
      status: []
    }
  }
  
  const params = new URLSearchParams(window.location.search)
  const filters: FilterState = {
    budget: { 
      min: parseInt(params.get('budget_min') || '0'),
      max: parseInt(params.get('budget_max') || '500000')
    },
    deadline: params.get('deadline'),
    experienceLevel: params.get('experienceLevel')?.split(',') || [],
    skills: params.get('skills')?.split(',') || [],
    location: params.get('location')?.split(',') || [],
    projectType: params.get('projectType')?.split(',') || [],
    status: params.get('status')?.split(',') || []
  }
  
  return filters
}

// Утилиты для проверки прав на проекты
export function canEditProject(project: any, userId: string): boolean {
  if (!project || !userId) return false
  if (project.client_id !== userId) return false
  return ['draft', 'published'].includes(project.status)
}

export function canDeleteProject(project: any, userId: string): boolean {
  if (!project || !userId) return false
  if (project.client_id !== userId) return false
  return ['draft', 'published'].includes(project.status)
}

// Форматирование даты
export function formatDate(dateString: string, formatType: 'short' | 'long' = 'short'): string {
  try {
    const date = new Date(dateString)
    
    if (formatType === 'short') {
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    } else {
      return date.toLocaleDateString('ru-RU', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    }
  } catch {
    return 'Некорректная дата'
  }
}

// Форматирование бюджета
export function formatBudget(budget: number, currency: string = 'RUB'): string {
  if (!budget || budget === 0) return 'По договоренности'
  
  const formatter = new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })
  
  return formatter.format(budget)
}

// Валидация email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Валидация телефона
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/
  return phoneRegex.test(phone.replace(/\D/g, ''))
}

// Создание slug
export function createSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim()
}