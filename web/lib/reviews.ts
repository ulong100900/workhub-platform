import { Review, RatingSummary, CreateReviewInput, UpdateReviewInput } from '@/types/review.types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

export const reviewService = {
  // Получить отзывы пользователя
  async getUserReviews(userId: string, type?: 'freelancer' | 'client'): Promise<Review[]> {
    const queryParams = new URLSearchParams()
    if (type) queryParams.append('type', type)
    
    const response = await fetch(`${API_URL}/users/${userId}/reviews?${queryParams}`)
    if (!response.ok) throw new Error('Failed to fetch user reviews')
    return response.json()
  },

  // Получить сводку рейтинга пользователя
  async getUserRatingSummary(userId: string, type: 'freelancer' | 'client'): Promise<RatingSummary> {
    const response = await fetch(`${API_URL}/users/${userId}/rating-summary?type=${type}`)
    if (!response.ok) throw new Error('Failed to fetch rating summary')
    return response.json()
  },

  // Получить отзывы проекта
  async getProjectReviews(projectId: string): Promise<Review[]> {
    const response = await fetch(`${API_URL}/projects/${projectId}/reviews`)
    if (!response.ok) throw new Error('Failed to fetch project reviews')
    return response.json()
  },

  // Создать отзыв
  async createReview(reviewData: CreateReviewInput, token: string): Promise<Review> {
    const response = await fetch(`${API_URL}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(reviewData)
    })
    if (!response.ok) throw new Error('Failed to create review')
    return response.json()
  },

  // Обновить отзыв
  async updateReview(reviewId: string, reviewData: UpdateReviewInput, token: string): Promise<Review> {
    const response = await fetch(`${API_URL}/reviews/${reviewId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(reviewData)
    })
    if (!response.ok) throw new Error('Failed to update review')
    return response.json()
  },

  // Удалить отзыв
  async deleteReview(reviewId: string, token: string): Promise<void> {
    const response = await fetch(`${API_URL}/reviews/${reviewId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    if (!response.ok) throw new Error('Failed to delete review')
  },

  // Ответить на отзыв
  async replyToReview(reviewId: string, reply: string, token: string): Promise<Review> {
    const response = await fetch(`${API_URL}/reviews/${reviewId}/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ reply })
    })
    if (!response.ok) throw new Error('Failed to reply to review')
    return response.json()
  },

  // Получить недавние отзывы
  async getRecentReviews(limit: number = 10): Promise<Review[]> {
    const response = await fetch(`${API_URL}/reviews/recent?limit=${limit}`)
    if (!response.ok) throw new Error('Failed to fetch recent reviews')
    return response.json()
  },

  // Отметить отзыв как полезный
  async markReviewAsHelpful(reviewId: string, token: string): Promise<{ helpfulCount: number }> {
    const response = await fetch(`${API_URL}/reviews/${reviewId}/helpful`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    if (!response.ok) throw new Error('Failed to mark review as helpful')
    return response.json()
  },

  // Пожаловаться на отзыв
  async reportReview(reviewId: string, reason: string, token: string): Promise<void> {
    const response = await fetch(`${API_URL}/reviews/${reviewId}/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ reason })
    })
    if (!response.ok) throw new Error('Failed to report review')
  }
}