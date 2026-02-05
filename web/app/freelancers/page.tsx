export default function FreelancersPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Фрилансеры</h1>
      <p className="text-gray-600 mb-8">Найдите подходящего специалиста для вашего проекта</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="border rounded-lg p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
            <div>
              <div className="font-bold">Иван Иванов</div>
              <div className="text-gray-600">Веб-разработчик</div>
            </div>
          </div>
          <p className="text-gray-600 mb-4">Специализация: React, Next.js, TypeScript</p>
          <div className="text-green-600 font-bold">4.9 ★</div>
        </div>
        
        <div className="border rounded-lg p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
            <div>
              <div className="font-bold">Анна Петрова</div>
              <div className="text-gray-600">Дизайнер</div>
            </div>
          </div>
          <p className="text-gray-600 mb-4">Специализация: UI/UX, Figma, Adobe XD</p>
          <div className="text-green-600 font-bold">4.8 ★</div>
        </div>
      </div>
    </div>
  )
}