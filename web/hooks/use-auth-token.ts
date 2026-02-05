// hooks/use-auth-token.ts
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export function useAuthToken() {
  const [isValid, setIsValid] = useState<boolean>(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const router = useRouter()

  const checkToken = useCallback((): boolean => {
    if (typeof window === 'undefined') return false
    
    const accessToken = localStorage.getItem('access_token')
    const tokenExpiry = localStorage.getItem('token_expiry')
    
    if (!accessToken || !tokenExpiry) {
      return false
    }
    
    // Проверяем срок действия
    const expiryTime = parseInt(tokenExpiry, 10)
    const isValidToken = Date.now() < expiryTime
    
    if (!isValidToken) {
      // Пробуем обновить токен
      refreshToken()
      return false
    }
    
    return true
  }, [])

  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const refreshToken = localStorage.getItem('refresh_token')
      
      if (!refreshToken) {
        throw new Error('No refresh token')
      }
      
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refresh_token: refreshToken })
      })
      
      const result = await response.json()
      
      if (result.success && result.access_token) {
        // Сохраняем новый токен
        const expiresIn = result.expires_in || 3600
        const expiryTime = Date.now() + (expiresIn * 1000)
        
        localStorage.setItem('access_token', result.access_token)
        localStorage.setItem('refresh_token', result.refresh_token || refreshToken)
        localStorage.setItem('token_expiry', expiryTime.toString())
        
        setIsValid(true)
        return true
      }
      
      return false
    } catch (error) {
      console.error('Ошибка обновления токена:', error)
      logout()
      return false
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('token_expiry')
    localStorage.removeItem('user_id')
    localStorage.removeItem('user_data')
    
    document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    
    setIsValid(false)
    setUser(null)
    
    router.push('/auth/telegram')
  }, [router])

  const getUserData = useCallback(() => {
    try {
      const userData = localStorage.getItem('user_data')
      return userData ? JSON.parse(userData) : null
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    const tokenValid = checkToken()
    setIsValid(tokenValid)
    
    if (tokenValid) {
      const userData = getUserData()
      setUser(userData)
    }
    
    setLoading(false)
    
    // Проверяем токен каждую минуту
    const interval = setInterval(() => {
      const tokenValid = checkToken()
      setIsValid(tokenValid)
      
      if (!tokenValid) {
        clearInterval(interval)
      }
    }, 60000)
    
    return () => clearInterval(interval)
  }, [checkToken, getUserData])

  return {
    isValid,
    user,
    loading,
    logout,
    refreshToken,
    checkToken
  }
}