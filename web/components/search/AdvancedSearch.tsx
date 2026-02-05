'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Search, MapPin, Filter, X, Loader2 } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { SearchService } from '@/lib/search'

const categories = [
  { value: 'EXCAVATION', label: 'Земляные работы' },
  { value: 'CRANE', label: 'Крановые работы' },
  { value: 'LOADING', label: 'Погрузочные работы' },
  { value: 'TRANSPORT', label: 'Перевозки' },
  { value: 'CONSTRUCTION', label: 'Строительные работы' },
  { value: 'CLEANING', label: 'Уборка/расчистка' },
  { value: 'REPAIR', label: 'Ремонтные работы' },
]

const statuses = [
  { value: 'ACTIVE', label: 'Активные' },
  { value: 'IN_PROGRESS', label: 'В работе' },
  { value: 'COMPLETED', label: 'Завершенные' },
]

const sortOptions = [
  { value: 'date_desc', label: 'Сначала новые' },
  { value: 'date_asc', label: 'Сначала старые' },
  { value: 'price_asc', label: 'Дешевле' },
  { value: 'price_desc', label: 'Дороже' },
  { value: 'popularity', label: 'По популярности' },
]

export default function AdvancedSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  
  // Состояние фильтров
  const [filters, setFilters] = useState({
    query: searchParams.get('q') || '',
    categories: searchParams.get('categories')?.split(',') || [],
    city: searchParams.get('city') || '',
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : 0,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : 1000000,
    status: searchParams.get('status')?.split(',') || ['ACTIVE'],
    sortBy: searchParams.get('sort') || 'date_desc',
    radius: searchParams.get('radius') ? Number(searchParams.get('radius')) : 50,
  })
  
  // Получаем геолокацию пользователя
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.log('Геолокация не доступна:', error)
        }
      )
    }
  }, [])
  
  // Обработчик поиска
  const handleSearch = async () => {
    setIsLoading(true)
    
    // Собираем параметры для URL
    const params = new URLSearchParams()
    
    if (filters.query) params.set('q', filters.query)
    if (filters.categories.length > 0) params.set('categories', filters.categories.join(','))
    if (filters.city) params.set('city', filters.city)
    if (filters.minPrice > 0) params.set('minPrice', filters.minPrice.toString())
    if (filters.maxPrice < 1000000) params.set('maxPrice', filters.maxPrice.toString())
    if (filters.status.length > 0) params.set('status', filters.status.join(','))
    if (filters.sortBy !== 'date_desc') params.set('sort', filters.sortBy)
    if (userLocation && filters.radius !== 50) {
      params.set('lat', userLocation.lat.toString())
      params.set('lng', userLocation.lng.toString())
      params.set('radius', filters.radius.toString())
    }
    
    // Переходим на страницу с результатами
    router.push(`/dashboard/orders/search?${params.toString()}`)
    setIsOpen(false)
    
    // Имитация загрузки
    setTimeout(() => setIsLoading(false), 500)
  }
  
  // Сброс фильтров
  const handleReset = () => {
    setFilters({
      query: '',
      categories: [],
      city: '',
      minPrice: 0,
      maxPrice: 1000000,
      status: ['ACTIVE'],
      sortBy: 'date_desc',
      radius: 50,
    })
  }
  
  // Обновление категорий
  const toggleCategory = (category: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }))
  }
  
  // Обновление статусов
  const toggleStatus = (status: string) => {
    setFilters(prev => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...prev.status, status]
    }))
  }
  
  return (
    <>
      {/* Кнопка открытия поиска */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Расширенный поиск
          </Button>
        </SheetTrigger>
        
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Расширенный поиск
            </SheetTitle>
          </SheetHeader>
          
          <div className="py-6 space-y-6">
            {/* Поисковый запрос */}
            <div className="space-y-3">
              <Label htmlFor="search-query">Поиск</Label>
              <Input
                id="search-query"
                placeholder="Что вы ищете?"
                value={filters.query}
                onChange={(e) => setFilters({ ...filters, query: e.target.value })}
              />
            </div>
            
            {/* Категории */}
            <div className="space-y-3">
              <Label>Категории</Label>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((category) => (
                  <div key={category.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`cat-${category.value}`}
                      checked={filters.categories.includes(category.value)}
                      onCheckedChange={() => toggleCategory(category.value)}
                    />
                    <Label
                      htmlFor={`cat-${category.value}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {category.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Город */}
            <div className="space-y-3">
              <Label htmlFor="city">Город</Label>
              <Input
                id="city"
                placeholder="Например: Москва"
                value={filters.city}
                onChange={(e) => setFilters({ ...filters, city: e.target.value })}
              />
            </div>
            
            {/* Цена */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>Бюджет</Label>
                <span className="text-sm text-gray-500">
                  {filters.minPrice.toLocaleString()} - {filters.maxPrice.toLocaleString()} ₽
                </span>
              </div>
              <Slider
                min={0}
                max={1000000}
                step={10000}
                value={[filters.minPrice, filters.maxPrice]}
                onValueChange={([min, max]) => setFilters({ ...filters, minPrice: min, maxPrice: max })}
                className="py-4"
              />
              <div className="flex justify-between text-sm text-gray-500">
                <span>0 ₽</span>
                <span>1 000 000 ₽</span>
              </div>
            </div>
            
            {/* Геолокация */}
            {userLocation && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <Label>Расстояние от вас</Label>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Радиус поиска</span>
                    <span className="text-sm font-medium">{filters.radius} км</span>
                  </div>
                  <Slider
                    min={1}
                    max={200}
                    step={1}
                    value={[filters.radius]}
                    onValueChange={([radius]) => setFilters({ ...filters, radius })}
                  />
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>1 км</span>
                    <span>200 км</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Статусы */}
            <div className="space-y-3">
              <Label>Статус заявок</Label>
              <div className="flex flex-wrap gap-2">
                {statuses.map((status) => (
                  <div key={status.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${status.value}`}
                      checked={filters.status.includes(status.value)}
                      onCheckedChange={() => toggleStatus(status.value)}
                    />
                    <Label
                      htmlFor={`status-${status.value}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {status.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Сортировка */}
            <div className="space-y-3">
              <Label htmlFor="sort">Сортировка</Label>
              <Select
                value={filters.sortBy}
                onValueChange={(value) => setFilters({ ...filters, sortBy: value })}
              >
                <SelectTrigger id="sort">
                  <SelectValue placeholder="Сортировать по" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Кнопки действий */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleReset}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Сбросить
              </Button>
              <Button
                onClick={handleSearch}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Поиск...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Найти
                  </>
                )}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}