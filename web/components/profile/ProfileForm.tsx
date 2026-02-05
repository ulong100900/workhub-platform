'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Plus, X, Upload, Save, User, Briefcase, Mail, Phone, MapPin, Globe, Sparkles } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

const profileFormSchema = z.object({
  full_name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  email: z.string().email('Некорректный email адрес'),
  phone: z.string().regex(/^(\+7|8)?[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}$/, 'Введите корректный номер телефона').optional().or(z.literal('')),
  bio: z.string().max(500, 'Описание не должно превышать 500 символов').optional(),
  location: z.string().optional(),
  portfolio_url: z.string().url('Некорректный URL').optional().or(z.literal('')),
  experience: z.coerce.number().min(0).max(50).optional(),
  skills: z.array(z.string()).optional(),
})

type ProfileFormData = z.infer<typeof profileFormSchema>

interface ProfileFormProps {
  initialData?: any
  onSave?: (data: ProfileFormData) => Promise<boolean>
  onAvatarUpload?: (file: File) => Promise<string | null>
  readOnly?: boolean
}

export function ProfileForm({ initialData, onSave, onAvatarUpload, readOnly = false }: ProfileFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialData?.avatar_url || null)
  const [newSkill, setNewSkill] = useState('')
  const [avatarUploading, setAvatarUploading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    setValue,
    watch,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      bio: '',
      location: '',
      portfolio_url: '',
      experience: 0,
      skills: [],
      ...initialData,
    },
  })

  const skills = watch('skills') || []
  const bio = watch('bio') || ''

  const onSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      if (onSave) {
        const result = await onSave(data)
        if (result) {
          setSuccess('Профиль успешно обновлен')
          toast({
            title: 'Готово!',
            description: 'Изменения сохранены',
          })
          setTimeout(() => setSuccess(''), 3000)
        }
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000))
        setSuccess('Профиль успешно обновлен')
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка при сохранении')
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: err.message || 'Не удалось сохранить изменения',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'Файл слишком большой',
          description: 'Максимальный размер аватара — 5MB',
        })
        return
      }

      setAvatarUploading(true)
      
      // Локальный превью
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      if (onAvatarUpload) {
        try {
          const url = await onAvatarUpload(file)
          if (url) {
            setAvatarPreview(url)
          }
        } catch (error) {
          console.error('Ошибка загрузки аватара:', error)
        }
      }
      
      setAvatarUploading(false)
    }
  }

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      const updatedSkills = [...skills, newSkill.trim()]
      setValue('skills', updatedSkills, { shouldDirty: true })
      setNewSkill('')
    }
  }

  const removeSkill = (skillToRemove: string) => {
    const updatedSkills = skills.filter(skill => skill !== skillToRemove)
    setValue('skills', updatedSkills, { shouldDirty: true })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addSkill()
    }
  }

  const formValues = watch()

  return (
    <div className="space-y-6">
      {/* Аватар и основная информация */}
      <Card className="border shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="relative group">
              <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                <AvatarImage src={avatarPreview || ''} />
                <AvatarFallback className="text-3xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                  {formValues.full_name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              {!readOnly && (
                <>
                  <label
                    htmlFor="avatar-upload"
                    className={`
                      absolute inset-0 flex items-center justify-center 
                      bg-black/50 rounded-full opacity-0 group-hover:opacity-100 
                      transition-opacity cursor-pointer backdrop-blur-sm
                      ${avatarUploading ? 'opacity-100' : ''}
                    `}
                  >
                    {avatarUploading ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                    ) : (
                      <Upload className="h-8 w-8 text-white" />
                    )}
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                    disabled={isSubmitting || avatarUploading}
                  />
                </>
              )}
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <div className="mb-4">
                <h3 className="text-2xl font-bold text-gray-900">
                  {formValues.full_name || 'Не указано'}
                </h3>
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mt-2 text-gray-600">
                  <p className="flex items-center justify-center md:justify-start">
                    <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{formValues.email || 'Email не указан'}</span>
                  </p>
                  {formValues.phone && (
                    <p className="flex items-center justify-center md:justify-start">
                      <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                      {formValues.phone}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {skills.slice(0, 5).map((skill, index) => (
                  <Badge key={index} variant="secondary" className="px-3 py-1">
                    {skill}
                  </Badge>
                ))}
                {skills.length > 5 && (
                  <Badge variant="outline" className="px-3 py-1">
                    +{skills.length - 5} ещё
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Основная информация */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <User className="mr-2 h-5 w-5" />
              Основная информация
            </CardTitle>
            <CardDescription>
              Ваши персональные данные
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="flex items-center gap-1">
                  Полное имя
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="full_name"
                  placeholder="Иван Иванов"
                  disabled={readOnly || isSubmitting}
                  className={errors.full_name ? 'border-destructive' : ''}
                  {...register('full_name')}
                />
                {errors.full_name && (
                  <p className="text-sm text-destructive mt-1">{errors.full_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  disabled
                  className="bg-gray-50"
                  {...register('email')}
                />
                <p className="text-xs text-gray-500">Email нельзя изменить</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Телефон</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+7 (999) 123-45-67"
                  disabled={readOnly || isSubmitting}
                  {...register('phone')}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Местоположение</Label>
                <Input
                  id="location"
                  placeholder="Москва, Россия"
                  disabled={readOnly || isSubmitting}
                  {...register('location')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">О себе</Label>
              <Textarea
                id="bio"
                placeholder="Расскажите о своем опыте, специализации и профессиональных интересах..."
                rows={4}
                disabled={readOnly || isSubmitting}
                {...register('bio')}
              />
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Максимум 500 символов</span>
                <span className={bio.length > 450 ? 'text-amber-600' : 'text-gray-500'}>
                  {bio.length}/500
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Профессиональная информация */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Briefcase className="mr-2 h-5 w-5" />
              Профессиональная информация
            </CardTitle>
            <CardDescription>
              Данные о вашей профессиональной деятельности
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="experience">Опыт работы (лет)</Label>
                <div className="relative">
                  <Input
                    id="experience"
                    type="number"
                    min="0"
                    max="50"
                    placeholder="0"
                    disabled={readOnly || isSubmitting}
                    className="pr-10"
                    {...register('experience')}
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    лет
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="portfolio_url" className="flex items-center gap-1">
                  <Globe className="h-4 w-4" />
                  Ссылка на портфолио
                </Label>
                <Input
                  id="portfolio_url"
                  type="url"
                  placeholder="https://portfolio.example.com"
                  disabled={readOnly || isSubmitting}
                  {...register('portfolio_url')}
                />
                {errors.portfolio_url && (
                  <p className="text-sm text-destructive mt-1">{errors.portfolio_url.message}</p>
                )}
              </div>
            </div>

            {/* Навыки */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="skills">Навыки</Label>
                <span className="text-sm text-gray-500">{skills.length} навыков</span>
              </div>
              
              {!readOnly && (
                <div className="flex gap-2">
                  <Input
                    id="newSkill"
                    placeholder="Например: React, Figma, SEO..."
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={readOnly || isSubmitting}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={addSkill}
                    variant="outline"
                    disabled={readOnly || isSubmitting || !newSkill.trim()}
                    className="px-4"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              <div className="flex flex-wrap gap-2 min-h-[42px]">
                {skills.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="pl-3 pr-2 py-1.5 text-sm">
                    {skill}
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="ml-2 hover:text-destructive transition-colors"
                        disabled={isSubmitting}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </Badge>
                ))}
                {skills.length === 0 && (
                  <div className="text-center w-full py-4 text-gray-500">
                    <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Добавьте ваши ключевые навыки</p>
                  </div>
                )}
              </div>
              
              <p className="text-xs text-gray-500">
                Добавляйте навыки, которые описывают вашу экспертизу. Это поможет находить релевантные проекты.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Кнопки действий */}
        {!readOnly && (
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => reset()}
              disabled={isSubmitting || !isDirty}
              className="order-2 sm:order-1"
            >
              Отменить изменения
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !isDirty}
              className="order-1 sm:order-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Сохранение...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Сохранить изменения
                </>
              )}
            </Button>
          </div>
        )}
      </form>
    </div>
  )
}