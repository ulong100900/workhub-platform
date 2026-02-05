// components/home/HeroSection.tsx
'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Briefcase, Users, Shield, Star } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { mainCategories } from '@/data/categories'

export default function HeroSection() {
  const stats = [
    { value: '10,000+', label: 'Активных фрилансеров' },
    { value: '5,000+', label: 'Выполненных проектов' },
    { value: '₽50M+', label: 'Выплачено фрилансерам' },
    { value: '4.9/5', label: 'Средний рейтинг' }
  ]

  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Найдите идеального фрилансера
            <span className="text-blue-600"> для вашего проекта</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            WorkFinder соединяет талантливых фрилансеров с клиентами по всему миру.
            Быстро, безопасно и эффективно.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Поиск проектов, навыков или фрилансеров..."
                className="pl-12 py-6 text-lg border-2"
              />
              <Button size="lg" className="absolute right-2 top-1/2 transform -translate-y-1/2">
                Найти
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-blue-600">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/register?type=client">
              <Button size="lg" className="w-full sm:w-auto px-8 py-6 text-lg">
                <Briefcase className="mr-2 h-5 w-5" />
                Разместить проект
              </Button>
            </Link>
            <Link href="/register?type=freelancer">
              <Button size="lg" variant="outline" className="w-full sm:w-auto px-8 py-6 text-lg">
                <Users className="mr-2 h-5 w-5" />
                Стать фрилансером
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Почему выбирают WorkFinder?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Безопасные платежи</h3>
                <p className="text-gray-600">
                  Гарантированная оплата через безопасную систему эскроу
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <Star className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Проверенные исполнители</h3>
                <p className="text-gray-600">
                  Все фрилансеры проходят верификацию и имеют отзывы
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Разнообразие проектов</h3>
                <p className="text-gray-600">
                  Более {mainCategories.length} категорий услуг на любой вкус
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-8">Популярные категории</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-12">
          {mainCategories.slice(1, 9).map((category) => (
            <Link 
              key={category.id} 
              href={`/projects?category=${category.id}`}
              className="group"
            >
              <Card className="h-full hover:shadow-lg transition-shadow border-gray-200">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className={cn(
                    "p-3 rounded-lg mb-3 transition-colors group-hover:scale-105",
                    category.color
                  )}>
                    <div className="w-8 h-8">
                      {category.icon}
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1 truncate w-full">
                    {category.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {category.count} предложений
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        <div className="text-center">
          <Link href="/projects">
            <Button variant="outline" size="lg">
              Смотреть все {mainCategories.length} категорий
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}