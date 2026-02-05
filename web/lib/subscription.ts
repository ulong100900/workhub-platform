import { createClient } from './supabase/client'
const getSupabaseBrowserClient = createClient

export const subscriptionService = {
  // Получение всех тарифных планов
  async getPlans() {
    try {
      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price', { ascending: true })
      
      if (error) throw error
      return { data, error: null }
    } catch (error: any) {
      console.error('Error getting plans:', error)
      return { 
        data: [
          { 
            id: 'free', 
            name: 'Бесплатный', 
            price: 0, 
            features: ['Базовые функции', 'До 3 проектов в месяц'] 
          },
          { 
            id: 'pro', 
            name: 'Pro', 
            price: 999, 
            features: ['Неограниченное количество проектов', 'Приоритетная поддержка'] 
          }
        ], 
        error: null 
      }
    }
  },

  // Получение текущей подписки пользователя
  async getUserSubscription(userId: string) {
    try {
      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      if (error) throw error
      return { data, error: null }
    } catch (error: any) {
      console.error('Error getting user subscription:', error)
      return { data: null, error: error.message }
    }
  },

  // Создание подписки
  async createSubscription(
    userId: string, 
    planId: string, 
    paymentMethod: string
  ) {
    try {
      const supabase = getSupabaseBrowserClient()
      
      const { data, error } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          plan_id: planId,
          payment_method: paymentMethod,
          status: 'active',
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // +30 дней
        })
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .single()
      
      if (error) throw error
      return { data, error: null }
    } catch (error: any) {
      console.error('Error creating subscription:', error)
      return { data: null, error: error.message }
    }
  },

  // Отмена подписки
  async cancelSubscription(subscriptionId: string) {
    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('id', subscriptionId)
      
      if (error) throw error
      return { error: null }
    } catch (error: any) {
      console.error('Error cancelling subscription:', error)
      return { error: error.message }
    }
  },

  // Проверка, активна ли подписка
  async isSubscriptionActive(userId: string) {
    try {
      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .gt('end_date', new Date().toISOString())
        .limit(1)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows returned
      return { isActive: !!data, error: null }
    } catch (error: any) {
      console.error('Error checking subscription:', error)
      return { isActive: false, error: error.message }
    }
  }
}

// Для обратной совместимости
export const SubscriptionService = subscriptionService