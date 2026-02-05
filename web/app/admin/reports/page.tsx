'use client'

import { useState } from 'react' // УБРАЛ useEffect
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function ReportsPage() {
  const [reports] = useState([
    { id: 1, name: 'Отчет по доходам', type: 'Финансы', date: 'Январь 2024' },
    { id: 2, name: 'Активность пользователей', type: 'Аналитика', date: 'Декабрь 2023' },
    { id: 3, name: 'Проектная статистика', type: 'Проекты', date: 'Ноябрь 2023' },
  ])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Отчеты и аналитика</h1>
        <p className="text-gray-600">Статистика и аналитические отчеты платформы</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Общая статистика</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="text-2xl font-bold">1,245</div>
                <div className="text-gray-600">Активных пользователей</div>
              </div>
              <div>
                <div className="text-2xl font-bold">4,890</div>
                <div className="text-gray-600">Завершенных проектов</div>
              </div>
              <div>
                <div className="text-2xl font-bold">89.2M ₽</div>
                <div className="text-gray-600">Общий оборот</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Недавние отчеты</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">{report.name}</div>
                    <div className="text-sm text-gray-500">{report.date}</div>
                  </div>
                  <Badge variant="outline">{report.type}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Быстрые действия</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button className="w-full">Сгенерировать финансовый отчет</Button>
              <Button variant="outline" className="w-full">Экспорт данных</Button>
              <Button variant="outline" className="w-full">Настройки отчетов</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>История отчетов</CardTitle>
          <CardDescription>Все сгенерированные отчеты</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <div className="font-medium">{report.name}</div>
                    <Badge variant="secondary">{report.type}</Badge>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">Создан: {report.date}</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">Просмотр</Button>
                  <Button size="sm">Скачать</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}