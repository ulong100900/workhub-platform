// app/api/bids/public/route.ts - ПОЛНОСТЬЮ ПЕРЕПИСАННЫЙ
import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic'

// Временные мок-данные для тестирования
const mockBids = [
  {
    id: '1',
    proposal: 'Готов выполнить проект в кратчайшие сроки. Имею опыт в разработке подобных систем.',
    price: 25000,
    delivery_days: 14,
    status: 'pending' as const,
    created_at: '2024-01-15T10:30:00Z',
    order: {
      id: '101',
      title: 'Разработка сайта для интернет-магазина',
      budget: 30000,
      status: 'published',
      category: 'Веб-разработка'
    },
    freelancer: {
      id: 'f1',
      full_name: 'Иван Петров',
      avatar_url: null,
      rating: 4.8,
      completed_projects: 42,
      specialization: 'Fullstack разработчик'
    }
  },
  {
    id: '2',
    proposal: 'Создам современный дизайн с адаптивной версткой.',
    price: 18000,
    delivery_days: 10,
    status: 'accepted' as const,
    created_at: '2024-01-14T14:20:00Z',
    order: {
      id: '102',
      title: 'Дизайн мобильного приложения',
      budget: 20000,
      status: 'published',
      category: 'Дизайн'
    },
    freelancer: {
      id: 'f2',
      full_name: 'Анна Сидорова',
      avatar_url: null,
      rating: 4.9,
      completed_projects: 28,
      specialization: 'UI/UX дизайнер'
    }
  },
  {
    id: '3',
    proposal: 'Напишу качественный контент для вашего блога.',
    price: 8000,
    delivery_days: 5,
    status: 'pending' as const,
    created_at: '2024-01-13T09:15:00Z',
    order: {
      id: '103',
      title: 'Написание статей для IT-блога',
      budget: 10000,
      status: 'published',
      category: 'Копирайтинг'
    },
    freelancer: {
      id: 'f3',
      full_name: 'Михаил Козлов',
      avatar_url: null,
      rating: 4.7,
      completed_projects: 35,
      specialization: 'Технический писатель'
    }
  },
  {
    id: '4',
    proposal: 'Проведу полный анализ вашего проекта.',
    price: 15000,
    delivery_days: 7,
    status: 'accepted' as const,
    created_at: '2024-01-12T16:45:00Z',
    order: {
      id: '104',
      title: 'Анализ производительности веб-приложения',
      budget: 18000,
      status: 'published',
      category: 'Аналитика'
    },
    freelancer: {
      id: 'f4',
      full_name: 'Ольга Николаева',
      avatar_url: null,
      rating: 4.6,
      completed_projects: 19,
      specialization: 'Аналитик данных'
    }
  },
  {
    id: '5',
    proposal: 'Создам Telegram бота с интеграцией платежной системы.',
    price: 12000,
    delivery_days: 12,
    status: 'pending' as const,
    created_at: '2024-01-11T11:10:00Z',
    order: {
      id: '105',
      title: 'Разработка Telegram бота',
      budget: 15000,
      status: 'published',
      category: 'Боты'
    },
    freelancer: {
      id: 'f5',
      full_name: 'Дмитрий Волков',
      avatar_url: null,
      rating: 4.5,
      completed_projects: 31,
      specialization: 'Разработчик ботов'
    }
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const category = searchParams.get('category');

    // Для начала используем мок-данные
    let filteredBids = [...mockBids];

    // Применяем фильтры к мок-данным
    if (status && status !== 'all') {
      filteredBids = filteredBids.filter(bid => bid.status === status);
    }

    if (category && category !== 'all') {
      filteredBids = filteredBids.filter(bid => bid.order.category === category);
    }

    if (search) {
      const searchQuery = search.toLowerCase();
      filteredBids = filteredBids.filter(bid => 
        bid.proposal.toLowerCase().includes(searchQuery) ||
        bid.order.title.toLowerCase().includes(searchQuery) ||
        bid.freelancer.full_name.toLowerCase().includes(searchQuery) ||
        bid.freelancer.specialization.toLowerCase().includes(searchQuery)
      );
    }

    return NextResponse.json({
      success: true,
      bids: filteredBids,
    });
  } catch (error) {
    console.error('Error in public bids API:', error);
    return NextResponse.json(
      { success: false, error: 'Внутренняя ошибка сервера', bids: [] },
      { status: 200 }
    );
  }
}