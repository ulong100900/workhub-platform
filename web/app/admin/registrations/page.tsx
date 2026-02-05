'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Calendar, User, Mail, Phone, Search } from 'lucide-react'

export default function RegistrationsPage() {
  const [search, setSearch] = useState('')
  
  const registrations = [
    {
      id: '1',
      name: 'Иван Иванов',
      email: 'ivan@example.com',
      phone: '+7 (999) 123-45-67',
      date: '2024-01-15',
      status: 'approved',
      type: 'freelancer'
    },
    {
      id: '2',
      name: 'Анна Петрова',
      email: 'anna@example.com',
      phone: '+7 (999) 765-43-21',
      date: '2024-01-14',
      status: 'pending',
      type: 'client'
    },
    {
      id: '3',
      name: 'Петр Сидоров',
      email: 'petr@example.com',
      phone: '+7 (999) 111-22-33',
      date: '2024-01-13',
      status: 'rejected',
      type: 'freelancer'
    }
  ]

  const filteredRegistrations = registrations.filter(reg =>
    reg.name.toLowerCase().includes(search.toLowerCase()) ||
    reg.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Регистрации пользователей</h1>
        <p className="text-gray-600">Управление регистрациями новых пользователей</p>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Поиск по имени или email..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline">Экспорт</Button>
              <Button>Фильтры</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Список регистраций</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Пользователь</TableHead>
                <TableHead>Контакт</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRegistrations.map((reg) => (
                <TableRow key={reg.id}>
                  <TableCell>
                    <div className="font-medium">{reg.name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3 text-gray-500" />
                        <span className="text-sm">{reg.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3 text-gray-500" />
                        <span className="text-sm">{reg.phone}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-gray-500" />
                      {new Date(reg.date).toLocaleDateString('ru-RU')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={reg.type === 'freelancer' ? 'default' : 'secondary'}>
                      {reg.type === 'freelancer' ? 'Фрилансер' : 'Клиент'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        reg.status === 'approved' ? 'default' :
                        reg.status === 'pending' ? 'outline' : 'destructive'
                      }
                    >
                      {reg.status === 'approved' ? 'Подтвержден' :
                       reg.status === 'pending' ? 'В ожидании' : 'Отклонен'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <User className="h-3 w-3 mr-1" />
                        Профиль
                      </Button>
                      <Button size="sm">Действия</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}