'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  ArrowLeft,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Star,
  User,
  Award,
  Shield,
  Filter,
  Search
} from 'lucide-react'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'

interface Bid {
  id: string
  proposal: string
  price: number
  delivery_days: number
  status: string
  created_at: string
  freelancer: {
    id: string
    email: string
    user_metadata: {
      name: string
      avatar?: string
      rating?: number
      completed_projects?: number
    }
  }
  milestones?: Array<{
    title: string
    description: string
    days: number
    price: number
  }>
}

interface Order {
  id: string
  title: string
  budget: number
  status: string
  bids_count: number
}

export default function OrderBidsPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [bids, setBids] = useState<Bid[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchOrder()
    fetchBids()
  }, [id, activeTab])

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${id}`)
      if (response.ok) {
        const data = await response.json()
        setOrder(data.order)
      }
    } catch (error) {
      console.error('Error fetching order:', error)
    }
  }

  const fetchBids = async () => {
    try {
      const status = activeTab === 'all' ? '' : activeTab
      const response = await fetch(`/api/bids?orderId=${id}&status=${status}`)
      if (response.ok) {
        const data = await response.json()
        setBids(data.bids || [])
      }
    } catch (error) {
      console.error('Error fetching bids:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAcceptBid = async (bidId: string) => {
    if (!confirm('Вы уверены, что хотите принять эту заявку?')) return

    try {
      const response = await fetch(`/api/bids/${bidId}/accept`, {
        method: 'POST'
      })

      if (response.ok) {
        alert('Заявка принята! Заказ перешел в работу.')
        fetchBids()
        fetchOrder()
      } else {
        const error = await response.json()
        alert(error.error || 'Не удалось принять заявку')
      }
    } catch (error) {
      console.error('Error accepting bid:', error)
      alert('Произошла ошибка')
    }
  }

  const handleRejectBid = async (bidId: string) => {
    if (!confirm('Вы уверены, что хотите отклонить эту заявку?')) return

    try {
      const response = await fetch(`/api/bids/${bidId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'rejected' })
      })

      if (response.ok) {
        alert('Заявка отклонена')
        fetchBids()
      } else {
        const error = await response.json()
        alert(error.error || 'Не удалось отклонить заявку')
      }
    } catch (error) {
      console.error('Error rejecting bid:', error)
      alert('Произошла ошибка')
    }
  }

  const handleSendMessage = (freelancerId: string) => {
    router.push(`/dashboard/messages?user=${freelancerId}`)
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: string; icon: any }> = {
      pending: { label: 'На рассмотрении', variant: 'secondary', icon: Clock },
      accepted: { label: 'Принята', variant: 'success', icon: CheckCircle },
      rejected: { label: 'Отклонена', variant: 'destructive', icon: XCircle },
      withdrawn: { label: 'Отозвана', variant: 'outline', icon: ArrowLeft }
    }
    
    const statusInfo = statusMap[status] || { label: status, variant: 'default', icon: Clock }
    const Icon = statusInfo.icon
    
    return (
      <Badge variant={statusInfo.variant as any} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {statusInfo.label}
      </Badge>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredBids = bids.filter(bid => {
    if (!searchQuery) return true
    
    const query = searchQuery.toLowerCase()
    return (
      bid.freelancer.user_metadata.name.toLowerCase().includes(query) ||
      bid.proposal.toLowerCase().includes(query)
    )
  })

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
        <p className="text-gray-600 mb-6">
          Запрашиваемый заказ не существует или у вас нет к нему доступа
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

  const isClient = user?.id === order.id // Здесь должна быть проверка client_id
  const isOrderOpen = order.status === 'open'

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Button variant="ghost" asChild className="mb-4">
            <Link href={`/dashboard/orders/${id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Назад к заказу
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Заявки на заказ</h1>
          <p className="text-gray-600 mt-2">
            {order.title} • {formatCurrency(order.budget)} • {order.bids_count} заявок
          </p>
        </div>
        
        {isOrderOpen && (
          <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="h-4 w-4 mr-1" />
            Принимает заявки
          </Badge>
        )}
      </div>

      {/* Фильтры и поиск */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Поиск по имени фрилансера или предложению..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Фильтры
              </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">Все ({bids.length})</TabsTrigger>
                <TabsTrigger value="pending">На рассмотрении</TabsTrigger>
                <TabsTrigger value="accepted">Принятые</TabsTrigger>
                <TabsTrigger value="rejected">Отклоненные</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{bids.length}</div>
              <div className="text-sm text-gray-600">Всего заявок</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {bids.filter(b => b.status === 'pending').length}
              </div>
              <div className="text-sm text-gray-600">На рассмотрении</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {bids.filter(b => b.status === 'accepted').length}
              </div>
              <div className="text-sm text-gray-600">Принятые</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {formatCurrency(bids.reduce((sum, bid) => sum + bid.price, 0))}
              </div>
              <div className="text-sm text-gray-600">Общая сумма</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Список заявок */}
      {filteredBids.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <User className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">Заявки не найдены</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery 
                ? 'Попробуйте изменить параметры поиска'
                : 'На этот заказ еще нет заявок'}
            </p>
            <Button asChild>
              <Link href={`/dashboard/orders/${id}`}>
                Вернуться к заказу
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredBids.map((bid) => (
            <Card key={bid.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Информация о фрилансере */}
                  <div className="lg:w-64 space-y-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={bid.freelancer.user_metadata.avatar} />
                        <AvatarFallback>
                          {bid.freelancer.user_metadata.name?.charAt(0) || 'Ф'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-bold text-lg">{bid.freelancer.user_metadata.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-500 mr-1" />
                            <span>{bid.freelancer.user_metadata.rating || '5.0'}</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            {bid.freelancer.user_metadata.completed_projects || 0} проектов
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Предложенная цена:</span>
                        <span className="font-bold text-lg">{formatCurrency(bid.price)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Срок выполнения:</span>
                        <span className="font-medium">{bid.delivery_days} дней</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Отправлена:</span>
                        <span className="text-sm">{formatDate(bid.created_at)}</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      {getStatusBadge(bid.status)}
                    </div>
                  </div>

                  {/* Предложение */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <div className="font-medium mb-2">Предложение:</div>
                      <p className="text-gray-700 whitespace-pre-line line-clamp-3">
                        {bid.proposal}
                      </p>
                      <Button variant="link" className="p-0 h-auto" asChild>
                        <Link href={`/dashboard/bids/${bid.id}`}>
                          Читать полностью
                        </Link>
                      </Button>
                    </div>

                    {/* План по этапам */}
                    {bid.milestones && bid.milestones.length > 0 && (
                      <div>
                        <div className="font-medium mb-2">План по этапам:</div>
                        <div className="space-y-2">
                          {bid.milestones.map((milestone, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span>
                                Этап {index + 1}: {milestone.title}
                              </span>
                              <span>
                                {formatCurrency(milestone.price)} / {milestone.days} дн.
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Действия */}
                    {isClient && isOrderOpen && bid.status === 'pending' && (
                      <div className="flex flex-wrap gap-2 pt-4">
                        <Button
                          onClick={() => handleAcceptBid(bid.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Принять заявку
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleRejectBid(bid.id)}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Отклонить
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleSendMessage(bid.freelancer.id)}
                        >
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Написать
                        </Button>
                        <Button variant="outline" asChild>
                          <Link href={`/dashboard/bids/${bid.id}`}>
                            Подробнее
                          </Link>
                        </Button>
                      </div>
                    )}

                    {isClient && bid.status === 'accepted' && (
                      <div className="pt-4">
                        <Badge variant="success" className="bg-green-100 text-green-800">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Исполнитель выбран
                        </Badge>
                        <div className="flex gap-2 mt-2">
                          <Button variant="outline" size="sm">
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Перейти к чату
                          </Button>
                          <Button variant="outline" size="sm">
                            <Shield className="mr-2 h-4 w-4" />
                            Управление проектом
                          </Button>
                        </div>
                      </div>
                    )}

                    {!isClient && (
                      <div className="pt-4">
                        <Button variant="outline" size="sm">
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Написать клиенту
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Советы для клиента */}
      {isClient && isOrderOpen && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Как выбрать исполнителя?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="font-medium">Прочитайте предложения</div>
                <p className="text-sm text-gray-600">
                  Обращайте внимание на детали и конкретные предложения
                </p>
              </div>
              <div className="space-y-2">
                <div className="font-medium">Проверьте рейтинг</div>
                <p className="text-sm text-gray-600">
                  Смотрите отзывы и завершенные проекты
                </p>
              </div>
              <div className="space-y-2">
                <div className="font-medium">Обсудите детали</div>
                <p className="text-sm text-gray-600">
                  Задайте вопросы до принятия решения
                </p>
              </div>
              <div className="space-y-2">
                <div className="font-medium">Сравните предложения</div>
                <p className="text-sm text-gray-600">
                  Учитывайте цену, сроки и качество портфолио
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}