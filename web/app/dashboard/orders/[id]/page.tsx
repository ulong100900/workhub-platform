'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  MapPin, 
  Clock, 
  User, 
  FileText,
  MessageSquare,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Shield,
  Star
} from 'lucide-react'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'

interface Order {
  id: string
  title: string
  description: string
  budget: number
  status: string
  deadline: string
  location_type: string
  location_city?: string
  skills: string[]
  created_at: string
  client: {
    id: string
    email: string
    user_metadata: {
      name: string
      avatar?: string
    }
  }
  freelancer?: {
    id: string
    email: string
    user_metadata: {
      name: string
      avatar?: string
    }
  }
  category: {
    name: string
    icon: string
  }
}

export default function OrderDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchOrder()
  }, [id])

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

  const handleDelete = async () => {
    if (!confirm('Вы уверены, что хотите удалить этот заказ?')) return
    
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/orders/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        router.push('/dashboard/orders')
      } else {
        alert('Не удалось удалить заказ')
      }
    } catch (error) {
      console.error('Error deleting order:', error)
      alert('Произошла ошибка')
    } finally {
      setIsDeleting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: string }> = {
      open: { label: 'Открыт', variant: 'default' },
      in_progress: { label: 'В работе', variant: 'secondary' },
      completed: { label: 'Завершен', variant: 'success' },
      cancelled: { label: 'Отменен', variant: 'destructive' },
      disputed: { label: 'Спор', variant: 'warning' }
    }
    
    return statusMap[status] || { label: status, variant: 'default' }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Заказ не найден</h2>
        <p className="text-gray-600 mb-6">Запрашиваемый заказ не существует или у вас нет к нему доступа</p>
        <Button asChild>
          <Link href="/dashboard/orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            К списку заказов
          </Link>
        </Button>
      </div>
    )
  }

  const statusBadge = getStatusBadge(order.status)
  const isClient = user?.id === order.client.id
  const canEdit = isClient && order.status === 'open'

  return (
    <div className="space-y-6">
      {/* Заголовок и действия */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/orders">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{order.title}</h1>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant={statusBadge.variant as any}>
                {statusBadge.label}
              </Badge>
              <span className="text-sm text-gray-500">
                Создан {formatDate(order.created_at)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex space-x-2">
          {canEdit && (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/orders/${id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Редактировать
                </Link>
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Удалить
              </Button>
            </>
          )}
          <Button size="sm">
            <MessageSquare className="mr-2 h-4 w-4" />
            Написать сообщение
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Основная информация */}
        <div className="lg:col-span-2 space-y-6">
          {/* Описание заказа */}
          <Card>
            <CardHeader>
              <CardTitle>Описание проекта</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="whitespace-pre-line">{order.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* Требуемые навыки */}
          {order.skills && order.skills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Требуемые навыки</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {order.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Информация о клиенте */}
          <Card>
            <CardHeader>
              <CardTitle>Информация о клиенте</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarImage src={order.client.user_metadata.avatar} />
                  <AvatarFallback>
                    {order.client.user_metadata.name?.charAt(0) || 'К'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{order.client.user_metadata.name}</div>
                  <div className="text-sm text-gray-500">{order.client.email}</div>
                  <div className="flex items-center mt-2 space-x-4 text-sm">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-500 mr-1" />
                      <span>4.8/5</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                      <span>24 проекта</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Боковая панель */}
        <div className="space-y-6">
          {/* Детали заказа */}
          <Card>
            <CardHeader>
              <CardTitle>Детали заказа</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-sm text-gray-600">Бюджет</span>
                </div>
                <span className="font-bold text-lg">{formatCurrency(order.budget)}</span>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-sm text-gray-600">Срок выполнения</span>
                </div>
                <span className="font-medium">{formatDate(order.deadline)}</span>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-sm text-gray-600">Местоположение</span>
                </div>
                <span className="font-medium">
                  {order.location_type === 'remote' ? 'Удаленная работа' : 
                   order.location_city || 'Не указано'}
                </span>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-sm text-gray-600">Категория</span>
                </div>
                <Badge variant="outline">{order.category.name}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Действия */}
          <Card>
            <CardHeader>
              <CardTitle>Действия</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.status === 'open' && !isClient && (
                <Button className="w-full">
                  <FileText className="mr-2 h-4 w-4" />
                  Подать заявку
                </Button>
              )}

              {order.status === 'open' && isClient && (
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/dashboard/orders/${id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Редактировать заказ
                  </Link>
                </Button>
              )}

              {(order.status === 'in_progress' || order.status === 'completed') && order.freelancer && (
                <div className="space-y-3">
                  <div className="text-sm font-medium mb-2">Исполнитель:</div>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Avatar>
                      <AvatarImage src={order.freelancer.user_metadata.avatar} />
                      <AvatarFallback>
                        {order.freelancer.user_metadata.name?.charAt(0) || 'И'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{order.freelancer.user_metadata.name}</div>
                      <div className="text-sm text-gray-500">Исполнитель</div>
                    </div>
                  </div>
                </div>
              )}

              <Button variant="outline" className="w-full">
                <MessageSquare className="mr-2 h-4 w-4" />
                Обсудить проект
              </Button>

              <Button variant="outline" className="w-full">
                <Shield className="mr-2 h-4 w-4" />
                Гарантия безопасности
              </Button>

              <Button variant="outline" className="w-full" asChild>
                <Link href={`/dashboard/orders/${id}/bids`}>
                  <User className="mr-2 h-4 w-4" />
                  Просмотреть заявки
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Статистика */}
          <Card>
            <CardHeader>
              <CardTitle>Статистика</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Просмотров</span>
                <span className="font-medium">156</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Заявок</span>
                <span className="font-medium">8</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">В избранном</span>
                <span className="font-medium">12</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}