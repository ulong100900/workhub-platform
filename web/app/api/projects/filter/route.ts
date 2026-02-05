// app/api/projects/filter/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { russianCities } from '@/data/russianCities' // Импортируем из data

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const {
      regions = [],
      cities = [],
      categories = [],
      budgetMin,
      budgetMax,
      urgent = false,
      remote = false,
      search = '',
      page = 1,
      limit = 12
    } = body

    // Строим запрос к Supabase
    let query = supabase
      .from('projects')
      .select('*', { count: 'exact' })

    // Фильтрация по регионам
    if (regions.length > 0) {
      // Получаем все города в этих регионах
      const citiesInRegions = russianCities
        .filter(city => regions.includes(city.region))
        .map(city => city.name)
      
      if (citiesInRegions.length > 0) {
        query = query.in('city', citiesInRegions)
      }
    }

    // Фильтрация по городам
    if (cities.length > 0) {
      const cityNames = russianCities
        .filter(city => cities.includes(city.id))
        .map(city => city.name)
      
      if (cityNames.length > 0) {
        query = query.in('city', cityNames)
      }
    }

    // Фильтрация по категориям
    if (categories.length > 0) {
      query = query.in('category', categories)
    }

    // Фильтрация по бюджету
    if (budgetMin !== undefined) {
      query = query.gte('budget', budgetMin)
    }

    if (budgetMax !== undefined) {
      query = query.lte('budget', budgetMax)
    }

    // Фильтрация по срочности
    if (urgent) {
      query = query.eq('is_urgent', true)
    }

    // Фильтрация по удалённой работе
    if (remote) {
      query = query.eq('is_remote', true)
    }

    // Поиск по тексту
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Пагинация
    const startIndex = (page - 1) * limit
    query = query.range(startIndex, startIndex + limit - 1)

    // Выполняем запрос
    const { data: projects, error, count } = await query

    if (error) throw error

    // Получаем статистику
    const { data: statsData, error: statsError } = await supabase
      .from('projects')
      .select('budget, is_urgent, is_remote, category, city, region')
    
    if (!statsError && statsData) {
      // Фильтруем статистику
      let filteredStats = statsData
      
      if (regions.length > 0) {
        const citiesInRegions = russianCities
          .filter(city => regions.includes(city.region))
          .map(city => city.name)
        
        filteredStats = filteredStats.filter(project => 
          project.city && citiesInRegions.includes(project.city)
        )
      }
      
      if (cities.length > 0) {
        const cityNames = russianCities
          .filter(city => cities.includes(city.id))
          .map(city => city.name)
        
        filteredStats = filteredStats.filter(project => 
          project.city && cityNames.includes(project.city)
        )
      }
      
      if (categories.length > 0) {
        filteredStats = filteredStats.filter(project => 
          project.category && categories.includes(project.category)
        )
      }
      
      if (budgetMin !== undefined) {
        filteredStats = filteredStats.filter(project => 
          project.budget && project.budget >= budgetMin
        )
      }
      
      if (budgetMax !== undefined) {
        filteredStats = filteredStats.filter(project => 
          project.budget && project.budget <= budgetMax
        )
      }
      
      if (urgent) {
        filteredStats = filteredStats.filter(project => project.is_urgent)
      }
      
      if (remote) {
        filteredStats = filteredStats.filter(project => project.is_remote)
      }

      const stats = {
        total: count || 0,
        totalBudget: filteredStats.reduce((sum, p) => sum + (p.budget || 0), 0),
        avgBudget: filteredStats.length > 0 
          ? Math.round(filteredStats.reduce((sum, p) => sum + (p.budget || 0), 0) / filteredStats.length)
          : 0,
        regions: [...new Set(filteredStats.map(p => p.region))].filter(Boolean),
        categories: [...new Set(filteredStats.map(p => p.category))].filter(Boolean),
        urgentCount: filteredStats.filter(p => p.is_urgent).length,
        remoteCount: filteredStats.filter(p => p.is_remote).length
      }

      return NextResponse.json({
        success: true,
        data: {
          projects: projects || [],
          pagination: {
            page,
            limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit),
            hasNext: startIndex + limit < (count || 0),
            hasPrev: page > 1
          },
          filters: {
            regions,
            cities,
            categories,
            budgetMin,
            budgetMax,
            urgent,
            remote
          },
          stats
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        projects: projects || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
          hasNext: startIndex + limit < (count || 0),
          hasPrev: page > 1
        },
        filters: {
          regions,
          cities,
          categories,
          budgetMin,
          budgetMax,
          urgent,
          remote
        },
        stats: {
          total: count || 0,
          totalBudget: 0,
          avgBudget: 0,
          regions: [],
          categories: [],
          urgentCount: 0,
          remoteCount: 0
        }
      }
    })
  } catch (error) {
    console.error('Filter error:', error)
    return NextResponse.json(
      { success: false, error: 'Ошибка фильтрации' },
      { status: 500 }
    )
  }
}

// GET для получения доступных фильтров
export async function GET() {
  try {
    // Получаем все уникальные регионы из городов
    const regions = [...new Set(russianCities.map(city => city.region))]
    
    // Получаем статистику по категориям из базы
    const supabase = createClient()
    const { data: categoryStatsData } = await supabase
      .from('projects')
      .select('category')
    
    const categoryStats = (categoryStatsData || []).reduce((acc, project) => {
      if (project.category) {
        acc[project.category] = (acc[project.category] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      success: true,
      data: {
        availableRegions: regions.sort(),
        availableCities: russianCities.map(city => ({
          id: city.id,
          name: city.name,
          region: city.region,
          population: city.population
        })),
        categoryStats,
        totalProjects: categoryStatsData?.length || 0
      }
    })
  } catch (error) {
    console.error('Get filters error:', error)
    return NextResponse.json(
      { success: false, error: 'Ошибка получения фильтров' },
      { status: 500 }
    )
  }
}