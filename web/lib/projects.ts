// /web/lib/projects.ts
export interface Project {
  id: string;
  title: string;
  description: string;
  detailed_description: string;
  category: string;
  subcategory: string | null;
  skills: string[];
  budget: number;
  budget_type: 'fixed' | 'hourly' | 'price_request';
  currency: string;
  status: 'draft' | 'published' | 'in_progress' | 'completed' | 'cancelled';
  client_id: string;
  
  // Локация
  is_remote: boolean;
  location_city: string | null;
  location_country: string | null;
  location_address: string | null;
  
  // Сроки
  deadline: string | null;
  estimated_duration: string;
  
  // Файлы
  images: string[];
  attachments: string[];
  
  // Флаги
  is_urgent: boolean;
  is_featured: boolean;
  
  // Счетчики
  proposals_count: number;
  views_count: number;
  
  // Даты
  created_at: string;
  updated_at: string;
  published_at: string | null;
  
  // Дополнительные поля из джоина
  client?: {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string | null;
  };
}

export interface CreateProjectInput {
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  budgetType: 'fixed' | 'hourly' | 'price_request';
  budgetAmount?: string;
  location: {
    isRemote: boolean;
    city?: string;
    cityName?: string;
    address?: string;
  };
  deadline?: Date;
  files?: File[];
  skills?: string[];
}

export interface UpdateProjectInput {
  title?: string;
  description?: string;
  category?: string;
  subcategory?: string;
  budget?: {
    type: 'fixed' | 'hourly' | 'price_request';
    amount?: number;
  };
  location?: {
    isRemote?: boolean;
    city?: string;
    address?: string;
  };
  deadline?: Date;
  skills?: string[];
  status?: string;
}

export interface FavoriteProject {
  id: string;
  user_id: string;
  project_id: string;
  created_at: string;
  project?: Project;
}

export const projectsAPI = {
  // Создать проект с загрузкой файлов
  async createProject(data: CreateProjectInput): Promise<{ success: boolean; data?: Project; message?: string }> {
    try {
      const formData = new FormData()
      
      // Добавляем текстовые поля
      formData.append('title', data.title)
      formData.append('description', data.description)
      formData.append('category', data.category)
      if (data.subcategory) {
        formData.append('subcategory', data.subcategory)
      }
      formData.append('budgetType', data.budgetType)
      if (data.budgetAmount) {
        formData.append('budgetAmount', data.budgetAmount)
      }
      formData.append('isRemote', data.location.isRemote.toString())
      if (data.location.city) {
        formData.append('city', data.location.city)
      }
      if (data.location.cityName) {
        formData.append('cityName', data.location.cityName)
      }
      if (data.location.address) {
        formData.append('address', data.location.address)
      }
      if (data.deadline) {
        formData.append('deadline', data.deadline.toISOString().split('T')[0])
      }
      if (data.skills && data.skills.length > 0) {
        formData.append('skills', JSON.stringify(data.skills))
      }
      
      // Добавляем файлы
      if (data.files && data.files.length > 0) {
        data.files.forEach(file => {
          formData.append('files', file)
        })
      }
      
      const response = await fetch('/api/projects', {
        method: 'POST',
        body: formData
      })
      
      return await response.json()
      
    } catch (error: any) {
      console.error('Ошибка создания проекта:', error)
      return {
        success: false,
        message: error.message || 'Ошибка создания проекта'
      }
    }
  },

  // Получить проект по ID
  async getProject(id: string): Promise<{ success: boolean; data?: Project; message?: string }> {
    try {
      const response = await fetch(`/api/projects/${id}`)
      return await response.json()
    } catch (error: any) {
      console.error('Ошибка получения проекта:', error)
      return {
        success: false,
        message: error.message || 'Ошибка получения проекта'
      }
    }
  },

  // Получить все проекты
  async getProjects(filters?: {
    page?: number;
    limit?: number;
    category?: string;
    minBudget?: number;
    maxBudget?: number;
    status?: string;
    search?: string;
    isRemote?: boolean;
    city?: string;
  }): Promise<{ success: boolean; data?: Project[]; pagination?: any; message?: string }> {
    try {
      const queryParams = new URLSearchParams()
      
      if (filters?.page) queryParams.append('page', filters.page.toString())
      if (filters?.limit) queryParams.append('limit', filters.limit.toString())
      if (filters?.category) queryParams.append('category', filters.category)
      if (filters?.minBudget) queryParams.append('minBudget', filters.minBudget.toString())
      if (filters?.maxBudget) queryParams.append('maxBudget', filters.maxBudget.toString())
      if (filters?.status) queryParams.append('status', filters.status)
      if (filters?.search) queryParams.append('search', filters.search)
      if (filters?.isRemote !== undefined) queryParams.append('isRemote', filters.isRemote.toString())
      if (filters?.city) queryParams.append('city', filters.city)
      
      const response = await fetch(`/api/projects?${queryParams}`)
      return await response.json()
      
    } catch (error: any) {
      console.error('Ошибка получения проектов:', error)
      return {
        success: false,
        message: error.message || 'Ошибка получения проектов'
      }
    }
  },

  // Получить проекты текущего пользователя
  async getMyProjects(): Promise<{ success: boolean; data?: Project[]; message?: string }> {
    try {
      const response = await fetch('/api/projects/me')
      return await response.json()
    } catch (error: any) {
      console.error('Ошибка получения моих проектов:', error)
      return {
        success: false,
        message: error.message || 'Ошибка получения проектов'
      }
    }
  },

  // Обновить проект
  async updateProject(id: string, data: UpdateProjectInput): Promise<{ success: boolean; data?: Project; message?: string }> {
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })
      return await response.json()
    } catch (error: any) {
      console.error('Ошибка обновления проекта:', error)
      return {
        success: false,
        message: error.message || 'Ошибка обновления проекта'
      }
    }
  },

  // Удалить проект
  async deleteProject(id: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
      })
      return await response.json()
    } catch (error: any) {
      console.error('Ошибка удаления проекта:', error)
      return {
        success: false,
        message: error.message || 'Ошибка удаления проекта'
      }
    }
  },

  // Загрузить дополнительные изображения к проекту
  async uploadProjectImages(projectId: string, files: File[]): Promise<{ success: boolean; urls?: string[]; message?: string }> {
    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('projectId', projectId)
        formData.append('fileType', 'project_image')
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })
        
        const result = await response.json()
        if (result.success) {
          return result.data.url
        }
        throw new Error(result.message || 'Ошибка загрузки')
      })
      
      const urls = await Promise.all(uploadPromises)
      
      // Обновляем проект с новыми изображениями
      const project = await this.getProject(projectId)
      if (project.success && project.data) {
        const updatedImages = [...project.data.images, ...urls]
        await this.updateProject(projectId, { 
          images: updatedImages 
        })
      }
      
      return {
        success: true,
        urls
      }
      
    } catch (error: any) {
      console.error('Ошибка загрузки изображений:', error)
      return {
        success: false,
        message: error.message || 'Ошибка загрузки изображений'
      }
    }
  },

  // Получить статистику проектов
  async getStats(): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const response = await fetch('/api/projects/stats')
      return await response.json()
    } catch (error: any) {
      console.error('Ошибка получения статистики:', error)
      return {
        success: false,
        message: error.message || 'Ошибка получения статистики'
      }
    }
  },

  // Избранные проекты
  async getFavorites(userId?: string): Promise<{ success: boolean; data?: Project[]; message?: string }> {
    try {
      const queryParams = new URLSearchParams()
      if (userId) {
        queryParams.append('userId', userId)
      }
      
      const response = await fetch(`/api/projects/favorites?${queryParams}`)
      return await response.json()
    } catch (error: any) {
      console.error('Ошибка получения избранных проектов:', error)
      return {
        success: false,
        message: error.message || 'Ошибка получения избранных проектов'
      }
    }
  },

  async addToFavorites(projectId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch('/api/projects/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId })
      })
      return await response.json()
    } catch (error: any) {
      console.error('Ошибка добавления в избранное:', error)
      return {
        success: false,
        message: error.message || 'Ошибка добавления в избранное'
      }
    }
  },

  async removeFromFavorites(projectId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`/api/projects/favorites/${projectId}`, {
        method: 'DELETE',
      })
      return await response.json()
    } catch (error: any) {
      console.error('Ошибка удаления из избранного:', error)
      return {
        success: false,
        message: error.message || 'Ошибка удаления из избранного'
      }
    }
  },

  async checkIsFavorite(projectId: string): Promise<{ success: boolean; isFavorite?: boolean; message?: string }> {
    try {
      const response = await fetch(`/api/projects/favorites/${projectId}/check`)
      return await response.json()
    } catch (error: any) {
      console.error('Ошибка проверки избранного:', error)
      return {
        success: false,
        message: error.message || 'Ошибка проверки избранного'
      }
    }
  },

  // Модерация текста проекта
  async moderateProjectText(text: string, options?: {
    strict?: boolean;
    mask?: boolean;
    returnStats?: boolean;
  }): Promise<{ 
    success: boolean; 
    data?: {
      isClean: boolean;
      score?: number;
      categories?: string[];
      violations?: Array<{
        word: string;
        category: string;
        severity: 'low' | 'medium' | 'high';
      }>;
      sanitizedText?: string;
      errors?: string[];
    }; 
    message?: string 
  }> {
    try {
      const response = await fetch('/api/moderation/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text,
          options 
        })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error: any) {
      console.error('Ошибка проверки текста:', error)
      return {
        success: false,
        message: error.message || 'Ошибка проверки текста'
      }
    }
  },

  // Предварительная проверка проекта перед публикацией
  async preValidateProject(data: {
    title: string;
    description: string;
    category: string;
    subcategory?: string;
  }): Promise<{ 
    success: boolean; 
    data?: {
      titleValid: boolean;
      descriptionValid: boolean;
      categoryValid: boolean;
      subcategoryValid: boolean;
      moderationResult?: {
        title?: any;
        description?: any;
      };
      errors: string[];
    }; 
    message?: string 
  }> {
    try {
      const response = await fetch('/api/projects/pre-validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error: any) {
      console.error('Ошибка предварительной проверки:', error)
      return {
        success: false,
        message: error.message || 'Ошибка предварительной проверки'
      }
    }
  },

  // Получить проекты с модерацией
  async getModeratedProjects(filters?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    isModerated?: boolean;
    hasViolations?: boolean;
  }): Promise<{ 
    success: boolean; 
    data?: Array<Project & {
      moderation_status?: 'pending' | 'approved' | 'rejected' | 'flagged';
      moderation_score?: number;
      moderation_violations?: string[];
    }>; 
    pagination?: any; 
    message?: string 
  }> {
    try {
      const queryParams = new URLSearchParams()
      
      if (filters?.page) queryParams.append('page', filters.page.toString())
      if (filters?.limit) queryParams.append('limit', filters.limit.toString())
      if (filters?.category) queryParams.append('category', filters.category)
      if (filters?.search) queryParams.append('search', filters.search)
      if (filters?.isModerated !== undefined) queryParams.append('isModerated', filters.isModerated.toString())
      if (filters?.hasViolations !== undefined) queryParams.append('hasViolations', filters.hasViolations.toString())
      
      const response = await fetch(`/api/projects/moderated?${queryParams}`)
      return await response.json()
      
    } catch (error: any) {
      console.error('Ошибка получения модерированных проектов:', error)
      return {
        success: false,
        message: error.message || 'Ошибка получения проектов'
      }
    }
  },

  // Проверить проект на модерацию (для администраторов)
  async checkProjectModeration(projectId: string): Promise<{ 
    success: boolean; 
    data?: {
      project: Project;
      moderationResult: {
        title: any;
        description: any;
        overallScore: number;
        status: 'clean' | 'warning' | 'violation' | 'severe';
        violations: Array<{
          field: 'title' | 'description';
          words: string[];
          score: number;
        }>;
      };
    }; 
    message?: string 
  }> {
    try {
      const response = await fetch(`/api/projects/${projectId}/moderation`)
      return await response.json()
    } catch (error: any) {
      console.error('Ошибка проверки модерации проекта:', error)
      return {
        success: false,
        message: error.message || 'Ошибка проверки модерации'
      }
    }
  },

  // Поиск проектов с учетом модерации
  async searchProjectsWithModeration(query: string, options?: {
    page?: number;
    limit?: number;
    safeOnly?: boolean;
  }): Promise<{ 
    success: boolean; 
    data?: Array<Project & {
      moderation_score?: number;
      is_clean?: boolean;
      match_score?: number;
    }>; 
    pagination?: any; 
    message?: string 
  }> {
    try {
      const queryParams = new URLSearchParams()
      queryParams.append('q', query)
      
      if (options?.page) queryParams.append('page', options.page.toString())
      if (options?.limit) queryParams.append('limit', options.limit.toString())
      if (options?.safeOnly !== undefined) queryParams.append('safeOnly', options.safeOnly.toString())
      
      const response = await fetch(`/api/projects/search-safe?${queryParams}`)
      return await response.json()
      
    } catch (error: any) {
      console.error('Ошибка безопасного поиска проектов:', error)
      return {
        success: false,
        message: error.message || 'Ошибка поиска проектов'
      }
    }
  }
}

// Вспомогательные функции для работы с избранными проектами
export async function toggleFavorite(projectId: string, isCurrentlyFavorite: boolean = false): Promise<boolean> {
  try {
    if (isCurrentlyFavorite) {
      const result = await projectsAPI.removeFromFavorites(projectId)
      return result.success
    } else {
      const result = await projectsAPI.addToFavorites(projectId)
      return result.success
    }
  } catch (error) {
    console.error('Ошибка переключения избранного:', error)
    return false
  }
}

export async function getFavoriteStatus(projectId: string): Promise<boolean> {
  try {
    const result = await projectsAPI.checkIsFavorite(projectId)
    return result.success && result.isFavorite === true
  } catch (error) {
    console.error('Ошибка получения статуса избранного:', error)
    return false
  }
}

// Вспомогательные функции для модерации
export async function validateProjectText(title: string, description: string): Promise<{
  titleValid: boolean;
  descriptionValid: boolean;
  titleResult?: any;
  descriptionResult?: any;
  errors: string[];
}> {
  const errors: string[] = []
  
  // Проверяем заголовок
  const titleResult = await projectsAPI.moderateProjectText(title)
  const titleValid = titleResult.success && titleResult.data?.isClean === true
  
  if (!titleValid) {
    errors.push('Заголовок содержит недопустимые слова')
  }
  
  // Проверяем описание
  const descriptionResult = await projectsAPI.moderateProjectText(description, { strict: true })
  const descriptionValid = descriptionResult.success && descriptionResult.data?.isClean === true
  
  if (!descriptionValid) {
    errors.push('Описание содержит недопустимые слова')
  }
  
  return {
    titleValid,
    descriptionValid,
    titleResult: titleResult.data,
    descriptionResult: descriptionResult.data,
    errors
  }
}

export async function getSanitizedProjectText(text: string): Promise<string | null> {
  try {
    const result = await projectsAPI.moderateProjectText(text, { mask: true })
    if (result.success && result.data?.sanitizedText) {
      return result.data.sanitizedText
    }
    return null
  } catch (error) {
    console.error('Ошибка получения очищенного текста:', error)
    return null
  }
}

// Создание клиента для Supabase (если используется)
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  return createSupabaseClient(supabaseUrl, supabaseKey)
}

// Альтернативная реализация getFavorites с Supabase
export async function getFavoritesSupabase(userId?: string): Promise<Project[]> {
  const supabase = createClient()
  
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser()
    userId = user?.id
  }

  if (!userId) {
    return []
  }

  // Получаем ID избранных проектов
  const { data: favorites, error: favoritesError } = await supabase
    .from('user_favorites')
    .select('project_id')
    .eq('user_id', userId)

  if (favoritesError || !favorites?.length) {
    return []
  }

  const projectIds = favorites.map(f => f.project_id)
  
  // Получаем проекты
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select(`
      *,
      client:users!projects_client_id_fkey (
        id,
        email,
        full_name,
        avatar_url
      )
    `)
    .in('id', projectIds)

  if (projectsError) {
    console.error('Ошибка получения проектов:', projectsError)
    return []
  }

  return projects as Project[]
}

// Экспорт для обратной совместимости
export { getFavoritesSupabase as getFavorites }