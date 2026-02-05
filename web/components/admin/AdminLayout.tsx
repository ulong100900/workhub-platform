'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AdminService } from '@/lib/admin'
import { Button } from '@/components/ui/button'
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  Wallet,
  FileText,
  Flag,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  Shield
} from 'lucide-react'

const adminNavItems = [
  { href: '/admin', label: 'Обзор', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Пользователи', icon: Users },
  { href: '/admin/executors', label: 'Исполнители', icon: Briefcase },
  { href: '/admin/orders', label: 'Заказы', icon: Briefcase },
  { href: '/admin/finance', label: 'Финансы', icon: Wallet },
  { href: '/admin/reports', label: 'Жалобы', icon: Flag },
  { href: '/admin/logs', label: 'Логи', icon: FileText },
  { href: '/admin/settings', label: 'Настройки', icon: Settings },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    try {
      // В реальном приложении здесь будет проверка прав пользователя
      const hasAccess = true // await AdminService.checkAdminAccess(userId)
      if (!hasAccess) {
        router.push('/')
      } else {
        setIsAdmin(true)
      }
    } catch (error) {
      console.error('Error checking admin access:', error)
      router.push('/')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    // Логика выхода
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Мобильное меню */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          
          <h1 className="text-xl font-bold">Админ-панель</h1>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Боковая панель */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-white border-r transform transition-transform duration-200 z-40
        lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Заголовок */}
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-purple-600" />
            Админ-панель
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Управление платформой
          </p>
        </div>

        {/* Навигация */}
        <nav className="p-4">
          <ul className="space-y-1">
            {adminNavItems.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Футер */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 mr-2" />
            Выйти
          </Button>
        </div>
      </aside>

      {/* Основной контент */}
      <main className={`
        lg:ml-64 pt-16 lg:pt-0 min-h-screen transition-all duration-200
        ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}
      `}>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}