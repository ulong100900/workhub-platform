'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  DollarSign,
  Clock,
  FileText,
  CheckCircle,
  Star,
  Calendar,
  User,
  Briefcase,
  MessageSquare,
  Award,
  Shield
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { useAuth } from '@/hooks/useAuth'

const formSchema = z.object({
  proposal: z.string()
    .min(100, { message: 'Предложение должно содержать минимум 100 символов' })
    .max(2000, { message: 'Предложение не должно превышать 2000 символов' }),
  price: z.string()
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: 'Введите корректную сумму',
    }),
  deliveryDays: z.string()
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: 'Введите корректное количество дней',
    }),
  milestones: z.array(z.object({
    title: z.string().min(5, { message: 'Название этапа должно содержать минимум 5 символов' }),
    description: z.string().min(10, { message: 'Описание этапа должно содержать минимум 10 символов' }),
    days: z.number().min(1, { message: 'Минимум 1 день' }),
    price: z.number().min(0, { message: 'Цена не может быть отрицательной' }),
  })).optional(),
})

type FormValues = z.infer<typeof formSchema>

interface BidFormProps {
  order: {
    id: string
    title: string
    budget: number
    deadline: string
    description: string
    skills: string[]
    client: {
      user_metadata: {
        name: string
      }
    }
  }
  onSuccess?: () => void
}

export default function BidForm({ order, onSuccess }: BidFormProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showMilestones, setShowMilestones] = useState(false)
  const [milestones, setMilestones] = useState<Array<{
    title: string
    description: string
    days: number
    price: number
  }>>([])

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      proposal: '',
      price: order.budget.toString(),
      deliveryDays: '7',
      milestones: [],
    },
  })

  const addMilestone = () => {
    setMilestones([
      ...milestones,
      { title: '', description: '', days: 7, price: 0 }
    ])
  }

  const removeMilestone = (index: number) => {
    const newMilestones = [...milestones]
    newMilestones.splice(index, 1)
    setMilestones(newMilestones)
  }

  const updateMilestone = (index: number, field: string, value: any) => {
    const newMilestones = [...milestones]
    newMilestones[index] = { ...newMilestones[index], [field]: value }
    setMilestones(newMilestones)
  }

  const calculateTotalPrice = () => {
    const basePrice = parseFloat(form.watch('price')) || 0
    const milestonesPrice = milestones.reduce((sum, milestone) => sum + milestone.price, 0)
    return basePrice + milestonesPrice
  }

  const calculateTotalDays = () => {
    const baseDays = parseInt(form.watch('deliveryDays')) || 0
    const milestonesDays = milestones.reduce((sum, milestone) => sum + milestone.days, 0)
    return baseDays + milestonesDays
  }

  const onSubmit = async (data: FormValues) => {
    if (!user) {
      toast({
        title: 'Требуется авторизация',
        description: 'Войдите в систему для подачи заявки',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/bids', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          freelancerId: user.id,
          proposal: data.proposal,
          price: parseFloat(data.price),
          deliveryDays: parseInt(data.deliveryDays),
          milestones: showMilestones && milestones.length > 0 ? milestones : null,
        }),
      })

      if (response.ok) {
        toast({
          title: 'Заявка успешно отправлена!',
          description: 'Ваше предложение отправлено клиенту на рассмотрение.',
          variant: 'success',
        })

        if (onSuccess) {
          onSuccess()
        } else {
          router.push(`/dashboard/orders/${order.id}`)
        }
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Не удалось отправить заявку')
      }
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось отправить заявку. Попробуйте снова.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
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

  return (
    <div className="max-w-4xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Информация о заказе */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Заказ: {order.title}
              </CardTitle>
              <CardDescription>
                Вы подаете заявку на этот проект
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-sm text-gray-600">Клиент</div>
                    <div className="font-medium">{order.client.user_metadata.name}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-sm text-gray-600">Бюджет заказа</div>
                    <div className="font-medium">{formatCurrency(order.budget)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="text-sm text-gray-600">Срок сдачи</div>
                    <div className="font-medium">{formatDate(order.deadline)}</div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <div className="text-sm font-medium mb-2">Требуемые навыки:</div>
                <div className="flex flex-wrap gap-2">
                  {order.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Основные поля заявки */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Ваше предложение
                </CardTitle>
                <CardDescription>
                  Расскажите, почему вы лучший кандидат для этого проекта
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="proposal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Предложение *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Опишите ваш подход к проекту, опыт работы с похожими задачами, почему вы подходите для этой работы..."
                          className="min-h-[200px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Клиент прочитает это первым. Будьте конкретны и убедительны.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Ваша цена
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Стоимость работы (₽) *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                              type="number"
                              placeholder="10000"
                              className="pl-10"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Бюджет заказчика: {formatCurrency(order.budget)}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Сроки
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="deliveryDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Срок выполнения (дней) *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                              type="number"
                              placeholder="7"
                              className="pl-10"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Дедлайн заказчика: {formatDate(order.deadline)}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* План по этапам */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    План по этапам
                  </CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMilestones(!showMilestones)}
                  >
                    {showMilestones ? 'Скрыть этапы' : 'Добавить этапы'}
                  </Button>
                </div>
                <CardDescription>
                  Разбейте проект на этапы для большей прозрачности
                </CardDescription>
              </CardHeader>
              {showMilestones && (
                <CardContent>
                  <div className="space-y-4">
                    {milestones.map((milestone, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="font-medium">Этап {index + 1}</div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMilestone(index)}
                          >
                            Удалить
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-sm font-medium mb-1 block">
                              Название этапа
                            </label>
                            <Input
                              value={milestone.title}
                              onChange={(e) => updateMilestone(index, 'title', e.target.value)}
                              placeholder="Например: Дизайн макета"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-1 block">
                              Дней на выполнение
                            </label>
                            <Input
                              type="number"
                              value={milestone.days}
                              onChange={(e) => updateMilestone(index, 'days', parseInt(e.target.value) || 0)}
                              placeholder="7"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">
                            Описание работ
                          </label>
                          <Textarea
                            value={milestone.description}
                            onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                            placeholder="Подробное описание работ на этом этапе..."
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">
                            Стоимость этапа (₽)
                          </label>
                          <Input
                            type="number"
                            value={milestone.price}
                            onChange={(e) => updateMilestone(index, 'price', parseFloat(e.target.value) || 0)}
                            placeholder="10000"
                          />
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={addMilestone}
                    >
                      + Добавить этап
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Итоговая информация */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Итоговая информация
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Общая стоимость</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(calculateTotalPrice())}
                      </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Общий срок</div>
                      <div className="text-2xl font-bold text-green-600">
                        {calculateTotalDays()} дней
                      </div>
                    </div>
                  </div>

                  {milestones.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Распределение по этапам:</div>
                      <div className="space-y-1">
                        {milestones.map((milestone, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>Этап {index + 1}: {milestone.title}</span>
                            <span className="font-medium">
                              {formatCurrency(milestone.price)} / {milestone.days} дн.
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3 bg-yellow-50 p-4 rounded-lg">
                    <Shield className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-yellow-800">Гарантия безопасности</div>
                      <p className="text-sm text-yellow-700 mt-1">
                        Оплата происходит только после принятия работы. Деньги хранятся на платформе до успешного завершения проекта.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Кнопки действий */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <Button
              type="submit"
              className="flex-1"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Отправка...' : 'Отправить заявку'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => router.back()}
            >
              Отмена
            </Button>
          </div>

          {/* Советы */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Award className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-blue-800">Как повысить шансы на успех?</h4>
                <ul className="text-sm text-blue-700 space-y-1 mt-2">
                  <li>• Будьте конкретны в описании своего подхода</li>
                  <li>• Укажите релевантный опыт и примеры работ</li>
                  <li>• Предложите разумную цену и сроки</li>
                  <li>• Разбейте проект на этапы для большей прозрачности</li>
                  <li>• Отвечайте на вопросы быстро и профессионально</li>
                </ul>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}