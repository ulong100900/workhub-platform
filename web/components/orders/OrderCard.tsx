import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, Calendar, User, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'

const categoryLabels: Record<string, string> = {
  EXCAVATION: 'Земляные работы',
  CRANE: 'Крановые работы',
  LOADING: 'Погрузочные работы',
  TRANSPORT: 'Перевозки',
  CONSTRUCTION: 'Строительные работы',
  CLEANING: 'Уборка/расчистка',
  REPAIR: 'Ремонтные работы',
  OTHER: 'Другое',
}

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

const statusLabels: Record<string, string> = {
  ACTIVE: 'Активна',
  IN_PROGRESS: 'В работе',
  COMPLETED: 'Завершена',
  CANCELLED: 'Отменена',
}

interface OrderCardProps {
  order: {
    id: string
    title: string
    description: string
    category: string
    budget: number | null
    city: string
    address: string
    status: string
    createdAt: Date
    customer: {
      id: string
      fullName: string
      rating: number
      completedJobs: number
    }
    _count: {
      bids: number
    }
  }
}

export default function OrderCard({ order }: OrderCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">
              <Link href={`/dashboard/orders/${order.id}`} className="hover:text-primary">
                {order.title}
              </Link>
            </CardTitle>
            <CardDescription className="mt-1">
              {order.description.length > 100 
                ? `${order.description.substring(0, 100)}...` 
                : order.description}
            </CardDescription>
          </div>
          <div className={cn("px-2 py-1 rounded text-xs font-medium", statusColors[order.status])}>
            {statusLabels[order.status]}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center text-sm text-gray-600">
          <div className="px-2 py-1 border rounded text-xs mr-2">
            {categoryLabels[order.category] || order.category}
          </div>
          {order.budget && (
            <span className="font-semibold text-green-600 ml-auto">
              {formatCurrency(order.budget)}
            </span>
          )}
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-gray-400" />
            <span>
              {order.city}, {order.address}
            </span>
          </div>
          
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
            <span>Создана: {formatDate(order.createdAt)}</span>
          </div>
          
          <div className="flex items-center">
            <User className="h-4 w-4 mr-2 text-gray-400" />
            <div className="flex items-center">
              <span className="font-medium">{order.customer.fullName}</span>
              <span className="mx-2">•</span>
              <span className="text-yellow-600">★ {order.customer.rating}</span>
              <span className="mx-2">•</span>
              <span>{order.customer.completedJobs} работ</span>
            </div>
          </div>
          
          <div className="flex items-center">
            <MessageSquare className="h-4 w-4 mr-2 text-gray-400" />
            <span>{order._count.bids} предложений</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-4">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/dashboard/orders/${order.id}`}>
            Подробнее
          </Link>
        </Button>
        
        <div className="flex gap-2">
          <Button size="sm" asChild>
            <Link href={`/dashboard/orders/${order.id}/bid`}>
              Предложить цену
            </Link>
          </Button>
          <Button size="sm" variant="secondary" asChild>
            <Link href={`/dashboard/messages?order=${order.id}`}>
              Написать
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

// Добавляем временную функцию cn для работы Badge
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}