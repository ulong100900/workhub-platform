export interface Project {
  id: string
  title: string
  description: string
  detailed_description?: string
  category: string
  subcategory?: string
  skills: string[]
  budget: number
  budgetType?: 'fixed' | 'hourly' | 'price_request'
  currency: 'RUB' | 'USD' | 'EUR'
  status: 'draft' | 'published' | 'in_progress' | 'completed' | 'cancelled'
  visibility: 'public' | 'private'
  client_id: string
  client?: {
    id: string
    name: string
    avatar?: string
    rating: number
    reviews: number
  }
  freelancer_id?: string
  freelancer?: {
    id: string
    name: string
    avatar?: string
    rating: number
  }
  location?: {
    city?: string
    country?: string
    isRemote: boolean
  }
  attachments?: string[]
  images?: string[]
  timeline?: {
    startDate?: string
    endDate?: string
    estimatedDuration: string
  }
  proposals_count: number
  views_count: number
  is_urgent: boolean
  is_featured: boolean
  created_at: string
  updated_at: string
  published_at?: string
  expires_at?: string
  selected_bid_id?: string
  bids_count?: number
  avg_bid_amount?: number
  tags?: string[]
  latitude?: number
  longitude?: number
  address?: string
  city?: string
  region?: string
  country?: string
  formatted_address?: string
  deadline?: string
  is_remote?: boolean
  canEdit?: boolean
  canDelete?: boolean
}

export interface CreateProjectInput {
  title: string
  description: string
  detailedDescription?: string
  category: string
  subcategory?: string
  skills: string[]
  budget: {
    amount: number
    type: 'fixed' | 'hourly' | 'price_request'
    currency?: 'RUB' | 'USD' | 'EUR'
  }
  location?: {
    city?: string
    country?: string
    isRemote: boolean
  }
  timeline?: {
    estimatedDuration: string
    startDate?: string
  }
  attachments?: string[]
  images?: string[]
  isUrgent?: boolean
}

export interface UpdateProjectInput {
  title?: string
  description?: string
  detailed_description?: string
  category?: string
  subcategory?: string
  skills?: string[]
  budget?: number
  budgetType?: 'fixed' | 'hourly' | 'price_request'
  currency?: 'RUB' | 'USD' | 'EUR'
  status?: string
  location?: {
    city?: string
    region?: string
    country?: string
    isRemote?: boolean
  }
  timeline?: {
    estimatedDuration?: string
    startDate?: string
    endDate?: string
  }
  attachments?: string[]
  images?: string[]
  existingImages?: string[]
  is_urgent?: boolean
  is_featured?: boolean
  deadline?: string
  address?: string
  is_remote?: boolean
}

export interface Bid {
  id: string
  project_id: string
  freelancer_id: string
  freelancer?: {
    id: string
    name: string
    avatar?: string
    rating: number
    reviews: number
    completed_projects: number
  }
  amount: number
  description: string
  timeline: string
  is_hourly: boolean
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn'
  created_at: string
  updated_at: string
}

export interface ProjectStats {
  total: number
  active: number
  completed: number
  pending: number
  total_budget: number
  average_budget: number
  success_rate: number
}

export interface ProjectPermissions {
  canEdit: boolean
  canDelete: boolean
  canPublish: boolean
  canCancel: boolean
  canComplete: boolean
}

// Добавьте в конец файла project.types.ts
export interface ProjectFromDB {
  id: string
  title: string
  description: string
  detailed_description?: string
  category: string
  subcategory?: string
  skills: string[]
  budget: number
  budget_type?: 'fixed' | 'hourly' | 'price_request'
  currency: 'RUB' | 'USD' | 'EUR'
  status: 'draft' | 'published' | 'in_progress' | 'completed' | 'cancelled'
  client_id: string
  freelancer_id?: string
  city?: string
  region?: string
  country?: string
  address?: string
  formatted_address?: string
  latitude?: number
  longitude?: number
  is_remote?: boolean
  is_urgent: boolean
  is_featured: boolean
  deadline?: string
  views_count: number
  proposals_count: number
  created_at: string
  updated_at: string
  published_at?: string
  expires_at?: string
  selected_bid_id?: string
}

// Или переделайте основной интерфейс Project:
export interface Project {
  id: string
  title: string
  description: string
  detailed_description?: string // ← измените detailedDescription на detailed_description
  category: string
  subcategory?: string
  skills: string[]
  budget: number
  budget_type?: 'fixed' | 'hourly' | 'price_request' // ← измените budgetType на budget_type
  currency: 'RUB' | 'USD' | 'EUR'
  status: 'draft' | 'published' | 'in_progress' | 'completed' | 'cancelled'
  client_id: string
  freelancer_id?: string
  city?: string
  region?: string
  country?: string
  address?: string
  formatted_address?: string
  latitude?: number
  longitude?: number
  is_remote?: boolean
  is_urgent: boolean
  is_featured: boolean
  deadline?: string
  views_count: number
  proposals_count: number
  created_at: string
  updated_at: string
  published_at?: string
  expires_at?: string
  selected_bid_id?: string
  // Опционально - могут быть загружены отдельно
  client?: {
    id: string
    name: string
    avatar?: string
    rating: number
    reviews: number
  }
  freelancer?: {
    id: string
    name: string
    avatar?: string
    rating: number
  }
  bids_count?: number
}