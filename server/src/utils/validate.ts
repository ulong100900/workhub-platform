import Joi from 'joi';

// Схемы валидации
export const reviewSchema = Joi.object({
  projectId: Joi.string().required().messages({
    'string.empty': 'ID проекта обязателен',
    'any.required': 'ID проекта обязателен',
  }),
  reviewedId: Joi.string().required().messages({
    'string.empty': 'ID рецензируемого обязателен',
    'any.required': 'ID рецензируемого обязателен',
  }),
  type: Joi.string().valid('FREELANCER', 'CLIENT').required().messages({
    'any.only': 'Тип должен быть FREELANCER или CLIENT',
    'any.required': 'Тип обязателен',
  }),
  rating: Joi.number().min(1).max(5).required().messages({
    'number.min': 'Рейтинг должен быть от 1 до 5',
    'number.max': 'Рейтинг должен быть от 1 до 5',
    'any.required': 'Рейтинг обязателен',
  }),
  title: Joi.string().max(100).optional().messages({
    'string.max': 'Заголовок не должен превышать 100 символов',
  }),
  content: Joi.string().min(10).max(1000).required().messages({
    'string.min': 'Отзыв должен содержать минимум 10 символов',
    'string.max': 'Отзыв не должен превышать 1000 символов',
    'any.required': 'Текст отзыва обязателен',
  }),
  strengths: Joi.array().items(Joi.string()).max(10).optional().messages({
    'array.max': 'Не более 10 сильных сторон',
  }),
  weaknesses: Joi.array().items(Joi.string()).max(10).optional().messages({
    'array.max': 'Не более 10 слабых сторон',
  }),
  wouldRecommend: Joi.boolean().required().messages({
    'any.required': 'Рекомендация обязательна',
  }),
});

export const paymentSchema = Joi.object({
  amount: Joi.number().min(100).max(1000000).required().messages({
    'number.min': 'Минимальная сумма 100 ₽',
    'number.max': 'Максимальная сумма 1,000,000 ₽',
    'any.required': 'Сумма обязательна',
  }),
  currency: Joi.string().valid('RUB', 'USD', 'EUR').default('RUB').messages({
    'any.only': 'Поддерживаются только RUB, USD, EUR',
  }),
  method: Joi.string().valid('stripe', 'yookassa', 'bank_card').required().messages({
    'any.only': 'Неподдерживаемый метод оплаты',
    'any.required': 'Метод оплаты обязателен',
  }),
});

export const withdrawalSchema = Joi.object({
  amount: Joi.number().min(1000).max(1000000).required().messages({
    'number.min': 'Минимальная сумма вывода 1000 ₽',
    'number.max': 'Максимальная сумма вывода 1,000,000 ₽',
    'any.required': 'Сумма обязательна',
  }),
  method: Joi.string().valid('bank_card', 'bank_account', 'yoomoney', 'qiwi').required().messages({
    'any.only': 'Неподдерживаемый метод вывода',
    'any.required': 'Метод вывода обязателен',
  }),
  details: Joi.object().required().messages({
    'any.required': 'Данные для вывода обязательны',
  }),
});

export const notificationSettingsSchema = Joi.object({
  emailNotifications: Joi.boolean().default(true),
  pushNotifications: Joi.boolean().default(true),
  projectInvites: Joi.boolean().default(true),
  bidUpdates: Joi.boolean().default(true),
  projectUpdates: Joi.boolean().default(true),
  messages: Joi.boolean().default(true),
  reviews: Joi.boolean().default(true),
  promotions: Joi.boolean().default(true),
});

// Экспорт всех схем
export default {
  reviewSchema,
  paymentSchema,
  withdrawalSchema,
  notificationSettingsSchema,
};