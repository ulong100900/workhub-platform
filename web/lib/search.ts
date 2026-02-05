import { supabase } from './supabase'

export interface SearchFilters {
  // Основные фильтры
  category?: string[]
  city?: string
  minPrice?: number
  maxPrice?: number
  status?: string[]
  
  // Геолокация
  latitude?: number
  longitude?: number
  radius?: number // в километрах
  
  // Даты
  createdAfter?: Date
  createdBefore?: Date
  
  // Сортировка
  sortBy?: 'price_asc' | 'price_desc' | 'date_asc' | 'date_desc' | 'popularity'
  
  // Пагинация
  page?: number
  limit?: number
}

export interface SearchResult {
  orders: any[]
  total: number
  page: number
  pages: number
}

export class SearchService {
  
  // Основной метод поиска
  static async searchOrders(filters: SearchFilters): Promise<SearchResult> {
    let query = supabase
      .from('orders')
      .select(`
        *,
        customer:users!customer_id (
          id,
          fullName,
          rating,
          completedJobs,
          avatarUrl
        ),
        bids_count:bids(count)
      `, { count: 'exact' })
    
    // Применяем фильтры
    query = this.applyFilters(query, filters)
    
    // Применяем сортировку
    query = this.applySorting(query, filters.sortBy)
    
    // Применяем пагинацию
    const page = filters.page || 1
    const limit = filters.limit || 20
    const offset = (page - 1) * limit
    
    query = query.range(offset, offset + limit - 1)
    
    // Выполняем запрос
    const { data: orders, error, count } = await query
    
    if (error) {
      console.error('Search error:', error)
      throw new Error('Ошибка при поиске заявок')
    }
    
    // Фильтрация по геолокации (если указаны координаты)
    let filteredOrders = orders || []
    if (filters.latitude && filters.longitude && filters.radius) {
      filteredOrders = this.filterByLocation(
        filteredOrders,
        filters.latitude,
        filters.longitude,
        filters.radius
      )
    }
    
    return {
      orders: filteredOrders,
      total: count || 0,
      page,
      pages: Math.ceil((count || 0) / limit)
    }
  }
  
  // Применение фильтров к запросу
  private static applyFilters(query: any, filters: SearchFilters) {
    // Фильтр по категории
    if (filters.category && filters.category.length > 0) {
      query = query.in('category', filters.category)
    }
    
    // Фильтр по городу
    if (filters.city) {
      query = query.ilike('city', `%${filters.city}%`)
    }
    
    // Фильтр по цене
    if (filters.minPrice !== undefined) {
      query = query.gte('budget', filters.minPrice)
    }
    if (filters.maxPrice !== undefined) {
      query = query.lte('budget', filters.maxPrice)
    }
    
    // Фильтр по статусу
    if (filters.status && filters.status.length > 0) {
      query = query.in('status', filters.status)
    }
    
    // Фильтр по дате создания
    if (filters.createdAfter) {
      query = query.gte('created_at', filters.createdAfter.toISOString())
    }
    if (filters.createdBefore) {
      query = query.lte('created_at', filters.createdBefore.toISOString())
    }
    
    // Только активные заявки по умолчанию
    if (!filters.status) {
      query = query.eq('status', 'ACTIVE')
    }
    
    return query
  }
  
  // Применение сортировки
  private static applySorting(query: any, sortBy?: string) {
    switch (sortBy) {
      case 'price_asc':
        return query.order('budget', { ascending: true })
      case 'price_desc':
        return query.order('budget', { ascending: false })
      case 'date_asc':
        return query.order('created_at', { ascending: true })
      case 'date_desc':
        return query.order('created_at', { ascending: false })
      case 'popularity':
        return query.order('bids_count', { ascending: false })
      default:
        return query.order('created_at', { ascending: false })
    }
  }
  
  // Фильтрация по расстоянию (геолокация)
  private static filterByLocation(
    orders: any[],
    lat: number,
    lng: number,
    radius: number
  ): any[] {
    return orders.filter(order => {
      if (!order.location || !order.location.lat || !order.location.lng) {
        return true // Если нет координат, включаем в результат
      }
      
      const distance = this.calculateDistance(
        lat,
        lng,
        order.location.lat,
        order.location.lng
      )
      
      return distance <= radius
    })
  }
  
  // Расчет расстояния между двумя точками (формула Haversine)
  private static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371 // Радиус Земли в километрах
    const dLat = this.toRad(lat2 - lat1)
    const dLon = this.toRad(lon2 - lon1)
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }
  
  private static toRad(degrees: number): number {
    return degrees * (Math.PI / 180)
  }
  
  // Получение популярных категорий
  static async getPopularCategories(limit: number = 10) {
    const { data, error } = await supabase
      .from('orders')
      .select('category, count')
      .group('category')
      .order('count', { ascending: false })
      .limit(limit)
    
    if (error) {
      console.error('Error getting popular categories:', error)
      return []
    }
    
    return data
  }
  
  // Получение популярных городов
  static async getPopularCities(limit: number = 10) {
    const { data, error } = await supabase
      .from('orders')
      .select('city, count')
      .group('city')
      .order('count', { ascending: false })
      .limit(limit)
    
    if (error) {
      console.error('Error getting popular cities:', error)
      return []
    }
    
    return data
  }
  
  // Поиск исполнителей
  static async searchExecutors(filters: {
    city?: string
    categories?: string[]
    minRating?: number
    hasEquipment?: boolean
    page?: number
    limit?: number
  }) {
    let query = supabase
      .from('users')
      .select('*', { count: 'exact' })
      .eq('role', 'executor')
      .eq('isVerified', true)
    
    // Фильтры
    if (filters.city) {
      query = query.ilike('city', `%${filters.city}%`)
    }
    
    if (filters.minRating) {
      query = query.gte('rating', filters.minRating)
    }
    
    if (filters.categories && filters.categories.length > 0) {
      // Здесь нужна связь с таблицей специализаций
      // Пока заглушка
    }
    
    // Пагинация
    const page = filters.page || 1
    const limit = filters.limit || 20
    const offset = (page - 1) * limit
    
    query = query.range(offset, offset + limit - 1)
    
    const { data, error, count } = await query
    
    if (error) {
      console.error('Error searching executors:', error)
      throw new Error('Ошибка при поиске исполнителей')
    }
    
    return {
      executors: data || [],
      total: count || 0,
      page,
      pages: Math.ceil((count || 0) / limit)
    }
  }
  
  // Автодополнение поиска
  static async autocomplete(query: string, type: 'orders' | 'users' = 'orders') {
    if (query.length < 2) return []
    
    if (type === 'orders') {
      const { data, error } = await supabase
        .from('orders')
        .select('id, title, category, city')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(10)
      
      if (error) {
        console.error('Autocomplete error:', error)
        return []
      }
      
      return data || []
    } else {
      const { data, error } = await supabase
        .from('users')
        .select('id, fullName, companyName, city, role')
        .or(`fullName.ilike.%${query}%,companyName.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(10)
      
      if (error) {
        console.error('Autocomplete error:', error)
        return []
      }
      
      return data || []
    }
  }
}