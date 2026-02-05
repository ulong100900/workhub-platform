import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendPushNotification } from '@/lib/onesignal';

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

    const { rating, review, finalAmount } = await request.json();

    // Проверяем, что пользователь - владелец проекта
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*, freelancer_id, title, user_id')
      .eq('id', params.id)
      .single();

    if (projectError) throw projectError;

    if (!project || project.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    if (project.status !== 'in_progress') {
      return NextResponse.json(
        { error: 'Проект не находится в работе' },
        { status: 400 }
      );
    }

    // Обновляем статус проекта
    const { error: updateError } = await supabase
      .from('projects')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString(),
        final_amount: finalAmount || project.budget
      })
      .eq('id', params.id);

    if (updateError) throw updateError;

    // Если есть отзыв и рейтинг, создаем запись
    if (rating && review) {
      const { error: reviewError } = await supabase
        .from('reviews')
        .insert({
          project_id: params.id,
          reviewer_id: user.id,
          reviewee_id: project.freelancer_id,
          rating: rating,
          comment: review,
          created_at: new Date().toISOString(),
        });

      if (reviewError) {
        console.error('Error creating review:', reviewError);
      }

      // Обновляем рейтинг фрилансера
      const { data: existingReviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('reviewee_id', project.freelancer_id);

      if (existingReviews && existingReviews.length > 0) {
        const avgRating = existingReviews.reduce((sum, r) => sum + r.rating, 0) / existingReviews.length;
        
        await supabase
          .from('profiles')
          .update({ rating: avgRating })
          .eq('id', project.freelancer_id);
      }
    }

    // Создаем уведомление для фрилансера
    const { data: clientProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: project.freelancer_id,
        project_id: params.id,
        type: 'project_completed',
        title: 'Проект завершен!',
        message: `${clientProfile?.full_name || 'Заказчик'} завершил проект "${project.title}"`,
        metadata: {
          project_title: project.title,
          final_amount: finalAmount || project.budget,
          rating: rating || null
        },
        is_read: false,
        created_at: new Date().toISOString(),
      });

    // Отправляем пуш-уведомление фрилансеру
    if (!notificationError && project.freelancer_id) {
      await sendPushNotification({
        userId: project.freelancer_id,
        title: '✅ Проект завершен',
        message: `Заказчик завершил проект "${project.title}"`,
        url: `/dashboard/projects/${params.id}`,
        data: {
          type: 'project_completed',
          projectId: params.id
        }
      });
    }

    // Обновляем статистику фрилансера
    const { data: freelancerStats } = await supabase
      .from('profiles')
      .select('completed_projects, total_earnings')
      .eq('id', project.freelancer_id)
      .single();

    if (freelancerStats) {
      await supabase
        .from('profiles')
        .update({
          completed_projects: (freelancerStats.completed_projects || 0) + 1,
          total_earnings: (freelancerStats.total_earnings || 0) + (finalAmount || project.budget || 0)
        })
        .eq('id', project.freelancer_id);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Проект успешно завершен' 
    });
  } catch (error) {
    console.error('Error completing project:', error);
    return NextResponse.json(
      { error: 'Failed to complete project' },
      { status: 500 }
    );
  }
}