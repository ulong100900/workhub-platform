import { Request, Response } from 'express';
import { prisma } from '../index';
import { reviewSchema } from '../utils/validation';
import { AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';

export class ReviewController {
  // Создание отзыва
  static async createReview(req: AuthRequest, res: Response) {
    try {
      // Валидация
      const { error } = reviewSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
        });
      }

      const {
        projectId,
        reviewedId,
        type,
        rating,
        title,
        content,
        strengths,
        weaknesses,
        wouldRecommend,
      } = req.body;

      // Проверка существования проекта
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          client: true,
          freelancer: true,
        },
      });

      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Проект не найден',
        });
      }

      // Проверка, что проект завершен
      if (project.status !== 'COMPLETED') {
        return res.status(400).json({
          success: false,
          message: 'Отзыв можно оставить только на завершенный проект',
        });
      }

      // Проверка прав доступа
      let hasAccess = false;
      
      if (type === 'CLIENT') {
        // Фрилансер оставляет отзыв о клиенте
        hasAccess = project.freelancerId === req.user.id;
      } else if (type === 'FREELANCER') {
        // Клиент оставляет отзыв о фрилансере
        hasAccess = project.clientId === req.user.id;
      }

      if (!hasAccess && req.user.type !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Нет прав для оставления отзыва',
        });
      }

      // Проверка, что отзыв уже оставлен
      const existingReview = await prisma.review.findFirst({
        where: {
          projectId,
          reviewerId: req.user.id,
          reviewedId,
          type,
        },
      });

      if (existingReview) {
        return res.status(400).json({
          success: false,
          message: 'Вы уже оставляли отзыв на этого пользователя',
        });
      }

      // Создание отзыва
      const review = await prisma.review.create({
        data: {
          projectId,
          reviewerId: req.user.id,
          reviewedId,
          type,
          rating,
          title: title || null,
          content,
          strengths: strengths || [],
          weaknesses: weaknesses || [],
          wouldRecommend,
          isVerified: true, // Автоматическая верификация для завершенных проектов
        },
        include: {
          reviewer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          reviewed: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              rating: true,
            },
          },
          project: {
            select: {
              id: true,
              title: true,
              budgetMax: true,
            },
          },
        },
      });

      // Обновление рейтинга пользователя
      await this.updateUserRating(reviewedId, type);

      // Обновление счетчика отзывов
      await prisma.user.update({
        where: { id: reviewedId },
        data: {
          reviewsCount: { increment: 1 },
        },
      });

      res.status(201).json({
        success: true,
        message: 'Отзыв успешно добавлен',
        data: review,
      });
    } catch (error) {
      logger.error('Create review error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при создании отзыва',
      });
    }
  }

  // Обновление рейтинга пользователя
  private static async updateUserRating(userId: string, type: string) {
    try {
      // Получение всех отзывов пользователя
      const reviews = await prisma.review.findMany({
        where: {
          reviewedId: userId,
          type: type === 'FREELANCER' ? 'FREELANCER' : 'CLIENT',
        },
      });

      if (reviews.length === 0) return;

      // Расчет среднего рейтинга
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / reviews.length;

      // Обновление рейтинга пользователя
      await prisma.user.update({
        where: { id: userId },
        data: {
          rating: averageRating,
        },
      });
    } catch (error) {
      logger.error('Update user rating error:', error);
    }
  }

  // Получение отзывов пользователя
  static async getUserReviews(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { type, page = 1, limit = 20 } = req.query;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const take = parseInt(limit as string);

      const where: any = {
        reviewedId: userId,
        isHidden: false,
      };

      if (type) {
        where.type = type;
      }

      const [reviews, total] = await Promise.all([
        prisma.review.findMany({
          where,
          skip,
          take,
          include: {
            reviewer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
                rating: true,
                reviewsCount: true,
              },
            },
            project: {
              select: {
                id: true,
                title: true,
                budgetMax: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
        prisma.review.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          reviews,
          pagination: {
            page: parseInt(page as string),
            limit: take,
            total,
            pages: Math.ceil(total / take),
          },
        },
      });
    } catch (error) {
      logger.error('Get user reviews error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при получении отзывов',
      });
    }
  }

  // Получение сводки рейтинга
  static async getRatingSummary(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { type } = req.query;

      if (!type) {
        return res.status(400).json({
          success: false,
          message: 'Тип отзыва обязателен',
        });
      }

      // Получение всех отзывов пользователя
      const reviews = await prisma.review.findMany({
        where: {
          reviewedId: userId,
          type: type as 'FREELANCER' | 'CLIENT',
          isHidden: false,
        },
      });

      if (reviews.length === 0) {
        return res.json({
          success: true,
          data: {
            averageRating: 0,
            totalReviews: 0,
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            wouldRecommendRate: 0,
            strengths: {},
            weaknesses: {},
          },
        });
      }

      // Расчет статистики
      const totalReviews = reviews.length;
      const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

      // Распределение рейтингов
      const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      reviews.forEach(review => {
        ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
      });

      // Процент рекомендаций
      const wouldRecommendCount = reviews.filter(r => r.wouldRecommend).length;
      const wouldRecommendRate = (wouldRecommendCount / totalReviews) * 100;

      // Анализ сильных и слабых сторон
      const strengths: { [key: string]: number } = {};
      const weaknesses: { [key: string]: number } = {};

      reviews.forEach(review => {
        review.strengths?.forEach(strength => {
          strengths[strength] = (strengths[strength] || 0) + 1;
        });

        review.weaknesses?.forEach(weakness => {
          weaknesses[weakness] = (weaknesses[weakness] || 0) + 1;
        });
      });

      // Сортировка по частоте
      const sortedStrengths = Object.fromEntries(
        Object.entries(strengths).sort(([, a], [, b]) => b - a).slice(0, 10)
      );

      const sortedWeaknesses = Object.fromEntries(
        Object.entries(weaknesses).sort(([, a], [, b]) => b - a).slice(0, 10)
      );

      res.json({
        success: true,
        data: {
          averageRating: parseFloat(averageRating.toFixed(1)),
          totalReviews,
          ratingDistribution,
          wouldRecommendRate: parseFloat(wouldRecommendRate.toFixed(1)),
          strengths: sortedStrengths,
          weaknesses: sortedWeaknesses,
        },
      });
    } catch (error) {
      logger.error('Get rating summary error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при получении сводки рейтинга',
      });
    }
  }

  // Ответ на отзыв
  static async replyToReview(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { reply } = req.body;

      if (!reply) {
        return res.status(400).json({
          success: false,
          message: 'Ответ обязателен',
        });
      }

      // Поиск отзыва
      const review = await prisma.review.findUnique({
        where: { id },
        include: {
          reviewed: true,
        },
      });

      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Отзыв не найден',
        });
      }

      // Проверка прав доступа
      if (review.reviewedId !== req.user.id && req.user.type !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Нет прав для ответа на этот отзыв',
        });
      }

      // Обновление отзыва
      const updatedReview = await prisma.review.update({
        where: { id },
        data: {
          reply,
          repliedAt: new Date(),
        },
        include: {
          reviewer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          reviewed: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      });

      res.json({
        success: true,
        message: 'Ответ успешно добавлен',
        data: updatedReview,
      });
    } catch (error) {
      logger.error('Reply to review error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при добавлении ответа',
      });
    }
  }

  // Обновление отзыва
  static async updateReview(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      // Валидация
      const { error } = reviewSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
        });
      }

      // Поиск отзыва
      const review = await prisma.review.findUnique({
        where: { id },
      });

      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Отзыв не найден',
        });
      }

      // Проверка прав доступа
      if (review.reviewerId !== req.user.id && req.user.type !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Нет прав для обновления этого отзыва',
        });
      }

      const { rating, title, content, strengths, weaknesses, wouldRecommend } = req.body;

      // Обновление отзыва
      const updatedReview = await prisma.review.update({
        where: { id },
        data: {
          rating,
          title: title || null,
          content,
          strengths: strengths || [],
          weaknesses: weaknesses || [],
          wouldRecommend,
        },
        include: {
          reviewer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          reviewed: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      });

      // Обновление рейтинга пользователя
      await this.updateUserRating(review.reviewedId, review.type);

      res.json({
        success: true,
        message: 'Отзыв успешно обновлен',
        data: updatedReview,
      });
    } catch (error) {
      logger.error('Update review error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при обновлении отзыва',
      });
    }
  }

  // Удаление отзыва
  static async deleteReview(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      // Поиск отзыва
      const review = await prisma.review.findUnique({
        where: { id },
      });

      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Отзыв не найден',
        });
      }

      // Проверка прав доступа
      if (review.reviewerId !== req.user.id && req.user.type !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Нет прав для удаления этого отзыва',
        });
      }

      // Удаление отзыва
      await prisma.review.delete({
        where: { id },
      });

      // Обновление рейтинга пользователя
      await this.updateUserRating(review.reviewedId, review.type);

      // Обновление счетчика отзывов
      await prisma.user.update({
        where: { id: review.reviewedId },
        data: {
          reviewsCount: { decrement: 1 },
        },
      });

      res.json({
        success: true,
        message: 'Отзыв успешно удален',
      });
    } catch (error) {
      logger.error('Delete review error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при удалении отзыва',
      });
    }
  }

  // Отметить отзыв как полезный
  static async markHelpful(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      // Поиск отзыва
      const review = await prisma.review.findUnique({
        where: { id },
      });

      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Отзыв не найден',
        });
      }

      // Проверка, что пользователь не автор отзыва
      if (review.reviewerId === req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'Нельзя отметить свой собственный отзыв',
        });
      }

      // Обновление счетчика полезности
      const updatedReview = await prisma.review.update({
        where: { id },
        data: {
          helpfulCount: { increment: 1 },
        },
      });

      res.json({
        success: true,
        message: 'Отзыв отмечен как полезный',
        data: {
          helpfulCount: updatedReview.helpfulCount,
        },
      });
    } catch (error) {
      logger.error('Mark helpful error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при отметке отзыва',
      });
    }
  }

  // Пожаловаться на отзыв
  static async reportReview(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({
          success: false,
          message: 'Причина жалобы обязательна',
        });
      }

      // Поиск отзыва
      const review = await prisma.review.findUnique({
        where: { id },
      });

      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Отзыв не найден',
        });
      }

      // Проверка, что пользователь не автор отзыва
      if (review.reviewerId === req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'Нельзя пожаловаться на свой собственный отзыв',
        });
      }

      // Обновление счетчика жалоб
      const updatedReview = await prisma.review.update({
        where: { id },
        data: {
          reportedCount: { increment: 1 },
        },
      });

      // TODO: Отправить уведомление администратору
      // Можно создать запись в таблице модерации

      res.json({
        success: true,
        message: 'Жалоба отправлена',
        data: {
          reportedCount: updatedReview.reportedCount,
        },
      });
    } catch (error) {
      logger.error('Report review error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при отправке жалобы',
      });
    }
  }

  // Получение последних отзывов
  static async getRecentReviews(req: Request, res: Response) {
    try {
      const { limit = 10 } = req.query;

      const reviews = await prisma.review.findMany({
        where: {
          isHidden: false,
        },
        take: parseInt(limit as string),
        include: {
          reviewer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          reviewed: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          project: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      res.json({
        success: true,
        data: reviews,
      });
    } catch (error) {
      logger.error('Get recent reviews error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при получении последних отзывов',
      });
    }
  }
}