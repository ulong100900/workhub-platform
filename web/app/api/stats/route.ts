import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Проверяем авторизацию (если требуется доступ только для администраторов)
    const { data: { user } } = await supabase.auth.getUser();
    
    // Если нужна защита только для админов, раскомментируйте:
    // if (!user || user.user_metadata?.role !== 'admin') {
    //   return NextResponse.json(
    //     { success: false, error: 'Unauthorized' },
    //     { status: 401 }
    //   );
    // }

    // 1. Получаем общее количество зарегистрированных пользователей
    // Используем таблицу auth.users, так как в Supabase она содержит всех пользователей
    const { count: totalUsers, error: usersError } = await supabase
      .from('auth.users') // Обращаемся напрямую к таблице auth.users
      .select('*', { count: 'exact', head: true });

    // 2. Получаем количество созданных проектов (все статусы)
    const { count: totalProjects, error: totalProjectsError } = await supabase
      .from('projects')
      .select('id', { count: 'exact', head: true });

    // 3. Получаем количество проектов в работе (status: 'in_progress')
    const { count: projectsInProgress, error: progressError } = await supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'in_progress');

    // 4. Получаем дополнительные статистики (опционально)
    // Количество активных (опубликованных) проектов
    const { count: publishedProjects, error: publishedError } = await supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published');

    // Количество завершенных проектов
    const { count: completedProjects, error: completedError } = await supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'completed');

    // 5. Получаем данные за последние 7 дней (для графиков)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // Проекты за последние 7 дней
    const { data: recentProjects, error: recentProjectsError } = await supabase
      .from('projects')
      .select('created_at, status')
      .gte('created_at', sevenDaysAgo.toISOString());

    // Пользователи за последние 7 дней
    const { data: recentUsers, error: recentUsersError } = await supabase
      .from('auth.users')
      .select('created_at')
      .gte('created_at', sevenDaysAgo.toISOString());

    // Проверяем основные ошибки
    if (usersError || totalProjectsError || progressError) {
      console.error('Errors:', { usersError, totalProjectsError, progressError });
      throw new Error('Error fetching main statistics');
    }

    // Формируем ответ
    const responseData = {
      // Основные метрики
      users: {
        total: totalUsers || 0,
        last7Days: recentUsers?.length || 0,
      },
      projects: {
        total: totalProjects || 0,
        inProgress: projectsInProgress || 0,
        published: publishedProjects || 0,
        completed: completedProjects || 0,
        last7Days: recentProjects?.length || 0,
      },
      // Дополнительная аналитика по дням
      analytics: {
        last7Days: {
          // Группируем проекты по дням за последнюю неделю
          projectsByDay: getProjectsByDay(recentProjects || []),
          usersByDay: getUsersByDay(recentUsers || []),
        },
      },
      // Рассчитываем проценты
      percentages: {
        projectsInProgressPercent: totalProjects ? 
          Math.round((projectsInProgress || 0) / totalProjects * 100) : 0,
        completionRate: totalProjects ? 
          Math.round((completedProjects || 0) / totalProjects * 100) : 0,
      },
      // Текущая дата для кэширования
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: responseData,
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    
    // Возвращаем fallback данные в случае ошибки
    return NextResponse.json({
      success: false,
      data: {
        users: {
          total: 0,
          last7Days: 0,
        },
        projects: {
          total: 0,
          inProgress: 0,
          published: 0,
          completed: 0,
          last7Days: 0,
        },
        analytics: {
          last7Days: {
            projectsByDay: [],
            usersByDay: [],
          },
        },
        percentages: {
          projectsInProgressPercent: 0,
          completionRate: 0,
        },
        timestamp: new Date().toISOString(),
      },
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// Вспомогательные функции для группировки по дням
function getProjectsByDay(projects: any[]) {
  const daysMap: Record<string, number> = {};
  
  projects.forEach(project => {
    const date = new Date(project.created_at).toISOString().split('T')[0];
    daysMap[date] = (daysMap[date] || 0) + 1;
  });

  // Создаем массив объектов для удобства отображения в графике
  return Object.entries(daysMap)
    .map(([date, count]) => ({
      date,
      count,
      projects: count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function getUsersByDay(users: any[]) {
  const daysMap: Record<string, number> = {};
  
  users.forEach(user => {
    const date = new Date(user.created_at).toISOString().split('T')[0];
    daysMap[date] = (daysMap[date] || 0) + 1;
  });

  return Object.entries(daysMap)
    .map(([date, count]) => ({
      date,
      count,
      users: count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}