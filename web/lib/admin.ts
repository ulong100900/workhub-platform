import { supabase } from './supabase'

export interface PlatformStats {
  users: {
    total: number
    executors: number
    customers: number
    newToday: number
    active: number
  }
  orders: {
    total: number
    pending: number
    inProgress: number
    completed: number
    cancelled: number
    revenue: number
  }
  finance: {
    totalRevenue: number
    platformFee: number
    withdrawals: number
    averageOrderValue: number
  }
  reviews: {
    total: number
    averageRating: number
    withPhotos: number
    responseRate: number
  }
}

export interface User {
  id: string
  email: string
  fullName: string
  avatarUrl?: string
  role: 'executor' | 'customer' | 'admin'
  status: 'active' | 'blocked' | 'pending'
  createdAt: Date
  lastLogin?: Date
  phone?: string
  location?: string
  ordersCount: number
  totalSpent: number
}

export interface Executor extends User {
  specialization?: string
  rating: number
  totalReviews: number
  completedOrders: number
  earnings: number
  verificationStatus: 'not_verified' | 'pending' | 'verified' | 'rejected'
  documents?: Array<{
    type: string
    url: string
    status: string
  }>
}

export interface Order {
  id: string
  customerId: string
  executorId?: string
  title: string
  description: string
  category: string
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled'
  price: number
  currency: string
  location: string
  scheduledDate?: Date
  deadline?: Date
  createdAt: Date
  updatedAt: Date
  customer?: {
    fullName: string
    email: string
    phone?: string
  }
  executor?: {
    fullName: string
    specialization?: string
    rating?: number
  }
}

export interface Withdrawal {
  id: string
  executorId: string
  amount: number
  currency: string
  status: 'pending' | 'processing' | 'completed' | 'rejected'
  paymentMethod: string
  accountDetails: Record<string, any>
  fee: number
  netAmount: number
  createdAt: Date
  processedAt?: Date
  executor?: {
    fullName: string
    email: string
  }
}

export interface Report {
  id: string
  reporterId: string
  reportedUserId?: string
  reportedOrderId?: string
  reportedReviewId?: string
  type: 'user' | 'order' | 'review' | 'content'
  reason: string
  description: string
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed'
  priority: 'low' | 'medium' | 'high' | 'critical'
  createdAt: Date
  updatedAt: Date
  reporter?: {
    fullName: string
    email: string
  }
  reportedUser?: {
    fullName: string
    email: string
  }
}

export interface AdminLog {
  id: string
  adminId: string
  action: string
  entityType: string
  entityId?: string
  changes?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  createdAt: Date
  admin?: {
    fullName: string
    email: string
  }
}

export class AdminService {
  
  // Проверка прав администратора
  static async checkAdminAccess(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()
    
    if (error || !data) {
      return false
    }
    
    return data.role === 'admin'
  }
  
  // Получение статистики платформы
  static async getPlatformStats(): Promise<PlatformStats> {
    // Получаем статистику пользователей
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
    
    const { count: executors } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'executor')
    
    const { count: customers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'customer')
    
    // Новые пользователи за сегодня
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const { count: newToday } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString())
    
    // Активные пользователи (за последние 30 дней)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { count: activeUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('last_login', thirtyDaysAgo.toISOString())
    
    // Статистика заказов
    const { count: totalOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
    
    const { count: pendingOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
    
    const { count: inProgressOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'in_progress')
    
    const { count: completedOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
    
    const { count: cancelledOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'cancelled')
    
    // Общая выручка
    const { data: revenueData } = await supabase
      .from('orders')
      .select('price')
      .eq('status', 'completed')
    
    const totalRevenue = revenueData?.reduce((sum, order) => sum + order.price, 0) || 0
    
    // Финансовая статистика
    const platformFee = totalRevenue * 0.15 // 15% комиссия
    
    const { data: withdrawalsData } = await supabase
      .from('withdrawal_requests')
      .select('amount')
      .eq('status', 'completed')
    
    const totalWithdrawals = withdrawalsData?.reduce((sum, w) => sum + w.amount, 0) || 0
    
    const averageOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0
    
    // Статистика отзывов
    const { count: totalReviews } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
    
    const { data: reviewsData } = await supabase
      .from('reviews')
      .select('rating')
    
    const averageRating = reviewsData && reviewsData.length > 0
      ? reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length
      : 0
    
    const { count: reviewsWithPhotos } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .not('photos', 'is', null)
    
    const { data: allReviews } = await supabase
      .from('reviews')
      .select('executor_reply')
    
    const totalReviewsCount = allReviews?.length || 0
    const repliedReviews = allReviews?.filter(r => r.executor_reply)?.length || 0
    const responseRate = totalReviewsCount > 0 ? (repliedReviews / totalReviewsCount) * 100 : 0
    
    return {
      users: {
        total: totalUsers || 0,
        executors: executors || 0,
        customers: customers || 0,
        newToday: newToday || 0,
        active: activeUsers || 0
      },
      orders: {
        total: totalOrders || 0,
        pending: pendingOrders || 0,
        inProgress: inProgressOrders || 0,
        completed: completedOrders || 0,
        cancelled: cancelledOrders || 0,
        revenue: totalRevenue
      },
      finance: {
        totalRevenue,
        platformFee,
        withdrawals: totalWithdrawals,
        averageOrderValue
      },
      reviews: {
        total: totalReviews || 0,
        averageRating,
        withPhotos: reviewsWithPhotos || 0,
        responseRate
      }
    }
  }
  
  // Получение списка пользователей
  static async getUsers(
    filters: {
      role?: 'executor' | 'customer' | 'admin'
      status?: 'active' | 'blocked' | 'pending'
      search?: string
      minOrders?: number
      minSpent?: number
    } = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{ users: User[]; total: number }> {
    const from = (page - 1) * limit
    const to = from + limit - 1
    
    let query = supabase
      .from('profiles')
      .select(`
        *,
        orders_customer:orders!orders_customer_id_fkey (id),
        orders_executor:orders!orders_executor_id_fkey (id, price)
      `, { count: 'exact' })
    
    if (filters.role) {
      query = query.eq('role', filters.role)
    }
    
    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    
    if (filters.search) {
      query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
    }
    
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)
    
    if (error) {
      console.error('Error getting users:', error)
      throw new Error('Ошибка при получении пользователей')
    }
    
    const users: User[] = (data || []).map(item => {
      const ordersCount = item.orders_customer?.length || 0
      
      // Считаем общую сумму потраченную пользователем
      const totalSpent = item.orders_customer?.reduce((sum: number, order: any) => {
        return sum + (order.price || 0)
      }, 0) || 0
      
      return {
        id: item.id,
        email: item.email,
        fullName: item.full_name,
        avatarUrl: item.avatar_url,
        role: item.role,
        status: item.status,
        createdAt: new Date(item.created_at),
        lastLogin: item.last_login ? new Date(item.last_login) : undefined,
        phone: item.phone,
        location: item.location,
        ordersCount,
        totalSpent
      }
    })
    
    // Фильтрация по минимальному количеству заказов и потраченной сумме
    let filteredUsers = users
    
    if (filters.minOrders !== undefined) {
      filteredUsers = filteredUsers.filter(user => user.ordersCount >= filters.minOrders!)
    }
    
    if (filters.minSpent !== undefined) {
      filteredUsers = filteredUsers.filter(user => user.totalSpent >= filters.minSpent!)
    }
    
    return {
      users: filteredUsers,
      total: count || 0
    }
  }
  
  // Получение списка исполнителей
  static async getExecutors(
    filters: {
      verificationStatus?: 'not_verified' | 'pending' | 'verified' | 'rejected'
      minRating?: number
      minCompletedOrders?: number
      search?: string
    } = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{ executors: Executor[]; total: number }> {
    const from = (page - 1) * limit
    const to = from + limit - 1
    
    let query = supabase
      .from('profiles')
      .select(`
        *,
        executor_ratings!executor_ratings_executor_id_fkey (
          average_rating,
          total_reviews
        ),
        orders:orders!orders_executor_id_fkey (
          id,
          status,
          price
        )
      `, { count: 'exact' })
      .eq('role', 'executor')
    
    if (filters.verificationStatus) {
      query = query.eq('verification_status', filters.verificationStatus)
    }
    
    if (filters.search) {
      query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,specialization.ilike.%${filters.search}%`)
    }
    
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)
    
    if (error) {
      console.error('Error getting executors:', error)
      throw new Error('Ошибка при получении исполнителей')
    }
    
    const executors: Executor[] = (data || []).map(item => {
      const completedOrders = item.orders?.filter((order: any) => order.status === 'completed').length || 0
      const earnings = item.orders
        ?.filter((order: any) => order.status === 'completed')
        .reduce((sum: number, order: any) => sum + (order.price || 0), 0) || 0
      
      return {
        id: item.id,
        email: item.email,
        fullName: item.full_name,
        avatarUrl: item.avatar_url,
        role: item.role,
        status: item.status,
        createdAt: new Date(item.created_at),
        lastLogin: item.last_login ? new Date(item.last_login) : undefined,
        phone: item.phone,
        location: item.location,
        ordersCount: item.orders?.length || 0,
        totalSpent: 0,
        specialization: item.specialization,
        rating: item.executor_ratings?.[0]?.average_rating || 0,
        totalReviews: item.executor_ratings?.[0]?.total_reviews || 0,
        completedOrders,
        earnings,
        verificationStatus: item.verification_status || 'not_verified',
        documents: item.documents || []
      }
    })
    
    // Фильтрация по рейтингу и количеству завершенных заказов
    let filteredExecutors = executors
    
    if (filters.minRating !== undefined) {
      filteredExecutors = filteredExecutors.filter(executor => executor.rating >= filters.minRating!)
    }
    
    if (filters.minCompletedOrders !== undefined) {
      filteredExecutors = filteredExecutors.filter(executor => executor.completedOrders >= filters.minCompletedOrders!)
    }
    
    return {
      executors: filteredExecutors,
      total: count || 0
    }
  }
  
  // Получение списка заказов
  static async getOrders(
    filters: {
      status?: string
      minPrice?: number
      maxPrice?: number
      dateFrom?: Date
      dateTo?: Date
      search?: string
    } = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{ orders: Order[]; total: number }> {
    const from = (page - 1) * limit
    const to = from + limit - 1
    
    let query = supabase
      .from('orders')
      .select(`
        *,
        customer:profiles!orders_customer_id_fkey (
          full_name,
          email,
          phone
        ),
        executor:profiles!orders_executor_id_fkey (
          full_name,
          specialization,
          executor_ratings!executor_ratings_executor_id_fkey (
            average_rating
          )
        )
      `, { count: 'exact' })
    
    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    
    if (filters.minPrice !== undefined) {
      query = query.gte('price', filters.minPrice)
    }
    
    if (filters.maxPrice !== undefined) {
      query = query.lte('price', filters.maxPrice)
    }
    
    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom.toISOString())
    }
    
    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo.toISOString())
    }
    
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }
    
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)
    
    if (error) {
      console.error('Error getting orders:', error)
      throw new Error('Ошибка при получении заказов')
    }
    
    const orders: Order[] = (data || []).map(item => ({
      id: item.id,
      customerId: item.customer_id,
      executorId: item.executor_id,
      title: item.title,
      description: item.description,
      category: item.category,
      status: item.status,
      price: item.price,
      currency: item.currency,
      location: item.location,
      scheduledDate: item.scheduled_date ? new Date(item.scheduled_date) : undefined,
      deadline: item.deadline ? new Date(item.deadline) : undefined,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
      customer: item.customer ? {
        fullName: item.customer.full_name,
        email: item.customer.email,
        phone: item.customer.phone
      } : undefined,
      executor: item.executor ? {
        fullName: item.executor.full_name,
        specialization: item.executor.specialization,
        rating: item.executor.executor_ratings?.[0]?.average_rating
      } : undefined
    }))
    
    return {
      orders,
      total: count || 0
    }
  }
  
  // Получение списка заявок на вывод
  static async getWithdrawals(
    filters: {
      status?: string
      minAmount?: number
      maxAmount?: number
      dateFrom?: Date
      dateTo?: Date
    } = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{ withdrawals: Withdrawal[]; total: number }> {
    const from = (page - 1) * limit
    const to = from + limit - 1
    
    let query = supabase
      .from('withdrawal_requests')
      .select(`
        *,
        executor:profiles!withdrawal_requests_executor_id_fkey (
          full_name,
          email
        )
      `, { count: 'exact' })
    
    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    
    if (filters.minAmount !== undefined) {
      query = query.gte('amount', filters.minAmount)
    }
    
    if (filters.maxAmount !== undefined) {
      query = query.lte('amount', filters.maxAmount)
    }
    
    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom.toISOString())
    }
    
    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo.toISOString())
    }
    
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)
    
    if (error) {
      console.error('Error getting withdrawals:', error)
      throw new Error('Ошибка при получении заявок на вывод')
    }
    
    const withdrawals: Withdrawal[] = (data || []).map(item => ({
      id: item.id,
      executorId: item.executor_id,
      amount: item.amount,
      currency: item.currency,
      status: item.status,
      paymentMethod: item.payment_method,
      accountDetails: item.account_details,
      fee: item.fee,
      netAmount: item.net_amount,
      createdAt: new Date(item.created_at),
      processedAt: item.processed_at ? new Date(item.processed_at) : undefined,
      executor: item.executor ? {
        fullName: item.executor.full_name,
        email: item.executor.email
      } : undefined
    }))
    
    return {
      withdrawals,
      total: count || 0
    }
  }
  
  // Получение списка жалоб
  static async getReports(
    filters: {
      status?: string
      type?: string
      priority?: string
      dateFrom?: Date
      dateTo?: Date
    } = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{ reports: Report[]; total: number }> {
    const from = (page - 1) * limit
    const to = from + limit - 1
    
    let query = supabase
      .from('reports')
      .select(`
        *,
        reporter:profiles!reports_reporter_id_fkey (
          full_name,
          email
        ),
        reported_user:profiles!reports_reported_user_id_fkey (
          full_name,
          email
        )
      `, { count: 'exact' })
    
    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    
    if (filters.type) {
      query = query.eq('type', filters.type)
    }
    
    if (filters.priority) {
      query = query.eq('priority', filters.priority)
    }
    
    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom.toISOString())
    }
    
    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo.toISOString())
    }
    
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)
    
    if (error) {
      console.error('Error getting reports:', error)
      throw new Error('Ошибка при получении жалоб')
    }
    
    const reports: Report[] = (data || []).map(item => ({
      id: item.id,
      reporterId: item.reporter_id,
      reportedUserId: item.reported_user_id,
      reportedOrderId: item.reported_order_id,
      reportedReviewId: item.reported_review_id,
      type: item.type,
      reason: item.reason,
      description: item.description,
      status: item.status,
      priority: item.priority,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
      reporter: item.reporter ? {
        fullName: item.reporter.full_name,
        email: item.reporter.email
      } : undefined,
      reportedUser: item.reported_user ? {
        fullName: item.reported_user.full_name,
        email: item.reported_user.email
      } : undefined
    }))
    
    return {
      reports,
      total: count || 0
    }
  }
  
  // Изменение статуса пользователя
  static async updateUserStatus(
    userId: string,
    status: 'active' | 'blocked' | 'pending',
    reason?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
    
    if (error) {
      console.error('Error updating user status:', error)
      throw new Error('Ошибка при изменении статуса пользователя')
    }
    
    // Логируем действие
    await this.logAdminAction(
      'admin-id', // В реальном приложении берем из контекста
      'update_user_status',
      'user',
      userId,
      { status, reason }
    )
  }
  
  // Изменение статуса заявки на вывод
  static async updateWithdrawalStatus(
    withdrawalId: string,
    status: 'processing' | 'completed' | 'rejected',
    rejectionReason?: string
  ): Promise<void> {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }
    
    if (status === 'completed') {
      updateData.processed_at = new Date().toISOString()
    }
    
    if (status === 'rejected' && rejectionReason) {
      updateData.rejection_reason = rejectionReason
    }
    
    const { error } = await supabase
      .from('withdrawal_requests')
      .update(updateData)
      .eq('id', withdrawalId)
    
    if (error) {
      console.error('Error updating withdrawal status:', error)
      throw new Error('Ошибка при изменении статуса вывода')
    }
    
    // Логируем действие
    await this.logAdminAction(
      'admin-id',
      'update_withdrawal_status',
      'withdrawal',
      withdrawalId,
      { status, rejectionReason }
    )
  }
  
  // Изменение статуса жалобы
  static async updateReportStatus(
    reportId: string,
    status: 'investigating' | 'resolved' | 'dismissed'
  ): Promise<void> {
    const { error } = await supabase
      .from('reports')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId)
    
    if (error) {
      console.error('Error updating report status:', error)
      throw new Error('Ошибка при изменении статуса жалобы')
    }
    
    // Логируем действие
    await this.logAdminAction(
      'admin-id',
      'update_report_status',
      'report',
      reportId,
      { status }
    )
  }
  
  // Изменение статуса верификации исполнителя
  static async updateExecutorVerification(
    executorId: string,
    status: 'pending' | 'verified' | 'rejected',
    notes?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        verification_status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', executorId)
    
    if (error) {
      console.error('Error updating executor verification:', error)
      throw new Error('Ошибка при изменении статуса верификации')
    }
    
    // Логируем действие
    await this.logAdminAction(
      'admin-id',
      'update_executor_verification',
      'user',
      executorId,
      { status, notes }
    )
  }
  
  // Получение логов администратора
  static async getAdminLogs(
    filters: {
      adminId?: string
      action?: string
      entityType?: string
      dateFrom?: Date
      dateTo?: Date
    } = {},
    page: number = 1,
    limit: number = 50
  ): Promise<{ logs: AdminLog[]; total: number }> {
    const from = (page - 1) * limit
    const to = from + limit - 1
    
    let query = supabase
      .from('admin_logs')
      .select(`
        *,
        admin:profiles!admin_logs_admin_id_fkey (
          full_name,
          email
        )
      `, { count: 'exact' })
    
    if (filters.adminId) {
      query = query.eq('admin_id', filters.adminId)
    }
    
    if (filters.action) {
      query = query.eq('action', filters.action)
    }
    
    if (filters.entityType) {
      query = query.eq('entity_type', filters.entityType)
    }
    
    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom.toISOString())
    }
    
    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo.toISOString())
    }
    
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)
    
    if (error) {
      console.error('Error getting admin logs:', error)
      throw new Error('Ошибка при получении логов')
    }
    
    const logs: AdminLog[] = (data || []).map(item => ({
      id: item.id,
      adminId: item.admin_id,
      action: item.action,
      entityType: item.entity_type,
      entityId: item.entity_id,
      changes: item.changes,
      ipAddress: item.ip_address,
      userAgent: item.user_agent,
      createdAt: new Date(item.created_at),
      admin: item.admin ? {
        fullName: item.admin.full_name,
        email: item.admin.email
      } : undefined
    }))
    
    return {
      logs,
      total: count || 0
    }
  }
  
  // Логирование действий администратора
  private static async logAdminAction(
    adminId: string,
    action: string,
    entityType: string,
    entityId?: string,
    changes?: Record<string, any>
  ): Promise<void> {
    const { error } = await supabase
      .from('admin_logs')
      .insert([
        {
          admin_id: adminId,
          action,
          entity_type: entityType,
          entity_id: entityId,
          changes,
          created_at: new Date().toISOString()
        }
      ])
    
    if (error) {
      console.error('Error logging admin action:', error)
    }
  }
  
  // Рассылка уведомлений пользователям
  static async sendBulkNotification(
    userIds: string[],
    title: string,
    message: string,
    type: 'info' | 'warning' | 'success' | 'error'
  ): Promise<void> {
    const notifications = userIds.map(userId => ({
      user_id: userId,
      title,
      message,
      type,
      is_read: false,
      created_at: new Date().toISOString()
    }))
    
    const { error } = await supabase
      .from('notifications')
      .insert(notifications)
    
    if (error) {
      console.error('Error sending bulk notification:', error)
      throw new Error('Ошибка при рассылке уведомлений')
    }
    
    // Логируем действие
    await this.logAdminAction(
      'admin-id',
      'send_bulk_notification',
      'notification',
      undefined,
      { userIds: userIds.length, title, type }
    )
  }
}