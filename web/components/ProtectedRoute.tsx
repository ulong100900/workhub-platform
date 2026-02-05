'use client'

import { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: 'client' | 'freelancer' | 'admin'
  requiredAuth?: boolean
  redirectTo?: string
  fallback?: ReactNode
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  requiredAuth = true,
  redirectTo = '/login',
  fallback
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (requiredAuth && !isAuthenticated) {
        // Сохраняем текущий путь для редиректа после входа
        const currentPath = window.location.pathname + window.location.search
        router.push(`${redirectTo}?redirect=${encodeURIComponent(currentPath)}`)
      } else if (requiredAuth && requiredRole && user?.user_metadata?.role !== requiredRole) {
        // Проверка роли пользователя
        router.push('/dashboard')
      }
    }
  }, [isLoading, isAuthenticated, user, requiredRole, router, redirectTo, requiredAuth])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Проверка доступа...</p>
        </div>
      </div>
    )
  }

  if (requiredAuth && !isAuthenticated) {
    return null
  }

  if (requiredAuth && requiredRole && user?.user_metadata?.role !== requiredRole) {
    if (fallback) {
      return <>{fallback}</>
    }
    
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-6 max-w-md mx-auto">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Доступ запрещен</h1>
            <p className="text-muted-foreground">
              У вас недостаточно прав для доступа к этой странице.
              Требуемая роль: <span className="font-semibold">{requiredRole}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Ваша роль: <span className="font-semibold">{user?.user_metadata?.role || 'не определена'}</span>
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => router.push('/dashboard')}
              variant="default"
            >
              Перейти в дашборд
            </Button>
            <Button
              onClick={() => router.push('/')}
              variant="outline"
            >
              На главную
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// Компонент для защиты маршрутов для неавторизованных пользователей
// (например, для страниц регистрации/логина)
export function PublicOnlyRoute({ 
  children, 
  redirectTo = '/dashboard'
}: {
  children: ReactNode
  redirectTo?: string
}) {
  const { isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push(redirectTo)
    }
  }, [isLoading, isAuthenticated, router, redirectTo])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (isAuthenticated) {
    return null
  }

  return <>{children}</>
}