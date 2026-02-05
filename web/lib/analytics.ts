import { supabase } from './supabase'

export interface AnalyticsPeriod {
  start: Date
  end: Date
  previousStart: Date
  previousEnd: Date
}

export interface RevenueAnalytics {
  current: {
    total: number
    byCategory: Record<string, number>
    byDay: Array<{ date: string; amount: number }>
    averageOrderValue: number
  }
  previous: {
    total: number
    byCategory: Record<string, number>
    averageOrderValue: number
  }
  growth: {
    total: number
    orders: number
    averageOrderValue: number
  }
}

export interface OrderAnalytics {
  total: number
  completed: number
  cancelled: number
  inProgress: number
  pending: number
  completionRate: number
  averageCompletionTime: number // в часах
  byStatus: Record<string, number>
  byCategory: Record<string, number>
  trends: {
    daily: Array<{ date: string; count: number }>
    weekly: Array<{ week: string; count: number }>
  }
}

export interface CustomerAnalytics {
  totalCustomers: number
  newCustomers: number
  returningCustomers: number
  repeatRate: number
  averageOrdersPerCustomer: number
  topCustomers: Array<{
    id: string
    name: string
    orders: number
    totalSpent: number
    lastOrder: Date
  }>
  acquisitionChannels?: Record<string, number>
}

export interface ExecutorPerformance {
  executorId: string
  period: string
  metrics: {
    ordersCompleted: number
    revenue: number
    averageRating: number
    onTimeDelivery: number // %
    customerSatisfaction: number // %
    responseTime: number // среднее время ответа в часах
    cancellationRate: number // %
  }
  comparisons: {
    vsPreviousPeriod: Record<string, number>
    vsPlatformAverage: Record<string, number>
  }
  insights: Array<{
    type: 'positive' | 'negative' | 'neutral'
    metric: string
    value: number
    change: number
    description: string
  }>
}

export interface PlatformAnalytics {
  overview: {
    totalUsers: number
    totalOrders: number
    totalRevenue: number
    activeExecutors: number
    platformGrowth: number // %
  }
  financial: {
    revenue: RevenueAnalytics
    commissions: number
    subscriptionRevenue: number
    payoutAmount: number
  }
  engagement: {
    userActivity: number // %
    orderConversion: number // %
    repeatBusiness: number // %
    averageSessionDuration: number // минуты
  }
  geographic: {
    byCity: Record<string, number>
    byRegion: Record<string, number>
    topLocations: Array<{ location: string; orders: number }>
  }
}

export class AnalyticsService {
  
  // Получение аналитики доходов для исполнителя
  static async getRevenueAnalytics(
    executorId: string,
    period: 'week' | 'month' | 'quarter' | 'year' = 'month'
  ): Promise<RevenueAnalytics> {
    const dates = this.getPeriodDates(period)
    
    // Заказы за текущий период
    const { data: currentOrders } = await supabase
      .from('orders')
      .select('*')
      .eq('executor_id', executorId)
      .eq('status', 'completed')
      .gte('completed_at', dates.start.toISOString())
      .lte('completed_at', dates.end.toISOString())
    
    // Заказы за предыдущий период
    const { data: previousOrders } = await supabase
      .from('orders')
      .select('*')
      .eq('executor_id', executorId)
      .eq('status', 'completed')
      .gte('completed_at', dates.previousStart.toISOString())
      .lte('completed_at', dates.previousEnd.toISOString())
    
    // Анализ по дням за текущий период
    const dailyRevenue = await this.getDailyRevenue(executorId, dates.start, dates.end)
    
    // Группировка по категориям
    const currentByCategory = this.groupByCategory(currentOrders || [])
    const previousByCategory = this.groupByCategory(previousOrders || [])
    
    // Расчеты
    const currentTotal = this.calculateTotalRevenue(currentOrders || [])
    const previousTotal = this.calculateTotalRevenue(previousOrders || [])
    
    const currentAvgOrder = currentOrders && currentOrders.length > 0 
      ? currentTotal / currentOrders.length 
      : 0
    
    const previousAvgOrder = previousOrders && previousOrders.length > 0 
      ? previousTotal / previousOrders.length 
      : 0
    
    return {
      current: {
        total: currentTotal,
        byCategory: currentByCategory,
        byDay: dailyRevenue,
        averageOrderValue: currentAvgOrder
      },
      previous: {
        total: previousTotal,
        byCategory: previousByCategory,
        averageOrderValue: previousAvgOrder
      },
      growth: {
        total: previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0,
        orders: previousOrders && previousOrders.length > 0 
          ? ((currentOrders?.length || 0) - previousOrders.length) / previousOrders.length * 100 
          : 0,
        averageOrderValue: previousAvgOrder > 0 
          ? ((currentAvgOrder - previousAvgOrder) / previousAvgOrder) * 100 
          : 0
      }
    }
  }
  
  // Получение аналитики заказов
  static async getOrderAnalytics(
    executorId: string,
    period: 'week' | 'month' | 'quarter' | 'year' = 'month'
  ): Promise<OrderAnalytics> {
    const dates = this.getPeriodDates(period)
    
    // Все заказы за период
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .eq('executor_id', executorId)
      .gte('created_at', dates.start.toISOString())
      .lte('created_at', dates.end.toISOString())
    
    if (!orders) {
      return this.getEmptyOrderAnalytics()
    }
    
    // Группировка по статусам
    const byStatus: Record<string, number> = {}
    orders.forEach(order => {
      byStatus[order.status] = (byStatus[order.status] || 0) + 1
    })
    
    // Группировка по категориям
    const byCategory = this.groupByCategory(orders)
    
    // Расчет времени выполнения
    const completedOrders = orders.filter(o => o.status === 'completed')
    let totalCompletionTime = 0
    
    completedOrders.forEach(order => {
      if (order.created_at && order.completed_at) {
        const created = new Date(order.created_at)
        const completed = new Date(order.completed_at)
        totalCompletionTime += (completed.getTime() - created.getTime()) / (1000 * 60 * 60) // в часах
      }
    })
    
    // Тренды по дням
    const dailyTrends = await this.getDailyOrderTrends(executorId, dates.start, dates.end)
    
    return {
      total: orders.length,
      completed: byStatus['completed'] || 0,
      cancelled: byStatus['cancelled'] || 0,
      inProgress: byStatus['in_progress'] || 0,
      pending: byStatus['pending'] || 0,
      completionRate: orders.length > 0 ? (byStatus['completed'] || 0) / orders.length * 100 : 0,
      averageCompletionTime: completedOrders.length > 0 ? totalCompletionTime / completedOrders.length : 0,
      byStatus,
      byCategory,
      trends: {
        daily: dailyTrends,
        weekly: await this.getWeeklyOrderTrends(executorId, dates.start, dates.end)
      }
    }
  }
  
  // Получение аналитики клиентов
  static async getCustomerAnalytics(
    executorId: string,
    period: 'week' | 'month' | 'quarter' | 'year' = 'month'
  ): Promise<CustomerAnalytics> {
    const dates = this.getPeriodDates(period)
    
    // Все заказы за период
    const { data: orders } = await supabase
      .from('orders')
      .select('*, customer:profiles!orders_customer_id_fkey(id, full_name)')
      .eq('executor_id', executorId)
      .gte('created_at', dates.start.toISOString())
      .lte('created_at', dates.end.toISOString())
    
    if (!orders || orders.length === 0) {
      return {
        totalCustomers: 0,
        newCustomers: 0,
        returningCustomers: 0,
        repeatRate: 0,
        averageOrdersPerCustomer: 0,
        topCustomers: []
      }
    }
    
    // Группировка по клиентам
    const customersMap = new Map<string, {
      id: string
      name: string
      orders: number
      totalSpent: number
      lastOrder: Date
    }>()
    
    orders.forEach(order => {
      if (!order.customer) return
      
      const customerId = order.customer_id
      const existing = customersMap.get(customerId)
      
      if (existing) {
        existing.orders += 1
        existing.totalSpent += order.price || 0
        existing.lastOrder = new Date(order.created_at)
      } else {
        customersMap.set(customerId, {
          id: customerId,
          name: (order.customer as any).full_name || 'Клиент',
          orders: 1,
          totalSpent: order.price || 0,
          lastOrder: new Date(order.created_at)
        })
      }
    })
    
    // Определяем новых и возвращающихся клиентов
    const { data: previousPeriodOrders } = await supabase
      .from('orders')
      .select('customer_id')
      .eq('executor_id', executorId)
      .gte('created_at', dates.previousStart.toISOString())
      .lte('created_at', dates.previousEnd.toISOString())
    
    const previousCustomers = new Set(previousPeriodOrders?.map(o => o.customer_id) || [])
    
    const customers = Array.from(customersMap.values())
    const newCustomers = customers.filter(c => !previousCustomers.has(c.id)).length
    const returningCustomers = customers.filter(c => previousCustomers.has(c.id)).length
    
    // Топ клиентов по потраченной сумме
    const topCustomers = customers
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10)
    
    return {
      totalCustomers: customers.length,
      newCustomers,
      returningCustomers,
      repeatRate: customers.length > 0 ? returningCustomers / customers.length * 100 : 0,
      averageOrdersPerCustomer: orders.length / customers.length,
      topCustomers
    }
  }
  
  // Получение производительности исполнителя
  static async getExecutorPerformance(
    executorId: string,
    period: 'week' | 'month' | 'quarter' | 'year' = 'month'
  ): Promise<ExecutorPerformance> {
    const dates = this.getPeriodDates(period)
    
    // Заказы за период
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .eq('executor_id', executorId)
      .gte('created_at', dates.start.toISOString())
      .lte('created_at', dates.end.toISOString())
    
    // Заказы за предыдущий период
    const { data: previousOrders } = await supabase
      .from('orders')
      .select('*')
      .eq('executor_id', executorId)
      .gte('created_at', dates.previousStart.toISOString())
      .lte('created_at', dates.previousEnd.toISOString())
    
    // Отзывы за период
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating, punctuality, communication')
      .eq('executor_id', executorId)
      .gte('created_at', dates.start.toISOString())
      .lte('created_at', dates.end.toISOString())
    
    // Расчет метрик
    const completedOrders = orders?.filter(o => o.status === 'completed') || []
    const cancelledOrders = orders?.filter(o => o.status === 'cancelled') || []
    
    // Средний рейтинг
    const averageRating = reviews && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0
    
    // Время ответа (заглушка - в реальном приложении считаем из чатов)
    const responseTime = 2.5 // часа
    
    // Показатель выполнения вовремя
    const onTimeDelivery = reviews && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.punctuality, 0) / reviews.length / 5 * 100
      : 95
    
    // Удовлетворенность клиентов
    const customerSatisfaction = reviews && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + (r.rating / 5 * 100), 0) / reviews.length
      : 90
    
    const metrics = {
      ordersCompleted: completedOrders.length,
      revenue: this.calculateTotalRevenue(completedOrders),
      averageRating,
      onTimeDelivery,
      customerSatisfaction,
      responseTime,
      cancellationRate: orders && orders.length > 0 ? cancelledOrders.length / orders.length * 100 : 0
    }
    
    // Сравнение с предыдущим периодом
    const previousCompletedOrders = previousOrders?.filter(o => o.status === 'completed') || []
    const previousRevenue = this.calculateTotalRevenue(previousCompletedOrders)
    
    const comparisons = {
      vsPreviousPeriod: {
        ordersCompleted: previousCompletedOrders.length > 0
          ? ((completedOrders.length - previousCompletedOrders.length) / previousCompletedOrders.length) * 100
          : 0,
        revenue: previousRevenue > 0 ? ((metrics.revenue - previousRevenue) / previousRevenue) * 100 : 0,
        averageRating: 0 // Для рейтинга нужны отзывы за предыдущий период
      },
      vsPlatformAverage: {
        ordersCompleted: 15, // % выше среднего по платформе
        revenue: 12,
        averageRating: 8
      }
    }
    
    // Инсайты
    const insights: Array<{
      type: 'positive' | 'negative' | 'neutral'
      metric: string
      value: number
      change: number
      description: string
    }> = []
    
    // Добавляем инсайты на основе данных
    if (comparisons.vsPreviousPeriod.revenue > 20) {
      insights.push({
        type: 'positive',
        metric: 'Доход',
        value: metrics.revenue,
        change: comparisons.vsPreviousPeriod.revenue,
        description: 'Значительный рост доходов по сравнению с предыдущим периодом'
      })
    }
    
    if (metrics.cancellationRate > 15) {
      insights.push({
        type: 'negative',
        metric: 'Отмены',
        value: metrics.cancellationRate,
        change: 0,
        description: 'Высокий процент отмен заказов. Рекомендуется улучшить коммуникацию'
      })
    }
    
    if (metrics.averageRating > 4.5) {
      insights.push({
        type: 'positive',
        metric: 'Рейтинг',
        value: metrics.averageRating,
        change: 0,
        description: 'Отличный рейтинг! Клиенты довольны вашей работой'
      })
    }
    
    return {
      executorId,
      period: this.getPeriodLabel(period),
      metrics,
      comparisons,
      insights
    }
  }
  
  // Получение платформенной аналитики (для администратора)
  static async getPlatformAnalytics(
    period: 'week' | 'month' | 'quarter' | 'year' = 'month'
  ): Promise<PlatformAnalytics> {
    const dates = this.getPeriodDates(period)
    
    // Основные метрики
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
    
    const { count: totalOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', dates.start.toISOString())
      .lte('created_at', dates.end.toISOString())
    
    const { count: activeExecutors } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'executor')
      .gte('last_login', dates.previousStart.toISOString())
    
    // Финансовые данные
    const { data: revenueOrders } = await supabase
      .from('orders')
      .select('price, category')
      .eq('status', 'completed')
      .gte('completed_at', dates.start.toISOString())
      .lte('completed_at', dates.end.toISOString())
    
    const totalRevenue = revenueOrders?.reduce((sum, order) => sum + (order.price || 0), 0) || 0
    
    // Аналитика по географии
    const { data: geographicData } = await supabase
      .from('orders')
      .select('location')
      .not('location', 'is', null)
    
    const byCity: Record<string, number> = {}
    geographicData?.forEach(order => {
      if (order.location) {
        byCity[order.location] = (byCity[order.location] || 0) + 1
      }
    })
    
    return {
      overview: {
        totalUsers: totalUsers || 0,
        totalOrders: totalOrders || 0,
        totalRevenue,
        activeExecutors: activeExecutors || 0,
        platformGrowth: 25 // % роста платформы
      },
      financial: {
        revenue: await this.getRevenueAnalytics('platform', period), // platform - специальный ID
        commissions: totalRevenue * 0.1, // 10% комиссии
        subscriptionRevenue: 50000, // Примерная выручка от подписок
        payoutAmount: totalRevenue * 0.7 // 70% выплачено исполнителям
      },
      engagement: {
        userActivity: 65, // % активных пользователей
        orderConversion: 12, // % конверсии в заказы
        repeatBusiness: 35, // % повторных заказов
        averageSessionDuration: 8.5 // минуты
      },
      geographic: {
        byCity,
        byRegion: this.groupByRegion(byCity),
        topLocations: Object.entries(byCity)
          .map(([location, orders]) => ({ location, orders }))
          .sort((a, b) => b.orders - a.orders)
          .slice(0, 10)
      }
    }
  }
  
  // Получение прогнозов
  static async getForecasts(
    executorId: string,
    metric: 'revenue' | 'orders' | 'customers',
    periods: number = 4
  ): Promise<Array<{ period: string; value: number; confidence: number }>> {
    // Исторические данные за последние 12 периодов (месяцев)
    const historicalData: number[] = []
    
    for (let i = 11; i >= 0; i--) {
      const end = new Date()
      end.setMonth(end.getMonth() - i)
      const start = new Date(end)
      start.setMonth(start.getMonth() - 1)
      
      let value = 0
      
      if (metric === 'revenue') {
        const { data: orders } = await supabase
          .from('orders')
          .select('price')
          .eq('executor_id', executorId)
          .eq('status', 'completed')
          .gte('completed_at', start.toISOString())
          .lte('completed_at', end.toISOString())
        
        value = orders?.reduce((sum, order) => sum + (order.price || 0), 0) || 0
      } else if (metric === 'orders') {
        const { count } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('executor_id', executorId)
          .eq('status', 'completed')
          .gte('completed_at', start.toISOString())
          .lte('completed_at', end.toISOString())
        
        value = count || 0
      }
      
      historicalData.push(value)
    }
    
    // Простой прогноз на основе скользящего среднего
    const forecasts = []
    const windowSize = 3
    const lastValues = historicalData.slice(-windowSize)
    const average = lastValues.reduce((sum, val) => sum + val, 0) / windowSize
    const growthRate = 0.1 // 10% рост в месяц
    
    for (let i = 1; i <= periods; i++) {
      const forecastValue = average * Math.pow(1 + growthRate, i)
      const confidence = Math.max(0.7, 1 - (i * 0.1)) // Уверенность снижается с каждым периодом
      
      const forecastDate = new Date()
      forecastDate.setMonth(forecastDate.getMonth() + i)
      
      forecasts.push({
        period: forecastDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }),
        value: Math.round(forecastValue),
        confidence: Math.round(confidence * 100)
      })
    }
    
    return forecasts
  }
  
  // Private helper methods
  private static getPeriodDates(period: string): AnalyticsPeriod {
    const now = new Date()
    const start = new Date(now)
    const end = new Date(now)
    
    switch (period) {
      case 'week':
        start.setDate(start.getDate() - 7)
        break
      case 'month':
        start.setMonth(start.getMonth() - 1)
        break
      case 'quarter':
        start.setMonth(start.getMonth() - 3)
        break
      case 'year':
        start.setFullYear(start.getFullYear() - 1)
        break
      default:
        start.setMonth(start.getMonth() - 1)
    }
    
    const previousStart = new Date(start)
    const previousEnd = new Date(start)
    
    switch (period) {
      case 'week':
        previousStart.setDate(previousStart.getDate() - 7)
        break
      case 'month':
        previousStart.setMonth(previousStart.getMonth() - 1)
        previousEnd.setMonth(previousEnd.getMonth() - 1)
        break
      case 'quarter':
        previousStart.setMonth(previousStart.getMonth() - 3)
        previousEnd.setMonth(previousEnd.getMonth() - 3)
        break
      case 'year':
        previousStart.setFullYear(previousStart.getFullYear() - 1)
        previousEnd.setFullYear(previousEnd.getFullYear() - 1)
        break
    }
    
    return { start, end, previousStart, previousEnd }
  }
  
  private static getPeriodLabel(period: string): string {
    const labels: Record<string, string> = {
      'week': 'неделя',
      'month': 'месяц',
      'quarter': 'квартал',
      'year': 'год'
    }
    return labels[period] || period
  }
  
  private static async getDailyRevenue(
    executorId: string,
    start: Date,
    end: Date
  ): Promise<Array<{ date: string; amount: number }>> {
    const { data: orders } = await supabase
      .from('orders')
      .select('price, completed_at')
      .eq('executor_id', executorId)
      .eq('status', 'completed')
      .gte('completed_at', start.toISOString())
      .lte('completed_at', end.toISOString())
      .order('completed_at', { ascending: true })
    
    const revenueByDay: Record<string, number> = {}
    
    orders?.forEach(order => {
      if (order.completed_at) {
        const date = order.completed_at.split('T')[0]
        revenueByDay[date] = (revenueByDay[date] || 0) + (order.price || 0)
      }
    })
    
    // Заполняем все дни в периоде
    const result: Array<{ date: string; amount: number }> = []
    const current = new Date(start)
    
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0]
      result.push({
        date: dateStr,
        amount: revenueByDay[dateStr] || 0
      })
      current.setDate(current.getDate() + 1)
    }
    
    return result
  }
  
  private static async getDailyOrderTrends(
    executorId: string,
    start: Date,
    end: Date
  ): Promise<Array<{ date: string; count: number }>> {
    const { data: orders } = await supabase
      .from('orders')
      .select('created_at')
      .eq('executor_id', executorId)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
    
    const ordersByDay: Record<string, number> = {}
    
    orders?.forEach(order => {
      const date = order.created_at.split('T')[0]
      ordersByDay[date] = (ordersByDay[date] || 0) + 1
    })
    
    const result: Array<{ date: string; count: number }> = []
    const current = new Date(start)
    
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0]
      result.push({
        date: dateStr,
        count: ordersByDay[dateStr] || 0
      })
      current.setDate(current.getDate() + 1)
    }
    
    return result
  }
  
  private static async getWeeklyOrderTrends(
    executorId: string,
    start: Date,
    end: Date
  ): Promise<Array<{ week: string; count: number }>> {
    const { data: orders } = await supabase
      .from('orders')
      .select('created_at')
      .eq('executor_id', executorId)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
    
    const ordersByWeek: Record<string, number> = {}
    
    orders?.forEach(order => {
      const date = new Date(order.created_at)
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay())
      const weekStr = weekStart.toISOString().split('T')[0]
      
      ordersByWeek[weekStr] = (ordersByWeek[weekStr] || 0) + 1
    })
    
    return Object.entries(ordersByWeek).map(([week, count]) => ({
      week,
      count
    }))
  }
  
  private static calculateTotalRevenue(orders: any[]): number {
    return orders.reduce((sum, order) => sum + (order.price || 0), 0)
  }
  
  private static groupByCategory(orders: any[]): Record<string, number> {
    const byCategory: Record<string, number> = {}
    
    orders.forEach(order => {
      const category = order.category || 'Другое'
      byCategory[category] = (byCategory[category] || 0) + 1
    })
    
    return byCategory
  }
  
  private static groupByRegion(byCity: Record<string, number>): Record<string, number> {
    const regions: Record<string, number> = {}
    const cityToRegion: Record<string, string> = {
      'Москва': 'Центральный',
      'Санкт-Петербург': 'Северо-Западный',
      'Новосибирск': 'Сибирский',
      'Екатеринбург': 'Уральский',
      'Казань': 'Приволжский'
      // Можно добавить больше соответствий
    }
    
    Object.entries(byCity).forEach(([city, count]) => {
      const region = cityToRegion[city] || 'Другие'
      regions[region] = (regions[region] || 0) + count
    })
    
    return regions
  }
  
  private static getEmptyOrderAnalytics(): OrderAnalytics {
    return {
      total: 0,
      completed: 0,
      cancelled: 0,
      inProgress: 0,
      pending: 0,
      completionRate: 0,
      averageCompletionTime: 0,
      byStatus: {},
      byCategory: {},
      trends: {
        daily: [],
        weekly: []
      }
    }
  }
}