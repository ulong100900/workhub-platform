// /web/components/projects/CreateProjectForm.tsx - С МОДЕРАЦИЕЙ ТЕКСТА
'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import { 
  AlertCircle, 
  ArrowLeft, 
  Briefcase, 
  CalendarIcon, 
  Camera, 
  CheckCircle, 
  ChevronDown, 
  ChevronRight, 
  DollarSign, 
  Loader2, 
  MapPin, 
  Save, 
  Search, 
  Upload, 
  X,
  AlertTriangle,
  Shield,
  Eye,
  EyeOff,
  Sparkles
} from 'lucide-react'
import { format, isAfter } from 'date-fns'
import { ru } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { moderateTextAPI, highlightSwearWords } from '@/lib/moderation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'

import { mainCategories } from '@/data/categories'
import { cities, regions, getRegionById } from '@/data/russianCities'

interface CreateProjectFormProps {
  onSuccess?: () => void
  onCancel?: () => void
  projectId?: string
}

interface Subcategory {
  id: string
  name: string
}

interface ProjectFormData {
  title: string
  description: string
  category: string
  subcategory: string
  budgetType: 'fixed' | 'hourly' | 'price_request'
  budgetAmount: string
  location: {
    city: string
    cityName: string
    region: string
    address: string
    country: string
    isRemote: boolean
  }
  deadline: Date | undefined
  files: File[]
  existingImages: string[]
  skills: string[]
}

export default function CreateProjectForm({ onSuccess, onCancel, projectId }: CreateProjectFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cityRef = useRef<HTMLDivElement>(null)
  
  const [loading, setLoading] = useState(false)
  const [loadingProject, setLoadingProject] = useState(!!projectId)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isEditing, setIsEditing] = useState(!!projectId)
  
  // Состояния для модерации
  const [isTextChecked, setIsTextChecked] = useState(false)
  const [isModerating, setIsModerating] = useState(false)
  const [moderationResult, setModerationResult] = useState<{
    isClean: boolean;
    errors?: string[];
    positions?: Array<{word: string, start: number, end: number}>;
  } | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  
  const [showCityDropdown, setShowCityDropdown] = useState(false)
  const [citySearch, setCitySearch] = useState('')
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<ProjectFormData>({
    title: '',
    description: '',
    category: '',
    subcategory: '',
    budgetType: 'fixed',
    budgetAmount: '',
    location: {
      city: '',
      cityName: '',
      region: '',
      address: '',
      country: 'Россия',
      isRemote: false
    },
    deadline: undefined,
    files: [],
    existingImages: [],
    skills: []
  })

  const [previews, setPreviews] = useState<string[]>([])
  const [existingPreviews, setExistingPreviews] = useState<string[]>([])

  // Функция проверки текста
  const checkDescription = async () => {
    if (!formData.description.trim()) {
      setModerationResult({ 
        isClean: false, 
        errors: ['Описание не может быть пустым'] 
      });
      setIsTextChecked(false);
      return;
    }

    if (formData.description.length < 50) {
      setModerationResult({ 
        isClean: false, 
        errors: ['Описание должно быть не менее 50 символов'] 
      });
      setIsTextChecked(false);
      return;
    }

    setIsModerating(true);
    try {
      const result = await moderateTextAPI(formData.description);
setModerationResult(result);
setIsTextChecked(result.isClean);
      
      if (!result.isClean) {
        toast({
          title: 'Обнаружены недопустимые слова',
          description: 'Пожалуйста, исправьте выделенные слова перед публикацией',
          variant: 'destructive',
          duration: 5000
        });
      } else {
        toast({
          title: 'Текст прошел проверку',
          description: 'Можете смело публиковать проект',
          variant: 'default',
          className: 'bg-green-50 border-green-200 text-green-800'
        });
      }
    } catch (error) {
      console.error('Moderation error:', error);
      setModerationResult({ isClean: true });
      setIsTextChecked(true);
      toast({
        title: 'Ошибка проверки',
        description: 'Проверка текста не удалась. Проверьте текст вручную.',
        variant: 'destructive'
      });
    } finally {
      setIsModerating(false);
    }
  };

  // Автоматическое исправление слова
  const fixBadWord = (word: string, index: number) => {
    const fixedWord = '***';
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const newText = formData.description.replace(regex, fixedWord);
    
    setFormData(prev => ({...prev, description: newText}));
    
    toast({
      title: 'Слово исправлено',
      description: `Слово "${word}" было заменено`,
      duration: 3000
    });
    
    // Перепроверяем текст
    setTimeout(() => {
      checkDescription();
    }, 500);
  };

  // Загрузка проекта для редактирования
  useEffect(() => {
    if (!projectId) return
    
    const loadProjectForEditing = async () => {
      try {
        setLoadingProject(true)
        console.log('🔄 Загрузка проекта:', projectId)
        
        const response = await fetch(`/api/projects/${projectId}`)
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        
        const result = await response.json()
        
        if (!result.success || !result.data) {
          throw new Error(result.message || 'Данные проекта не получены')
        }
        
        const project = result.data
        console.log('✅ Проект загружен:', { id: project.id, title: project.title })
        
        // Преобразование данных проекта
        const deadlineDate = project.deadline ? new Date(project.deadline) : undefined
        
        const updatedFormData: ProjectFormData = {
          title: project.title || '',
          description: project.description || '',
          category: project.category || '',
          subcategory: project.subcategory || '',
          budgetType: project.budget_type || 'fixed',
          budgetAmount: project.budget?.toString() || '',
          location: {
            city: project.city || '',
            cityName: project.cityName || project.city || '',
            region: project.region || '',
            address: project.address || '',
            country: project.country || 'Россия',
            isRemote: project.is_remote || false
          },
          deadline: deadlineDate,
          files: [],
          existingImages: project.images || [],
          skills: project.skills || []
        }
        
        setFormData(updatedFormData)
        
        if (project.images?.length) {
          setExistingPreviews(project.images)
        }
        
        setIsEditing(true)
        
      } catch (error: any) {
        console.error('❌ Ошибка загрузки:', error)
        toast({
          variant: 'destructive',
          title: 'Ошибка загрузки',
          description: 'Не удалось загрузить проект. Вы будете перенаправлены.',
          duration: 3000
        })
        
        setTimeout(() => {
          router.push('/dashboard/my-projects')
        }, 2000)
      } finally {
        setLoadingProject(false)
      }
    }
    
    loadProjectForEditing()
  }, [projectId, router, toast])

  // Получение подкатегорий
  const subcategories = useMemo(() => {
    if (!formData.category) return []
    const category = mainCategories.find(cat => cat.id === formData.category)
    if (!category?.subcategories || !Array.isArray(category.subcategories)) return []
    
    return category.subcategories.map((name, index) => ({
      id: `${formData.category}_${index}`,
      name
    }))
  }, [formData.category])

  const selectedCategory = useMemo(() => {
    return mainCategories.find(cat => cat.id === formData.category)
  }, [formData.category])

  // Выбор города
  const handleCitySelect = (cityName: string, regionName: string, cityId?: string) => {
    const cityIdToUse = cityId || cities.find(c => c.name === cityName)?.id || ''
    
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        city: cityIdToUse,
        cityName,
        region: regionName,
        country: 'Россия',
        isRemote: false
      }
    }))
    setShowCityDropdown(false)
    setCitySearch('')
    setHoveredRegion(null)
  }

  // Выбор региона
  const handleRegionSelect = (region: typeof regions[0]) => {
    if (!region.hasCities) {
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          city: region.id,
          cityName: region.name,
          region: region.name,
          country: 'Россия',
          isRemote: false
        }
      }))
      setShowCityDropdown(false)
      setCitySearch('')
      setHoveredRegion(null)
    }
  }

  // Смена категории
  const handleCategoryChange = (value: string) => {
    const newCategory = mainCategories.find(cat => cat.id === value)
    
    setFormData(prev => ({
      ...prev,
      category: value,
      subcategory: '',
      location: {
        ...prev.location,
        isRemote: newCategory?.allowRemote ? prev.location.isRemote : false
      }
    }))
  }

  // Очистка города
  const handleClearCity = () => {
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        city: '',
        cityName: '',
        region: '',
        address: ''
      }
    }))
  }

  // Фильтрация локаций
  const filteredLocations = useMemo(() => {
    if (!citySearch.trim()) return { regions, cities: [] }
    
    const query = citySearch.toLowerCase()
    
    const matchedCities = cities
      .filter(c => c.name.toLowerCase().includes(query))
      .slice(0, 50)
      .map(c => ({ 
        ...c, 
        regionName: getRegionById(c.regionId)?.name || '' 
      }))
    
    const matchedRegions = regions.filter(r => 
      r.name.toLowerCase().includes(query)
    )
    
    return { regions: matchedRegions, cities: matchedCities }
  }, [citySearch])

  // Города в регионе
  const citiesInRegion = useMemo(() => {
    if (!hoveredRegion) return []
    return cities
      .filter(c => c.regionId === hoveredRegion)
      .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
  }, [hoveredRegion])

  // Закрытие выпадающих меню
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cityRef.current && !cityRef.current.contains(event.target as Node)) {
        setShowCityDropdown(false)
        setHoveredRegion(null)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Обработка файлов
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/')
      const isValidSize = file.size <= 5 * 1024 * 1024
      return isValidType && isValidSize
    })

    const totalFiles = formData.files.length + validFiles.length
    const maxFiles = isEditing ? 10 : 5

    if (totalFiles > maxFiles) {
      toast({
        title: 'Лимит файлов',
        description: `Максимум ${maxFiles} изображений`,
        variant: 'destructive',
        duration: 3000
      })
      return
    }

    setFormData(prev => ({
      ...prev,
      files: [...prev.files, ...validFiles]
    }))

    // Создание превью
    validFiles.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        if (reader.result) {
          setPreviews(prev => [...prev, reader.result as string])
        }
      }
      reader.readAsDataURL(file)
    })

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }))
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const removeExistingImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      existingImages: prev.existingImages.filter((_, i) => i !== index)
    }))
    setExistingPreviews(prev => prev.filter((_, i) => i !== index))
  }

  // Валидация формы
  const validateForm = () => {
    const errors: string[] = []

    if (!formData.title.trim()) errors.push('Введите название проекта')
    if (!formData.description.trim()) errors.push('Введите описание проекта')
    if (formData.description.length < 50) errors.push('Описание должно быть не менее 50 символов')
    
    // Добавляем проверку модерации
    if (!isTextChecked && formData.description.length >= 50) {
      errors.push('Проверьте описание на наличие недопустимых слов')
    }
    if (moderationResult && !moderationResult.isClean) {
      errors.push('В описании обнаружены недопустимые слова')
    }
    
    if (!formData.category) errors.push('Выберите категорию')
    if (!formData.subcategory) errors.push('Выберите подкатегорию')
    if (!formData.deadline) errors.push('Укажите дату выполнения')
    if (formData.deadline && !isAfter(formData.deadline, new Date())) {
      errors.push('Дата должна быть в будущем')
    }
    
    const totalImages = formData.files.length + formData.existingImages.length
    if (totalImages === 0) errors.push('Загрузите хотя бы одну фотографию')
    
    if (formData.budgetType === 'fixed') {
      if (!formData.budgetAmount.trim()) errors.push('Укажите бюджет')
      if (parseFloat(formData.budgetAmount) <= 0) errors.push('Бюджет должен быть больше 0')
    }
    
    if (!formData.location.isRemote && !formData.location.city.trim()) {
      errors.push('Укажите город или выберите удаленную работу')
    }

    if (errors.length > 0) {
      setError(errors[0])
      return false
    }
    
    return true
  }

  // Отправка формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Проверяем текст перед отправкой
    if (formData.description.length >= 50 && !isTextChecked) {
      toast({
        title: 'Требуется проверка текста',
        description: 'Пожалуйста, проверьте описание на недопустимые слова',
        variant: 'destructive',
        duration: 5000
      })
      return
    }
    
    if (!validateForm()) return
    
    setLoading(true)
    setError(null)
    
    try {
      const formDataToSend = new FormData()
      
      // Текстовые поля
      formDataToSend.append('title', formData.title.trim())
      formDataToSend.append('description', formData.description.trim())
      formDataToSend.append('detailedDescription', formData.description.trim())
      formDataToSend.append('category', formData.category)
      formDataToSend.append('subcategory', formData.subcategory)
      formDataToSend.append('budgetType', formData.budgetType)
      
      if (formData.budgetType === 'fixed' && formData.budgetAmount) {
        formDataToSend.append('budgetAmount', formData.budgetAmount)
      }
      
      // Поля местоположения
      formDataToSend.append('isRemote', formData.location.isRemote.toString())
      formDataToSend.append('city', formData.location.city)
      formDataToSend.append('cityName', formData.location.cityName)
      
      if (formData.location.region) {
        formDataToSend.append('region', formData.location.region)
      }
      
      if (formData.location.address) {
        formDataToSend.append('address', formData.location.address)
      }
      
      if (formData.deadline) {
        formDataToSend.append('deadline', formData.deadline.toISOString())
      }
      
      if (formData.skills.length > 0) {
        formDataToSend.append('skills', JSON.stringify(formData.skills))
      }
      
      // Файлы
      formData.files.forEach((file, index) => {
        if (file && file.size > 0) {
          formDataToSend.append('files', file, `file-${index}-${file.name}`)
        }
      })
      
      // Существующие изображения
      if (isEditing) {
        formDataToSend.append('existingImages', JSON.stringify(formData.existingImages))
      }
      
      // Добавляем estimatedDuration если есть
      if (formData.deadline) {
        formDataToSend.append('estimatedDuration', '7 дней')
      }
      
      console.log('📊 Данные для отправки:', {
        title: formData.title,
        filesCount: formData.files.length,
        formDataKeys: Array.from(formDataToSend.keys())
      })
      
      // Проверяем, есть ли файлы в FormData
      const filesInFormData = Array.from(formDataToSend.entries())
        .filter(([key]) => key === 'files')
        .length
      
      console.log('📦 Файлов в FormData:', filesInFormData)
      
      if (filesInFormData === 0 && formData.files.length > 0) {
        console.error('❌ Файлы не добавлены в FormData!')
        toast({
          title: 'Ошибка загрузки',
          description: 'Не удалось подготовить файлы для отправки',
          variant: 'destructive',
          duration: 5000
        })
        throw new Error('Файлы не добавлены в FormData')
      }
      
      const url = isEditing && projectId 
        ? `/api/projects/${projectId}?id=${projectId}`
        : '/api/projects'
      
      const method = isEditing ? 'PUT' : 'POST'
      
      console.log(`📤 Отправка проекта (${method}):`, {
        url,
        title: formData.title,
        files: formData.files.length
      })
      
      const response = await fetch(url, {
        method,
        body: formDataToSend,
      })
      
      console.log('📨 Ответ сервера:', {
        status: response.status,
        statusText: response.statusText
      })
      
      const result = await response.json()
      console.log('📋 Результат сервера:', result)
      
      if (!response.ok || !result.success) {
        throw new Error(result.message || result.error || `Ошибка сервера ${response.status}`)
      }
      
      console.log('✅ Успешно:', result.message)
      
      setSuccess(true)
      
      toast({
        title: 'Успешно!',
        description: result.message || `Проект ${isEditing ? 'обновлен' : 'создан'}`,
        variant: 'default',
        className: 'bg-green-50 border-green-200 text-green-800'
      })
      
      setTimeout(() => {
        if (onSuccess) {
          onSuccess()
        } else {
          router.push('/dashboard/my-projects')
          router.refresh()
        }
      }, 1500)
      
    } catch (err: any) {
      console.error('❌ Ошибка:', err)
      
      let errorMessage = err.message || 'Неизвестная ошибка'
      
      if (errorMessage.includes('401')) errorMessage = 'Требуется авторизация'
      if (errorMessage.includes('403')) errorMessage = 'Нет прав доступа'
      if (errorMessage.includes('404')) errorMessage = 'Проект не найден'
      if (errorMessage.includes('Failed to fetch')) errorMessage = 'Нет связи с сервером'
      if (errorMessage.includes('Нет изображений')) errorMessage = 'Загрузите хотя бы одну фотографию'
      
      setError(errorMessage)
      
      toast({
        title: 'Ошибка',
        description: errorMessage,
        variant: 'destructive',
        duration: 5000
      })
    } finally {
      setLoading(false)
    }
  }

  // Состояния загрузки
  if (loadingProject) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="py-16 text-center">
          <div className="flex justify-center mb-6">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Загрузка проекта...
          </h2>
          <p className="text-gray-600">
            Подготовка данных для редактирования
          </p>
        </CardContent>
      </Card>
    )
  }

  if (success) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="py-16 text-center">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {isEditing ? 'Проект обновлен!' : 'Проект создан!'}
          </h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            {isEditing 
              ? 'Изменения сохранены успешно.' 
              : 'Ваш проект опубликован и доступен исполнителям.'
            }
          </p>
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalImages = formData.files.length + formData.existingImages.length
  const maxFiles = isEditing ? 10 : 5
  
  // Условия для кнопки отправки
  const isSubmitDisabled = loading || 
    totalImages === 0 || 
    !formData.subcategory || 
    !formData.deadline ||
    (formData.description.length >= 50 && !isTextChecked) ||
    (moderationResult && !moderationResult.isClean)

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Briefcase className="h-6 w-6" />
              {isEditing ? 'Редактировать проект' : 'Создать проект'}
            </CardTitle>
            <CardDescription>
              Заполните все обязательные поля (отмечены *) для публикации проекта
              {isEditing && ' — режим редактирования'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {isEditing && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-blue-800">Режим редактирования</p>
                <p className="text-sm text-blue-600 mt-1">
                  Вы редактируете существующий проект. Все изменения будут сохранены.
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-red-800 font-medium">Ошибка заполнения</p>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Основная информация */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Основная информация</h3>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="title">
                  Название проекта <span className="text-red-500">*</span>
                </Label>
              </div>
              <Input
                id="title"
                placeholder="Например: Ремонт комнаты 20 м²"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="h-12"
                disabled={loading}
                maxLength={100}
              />
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Короткое и понятное название (до 100 символов)
                </p>
                <span className="text-sm text-gray-500">
                  {formData.title.length}/100
                </span>
              </div>
            </div>

            {/* Описание проекта с модерацией */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="description" className="text-base font-medium">
                  Описание проекта <span className="text-red-500">*</span>
                </Label>
                
          
              </div>
              
              {/* Счетчик символов */}
              <div className="flex items-center justify-between text-sm">
                <div className={cn(
                  "font-medium",
                  formData.description.length < 50 ? "text-red-500" : 
                  moderationResult && !moderationResult.isClean ? "text-red-500" : 
                  moderationResult?.isClean ? "text-green-600" : "text-gray-600"
                )}>
                  {formData.description.length}/50 символов
                  {formData.description.length >= 50 && moderationResult?.isClean && (
                    <span className="ml-2 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Готово к публикации
                    </span>
                  )}
                </div>
                
                {moderationResult && moderationResult.positions && moderationResult.positions.length > 0 && (
                  <div className="text-red-600 font-medium">
                    {moderationResult.positions.length} недопустимых слов
                  </div>
                )}
              </div>
              
              {/* Поле ввода или предпросмотр */}
              {showPreview ? (
                <div className="border rounded-lg p-4 bg-gray-50 min-h-[140px]">
                  <div 
  className="prose max-w-none"
  dangerouslySetInnerHTML={{ 
    __html: highlightSwearWords(formData.description).html 
  }} 
/>
                  {moderationResult && moderationResult.positions && moderationResult.positions.length > 0 && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600 mb-2">
                        Выделенные слова необходимо исправить перед публикацией
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Textarea
                    id="description"
                    placeholder="Подробно опишите задачи проекта, требования, пожелания...
                    
• Какие задачи нужно выполнить?
• Какие требования к исполнителю?
• Какой результат вы ожидаете?
• Есть ли примеры или референсы?

Чем детальнее описание, тем качественнее отклики."
                    value={formData.description}
                    onChange={(e) => {
                      setFormData(prev => ({...prev, description: e.target.value}));
                      // Сбрасываем статус проверки при изменении текста
                      if (moderationResult) {
                        setModerationResult(null);
                        setIsTextChecked(false);
                      }
                    }}
                    className="min-h-[200px] resize-y text-base"
                    disabled={loading}
                  />
                  
              
                </div>
              )}
              
              {/* Результаты проверки */}
              {moderationResult && !moderationResult.isClean && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-red-800 mb-1">
                        Обнаружены недопустимые слова
                      </h4>
                      <p className="text-red-600 text-sm">
                        Пожалуйста, исправьте выделенные слова перед публикацией проекта
                      </p>
                    </div>
                  </div>
                  
                  {/* Список проблемных слов */}
                  {moderationResult.positions && moderationResult.positions.length > 0 && (
                    <div className="mt-3">
                      <div className="text-sm font-medium text-red-700 mb-2">
                        Найденные проблемы:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {[...new Set(moderationResult.positions.map(p => p.word.toLowerCase()))].map((word, index) => (
                          <Badge 
                            key={index} 
                            variant="outline" 
                            className="bg-white border-red-300 text-red-700"
                          >
                            {word}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 ml-1 hover:bg-red-100"
                              onClick={() => fixBadWord(word, index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Советы */}
                  <div className="mt-3 pt-3 border-t border-red-200">
                    <p className="text-sm text-red-600 mb-2">
                      <strong>Совет:</strong> Используйте профессиональную лексику и избегайте:
                    </p>
                    <ul className="text-sm text-red-600 space-y-1">
                      <li className="flex items-center gap-2">
                        <X className="h-3 w-3" />
                        Оскорбительные и нецензурные выражения
                      </li>
                      <li className="flex items-center gap-2">
                        <X className="h-3 w-3" />
                        Дискриминационные высказывания
                      </li>
                      <li className="flex items-center gap-2">
                        <X className="h-3 w-3" />
                        Агрессивный или неуважительный тон
                      </li>
                    </ul>
                  </div>
                  
                  
                </div>
              )}
              
              {/* Успешная проверка */}
              {moderationResult?.isClean && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-green-800 mb-1">
                        ✓ Текст прошел проверку
                      </h4>
                      <p className="text-green-600 text-sm">
                        Ваше описание соответствует правилам платформы. Можете смело публиковать проект!
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Подсказка */}
              <p className="text-sm text-gray-500">
                Минимум 50 символов. Чем детальнее описание, тем качественнее отклики.
                {!moderationResult && formData.description.length >= 50 && (
                  <span className="text-blue-600 font-medium ml-2">
                    Нажмите "Проверить текст" перед публикацией
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Категория */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Категория</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="category">
                  Категория <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={handleCategoryChange}
                  disabled={loading}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Выберите категорию" />
                  </SelectTrigger>
                  <SelectContent>
                    {mainCategories
                      .filter(cat => cat.id !== 'all')
                      .map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subcategory">
                  Подкатегория <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.subcategory}
                  onValueChange={(value) => setFormData(prev => ({...prev, subcategory: value}))}
                  disabled={loading || !formData.category}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue 
                      placeholder={subcategories.length > 0 
                        ? "Выберите подкатегорию" 
                        : "Сначала выберите категорию"
                      } 
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {subcategories.map(subcat => (
                      <SelectItem key={subcat.id} value={subcat.id}>
                        {subcat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!formData.category && (
                  <p className="text-sm text-gray-500">Сначала выберите категорию</p>
                )}
              </div>
            </div>
          </div>

          {/* Бюджет */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Бюджет
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Тип бюджета <span className="text-red-500">*</span></Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant={formData.budgetType === 'fixed' ? 'default' : 'outline'}
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      budgetType: 'fixed'
                    }))}
                    disabled={loading}
                    className="h-12"
                  >
                    Фиксированный
                  </Button>
                  <Button
                    type="button"
                    variant={formData.budgetType === 'price_request' ? 'default' : 'outline'}
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      budgetType: 'price_request',
                      budgetAmount: ''
                    }))}
                    disabled={loading}
                    className="h-12"
                  >
                    Запрос цены
                  </Button>
                </div>
              </div>

              {formData.budgetType === 'fixed' && (
                <div className="space-y-2">
                  <Label htmlFor="budgetAmount">
                    Сумма (₽) <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="budgetAmount"
                      type="number"
                      placeholder="Например: 15000"
                      value={formData.budgetAmount}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        budgetAmount: e.target.value
                      }))}
                      className="h-12 pl-10"
                      disabled={loading}
                      min="0"
                      step="100"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                      ₽
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    Укажите фиксированный бюджет в рублях
                  </p>
                </div>
              )}

              {formData.budgetType === 'price_request' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800">
                    Исполнители предложат свои цены после изучения проекта
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Сроки и местоположение */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Сроки и местоположение</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Срок выполнения */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Срок выполнения <span className="text-red-500">*</span>
                </h4>
                
                <div className="space-y-2">
                  <Label htmlFor="deadline">Дата начала работ</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-12",
                          !formData.deadline && "text-gray-500"
                        )}
                        disabled={loading}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.deadline ? (
                          format(formData.deadline, "dd.MM.yyyy", { locale: ru })
                        ) : (
                          "Выберите дату"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.deadline}
                        onSelect={(date) => setFormData(prev => ({
                          ...prev,
                          deadline: date
                        }))}
                        initialFocus
                        disabled={(date) => date < new Date()}
                        locale={ru}
                      />
                    </PopoverContent>
                  </Popover>
                  <p className="text-sm text-gray-500">
                    Укажите, когда нужно начать работы
                  </p>
                </div>
              </div>

              {/* Местоположение */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Местоположение <span className="text-red-500">*</span>
                </h4>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="isRemote" className="text-base">
                        Удаленная работа
                      </Label>
                      <p className="text-sm text-gray-500">
                        Работа может выполняться удаленно
                      </p>
                    </div>
                    <Switch
                      id="isRemote"
                      checked={formData.location.isRemote}
                      onCheckedChange={(checked) => {
                        if (checked && !selectedCategory?.allowRemote) {
                          toast({
                            title: "Недоступно",
                            description: "Для этой категории удаленная работа недоступна",
                            variant: "destructive"
                          })
                          return
                        }
                        setFormData(prev => ({
                          ...prev,
                          location: { 
                            ...prev.location, 
                            isRemote: checked,
                            ...(checked ? {
                              city: '',
                              cityName: '',
                              region: '',
                              address: ''
                            } : {})
                          }
                        }))
                      }}
                      disabled={loading || !selectedCategory?.allowRemote}
                    />
                  </div>

                  {!formData.location.isRemote && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="city">
                          Город <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative" ref={cityRef}>
                          <button
                            type="button"
                            onClick={() => { 
                              setShowCityDropdown(!showCityDropdown)
                              setCitySearch('')
                            }}
                            className={cn(
                              "flex items-center gap-2 px-4 h-12 rounded-lg border transition-all w-full",
                              "bg-white hover:bg-gray-50 text-left",
                              showCityDropdown ? "border-blue-500 ring-2 ring-blue-100" : "border-gray-300",
                              !formData.location.cityName && "text-gray-500"
                            )}
                            disabled={loading}
                          >
                            <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0" />
                            <span className="font-medium text-gray-900 truncate flex-1">
                              {formData.location.cityName || 'Выберите город'}
                            </span>
                            {formData.location.cityName ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleClearCity()
                                }}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            ) : (
                              <ChevronDown className={cn(
                                "h-4 w-4 text-gray-500 transition-transform flex-shrink-0",
                                showCityDropdown && "rotate-180"
                              )} />
                            )}
                          </button>

                          {showCityDropdown && (
                            <div className="absolute top-full left-0 mt-2 z-50 bg-white rounded-xl shadow-2xl border overflow-hidden w-full min-w-[320px]">
                              <div className="p-3 border-b bg-gray-50">
                                <div className="relative">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                  <Input
                                    type="text"
                                    placeholder="Найти город или регион..."
                                    value={citySearch}
                                    onChange={(e) => setCitySearch(e.target.value)}
                                    className="pl-9 h-10 w-full"
                                    autoFocus
                                  />
                                  {citySearch && (
                                    <button 
                                      type="button"
                                      onClick={() => setCitySearch('')} 
                                      className="absolute right-3 top-1/2 -translate-y-1/2"
                                    >
                                      <X className="h-4 w-4 text-gray-400" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div className="flex max-h-[450px]">
                                <div className="w-full overflow-y-auto">
                                  {citySearch && filteredLocations.cities.length > 0 && (
                                    <div className="border-b">
                                      <div className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50 uppercase">
                                        Города
                                      </div>
                                      {filteredLocations.cities.slice(0, 20).map((city) => (
                                        <button
                                          type="button"
                                          key={city.id}
                                          onClick={() => handleCitySelect(city.name, city.regionName, city.id)}
                                          className={cn(
                                            "w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between",
                                            formData.location.city === city.id && "bg-blue-50"
                                          )}
                                        >
                                          <div>
                                            <div className="font-medium text-gray-900">{city.name}</div>
                                            <div className="text-sm text-gray-500">{city.regionName}</div>
                                          </div>
                                          {formData.location.city === city.id && (
                                            <div className="w-2 h-2 bg-blue-600 rounded-full" />
                                          )}
                                        </button>
                                      ))}
                                    </div>
                                  )}

                                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50 uppercase">
                                    {citySearch ? 'Регионы' : 'Выберите регион'}
                                  </div>
                                  
                                  {(citySearch ? filteredLocations.regions : regions).map((region) => (
                                    <button
                                      type="button"
                                      key={region.id}
                                      onClick={() => handleRegionSelect(region)}
                                      onMouseEnter={() => region.hasCities && setHoveredRegion(region.id)}
                                      className={cn(
                                        "w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between",
                                        hoveredRegion === region.id && "bg-blue-50",
                                        formData.location.city === region.id && "bg-blue-50"
                                      )}
                                    >
                                      <span className="font-medium text-gray-900">{region.name}</span>
                                      {region.hasCities ? (
                                        <ChevronRight className="h-4 w-4 text-gray-400" />
                                      ) : formData.location.city === region.id ? (
                                        <div className="w-2 h-2 bg-blue-600 rounded-full" />
                                      ) : null}
                                    </button>
                                  ))}
                                </div>

                                {hoveredRegion && citiesInRegion.length > 0 && !citySearch && (
                                  <div className="w-[280px] overflow-y-auto bg-gray-50 border-l">
                                    <div className="px-4 py-3 text-xs font-semibold text-gray-500 border-b bg-white uppercase">
                                      Города в регионе
                                    </div>
                                    <div className="p-2">
                                      {citiesInRegion.map((city) => (
                                        <button
                                          type="button"
                                          key={city.id}
                                          onClick={() => handleCitySelect(city.name, getRegionById(city.regionId)?.name || '', city.id)}
                                          className={cn(
                                            "w-full px-4 py-2.5 text-left hover:bg-white rounded-lg transition-colors",
                                            formData.location.city === city.id && "bg-white text-blue-600 font-medium"
                                          )}
                                        >
                                          {city.name}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address">Адрес (необязательно)</Label>
                        <Input
                          id="address"
                          placeholder="Улица, дом, квартира"
                          value={formData.location.address}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            location: { ...prev.location, address: e.target.value }
                          }))}
                          className="h-12"
                          disabled={loading}
                        />
                      </div>
                    </>
                  )}

                  {formData.location.isRemote && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-green-800 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Проект будет отмечен как удаленный
                      </p>
                    </div>
                  )}

                  {!selectedCategory?.allowRemote && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-yellow-800 text-sm flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                        Для категории "{selectedCategory?.name}" удаленная работа недоступна
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Фотографии */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Фотографии проекта <span className="text-red-500">*</span>
            </h3>
            
            <div className="space-y-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                multiple
                className="hidden"
                disabled={loading || totalImages >= maxFiles}
              />
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading || totalImages >= maxFiles}
                className={cn(
                  "w-full border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center transition-colors",
                  totalImages === 0 
                    ? "border-red-300 bg-red-50 hover:bg-red-100" 
                    : "border-gray-300 hover:bg-gray-50 hover:border-gray-400",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {totalImages === 0 ? (
                  <>
                    <AlertTriangle className="h-10 w-10 text-red-400 mb-3" />
                    <span className="font-medium text-red-700">
                      Обязательно загрузите фотографии
                    </span>
                    <span className="text-sm text-red-600 mt-1">
                      Минимум 1 фотография проекта
                    </span>
                  </>
                ) : (
                  <>
                    <Upload className="h-10 w-10 text-gray-400 mb-3" />
                    <span className="font-medium text-gray-700">
                      {totalImages >= maxFiles 
                        ? `Достигнут лимит ${maxFiles} файлов` 
                        : `Загружено ${totalImages} из ${maxFiles} фото`
                      }
                    </span>
                  </>
                )}
                <span className="text-sm text-gray-500 mt-1">
                  JPG, PNG, WEBP до 5МБ каждый
                </span>
              </button>

              {existingPreviews.length > 0 && (
                <div className="space-y-3">
                  <Label>Существующие фотографии ({existingPreviews.length})</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {existingPreviews.map((preview, index) => (
                      <div key={`existing-${index}`} className="relative group rounded-lg overflow-hidden border">
                        <div className="aspect-square bg-gray-100">
                          <img
                            src={preview}
                            alt={`Существующее фото ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = '/placeholder-image.jpg'
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeExistingImage(index)}
                          disabled={loading}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-blue-500/90 text-white text-xs p-1.5 text-center font-medium">
                          Существующее
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {previews.length > 0 && (
                <div className="space-y-3">
                  <Label>Новые фотографии ({previews.length})</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {previews.map((preview, index) => (
                      <div key={`new-${index}`} className="relative group rounded-lg overflow-hidden border">
                        <div className="aspect-square bg-gray-100">
                          <img
                            src={preview}
                            alt={`Новое фото ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          disabled={loading}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-green-500/90 text-white text-xs p-1.5 text-center font-medium truncate">
                          {formData.files[index]?.name || 'Новое фото'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Кнопки */}
<div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
  {onCancel && (
    <Button
      type="button"
      variant="outline"
      onClick={onCancel}
      disabled={loading}
      className="sm:flex-1 h-12"
    >
      <ArrowLeft className="mr-2 h-4 w-4" />
      Отмена
    </Button>
  )}
  
  <div className="flex flex-col sm:flex-row gap-4 flex-1">
    {/* Кнопка проверки - ДУБЛИРУЕМ НАД КНОПКОЙ ПУБЛИКАЦИИ */}
    <Button
      type="button"
      variant="outline"
      onClick={checkDescription}
      disabled={isModerating || !formData.description.trim() || formData.description.length < 50}
      className={cn(
        "h-12",
        moderationResult?.isClean 
          ? "border-green-300 bg-green-50 text-green-700 hover:bg-green-100" 
          : "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
      )}
    >
      {isModerating ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Проверка...
        </>
      ) : moderationResult?.isClean ? (
        <>
          <CheckCircle className="mr-2 h-5 w-5" />
          Проверено
        </>
      ) : (
        <>
          <Shield className="mr-2 h-5 w-5" />
          Проверить текст
        </>
      )}
    </Button>
    
    {/* Основная кнопка публикации */}
    <Button
      type="submit"
      disabled={isSubmitDisabled}
      className={cn(
        "flex-1 h-12 text-lg font-medium transition-all",
        isSubmitDisabled 
          ? "bg-gray-300 cursor-not-allowed text-gray-500" 
          : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl"
      )}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          {isEditing ? 'Сохранение...' : 'Публикация...'}
        </>
      ) : (
        <div className="flex items-center justify-center gap-2">
          {isEditing ? (
            <>
              <Save className="h-5 w-5" />
              Сохранить изменения
            </>
          ) : (
            <>
              <Briefcase className="h-5 w-5" />
              <span>
                Опубликовать проект
                {totalImages > 0 && ` (${totalImages} фото)`}
              </span>
              
              {/* Бейдж проверки */}
              {moderationResult?.isClean && (
                <Badge className="ml-2 bg-green-100 text-green-700 border-green-300">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Проверено
                </Badge>
              )}
            </>
          )}
        </div>
      )}
    </Button>
  </div>
</div>
        </form>
      </CardContent>
    </Card>
  )
}