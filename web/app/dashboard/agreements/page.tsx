
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileSignature, 
  FileText, 
  MessageSquare, 
  CheckCircle, 
  Clock,
  AlertTriangle,
  Users,
  DollarSign,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'

interface Agreement {
  id: string
  projectId: string
  projectTitle: string
  clientName: string
  freelancerName: string
  agreedAmount: number
  status: 'pending' | 'agreed' | 'in_progress' | 'completed' | 'disputed'
  createdAt: string
  deadline?: string
  paymentMethod?: string
}

export default function AgreementsPage() {
  const [activeTab, setActiveTab] = useState('all')
  const [agreements, setAgreements] = useState<Agreement[]>([
    {
      id: '1',
      projectId: 'PRJ-001',
      projectTitle: 'Разработка логотипа для кофейни',
      clientName: 'Иван Петров',
      freelancerName: 'Алексей Сидоров',
      agreedAmount: 25000,
      status: 'agreed',
      createdAt: '2024-01-20',
      deadline: '2024-02-10',
      paymentMethod: 'Банковский перевод'
    },
    {
      id: '2',
      projectId: 'PRJ-002',
      projectTitle: 'Создание сайта-визитки',
      clientName: 'ООО "ТехноСтарт"',
      freelancerName: 'Мария Иванова',
      agreedAmount: 45000,
      status: 'in_progress',
      createdAt: '2024-01-18',
      deadline: '2024-02-28',
      paymentMethod: 'СБП'
    },
    {
      id: '3',
      projectId: 'PRJ-003',
      projectTitle: 'Написание статьи о блокчейне',
      clientName: 'Кирилл Волков',
      freelancerName: 'Елена Смирнова',
      agreedAmount: 12000,
      status: 'completed',
      createdAt: '2024-01-15',
      deadline: '2024-01-25',
      paymentMethod: 'ЮMoney'
    },
    {
      id: '4',
      projectId: 'PRJ-004',
      projectTitle: 'Дизайн мобильного приложения',
      clientName: 'Сергей Козлов',
      freelancerName: 'Дмитрий Федоров',
      agreedAmount: 80000,
      status: 'pending',
      createdAt: '2024-01-22',
      paymentMethod: 'Карта'
    },
  ])

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
      year: 'numeric'
    })
  }

  const getStatusBadge = (status: Agreement['status']) => {
    const statusMap = {
      pending: { label: 'На согласовании', variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
      agreed: { label: 'Согласовано', variant: 'default', icon: <FileSignature className="h-3 w-3" /> },
      in_progress: { label: 'В работе', variant: 'outline', icon: <FileText className="h-3 w-3" /> },
      completed: { label: 'Завершено', variant: 'success', icon: <CheckCircle className="h-3 w-3" /> },
      disputed: { label: 'Спор', variant: 'destructive', icon: <AlertTriangle className="h-3 w-3" /> }
    }
    return statusMap[status]
  }

  const filteredAgreements = agreements.filter(agreement => {
    if (activeTab === 'all') return true
    return agreement.status === activeTab
  })

  const stats = {
    total: agreements.length,
    totalAmount: agreements.reduce((sum, a) => sum + a.agreedAmount, 0),
    pending: agreements.filter(a => a.status === 'pending').length,
    inProgress: agreements.filter(a => a.status === 'in_progress').length,
    completed: agreements.filter(a => a.status === 'completed').length
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileSignature className="h-8 w-8" />
          Договоренности
        </h1>
        <p className="text-gray-600 mt-2">
          Управляйте финансовыми договоренностями по вашим проектам
        </p>
      </div>

      {/* Важное предупреждение */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-yellow-800">Внимание!</h3>
              <p className="text-sm text-yellow-700 mt-1">
                WorkFinder <strong>не является платежной системой</strong>. Все расчеты происходят 
                напрямую между заказчиком и исполнителем. Платформа предоставляет только инструменты 
                для договоренностей и отслеживания обязательств.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего договоренностей</CardTitle>
            <FileSignature className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-gray-500">за все время</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Общая сумма</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</div>
            <p className="text-xs text-gray-500">по всем проектам</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">В работе</CardTitle>
            <FileText className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <p className="text-xs text-gray-500">активные проекты</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Завершено</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-gray-500">успешных проектов</p>
          </CardContent>
        </Card>
      </div>

      {/* Как это работает */}
      <Card>
        <CardHeader>
          <CardTitle>Как это работает?</CardTitle>
          <CardDescription>
            Пошаговый процесс договоренностей на платформе
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-medium mb-2">1. Обсуждение</h4>
              <p className="text-sm text-gray-600">Договариваетесь о цене и сроках в чате проекта</p>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <FileSignature className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-medium mb-2">2. Фиксация</h4>
              <p className="text-sm text-gray-600">Фиксируете договоренность в описании проекта</p>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-medium mb-2">3. Работа</h4>
              <p className="text-sm text-gray-600">Исполнитель выполняет работу по договоренности</p>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="h-6 w-6 text-orange-600" />
              </div>
              <h4 className="font-medium mb-2">4. Завершение</h4>
              <p className="text-sm text-gray-600">Проводите оплату и оставляете отзывы</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Список договоренностей */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Мои договоренности</CardTitle>
              <CardDescription>
                Все финансовые договоренности по вашим проектам
              </CardDescription>
            </div>
            <Button asChild>
              <Link href="/dashboard/orders/create">
                Создать новый проект
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">Все</TabsTrigger>
              <TabsTrigger value="pending">На согласовании</TabsTrigger>
              <TabsTrigger value="in_progress">В работе</TabsTrigger>
              <TabsTrigger value="completed">Завершено</TabsTrigger>
            </TabsList>

            {filteredAgreements.length === 0 ? (
              <div className="text-center py-12">
                <FileSignature className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">Договоренностей нет</h3>
                <p className="text-gray-500 mt-2">
                  У вас пока нет договоренностей по этому фильтру
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAgreements.map((agreement) => {
                  const statusBadge = getStatusBadge(agreement.status)
                  
                  return (
                    <div key={agreement.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium">{agreement.projectTitle}</h4>
                                <Badge variant={statusBadge.variant as any} className="flex items-center gap-1">
                                  {statusBadge.icon}
                                  {statusBadge.label}
                                </Badge>
                              </div>
                              
                              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-2">
                                <span className="flex items-center gap-1">
                                  <span className="font-medium">ID:</span> {agreement.projectId}
                                </span>
                                <span className="flex items-center gap-1">
                                  <span className="font-medium">Создана:</span> {formatDate(agreement.createdAt)}
                                </span>
                                {agreement.deadline && (
                                  <span className="flex items-center gap-1">
                                    <span className="font-medium">Дедлайн:</span> {formatDate(agreement.deadline)}
                                  </span>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-4 text-sm">
                                <span>
                                  <span className="font-medium">Заказчик:</span> {agreement.clientName}
                                </span>
                                <span>
                                  <span className="font-medium">Исполнитель:</span> {agreement.freelancerName}
                                </span>
                                {agreement.paymentMethod && (
                                  <span>
                                    <span className="font-medium">Способ оплаты:</span> {agreement.paymentMethod}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="lg:text-right">
                          <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(agreement.agreedAmount)}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">Договоренная сумма</div>
                          
                          <div className="flex gap-2 mt-3">
                            <Button size="sm" variant="outline" asChild>
                              <Link href={`/dashboard/orders/${agreement.projectId}`}>
                                <ExternalLink className="h-3 w-3 mr-1" />
                                К проекту
                              </Link>
                            </Button>
                            <Button size="sm" asChild>
                              <Link href={`/dashboard/messages?project=${agreement.projectId}`}>
                                <MessageSquare className="h-3 w-3 mr-1" />
                                В чат
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Tabs>
        </CardContent>
      </Card>

      {/* Советы по безопасным сделкам */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Советы по безопасным сделкам
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm">Всегда фиксируйте договоренности письменно в чате проекта</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm">Используйте поэтапную оплату для крупных проектов</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm">Проверяйте портфолио и отзывы исполнителя/заказчика</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm">Сохраняйте все переписки и файлы по проекту</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm">При возникновении споров обращайтесь в поддержку платформы</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
