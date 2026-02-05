import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Проверяем, что пользователь - владелец проекта
    const { data: project } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', params.id)
      .single();

    if (!project || project.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Получаем отклики с информацией о фрилансерах
    const { data: bids, error } = await supabase
      .from('bids')
      .select(`
        *,
        freelancer:profiles!bids_freelancer_id_fkey (
          id,
          full_name,
          avatar_url,
          rating,
          completed_projects
        )
      `)
      .eq('project_id', params.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data: bids || [] });
  } catch (error) {
    console.error('Error fetching bids:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bids' },
      { status: 500 }
    );
  }
}