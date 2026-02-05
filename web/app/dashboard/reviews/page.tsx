'use client'

export default function ReviewsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Отзывы</h1>
      <p className="text-gray-600 mb-8">Отзывы клиентов о вашей работе</p>
      
      <div className="space-y-6">
        <div className="border rounded-lg p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
            <div>
              <div className="font-bold">Иван Иванов</div>
              <div className="text-gray-600">Клиент проекта</div>
            </div>
          </div>
          <p className="text-gray-700 mb-4">
            Отличный специалист! Работа выполнена качественно и в срок.
          </p>
          <div className="text-sm text-gray-500">Декабрь 2023</div>
        </div>
        
        <div className="border rounded-lg p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
            <div>
              <div className="font-bold">Анна Петрова</div>
              <div className="text-gray-600">Клиент проекта</div>
            </div>
          </div>
          <p className="text-gray-700 mb-4">
            Профессиональный подход, внимателен к деталям.
          </p>
          <div className="text-sm text-gray-500">Ноябрь 2023</div>
        </div>
      </div>
    </div>
  )
}