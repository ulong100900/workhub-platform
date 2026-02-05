import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Предопределенные категории
const DEFAULT_CATEGORIES = [
  {
    id: 'it-programming',
    name: 'IT и программирование',
    icon: '💻',
    description: 'Разработка, тестирование, администрирование',
    subcategories: [
      'Веб-разработка',
      'Мобильная разработка',
      'Разработка игр',
      'DevOps',
      'Тестирование',
      'Data Science',
      'Машинное обучение',
      'Кибербезопасность',
      'Blockchain',
      '1C программирование',
    ],
    popular: true,
    order: 1,
  },
  {
    id: 'design',
    name: 'Дизайн',
    icon: '🎨',
    description: 'UI/UX, графика, анимация',
    subcategories: [
      'UI/UX дизайн',
      'Графический дизайн',
      'Веб-дизайн',
      'Дизайн интерьеров',
      'Логотипы и брендинг',
      'Иллюстрации',
      '3D-моделирование',
      'Моушн-дизайн',
    ],
    popular: true,
    order: 2,
  },
  {
    id: 'text-translation',
    name: 'Тексты и переводы',
    icon: '📝',
    description: 'Копирайтинг, перевод, редактирование',
    subcategories: [
      'Копирайтинг',
      'Рерайтинг',
      'Переводы',
      'Редактирование',
      'Наполнение сайтов',
      'Сценарии',
      'Технические тексты',
      'СММ тексты',
    ],
    popular: true,
    order: 3,
  },
  {
    id: 'marketing',
    name: 'Маркетинг',
    icon: '📈',
    description: 'SMM, SEO, контекстная реклама',
    subcategories: [
      'SMM',
      'SEO',
      'Контекстная реклама',
      'Таргетированная реклама',
      'Email-маркетинг',
      'Аналитика',
      'Контент-маркетинг',
      'PR',
    ],
    popular: true,
    order: 4,
  },
  {
    id: 'video-animation',
    name: 'Видео и анимация',
    icon: '🎬',
    description: 'Монтаж, анимация, спецэффекты',
    subcategories: [
      'Видеомонтаж',
      'Анимация',
      'Создание видео',
      'Спецэффекты',
      'Озвучка',
      'Субтитры',
      'Видеообработка',
    ],
    popular: false,
    order: 5,
  },
  {
    id: 'audio-music',
    name: 'Музыка и аудио',
    icon: '🎵',
    description: 'Создание музыки, звуковой дизайн',
    subcategories: [
      'Создание музыки',
      'Звуковой дизайн',
      'Озвучка',
      'Сведение',
      'Мастеринг',
      'Саунд-продюсирование',
    ],
    popular: false,
    order: 6,
  },
  {
    id: 'business-finance',
    name: 'Бизнес и финансы',
    icon: '💰',
    description: 'Консалтинг, бухгалтерия, аналитика',
    subcategories: [
      'Бизнес-консалтинг',
      'Бухгалтерия',
      'Финансовый анализ',
      'Юридические услуги',
      'HR и рекрутинг',
      'Планирование',
    ],
    popular: false,
    order: 7,
  },
  {
    id: 'education-consulting',
    name: 'Образование и консультации',
    icon: '📚',
    description: 'Обучение, коучинг, консультации',
    subcategories: [
      'Репетиторство',
      'Онлайн-курсы',
      'Коучинг',
      'Консультации',
      'Тренинги',
      'Развитие навыков',
    ],
    popular: false,
    order: 8,
  },
  {
    id: 'construction-repair',
    name: 'Строительство и ремонт',
    icon: '🔨',
    description: 'Ремонт, строительство, проектирование',
    subcategories: [
      'Ремонт квартир',
      'Строительство домов',
      'Дизайн интерьеров',
      'Проектирование',
      'Электрика',
      'Сантехника',
      'Отделочные работы',
    ],
    popular: false,
    order: 9,
  },
  {
    id: 'beauty-health',
    name: 'Красота и здоровье',
    icon: '💅',
    description: 'Красота, здоровье, фитнес',
    subcategories: [
      'Парикмахерские услуги',
      'Косметология',
      'Маникюр',
      'Фитнес-тренер',
      'Массаж',
      'Диетология',
    ],
    popular: false,
    order: 10,
  },
  {
    id: 'other',
    name: 'Другое',
    icon: '📦',
    description: 'Другие услуги',
    subcategories: [
      'Фотография',
      'Организация мероприятий',
      'Доставка',
      'Уборка',
      'Уход за животными',
      'Персональный помощник',
    ],
    popular: false,
    order: 11,
  },
]

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { searchParams } = new URL(request.url)
    const withPopular = searchParams.get('popular') === 'true'
    const withSubcategories = searchParams.get('subcategories') === 'true'

    // В реальном проекте здесь будет запрос к базе данных
    // Сейчас возвращаем предопределенные категории

    let categories = DEFAULT_CATEGORIES

    // Фильтрация популярных категорий
    if (withPopular) {
      categories = categories.filter(cat => cat.popular)
    }

    // Убираем подкатегории если не нужны
    if (!withSubcategories) {
      categories = categories.map(({ subcategories, ...rest }) => rest)
    }

    // Получаем статистику по категориям из базы данных
    try {
      const { data: stats } = await supabase
        .from('category_stats')
        .select('*')
      
      if (stats) {
        categories = categories.map(cat => {
          const stat = stats.find(s => s.category_id === cat.id)
          return {
            ...cat,
            stats: stat || {
              total_orders: 0,
              active_orders: 0,
              total_executors: 0,
              avg_price: 0,
            },
          }
        })
      }
    } catch (error) {
      console.error('Ошибка получения статистики категорий:', error)
    }

    return NextResponse.json({
      success: true,
      data: {
        categories,
        total: categories.length,
      },
    })
  } catch (error: any) {
    console.error('Ошибка получения категорий:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Не удалось получить категории',
        data: {
          categories: DEFAULT_CATEGORIES,
          total: DEFAULT_CATEGORIES.length,
        },
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Проверяем авторизацию и права администратора
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      )
    }

    // Проверяем, является ли пользователь администратором
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Недостаточно прав' },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    // Валидация данных категории
    const { name, icon, description, subcategories, order, popular } = body

    if (!name || !icon || !description) {
      return NextResponse.json(
        { error: 'Название, иконка и описание обязательны' },
        { status: 400 }
      )
    }

    // Генерируем ID из названия
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')

    // Создаем категорию в базе данных
    const { data: category, error } = await supabase
      .from('categories')
      .insert([
        {
          id,
          name,
          icon,
          description,
          subcategories: subcategories || [],
          order: order || 99,
          popular: popular || false,
          created_by: user.id,
        },
      ])
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // unique violation
        return NextResponse.json(
          { error: 'Категория с таким названием уже существует' },
          { status: 409 }
        )
      }
      throw error
    }

    return NextResponse.json({
      success: true,
      message: 'Категория успешно создана',
      data: { category },
    })
  } catch (error: any) {
    console.error('Ошибка создания категории:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Не удалось создать категорию',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}