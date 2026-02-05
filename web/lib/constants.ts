export const APP_NAME = 'WorkFinder'
export const APP_DESCRIPTION = 'Платформа для поиска исполнителей и заказов'
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export const ROLES = {
  CUSTOMER: 'customer',
  EXECUTOR: 'executor',
  ADMIN: 'admin',
} as const

export const ORDER_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const

export const BID_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
} as const

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const

export const SUBSCRIPTION_PLANS = {
  FREE: {
    id: 'free',
    name: 'Бесплатный',
    price: 0,
    features: [
      '3 активных заказа',
      '5 откликов в месяц',
      'Базовые уведомления',
    ],
  },
  BASIC: {
    id: 'basic',
    name: 'Базовый',
    price: 499,
    features: [
      '10 активных заказов',
      '20 откликов в месяц',
      'Приоритет в поиске',
      'Расширенные уведомления',
    ],
  },
  PRO: {
    id: 'pro',
    name: 'Профессиональный',
    price: 999,
    features: [
      'Неограниченное количество заказов',
      'Неограниченное количество откликов',
      'Высший приоритет в поиске',
      'Поддержка 24/7',
      'Аналитика и отчеты',
    ],
  },
} as const

export const CATEGORIES = [
  'IT и программирование',
  'Дизайн',
  'Тексты и переводы',
  'Маркетинг',
  'Видео и анимация',
  'Музыка и аудио',
  'Бизнес и финансы',
  'Образование и консультации',
  'Строительство и ремонт',
  'Красота и здоровье',
  'Другое',
] as const

export const CURRENCY = {
  SYMBOL: '₽',
  CODE: 'RUB',
} as const

export const DATE_FORMATS = {
  SHORT: 'dd.MM.yyyy',
  LONG: 'dd MMMM yyyy',
  WITH_TIME: 'dd.MM.yyyy HH:mm',
} as const

export const FILE_TYPES = {
  IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  DOCUMENT: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
} as const

export const API_ENDPOINTS = {
  ORDERS: '/api/orders',
  BIDS: '/api/bids',
  PROFILE: '/api/profile',
  PAYMENT: '/api/payment',
  NOTIFICATIONS: '/api/notifications',
  UPLOAD: '/api/upload',
} as const

export const VALIDATION = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^(\+7|8)[0-9]{10}$/,
  PASSWORD_MIN_LENGTH: 8,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,
} as const

export const LOCAL_STORAGE_KEYS = {
  THEME: 'workfinder-theme',
  USER_PREFERENCES: 'workfinder-preferences',
  RECENT_SEARCHES: 'workfinder-recent-searches',
} as const

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Ошибка сети. Проверьте подключение к интернету.',
  UNAUTHORIZED: 'Требуется авторизация.',
  FORBIDDEN: 'Недостаточно прав.',
  NOT_FOUND: 'Ресурс не найден.',
  SERVER_ERROR: 'Ошибка сервера. Попробуйте позже.',
  VALIDATION_ERROR: 'Проверьте правильность заполнения полей.',
} as const

export const SUCCESS_MESSAGES = {
  PROFILE_UPDATED: 'Профиль успешно обновлен',
  ORDER_CREATED: 'Заказ успешно создан',
  BID_SENT: 'Отклик успешно отправлен',
  PAYMENT_SUCCESS: 'Оплата прошла успешно',
  SETTINGS_SAVED: 'Настройки сохранены',
} as const