'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle } from 'lucide-react'

export default function LogoutPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const logout = async () => {
      await supabase.auth.signOut()
      // Небольшая задержка для визуального подтверждения
      setTimeout(() => {
        router.push('/')
      }, 2000)
    }
    
    logout()
  }, [])

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Выход из системы
          </CardTitle>
          <CardDescription className="text-center">
            Вы успешно вышли из системы
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-2" />
            <span className="text-gray-600">Перенаправление на главную страницу...</span>
          </div>
          
          <div className="space-y-2 mt-6">
            <Button 
              onClick={() => router.push('/')} 
              className="w-full"
              variant="outline"
            >
              Перейти сейчас
            </Button>
            <Button 
              onClick={() => router.push('/login')} 
              className="w-full"
            >
              Войти снова
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}