import { useState, useCallback } from 'react'
import { Review, RatingSummary, CreateReviewInput, UpdateReviewInput } from '@/types/review.types'
import { reviewService } from '@/lib/reviews'
import { useAuth } from '@/hooks/useAuth'

export function useReviews() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [ratingSummary, setRatingSummary] = useState<RatingSummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { token } = useAuth()

  const fetchUserReviews = useCallback(async (userId: string, type?: 'freelancer' | 'client') => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await reviewService.getUserReviews(userId, type)
      setReviews(data)
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reviews')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchRatingSummary = useCallback(async (userId: string, type: 'freelancer' | 'client') => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await reviewService.getUserRatingSummary(userId, type)
      setRatingSummary(data)
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch rating summary')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchProjectReviews = useCallback(async (projectId: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await reviewService.getProjectReviews(projectId)
      setReviews(data)
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch project reviews')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createReview = useCallback(async (reviewData: CreateReviewInput) => {
    if (!token) throw new Error('Authentication required')
    
    setIsLoading(true)
    setError(null)
    try {
      const data = await reviewService.createReview(reviewData, token)
      setReviews(prev => [data, ...prev])
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create review')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [token])

  const updateReview = useCallback(async (reviewId: string, reviewData: UpdateReviewInput) => {
    if (!token) throw new Error('Authentication required')
    
    setIsLoading(true)
    setError(null)
    try {
      const data = await reviewService.updateReview(reviewId, reviewData, token)
      setReviews(prev => prev.map(r => r.id === reviewId ? data : r))
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update review')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [token])

  const deleteReview = useCallback(async (reviewId: string) => {
    if (!token) throw new Error('Authentication required')
    
    setIsLoading(true)
    setError(null)
    try {
      await reviewService.deleteReview(reviewId, token)
      setReviews(prev => prev.filter(r => r.id !== reviewId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete review')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [token])

  const replyToReview = useCallback(async (reviewId: string, reply: string) => {
    if (!token) throw new Error('Authentication required')
    
    setIsLoading(true)
    setError(null)
    try {
      const data = await reviewService.replyToReview(reviewId, reply, token)
      setReviews(prev => prev.map(r => r.id === reviewId ? data : r))
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reply to review')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [token])

  const markReviewAsHelpful = useCallback(async (reviewId: string) => {
    if (!token) throw new Error('Authentication required')
    
    setIsLoading(true)
    setError(null)
    try {
      const data = await reviewService.markReviewAsHelpful(reviewId, token)
      // Обновить счетчик полезности в отзыве
      setReviews(prev => prev.map(r => 
        r.id === reviewId ? { ...r, helpfulCount: data.helpfulCount } : r
      ))
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark review as helpful')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [token])

  const reportReview = useCallback(async (reviewId: string, reason: string) => {
    if (!token) throw new Error('Authentication required')
    
    setIsLoading(true)
    setError(null)
    try {
      await reviewService.reportReview(reviewId, reason, token)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to report review')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [token])

  const fetchRecentReviews = useCallback(async (limit: number = 10) => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await reviewService.getRecentReviews(limit)
      setReviews(data)
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch recent reviews')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    reviews,
    ratingSummary,
    isLoading,
    error,
    fetchUserReviews,
    fetchRatingSummary,
    fetchProjectReviews,
    createReview,
    updateReview,
    deleteReview,
    replyToReview,
    markReviewAsHelpful,
    reportReview,
    fetchRecentReviews,
    clearError: () => setError(null)
  }
}