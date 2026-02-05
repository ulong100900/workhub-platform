// data/categories.ts
import React from 'react';

export interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
  subcategories: string[];
  count: number;
  color: string;
}

// Иконки в стиле Авито как React компоненты
export const Icons = {
  All: () => React.createElement('svg', {
    className: "h-5 w-5",
    fill: "currentColor",
    viewBox: "0 0 24 24"
  }, React.createElement('path', {
    d: "M10 3H4a1 1 0 00-1 1v6a1 1 0 001 1h6a1 1 0 001-1V4a1 1 0 00-1-1zM20 3h-6a1 1 0 00-1 1v6a1 1 0 001 1h6a1 1 0 001-1V4a1 1 0 00-1-1zM10 13H4a1 1 0 00-1 1v6a1 1 0 001 1h6a1 1 0 001-1v-6a1 1 0 00-1-1zM20 13h-6a1 1 0 00-1 1v6a1 1 0 001 1h6a1 1 0 001-1v-6a1 1 0 00-1-1z"
  })),
  
  Construction: () => React.createElement('svg', {
    className: "h-5 w-5",
    fill: "currentColor",
    viewBox: "0 0 24 24"
  }, React.createElement('path', {
    d: "M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"
  })),
  
  Tech: () => React.createElement('svg', {
    className: "h-5 w-5",
    fill: "currentColor",
    viewBox: "0 0 24 24"
  }, React.createElement('path', {
    d: "M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"
  })),
  
  Design: () => React.createElement('svg', {
    className: "h-5 w-5",
    fill: "currentColor",
    viewBox: "0 0 24 24"
  }, React.createElement('path', {
    d: "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
  })),
  
  Marketing: () => React.createElement('svg', {
    className: "h-5 w-5",
    fill: "currentColor",
    viewBox: "0 0 24 24"
  }, React.createElement('path', {
    d: "M9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4zm2 2H5V5h14v14zm0-16H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"
  })),
  
  Content: () => React.createElement('svg', {
    className: "h-5 w-5",
    fill: "currentColor",
    viewBox: "0 0 24 24"
  }, React.createElement('path', {
    d: "M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"
  })),
  
  Repair: () => React.createElement('svg', {
    className: "h-5 w-5",
    fill: "currentColor",
    viewBox: "0 0 24 24"
  }, React.createElement('path', {
    d: "M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-2 14l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"
  })),
  
  Business: () => React.createElement('svg', {
    className: "h-5 w-5",
    fill: "currentColor",
    viewBox: "0 0 24 24"
  }, React.createElement('path', {
    d: "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"
  })),
  
  Events: () => React.createElement('svg', {
    className: "h-5 w-5",
    fill: "currentColor",
    viewBox: "0 0 24 24"
  }, React.createElement('path', {
    d: "M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"
  })),
  
  Beauty: () => React.createElement('svg', {
    className: "h-5 w-5",
    fill: "currentColor",
    viewBox: "0 0 24 24"
  }, React.createElement('path', {
    d: "M12 2C8.14 2 5 5.14 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.86-3.14-7-7-7zm0 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 10c-1.67 0-3.14-.85-4-2.15.02-1.32 2.67-2.05 4-2.05s3.98.73 4 2.05c-.86 1.3-2.33 2.15-4 2.15z"
  })),
  
  Education: () => React.createElement('svg', {
    className: "h-5 w-5",
    fill: "currentColor",
    viewBox: "0 0 24 24"
  }, React.createElement('path', {
    d: "M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"
  })),
  
  Transport: () => React.createElement('svg', {
    className: "h-5 w-5",
    fill: "currentColor",
    viewBox: "0 0 24 24"
  }, React.createElement('path', {
    d: "M18.92 6.01C18.72 5.42 18.16 5 17.5 5H15V3H9v2H6.5c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"
  })),
  
  Cleaning: () => React.createElement('svg', {
    className: "h-5 w-5",
    fill: "currentColor",
    viewBox: "0 0 24 24"
  }, React.createElement('path', {
    d: "M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"
  }))
};
// В data/categories.ts обновляем интерфейс и данные
export interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
  subcategories: string[];
  count: number;
  color: string;
  allowRemote: boolean; // Добавляем флаг
}

export const mainCategories: Category[] = [
  {
    id: 'all',
    name: 'Все категории',
    icon: React.createElement(Icons.All),
    subcategories: [],
    count: 2847,
    color: 'bg-gray-100 text-gray-600',
    allowRemote: false
  },
  {
    id: 'construction',
    name: 'Строительство и ремонт',
    icon: React.createElement(Icons.Construction),
    subcategories: [
      'Ремонт квартир',
      'Отделочные работы',
      'Сантехника',
      'Электрика',
      'Строительство домов',
      'Окна и двери',
      'Кровельные работы',
      'Ландшафтный дизайн'
    ],
    count: 342,
    color: 'bg-orange-100 text-orange-600',
    allowRemote: false // Обычно требуется личное присутствие
  },
  {
    id: 'it_tech',
    name: 'IT и технологии',
    icon: React.createElement(Icons.Tech),
    subcategories: [
      'Веб-разработка',
      'Мобильные приложения',
      'Дизайн сайтов',
      'SEO-оптимизация',
      'Техническая поддержка',
      'Настройка серверов',
      'Кибербезопасность',
      'Обучение IT'
    ],
    count: 289,
    color: 'bg-blue-100 text-blue-600',
    allowRemote: true // IT работы можно выполнять удаленно
  },
  {
    id: 'design',
    name: 'Дизайн и творчество',
    icon: React.createElement(Icons.Design),
    subcategories: [
      'Графический дизайн',
      'UI/UX дизайн',
      '3D-моделирование',
      'Фотография',
      'Видеосъемка',
      'Иллюстрации',
      'Анимация',
      'Арт-объекты'
    ],
    count: 156,
    color: 'bg-purple-100 text-purple-600',
    allowRemote: true // Дизайн можно делать удаленно
  },
  {
    id: 'marketing',
    name: 'Маркетинг и реклама',
    icon: React.createElement(Icons.Marketing),
    subcategories: [
      'SMM-продвижение',
      'Контекстная реклама',
      'Копирайтинг',
      'Таргетированная реклама',
      'Маркетинговая аналитика',
      'Брендинг',
      'PR-кампании',
      'Email-маркетинг'
    ],
    count: 211,
    color: 'bg-green-100 text-green-600',
    allowRemote: true // Маркетинг можно делать удаленно
  },
  {
    id: 'content',
    name: 'Контент и текст',
    icon: React.createElement(Icons.Content),
    subcategories: [
      'Написание статей',
      'Ведение блога',
      'Редактура текстов',
      'Переводы',
      'Сценарии',
      'Корректура',
      'Написание книг',
      'Техническая документация'
    ],
    count: 187,
    color: 'bg-yellow-100 text-yellow-600',
    allowRemote: true // Работа с текстом удаленно
  },
  {
    id: 'repair',
    name: 'Ремонт техники',
    icon: React.createElement(Icons.Repair),
    subcategories: [
      'Ремонт компьютеров',
      'Ремонт телефонов',
      'Бытовая техника',
      'Электроника',
      'Сервисное обслуживание',
      'Ремонт автомобилей',
      'Установка техники',
      'Диагностика'
    ],
    count: 134,
    color: 'bg-red-100 text-red-600',
    allowRemote: false // Требуется личное присутствие
  },
  {
    id: 'business',
    name: 'Бизнес и консалтинг',
    icon: React.createElement(Icons.Business),
    subcategories: [
      'Бухгалтерия',
      'Юридические услуги',
      'Бизнес-планы',
      'Коучинг',
      'Финансовый аудит',
      'Налоговое консультирование',
      'Управление проектами',
      'Рекрутинг'
    ],
    count: 98,
    color: 'bg-indigo-100 text-indigo-600',
    allowRemote: true // Консультации можно проводить удаленно
  },
  {
    id: 'events',
    name: 'Организация мероприятий',
    icon: React.createElement(Icons.Events),
    subcategories: [
      'Ведущие мероприятий',
      'Оформление залов',
      'Кейтеринг',
      'Аниматоры',
      'Звук и свет',
      'Фотосессии',
      'Видеосъемка',
      'Развлекательная программа'
    ],
    count: 67,
    color: 'bg-pink-100 text-pink-600',
    allowRemote: false // Требуется личное присутствие
  },
  {
    id: 'beauty',
    name: 'Красота и здоровье',
    icon: React.createElement(Icons.Beauty),
    subcategories: [
      'Визажисты',
      'Парикмахеры',
      'Массаж',
      'Фитнес-тренеры',
      'Ногтевой сервис',
      'Косметология',
      'Стилисты',
      'Диетологи'
    ],
    count: 112,
    color: 'bg-rose-100 text-rose-600',
    allowRemote: false // Требуется личное присутствие
  },
  {
    id: 'education',
    name: 'Образование',
    icon: React.createElement(Icons.Education),
    subcategories: [
      'Репетиторство',
      'Языковые курсы',
      'Подготовка к экзаменам',
      'Онлайн-обучение',
      'Мастер-классы',
      'Курсы программирования',
      'Бизнес-тренинги',
      'Детские развивающие занятия'
    ],
    count: 145,
    color: 'bg-emerald-100 text-emerald-600',
    allowRemote: true // Обучение может быть онлайн
  },
  {
    id: 'transport',
    name: 'Транспорт и логистика',
    icon: React.createElement(Icons.Transport),
    subcategories: [
      'Грузоперевозки',
      'Пассажирские перевозки',
      'Такси и каршеринг',
      'Доставка товаров',
      'Международные перевозки',
      'Складская логистика',
      'Переезды',
      'Эвакуация автомобилей'
    ],
    count: 89,
    color: 'bg-cyan-100 text-cyan-600',
    allowRemote: false // Требуется физическое присутствие
  },
  {
    id: 'cleaning',
    name: 'Уборка и клининг',
    icon: React.createElement(Icons.Cleaning),
    subcategories: [
      'Генеральная уборка',
      'Ежедневная уборка',
      'Мытье окон',
      'Химчистка',
      'Уборка после ремонта',
      'Уход за территорией',
      'Дезинфекция помещений',
      'Уборка офисов'
    ],
    count: 76,
    color: 'bg-lime-100 text-lime-600',
    allowRemote: false // Требуется личное присутствие
  }
];

export const getCategoryById = (id: string): Category | undefined => {
  return mainCategories.find(cat => cat.id === id);
};

export const getAllSubcategories = (): string[] => {
  return mainCategories.flatMap(cat => cat.subcategories);
};