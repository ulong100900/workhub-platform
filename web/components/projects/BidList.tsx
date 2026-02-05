'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  Star, 
  Calendar,
  DollarSign,
  Loader2,
  User,
  Clock
} from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import Link from 'next/link'

interface Bid {
  id: string
  freelancer_id: string
  amount: number
  message: string
  delivery_time: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  freelancer?: {
    id: string
    full_name: string
    avatar_url?: string
    rating?: number
    completed_projects?: number
  }
}

interface BidListProps {
  projectId: string
  isOwner: boolean
  onBidAccepted?: (bidId: string, freelancerId: string) => void
  onBidRejected?: (bidId: string) => void
}

export default function BidList({ projectId, isOwner, onBidAccepted, onBidRejected }: BidListProps) {
  const [bids, setBids] = useState<Bid[]>([])
  const [loading, setLoading] = useState(true)
  const [acceptingBid, setAcceptingBid] = useState<string | null>(null)
  const [rejectingBid, setRejectingBid] = useState<string | null>(null)

  const loadBids = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/projects/${projectId}/bids`)
      
      if (!response.ok) throw new Error('Failed to load bids')
      
      const result = await response.json()
      setBids(result.data || [])
    } catch (error) {
      console.error('Error loading bids:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (projectId && isOwner) {
      loadBids()
    }
  }, [projectId, isOwner])

  const handleAcceptBid = async (bidId: string, freelancerId: string) => {
    try {
      setAcceptingBid(bidId)
      const response = await fetch(`/api/bids/${bidId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, freelancerId })
      })

      if (response.ok) {
        // Обновляем статус отклика локально
        setBids(prev => prev.map(bid => 
          bid.id === bidId 
            ? { ...bid, status: 'accepted' }
            : { ...bid, status: 'rejected' } // Отклоняем все остальные
        ))
        
        // Вызываем колбэк
        onBidAccepted?.(bidId, freelancerId)
      }
    } catch (error) {
      console.error('Error accepting bid:', error)
    } finally {
      setAcceptingBid(null)
    }
  }

  const handleRejectBid = async (bidId: string) => {
    try {
      setRejectingBid(bidId)
      const response = await fetch(`/api/bids/${bidId}/reject`, {
        method: 'POST'
      })

      if (response.ok) {
        // Обновляем статус отклика локально
        setBids(prev => prev.map(bid => 
          bid.id === bidId ? { ...bid, status: 'rejected' } : bid
        ))
        
        onBidRejected?.(bidId)
      }
    } catch (error) {
      console.error('Error rejecting bid:', error)
    } finally {
      setRejectingBid(null)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMMM yyyy', { locale: ru })
    } catch {
      return dateString
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Загрузка откликов...</p>
        </CardContent>
      </Card>
    )
  }

  if (bids.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <MessageSquare className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Пока нет откликов
          </h3>
          <p className="text-gray-600">
            Исполнители еще не откликнулись на ваш проект
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Отклики ({bids.length})
        </h3>
        <Badge variant="outline" className="text-sm">
          {bids.filter(b => b.status === 'pending').length} новых
        </Badge>
      </div>

      {bids.map((bid) => (
        <Card key={bid.id} className={`
          border-l-4 ${bid.status === 'accepted' ? 'border-l-green-500' : 
          bid.status === 'rejected' ? 'border-l-red-500' : 'border-l-blue-500'}
        `}>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-start gap-4">
              {/* Информация о фрилансере */}
              <div className="flex-shrink-0">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={bid.freelancer?.avatar_url} />
                    <AvatarFallback>
                      <User className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">
                      {bid.freelancer?.full_name || 'Аноним'}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      {bid.freelancer?.rating && (
                        <>
                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                          <span>{bid.freelancer.rating.toFixed(1)}</span>
                        </>
                      )}
                      {bid.freelancer?.completed_projects && (
                        <span>• {bid.freelancer.completed_projects} проектов</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Основная информация отклика */}
              <div className="flex-1">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="space-y-1">
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      Предложение
                    </div>
                    <div className="font-bold text-lg">
                      {formatCurrency(bid.amount)}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Срок выполнения
                    </div>
                    <div className="font-medium">
                      {bid.delivery_time}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Дата отклика
                    </div>
                    <div className="text-sm">
                      {formatDate(bid.created_at)}
                    </div>
                  </div>
                </div>

                {/* Сообщение фрилансера */}
                <div className="mb-4">
                  <div className="text-sm text-gray-500 mb-1">Сообщение:</div>
                  <div className="bg-gray-50 rounded-lg p-3 text-sm">
                    {bid.message}
                  </div>
                </div>

                {/* Статус и действия */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      bid.status === 'accepted' ? 'default' :
                      bid.status === 'rejected' ? 'destructive' : 'secondary'
                    }>
                      {bid.status === 'accepted' && <CheckCircle className="h-3 w-3 mr-1" />}
                      {bid.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                      {bid.status === 'accepted' ? 'Принят' :
                       bid.status === 'rejected' ? 'Отклонен' : 'На рассмотрении'}
                    </Badge>
                  </div>

                  <div className="flex gap-2">
                    {/* Кнопка перехода в чат */}
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <Link href={`/dashboard/messages?user=${bid.freelancer_id}`}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Написать
                      </Link>
                    </Button>

                    {/* Кнопка просмотра профиля */}
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <Link href={`/freelancers/${bid.freelancer_id}`}>
                        <User className="h-4 w-4 mr-2" />
                        Профиль
                      </Link>
                    </Button>

                    {/* Кнопки действий для владельца проекта */}
                    {isOwner && bid.status === 'pending' && (
                      <>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleAcceptBid(bid.id, bid.freelancer_id)}
                          disabled={acceptingBid === bid.id}
                        >
                          {acceptingBid === bid.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-2" />
                          )}
                          Принять
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRejectBid(bid.id)}
                          disabled={rejectingBid === bid.id}
                        >
                          {rejectingBid === bid.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <XCircle className="h-4 w-4 mr-2" />
                          )}
                          Отклонить
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}