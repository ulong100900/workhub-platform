// web/app/dashboard/force/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/working-client'
import { useRouter } from 'next/navigation'

export default function ForceDashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [checked, setChecked] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const forceAuthCheck = async () => {
      console.log('🔐 FORCE: Принудительная проверка авторизации...')
      
      // 1. Проверяем сессию через Supabase
      const { data: { session } } = await supabase.auth.getSession()
      console.log('📋 FORCE: Сессия через Supabase:', session ? '✅' : '❌')
      
      if (session) {
        console.log('✅ FORCE: Авторизован:', session.user.email)
        setUser(session.user)
        setLoading(false)
        return
      }
      
      // 2. Если нет сессии, проверяем localStorage
      console.log('🔍 FORCE: Проверяем localStorage...')
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const projectId = supabaseUrl.split('//')[1].split('.')[0]
      const storageKey = `sb-${projectId}-auth-token`
      const savedToken = localStorage.getItem(storageKey)
      
      if (savedToken) {
        console.log('🔄 FORCE: Нашли токен в localStorage, пробуем восстановить...')
        try {
          const tokenData = JSON.parse(savedToken)
          if (tokenData.currentSession) {
            const { error: restoreError } = await supabase.auth.setSession({
              access_token: tokenData.currentSession.access_token,
              refresh_token: tokenData.currentSession.refresh_token
            })
            
            if (!restoreError) {
              console.log('✅ FORCE: Сессия восстановлена из localStorage!')
              window.location.reload() // Перезагружаем страницу
              return
            }
          }
        } catch (e) {
          console.error('❌ FORCE: Ошибка восстановления:', e)
        }
      }
      
      // 3. Если ничего не помогло - редирект на логин
      console.log('🚫 FORCE: Нет авторизации, редирект на логин...')
      router.push('/login')
      
    }
    
    if (!checked) {
      forceAuthCheck()
      setChecked(true)
      setTimeout(() => setLoading(false), 2000) // На всякий случай снимаем loading через 2 сек
    }
  }, [router, supabase, checked])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-bold">Force Dashboard</h2>
          <p className="text-gray-600">Принудительная проверка авторизации...</p>
          <p className="text-sm text-gray-500 mt-2">
            Проверяем все возможные источники сессии
          </p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Не авторизован</h2>
          <p className="mb-4">Перенаправляем на страницу входа...</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Перейти на логин
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-2">Force Dashboard</h1>
          <p className="text-green-600 font-bold mb-4">✅ АВТОРИЗАЦИЯ РАБОТАЕТ!</p>
          
          <div className="p-4 bg-green-50 border border-green-200 rounded mb-6">
            <h2 className="font-bold text-green-800 mb-2">Информация о пользователе</h2>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>ID:</strong> {user.id.substring(0, 8)}...</p>
            <p><strong>Создан:</strong> {new Date(user.created_at).toLocaleString()}</p>
          </div>
          
          <div className="space-x-4">
            <button
              onClick={() => {
                supabase.auth.signOut()
                localStorage.clear()
                window.location.href = '/'
              }}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Выйти и очистить
            </button>
            
            <button
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              На главную
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}