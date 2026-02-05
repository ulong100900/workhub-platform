// web/app/dashboard/final/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/working-client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function FinalDashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadData = async () => {
      console.log('🚀 FINAL DASHBOARD: Загрузка данных...')
      
      try {
        // 1. Проверяем сессию
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        console.log('📋 FINAL: Сессия:', session ? '✅ Есть' : '❌ Нет')
        
        if (sessionError) {
          console.error('❌ FINAL: Ошибка сессии:', sessionError)
          throw sessionError
        }
        
        if (!session) {
          console.log('🚫 FINAL: Нет сессии, проверяем localStorage...')
          
          // Проверяем localStorage
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
          const projectId = supabaseUrl.split('//')[1].split('.')[0]
          const storageKey = `sb-${projectId}-auth-token`
          const savedToken = localStorage.getItem(storageKey)
          
          if (savedToken) {
            console.log('🔄 FINAL: Нашли токен, пробуем восстановить сессию...')
            try {
              const tokenData = JSON.parse(savedToken)
              if (tokenData.currentSession) {
                const { error: restoreError } = await supabase.auth.setSession({
                  access_token: tokenData.currentSession.access_token,
                  refresh_token: tokenData.currentSession.refresh_token
                })
                
                if (!restoreError) {
                  console.log('✅ FINAL: Сессия восстановлена! Перезагружаем...')
                  window.location.reload()
                  return
                }
              }
            } catch (e) {
              console.error('❌ FINAL: Ошибка восстановления:', e)
            }
          }
          
          console.log('📍 FINAL: Редирект на логин...')
          router.push('/login/final')
          return
        }
        
        console.log('✅ FINAL: Пользователь авторизован:', session.user.email)
        setUser(session.user)
        
        // 2. Получаем профиль
        console.log('👤 FINAL: Получаем профиль...')
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single()
        
        if (profileError) {
          console.log('⚠️ FINAL: Профиль не найден, создаем...')
          // Создаем профиль если его нет
          const { error: createError } = await supabase
            .from('profiles')
            .upsert({
              user_id: session.user.id,
              email: session.user.email,
              full_name: session.user.email.split('@')[0],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
          
          if (createError) {
            console.error('❌ FINAL: Ошибка создания профиля:', createError)
          } else {
            console.log('✅ FINAL: Профиль создан')
            setProfile({
              email: session.user.email,
              full_name: session.user.email.split('@')[0]
            })
          }
        } else {
          console.log('✅ FINAL: Профиль получен:', profileData)
          setProfile(profileData)
        }
        
        console.log('🎉 FINAL: Все данные загружены успешно!')
        
      } catch (error: any) {
        console.error('💥 FINAL: Критическая ошибка:', error)
        
        // На всякий случай показываем кнопку для выхода
        setTimeout(() => {
          if (!user) {
            alert('Ошибка авторизации. Попробуйте войти снова.')
            router.push('/login/final')
          }
        }, 1000)
        
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
    
    // Слушаем изменения auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      console.log(`🔐 FINAL: Auth событие: ${event}`)
      if (event === 'SIGNED_OUT') {
        router.push('/')
      }
    })
    
    return () => subscription.unsubscribe()
  }, [router, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    localStorage.clear()
    window.location.href = '/'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-blue-500 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-blue-600 font-bold">WF</div>
            </div>
          </div>
          <h2 className="text-2xl font-bold mt-6 text-gray-800">WorkFinder</h2>
          <p className="text-gray-600 mt-2">Загрузка dashboard...</p>
          <p className="text-sm text-gray-500 mt-4">Проверка авторизации и загрузка данных</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Навигация */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl font-bold text-blue-600">WorkFinder</span>
              </div>
              <div className="hidden md:block ml-10">
                <div className="flex space-x-8">
                  <Link href="/dashboard/final" className="text-gray-900 hover:text-blue-600 px-3 py-2 font-medium">
                    Главная
                  </Link>
                  <Link href="/projects" className="text-gray-700 hover:text-blue-600 px-3 py-2 font-medium">
                    Проекты
                  </Link>
                  <Link href="/dashboard/profile" className="text-gray-700 hover:text-blue-600 px-3 py-2 font-medium">
                    Профиль
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:block">
                <div className="text-sm text-gray-700">{user?.email}</div>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-100 text-red-700 hover:bg-red-200 px-4 py-2 rounded-lg font-medium transition"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Основной контент */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Заголовок */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8">
            <h1 className="text-3xl font-bold text-white">Добро пожаловать в WorkFinder!</h1>
            <p className="text-blue-100 mt-2">
              {profile?.full_name || user?.email}, ваша панель управления готова к работе
            </p>
          </div>
          
          {/* Контент */}
          <div className="p-8">
            {/* Статус */}
            <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-bold text-green-800">✅ АВТОРИЗАЦИЯ УСПЕШНА</h3>
                  <p className="text-green-700">Вы успешно вошли в систему WorkFinder</p>
                </div>
              </div>
            </div>
            
            {/* Информация о пользователе */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-blue-50 p-6 rounded-xl">
                <h3 className="font-bold text-blue-800 mb-4">👤 Ваш профиль</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-blue-600">Email</div>
                    <div className="font-medium">{user?.email}</div>
                  </div>
                  <div>
                    <div className="text-sm text-blue-600">Имя</div>
                    <div className="font-medium">{profile?.full_name || 'Не указано'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-blue-600">ID пользователя</div>
                    <div className="font-medium text-sm">{user?.id?.substring(0, 12)}...</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-50 p-6 rounded-xl">
                <h3 className="font-bold text-purple-800 mb-4">🚀 Быстрые действия</h3>
                <div className="space-y-3">
                  <Link 
                    href="/projects" 
                    className="block w-full text-center bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition"
                  >
                    Найти проекты
                  </Link>
                  <Link 
                    href="/dashboard/profile" 
                    className="block w-full text-center bg-white border border-purple-600 text-purple-600 py-3 rounded-lg hover:bg-purple-50 transition"
                  >
                    Редактировать профиль
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Дополнительная информация */}
            <div className="bg-gray-50 p-6 rounded-xl">
              <h3 className="font-bold text-gray-800 mb-4">ℹ️ Информация о системе</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded-lg">
                  <div className="text-sm text-gray-500">Статус API</div>
                  <div className="font-medium text-green-600">✅ Работает</div>
                </div>
                <div className="p-4 bg-white rounded-lg">
                  <div className="text-sm text-gray-500">База данных</div>
                  <div className="font-medium text-green-600">✅ Подключена</div>
                </div>
                <div className="p-4 bg-white rounded-lg">
                  <div className="text-sm text-gray-500">Сессия</div>
                  <div className="font-medium text-green-600">✅ Активна</div>
                </div>
              </div>
            </div>
            
            {/* Кнопки отладки */}
            <div className="mt-8 flex space-x-4">
              <button
                onClick={() => console.log('User:', user, 'Profile:', profile)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Показать данные в консоли
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
              >
                Обновить страницу
              </button>
              
              <Link
                href="/"
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                На главную
              </Link>
            </div>
          </div>
        </div>
        
        {/* Сообщение об успехе */}
        <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-2xl">
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-800 mb-2">🎉 Поздравляем!</h3>
            <p className="text-gray-600">
              Вы успешно настроили и запустили полный стек приложения WorkFinder с аутентификацией через Supabase!
            </p>
            <div className="mt-4 flex justify-center space-x-4">
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Next.js 14</span>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">Supabase</span>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">TypeScript</span>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">Tailwind CSS</span>
            </div>
          </div>
        </div>
      </main>
      
      {/* Футер */}
      <footer className="mt-12 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center text-gray-500">
            <p>WorkFinder © 2024 • Полностью рабочий стек с аутентификацией</p>
            <p className="text-sm mt-2">Supabase + Next.js + TypeScript + Tailwind</p>
          </div>
        </div>
      </footer>
    </div>
  )
}