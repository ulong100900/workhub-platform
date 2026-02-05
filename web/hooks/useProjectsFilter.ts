// hooks/useProjectsFilter.ts
import { useState, useCallback, useEffect } from 'react'
import { SelectedFilters } from '@/components/filters/RegionCityFilter'

export const useProjectsFilter = (initialProjects: any[] = []) => {
  const [filters, setFilters] = useState<SelectedFilters>({
    regions: [],
    cities: [],
    categories: [],
    urgent: false,
    remote: false
  })

  const [filteredProjects, setFilteredProjects] = useState<any[]>(initialProjects)
  const [isLoading, setIsLoading] = useState(false)

  // Функция применения фильтров
  const applyFilters = useCallback((projects: any[], currentFilters: SelectedFilters) => {
    if (projects.length === 0) return []

    let result = [...projects]

    // Фильтр по регионам
    if (currentFilters.regions.length > 0) {
      result = result.filter(project => 
        currentFilters.regions.includes(project.region) ||
        (project.remote && currentFilters.remote)
      )
    }

    // Фильтр по городам
    if (currentFilters.cities.length > 0) {
      result = result.filter(project => 
        currentFilters.cities.includes(project.cityId) ||
        (project.remote && currentFilters.remote)
      )
    }

    // Фильтр по категориям
    if (currentFilters.categories.length > 0) {
      result = result.filter(project => 
        currentFilters.categories.some(cat => 
          project.category === cat || 
          project.subcategories?.includes(cat)
        )
      )
    }

    // Фильтр по бюджету
    if (currentFilters.budgetMin !== undefined) {
      result = result.filter(project => 
        project.budget >= currentFilters.budgetMin!
      )
    }

    if (currentFilters.budgetMax !== undefined) {
      result = result.filter(project => 
        project.budget <= currentFilters.budgetMax!
      )
    }

    // Фильтр по срочности
    if (currentFilters.urgent) {
      result = result.filter(project => project.urgent)
    }

    // Фильтр по удалённой работе
    if (currentFilters.remote) {
      result = result.filter(project => project.remote)
    }

    return result
  }, [])

  // Обновление отфильтрованных проектов при изменении фильтров
  useEffect(() => {
    setIsLoading(true)
    
    // Имитация задержки для демонстрации
    const timeoutId = setTimeout(() => {
      const filtered = applyFilters(initialProjects, filters)
      setFilteredProjects(filtered)
      setIsLoading(false)
    }, 200)

    return () => clearTimeout(timeoutId)
  }, [filters, initialProjects, applyFilters])

  const handleFilterChange = useCallback((newFilters: SelectedFilters) => {
    setFilters(newFilters)
  }, [])

  const resetFilters = useCallback(() => {
    setFilters({
      regions: [],
      cities: [],
      categories: [],
      urgent: false,
      remote: false
    })
  }, [])

  return {
    filters,
    filteredProjects,
    isLoading,
    handleFilterChange,
    resetFilters,
    applyFilters: (projects: any[]) => applyFilters(projects, filters)
  }
}