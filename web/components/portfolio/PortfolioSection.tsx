'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Plus, Edit, Trash, Share, Calendar, 
  RefreshCw, ExternalLink, User, Link, Globe,
  Upload, X, Loader2, Check, AlertCircle, Eye
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { cn } from '@/lib/utils'
import type { PortfolioItem } from '@/types/user.types'

interface PortfolioSectionProps {
  userId?: string
  readonly?: boolean
}

const MAX_IMAGES = 5
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const MIN_DESCRIPTION_LENGTH = 20

type FormDataState = {
  title: string
  description: string
  duration: string
  client_name: string
  project_url: string
  completed_date: string
  is_public: boolean
}

const initialFormData: FormDataState = {
  title: '',
  description: '',
  duration: '',
  client_name: '',
  project_url: '',
  completed_date: '',
  is_public: true
}

export default function PortfolioSection({ userId, readonly = false }: PortfolioSectionProps) {
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null)
  const [formData, setFormData] = useState<FormDataState>(initialFormData)
  const [skills, setSkills] = useState<string[]>([])
  const [currentSkill, setCurrentSkill] = useState('')
  const [newImages, setNewImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Загрузка работ портфолио
  const fetchPortfolioItems = useCallback(async () => {
    try {
      setIsLoading(true)
      const url = userId 
        ? `/api/portfolio?userId=${userId}`
        : '/api/portfolio'
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Ошибка загрузки: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        setPortfolioItems(result.data || [])
      } else {
        setPortfolioItems([])
        toast({
          title: "Ошибка",
          description: result.error || "Не удалось загрузить портфолио",
          variant: "destructive"
        })
      }
    } catch (err) {
      console.error('Ошибка загрузки портфолио:', err)
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : "Неизвестная ошибка",
        variant: "destructive"
      })
      setPortfolioItems([])
    } finally {
      setIsLoading(false)
    }
  }, [userId, toast])

  useEffect(() => {
    fetchPortfolioItems()
  }, [fetchPortfolioItems])

  // Сброс формы
  const resetForm = () => {
    setFormData(initialFormData)
    setSkills([])
    setCurrentSkill('')
    setNewImages([])
    setImagePreviews([])
    setExistingImages([])
    setUploadProgress(0)
    setEditingItem(null)
  }

  // Открытие диалога для добавления/редактирования
  const openAddDialog = (item?: PortfolioItem) => {
    if (readonly) return
    
    if (item) {
      setEditingItem(item)
      setFormData({
        title: item.title,
        description: item.description,
        duration: item.duration || '',
        client_name: item.client_name || '',
        project_url: item.project_url || '',
        completed_date: item.completed_date?.split('T')[0] || '',
        is_public: item.is_public !== false
      })
      setSkills(item.skills || [])
      setExistingImages(item.images || [])
      setImagePreviews([])
    } else {
      resetForm()
    }
    setIsAddDialogOpen(true)
  }

  // Валидация файла
  const validateFile = (file: File): { isValid: boolean; message?: string } => {
    if (!file.type.startsWith('image/')) {
      return { isValid: false, message: `Файл ${file.name} не является изображением` }
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return { isValid: false, message: `Файл ${file.name} превышает 5МБ` }
    }
    
    return { isValid: true }
  }

  // Обработка выбора файлов
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    // Проверяем лимит файлов
    const totalFiles = newImages.length + files.length + existingImages.length
    if (totalFiles > MAX_IMAGES) {
      toast({
        title: "Лимит файлов",
        description: `Максимум ${MAX_IMAGES} изображений. У вас уже ${existingImages.length} загруженных и ${newImages.length} новых`,
        variant: "destructive"
      })
      return
    }

    const validFiles: File[] = []
    
    files.forEach(file => {
      const validation = validateFile(file)
      if (validation.isValid) {
        validFiles.push(file)
      } else if (validation.message) {
        toast({
          title: "Ошибка",
          description: validation.message,
          variant: "destructive"
        })
      }
    })

    setNewImages(prev => [...prev, ...validFiles])

    // Создаем превью
    validFiles.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Удаление нового изображения
  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  // Удаление существующего изображения
  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index))
  }

  // Добавление навыка
  const addSkill = () => {
    const trimmedSkill = currentSkill.trim()
    if (trimmedSkill && !skills.includes(trimmedSkill)) {
      setSkills(prev => [...prev, trimmedSkill])
      setCurrentSkill('')
    }
  }

  // Удаление навыка
  const removeSkill = (skillToRemove: string) => {
    setSkills(prev => prev.filter(skill => skill !== skillToRemove))
  }

  // Загрузка одного изображения
  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', 'portfolio')

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })

    const result = await response.json()
    
    if (!result.success || !result.data?.url) {
      throw new Error(result.error || 'Ошибка загрузки изображения')
    }

    return result.data.url
  }

  // Валидация формы
  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите название работы",
        variant: "destructive"
      })
      return false
    }

    if (!formData.description.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите описание работы",
        variant: "destructive"
      })
      return false
    }

    if (formData.description.length < MIN_DESCRIPTION_LENGTH) {
      toast({
        title: "Ошибка",
        description: `Описание должно быть не менее ${MIN_DESCRIPTION_LENGTH} символов`,
        variant: "destructive"
      })
      return false
    }

    if (formData.project_url && !isValidUrl(formData.project_url)) {
      toast({
        title: "Ошибка",
        description: "Введите корректный URL проекта",
        variant: "destructive"
      })
      return false
    }

    return true
  }

  // Сохранение работы
  const handleSaveItem = async () => {
    if (!validateForm()) return

    try {
      setIsUploading(true)
      setUploadProgress(0)

      // Загружаем новые изображения
      let uploadedImageUrls: string[] = [...existingImages]
      
      if (newImages.length > 0) {
        const totalImages = newImages.length
        let uploadedCount = 0
        
        for (const file of newImages) {
          try {
            const imageUrl = await uploadImage(file)
            uploadedImageUrls.push(imageUrl)
            uploadedCount++
            setUploadProgress(Math.round((uploadedCount / totalImages) * 100))
          } catch (error) {
            console.error('Ошибка загрузки изображения:', error)
            toast({
              title: "Ошибка загрузки",
              description: `Не удалось загрузить изображение ${file.name}`,
              variant: "destructive"
            })
          }
        }
      }

      // Подготавливаем данные
      const payload = {
        ...formData,
        skills,
        images: uploadedImageUrls,
        ...(editingItem && { id: editingItem.id })
      }

      const url = '/api/portfolio'
      const method = editingItem ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: editingItem ? "Работа обновлена" : "Работа добавлена",
          description: editingItem 
            ? "Работа успешно обновлена в вашем портфолио"
            : "Новая работа успешно добавлена в портфолио",
        })
        
        setIsAddDialogOpen(false)
        resetForm()
        fetchPortfolioItems()
      } else {
        toast({
          title: "Ошибка",
          description: result.error || "Не удалось сохранить работу",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Ошибка сохранения работы:', error)
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при сохранении",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  // Удаление работы
  const handleDeleteItem = async (id: string) => {
    if (readonly) return
    
    if (!confirm('Вы уверены, что хотите удалить эту работу из портфолио?')) {
      return
    }

    try {
      const response = await fetch(`/api/portfolio?id=${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Работа удалена",
          description: "Работа успешно удалена из портфолио",
        })
        fetchPortfolioItems()
      } else {
        toast({
          title: "Ошибка",
          description: result.error || "Не удалось удалить работу",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Ошибка удаления работы:', error)
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при удалении",
        variant: "destructive"
      })
    }
  }

  // Поделиться работой
  const handleShare = (item: PortfolioItem) => {
    if (!item.is_public) {
      toast({
        title: "Ошибка",
        description: "Нельзя поделиться приватной работой",
        variant: "destructive"
      })
      return
    }

    const url = `${window.location.origin}/portfolio/${item.id}`
    navigator.clipboard.writeText(url)
      .then(() => {
        toast({
          title: "Ссылка скопирована",
          description: "Ссылка на работу скопирована в буфер обмена",
        })
      })
      .catch(() => {
        toast({
          title: "Ошибка",
          description: "Не удалось скопировать ссылку",
          variant: "destructive"
        })
      })
  }

  // Форматирование даты
  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  // Проверка ссылки
  const isValidUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  // Статистика
  const stats = {
    total: portfolioItems.length,
    public: portfolioItems.filter(item => item.is_public).length,
    withImages: portfolioItems.filter(item => item.images?.length > 0).length,
    uniqueSkills: new Set(portfolioItems.flatMap(item => item.skills || [])).size
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="inline-block h-12 w-12 animate-spin text-blue-600" />
          <p className="mt-4 text-gray-600">Загрузка портфолио...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Заголовок и кнопки */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Портфолио проектов</h2>
          <p className="text-gray-600">
            {userId ? 'Работы пользователя' : readonly ? 'Мои работы' : 'Ваши работы в портфолио'}
          </p>
        </div>
        <div className="flex gap-3">
          {!readonly && !userId && (
            <>
              <Button variant="outline" onClick={fetchPortfolioItems}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Обновить
              </Button>
              <Button onClick={() => openAddDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Добавить работу
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-gray-600">Всего работ</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.public}</div>
              <div className="text-sm text-gray-600">Публичных</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.withImages}</div>
              <div className="text-sm text-gray-600">С изображениями</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.uniqueSkills}</div>
              <div className="text-sm text-gray-600">Уникальных навыков</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Список работ */}
      {portfolioItems.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Plus className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              {userId || readonly ? 'Портфолио пустое' : 'Ваше портфолио пустое'}
            </h3>
            <p className="text-gray-600 mb-6">
              {userId 
                ? 'У пользователя пока нет работ в портфолио'
                : readonly
                ? 'У вас пока нет работ в портфолио'
                : 'Добавьте свои лучшие работы, чтобы показать их потенциальным клиентам'
              }
            </p>
            {!readonly && !userId && (
              <Button onClick={() => openAddDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Добавить первую работу
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portfolioItems.map(item => (
            <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Изображения */}
              {item.images && item.images.length > 0 && (
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={item.images[0]}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  {item.images.length > 1 && (
                    <div className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                      +{item.images.length - 1}
                    </div>
                  )}
                  {!item.is_public && (
                    <div className="absolute top-3 left-3 bg-gray-700 text-white text-xs px-2 py-1 rounded-full">
                      Приватная
                    </div>
                  )}
                </div>
              )}
              
              <CardHeader className={cn("pb-3", !item.images?.length && "pt-6")}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1 line-clamp-1">{item.title}</CardTitle>
                    <CardDescription className="line-clamp-2 min-h-[40px]">
                      {item.description}
                    </CardDescription>
                  </div>
                  {!readonly && !userId && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openAddDialog(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleShare(item)}
                      >
                        <Share className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="pb-4">
                {/* Навыки */}
                {item.skills && item.skills.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {item.skills.slice(0, 3).map((skill, index) => (
                        <Badge key={`${item.id}-skill-${index}`} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {item.skills.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{item.skills.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Детали */}
                <div className="space-y-2 text-sm">
                  {item.duration && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span>{item.duration}</span>
                    </div>
                  )}
                  
                  {item.client_name && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <User className="h-4 w-4 flex-shrink-0" />
                      <span className="line-clamp-1">{item.client_name}</span>
                    </div>
                  )}

                  {item.completed_date && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span>{formatDate(item.completed_date)}</span>
                    </div>
                  )}

                  {item.project_url && isValidUrl(item.project_url) && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Link className="h-4 w-4 flex-shrink-0" />
                      <a 
                        href={item.project_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline truncate"
                      >
                        {new URL(item.project_url).hostname}
                      </a>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 flex-shrink-0" />
                    <span className={cn(
                      "text-sm font-medium",
                      item.is_public ? "text-green-600" : "text-gray-600"
                    )}>
                      {item.is_public ? "Публичная" : "Приватная"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Диалог добавления/редактирования работы */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Редактировать работу' : 'Добавить работу в портфолио'}
            </DialogTitle>
            <DialogDescription>
              Заполните информацию о работе, которую хотите показать в портфолио
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-2">
            {/* Название */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Название работы <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Например: Разработка корпоративного сайта"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({...prev, title: e.target.value}))}
                disabled={isUploading}
                className={!formData.title.trim() && formData.title.length > 0 ? "border-red-300" : ""}
              />
              {!formData.title.trim() && formData.title.length > 0 && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  Название не может быть пустым
                </p>
              )}
            </div>

            {/* Описание */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description">
                  Описание работы <span className="text-red-500">*</span>
                </Label>
                <span className={cn(
                  "text-sm font-medium",
                  formData.description.length < MIN_DESCRIPTION_LENGTH ? "text-red-500" : "text-green-600"
                )}>
                  {formData.description.length}/{MIN_DESCRIPTION_LENGTH}
                </span>
              </div>
              <Textarea
                id="description"
                placeholder="Опишите проект: задачи, технологии, ваш вклад..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                className={cn(
                  "min-h-[120px]",
                  formData.description.length > 0 && formData.description.length < MIN_DESCRIPTION_LENGTH ? "border-red-300" : ""
                )}
                disabled={isUploading}
              />
              {formData.description.length > 0 && formData.description.length < MIN_DESCRIPTION_LENGTH && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  Минимум {MIN_DESCRIPTION_LENGTH} символов
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Срок выполнения */}
              <div className="space-y-2">
                <Label htmlFor="duration">Срок выполнения (необязательно)</Label>
                <Input
                  id="duration"
                  placeholder="Например: 2 недели"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({...prev, duration: e.target.value}))}
                  disabled={isUploading}
                />
              </div>
              
              {/* Дата завершения */}
              <div className="space-y-2">
                <Label htmlFor="completed_date">Дата завершения (необязательно)</Label>
                <Input
                  id="completed_date"
                  type="date"
                  value={formData.completed_date}
                  onChange={(e) => setFormData(prev => ({...prev, completed_date: e.target.value}))}
                  disabled={isUploading}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Имя клиента */}
              <div className="space-y-2">
                <Label htmlFor="client_name">Имя клиента (необязательно)</Label>
                <Input
                  id="client_name"
                  placeholder="Название компании или ФИО"
                  value={formData.client_name}
                  onChange={(e) => setFormData(prev => ({...prev, client_name: e.target.value}))}
                  disabled={isUploading}
                />
              </div>
              
              {/* Ссылка на проект */}
              <div className="space-y-2">
                <Label htmlFor="project_url">Ссылка на проект (необязательно)</Label>
                <Input
                  id="project_url"
                  placeholder="https://example.com"
                  value={formData.project_url}
                  onChange={(e) => setFormData(prev => ({...prev, project_url: e.target.value}))}
                  disabled={isUploading}
                  className={formData.project_url && !isValidUrl(formData.project_url) ? "border-red-300" : ""}
                />
                {formData.project_url && !isValidUrl(formData.project_url) && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    Введите корректный URL
                  </p>
                )}
              </div>
            </div>

            {/* Навыки */}
            <div className="space-y-3">
              <Label>Навыки и технологии (необязательно)</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {skills.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="cursor-pointer hover:bg-gray-200">
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="ml-2 text-xs hover:text-red-600"
                      disabled={isUploading}
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Добавить навык (React, TypeScript, Figma...)"
                  value={currentSkill}
                  onChange={(e) => setCurrentSkill(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  disabled={isUploading}
                />
                <Button 
                  type="button" 
                  onClick={addSkill} 
                  variant="outline"
                  disabled={isUploading || !currentSkill.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Загрузка изображений */}
            <div className="space-y-3">
              <Label>Изображения проекта (необязательно)</Label>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                multiple
                className="hidden"
                disabled={isUploading || (newImages.length + existingImages.length >= MAX_IMAGES)}
              />
              
              {/* Прогресс загрузки */}
              {isUploading && uploadProgress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Загрузка изображений...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
              
              {/* Кнопка загрузки */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || (newImages.length + existingImages.length >= MAX_IMAGES)}
                className={cn(
                  "w-full border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center transition-colors",
                  "hover:bg-gray-50 hover:border-gray-400",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                <Upload className="h-10 w-10 text-gray-400 mb-3" />
                <span className="font-medium text-gray-700 text-center">
                  {newImages.length + existingImages.length >= MAX_IMAGES 
                    ? `Достигнут лимит (${MAX_IMAGES} изображений)` 
                    : "Загрузите фотографии проекта"
                  }
                </span>
                <span className="text-sm text-gray-500 mt-1">
                  JPG, PNG до 5МБ каждый
                </span>
                <span className="text-sm text-gray-400 mt-1">
                  {newImages.length + existingImages.length}/{MAX_IMAGES} файлов
                </span>
              </button>

              {/* Существующие изображения */}
              {existingImages.length > 0 && (
                <div className="space-y-3">
                  <Label>Загруженные изображения</Label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {existingImages.map((imageUrl, index) => (
                      <div key={`existing-${index}`} className="relative group rounded-lg overflow-hidden border aspect-square">
                        <img
                          src={imageUrl}
                          alt={`Изображение ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(index)}
                          disabled={isUploading}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 text-center">
                          Существующее
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Новые изображения */}
              {imagePreviews.length > 0 && (
                <div className="space-y-3">
                  <Label>Новые изображения ({imagePreviews.length})</Label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {imagePreviews.map((preview, index) => (
                      <div key={`new-${index}`} className="relative group rounded-lg overflow-hidden border aspect-square">
                        <img
                          src={preview}
                          alt={`Новое изображение ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeNewImage(index)}
                          disabled={isUploading}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-green-700 text-white text-xs p-1 text-center">
                          Новое
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Публичность */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="is_public" className="cursor-pointer">
                  Публичная работа
                </Label>
                <div className="text-sm text-gray-500">
                  Работа будет видна в вашем публичном портфолио
                </div>
              </div>
              <Switch
                id="is_public"
                checked={formData.is_public}
                onCheckedChange={(checked) => setFormData(prev => ({...prev, is_public: checked}))}
                disabled={isUploading}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsAddDialogOpen(false)
                resetForm()
              }}
              disabled={isUploading}
            >
              Отмена
            </Button>
            <Button 
              onClick={handleSaveItem}
              disabled={
                isUploading || 
                !formData.title.trim() || 
                !formData.description.trim() ||
                formData.description.length < MIN_DESCRIPTION_LENGTH ||
                (formData.project_url && !isValidUrl(formData.project_url))
              }
              className="min-w-[160px]"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {editingItem ? 'Сохранение...' : 'Добавление...'}
                </>
              ) : (
                <>
                  {editingItem ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Сохранить изменения
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Добавить в портфолио
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}