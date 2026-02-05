
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function CheckAuth() {
  const [status, setStatus] = useState<string>('Проверка...')
  const [userEmail, setUserEmail] = useState<string>('')

  useEffect(() => {
    const check = async () => {
      const supabase = createClient()
      
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          setStatus(`✅ Авторизован: ${session.user.email}`)
          setUserEmail(session.user.email || '')
        } else {
          setStatus('❌ Не авторизован')
        }
      } catch (error) {
        setStatus(`❌ Ошибка: ${error}`)
      }
    }
    
    check()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.reload()
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Проверка авторизации</h1>
      <div className="bg-gray-100 p-4 rounded mb-4">
        <p className="font-mono">{status}</p>
      </div>
      
      <div className="space-x-4">
        <button
          onClick={() => window.location.href = '/login'}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          На страницу входа
        </button>
        
        <button
          onClick={() => window.location.href = '/'}
          className="px-4 py-2 bg-gray-600 text-white rounded"
        >
          На главную
        </button>
        
        {userEmail && (
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded"
          >
            Выйти
          </button>
        )}
      </div>
    </div>
  )
}
