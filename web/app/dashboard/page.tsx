'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, MapPin, ChevronRight, ChevronDown, X, LayoutGrid, AlertCircle, RefreshCw } from 'lucide-react'
import ProjectCard from '@/components/projects/ProjectCard'
import { cn } from '@/lib/utils'
import { mainCategories, getCategoryById } from '@/data/categories'
import { regions, cities, getRegionById } from '@/data/russianCities'

interface Project {
  id: string
  title: string
  description: string
  category: string
  subcategory: string
  budget: number
  city: string
  region: string
  urgent: boolean
  remote: boolean
  createdAt: string
  deadline: string
  status: string
  skills: string[]
  proposalsCount: number
  user?: {
    id: string
    name: string
    avatar?: string
    rating?: number
  } | null
}

interface ApiResponse {
  success: boolean
  data: Project[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  error?: string
}

export default function ProjectsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null)
  const [selectedCity, setSelectedCity] = useState('Вся Россия')
  const [selectedRegion, setSelectedRegion] = useState('')
  
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [showCityDropdown, setShowCityDropdown] = useState(false)
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const [citySearch, setCitySearch] = useState('')
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null)
  
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalProjects, setTotalProjects] = useState(0)
  
  const categoryRef = useRef<HTMLDivElement>(null)
  const cityRef = useRef<HTMLDivElement>(null)
  
  // Загрузка проектов из API
  const fetchProjects = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Собираем параметры запроса
      const params = new URLSearchParams()
      
      if (selectedCategory !== 'all') params.append('category', selectedCategory)
      if (selectedSubcategory) params.append('subcategory', selectedSubcategory)
      if (selectedCity !== 'Вся Россия') params.append('city', selectedCity)
      if (searchQuery) params.append('q', searchQuery)
      
      params.append('status', 'active')
      params.append('limit', '50')
      
      console.log('Fetching projects with params:', params.toString())
      
      const response = await fetch(`/api/projects?${params}`)
      
      if (!response.ok) {
        throw new Error(`Ошибка ${response.status}: ${response.statusText}`)
      }
      
      const result: ApiResponse = await response.json()
      console.log('API Response:', result)
      
      if (result.success) {
        // Важно: projects = result.data (массив), а не весь result
        setProjects(result.data || [])
        setTotalProjects(result.pagination?.total || result.data?.length || 0)
        setError(null)
      } else {
        setProjects([])
        setTotalProjects(0)
        setError(result.error || 'Ошибка загрузки проектов')
      }
    } catch (err) {
      console.error('Ошибка загрузки проектов:', err)
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
      setProjects([])
      setTotalProjects(0)
    } finally {
      setLoading(false)
    }
  }
  
  // Загружаем проекты при изменении фильтров
  useEffect(() => {
    fetchProjects()
  }, [selectedCategory, selectedSubcategory, selectedCity])
  
  // Поиск с задержкой (debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== '' || selectedCategory !== 'all' || selectedCity !== 'Вся Россия') {
        fetchProjects()
      }
    }, 500)
    
    return () => clearTimeout(timer)
  }, [searchQuery])
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false)
        setHoveredCategory(null)
      }
      if (cityRef.current && !cityRef.current.contains(event.target as Node)) {
        setShowCityDropdown(false)
        setHoveredRegion(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Фильтрация проектов на клиенте (дополнительная)
  const filteredProjects = useMemo(() => {
    // Убедимся, что projects - массив
    if (!Array.isArray(projects)) {
      console.warn('projects is not an array:', projects)
      return []
    }
    
    return projects.filter(project => {
      // Основные фильтры уже применены на сервере
      // Дополнительная фильтрация только по поиску
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (
          project.title?.toLowerCase().includes(q) || 
          project.description?.toLowerCase().includes(q) ||
          project.skills?.some(s => s.toLowerCase().includes(q))
        )
      }
      return true
    })
  }, [projects, searchQuery])

  const filteredLocations = useMemo(() => {
    if (!citySearch.trim()) return { regions: regions, cities: [] }
    const query = citySearch.toLowerCase()
    const matchedCities = cities
      .filter(c => c.name.toLowerCase().includes(query))
      .slice(0, 50)
      .map(c => ({ ...c, regionName: getRegionById(c.regionId)?.name || '' }))
    const matchedRegions = regions.filter(r => r.name.toLowerCase().includes(query))
    return { regions: matchedRegions, cities: matchedCities }
  }, [citySearch])

  const citiesInRegion = useMemo(() => {
    if (!hoveredRegion) return []
    return cities.filter(c => c.regionId === hoveredRegion).sort((a, b) => a.name.localeCompare(b.name, 'ru'))
  }, [hoveredRegion])

  const currentCategory = getCategoryById(selectedCategory)

  const handleCategorySelect = (categoryId: string, subcategory?: string) => {
    setSelectedCategory(categoryId)
    setSelectedSubcategory(subcategory || null)
    setShowCategoryDropdown(false)
    setHoveredCategory(null)
  }

  const handleCitySelect = (cityName: string, regionName: string) => {
    setSelectedCity(cityName)
    setSelectedRegion(regionName)
    setShowCityDropdown(false)
    setCitySearch('')
    setHoveredRegion(null)
  }

  const handleRegionSelect = (region: typeof regions[0]) => {
    if (!region.hasCities) {
      setSelectedCity(region.name)
      setSelectedRegion(region.name)
      setShowCityDropdown(false)
      setCitySearch('')
      setHoveredRegion(null)
    }
  }

  const clearFilters = () => {
    setSelectedCategory('all')
    setSelectedSubcategory(null)
    setSelectedCity('Вся Россия')
    setSelectedRegion('')
    setSearchQuery('')
  }

  const hasActiveFilters = selectedCategory !== 'all' || selectedCity !== 'Вся Россия' || searchQuery

  // Состояние загрузки
  if (loading && projects.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Загрузка проектов...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Найдите проект</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-gray-600">{totalProjects} проектов доступно</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchProjects}
              disabled={loading}
              className="h-7"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            
            {/* === ФИЛЬТР КАТЕГОРИЙ === */}
            <div className="relative" ref={categoryRef}>
              <button
                onClick={() => { setShowCategoryDropdown(!showCategoryDropdown); setShowCityDropdown(false) }}
                className={cn(
                  "flex items-center gap-2 px-4 h-11 rounded-lg border transition-all w-full lg:w-auto",
                  "bg-white hover:bg-gray-50 min-w-[220px]",
                  showCategoryDropdown ? "border-blue-500 ring-2 ring-blue-100" : "border-gray-300"
                )}
              >
                <div className={cn("p-1.5 rounded", currentCategory?.color || "bg-gray-100")}>
                  {currentCategory?.icon || <LayoutGrid className="h-4 w-4" />}
                </div>
                <span className="font-medium text-gray-900 truncate flex-1 text-left">
                  {selectedSubcategory || currentCategory?.name || 'Все категории'}
                </span>
                <ChevronDown className={cn("h-4 w-4 text-gray-500 transition-transform", showCategoryDropdown && "rotate-180")} />
              </button>

              {showCategoryDropdown && (
                <div className="absolute top-full left-0 mt-2 z-50 bg-white rounded-xl shadow-2xl border overflow-hidden">
                  <div className="flex">
                    {/* Категории */}
                    <div className="w-[320px] max-h-[500px] overflow-y-auto border-r">
                      <div className="p-4 border-b bg-gray-50">
                        <span className="font-semibold text-gray-900">Все категории</span>
                      </div>
                      {mainCategories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => cat.id === 'all' && handleCategorySelect('all')}
                          onMouseEnter={() => setHoveredCategory(cat.id)}
                          className={cn(
                            "flex items-center gap-3 w-full px-4 py-3.5 text-left transition-colors",
                            "hover:bg-gray-50",
                            (hoveredCategory === cat.id || selectedCategory === cat.id) && "bg-blue-50"
                          )}
                        >
                          <span className={cn("p-2.5 rounded-lg flex-shrink-0", cat.color)}>{cat.icon}</span>
                          <span className="font-medium text-gray-900">{cat.name}</span>
                          {cat.subcategories.length > 0 && (
                            <ChevronRight className="h-4 w-4 text-gray-400 ml-auto" />
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Подкатегории */}
                    {hoveredCategory && hoveredCategory !== 'all' && (
                      <div className="w-[280px] max-h-[500px] overflow-y-auto bg-gray-50">
                        <div className="p-4 border-b bg-white">
                          <span className="font-semibold text-gray-900">
                            {mainCategories.find(c => c.id === hoveredCategory)?.name}
                          </span>
                        </div>
                        <div className="p-2">
                          <button
                            onClick={() => handleCategorySelect(hoveredCategory)}
                            className="w-full px-4 py-3 text-left font-medium text-blue-600 hover:bg-white rounded-lg mb-1"
                          >
                            Показать все
                          </button>
                          {mainCategories
                            .find(c => c.id === hoveredCategory)
                            ?.subcategories.map((sub, i) => (
                              <button
                                key={i}
                                onClick={() => handleCategorySelect(hoveredCategory, sub)}
                                className={cn(
                                  "w-full px-4 py-3 text-left rounded-lg transition-colors",
                                  "hover:bg-white text-gray-700",
                                  selectedSubcategory === sub && "bg-white text-blue-600 font-medium"
                                )}
                              >
                                {sub}
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Поиск */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Поиск проектов..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>

            {/* === ФИЛЬТР ГОРОДОВ === */}
            <div className="relative" ref={cityRef}>
              <button
                onClick={() => { setShowCityDropdown(!showCityDropdown); setShowCategoryDropdown(false) }}
                className={cn(
                  "flex items-center gap-2 px-4 h-11 rounded-lg border transition-all w-full lg:w-auto",
                  "bg-white hover:bg-gray-50 min-w-[180px]",
                  showCityDropdown ? "border-blue-500 ring-2 ring-blue-100" : "border-gray-300"
                )}
              >
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="font-medium text-gray-900 truncate flex-1 text-left">{selectedCity}</span>
                <ChevronDown className={cn("h-4 w-4 text-gray-500 transition-transform", showCityDropdown && "rotate-180")} />
              </button>

              {showCityDropdown && (
                <div className="absolute top-full right-0 mt-2 z-50 bg-white rounded-xl shadow-2xl border overflow-hidden">
                  <div className="p-3 border-b bg-gray-50">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Найти город или регион..."
                        value={citySearch}
                        onChange={(e) => setCitySearch(e.target.value)}
                        className="pl-9 h-10 w-[300px]"
                        autoFocus
                      />
                      {citySearch && (
                        <button onClick={() => setCitySearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                          <X className="h-4 w-4 text-gray-400" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex max-h-[450px]">
                    <div className="w-[320px] border-r overflow-y-auto">
                      <button
                        onClick={() => handleCitySelect('Вся Россия', '')}
                        className={cn(
                          "w-full px-4 py-3.5 text-left flex items-center gap-3 hover:bg-gray-50 border-b",
                          selectedCity === 'Вся Россия' && "bg-blue-50"
                        )}
                      >
                        <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                          <MapPin className="h-4 w-4" />
                        </div>
                        <span className="font-semibold text-gray-900">Вся Россия</span>
                        {selectedCity === 'Вся Россия' && <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full" />}
                      </button>

                      {citySearch && filteredLocations.cities.length > 0 && (
                        <div className="border-b">
                          <div className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50 uppercase">Города</div>
                          {filteredLocations.cities.slice(0, 20).map((city) => (
                            <button
                              key={city.id}
                              onClick={() => handleCitySelect(city.name, city.regionName)}
                              className={cn(
                                "w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between",
                                selectedCity === city.name && "bg-blue-50"
                              )}
                            >
                              <div>
                                <div className="font-medium text-gray-900">{city.name}</div>
                                <div className="text-sm text-gray-500">{city.regionName}</div>
                              </div>
                              {selectedCity === city.name && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50 uppercase">
                        {citySearch ? 'Регионы' : 'Выберите регион'}
                      </div>
                      {(citySearch ? filteredLocations.regions : regions).map((region) => (
                        <button
                          key={region.id}
                          onClick={() => handleRegionSelect(region)}
                          onMouseEnter={() => region.hasCities && setHoveredRegion(region.id)}
                          className={cn(
                            "w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between",
                            hoveredRegion === region.id && "bg-blue-50",
                            selectedRegion === region.name && "bg-blue-50"
                          )}
                        >
                          <span className="font-medium text-gray-900">{region.name}</span>
                          {region.hasCities ? (
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          ) : selectedCity === region.name ? (
                            <div className="w-2 h-2 bg-blue-600 rounded-full" />
                          ) : null}
                        </button>
                      ))}
                    </div>

                    {hoveredRegion && citiesInRegion.length > 0 && !citySearch && (
                      <div className="w-[280px] overflow-y-auto bg-gray-50">
                        <div className="px-4 py-3 text-xs font-semibold text-gray-500 border-b bg-white uppercase">
                          Города в регионе
                        </div>
                        <div className="p-2">
                          {citiesInRegion.map((city) => (
                            <button
                              key={city.id}
                              onClick={() => handleCitySelect(city.name, getRegionById(city.regionId)?.name || '')}
                              className={cn(
                                "w-full px-4 py-2.5 text-left hover:bg-white rounded-lg transition-colors",
                                selectedCity === city.name && "bg-white text-blue-600 font-medium"
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

            <Button 
              onClick={fetchProjects} 
              disabled={loading}
              className="h-11 px-6 bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Поиск...' : 'Найти'}
            </Button>
          </div>
        </div>

        {/* Активные фильтры */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-blue-100 text-blue-800">
                {currentCategory?.icon}
                <span>{selectedSubcategory || currentCategory?.name}</span>
                <button onClick={() => { setSelectedCategory('all'); setSelectedSubcategory(null) }}><X className="h-3.5 w-3.5" /></button>
              </span>
            )}
            {selectedCity !== 'Вся Россия' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-green-100 text-green-800">
                <MapPin className="h-3.5 w-3.5" />
                <span>{selectedCity}</span>
                <button onClick={() => { setSelectedCity('Вся Россия'); setSelectedRegion('') }}><X className="h-3.5 w-3.5" /></button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-gray-100 text-gray-800">
                <Search className="h-3.5 w-3.5" />
                <span>«{searchQuery}»</span>
                <button onClick={() => setSearchQuery('')}><X className="h-3.5 w-3.5" /></button>
              </span>
            )}
            <button onClick={clearFilters} className="text-sm text-gray-500 hover:text-gray-700 ml-2">Сбросить все</button>
          </div>
        )}

        {/* Сообщение об ошибке */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Ошибка загрузки</span>
            </div>
            <p className="text-red-600 text-sm mt-1">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchProjects}
              className="mt-2"
            >
              Повторить попытку
            </Button>
          </div>
        )}

        {/* Список проектов */}
        {filteredProjects.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                onViewDetails={(id) => router.push(`/projects/${id}`)}
                onApply={(id) => router.push(`/dashboard/orders/${id}/bid`)}
              />
            ))}
          </div>
        ) : !loading ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {error ? 'Ошибка загрузки' : 'Проекты не найдены'}
            </h3>
            <p className="text-gray-600 mb-4">
              {error 
                ? 'Не удалось загрузить проекты. Проверьте подключение к интернету.' 
                : 'Попробуйте изменить параметры поиска'
              }
            </p>
            <Button variant="outline" onClick={clearFilters}>Сбросить фильтры</Button>
          </div>
        ) : null}
      </div>
    </div>
  )
}