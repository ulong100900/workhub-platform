'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Search,
  Filter,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  User,
  CreditCard,
  Banknote,
  Wallet,
  TrendingUp,
  Calendar,
  Download,
  MoreVertical,
  Eye,
  Check,
  X,
  Send
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'

interface Payout {
  id: string
  userId: string
  userName: string
  userEmail: string
  amount: number
  method: 'bank_card' | 'bank_transfer' | 'yoomoney' | 'qiwi'
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  createdAt: string
  processedAt?: string
  completedAt?: string
  transactionId?: string
  commission: number
  netAmount: number
  reason?: string
  adminNote?: string
}

export default function PayoutsManagement() {
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [filteredPayouts, setFilteredPayouts] = useState<Payout[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null)
  const [isPayoutDetailsOpen, setIsPayoutDetailsOpen] = useState(false)
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false)
  const [approvalNote, setApprovalNote] = useState('')

  useEffect(() => {
    // Временные моковые данные
    setTimeout(() => {
      const mockPayouts: Payout[] = [
        {
          id: 'PYT-2024-001',
          userId: '101',
          userName: 'Иван Петров',
          userEmail: 'ivan.petrov@example.com',
          amount: 50000,
          method: 'bank_card',
          status: 'pending',
          createdAt: '2024-01-22 10:30',
          commission: 2500,
          netAmount: 47500
        },
        {
          id: 'PYT-2024-002',
          userId: '102',
          userName: 'Анна Иванова',
          userEmail: 'anna.ivanova@example.com',
          amount: 125000,
          method: 'bank_transfer',
          status: 'processing',
          createdAt: '2024-01-21 14:20',
          processedAt: '2024-01-22 09:15',
          transactionId: 'TRX-987654',
          commission: 6250,
          netAmount: 118750
        },
        {
          id: 'PYT-2024-003',
          userId: '103',
          userName: 'Дмитрий Смирнов',
          userEmail: 'dmitry.smirnov@example.com',
          amount: 75000,
          method: 'yoomoney',
          status: 'completed',
          createdAt: '2024-01-20 11:45',
          processedAt: '2024-01-20 15:30',
          completedAt: '2024-01-21 10:00',
          transactionId: 'TRX-123456',
          commission: 3750,
          netAmount: 71250
        },
        {
          id: 'PYT-2024-004',
          userId: '104',
          userName: 'Ольга Кузнецова',
          userEmail: 'olga.kuznetsova@example.com',
          amount: 30000,
          method: 'qiwi',
          status: 'failed',
          createdAt: '2024-01-19 16:10',
          processedAt: '2024-01-20 11:20',
          reason: 'Неверные реквизиты',
          commission: 1500,
          netAmount: 28500
        },
        {
          id: 'PYT-2024-005',
          userId: '105',
          userName: 'Петр Сидоров',
          userEmail: 'petr.sidorov@example.com',
          amount: 90000,
          method: 'bank_card',
          status: 'cancelled',
          createdAt: '2024-01-18 09:30',
          reason: 'Отмена пользователем',
          commission: 4500,
          netAmount: 85500,
          adminNote: 'Пользователь отменил заявку через 2 часа'
        }
      ]

      setPayouts(mockPayouts)
      setFilteredPayouts(mockPayouts)
      setIsLoading(false)
    }, 1000)
  }, [])

  useEffect(() => {
    let result = [...payouts]

    // Фильтр по статусу
    if (activeTab !== 'all') {
      result = result.filter(payout => payout.status === activeTab)
    }

    // Поиск
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(payout =>
        payout.userName.toLowerCase().includes(query) ||
        payout.userEmail.toLowerCase().includes(query) ||
        payout.id.toLowerCase().includes(query) ||
        (payout.transactionId && payout.transactionId.toLowerCase().includes(query))
      )
    }

    setFilteredPayouts(result)
  }, [activeTab, searchQuery, payouts])

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: string; icon: any }> = {
      pending: { label: 'Ожидает', variant: 'secondary', icon: Clock },
      processing: { label: 'В обработке', variant: 'warning', icon: AlertCircle },
      completed: { label: 'Выполнена', variant: 'success', icon: CheckCircle },
      failed: { label: 'Неудача', variant: 'destructive', icon: XCircle },
      cancelled: { label: 'Отменена', variant: 'outline', icon: X }
    }
    
    const statusInfo = statusMap[status] || { label: status, variant: 'default', icon: DollarSign }
    const Icon = statusInfo.icon
    
    return (
      <Badge variant={statusInfo.variant as any} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {statusInfo.label}
      </Badge>
    )
  }

  const getMethodBadge = (method: string) => {
    const methodMap: Record<string, { label: string; icon: any }> = {
      bank_card: { label: 'Банковская карта', icon: CreditCard },
      bank_transfer: { label: 'Банковский перевод', icon: Banknote },
      yoomoney: { label: 'ЮMoney', icon: Wallet },
      qiwi: { label: 'QIWI', icon: DollarSign }
    }
    
    const methodInfo = methodMap[method] || { label: method, icon: CreditCard }
    const Icon = methodInfo.icon
    
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {methodInfo.label}
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
    return new Date(dateString).toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleViewPayout = (payout: Payout) => {
    setSelectedPayout(payout)
    setIsPayoutDetailsOpen(true)
  }

  const handleApprovePayout = (payout: Payout) => {
    setSelectedPayout(payout)
    setIsApproveDialogOpen(true)
  }

  const handleProcessPayout = (payoutId: string) => {
    setPayouts(prev => prev.map(payout =>
      payout.id === payoutId
        ? { 
            ...payout, 
            status: 'processing',
            processedAt: new Date().toISOString(),
            transactionId: `TRX-${Date.now()}`
          }
        : payout
    ))
  }

  const handleCompletePayout = (payoutId: string) => {
    setPayouts(prev => prev.map(payout =>
      payout.id === payoutId
        ? { 
            ...payout, 
            status: 'completed',
            completedAt: new Date().toISOString(),
            adminNote: approvalNote || 'Выплата успешно завершена'
          }
        : payout
    ))
    setApprovalNote('')
    setIsApproveDialogOpen(false)
  }

  const handleRejectPayout = (payoutId: string, reason: string) => {
    setPayouts(prev => prev.map(payout =>
      payout.id === payoutId
        ? { 
            ...payout, 
            status: 'failed',
            reason,
            adminNote: `Отклонено: ${reason}`
          }
        : payout
    ))
  }

  const handleCancelPayout = (payoutId: string) => {
    setPayouts(prev => prev.map(payout =>
      payout.id === payoutId
        ? { 
            ...payout, 
            status: 'cancelled',
            adminNote: 'Отменено администратором'
          }
        : payout
    ))
  }

  const stats = {
    total: payouts.length,
    pending: payouts.filter(p => p.status === 'pending').length,
    processing: payouts.filter(p => p.status === 'processing').length,
    completed: payouts.filter(p => p.status === 'completed').length,
    totalAmount: payouts.reduce((sum, p) => sum + p.amount, 0),
    pendingAmount: payouts
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + p.amount, 0)
  }

  const methodStats = {
    bank_card: payouts.filter(p => p.method === 'bank_card').length,
    bank_transfer: payouts.filter(p => p.method === 'bank_transfer').length,
    yoomoney: payouts.filter(p => p.method === 'yoomoney').length,
    qiwi: payouts.filter(p => p.method === 'qiwi').length
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Управление выплатами</h1>
          <p className="text-gray-600 mt-2">
            Обработка и управление выплатами пользователям
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Экспорт отчетов
          </Button>
          <Button>
            <TrendingUp className="mr-2 h-4 w-4" />
            Финансовая аналитика
          </Button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</div>
              <div className="text-sm text-gray-600">Общая сумма выплат</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{formatCurrency(stats.pendingAmount)}</div>
              <div className="text-sm text-gray-600">На ожидании</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.pending}</div>
              <div className="text-sm text-gray-600">Ожидают обработки</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.completed}</div>
              <div className="text-sm text-gray-600">Выполнено</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Статистика по методам */}
      <Card>
        <CardHeader>
          <CardTitle>Распределение по методам выплат</CardTitle>
          <CardDescription>Количество выплат по каждому методу</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-blue-600" />
                <div className="text-sm font-medium">Банковские карты</div>
              </div>
              <div className="text-2xl font-bold">{methodStats.bank_card}</div>
              <Progress value={(methodStats.bank_card / stats.total) * 100} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Banknote className="h-4 w-4 text-green-600" />
                <div className="text-sm font-medium">Банковские переводы</div>
              </div>
              <div className="text-2xl font-bold">{methodStats.bank_transfer}</div>
              <Progress value={(methodStats.bank_transfer / stats.total) * 100} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-purple-600" />
                <div className="text-sm font-medium">ЮMoney</div>
              </div>
              <div className="text-2xl font-bold">{methodStats.yoomoney}</div>
              <Progress value={(methodStats.yoomoney / stats.total) * 100} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-orange-600" />
                <div className="text-sm font-medium">QIWI</div>
              </div>
              <div className="text-2xl font-bold">{methodStats.qiwi}</div>
              <Progress value={(methodStats.qiwi / stats.total) * 100} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Фильтры и поиск */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Поиск по ID, имени, email или номеру транзакции..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Расширенные фильтры
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList>
                    <TabsTrigger value="all">Все ({stats.total})</TabsTrigger>
                    <TabsTrigger value="pending">Ожидают ({stats.pending})</TabsTrigger>
                    <TabsTrigger value="processing">В обработке ({stats.processing})</TabsTrigger>
                    <TabsTrigger value="completed">Выполнены ({stats.completed})</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="flex gap-4">
                <Select>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Метод оплаты" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все методы</SelectItem>
                    <SelectItem value="bank_card">Банковская карта</SelectItem>
                    <SelectItem value="bank_transfer">Банковский перевод</SelectItem>
                    <SelectItem value="yoomoney">ЮMoney</SelectItem>
                    <SelectItem value="qiwi">QIWI</SelectItem>
                  </SelectContent>
                </Select>

                <Select>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Дата" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Сегодня</SelectItem>
                    <SelectItem value="week">За неделю</SelectItem>
                    <SelectItem value="month">За месяц</SelectItem>
                    <SelectItem value="year">За год</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Список выплат */}
      {filteredPayouts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <DollarSign className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">Выплаты не найдены</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery 
                ? 'Попробуйте изменить параметры поиска'
                : 'Нет выплат с выбранными фильтрами'}
            </p>
            <Button onClick={() => {
              setActiveTab('all')
              setSearchQuery('')
            }}>
              Сбросить фильтры
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredPayouts.map((payout) => (
            <Card key={payout.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Информация о выплате */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getStatusBadge(payout.status)}
                          {getMethodBadge(payout.method)}
                          <Badge variant="outline" className="font-mono">
                            {payout.id}
                          </Badge>
                          {payout.transactionId && (
                            <Badge variant="outline" className="font-mono">
                              {payout.transactionId}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-bold text-lg">{payout.userName}</div>
                            <div className="text-sm text-gray-600">{payout.userEmail}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(payout.amount)}
                        </div>
                        <div className="text-sm text-gray-600">
                          Комиссия: {formatCurrency(payout.commission)}
                        </div>
                        <div className="text-sm font-medium">
                          Чистая: {formatCurrency(payout.netAmount)}
                        </div>
                      </div>
                    </div>

                    {/* Дополнительная информация */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="space-y-1">
                        <div className="text-gray-600">Создана:</div>
                        <div className="font-medium">{formatDate(payout.createdAt)}</div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-gray-600">Обработана:</div>
                        <div className="font-medium">
                          {payout.processedAt ? formatDate(payout.processedAt) : '—'}
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-gray-600">Завершена:</div>
                        <div className="font-medium">
                          {payout.completedAt ? formatDate(payout.completedAt) : '—'}
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-gray-600">Действия:</div>
                        <div className="font-medium">
                          {payout.status === 'pending' && 'Требует утверждения'}
                          {payout.status === 'processing' && 'В процессе выплаты'}
                          {payout.status === 'completed' && 'Успешно завершена'}
                          {payout.status === 'failed' && 'Требует внимания'}
                          {payout.status === 'cancelled' && 'Отменена'}
                        </div>
                      </div>
                    </div>

                    {/* Причины и заметки */}
                    {(payout.reason || payout.adminNote) && (
                      <div className="p-3 bg-gray-50 border rounded-lg">
                        {payout.reason && (
                          <div className="mb-2">
                            <div className="flex items-center gap-2 text-red-600 font-medium mb-1">
                              <AlertCircle className="h-4 w-4" />
                              Причина:
                            </div>
                            <div className="text-sm">{payout.reason}</div>
                          </div>
                        )}
                        {payout.adminNote && (
                          <div>
                            <div className="flex items-center gap-2 text-gray-600 font-medium mb-1">
                              <Calendar className="h-4 w-4" />
                              Заметка администратора:
                            </div>
                            <div className="text-sm">{payout.adminNote}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Действия */}
                  <div className="lg:w-48 space-y-3">
                    <div className="space-y-2">
                      <Button 
                        className="w-full"
                        onClick={() => handleViewPayout(payout)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Подробнее
                      </Button>
                      
                      {payout.status === 'pending' && (
                        <>
                          <Button 
                            variant="default" 
                            className="w-full"
                            onClick={() => handleApprovePayout(payout)}
                          >
                            <Check className="mr-2 h-4 w-4" />
                            Утвердить
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleRejectPayout(payout.id, 'Недостаточно средств')}
                          >
                            <X className="mr-2 h-4 w-4" />
                            Отклонить
                          </Button>
                        </>
                      )}
                      
                      {payout.status === 'processing' && (
                        <Button 
                          variant="default" 
                          className="w-full"
                          onClick={() => handleCompletePayout(payout.id)}
                        >
                          <Send className="mr-2 h-4 w-4" />
                          Завершить
                        </Button>
                      )}
                      
                      {(payout.status === 'pending' || payout.status === 'processing') && (
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => handleCancelPayout(payout.id)}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Отменить
                        </Button>
                      )}
                    </div>

                    {/* Быстрые действия */}
                    <div className="pt-4 border-t">
                      <div className="text-sm font-medium mb-2">Быстрые действия:</div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm">
                          <User className="h-3 w-3 mr-1" />
                          Профиль
                        </Button>
                        <Button variant="outline" size="sm">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Уведомить
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Финансовая статистика */}
      <Card>
        <CardHeader>
          <CardTitle>Финансовая статистика</CardTitle>
          <CardDescription>
            Анализ выплат и комиссий за последние 30 дней
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="text-sm font-medium">Общая сумма выплат</div>
              <div className="text-2xl font-bold">{formatCurrency(485000)}</div>
              <div className="text-sm text-gray-600">За последние 30 дней</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Комиссия платформы</div>
              <div className="text-2xl font-bold">{formatCurrency(24250)}</div>
              <div className="text-sm text-gray-600">5% от общей суммы</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Среднее время обработки</div>
              <div className="text-2xl font-bold">1.8 дня</div>
              <div className="text-sm text-gray-600">От заявки до выплаты</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Диалог деталей выплаты */}
      <Dialog open={isPayoutDetailsOpen} onOpenChange={setIsPayoutDetailsOpen}>
        <DialogContent className="max-w-2xl">
          {selectedPayout && (
            <>
              <DialogHeader>
                <DialogTitle>Детали выплаты {selectedPayout.id}</DialogTitle>
                <DialogDescription>
                  Полная информация о выплате пользователю
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Основная информация */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Информация о пользователе</Label>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <User className="h-8 w-8 text-blue-600" />
                          <div>
                            <div className="font-bold">{selectedPayout.userName}</div>
                            <div className="text-sm text-gray-600">{selectedPayout.userEmail}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Метод выплаты</Label>
                      <div className="mt-2">
                        {getMethodBadge(selectedPayout.method)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Финансовая информация</Label>
                      <div className="mt-2 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Сумма выплаты:</span>
                          <span className="text-2xl font-bold text-green-600">
                            {formatCurrency(selectedPayout.amount)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Комиссия платформы:</span>
                          <span className="text-lg font-medium text-red-600">
                            {formatCurrency(selectedPayout.commission)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center border-t pt-2">
                          <span className="text-gray-600 font-medium">Чистая сумма:</span>
                          <span className="text-xl font-bold">
                            {formatCurrency(selectedPayout.netAmount)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Статус</Label>
                      <div className="mt-2">
                        {getStatusBadge(selectedPayout.status)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* История */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium">История выплаты</Label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div className="flex-1">
                        <div className="font-medium">Создана заявка</div>
                        <div className="text-sm text-gray-600">{formatDate(selectedPayout.createdAt)}</div>
                      </div>
                    </div>
                    
                    {selectedPayout.processedAt && (
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-blue-400" />
                        <div className="flex-1">
                          <div className="font-medium">Начата обработка</div>
                          <div className="text-sm text-gray-600">{formatDate(selectedPayout.processedAt)}</div>
                          {selectedPayout.transactionId && (
                            <div className="text-sm">ID транзакции: {selectedPayout.transactionId}</div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {selectedPayout.completedAt && (
                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-400" />
                        <div className="flex-1">
                          <div className="font-medium">Выплата завершена</div>
                          <div className="text-sm text-gray-600">{formatDate(selectedPayout.completedAt)}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Дополнительная информация */}
                {(selectedPayout.reason || selectedPayout.adminNote) && (
                  <div className="space-y-4">
                    <Label className="text-sm font-medium">Дополнительная информация</Label>
                    <div className="space-y-2">
                      {selectedPayout.reason && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <div className="font-medium text-red-800">Причина:</div>
                          </div>
                          <div className="text-sm text-red-700">{selectedPayout.reason}</div>
                        </div>
                      )}
                      {selectedPayout.adminNote && (
                        <div className="p-3 bg-gray-50 border rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <MessageSquare className="h-4 w-4 text-gray-600" />
                            <div className="font-medium">Заметка администратора:</div>
                          </div>
                          <div className="text-sm text-gray-700">{selectedPayout.adminNote}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setIsPayoutDetailsOpen(false)}>
                  Закрыть
                </Button>
                {selectedPayout.status === 'pending' && (
                  <Button onClick={() => handleApprovePayout(selectedPayout)}>
                    <Check className="mr-2 h-4 w-4" />
                    Утвердить выплату
                  </Button>
                )}
                {selectedPayout.status === 'processing' && (
                  <Button onClick={() => handleCompletePayout(selectedPayout.id)}>
                    <Send className="mr-2 h-4 w-4" />
                    Завершить выплату
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Диалог утверждения выплаты */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Утверждение выплаты</DialogTitle>
            <DialogDescription>
              Утвердить выплату {selectedPayout?.id} на сумму {formatCurrency(selectedPayout?.amount || 0)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="approval-note">Примечание</Label>
              <Textarea
                id="approval-note"
                placeholder="Добавьте примечание (необязательно)..."
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-700">
                  После утверждения выплата перейдет в статус "В обработке".
                  Пользователь получит уведомление о начале обработки выплаты.
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-sm font-medium mb-1">Сводка выплаты:</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Сумма:</span>
                  <span className="font-medium">{formatCurrency(selectedPayout?.amount || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Комиссия:</span>
                  <span className="font-medium">{formatCurrency(selectedPayout?.commission || 0)}</span>
                </div>
                <div className="flex justify-between border-t pt-1">
                  <span>К выплате:</span>
                  <span className="font-bold">{formatCurrency(selectedPayout?.netAmount || 0)}</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>
              Отмена
            </Button>
            <Button 
              onClick={() => {
                if (selectedPayout) {
                  handleProcessPayout(selectedPayout.id)
                }
                setIsApproveDialogOpen(false)
              }}
            >
              <Check className="mr-2 h-4 w-4" />
              Утвердить и начать обработку
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}