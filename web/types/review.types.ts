export interface Review {
  id: string
  projectId: string
  reviewerId: string
  reviewedId: string
  type: 'freelancer' | 'client'
  rating: number
  title?: string
  content: string
  strengths?: string[]
  weaknesses?: string[]
  wouldRecommend: boolean
  isVerified: boolean
  createdAt: string
  updatedAt: string
  
  // Дополнительные данные
  reviewer?: {
    id: string
    name: string
    avatar?: string
    rating: number
  }
  project?: {
    id: string
    title: string
    budget: number
  }
}

export interface RatingSummary {
  averageRating: number
  totalReviews: number
  ratingDistribution: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
  wouldRecommendRate: number
  strengths: {
    [key: string]: number
  }
  weaknesses: {
    [key: string]: number
  }
  categoryRatings?: {
    [category: string]: number
  }
}

export interface CreateReviewInput {
  projectId: string
  reviewedId: string
  type: 'freelancer' | 'client'
  rating: number
  title?: string
  content: string
  strengths?: string[]
  weaknesses?: string[]
  wouldRecommend: boolean
}

export interface UpdateReviewInput {
  rating?: number
  title?: string
  content?: string
  strengths?: string[]
  weaknesses?: string[]
  wouldRecommend?: boolean
}