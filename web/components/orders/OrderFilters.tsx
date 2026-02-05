'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Filter, X, Search } from 'lucide-react'
import { CATEGORIES } from '@/lib/constants'

interface OrderFiltersProps {
  onFilterChange: (filters: any) => void
  initialFilters?: any
}

export function OrderFilters({ onFilterChange, initialFilters = {} }: OrderFiltersProps) {
  const [filters, setFilters] = useState({
    search: initialFilters.search || '',
    category: initialFilters.category || '',
    minPrice: initialFilters.minPrice || 0,
    maxPrice: initialFilters.maxPrice || 100000,
    status: initialFilters.status || '',
    sortBy: initialFilters.sortBy || 'created_at',
    sortOrder: initialFilters.sortOrder || 'desc',
    remoteOnly: initialFilters.remoteOnly || false,
  })

  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleReset = () => {
    const resetFilters = {
      search: '',
      category: '',
      minPrice: 0,
      maxPrice: 100000,
      status: '',
      sortBy: 'created_at',
      sortOrder: 'desc',
      remoteOnly: false,
    }
    setFilters(resetFilters)
    onFilterChange(resetFilters)
  }

  const handlePriceChange = (value: number[]) => {
    const newFilters = { ...filters, minPrice: value[0], maxPrice: value[1] }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className="space-y-6">
      {/* Мобильный фильтр */}
      <div className="lg:hidden">
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full">
              <Filter className="mr-2 h-4 w-4" />
              Фильтры
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Фильтры заказов</SheetTitle>
              <SheetDescription>
                Используйте фильтры для поиска подходящих заказов
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-6">
              <MobileFiltersContent
                filters={filters}
                onFilterChange={handleFilterChange}
                onPriceChange={handlePriceChange}
                onReset={handleReset}
                onClose={() => setIsSheetOpen(false)}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Десктопные фильтры */}
      <div className="hidden lg:block space-y-6">
        {/* Поиск */}
        <div className="space-y-2">
          <Label htmlFor="search">Поиск</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Название или описание заказа..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-9"
            />
            {filters.search && (
              <button
                onClick={() => handleFilterChange('search', '')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* Категория */}
        <div className="space-y-2">
          <Label htmlFor="category">Категория</Label>
          <Select
            value={filters.category}
            onValueChange={(value) => handleFilterChange('category', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Все категории" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Все категории</SelectItem>
              {CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Бюджет */}
        <div className="space-y-4">
          <div className="flex justify-between">
            <Label>Бюджет</Label>
            <span className="text-sm text-muted-foreground">
              {formatPrice(filters.minPrice)} - {formatPrice(filters.maxPrice)}
            </span>
          </div>
          <Slider
            min={0}
            max={100000}
            step={1000}
            value={[filters.minPrice, filters.maxPrice]}
            onValueChange={handlePriceChange}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0 ₽</span>
            <span>100,000 ₽</span>
          </div>
        </div>

        {/* Статус */}
        <div className="space-y-2">
          <Label htmlFor="status">Статус</Label>
          <Select
            value={filters.status}
            onValueChange={(value) => handleFilterChange('status', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Все статусы" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Все статусы</SelectItem>
              <SelectItem value="published">Опубликованные</SelectItem>
              <SelectItem value="in_progress">В работе</SelectItem>
              <SelectItem value="completed">Завершенные</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Сортировка */}
        <div className="space-y-2">
          <Label htmlFor="sort">Сортировка</Label>
          <Select
            value={filters.sortBy}
            onValueChange={(value) => handleFilterChange('sortBy', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Сортировать по" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">По дате создания</SelectItem>
              <SelectItem value="budget">По бюджету</SelectItem>
              <SelectItem value="deadline">По сроку выполнения</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex space-x-2">
            <Button
              variant={filters.sortOrder === 'desc' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange('sortOrder', 'desc')}
              className="flex-1"
            >
              По убыванию
            </Button>
            <Button
              variant={filters.sortOrder === 'asc' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange('sortOrder', 'asc')}
              className="flex-1"
            >
              По возрастанию
            </Button>
          </div>
        </div>

        {/* Дополнительные опции */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remoteOnly"
              checked={filters.remoteOnly}
              onCheckedChange={(checked) => handleFilterChange('remoteOnly', !!checked)}
            />
            <Label htmlFor="remoteOnly" className="cursor-pointer">
              Только удаленная работа
            </Label>
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="pt-4 space-y-2">
          <Button onClick={handleReset} variant="outline" className="w-full">
            Сбросить фильтры
          </Button>
        </div>
      </div>
    </div>
  )
}

// Компонент для мобильных фильтров
function MobileFiltersContent({
  filters,
  onFilterChange,
  onPriceChange,
  onReset,
  onClose,
}: any) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(price)
  }

  return (
    <>
      {/* Поиск */}
      <div className="space-y-2">
        <Label htmlFor="mobile-search">Поиск</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="mobile-search"
            placeholder="Название или описание заказа..."
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Категория */}
      <div className="space-y-2">
        <Label htmlFor="mobile-category">Категория</Label>
        <Select
          value={filters.category}
          onValueChange={(value) => onFilterChange('category', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Все категории" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Все категории</SelectItem>
            {CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Бюджет */}
      <div className="space-y-4">
        <div className="flex justify-between">
          <Label>Бюджет</Label>
          <span className="text-sm text-muted-foreground">
            {formatPrice(filters.minPrice)} - {formatPrice(filters.maxPrice)}
          </span>
        </div>
        <Slider
          min={0}
          max={100000}
          step={1000}
          value={[filters.minPrice, filters.maxPrice]}
          onValueChange={onPriceChange}
          className="w-full"
        />
      </div>

      {/* Статус */}
      <div className="space-y-2">
        <Label htmlFor="mobile-status">Статус</Label>
        <Select
          value={filters.status}
          onValueChange={(value) => onFilterChange('status', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Все статусы" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Все статусы</SelectItem>
            <SelectItem value="published">Опубликованные</SelectItem>
            <SelectItem value="in_progress">В работе</SelectItem>
            <SelectItem value="completed">Завершенные</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Сортировка */}
      <div className="space-y-2">
        <Label htmlFor="mobile-sort">Сортировка</Label>
        <Select
          value={filters.sortBy}
          onValueChange={(value) => onFilterChange('sortBy', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Сортировать по" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">По дате создания</SelectItem>
            <SelectItem value="budget">По бюджету</SelectItem>
            <SelectItem value="deadline">По сроку выполнения</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Порядок сортировки */}
      <div className="space-y-2">
        <Label>Порядок сортировки</Label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={filters.sortOrder === 'desc' ? 'default' : 'outline'}
            onClick={() => onFilterChange('sortOrder', 'desc')}
          >
            По убыванию
          </Button>
          <Button
            variant={filters.sortOrder === 'asc' ? 'default' : 'outline'}
            onClick={() => onFilterChange('sortOrder', 'asc')}
          >
            По возрастанию
          </Button>
        </div>
      </div>

      {/* Дополнительные опции */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="mobile-remoteOnly"
            checked={filters.remoteOnly}
            onCheckedChange={(checked) => onFilterChange('remoteOnly', !!checked)}
          />
          <Label htmlFor="mobile-remoteOnly" className="cursor-pointer">
            Только удаленная работа
          </Label>
        </div>
      </div>

      {/* Кнопки действий */}
      <div className="pt-6 space-y-3">
        <Button onClick={() => { onReset(); onClose(); }} variant="outline" className="w-full">
          Сбросить фильтры
        </Button>
        <Button onClick={onClose} className="w-full">
          Применить фильтры
        </Button>
      </div>
    </>
  )
}