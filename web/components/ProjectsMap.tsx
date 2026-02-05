'use client'

interface Project {
  id: string
  title: string
  description: string
  location: { lat: number; lng: number }
  budget: { min: number; max: number }
  category: string
}

interface ProjectsMapProps {
  projects: Project[]
}

export default function ProjectsMap({ projects }: ProjectsMapProps) {
  return (
    <div className="h-full bg-gradient-to-br from-blue-50 to-gray-100 rounded-lg flex flex-col items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="inline-block p-4 bg-blue-100 rounded-full mb-6">
          <svg 
            className="w-12 h-12 text-blue-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
        </div>
        
        <h3 className="text-xl font-bold mb-3">Карта проектов</h3>
        <p className="text-gray-600 mb-6">
          Интерактивная карта с проектами в вашем регионе.
          {projects.length > 0 && ` Найдено ${projects.length} проектов.`}
        </p>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          {projects.slice(0, 4).map(project => (
            <div 
              key={project.id}
              className="p-3 bg-white border rounded-lg text-left"
            >
              <div className="font-medium text-sm mb-1">{project.title}</div>
              <div className="text-xs text-gray-500">
                {project.budget.min.toLocaleString()}₽
              </div>
            </div>
          ))}
        </div>
        
        <p className="text-sm text-gray-500">
          Для работы карты требуется API ключ (Google Maps, Яндекс.Карты или Leaflet)
        </p>
      </div>
    </div>
  )
}