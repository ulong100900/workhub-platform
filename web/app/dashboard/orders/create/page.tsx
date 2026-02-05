'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import CreateOrderForm from '@/components/orders/CreateOrderForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Shield, DollarSign, Clock, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function CreateOrderPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login?redirect=/dashboard/orders/create')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="space-y-8">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/dashboard/orders">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Назад к заказам
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Создание нового заказа</h1>
          <p className="text-gray-600 mt-2">
            Заполните форму ниже, чтобы найти идеального исполнителя для вашего проекта
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Форма */}
        <div className="lg:col-span-2">
          <CreateOrderForm />
        </div>

        {/* Боковая панель с советами */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Преимущества
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium">Безопасная оплата</h4>
                  <p className="text-sm text-gray-600">
                    Деньги хранятся на платформе до успешного выполнения работы
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium">Проверенные исполнители</h4>
                  <p className="text-sm text-gray-600">
                    Все фрилансеры проходят верификацию и имеют отзывы
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium">Экономия времени</h4>
                  <p className="text-sm text-gray-600">
                    Находите подходящих специалистов за считанные минуты
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Как это работает?</CardTitle>
              <CardDescription>
                Простой процесс найма исполнителей
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4">
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium mr-3">
                    1
                  </div>
                  <div>
                    <span className="font-medium">Разместите заказ</span>
                    <p className="text-sm text-gray-600">Опишите задачу, бюджет и сроки</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium mr-3">
                    2
                  </div>
                  <div>
                    <span className="font-medium">Получайте отклики</span>
                    <p className="text-sm text-gray-600">Фрилансеры предлагают свои услуги</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium mr-3">
                    3
                  </div>
                  <div>
                    <span className="font-medium">Выберите исполнителя</span>
                    <p className="text-sm text-gray-600">Просмотрите портфолио и отзывы</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium mr-3">
                    4
                  </div>
                  <div>
                    <span className="font-medium">Оплатите работу</span>
                    <p className="text-sm text-gray-600">Безопасно через платформу</p>
                  </div>
                </li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Нужна помощь?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/contact">
                    Свяжитесь с поддержкой
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/about">
                    Часто задаваемые вопросы
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Посмотреть примеры заказов
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}