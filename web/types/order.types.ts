import { z } from 'zod'

export const orderStatusSchema = z.enum([
  'draft',
  'published',
  'in_progress',
  'completed',
  'cancelled',
])

export const orderPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent'])

export const orderAttachmentSchema = z.object({
  id: z.string().uuid(),
  order_id: z.string().uuid(),
  file_name: z.string(),
  file_url: z.string().url(),
  file_size: z.number(),
  file_type: z.string(),
  uploaded_at: z.string().datetime(),
})

export const orderSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(5000),
  budget: z.number().min(0),
  currency: z.string().default('RUB'),
  category: z.string(),
  subcategory: z.string().optional(),
  status: orderStatusSchema,
  priority: orderPrioritySchema.default('medium'),
  customer_id: z.string().uuid(),
  executor_id: z.string().uuid().optional().nullable(),
  deadline: z.string().datetime().optional(),
  completed_at: z.string().datetime().optional(),
  published_at: z.string().datetime().optional(),
  location: z.string().optional(),
  remote_work: z.boolean().default(false),
  required_skills: z.array(z.string()).optional(),
  attachments: z.array(orderAttachmentSchema).optional(),
  metadata: z.record(z.any()).optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export const orderFilterSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  location: z.string().optional(),
  remoteOnly: z.boolean().optional(),
  skills: z.array(z.string()).optional(),
  sortBy: z.enum(['created_at', 'budget', 'deadline']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
})

export type Order = z.infer<typeof orderSchema>
export type OrderStatus = z.infer<typeof orderStatusSchema>
export type OrderPriority = z.infer<typeof orderPrioritySchema>
export type OrderAttachment = z.infer<typeof orderAttachmentSchema>
export type OrderFilter = z.infer<typeof orderFilterSchema>

export interface OrderStats {
  total: number
  active: number
  completed: number
  cancelled: number
  averageBudget: number
  totalBudget: number
}

export interface OrderTimelineEvent {
  id: string
  order_id: string
  event_type: string
  description: string
  created_by: string
  metadata: Record<string, any>
  created_at: string
}

export interface OrderMessage {
  id: string
  order_id: string
  user_id: string
  content: string
  attachments?: string[]
  is_read: boolean
  created_at: string
}

export interface OrderReview {
  id: string
  order_id: string
  reviewer_id: string
  reviewee_id: string
  rating: number
  comment?: string
  created_at: string
}