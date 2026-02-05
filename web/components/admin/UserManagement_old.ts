'use client'

import { useState, useEffect } from 'react'
import { AdminService, User, Executor } from '@/lib/admin'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  Filter, 
  MoreVertical,
  User as UserIcon,
  Briefcase,
  Shield,
  CheckCircle,
  XCircle,
  Eye,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock
} from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [executors, setExecutors] = useState<Executor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    loadUsers()
  }, [activeTab])

  const loadUsers = async () => {
    setIsLoading(true)
    try {
      if (activeTab === 'executors') {
        const { executors: executorsData } = await AdminService.getExecutors({
          search: searchQuery || undefined
        })
        setExecutors(executorsData)
      } else {
        const { users: usersData } = await AdminService.getUsers({
          role: roleFilter !== 'all' ? roleFilter as any : undefined,
          status: statusFilter !== 'all' ? statusFilter as any : undefined,
          search: searchQuery || undefined
        })
        setUsers(usersData)
      }
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (userId: string, newStatus: 'active' | 'blocked') => {
    try {
      await AdminService.updateUserStatus(userId, newStatus)
      loadUsers() // Перезагружаем список
    } catch (error) {
      console.error('Error updating user status:', error)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'executor':
        return <Briefcase className="h-4 w-4 text-blue-500" />
      case 'customer':
        return <UserIcon className="h-4 w-4 text-green-500" />
      case 'admin':
        return <Shield className="h-4 w-4 text-purple-500" />
      default:
        return <UserIcon className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Активен
          </Badge>
        )
      case 'blocked':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Заблокирован
          </Badge>
        )
      case 'pending':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            <Clock className="h-3 w-3 mr-1" />
            Ожидание
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle>Управление пользователями</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              Экспорт
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Фильтры и поиск */}
        <div className="space-y-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Поиск по имени или email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Роль" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все роли</SelectItem>
                  <SelectItem value="executor">Исполнители</SelectItem>
                  <SelectItem value="customer">Заказчики</SelectItem>
                  <SelectItem value="admin">Админы</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Статус" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value="active">Активные</SelectItem>
                  <SelectItem value="blocked">Заблокированные</SelectItem>
                  <SelectItem value="pending">Ожидание</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Табы */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="all">Все пользователи</TabsTrigger>
            <TabsTrigger value="executors">Исполнители</TabsTrigger>
            <TabsTrigger value="customers">Заказчики</TabsTrigger>
          </TabsList>

          {/* Содержимое табов */}
          <TabsContent value="all" className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-32"></div>
                          <div className="h-3 bg-gray-200 rounded w-24"></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                        <div className="h-3 bg-gray-200 rounded w-16 ml-auto"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">Пользователи не найдены</h3>
                <p className="text-gray-500 mt-2">
                  Попробуйте изменить параметры поиска
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                          {getRoleIcon(user.role)}
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{user.fullName}</h4>
                            {getStatusBadge(user.status)}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              <span>{user.email}</span>
                            </div>
                            
                            {user.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                <span>{user.phone}</span>
                              </div>
                            )}
                            
                            {user.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                <span>{user.location}</span>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {format(new Date(user.createdAt), 'dd.MM.yyyy', { locale: ru })}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 mt-3">
                            <div className="flex items-center gap-2">
                              <Briefcase className="h-3 w-3 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                Заказов: {user.ordersCount}
                              </span>
                            </div>
                            
                            {user.totalSpent > 0 && (
                              <div className="flex items-center gap-2">
                                <Wallet className="h-3 w-3 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  Потратил: {user.totalSpent.toLocaleString()} ₽
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.location.href = `/admin/users/${user.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {user.status === 'active' ? (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleStatusChange(user.id, 'blocked')}
                          >
                            Заблокировать
                          </Button>
                        ) : (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleStatusChange(user.id, 'active')}
                          >
                            Разблокировать
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Исполнители */}
          <TabsContent value="executors">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-32"></div>
                          <div className="h-3 bg-gray-200 rounded w-24"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : executors.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">Исполнители не найдены</h3>
              </div>
            ) : (
              <div className="space-y-4">
                {executors.map((executor) => (
                  <div key={executor.id} className="p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                          <Briefcase className="h-6 w-6 text-blue-500" />
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{executor.fullName}</h4>
                            {getStatusBadge(executor.status)}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              <span>{executor.email}</span>
                            </div>
                            
                            {executor.specialization && (
                              <Badge variant="secondary">
                                {executor.specialization}
                              </Badge>
                            )}
                            
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-amber-500" />
                              <span>{executor.rating.toFixed(1)}</span>
                              <span className="text-gray-500">({executor.totalReviews})</span>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-4 mt-3">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              <span className="text-sm text-gray-600">
                                Завершено: {executor.completedOrders}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Wallet className="h-3 w-3 text-green-500" />
                              <span className="text-sm text-gray-600">
                                Заработал: {executor.earnings.toLocaleString()} ₽
                              </span>
                            </div>
                            
                            <Badge variant={
                              executor.verificationStatus === 'verified' ? 'default' :
                              executor.verificationStatus === 'pending' ? 'outline' :
                              'secondary'
                            }>
                              {executor.verificationStatus === 'verified' ? 'Верифицирован' :
                               executor.verificationStatus === 'pending' ? 'На проверке' :
                               'Не верифицирован'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.location.href = `/admin/executors/${executor.id}`}
                        >
                          Детали
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Заказчики */}
          <TabsContent value="customers">
            <div className="text-center py-12">
              <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Заказчики</h3>
              <p className="text-gray-500 mt-2">
                Список заказчиков будет отображаться здесь
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}