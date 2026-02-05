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

    const { projectId, freelancerId } = await request.json();

    // Проверяем, что пользователь - владелец проекта
    const { data: project } = await supabase
      .from('projects')
      .select('id, title, user_id, budget')
      .eq('id', projectId)
      .single();

    if (!project || project.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Обновляем статус выбранного отклика на 'accepted'
    const { error: acceptError } = await supabase
      .from('bids')
      .update({ 
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', params.id);

    if (acceptError) throw acceptError;

    // Отклоняем все остальные отклики на этот проект
    const { error: rejectError } = await supabase
      .from('bids')
      .update({ status: 'rejected' })
      .eq('project_id', projectId)
      .neq('id', params.id);

    if (rejectError) throw rejectError;

    // Обновляем статус проекта
    const { error: projectError } = await supabase
      .from('projects')
      .update({ 
        status: 'in_progress',
        freelancer_id: freelancerId,
        accepted_bid_id: params.id
      })
      .eq('id', projectId);

    if (projectError) throw projectError;

    // Получаем информацию о заказчике для уведомления
    const { data: client } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    // Создаем уведомление для фрилансера в базе данных
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: freelancerId,
        project_id: projectId,
        bid_id: params.id,
        type: 'bid_accepted',
        title: 'Ваш отклик принят!',
        message: `${client?.full_name || 'Заказчик'} принял ваш отклик на проект "${project.title}"`,
        metadata: {
          project_title: project.title,
          amount: project.budget,
          project_id: projectId,
          client_name: client?.full_name,
          client_id: user.id
        },
        is_read: false,
        created_at: new Date().toISOString(),
      });

    if (notificationError) {
      console.error('Notification creation error:', notificationError);
    }

    // Отправляем пуш-уведомление фрилансеру через OneSignal
    try {
      await sendPushNotification({
        userId: freelancerId,
        title: '🎉 Ваш отклик принят!',
        message: `Заказчик принял ваш отклик на проект "${project.title}"`,
        url: `/dashboard/messages?project=${projectId}`,
        data: {
          type: 'bid_accepted',
          projectId,
          bidId: params.id,
          projectTitle: project.title,
          clientId: user.id,
          clientName: client?.full_name || 'Заказчик'
        }
      });
    } catch (pushError) {
      console.error('Push notification error:', pushError);
      // Не прерываем выполнение, если пуш-уведомление не отправилось
    }

    // Также отправляем уведомление заказчику о начале работы
    try {
      await sendPushNotification({
        userId: user.id,
        title: '🚀 Проект начат',
        message: `Вы приняли отклик на проект "${project.title}". Начните общение с исполнителем.`,
        url: `/dashboard/my-projects?project=${projectId}`,
        data: {
          type: 'project_started',
          projectId,
          bidId: params.id,
          freelancerId,
          projectTitle: project.title
        }
      });
    } catch (clientPushError) {
      console.error('Client push notification error:', clientPushError);
    }

    // Создаем начальное сообщение в чате
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        receiver_id: freelancerId,
        project_id: projectId,
        message: `Здравствуйте! Я принял ваш отклик на проект "${project.title}". Давайте обсудим детали!`,
        created_at: new Date().toISOString(),
      });

    if (messageError) {
      console.error('Message creation error:', messageError);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Отклик успешно принят' 
    });
  } catch (error) {
    console.error('Error accepting bid:', error);
    return NextResponse.json(
      { error: 'Failed to accept bid' },
      { status: 500 }
    );
  }
}