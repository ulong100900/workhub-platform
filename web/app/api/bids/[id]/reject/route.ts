import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Получаем информацию об отклике
    const { data: bid } = await supabase
      .from('bids')
      .select('project_id, project:projects(title, user_id)')
      .eq('id', params.id)
      .single();

    if (!bid) {
      return NextResponse.json(
        { error: 'Bid not found' },
        { status: 404 }
      );
    }

    // Проверяем, что пользователь - владелец проекта
    if (bid.project.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Обновляем статус отклика на 'rejected'
    const { error } = await supabase
      .from('bids')
      .update({ 
        status: 'rejected',
        rejected_at: new Date().toISOString()
      })
      .eq('id', params.id);

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      message: 'Отклик отклонен' 
    });
  } catch (error) {
    console.error('Error rejecting bid:', error);
    return NextResponse.json(
      { error: 'Failed to reject bid' },
      { status: 500 }
    );
  }
}