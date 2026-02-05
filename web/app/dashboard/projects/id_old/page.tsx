
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { 
  ArrowLeft,
  Calendar,
  DollarSign,
  User,
  Clock,
  CheckCircle,
  MessageSquare,
  Award,
  Briefcase,
  MapPin,
  Send
} from 'lucide-react'

interface Project {
  id: string
  title: string
  description: string
  budget: number | null
  currency: string
  category: string
  skills_required: string[]
  status: string
  created_at: string
  deadline: string | null
  client_id: string
  client_profile?: {
    name: string
    avatar_url: string | null
    rating: number | null
    completed_projects: number | null
  }
  bids?: Bid[]
}

interface Bid {
  id: string
  amount: number
  proposal: string
  delivery_days: number
  status: string
  created_at: string
  freelancer_id: string
  freelancer_profile?: {
    name: string
    avatar_url: string | null
    rating: number | null
    completed_projects: number | null
  }
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [bidAmount, setBidAmount] = useState('')
  const [bidProposal, setBidProposal] = useState('')
  const [bidDays, setBidDays] = useState('')
  const [submittingBid, setSubmittingBid] = useState(false)

  useEffect(() => {
    loadProject()
  }, [projectId])

  const loadProject = async () => {
    try {
      const supabase = createClient()
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      
      setUser(session.user)

      // Загружаем проект с информацией о клиенте
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select(`
          *,
          client_profile:profiles!client_id(name, avatar_url, rating, completed_projects)
        `)
        .eq('id', projectId)
        .single()

      if (projectError) throw projectError

      // Загружаем заявки с информацией о фрилансерах
      const { data: bidsData, error: bidsError } = await supabase
        .from('bids')
        .select(`
          *,
          freelancer_profile:profiles!freelancer_id(name, avatar_url, rating, completed_projects)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (bidsError) throw bidsError

      setProject({
        ...projectData,
        bids: bidsData || []
      })

    } catch (error) {
      console.error('Error loading project:', error)
      router.push('/projects')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !project) return
    
    setSubmittingBid(true)
    try {
      const supabase = createClient()

      const bidData = {
        project_id: project.id,
        freelancer_id: user.id,
        amount: parseFloat(bidAmount),
        proposal: bidProposal,
        delivery_days: parseInt(bidDays),
        status: 'pending'
      }

      const { error } = await supabase
        .from('bids')
        .insert(bidData)

      if (error) throw error

      // Обновляем проект
      await loadProject()
      
      // Очищаем форму
      setBidAmount('')
      setBidProposal('')
      setBidDays('')

      alert('Заявка успешно отправлена!')

    } catch (error) {
      console.error('Error submitting bid:', error)
      alert('Ошибка при отправке заявки')
    } finally {
      setSubmittingBid(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    
    const labels = {
      active: 'Активный',
      in_progress: 'В работе',
      completed: 'Завершен',
      cancelled: 'Отменен'
    }

    return (
      <Badge className={colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Загрузка проекта...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return null
  }

  const isClient = user.id === project.client_id
  const hasBid = project.bids?.some(bid => bid.freelancer_id === user.id)
  const canBid = !isClient && project.status === 'active' && !hasBid

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Хедер */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/projects')}
                className="mr-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Назад
              </Button>
              <h1 className="text-xl font-bold text-gray-900">WorkFinder</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/dashboard')}
              >
                Дашборд
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Основная информация */}
          <div className="lg:col-span-2 space-y-6">
            {/* Заголовок и статус */}
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.title}</h1>
                <div className="flex items-center space-x-3">
                  {getStatusBadge(project.status)}
                  <span className="text-gray-600">•</span>
                  <span className="text-gray-600">
                    Опубликован {new Date(project.created_at).toLocaleDateString('ru-RU')}
                  </span>
                </div>
              </div>
              
              {project.budget && (
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">
                    {project.budget.toLocaleString('ru-RU')} {project.currency}
                  </p>
                  {project.deadline && (
                    <p className="text-sm text-gray-500">
                      До {new Date(project.deadline).toLocaleDateString('ru-RU')}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Описание */}
            <Card>
              <CardHeader>
                <CardTitle>Описание проекта</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="whitespace-pre-line text-gray-700">{project.description}</p>
                </div>
              </CardContent>
            </Card>

            {/* Требуемые навыки */}
            {project.skills_required && project.skills_required.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Требуемые навыки</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {project.skills_required.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-sm py-1.5 px-3">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Заказчик */}
            <Card>
              <CardHeader>
                <CardTitle>Заказчик</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={project.client_profile?.avatar_url || ''} />
                    <AvatarFallback>
                      <User className="w-6 h-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold">{project.client_profile?.name || 'Заказчик'}</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                      {project.client_profile?.rating && (
                        <span className="flex items-center">
                          <Award className="w-4 h-4 mr-1 text-yellow-500" />
                          {project.client_profile.rating.toFixed(1)}/5.0
                        </span>
                      )}
                      {project.client_profile?.completed_projects !== undefined && (
                        <span className="flex items-center">
                          <Briefcase className="w-4 h-4 mr-1 text-blue-500" />
                          {project.client_profile.completed_projects} проектов
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Заявки (только для заказчика) */}
            {isClient && project.bids && project.bids.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Заявки ({project.bids.length})</CardTitle>
                  <CardDescription>
                    Предложения от исполнителей
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {project.bids.map((bid) => (
                      <div key={bid.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div className="flex items-start space-x-4">
                            <Avatar>
                              <AvatarImage src={bid.freelancer_profile?.avatar_url || ''} />
                              <AvatarFallback>
                                <User className="w-6 h-6" />
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-semibold">
                                {bid.freelancer_profile?.name || 'Исполнитель'}
                              </h4>
                              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                                {bid.freelancer_profile?.rating && (
                                  <span className="flex items-center">
                                    <Award className="w-3 h-3 mr-1 text-yellow-500" />
                                    {bid.freelancer_profile.rating.toFixed(1)}
                                  </span>
                                )}
                                {bid.freelancer_profile?.completed_projects && (
                                  <span>
                                    {bid.freelancer_profile.completed_projects} работ
                                  </span>
                                )}
                              </div>
                              <p className="mt-3 text-gray-700">{bid.proposal}</p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-xl font-bold">{bid.amount.toLocaleString('ru-RU')} ₽</p>
                            <p className="text-sm text-gray-500">
                              <Clock className="inline w-3 h-3 mr-1" />
                              {bid.delivery_days} дней
                            </p>
                            <div className="mt-3 space-x-2">
                              <Button size="sm">Принять</Button>
                              <Button size="sm" variant="outline">Отклонить</Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Боковая панель */}
          <div className="space-y-6">
            {/* Действия */}
            <Card>
              <CardHeader>
                <CardTitle>Действия</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isClient ? (
                  <>
                    {project.status === 'active' && (
                      <Button className="w-full">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Написать исполнителю
                      </Button>
                    )}
                    <Button variant="outline" className="w-full">
                      Редактировать проект
                    </Button>
                    {project.status === 'active' && (
                      <Button variant="outline" className="w-full text-red-600 hover:text-red-700">
                        Отменить проект
                      </Button>
                    )}
                  </>
                ) : canBid ? (
                  <Card className="border-blue-200">
                    <CardContent className="pt-6">
                      <h4 className="font-medium mb-4">Отправить заявку</h4>
                      <form onSubmit={handleSubmitBid} className="space-y-4">
                        <div>
                          <Label htmlFor="bidAmount">Ваше предложение (₽)</Label>
                          <Input
                            id="bidAmount"
                            type="number"
                            min="0"
                            step="0.01"
                            value={bidAmount}
                            onChange={(e) => setBidAmount(e.target.value)}
                            placeholder="Например: 15000"
                            required
                            disabled={submittingBid}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="bidDays">Срок выполнения (дней)</Label>
                          <Input
                            id="bidDays"
                            type="number"
                            min="1"
                            value={bidDays}
                            onChange={(e) => setBidDays(e.target.value)}
                            placeholder="Например: 14"
                            required
                            disabled={submittingBid}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="bidProposal">Ваше предложение</Label>
                          <Textarea
                            id="bidProposal"
                            value={bidProposal}
                            onChange={(e) => setBidProposal(e.target.value)}
                            placeholder="Расскажите, почему вы подходите для этого проекта..."
                            rows={4}
                            required
                            disabled={submittingBid}
                          />
                        </div>
                        
                        <Button 
                          type="submit" 
                          className="w-full"
                          disabled={submittingBid}
                        >
                          {submittingBid ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                              Отправка...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Отправить заявку
                            </>
                          )}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                ) : hasBid ? (
                  <div className="text-center p-6 border rounded-lg bg-green-50 border-green-200">
                    <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                    <h4 className="font-medium text-green-800">Заявка отправлена</h4>
                    <p className="text-sm text-green-700 mt-1">
                      Ваша заявка находится на рассмотрении
                    </p>
                  </div>
                ) : project.status !== 'active' ? (
                  <div className="text-center p-6 border rounded-lg bg-gray-100">
                    <p className="text-gray-700">Проект завершен или отменен</p>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {/* Детали проекта */}
            <Card>
              <CardHeader>
                <CardTitle>Детали проекта</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Категория</span>
                  <span className="font-medium">{project.category}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Статус</span>
                  {getStatusBadge(project.status)}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Опубликован</span>
                  <span className="font-medium">
                    {new Date(project.created_at).toLocaleDateString('ru-RU')}
                  </span>
                </div>
                
                {project.deadline && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Дедлайн</span>
                    <span className="font-medium">
                      {new Date(project.deadline).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                )}
                
                {project.bids && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Заявок</span>
                    <span className="font-medium">{project.bids.length}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Статистика */}
            {project.bids && project.bids.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Статистика заявок</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Среднее предложение</span>
                      <span className="font-medium">
                        {Math.round(
                          project.bids.reduce((sum, bid) => sum + bid.amount, 0) / project.bids.length
                        ).toLocaleString('ru-RU')} ₽
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Минимальное</span>
                      <span className="font-medium">
                        {Math.min(...project.bids.map(b => b.amount)).toLocaleString('ru-RU')} ₽
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Максимальное</span>
                      <span className="font-medium">
                        {Math.max(...project.bids.map(b => b.amount)).toLocaleString('ru-RU')} ₽
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Средний срок</span>
                      <span className="font-medium">
                        {Math.round(
                          project.bids.reduce((sum, bid) => sum + bid.delivery_days, 0) / project.bids.length
                        )} дней
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
