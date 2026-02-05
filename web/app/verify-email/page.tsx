'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, RefreshCw, CheckCircle } from 'lucide-react'

export default function VerifyEmailPage() {
  const [isSending, setIsSending] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [error, setError] = useState('')
  const { user, signOut } = useAuth()
  const router = useRouter()

  const handleResendEmail = async () => {
    setIsSending(true)
    setError('')

    try {
      // В реальном проекте здесь будет запрос к API
      // Это временная заглушка
      await new Promise(resolve => setTimeout(resolve, 1000))
      setIsSent(true)
    } catch (err: any) {
      setError(err.message || 'Не удалось отправить письмо')
    } finally {
      setIsSending(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <div className="container flex min-h-screen flex-col items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-blue-100 p-3">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">Подтвердите ваш email</CardTitle>
          <CardDescription>
            Мы отправили письмо с подтверждением на адрес
          </CardDescription>
          {user?.email && (
            <p className="mt-2 font-medium text-foreground">{user.email}</p>
          )}
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isSent && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Новое письмо с подтверждением отправлено!
              </AlertDescription>
            </Alert>
          )}

          <Alert>
            <AlertDescription>
              Пожалуйста, проверьте вашу почту и перейдите по ссылке в письме для
              подтверждения email адреса.
            </AlertDescription>
          </Alert>

          <div className="rounded-md bg-muted p-4">
            <h4 className="mb-2 font-semibold">Не получили письмо?</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Проверьте папку &quot;Спам&quot; или &quot;Рассылки&quot;</li>
              <li>• Убедитесь, что email адрес указан правильно</li>
              <li>• Подождите несколько минут</li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-3">
          <Button
            onClick={handleResendEmail}
            disabled={isSending}
            className="w-full"
            variant={isSent ? "secondary" : "default"}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isSending ? 'animate-spin' : ''}`} />
            {isSending ? 'Отправка...' : isSent ? 'Отправлено повторно' : 'Отправить письмо еще раз'}
          </Button>

          <Button
            onClick={handleSignOut}
            variant="outline"
            className="w-full"
          >
            Выйти из аккаунта
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            После подтверждения email вы получите полный доступ ко всем функциям
            платформы.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}