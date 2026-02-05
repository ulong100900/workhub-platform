import { createClient as getSupabaseBrowserClient } from './supabase/client'
import { createClient as createServerClient } from './supabase/server'

export const getUserIdFromSession = async () => {
  try {
    const supabase = getSupabaseBrowserClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id || null
  } catch {
    return null
  }
}

export const getServerUserIdFromSession = async () => {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id || null
  } catch {
    return null
  }
}

// Отправка SMS кода
export const sendSMSCode = async (phone: string) => {
  try {
    const response = await fetch('/api/auth/sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone }),
    })
    
    return await response.json()
  } catch (error) {
    console.error('Error sending SMS:', error)
    return { success: false, error: 'Ошибка отправки SMS' }
  }
}

// Верификация SMS кода
export const verifySMSCode = async (phone: string, code: string, rememberMe = false) => {
  try {
    const response = await fetch('/api/auth/sms/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone, code, rememberMe }),
    })
    
    return await response.json()
  } catch (error) {
    console.error('Error verifying SMS:', error)
    return { success: false, error: 'Ошибка верификации' }
  }
}

// Добавление email к существующему аккаунту
export const addEmailToAccount = async (email: string, password: string) => {
  try {
    const supabase = getSupabaseBrowserClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return { success: false, error: 'Пользователь не авторизован' }
    
    // Обновляем email в профиле
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        email,
        email_verified: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
    
    if (profileError) throw profileError
    
    // Отправляем email для верификации
    const { error: emailError } = await supabase.auth.updateUser({
      email,
      password: password || undefined
    })
    
    if (emailError) throw emailError
    
    return { success: true, message: 'Email добавлен. Проверьте почту для подтверждения.' }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Вход по email и паролю
export const loginWithEmail = async (email: string, password: string, rememberMe = false) => {
  try {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    
    if (rememberMe) {
      localStorage.setItem('remember_me', 'true')
    }
    
    return { success: true, user: data.user }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}