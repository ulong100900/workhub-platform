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
  User,
  Mail,
  Calendar,
  DollarSign,
  Star,
  Shield,
  AlertCircle,
  CheckCircle,
  XCircle,
  MoreVertical,
  Eye,
  Lock,
  Unlock,
  UserX,
  UserCheck
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

interface UserData {
  id: string
  email: string
  name: string
  role: string
  type: 'freelancer' | 'client'
  registrationDate: string
  lastLogin: string
  status: 'active' | 'suspended' | 'pending' | 'banned'
  balance: number
  rating: number
  reviewsCount: number
  ordersCount: number
  warnings: number
  suspensionReason?: string
  suspensionEnds?: string
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserData[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilters, setSelectedFilters] = useState({
    type: 'all',
    status: 'all',
    dateRange: 'all'
  })
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [isUserDetailsOpen, setIsUserDetailsOpen] = useState(false)
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false)
  const [suspensionData, setSuspensionData] = useState({
    reason: '',
    duration: '1',
    type: 'temporary'
  })

  useEffect(() => {
    // Временные моковые данные
    setTimeout(() => {
      const mockUsers: UserData[] = [
        {
          id: '1',
          email: 'ivan.petrov@example.com',
          name: 'Иван Петров',
          role: 'user',
          type: 'freelancer',
          registrationDate: '2023-10-15',
          lastLogin: '2024-01-22 10:30',
          status: 'active',
          balance: 87500,
          rating: 4.8,
          reviewsCount: 24,
          ordersCount: 12,
          warnings: 0
        },
        {
          id: '2',
          email: 'anna.ivanova@example.com',
          name: 'Анна Иванова',
          role: 'user',
          type: 'client',
          registrationDate: '2023-11-20',
          lastLogin: '2024-01-22 14:20',
          status: 'active',
          balance: 150000,
          rating: 4.9,
          reviewsCount: 8,
          ordersCount: 5,
          warnings: 1
        },
        {
          id: '3',
          email: 'dmitry.smirnov@example.com',
          name: 'Дмитрий Смирнов',
          role: 'user',
          type: 'freelancer',
          registrationDate: '2023-09-05',
          lastLogin: '2024-01-21 09:15',
          status: 'suspended',
          balance: 0,
          rating: 3.2,
          reviewsCount: 12,
          ordersCount: 8,
          warnings: 3,
          suspensionReason: 'Множественные жалобы от клиентов',
          suspensionEnds: '2024-02-22'
        },
        {
          id: '4',
          email: 'olga.kuznetsova@example.com',
          name: 'Ольга Кузнецова',
          role: 'user',
          type: 'client',
          registrationDate: '2024-01-10',
          lastLogin: '2024-01-20 16:45',
          status: 'pending',
          balance: 5000,
          rating: 0,
          reviewsCount: 0,
          ordersCount: 0,
          warnings: 0
        },
        {
          id: '5',
          email: 'petr.sidorov@example.com',
          name: 'Петр Сидоров',
          role: 'user',
          type: 'freelancer',
          registrationDate: '2023-12-01',
          lastLogin: '2024-01-19 11:20',
          status: 'banned',
          balance: 0,
          rating: 2.1,
          reviewsCount: 15,
          ordersCount: 10,
          warnings: 5,
          suspensionReason: 'Мошенничество',
          suspensionEnds: 'перманентно'
        }
      ]

      setUsers(mockUsers)
      setFilteredUsers(mockUsers)
      setIsLoading(false)
    }, 1000)
  }, [])

  useEffect(() => {
    let result = [...users]

    // Фильтр по статусу
    if (activeTab !== 'all') {
      result = result.filter(user => user.status === activeTab)
    }

    // Фильтр по типу
    if (selectedFilters.type !== 'all') {
      result = result.filter(user => user.type === selectedFilters.type)
    }

    // Поиск
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(user =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      )
    }

    // Фильтр по дате регистрации
    if (selectedFilters.dateRange !== 'all') {
      const now = new Date()
      const dateRange = selectedFilters.dateRange
      
      result = result.filter(user => {
        const regDate = new Date(user.registrationDate)
        
        if (dateRange === 'today') {
          return regDate.toDateString() === now.toDateString()
        } else if (dateRange === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          return regDate >= weekAgo
        } else if (dateRange === 'month') {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          return regDate >= monthAgo
        } else if (dateRange === 'year') {
          const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
          return regDate >= yearAgo
        }
        
        return true
      })
    }

    setFilteredUsers(result)
  }, [activeTab, selectedFilters, searchQuery, users])

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: string; icon: any }> = {
      active: { label: 'Активен', variant: 'success', icon: CheckCircle },
      suspended: { label: 'Приостановлен', variant: 'warning', icon: AlertCircle },
      pending: { label: 'На проверке', variant: 'secondary', icon: User },
      banned: { label: 'Забанен', variant: 'destructive', icon: XCircle }
    }
    
    const statusInfo = statusMap[status] || { label: status, variant: 'default', icon: User }
    const Icon = statusInfo.icon
    
    return (
      <Badge variant={statusInfo.variant as any} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {statusInfo.label}
      </Badge>
    )
  }

  const getTypeBadge = (type: string) => {
    return (
      <Badge variant="outline" className={
        type === 'freelancer' 
          ? 'bg-blue-50 text-blue-700' 
          : 'bg-green-50 text-green-700'
      }>
        {type === 'freelancer' ? 'Исполнитель' : 'Клиент'}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
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

  const handleViewUser = (user: UserData) => {
    setSelectedUser(user)
    setIsUserDetailsOpen(true)
  }

  const handleSuspendUser = (user: UserData) => {
    setSelectedUser(user)
    setIsSuspendDialogOpen(true)
  }

  const handleActivateUser = (userId: string) => {
    setUsers(prev => prev.map(user => 
      user.id === userId 
        ? { ...user, status: 'active', suspensionReason: undefined, suspensionEnds: undefined }
        : user
    ))
  }

  const handleBanUser = (userId: string) => {
    setUsers(prev => prev.map(user => 
      user.id === userId 
        ? { 
            ...user, 
            status: 'banned', 
            suspensionReason: 'Перманентная блокировка',
            suspensionEnds: 'перманентно'
          }
        : user
    ))
  }

  const handleSubmitSuspension = () => {
    if (!selectedUser) return

    setUsers(prev => prev.map(user => 
      user.id === selectedUser.id 
        ? { 
            ...user, 
            status: 'suspended',
            suspensionReason: suspensionData.reason,
            suspensionEnds: suspensionData.type === 'permanent' 
              ? 'перманентно'
              : new Date(Date.now() + parseInt(suspensionData.duration) * 24 * 60 * 60 * 1000).toISOString()
          }
        : user
    ))

    setSuspensionData({ reason: '', duration: '1', type: 'temporary' })
    setIsSuspendDialogOpen(false)
  }

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    suspended: users.filter(u => u.status === 'suspended').length,
    banned: users.filter(u => u.status === 'banned').length,
    freelancers: users.filter(u => u.type === 'freelancer').length,
    clients: users.filter(u => u.type === 'client').length
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
          <h1 className="text-3xl font-bold">Управление пользователями</h1>
          <p className="text-gray-600 mt-2">
            Управление аккаунтами пользователей и их статусами
          </p>
        </div>
        <Button>
          <User className="mr-2 h-4 w-4" />
          Добавить администратора
        </Button>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-gray-600">Всего пользователей</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.active}</div>
              <div className="text-sm text-gray-600">Активных</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.freelancers}</div>
              <div className="text-sm text-gray-600">Исполнителей</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.clients}</div>
              <div className="text-sm text-gray-600">Клиентов</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Фильтры и поиск */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Поиск по имени или email..."
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
                    <TabsTrigger value="active">Активные ({stats.active})</TabsTrigger>
                    <TabsTrigger value="suspended">Приостановленные ({stats.suspended})</TabsTrigger>
                    <TabsTrigger value="banned">Забаненные ({stats.banned})</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="flex gap-4">
                <Select 
                  value={selectedFilters.type} 
                  onValueChange={(value) => setSelectedFilters(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Все типы" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все типы</SelectItem>
                    <SelectItem value="freelancer">Исполнители</SelectItem>
                    <SelectItem value="client">Клиенты</SelectItem>
                  </SelectContent>
                </Select>

                <Select 
                  value={selectedFilters.dateRange} 
                  onValueChange={(value) => setSelectedFilters(prev => ({ ...prev, dateRange: value }))}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="За все время" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">За все время</SelectItem>
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

      {/* Список пользователей */}
      {filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <User className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">Пользователи не найдены</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery 
                ? 'Попробуйте изменить параметры поиска'
                : 'Нет пользователей с выбранными фильтрами'}
            </p>
            <Button onClick={() => {
              setActiveTab('all')
              setSearchQuery('')
              setSelectedFilters({ type: 'all', status: 'all', dateRange: 'all' })
            }}>
              Сбросить фильтры
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Информация о пользователе */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusBadge(user.status)}
                          {getTypeBadge(user.type)}
                          {user.warnings > 0 && (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {user.warnings} предупреждений
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-bold text-lg">{user.name}</div>
                            <div className="text-sm text-gray-600 flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewUser(user)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Подробнее
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleActivateUser(user.id)}>
                            <UserCheck className="h-4 w-4 mr-2" />
                            Активировать
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSuspendUser(user)}>
                            <Lock className="h-4 w-4 mr-2" />
                            Приостановить
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleBanUser(user.id)}
                            className="text-red-600"
                          >
                            <UserX className="h-4 w-4 mr-2" />
                            Забанить
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Статистика пользователя */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="space-y-1">
                        <div className="text-gray-600 flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Регистрация:
                        </div>
                        <div className="font-medium">{formatDate(user.registrationDate)}</div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-gray-600 flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          Баланс:
                        </div>
                        <div className="font-medium">{formatCurrency(user.balance)}</div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-gray-600 flex items-center gap-1">
                          <Star className="h-4 w-4" />
                          Рейтинг:
                        </div>
                        <div className="font-medium">{user.rating}/5 ({user.reviewsCount} отзывов)</div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-gray-600">Проекты:</div>
                        <div className="font-medium">{user.ordersCount}</div>
                      </div>
                    </div>

                    {/* Причина блокировки */}
                    {user.suspensionReason && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <div className="font-medium text-red-800">
                            {user.status === 'suspended' ? 'Приостановлен' : 'Забанен'}
                          </div>
                        </div>
                        <div className="text-sm text-red-700">
                          Причина: {user.suspensionReason}
                          {user.suspensionEnds && user.suspensionEnds !== 'перманентно' && (
                            <div className="mt-1">
                              До: {formatDate(user.suspensionEnds)}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Действия */}
                  <div className="lg:w-48 space-y-3">
                    <div className="space-y-2">
                      <Button 
                        className="w-full"
                        variant={user.status === 'active' ? 'outline' : 'default'}
                        onClick={() => handleActivateUser(user.id)}
                        disabled={user.status === 'active'}
                      >
                        <UserCheck className="mr-2 h-4 w-4" />
                        Активировать
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => handleSuspendUser(user)}
                        disabled={user.status === 'suspended' || user.status === 'banned'}
                      >
                        <Lock className="mr-2 h-4 w-4" />
                        Приостановить
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleBanUser(user.id)}
                        disabled={user.status === 'banned'}
                      >
                        <UserX className="mr-2 h-4 w-4" />
                        Забанить
                      </Button>
                    </div>

                    {/* Быстрые действия */}
                    <div className="pt-4 border-t">
                      <div className="text-sm font-medium mb-2">Быстрые действия:</div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm">
                          <Mail className="h-3 w-3 mr-1" />
                          Написать
                        </Button>
                        <Button variant="outline" size="sm">
                          <Shield className="h-3 w-3 mr-1" />
                          Предупреждение
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

      {/* Статистика пользователей */}
      <Card>
        <CardHeader>
          <CardTitle>Статистика пользователей</CardTitle>
          <CardDescription>
            Активность и распределение пользователей
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="text-sm font-medium">Новых пользователей за месяц</div>
              <div className="text-2xl font-bold">48</div>
              <div className="text-sm text-gray-600">+12% к прошлому месяцу</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Средний рейтинг</div>
              <div className="text-2xl font-bold">4.5/5</div>
              <div className="text-sm text-gray-600">По всем пользователям</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Коэффициент удержания</div>
              <div className="text-2xl font-bold">87%</div>
              <div className="text-sm text-gray-600">Пользователей остаются активными</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Диалог деталей пользователя */}
      <Dialog open={isUserDetailsOpen} onOpenChange={setIsUserDetailsOpen}>
        <DialogContent className="max-w-3xl">
          {selectedUser && (
            <>
              <DialogHeader>
                <DialogTitle>Детали пользователя</DialogTitle>
                <DialogDescription>
                  Полная информация о пользователе {selectedUser.name}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Основная информация</Label>
                      <div className="mt-2 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Имя:</span>
                          <span className="font-medium">{selectedUser.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Email:</span>
                          <span className="font-medium">{selectedUser.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Тип:</span>
                          {getTypeBadge(selectedUser.type)}
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Статус:</span>
                          {getStatusBadge(selectedUser.status)}
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Финансы</Label>
                      <div className="mt-2 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Баланс:</span>
                          <span className="font-medium">{formatCurrency(selectedUser.balance)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Всего заказов:</span>
                          <span className="font-medium">{selectedUser.ordersCount}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Статистика</Label>
                      <div className="mt-2 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Рейтинг:</span>
                          <span className="font-medium">{selectedUser.rating}/5</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Отзывов:</span>
                          <span className="font-medium">{selectedUser.reviewsCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Предупреждений:</span>
                          <span className="font-medium">{selectedUser.warnings}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Дата регистрации:</span>
                          <span className="font-medium">{formatDate(selectedUser.registrationDate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Последний вход:</span>
                          <span className="font-medium">{selectedUser.lastLogin}</span>
                        </div>
                      </div>
                    </div>

                    {selectedUser.suspensionReason && (
                      <div>
                        <Label className="text-sm font-medium text-red-600">Информация о блокировке</Label>
                        <div className="mt-2 p-3 bg-red-50 rounded-lg">
                          <div className="text-sm font-medium mb-1">Причина:</div>
                          <div className="text-sm text-red-700">{selectedUser.suspensionReason}</div>
                          {selectedUser.suspensionEnds && (
                            <>
                              <div className="text-sm font-medium mt-2 mb-1">Действует до:</div>
                              <div className="text-sm text-red-700">{selectedUser.suspensionEnds}</div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <Label className="text-sm font-medium">История действий</Label>
                  <div className="mt-2 text-sm text-gray-600">
                    Здесь будет отображаться история действий пользователя
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setIsUserDetailsOpen(false)}>
                  Закрыть
                </Button>
                <Button onClick={() => {
                  setIsUserDetailsOpen(false)
                  handleSuspendUser(selectedUser)
                }}>
                  <Lock className="mr-2 h-4 w-4" />
                  Приостановить доступ
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Диалог приостановки пользователя */}
      <Dialog open={isSuspendDialogOpen} onOpenChange={setIsSuspendDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Приостановка пользователя</DialogTitle>
            <DialogDescription>
              Приостановить доступ пользователя {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="suspension-type">Тип блокировки</Label>
              <Select 
                value={suspensionData.type} 
                onValueChange={(value) => setSuspensionData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger id="suspension-type">
                  <SelectValue placeholder="Выберите тип" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="temporary">Временная блокировка</SelectItem>
                  <SelectItem value="permanent">Перманентная блокировка</SelectItem>
                  <SelectItem value="warning">Предупреждение</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {suspensionData.type === 'temporary' && (
              <div className="space-y-2">
                <Label htmlFor="duration">Длительность (дни)</Label>
                <Select 
                  value={suspensionData.duration} 
                  onValueChange={(value) => setSuspensionData(prev => ({ ...prev, duration: value }))}
                >
                  <SelectTrigger id="duration">
                    <SelectValue placeholder="Выберите длительность" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 день</SelectItem>
                    <SelectItem value="3">3 дня</SelectItem>
                    <SelectItem value="7">7 дней</SelectItem>
                    <SelectItem value="14">14 дней</SelectItem>
                    <SelectItem value="30">30 дней</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="reason">Причина блокировки</Label>
              <Textarea
                id="reason"
                placeholder="Опишите причину блокировки пользователя..."
                value={suspensionData.reason}
                onChange={(e) => setSuspensionData(prev => ({ ...prev, reason: e.target.value }))}
                className="min-h-[100px]"
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-700">
                  Приостановка доступа пользователя ограничит его возможности на платформе.
                  Пользователь получит уведомление о блокировке.
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSuspendDialogOpen(false)}>
              Отмена
            </Button>
            <Button 
              onClick={handleSubmitSuspension}
              disabled={!suspensionData.reason.trim()}
            >
              <Lock className="mr-2 h-4 w-4" />
              Приостановить доступ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}