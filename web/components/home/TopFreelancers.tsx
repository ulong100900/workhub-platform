'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Star, MapPin, Briefcase, CheckCircle } from 'lucide-react'
import Link from 'next/link'

interface Freelancer {
  id: string
  name: string
  title: string
  rating: number
  reviews: number
  hourlyRate: number
  skills: string[]
  location: string
  completedProjects: number
  avatar?: string
  isVerified: boolean
}

export default function TopFreelancers() {
  const freelancers: Freelancer[] = [
    {
      id: '1',
      name: 'Александр Иванов',
      title: 'Senior React Developer',
      rating: 4.9,
      reviews: 127,
      hourlyRate: 3000,
      skills: ['React', 'TypeScript', 'Next.js', 'Node.js'],
      location: 'Москва',
      completedProjects: 89,
      isVerified: true
    },
    {
      id: '2',
      name: 'Мария Смирнова',
      title: 'UI/UX Designer',
      rating: 4.8,
      reviews: 94,
      hourlyRate: 2500,
      skills: ['Figma', 'UI/UX', 'Web Design', 'Prototyping'],
      location: 'Санкт-Петербург',
      completedProjects: 67,
      isVerified: true
    },
    {
      id: '3',
      name: 'Дмитрий Петров',
      title: 'Full Stack Developer',
      rating: 5.0,
      reviews: 156,
      hourlyRate: 4000,
      skills: ['Python', 'Django', 'React', 'AWS'],
      location: 'Удаленно',
      completedProjects: 112,
      isVerified: true
    },
    {
      id: '4',
      name: 'Ольга Кузнецова',
      title: 'SEO Specialist',
      rating: 4.7,
      reviews: 73,
      hourlyRate: 2000,
      skills: ['SEO', 'Content', 'Analytics', 'PPC'],
      location: 'Новосибирск',
      completedProjects: 45,
      isVerified: false
    }
  ]

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Топ фрилансеры месяца</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Лучшие исполнители, получившие высокие оценки от клиентов
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {freelancers.map((freelancer) => (
            <Card key={freelancer.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="relative mb-4">
                    <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                      <AvatarImage src={freelancer.avatar} />
                      <AvatarFallback className="text-xl">
                        {freelancer.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    {freelancer.isVerified && (
                      <div className="absolute -bottom-2 -right-2 bg-blue-500 rounded-full p-1 border-4 border-white">
                        <CheckCircle className="h-5 w-5 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <h3 className="font-bold text-lg mb-1">{freelancer.name}</h3>
                  <p className="text-gray-600 text-sm mb-2">{freelancer.title}</p>
                  
                  <div className="flex items-center gap-1 mb-3">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="font-bold">{freelancer.rating}</span>
                    <span className="text-gray-500 text-sm">
                      ({freelancer.reviews} отзывов)
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-gray-600">
                      <MapPin className="h-4 w-4" />
                      {freelancer.location}
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <Briefcase className="h-4 w-4" />
                      {freelancer.completedProjects}
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {freelancer.hourlyRate.toLocaleString()} ₽/час
                    </div>
                    <div className="text-sm text-gray-500">Ставка</div>
                  </div>

                  <div className="flex flex-wrap gap-1 justify-center">
                    {freelancer.skills.slice(0, 3).map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {freelancer.skills.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{freelancer.skills.length - 3}
                      </Badge>
                    )}
                  </div>

                  <Link href={`/freelancers/${freelancer.id}`}>
                    <Button variant="outline" className="w-full">
                      Посмотреть профиль
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Link href="/freelancers">
            <Button variant="outline" size="lg">
              Смотреть всех фрилансеров
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}