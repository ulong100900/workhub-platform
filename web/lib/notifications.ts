import { createClient } from './supabase/client'
const getSupabaseBrowserClient = createClient

export const notificationService = {
  // Создание уведомления
  async createNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    metadata: any = {}
  ) {
    try {
      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          title,
          message,
          metadata,
          created_at: new Date().toISOString(),
          read: false
        })
        .select()
        .single()
      
      if (error) throw error
      return { data, error: null }
    } catch (error: any) {
      console.error('Error creating notification:', error)
      return { data: null, error: error.message }
    }
  },

  // Получение уведомлений пользователя
  async getUserNotifications(userId: string, limit = 20) {
    try {
      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      return { data, error: null }
    } catch (error: any) {
      console.error('Error getting notifications:', error)
      return { data: null, error: error.message }
    }
  },

  // Отметить как прочитанное
  async markAsRead(notificationId: string) {
    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase
        .from('notifications')
        .update({ 
          read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', notificationId)
      
      if (error) throw error
      return { error: null }
    } catch (error: any) {
      console.error('Error marking notification as read:', error)
      return { error: error.message }
    }
  },

  // Количество непрочитанных
  async getUnreadCount(userId: string) {
    try {
      const supabase = getSupabaseBrowserClient()
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false)
      
      if (error) throw error
      return { count: count || 0, error: null }
    } catch (error: any) {
      console.error('Error getting unread count:', error)
      return { count: 0, error: error.message }
    }
  },

  // Отметить все как прочитанные
  async markAllAsRead(userId: string) {
    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase
        .from('notifications')
        .update({ 
          read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('user_id', userId)
        .eq('read', false)
      
      if (error) throw error
      return { error: null }
    } catch (error: any) {
      console.error('Error marking all as read:', error)
      return { error: error.message }
    }
  }
}
// Для обратной совместимости
export const NotificationService = notificationService