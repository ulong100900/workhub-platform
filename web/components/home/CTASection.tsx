'use client'

import { Button } from '@/components/ui/button'
import { CheckCircle, Shield, Clock, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default function CTASection() {
  const features = [
    {
      icon: Shield,
      title: 'Безопасная оплата',
      description: 'Система гарантийных платежей защищает обе стороны'
    },
    {
      icon: Clock,
      title: 'Быстрый старт',
      description: 'Начните работать в течение 24 часов после регистрации'
    },
    {
      icon: TrendingUp,
      title: 'Рост дохода',
      description: 'Фрилансеры зарабатывают в среднем на 40% больше'
    },
    {
      icon: CheckCircle,
      title: 'Проверенные специалисты',
      description: 'Все исполнители проходят верификацию'
    }
  ]

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Готовы начать?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Присоединяйтесь к самой быстрорастущей фриланс-платформе в России
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div key={index} className="text-center">
                <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <Icon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            )
          })}
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-4">Начните прямо сейчас</h3>
              <p className="text-gray-600">
                Выберите свою роль и начните зарабатывать или находить специалистов
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="border rounded-xl p-6 hover:border-blue-500 transition-colors">
                <div className="text-center mb-6">
                  <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="h-10 w-10 text-blue-600" />
                  </div>
                  <h4 className="text-xl font-bold mb-2">Я фрилансер</h4>
                  <p className="text-gray-600 mb-6">
                    Находите интересные проекты, работайте удаленно и увеличивайте доход
                  </p>
                </div>
                <ul className="space-y-3 mb-6">
                  {['Доступ к тысячам проектов', 'Гарантированная оплата', 'Личный менеджер', 'Бесплатная регистрация'].map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/register?type=freelancer">
                  <Button className="w-full" size="lg">
                    Стать фрилансером
                  </Button>
                </Link>
              </div>

              <div className="border rounded-xl p-6 hover:border-blue-500 transition-colors">
                <div className="text-center mb-6">
                  <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-10 w-10 text-green-600" />
                  </div>
                  <h4 className="text-xl font-bold mb-2">Я клиент</h4>
                  <p className="text-gray-600 mb-6">
                    Находите проверенных специалистов и реализуйте проекты быстро и эффективно
                  </p>
                </div>
                <ul className="space-y-3 mb-6">
                  {['Доступ к лучшим фрилансерам', 'Гарантия качества работ', 'Безопасные платежи', 'Поддержка 24/7'].map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/register?type=client">
                  <Button className="w-full" size="lg" variant="outline">
                    Найти исполнителя
                  </Button>
                </Link>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t text-center">
              <p className="text-gray-600 mb-4">
                Уже есть аккаунт?
              </p>
              <Link href="/login">
                <Button variant="link" className="text-blue-600">
                  Войти в систему
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}