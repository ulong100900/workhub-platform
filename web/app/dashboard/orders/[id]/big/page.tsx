'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import BidForm from '@/components/orders/BidForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, 
  Shield, 
  Star, 
  CheckCircle, 
  Clock,
  DollarSign,
  User,
  Briefcase
} from 'lucide-react'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'

interface Order {
  id: string
  title: string
  description: string
  budget: number
  deadline: string
  skills: string[]
  client: {
    user_metadata: {
      name: string
      avatar?: string
    }
  }
}

export default function CreateBidPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasExistingBid, setHasExistingBid] = useState(false)

  useEffect(() => {
    if (!authLoading) {
      fetchOrder()
      checkExistingBid()
    }
  }, [authLoading, id])

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${id}`)
      if (response.ok) {
        const data = await response.json()
        setOrder(data.order)
      } else {
        console.error('Failed to fetch order')
      }
    } catch (error) {
      console.error('Error fetching order:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const checkExistingBid = async () => {
    if (!user) return
    
    try {
      const response = await fetch(`/api/bids?orderId=${id}&freelancerId=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setHasExistingBid(data.bids && data.bids.length > 0)
      }
    } catch (error) {
      console.error('Error checking existing bid:', error)
    }
  }

  const handleSuccess = () => {
    router.push(`/dashboard/orders/${id}`)
  }

  if (authLoading || isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Требуется авторизация</h2>
        <p className="text-gray-600 mb-6">
          Войдите в систему как фрилансер, чтобы подать заявку на этот заказ
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild>
            <Link href={`/login?redirect=/dashboard/orders/${id}/bid`}>
              Войти
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/register">
              Зарегистрироваться
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Заказ не найден</h2>
        <p className="text-gray-600 mb-6">
          Запрашиваемый заказ не существует или был удален
        </p>
        <Button asChild>
          <Link href="/dashboard/orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            К списку заказов
          </Link>
        </Button>
      </div>
    )
  }

  if (hasExistingBid) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button variant="ghost" asChild className="mb-4">
              <Link href={`/dashboard/orders/${id}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Назад к заказу
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">Заявка уже отправлена</h1>
            <p className="text-gray-600 mt-2">
              Вы уже отправили заявку на этот заказ
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-green-600 flex items-center gap-2">
              <CheckCircle className="h-6 w-6" />
              Заявка на рассмотрении
            </CardTitle>
            <CardDescription>
              Ваше предложение отправлено клиенту. Ожидайте решения.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Briefcase className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium">{order.title}</div>
                  <div className="text-sm text-gray-600">
                    Бюджет: {new Intl.NumberFormat('ru-RU').format(order.budget)} ₽
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button asChild>
                  <Link href={`/dashboard/orders/${id}`}>
                    Перейти к заказу
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/dashboard/orders">
                    Найти другие заказы
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" asChild className="mb-4">
            <Link href={`/dashboard/orders/${id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Назад к заказу
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Подача заявки</h1>
          <p className="text-gray-600 mt-2">
            Расскажите клиенту, почему именно вы должны выполнить этот проект
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Форма заявки */}
        <div className="lg:col-span-2">
          <BidForm order={order} onSuccess={handleSuccess} />
        </div>

        {/* Боковая панель с информацией */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Безопасность
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
                  <h4 className="font-medium">Гарантия качества</h4>
                  <p className="text-sm text-gray-600">
                    Вы получите оплату только после принятия работы клиентом
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium">Поддержка</h4>
                  <p className="text-sm text-gray-600">
                    Наша команда поможет решить спорные ситуации
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Статистика заказа</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Бюджет</span>
                  <span className="font-medium">
                    {new Intl.NumberFormat('ru-RU').format(order.budget)} ₽
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Дедлайн</span>
                  <span className="font-medium">
                    {new Date(order.deadline).toLocaleDateString('ru-RU')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Навыки</span>
                  <span className="font-medium">{order.skills.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Клиент</span>
                  <span className="font-medium">{order.client.user_metadata.name}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Советы</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Star className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span>Будьте конкретны в описании своего опыта</span>
                </li>
                <li className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>Укажите реалистичные сроки выполнения</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Предложите разумную цену за работу</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}