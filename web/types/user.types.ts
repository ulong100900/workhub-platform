import { z } from 'zod'

export const userRoleSchema = z.enum(['customer', 'executor', 'admin'])

export const userStatusSchema = z.enum([
  'active',
  'inactive',
  'suspended',
  'pending_verification',
])

export const userProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  phone: z.string().optional(),
  full_name: z.string().min(2),
  avatar_url: z.string().url().optional().nullable(),
  bio: z.string().max(1000).optional(),
  role: userRoleSchema,
  status: userStatusSchema.default('active'),
  skills: z.array(z.string()).optional(),
  experience_years: z.number().min(0).optional(),
  rating: z.number().min(0).max(5).default(0),
  completed_orders: z.number().default(0),
  balance: z.number().default(0),
  subscription_tier: z.string().optional(),
  notification_settings: z.record(z.any()).optional(),
  preferences: z.record(z.any()).optional(),
  last_seen: z.string().datetime().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export const userStatsSchema = z.object({
  total_orders: z.number(),
  completed_orders: z.number(),
  active_orders: z.number(),
  total_earnings: z.number(),
  average_rating: z.number(),
  response_time: z.number().optional(),
  completion_rate: z.number(),
})

export const userVerificationSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  document_type: z.enum(['passport', 'driver_license', 'id_card']),
  document_front_url: z.string().url(),
  document_back_url: z.string().url().optional(),
  selfie_url: z.string().url(),
  status: z.enum(['pending', 'verified', 'rejected']),
  rejected_reason: z.string().optional(),
  verified_at: z.string().datetime().optional(),
  verified_by: z.string().uuid().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export const userSubscriptionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  plan_id: z.string(),
  plan_name: z.string(),
  price: z.number(),
  currency: z.string(),
  status: z.enum(['active', 'cancelled', 'expired', 'pending']),
  billing_cycle: z.enum(['monthly', 'yearly']),
  current_period_start: z.string().datetime(),
  current_period_end: z.string().datetime(),
  cancel_at_period_end: z.boolean(),
  metadata: z.record(z.any()).optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export type User = z.infer<typeof userProfileSchema>
export type UserRole = z.infer<typeof userRoleSchema>
export type UserStatus = z.infer<typeof userStatusSchema>
export type UserStats = z.infer<typeof userStatsSchema>
export type UserVerification = z.infer<typeof userVerificationSchema>
export type UserSubscription = z.infer<typeof userSubscriptionSchema>

export interface UserActivity {
  id: string
  user_id: string
  activity_type: string
  description: string
  ip_address: string
  user_agent: string
  metadata: Record<string, any>
  created_at: string
}

// === ПОРТФОЛИО ===
export const portfolioItemSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  title: z.string().min(1, "Введите название работы"),
  description: z.string().min(10, "Описание должно быть не менее 10 символов"),
  category: z.string(),
  skills: z.array(z.string()),
  images: z.array(z.string()).max(10, "Максимум 10 изображений"),
  thumbnail: z.string().optional(),
  budget: z.number().min(0).optional(),
  duration: z.string().optional(),
  client_name: z.string().optional(),
  client_url: z.string().url().optional(),
  project_url: z.string().url().optional(),
  completed_date: z.string().datetime().optional(),
  is_public: z.boolean().default(true),
  sort_order: z.number().default(0),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export type PortfolioItem = z.infer<typeof portfolioItemSchema>
export type PortfolioItemInput = Omit<PortfolioItem, 'id' | 'created_at' | 'updated_at' | 'user_id'>


export interface UserNotificationPreferences {
  email: {
    order_updates: boolean
    bid_updates: boolean
    payment_updates: boolean
    marketing: boolean
    newsletter: boolean
  }
  push: {
    order_updates: boolean
    bid_updates: boolean
    payment_updates: boolean
  }
  sms: {
    important_updates: boolean
    two_factor: boolean
  }
}