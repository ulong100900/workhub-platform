import Joi from 'joi';

// Валидация регистрации
export const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Введите корректный email адрес',
    'any.required': 'Email обязателен',
  }),
  password: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'))
    .required()
    .messages({
      'string.min': 'Пароль должен содержать минимум 8 символов',
      'string.pattern.base': 'Пароль должен содержать буквы в верхнем и нижнем регистре, а также цифры',
      'any.required': 'Пароль обязателен',
    }),
  firstName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Имя должно содержать минимум 2 символа',
    'string.max': 'Имя должно содержать максимум 50 символов',
    'any.required': 'Имя обязательно',
  }),
  lastName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Фамилия должна содержать минимум 2 символа',
    'string.max': 'Фамилия должна содержать максимум 50 символов',
    'any.required': 'Фамилия обязательна',
  }),
  type: Joi.string().valid('FREELANCER', 'CLIENT').required().messages({
    'any.only': 'Тип пользователя должен быть FREELANCER или CLIENT',
    'any.required': 'Тип пользователя обязателен',
  }),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional().messages({
    'string.pattern.base': 'Введите корректный номер телефона',
  }),
});

// Валидация входа
export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Введите корректный email адрес',
    'any.required': 'Email обязателен',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Пароль обязателен',
  }),
});

// Валидация проекта
export const projectSchema = Joi.object({
  title: Joi.string().min(10).max(200).required().messages({
    'string.min': 'Название должно содержать минимум 10 символов',
    'string.max': 'Название должно содержать максимум 200 символов',
    'any.required': 'Название обязательно',
  }),
  description: Joi.string().min(50).max(1000).required().messages({
    'string.min': 'Описание должно содержать минимум 50 символов',
    'string.max': 'Описание должно содержать максимум 1000 символов',
    'any.required': 'Описание обязательно',
  }),
  detailedDescription: Joi.string().max(5000).optional(),
  category: Joi.string().required().messages({
    'any.required': 'Категория обязательна',
  }),
  subcategory: Joi.string().optional(),
  skills: Joi.array().items(Joi.string()).min(1).required().messages({
    'array.min': 'Укажите хотя бы один навык',
    'any.required': 'Навыки обязательны',
  }),
  budgetMin: Joi.number().min(0).required().messages({
    'number.min': 'Минимальный бюджет не может быть отрицательным',
    'any.required': 'Минимальный бюджет обязателен',
  }),
  budgetMax: Joi.number().min(Joi.ref('budgetMin')).required().messages({
    'number.min': 'Максимальный бюджет должен быть больше минимального',
    'any.required': 'Максимальный бюджет обязателен',
  }),
  budgetType: Joi.string().valid('FIXED', 'HOURLY').required().messages({
    'any.only': 'Тип бюджета должен быть FIXED или HOURLY',
    'any.required': 'Тип бюджета обязателен',
  }),
  estimatedDuration: Joi.string().required().messages({
    'any.required': 'Срок выполнения обязателен',
  }),
  isRemote: Joi.boolean().default(true),
  locationCity: Joi.when('isRemote', {
    is: false,
    then: Joi.string().required(),
    otherwise: Joi.string().optional(),
  }),
  locationCountry: Joi.when('isRemote', {
    is: false,
    then: Joi.string().required(),
    otherwise: Joi.string().optional(),
  }),
  isUrgent: Joi.boolean().default(false),
});

// Валидация предложения
export const bidSchema = Joi.object({
  amount: Joi.number().min(0).required().messages({
    'number.min': 'Сумма не может быть отрицательной',
    'any.required': 'Сумма обязательна',
  }),
  description: Joi.string().min(20).max(1000).required().messages({
    'string.min': 'Описание должно содержать минимум 20 символов',
    'string.max': 'Описание должно содержать максимум 1000 символов',
    'any.required': 'Описание обязательно',
  }),
  timeline: Joi.string().required().messages({
    'any.required': 'Срок выполнения обязателен',
  }),
  isHourly: Joi.boolean().default(false),
});

// Валидация отзыва
export const reviewSchema = Joi.object({
  rating: Joi.number().min(1).max(5).required().messages({
    'number.min': 'Рейтинг должен быть от 1 до 5',
    'number.max': 'Рейтинг должен быть от 1 до 5',
    'any.required': 'Рейтинг обязателен',
  }),
  content: Joi.string().min(10).max(2000).required().messages({
    'string.min': 'Отзыв должен содержать минимум 10 символов',
    'string.max': 'Отзыв должен содержать максимум 2000 символов',
    'any.required': 'Отзыв обязателен',
  }),
  title: Joi.string().max(100).optional(),
  strengths: Joi.array().items(Joi.string()).max(5).optional(),
  weaknesses: Joi.array().items(Joi.string()).max(5).optional(),
  wouldRecommend: Joi.boolean().default(true),
});

// Валидация обновления профиля
export const updateProfileSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).optional(),
  lastName: Joi.string().min(2).max(50).optional(),
  bio: Joi.string().max(1000).optional(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional().messages({
    'string.pattern.base': 'Введите корректный номер телефона',
  }),
  skills: Joi.array().items(Joi.string()).optional(),
  hourlyRate: Joi.number().min(0).optional(),
  companyName: Joi.string().max(100).optional(),
  companySize: Joi.string().optional(),
  industry: Joi.string().optional(),
});

// Валидация платежа
export const paymentSchema = Joi.object({
  amount: Joi.number().min(100).required().messages({
    'number.min': 'Минимальная сумма платежа 100 ₽',
    'any.required': 'Сумма обязательна',
  }),
  currency: Joi.string().valid('RUB', 'USD', 'EUR').default('RUB'),
  method: Joi.string().required(),
});