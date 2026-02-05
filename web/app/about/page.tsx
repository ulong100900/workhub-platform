import { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Target, Shield, Zap, Globe, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'О нас | WorkFinder',
  description: 'Узнайте больше о платформе WorkFinder, нашей миссии и команде',
}

const features = [
  {
    icon: <Target className="h-10 w-10" />,
    title: 'Наша миссия',
    description: 'Создаем удобную и безопасную платформу для связи заказчиков и исполнителей по всему миру.',
  },
  {
    icon: <Shield className="h-10 w-10" />,
    title: 'Безопасность',
    description: 'Гарантируем безопасность сделок, защиту данных и честные отзывы обо всех участниках.',
  },
  {
    icon: <Zap className="h-10 w-10" />,
    title: 'Эффективность',
    description: 'Используем современные технологии для быстрого подбора исполнителей и управления проектами.',
  },
  {
    icon: <Globe className="h-10 w-10" />,
    title: 'Доступность',
    description: 'Работаем с клиентами и исполнителями из разных стран, поддерживая несколько языков и валют.',
  },
  {
    icon: <TrendingUp className="h-10 w-10" />,
    title: 'Развитие',
    description: 'Постоянно улучшаем платформу, добавляя новые функции и инструменты для успешной работы.',
  },
  {
    icon: <Users className="h-10 w-10" />,
    title: 'Сообщество',
    description: 'Создаем сообщество профессионалов, где можно учиться, делиться опытом и расти вместе.',
  },
]

const stats = [
  { label: 'Активных пользователей', value: '10,000+' },
  { label: 'Выполненных проектов', value: '25,000+' },
  { label: 'Средний рейтинг исполнителей', value: '4.8/5' },
  { label: 'Стран присутствия', value: '15+' },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero секция */}
      <section className="relative py-20 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              О платформе <span className="text-primary">WorkFinder</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Мы создаем будущее удаленной работы, соединяя талантливых специалистов 
              с интересными проектами по всему миру.
            </p>
          </div>
        </div>
      </section>

      {/* Статистика */}
      <section className="py-16">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Особенности */}
      <section className="py-16">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">
            Почему выбирают нас
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-none shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="mb-4 text-primary">
                    {feature.icon}
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* История */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">Наша история</h2>
              <p className="text-muted-foreground">
                От небольшого стартапа до ведущей платформы для фрилансеров
              </p>
            </div>

            <div className="space-y-6">
              <div className="relative pl-8">
                <div className="absolute left-0 top-0 w-4 h-4 bg-primary rounded-full"></div>
                <div className="font-semibold">2022 год</div>
                <p className="text-muted-foreground">
                  Основание компании с целью создания удобной платформы для 
                  удаленной работы. Первые 100 пользователей.
                </p>
              </div>

              <div className="relative pl-8">
                <div className="absolute left-0 top-0 w-4 h-4 bg-primary rounded-full"></div>
                <div className="font-semibold">2023 год</div>
                <p className="text-muted-foreground">
                  Запуск системы безопасных платежей, внедрение рейтинговой 
                  системы и расширение до 5,000 пользователей.
                </p>
              </div>

              <div className="relative pl-8">
                <div className="absolute left-0 top-0 w-4 h-4 bg-primary rounded-full"></div>
                <div className="font-semibold">2024 год</div>
                <p className="text-muted-foreground">
                  Выход на международный рынок, добавление поддержки 
                  нескольких языков и валют. Более 10,000 активных пользователей.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Команда (заглушка) */}
      <section className="py-16">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold mb-4">Наша команда</h2>
            <p className="text-muted-foreground">
              Талантливые специалисты, работающие над созданием лучшей платформы 
              для удаленной работы.
            </p>
          </div>
          
          <div className="text-center">
            <Card className="inline-block p-8 border-dashed">
              <CardContent className="pt-6">
                <div className="text-4xl mb-4">👥</div>
                <h3 className="text-xl font-semibold mb-2">Присоединяйтесь к нам!</h3>
                <p className="text-muted-foreground mb-4">
                  Мы всегда ищем талантливых людей в нашу команду
                </p>
                <Button asChild>
                  <Link href="/careers">Смотреть вакансии</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl font-bold">
              Готовы начать работать с нами?
            </h2>
            <p className="text-primary-foreground/80">
              Присоединяйтесь к тысячам довольных заказчиков и исполнителей
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="secondary">
                <Link href="/register">Начать бесплатно</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10">
                <Link href="/contact">Связаться с нами</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}