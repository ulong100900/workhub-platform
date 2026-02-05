// app/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user || null)
      } catch (error) {
        console.error('Ошибка проверки авторизации:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 bg-gradient-to-br from-blue-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Найди работу или найми фрилансера
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              WorkFinder - платформа для поиска работы и фрилансеров. 
              Создавайте проекты, находите исполнителей или предлагайте свои услуги.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-3">Для заказчиков</h3>
              <p className="text-gray-600">
                Размещайте проекты, получайте предложения от фрилансеров и выбирайте лучших исполнителей.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-3">Для фрилансеров</h3>
              <p className="text-gray-600">
                Находите интересные проекты, предлагайте свои услуги и зарабатывайте на своих навыках.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-3">Безопасные сделки</h3>
              <p className="text-gray-600">
                Гарантированные выплаты, защита обеих сторон и удобная система коммуникации.
              </p>
            </div>
          </div>

          <div className="text-center">
            {user ? (
              <div className="space-y-4">
                <p className="text-lg text-gray-700">
                  Вы уже авторизованы. Перейдите в dashboard для управления проектами.
                </p>
                <Link
                  href="/dashboard"
                  className="inline-block px-8 py-3 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition"
                >
                  Перейти в Dashboard
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-lg text-gray-700">
                  Присоединяйтесь к тысячам пользователей уже сегодня
                </p>
                <div className="space-x-4">
                  <Link
                    href="/register"
                    className="inline-block px-8 py-3 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition"
                  >
                    Начать бесплатно
                  </Link>
                  <Link
                    href="/login"
                    className="inline-block px-8 py-3 bg-gray-200 text-gray-800 text-lg font-semibold rounded-lg hover:bg-gray-300 transition"
                  >
                    Войти в аккаунт
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}