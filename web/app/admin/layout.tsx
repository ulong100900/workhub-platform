'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  Users,
  Flag,
  DollarSign,
  Home,
  BarChart,
  Settings,
  Shield,
  FileText,
  Bell,
  LogOut,
  Menu,
  X,
  User
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  {
    title: 'Главная',
    href: '/admin',
    icon: Home
  },
  {
    title: 'Пользователи',
    href: '/admin/users',
    icon: Users
  },
  {
    title: 'Жалобы',
    href: '/admin/reports',
    icon: Flag
  },
  {
    title: 'Выплаты',
    href: '/admin/payouts',
    icon: DollarSign
  },
  {
    title: 'Аналитика',
    href: '/admin/analytics',
    icon: BarChart
  },
  {
    title: 'Настройки',
    href: '/admin/settings',
    icon: Settings
  },
  {
    title: 'Безопасность',
    href: '/admin/security',
    icon: Shield
  },
  {
    title: 'Документация',
    href: '/admin/docs',
    icon: FileText
  }
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Мобильная навигация */}
      <div className="lg:hidden">
        <div className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-white px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
          <div className="text-xl font-bold">Admin Panel</div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {sidebarOpen && (
          <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)}>
            <div className="fixed inset-y-0 left-0 z-40 w-72 bg-white" onClick={(e) => e.stopPropagation()}>
              <div className="flex h-16 items-center justify-between border-b px-6">
                <div className="text-xl font-bold">Admin Panel</div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <nav className="p-6">
                <div className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    
                    return (
                      <Link key={item.href} href={item.href}>
                        <Button
                          variant={isActive ? 'secondary' : 'ghost'}
                          className={cn(
                            'w-full justify-start',
                            isActive && 'bg-gray-100'
                          )}
                          onClick={() => setSidebarOpen(false)}
                        >
                          <Icon className="mr-3 h-5 w-5" />
                          {item.title}
                        </Button>
                      </Link>
                    )
                  })}
                </div>
                
                <div className="mt-8 space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">Администратор</div>
                      <div className="text-sm text-gray-600">admin@workfinder.ru</div>
                    </div>
                  </div>
                  
                  <Button variant="outline" className="w-full">
                    <LogOut className="mr-2 h-4 w-4" />
                    Выйти
                  </Button>
                </div>
              </nav>
            </div>
          </div>
        )}
      </div>

      <div className="lg:grid lg:grid-cols-12">
        {/* Десктопная навигация */}
        <aside className="hidden lg:block lg:col-span-2 lg:fixed lg:inset-y-0 lg:z-50 lg:w-72 lg:border-r lg:bg-white">
          <div className="flex h-16 items-center border-b px-6">
            <div className="text-xl font-bold">WorkFinder Admin</div>
          </div>
          
          <nav className="p-6">
            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive ? 'secondary' : 'ghost'}
                      className={cn(
                        'w-full justify-start mb-1',
                        isActive && 'bg-gray-100'
                      )}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {item.title}
                    </Button>
                  </Link>
                )
              })}
            </div>
            
            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium">Администратор</div>
                  <div className="text-sm text-gray-600">admin@workfinder.ru</div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  <Settings className="mr-2 h-4 w-4" />
                  Профиль
                </Button>
                <Button variant="outline" className="flex-1">
                  <LogOut className="mr-2 h-4 w-4" />
                  Выйти
                </Button>
              </div>
            </div>
          </nav>
        </aside>

        {/* Основное содержимое */}
        <main className="lg:col-span-10 lg:pl-72">
          <div className="sticky top-0 z-30 hidden lg:flex h-16 items-center justify-between border-b bg-white px-8">
            <div className="text-lg font-medium">
              {navItems.find(item => item.href === pathname)?.title || 'Административная панель'}
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-600"></span>
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div className="hidden md:block">
                  <div className="text-sm font-medium">Администратор</div>
                  <div className="text-xs text-gray-600">Работает • 2 ч 45 мин</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-4 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}