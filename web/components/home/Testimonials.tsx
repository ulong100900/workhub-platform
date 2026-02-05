'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Star, Quote } from 'lucide-react'

interface Testimonial {
  id: string
  name: string
  role: string
  company: string
  content: string
  rating: number
  avatar?: string
}

export default function Testimonials() {
  const testimonials: Testimonial[] = [
    {
      id: '1',
      name: 'Иван Петров',
      role: 'Основатель',
      company: 'TechStartup Inc.',
      content: 'Нашел отличного разработчика для нашего проекта. Работа выполнена досрочно, качество на высшем уровне. WorkFinder значительно упростил поиск специалистов.',
      rating: 5,
    },
    {
      id: '2',
      name: 'Анна Сидорова',
      role: 'Маркетинг-директор',
      company: 'RetailBrand',
      content: 'Работа с фрилансерами через платформу экономит нам до 40% времени на поиск и найм. Система рейтингов и отзывов помогает выбрать лучшего исполнителя.',
      rating: 5,
    },
    {
      id: '3',
      name: 'Михаил Козлов',
      role: 'Дизайнер-фрилансер',
      company: 'Freelance',
      content: 'За год работы через WorkFinder мой доход вырос в 3 раза. Платформа предоставляет постоянный поток качественных проектов от проверенных клиентов.',
      rating: 5,
    }
  ]

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Отзывы наших пользователей</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Более 5000 клиентов и фрилансеров доверяют нашей платформе
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="mb-6">
                  <Quote className="h-8 w-8 text-blue-100" />
                </div>
                
                <p className="text-gray-600 mb-6 italic">"{testimonial.content}"</p>
                
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={testimonial.avatar} />
                    <AvatarFallback>
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-bold">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">
                      {testimonial.role}, {testimonial.company}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="font-bold">{testimonial.rating}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
          <div className="text-center max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">Присоединяйтесь к сообществу</h3>
            <p className="mb-6 opacity-90">
              Более 10,000 фрилансеров и 5,000 компаний уже используют WorkFinder
              для успешного сотрудничества
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors">
                Стать фрилансером
              </button>
              <button className="px-6 py-3 bg-transparent border-2 border-white font-semibold rounded-lg hover:bg-white/10 transition-colors">
                Найти исполнителя
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}