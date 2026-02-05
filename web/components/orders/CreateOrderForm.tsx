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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from '@/components/ui/card'
import {
  DollarSign,
  Calendar,
  MapPin,
  Tag,
  Clock,
  Shield,
  Upload,
  X,
  Plus
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { useAuth } from '@/hooks/useAuth'

const formSchema = z.object({
  title: z.string()
    .min(10, { message: 'Название должно содержать минимум 10 символов' })
    .max(200, { message: 'Название не должно превышать 200 символов' }),
  description: z.string()
    .min(50, { message: 'Описание должно содержать минимум 50 символов' })
    .max(5000, { message: 'Описание не должно превышать 5000 символов' }),
  category: z.string({
    required_error: 'Выберите категорию',
  }),
  budget: z.string()
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: 'Введите корректную сумму',
    }),
  deadline: z.string({
    required_error: 'Укажите срок выполнения',
  }),
  locationType: z.string().default('remote'),
  city: z.string().optional(),
  skills: z.array(z.string()).min(1, { message: 'Добавьте хотя бы один навык' }),
  isUrgent: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  attachments: z.array(z.string()).default([]),
})

type FormValues = z.infer<typeof formSchema>

const categories = [
  { value: 'web-development', label: 'Веб-разработка' },
  { value: 'design', label: 'Дизайн' },
  { value: 'marketing', label: 'Маркетинг' },
  { value: 'writing-translation', label: 'Тексты и переводы' },
  { value: 'video-animation', label: 'Видео и анимация' },
  { value: 'business-consulting', label: 'Бизнес и консалтинг' },
  { value: 'it-programming', label: 'IT и программирование' },
  { value: 'mobile-apps', label: 'Мобильные приложения' },
  { value: 'administration', label: 'Администрирование' },
  { value: 'music-audio', label: 'Музыка и аудио' },
]

const locationTypes = [
  { value: 'remote', label: 'Удаленная работа' },
  { value: 'onsite', label: 'В офисе' },
  { value: 'hybrid', label: 'Гибридный формат' },
]

const popularSkills = [
  'HTML/CSS',
  'JavaScript',
  'React',
  'TypeScript',
  'Node.js',
  'Python',
  'UI/UX Design',
  'Figma',
  'Adobe Photoshop',
  'SEO',
  'Контент-маркетинг',
  'Копирайтинг',
  'Мобильная разработка',
  'DevOps',
  'Базы данных',
  'Машинное обучение',
  'Аналитика данных',
  'Проектный менеджмент',
]

export default function CreateOrderForm() {
  const router = useRouter()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [skillInput, setSkillInput] = useState('')

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      budget: '10000',
      deadline: '',
      locationType: 'remote',
      city: '',
      skills: [],
      isUrgent: false,
      isFeatured: false,
      attachments: [],
    },
  })

  const skills = form.watch('skills')

  const handleAddSkill = (skill: string) => {
    if (skill && !skills.includes(skill)) {
      form.setValue('skills', [...skills, skill])
      setSkillInput('')
    }
  }

  const handleRemoveSkill = (skillToRemove: string) => {
    form.setValue(
      'skills',
      skills.filter((skill) => skill !== skillToRemove)
    )
  }

  const handleAddPopularSkill = (skill: string) => {
    if (!skills.includes(skill)) {
      form.setValue('skills', [...skills, skill])
    }
  }

  const onSubmit = async (data: FormValues) => {
    if (!user) {
      toast({
        title: 'Требуется авторизация',
        description: 'Войдите в систему для размещения заказа',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          budget: Number(data.budget),
          clientId: user.id,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        
        toast({
          title: 'Заказ успешно создан!',
          description: 'Ваш заказ опубликован и теперь виден фрилансерам.',
          variant: 'success',
        })

        // Перенаправляем на страницу заказа
        router.push(`/dashboard/orders/${result.order.id}`)
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Не удалось создать заказ')
      }
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось создать заказ. Попробуйте снова.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const calculateDeadline = (days: number) => {
    const date = new Date()
    date.setDate(date.getDate() + days)
    return date.toISOString().split('T')[0]
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Plus className="h-6 w-6" />
            Разместить новый заказ
          </CardTitle>
          <CardDescription>
            Заполните форму ниже, чтобы найти подходящего исполнителя для вашего проекта
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Основная информация */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Основная информация
                </h3>

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Название проекта *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Например: Разработка интернет-магазина на React" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Будьте конкретны, чтобы привлечь нужных специалистов
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Подробное описание *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Опишите ваш проект максимально подробно. Что нужно сделать? Какие требования? Какие результаты ожидаете?"
                          className="min-h-[200px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Чем подробнее описание, тем качественнее отклики
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Категория *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите категорию" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.value} value={category.value}>
                                {category.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Бюджет (₽) *</FormLabel>
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
                          Укажите реальный бюджет для привлечения профессиональных исполнителей
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Сроки и местоположение */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Сроки и местоположение
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="deadline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Срок выполнения *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                              type="date"
                              className="pl-10"
                              min={new Date().toISOString().split('T')[0]}
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <div className="flex gap-2 mt-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => field.onChange(calculateDeadline(7))}
                          >
                            1 неделя
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => field.onChange(calculateDeadline(14))}
                          >
                            2 недели
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => field.onChange(calculateDeadline(30))}
                          >
                            1 месяц
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="locationType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Формат работы *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Выберите формат" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {locationTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {form.watch('locationType') !== 'remote' && (
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Город</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                  placeholder="Например: Москва"
                                  className="pl-10"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Требуемые навыки */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Требуемые навыки *
                </h3>

                <FormField
                  control={form.control}
                  name="skills"
                  render={() => (
                    <FormItem>
                      <FormLabel>Добавьте навыки, необходимые для выполнения работы</FormLabel>
                      <FormControl>
                        <div className="space-y-4">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Введите навык и нажмите Enter"
                              value={skillInput}
                              onChange={(e) => setSkillInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && skillInput.trim()) {
                                  e.preventDefault()
                                  handleAddSkill(skillInput.trim())
                                }
                              }}
                            />
                            <Button
                              type="button"
                              onClick={() => handleAddSkill(skillInput.trim())}
                            >
                              Добавить
                            </Button>
                          </div>

                          {/* Популярные навыки */}
                          <div>
                            <p className="text-sm text-gray-600 mb-2">Популярные навыки:</p>
                            <div className="flex flex-wrap gap-2">
                              {popularSkills.map((skill) => (
                                <Badge
                                  key={skill}
                                  variant={skills.includes(skill) ? 'default' : 'outline'}
                                  className="cursor-pointer"
                                  onClick={() => handleAddPopularSkill(skill)}
                                >
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* Выбранные навыки */}
                          {skills.length > 0 && (
                            <div>
                              <p className="text-sm text-gray-600 mb-2">Выбранные навыки:</p>
                              <div className="flex flex-wrap gap-2">
                                {skills.map((skill) => (
                                  <Badge
                                    key={skill}
                                    variant="secondary"
                                    className="flex items-center gap-1"
                                  >
                                    {skill}
                                    <X
                                      className="h-3 w-3 cursor-pointer"
                                      onClick={() => handleRemoveSkill(skill)}
                                    />
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormDescription>
                        Укажите конкретные технологии и инструменты
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Дополнительные опции */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Дополнительные опции
                </h3>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="isUrgent"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Срочный заказ</FormLabel>
                          <FormDescription>
                            Заказ будет выделен в списке и привлечет больше внимания
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isFeatured"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Продвижение заказа</FormLabel>
                          <FormDescription>
                            Заказ будет отображаться в топе на главной странице
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Прикрепленные файлы */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Прикрепленные файлы
                </h3>

                <FormField
                  control={form.control}
                  name="attachments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Дополнительные материалы</FormLabel>
                      <FormControl>
                        <div className="space-y-4">
                          <div className="flex items-center justify-center w-full">
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-8 h-8 mb-2 text-gray-500" />
                                <p className="mb-2 text-sm text-gray-500">
                                  <span className="font-semibold">Нажмите для загрузки</span> или перетащите файлы
                                </p>
                                <p className="text-xs text-gray-500">PDF, DOC, JPG, PNG до 10MB</p>
                              </div>
                              <input
                                type="file"
                                className="hidden"
                                multiple
                                onChange={(e) => {
                                  // Здесь будет логика загрузки файлов
                                  // Пока просто добавим имена файлов
                                  if (e.target.files) {
                                    const fileNames = Array.from(e.target.files).map(file => file.name)
                                    field.onChange([...field.value, ...fileNames])
                                  }
                                }}
                              />
                            </label>
                          </div>

                          {field.value.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-sm font-medium">Загруженные файлы:</p>
                              <div className="space-y-1">
                                {field.value.map((file, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                                  >
                                    <span className="text-sm">{file}</span>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const newFiles = [...field.value]
                                        newFiles.splice(index, 1)
                                        field.onChange(newFiles)
                                      }}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormDescription>
                        Добавьте ТЗ, макеты, примеры или другие материалы
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </div>

              {/* Кнопки действий */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
                <Button
                  type="submit"
                  className="flex-1"
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Создание...' : 'Опубликовать заказ'}
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

              {/* Подсказка */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-blue-800">Советы по размещению заказа</h4>
                    <ul className="text-sm text-blue-700 space-y-1 mt-2">
                      <li>• Укажите реальный бюджет - это привлечет профессиональных исполнителей</li>
                      <li>• Детально опишите задачу - чем подробнее, тем точнее будут отклики</li>
                      <li>• Добавьте примеры и референсы - это поможет понять ваши ожидания</li>
                      <li>• Укажите реальные сроки - это поможет выбрать исполнителя с подходящей загрузкой</li>
                    </ul>
                  </div>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}