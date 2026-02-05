// /web/app/dashboard/my-projects/page.tsx
import MyProjectsClient from './MyProjectsClient'
import { createClient } from '@/lib/supabase/server'

export default async function MyProjectsPage() {
  const supabase = await createClient()
  
  // Получаем пользователя
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Не авторизован</h2>
        <p className="text-gray-600 mt-2">Пожалуйста, войдите в систему</p>
      </div>
    )
  }

  // Получаем проекты пользователя
  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .eq('client_id', user.id)
    .order('created_at', { ascending: false })

  return <MyProjectsClient initialProjects={projects || []} />
}