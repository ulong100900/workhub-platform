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
import { Textarea } from '@/components/ui/textarea'
import {
  ArrowLeft,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Star,
  User,
  Briefcase,
  Calendar,
  FileText,
  Send,
  Shield,
  Award
} from 'lucide-react'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'

interface Bid {
  id: string
  proposal: string
  price: number
  delivery_days: number
  status: string
  created_at: string
  milestones?: Array<{
    title: string
    description: string
    days: number
    price: number
  }>
  order: {
    id: string
    title: string
    description: string
    budget: number
    status: string
    deadline: string
    client: {
      id: string
      user_metadata: {
        name: string
        avatar?: string
      }
    }
  }
  freelancer: {
    id: string
    email: string
    user_metadata: {
      name: string
      avatar?: string
      rating?: number
      completed_projects?: number
      skills?: string[]
    }
  }
}

interface Message {
  id: string
  message: string
  sender_id: string
  created_at: string
  is_read: boolean
}

export default function BidDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [bid, setBid] = useState<Bid | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSendingMessage, setIsSendingMessage] = useState(false)

  useEffect(() => {
    fetchBid()
    fetchMessages()
  }, [id])

  const fetchBid = async () => {
    try {
      const response = await fetch(`/api/bids/${id}`)
      if (response.ok) {
        const data = await response.json()
        setBid(data.bid)
      }
    } catch (error) {
      console.error('Error fetching bid:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/bids/${id}/messages`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return

    setIsSendingMessage(true)
    try {
      const response = await fetch(`/api/bids/${id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: newMessage,
          senderId: user.id
        })
      })

      if (response.ok) {
        setNewMessage('')
        fetchMessages()
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsSendingMessage(false)
    }
  }

  const handleAcceptBid = async () => {
    if (!confirm('Вы уверены, что хотите принять эту заявку?')) return

    try {
      const response = await fetch(`/api/bids/${id}/accept`, {
        method: 'POST'
      })

      if (response.ok) {
        alert('Заявка принята! Заказ перешел в работу.')
        router.push(`/dashboard/orders/${bid?.order.id}`)
      } else {
        const error = await response.json()
        alert(error.error || 'Не удалось принять заявку')
      }
    } catch (error) {
      console.error('Error accepting bid:', error)
      alert('Произошла ошибка')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: string }> = {
      pending: { label: 'На рассмотрении', variant: 'secondary' },
      accepted: { label: 'Принята', variant: 'success' },
      rejected: { label: 'Отклонена', variant: 'destructive' },
      withdrawn: { label: 'Отозвана', variant: 'outline' }
    }
    
    return statusMap[status] || { label: status, variant: 'default' }
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
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!bid) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Заявка не найдена</h2>
        <p className="text-gray-600 mb-6">
          Запрашиваемая заявка не существует или у вас нет к ней доступа
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

  const statusBadge = getStatusBadge(bid.status)
  const isClient = user?.id === bid.order.client.id
  const isFreelancer = user?.id === bid.freelancer.id
  const canAccept = isClient && bid.status === 'pending' && bid.order.status === 'open'

  return (
    <div className="space-y-6">
      {/* Заголовок и действия */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/dashboard/orders/${bid.order.id}/bids`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Заявка на "{bid.order.title}"</h1>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant={statusBadge.variant as any}>
                {statusBadge.label}
              </Badge>
              <span className="text-sm text-gray-500">
                Отправлена {formatDate(bid.created_at)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex space-x-2">
          {canAccept && (
            <Button 
              onClick={handleAcceptBid}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Принять заявку
            </Button>
          )}
          <Button asChild>
            <Link href={`/dashboard/orders/${bid.order.id}`}>
              <Briefcase className="mr-2 h-4 w-4" />
              К заказу
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Основная информация */}
        <div className="lg:col-span-2 space-y-6">
          {/* Предложение фрилансера */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Предложение фрилансера
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="whitespace-pre-line">{bid.proposal}</p>
              </div>
            </CardContent>
          </Card>

          {/* Условия */}
          <Card>
            <CardHeader>
              <CardTitle>Условия работы</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 text-gray-500 mr-2" />
                      <span className="text-sm text-gray-600">Предложенная цена</span>
                    </div>
                    <span className="font-bold text-lg">{formatCurrency(bid.price)}</span>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-gray-500 mr-2" />
                      <span className="text-sm text-gray-600">Срок выполнения</span>
                    </div>
                    <span className="font-medium">{bid.delivery_days} дней</span>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                      <span className="text-sm text-gray-600">Дедлайн заказчика</span>
                    </div>
                    <span className="font-medium">
                      {new Date(bid.order.deadline).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                </div>

                {/* План по этапам */}
                {bid.milestones && bid.milestones.length > 0 && (
                  <div className="space-y-3">
                    <div className="font-medium">План по этапам:</div>
                    <div className="space-y-2">
                      {bid.milestones.map((milestone, index) => (
                        <div key={index} className="border rounded p-3">
                          <div className="font-medium mb-1">
                            Этап {index + 1}: {milestone.title}
                          </div>
                          <div className="text-sm text-gray-600 mb-2">
                            {milestone.description}
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Стоимость: {formatCurrency(milestone.price)}</span>
                            <span>Срок: {milestone.days} дней</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Чат */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Обсуждение заявки
              </CardTitle>
              <CardDescription>
                Общайтесь с {isClient ? 'фрилансером' : 'клиентом'} для уточнения деталей
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Сообщения */}
                <div className="space-y-3 max-h-64 overflow-y-auto p-2">
                  {messages.length > 0 ? (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md rounded-lg p-3 ${message.sender_id === user?.id
                            ? 'bg-blue-100 text-blue-900'
                            : 'bg-gray-100 text-gray-900'
                            }`}
                        >
                          <div className="text-sm">{message.message}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(message.created_at).toLocaleTimeString('ru-RU', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Нет сообщений. Начните обсуждение!
                    </div>
                  )}
                </div>

                {/* Форма отправки сообщения */}
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Введите ваше сообщение..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    className="min-h-[60px]"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={isSendingMessage || !newMessage.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Боковая панель */}
        <div className="space-y-6">
          {/* Информация о фрилансере */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {isClient ? 'Фрилансер' : 'Ваша заявка'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={bid.freelancer.user_metadata.avatar} />
                  <AvatarFallback>
                    {bid.freelancer.user_metadata.name?.charAt(0) || 'Ф'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-bold">{bid.freelancer.user_metadata.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-500 mr-1" />
                      <span>{bid.freelancer.user_metadata.rating || '5.0'}/5</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {bid.freelancer.user_metadata.completed_projects || 0} проектов
                    </div>
                  </div>
                </div>
              </div>

              {bid.freelancer.user_metadata.skills && (
                <>
                  <Separator />
                  <div>
                    <div className="text-sm font-medium mb-2">Навыки:</div>
                    <div className="flex flex-wrap gap-2">
                      {bid.freelancer.user_metadata.skills.slice(0, 5).map((skill, index) => (
                        <Badge key={index} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <Separator />

              <div className="space-y-2">
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/dashboard/profile/${bid.freelancer.id}`}>
                    <User className="mr-2 h-4 w-4" />
                    Посмотреть профиль
                  </Link>
                </Button>
                <Button variant="outline" className="w-full">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Написать сообщение
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Информация о заказе */}
          <Card>
            <CardHeader>
              <CardTitle>Информация о заказе</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm text-gray-600">Заказ:</div>
                <div className="font-medium">{bid.order.title}</div>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Бюджет заказа:</span>
                <span className="font-medium">{formatCurrency(bid.order.budget)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Статус заказа:</span>
                <Badge variant="outline">{bid.order.status}</Badge>
              </div>
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/dashboard/orders/${bid.order.id}`}>
                  Перейти к заказу
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Безопасность */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Безопасная сделка
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Оплата через безопасный счет</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Гарантия возврата при невыполнении</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Поддержка платформы при спорах</span>
              </div>
            </CardContent>
          </Card>

          {/* Советы */}
          {canAccept && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Перед принятием
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>Обсудите все детали проекта</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>Проверьте портфолио фрилансера</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>Уточните сроки и этапы</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}