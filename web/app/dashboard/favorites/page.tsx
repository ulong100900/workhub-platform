// app/dashboard/favorites/page.tsx
import { createClient } from '@/lib/supabase/server'
import ProjectCard from '@/components/projects/ProjectCard'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Heart } from 'lucide-react'
import Link from 'next/link'

// Функция для получения избранных проектов текущего пользователя
async function getFavorites() {
  const supabase = await createClient()
  
  // Получаем текущего пользователя
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    console.error('Auth error:', authError)
    redirect('/login')
  }

  try {
    // Получаем избранные проекты пользователя
    const { data: favorites, error: favoritesError } = await supabase
      .from('project_favorites')
      .select(`
        project_id,
        created_at,
        projects:project_id (
          id,
          title,
          description,
          category,
          subcategory,
          budget,
          city,
          region,
          urgent,
          remote,
          created_at,
          deadline,
          status,
          skills,
          proposalsCount,
          views_count,
          images,
          user_id,
          profiles:user_id (
            id,
            full_name,
            avatar_url,
            rating,
            company_name
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (favoritesError) {
      console.error('Error fetching favorites:', favoritesError)
      return []
    }

    // Преобразуем данные в формат, ожидаемый ProjectCard
    const transformedFavorites = favorites.map(fav => {
      const project = fav.projects
      return {
        id: project.id,
        title: project.title,
        description: project.description,
        category: project.category || 'other',
        budget: project.budget || 0,
        city: project.city || '',
        region: project.region || '',
        urgent: project.urgent || false,
        remote: project.remote || false,
        createdAt: project.created_at,
        deadline: project.deadline,
        status: project.status || 'published',
        skills: project.skills || [],
        proposalsCount: project.proposalsCount || 0,
        views_count: project.views_count || 0,
        images: project.images || [],
        is_favorite: true,
        user: project.profiles ? {
          id: project.profiles.id,
          name: project.profiles.full_name || 'Аноним',
          avatar: project.profiles.avatar_url,
          rating: project.profiles.rating || 0,
          company_name: project.profiles.company_name
        } : null
      }
    })

    return transformedFavorites
  } catch (error) {
    console.error('Error in getFavorites:', error)
    return []
  }
}

export default async function FavoritesPage() {
  const favorites = await getFavorites()

  // Функции-заглушки для обработчиков
  const handleViewDetails = (id: string) => {
    console.log('View details:', id)
    // В реальном приложении здесь будет навигация
  }

  const handleApply = (id: string) => {
    console.log('Apply to project:', id)
  }

  const handleToggleFavorite = async (projectId: string, isFavorite: boolean) => {
    console.log('Toggle favorite:', projectId, isFavorite)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Избранные проекты</h1>
        <p className="text-gray-600">
          Здесь собраны все проекты, которые вы добавили в избранное
        </p>
      </div>
      
      {favorites.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <Heart className="h-8 w-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Нет избранных проектов</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Добавляйте проекты в избранное, чтобы быстро находить их позже
          </p>
          <Button asChild>
            <Link href="/projects">
              Найти проекты
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                Всего избранных проектов: <span className="font-semibold">{favorites.length}</span>
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Сортировка
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((project) => (
              <ProjectCard 
                key={project.id} 
                project={project}
                onViewDetails={handleViewDetails}
                onApply={handleApply}
                onToggleFavorite={handleToggleFavorite}
                showFavoriteButton={true}
                showModerationInfo={false}
              />
            ))}
          </div>

          {/* Статистика по статусам проектов */}
          <div className="mt-8 pt-8 border-t">
            <h3 className="text-lg font-semibold mb-4">Статистика по избранным</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-700 mb-1">Активных</p>
                <p className="text-2xl font-bold">
                  {favorites.filter(p => p.status === 'published').length}
                </p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-700 mb-1">В работе</p>
                <p className="text-2xl font-bold">
                  {favorites.filter(p => p.status === 'in_progress').length}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-700 mb-1">Завершенных</p>
                <p className="text-2xl font-bold">
                  {favorites.filter(p => p.status === 'completed').length}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700 mb-1">Всего</p>
                <p className="text-2xl font-bold">{favorites.length}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}