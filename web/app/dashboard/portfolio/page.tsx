
'use client'

import { useAuth } from '@/hooks/useAuth'
import PortfolioSection from '@/components/portfolio/PortfolioSection'

export default function PortfolioPage() {
  const { user } = useAuth()

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Требуется авторизация</h2>
          <p className="text-gray-600">Пожалуйста, войдите в систему для управления портфолио</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Мое портфолио</h1>
      <p className="text-gray-600 mb-8">
        Добавляйте свои лучшие работы вручную. Это независимая коллекция, не связанная с завершенными проектами.
      </p>
      
      <PortfolioSection />
    </div>
  )
}
