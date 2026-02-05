'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { MapPin, Search, Filter } from 'lucide-react'

// Динамический импорт для карты (чтобы избежать SSR)
const ProjectsMap = dynamic(() => import('@/components/ProjectsMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Загрузка карты...</p>
      </div>
    </div>
  )
})

export default function MapPage() {
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    category: 'all',
    budgetMin: 0,
    budgetMax: 1000000
  })

  // Моковые данные для проектов на карте
  const mockProjects = [
    {
      id: '1',
      title: 'Разработка сайта',
      description: 'Корпоративный сайт для компании',
      location: { lat: 55.7558, lng: 37.6173 }, // Москва
      budget: { min: 50000, max: 150000 },
      category: 'web'
    },
    {
      id: '2',
      title: 'Мобильное приложение',
      description: 'Приложение для iOS и Android',
      location: { lat: 59.9343, lng: 30.3351 }, // Санкт-Петербург
      budget: { min: 100000, max: 300000 },
      category: 'mobile'
    },
    {
      id: '3',
      title: 'Дизайн логотипа',
      description: 'Создание фирменного стиля',
      location: { lat: 56.8389, lng: 60.6057 }, // Екатеринбург
      budget: { min: 20000, max: 50000 },
      category: 'design'
    }
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Карта проектов</h1>
        <p className="text-gray-600">
          Найдите проекты на карте по вашему местоположению
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Левая панель - фильтры и список */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Поиск проектов
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Поиск по названию или описанию..."
                    className="pl-10"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Категория
                    </label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={filters.category}
                      onChange={(e) => setFilters({...filters, category: e.target.value})}
                    >
                      <option value="all">Все категории</option>
                      <option value="web">Веб-разработка</option>
                      <option value="mobile">Мобильные приложения</option>
                      <option value="design">Дизайн</option>
                      <option value="marketing">Маркетинг</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium">
                      Бюджет, ₽
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="От"
                        value={filters.budgetMin}
                        onChange={(e) => setFilters({...filters, budgetMin: Number(e.target.value)})}
                      />
                      <span>-</span>
                      <Input
                        type="number"
                        placeholder="До"
                        value={filters.budgetMax}
                        onChange={(e) => setFilters({...filters, budgetMax: Number(e.target.value)})}
                      />
                    </div>
                  </div>
                </div>

                <Button className="w-full" variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Применить фильтры
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Найденные проекты</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockProjects.map(project => (
                  <div 
                    key={project.id}
                    className="p-4 border rounded-lg hover:border-blue-500 cursor-pointer"
                  >
                    <div className="font-medium mb-2">{project.title}</div>
                    <div className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {project.description}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-green-600 font-medium">
                        {project.budget.min.toLocaleString()} - {project.budget.max.toLocaleString()} ₽
                      </div>
                      <Button size="sm">Подробнее</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Правая панель - карта */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Карта проектов
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[calc(100%-4rem)]">
              <div className="h-full rounded-lg overflow-hidden">
                <ProjectsMap projects={mockProjects} />
                
                {/* Если компонент ProjectsMap еще не готов, временный заглушка */}
                {!ProjectsMap && (
                  <div className="h-full bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">
                        Карта проектов
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        {mockProjects.length} проектов найдено в вашем регионе
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}