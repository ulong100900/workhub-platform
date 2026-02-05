import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Проверка авторизации
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Получаем избранные проекты пользователя
    const { data: favorites, error: favoritesError } = await supabase
      .from('user_favorites') // Нужно создать эту таблицу
      .select('project_id')
      .eq('user_id', user.id);

    if (favoritesError) throw favoritesError;

    if (!favorites?.length) {
      return NextResponse.json({ data: [] });
    }

    const projectIds = favorites.map(f => f.project_id);
    
    // Получаем информацию о проектах
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .in('id', projectIds);

    if (projectsError) throw projectsError;

    return NextResponse.json({ data: projects || [] });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json(
      { error: 'Failed to fetch favorites' },
      { status: 500 }
    );
  }
}