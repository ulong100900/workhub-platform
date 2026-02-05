// components/layout/DashboardLayout.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  Home, 
  Calendar,
  Briefcase,
  Bell,
  MessageSquare,
  Menu,
  X,
  LogOut,
  Settings,
  FileText,
  Cloud,
  Thermometer,
  Wind,
  MapPin,
  ChevronDown
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'

interface DashboardLayoutProps {
  children: React.ReactNode
hideHeader?: boolean // ← ДОБАВЬТЕ ЭТУ СТРОКУ
}

interface WeatherData {
  temp: number
  feels_like: number
  description: string
  icon: string
  wind_speed: number
  humidity: number
  city: string
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [userName, setUserName] = useState<string>('Пользователь')
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loadingWeather, setLoadingWeather] = useState(false)
  const [selectedCity, setSelectedCity] = useState('Москва')
  
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const cities = [
    'Москва',
    'Санкт-Петербург',
    'Новосибирск',
    'Екатеринбург',
    'Казань',
    'Нижний Новгород',
    'Челябинск',
    'Самара',
    'Омск',
    'Ростов-на-Дону',
    'Уфа',
    'Красноярск',
    'Пермь',
    'Воронеж',
    'Волгоград'
  ]

  useEffect(() => {
    loadUserData()
    loadWeatherData(selectedCity)
  }, [])

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Получаем профиль пользователя
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email, avatar_url')
          .eq('id', user.id)
          .single()
        
        setUser(user)
        
        // Устанавливаем имя пользователя
        const name = profile?.full_name || user.email?.split('@')[0] || 'Пользователь'
        setUserName(name)

        // Загружаем уведомления
        await loadNotifications(user.id)
        await loadUnreadMessages(user.id)
      }
    } catch (error) {
      console.error('Ошибка загрузки пользователя:', error)
    }
  }

  const loadWeatherData = async (city: string) => {
    setLoadingWeather(true)
    try {
      // Используем OpenWeatherMap API
      // Нужно получить API key на https://openweathermap.org/api
      const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY
      
      if (!API_KEY) {
        // Fallback к моковым данным если API key нет
        const mockWeather: WeatherData = {
          temp: Math.floor(Math.random() * 10) + 15, // 15-25 градусов
          feels_like: Math.floor(Math.random() * 8) + 13,
          description: ['Облачно', 'Солнечно', 'Небольшой дождь', 'Ясно'][Math.floor(Math.random() * 4)],
          icon: ['☁️', '☀️', '🌧️', '🌤️'][Math.floor(Math.random() * 4)],
          wind_speed: Math.random() * 5 + 1,
          humidity: Math.floor(Math.random() * 30) + 50,
          city
        }
        setWeather(mockWeather)
        return
      }

      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&lang=ru&appid=${API_KEY}`
      )
      
      if (!response.ok) {
        throw new Error('Ошибка получения погоды')
      }
      
      const data = await response.json()
      
      setWeather({
        temp: Math.round(data.main.temp),
        feels_like: Math.round(data.main.feels_like),
        description: data.weather[0].description,
        icon: getWeatherIcon(data.weather[0].icon),
        wind_speed: data.wind.speed,
        humidity: data.main.humidity,
        city: data.name
      })
    } catch (error) {
      console.error('Ошибка загрузки погоды:', error)
      // Fallback к моковым данным
      const mockWeather: WeatherData = {
        temp: 18,
        feels_like: 17,
        description: 'Облачно',
        icon: '☁️',
        wind_speed: 3.2,
        humidity: 65,
        city
      }
      setWeather(mockWeather)
      
      toast({
        variant: 'destructive',
        title: 'Ошибка загрузки погоды',
        description: 'Используются тестовые данные',
      })
    } finally {
      setLoadingWeather(false)
    }
  }

  const getWeatherIcon = (iconCode: string): string => {
    const iconMap: Record<string, string> = {
      '01d': '☀️',
      '01n': '🌙',
      '02d': '⛅',
      '02n': '⛅',
      '03d': '☁️',
      '03n': '☁️',
      '04d': '☁️',
      '04n': '☁️',
      '09d': '🌧️',
      '09n': '🌧️',
      '10d': '🌦️',
      '10n': '🌦️',
      '11d': '⛈️',
      '11n': '⛈️',
      '13d': '❄️',
      '13n': '❄️',
      '50d': '🌫️',
      '50n': '🌫️',
    }
    return iconMap[iconCode] || '☀️'
  }

  const loadNotifications = async (userId: string) => {
    try {
      const { data: notifications } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('read', false)
      
      setUnreadNotifications(notifications?.length || 0)
    } catch (error) {
      console.error('Ошибка загрузки уведомлений:', error)
    }
  }

  const loadUnreadMessages = async (userId: string) => {
    try {
      const { data: messages } = await supabase
        .from('messages')
        .select('id')
        .eq('receiver_id', userId)
        .eq('read', false)
      
      setUnreadMessages(messages?.length || 0)
    } catch (error) {
      console.error('Ошибка загрузки сообщений:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
      toast({
        title: 'Выход выполнен',
        description: 'Вы успешно вышли из системы',
      })
    } catch (error) {
      console.error('Ошибка при выходе:', error)
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Не удалось выйти из системы',
      })
    }
  }

  // Упрощенная навигация
  const navigation = [
    { name: 'Главная', href: '/dashboard', icon: Home, exact: true },
    { name: 'Мои проекты', href: '/dashboard/my-projects', icon: Briefcase },

    { name: 'Сообщения', href: '/dashboard/messages', icon: MessageSquare, badge: unreadMessages },
    { name: 'Избранное', href: '/dashboard/favorites', icon: Bell, badge: unreadNotifications },
    { name: 'Портфолио', href: '/dashboard/portfolio', icon: FileText },
    { name: 'Настройки', href: '/dashboard/settings', icon: Settings },
  ]

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname?.startsWith(href)
  }

  const getUserInitial = () => {
    if (user?.email) {
      return user.email.charAt(0).toUpperCase()
    }
    return 'U'
  }

  const WeatherWidget = () => {
    if (loadingWeather) {
      return (
        <div className="flex items-center gap-3 px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
          <div className="animate-pulse flex items-center gap-2">
            <div className="h-8 w-8 bg-gray-200 rounded"></div>
            <div className="space-y-1">
              <div className="h-4 w-16 bg-gray-200 rounded"></div>
              <div className="h-3 w-24 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      )
    }

    if (!weather) return null

    return (
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-auto px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 hover:bg-blue-100">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{weather.icon}</span>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-gray-900">{weather.temp}°</span>
                    <span className="text-xs text-gray-600">ощущается как {weather.feels_like}°</span>
                  </div>
                  <div className="text-xs text-gray-600 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {weather.city}
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium text-gray-900">Выберите город</p>
            </div>
            <DropdownMenuSeparator />
            {cities.map((city) => (
              <DropdownMenuItem
                key={city}
                onClick={() => {
                  setSelectedCity(city)
                  loadWeatherData(city)
                }}
                className="cursor-pointer"
              >
                {city}
                {selectedCity === city && (
                  <span className="ml-auto text-blue-600">✓</span>
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5">
              <p className="text-xs text-gray-500">
                Данные обновляются автоматически
              </p>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Верхняя панель */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b">
        <div className="pl-12 pr-6"> {/* Левая часть выровнена с сайдбаром */}
          <div className="flex h-16 items-center justify-between">
            {/* Логотип и название */}
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">WF</span>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  WorkFinder
                </span>
              </Link>
            </div>

            {/* Правая часть - только прогноз погоды */}
            <WeatherWidget />
          </div>
        </div>
      </header>


      <div className="flex">
        {/* Боковая панель (Desktop) */}
        <aside className="hidden lg:block w-64 bg-white border-r border-gray-100 min-h-[calc(100vh-4rem)] fixed left-0 top-16 bottom-0">
          <div className="p-6 h-full overflow-y-auto">
            <nav className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href, item.exact)
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                      ${active 
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-100' 
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:translate-x-1'
                      }
                    `}
                  >
                    <Icon className={`h-5 w-5 ${active ? 'text-blue-600' : 'text-gray-500'}`} />
                    <span className="font-medium">{item.name}</span>
                    
                    {/* Бейджи для уведомлений */}
                    {item.badge && item.badge > 0 && (
                      <span className={`
                        ml-auto h-5 w-5 rounded-full text-xs flex items-center justify-center
                        ${active ? 'bg-blue-600 text-white' : 'bg-red-500 text-white'}
                      `}>
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    )}
                    
                    {active && (
                      <div className="ml-auto h-2 w-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>
        </aside>

        {/* Основной контент */}
        <main className="flex-1 lg:ml-64 min-h-[calc(100vh-4rem)]">
          <div className="p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>

      {/* Мобильное меню */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-72 bg-white shadow-xl">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                  {getUserInitial()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{userName}</p>
                  <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-5rem)]">
              {navigation.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href, item.exact)
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg
                      ${active 
                        ? 'bg-blue-50 text-blue-700' 
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                    {item.badge && item.badge > 0 && (
                      <span className="ml-auto h-5 w-5 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
              
              {/* Кнопка выхода */}
              <div className="mt-4 pt-4 border-t">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Выйти из системы
                </Button>
              </div>
            </nav>
          </div>
        </div>
      )}
    </div>
  )
}