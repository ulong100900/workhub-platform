// web/app/index.tsx (главная страница)
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Навигация */}
      <nav className="bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="text-2xl font-bold text-blue-600">WorkFinder</div>
            <div className="flex space-x-4">
              <Link 
                href="/login/final" 
                className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium"
              >
                Вход
              </Link>
              <Link 
                href="/register" 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Регистрация
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Герой секция */}
      <main className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Добро пожаловать в <span className="text-blue-600">WorkFinder</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
            Полностью рабочее приложение с аутентификацией, построенное на современном стеке технологий
          </p>
          
          {/* Карточки технологий */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-white p-6 rounded-2xl shadow-lg border">
              <div className="text-3xl mb-4">⚡</div>
              <h3 className="font-bold text-lg mb-2">Next.js 14</h3>
              <p className="text-gray-600">React фреймворк с App Router</p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-lg border">
              <div className="text-3xl mb-4">🔐</div>
              <h3 className="font-bold text-lg mb-2">Supabase Auth</h3>
              <p className="text-gray-600">Полная аутентификация и БД</p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-lg border">
              <div className="text-3xl mb-4">🎨</div>
              <h3 className="font-bold text-lg mb-2">Tailwind CSS</h3>
              <p className="text-gray-600">Утилитарный CSS фреймворк</p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-lg border">
              <div className="text-3xl mb-4">📱</div>
              <h3 className="font-bold text-lg mb-2">TypeScript</h3>
              <p className="text-gray-600">Типизированный JavaScript</p>
            </div>
          </div>
          
          {/* Кнопки действий */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link 
              href="/login/final" 
              className="px-8 py-4 bg-blue-600 text-white text-lg font-medium rounded-xl hover:bg-blue-700 transition shadow-lg"
            >
              🔐 Тестовый вход
            </Link>
            
            <Link 
              href="/dashboard/final" 
              className="px-8 py-4 bg-white border-2 border-blue-600 text-blue-600 text-lg font-medium rounded-xl hover:bg-blue-50 transition shadow-lg"
            >
              🚀 Перейти в Dashboard
            </Link>
            
            <Link 
              href="/register" 
              className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-lg font-medium rounded-xl hover:opacity-90 transition shadow-lg"
            >
              📝 Регистрация
            </Link>
          </div>
          
          {/* Инструкция */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 max-w-3xl mx-auto border">
            <h2 className="text-2xl font-bold mb-6 text-center">✅ Рабочие страницы</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-bold text-blue-800 mb-2">🔐 Аутентификация</h3>
                <ul className="space-y-2">
                  <li><Link href="/login/final" className="text-blue-600 hover:underline">/login/final</Link> - финальный вход</li>
                  <li><Link href="/register" className="text-blue-600 hover:underline">/register</Link> - регистрация</li>
                  <li><Link href="/login/debug" className="text-blue-600 hover:underline">/login/debug</Link> - отладка входа</li>
                </ul>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-bold text-green-800 mb-2">🚀 Панель управления</h3>
                <ul className="space-y-2">
                  <li><Link href="/dashboard/final" className="text-green-600 hover:underline">/dashboard/final</Link> - финальный dashboard</li>
                  <li><Link href="/dashboard" className="text-green-600 hover:underline">/dashboard</Link> - основной dashboard</li>
                  <li><Link href="/dashboard/force" className="text-green-600 hover:underline">/dashboard/force</Link> - принудительный доступ</li>
                </ul>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg">
                <h3 className="font-bold text-purple-800 mb-2">🔧 Тестирование</h3>
                <ul className="space-y-2">
                  <li><Link href="/test-api" className="text-purple-600 hover:underline">/test-api</Link> - тест API</li>
                  <li><Link href="/test-client" className="text-purple-600 hover:underline">/test-client</Link> - тест клиента</li>
                  <li><Link href="/check-status" className="text-purple-600 hover:underline">/check-status</Link> - проверка статуса</li>
                </ul>
              </div>
              
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h3 className="font-bold text-yellow-800 mb-2">📊 Проекты</h3>
                <ul className="space-y-2">
                  <li><Link href="/projects" className="text-yellow-600 hover:underline">/projects</Link> - список проектов</li>
                  <li><Link href="/dashboard/profile" className="text-yellow-600 hover:underline">/dashboard/profile</Link> - профиль</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-8 p-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg">
              <h3 className="font-bold text-gray-800 mb-2">🎉 Поздравляем!</h3>
              <p className="text-gray-700">
                Вы успешно настроили полный стек приложения с аутентификацией. Теперь можно:
              </p>
              <ol className="list-decimal pl-5 mt-2 space-y-1 text-gray-600">
                <li>Войти через <strong>/login/final</strong></li>
                <li>Перейти в dashboard через <strong>/dashboard/final</strong></li>
                <li>Протестировать все функции приложения</li>
              </ol>
            </div>
          </div>
        </div>
      </main>
      
      {/* Футер */}
      <footer className="border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center text-gray-500">
            <p className="text-lg font-medium">WorkFinder - Полный стек приложения с аутентификацией</p>
            <p className="mt-2">Supabase • Next.js • TypeScript • Tailwind CSS</p>
            <div className="mt-4 flex justify-center space-x-6">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">Аутентификация ✅</span>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full">Dashboard ✅</span>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full">База данных ✅</span>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full">Профили ✅</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}