export default function HowItWorksPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Как это работает</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="text-center">
          <div className="text-4xl font-bold text-blue-600 mb-4">1</div>
          <h3 className="font-bold text-lg mb-2">Создайте проект</h3>
          <p className="text-gray-600">
            Опишите задачу, бюджет и сроки выполнения
          </p>
        </div>
        
        <div className="text-center">
          <div className="text-4xl font-bold text-blue-600 mb-4">2</div>
          <h3 className="font-bold text-lg mb-2">Выберите фрилансера</h3>
          <p className="text-gray-600">
            Получите предложения от специалистов
          </p>
        </div>
        
        <div className="text-center">
          <div className="text-4xl font-bold text-blue-600 mb-4">3</div>
          <h3 className="font-bold text-lg mb-2">Оплатите работу</h3>
          <p className="text-gray-600">
            Безопасная оплата после выполнения
          </p>
        </div>
      </div>
      
      <div className="bg-gray-50 p-8 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Преимущества платформы</h2>
        <ul className="space-y-3">
          <li className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Безопасные платежи с гарантией</span>
          </li>
          <li className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Проверенные фрилансеры</span>
          </li>
          <li className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Поддержка 24/7</span>
          </li>
        </ul>
      </div>
    </div>
  )
}