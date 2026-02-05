import { z } from 'zod'

// Базовые схемы валидации
export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  phone: z.string().optional(),
  full_name: z.string().min(2),
  role: z.enum(['customer', 'executor', 'admin']).default('customer'),
  avatar_url: z.string().url().optional().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  settings: z.record(z.any()).optional(),
})

export const orderSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(5000),
  budget: z.number().min(0),
  category_id: z.string().uuid(),
  status: z.enum(['draft', 'published', 'in_progress', 'completed', 'cancelled']).default('draft'),
  customer_id: z.string().uuid(),
  executor_id: z.string().uuid().optional().nullable(),
  deadline: z.string().datetime().optional().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  deleted_at: z.string().datetime().optional().nullable(),
})

export const bidSchema = z.object({
  id: z.string().uuid(),
  order_id: z.string().uuid(),
  executor_id: z.string().uuid(),
  price: z.number().min(0),
  description: z.string().min(10).max(1000),
  delivery_days: z.number().min(1).optional(),
  status: z.enum(['pending', 'accepted', 'rejected', 'withdrawn']).default('pending'),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export const paymentSchema = z.object({
  id: z.string().uuid(),
  order_id: z.string().uuid(),
  user_id: z.string().uuid(),
  amount: z.number().min(0),
  currency: z.string().default('RUB'),
  status: z.enum(['pending', 'paid', 'failed', 'refunded']).default('pending'),
  provider: z.enum(['yookassa', 'tinkoff', 'manual']),
  provider_payment_id: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export const notificationSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  type: z.enum([
    'order_created',
    'bid_received',
    'bid_accepted',
    'bid_rejected',
    'payment_success',
    'payment_failed',
    'system',
    'marketing',
  ]),
  title: z.string(),
  message: z.string(),
  is_read: z.boolean().default(false),
  metadata: z.record(z.any()).optional(),
  created_at: z.string().datetime(),
})

export const reviewSchema = z.object({
  id: z.string().uuid(),
  order_id: z.string().uuid(),
  reviewer_id: z.string().uuid(),
  reviewee_id: z.string().uuid(),
  rating: z.number().min(1).max(5),
  comment: z.string().min(10).max(1000).optional().nullable(),
  created_at: z.string().datetime(),
})

// TypeScript типы
export type User = z.infer<typeof userSchema>
export type Order = z.infer<typeof orderSchema>
export type Bid = z.infer<typeof bidSchema>
export type Payment = z.infer<typeof paymentSchema>
export type Notification = z.infer<typeof notificationSchema>
export type Review = z.infer<typeof reviewSchema>

export type OrderStatus = Order['status']
export type BidStatus = Bid['status']
export type PaymentStatus = Payment['status']
export type UserRole = User['role']
export type NotificationType = Notification['type']

// API ответы
export type ApiResponse<T = any> = {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: string
}

export type PaginatedResponse<T> = {
  items: T[]
  total: number
  page: number
  limit: number
  total_pages: number
}

export type QueryParams = {
  page?: number
  limit?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  search?: string
  category_id?: string
  status?: string
  min_price?: number
  max_price?: number
}

// Формы
export type RegisterFormData = {
  email: string
  password: string
  full_name: string
  phone?: string
  role: UserRole
  agree_to_terms: boolean
}

export type LoginFormData = {
  email: string
  password: string
  remember_me: boolean
}

export type OrderFormData = {
  title: string
  description: string
  budget: number
  category_id: string
  deadline?: string
  attachments?: File[]
}

export type BidFormData = {
  price: number
  description: string
  delivery_days?: number
}

export type ProfileFormData = {
  full_name: string
  phone?: string
  bio?: string
  skills?: string[]
  experience?: number
  portfolio_url?: string
  avatar?: File
}

// Сессия
export type AuthSession = {
  user: {
    id: string
    email: string
    user_metadata?: {
      full_name?: string
      phone?: string
      role?: UserRole
    }
  }
  expires_at?: number
}

// Утилитарные типы
export type WithId<T> = T & { id: string }
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type Nullable<T> = T | null