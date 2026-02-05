import { Request, Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth';
import { AnalyticsService } from '../services/analytics.service';
import logger from '../utils/logger';

export class AnalyticsController {
  // Получение платформенной аналитики
  static async getPlatformAnalytics(req: Request, res: Response) {
    try {
      const { days = 30 } = req.query;

      const analytics = await AnalyticsService.collectPlatformAnalytics();
      
      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      logger.error('Get platform analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при получении аналитики платформы',
      });
    }
  }

  // Получение аналитики пользователя
  static async getUserAnalytics(req: AuthRequest, res: Response) {
    try {
      const { period = '30d' } = req.query;
      
      let days = 30;
      if (period === '7d') days = 7;
      if (period === '90d') days = 90;
      if (period === '365d') days = 365;

      const analytics = await AnalyticsService.getUserAnalytics(
        req.user.id,
        days
      );

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      logger.error('Get user analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при получении аналитики пользователя',
      });
    }
  }

  // Аналитика проектов
  static async getProjectAnalytics(req: AuthRequest, res: Response) {
    try {
      const { projectId } = req.params;
      const { period = '30d' } = req.query;

      // Проверка прав доступа к проекту
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { clientId: true, freelancerId: true },
      });

      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Проект не найден',
        });
      }

      if (![project.clientId, project.freelancerId].includes(req.user.id) &&
          req.user.type !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Нет прав доступа к аналитике этого проекта',
        });
      }

      // Получение аналитики проекта
      const startDate = new Date();
      if (period === '7d') startDate.setDate(startDate.getDate() - 7);
      else if (period === '90d') startDate.setDate(startDate.getDate() - 90);
      else startDate.setDate(startDate.getDate() - 30);

      const analytics = await this.getProjectSpecificAnalytics(
        projectId,
        startDate
      );

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      logger.error('Get project analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при получении аналитики проекта',
      });
    }
  }

  private static async getProjectSpecificAnalytics(projectId: string, startDate: Date) {
    const [
      messages,
      milestones,
      timeTracking,
      budgetUsage,
    ] = await Promise.all([
      // Сообщения
      prisma.message.count({
        where: {
          conversation: {
            projectId,
          },
          createdAt: { gte: startDate },
        },
      }),
      // Вехи проекта
      prisma.milestone.findMany({
        where: {
          projectId,
          createdAt: { gte: startDate },
        },
        orderBy: { dueDate: 'asc' },
      }),
      // Трек времени (если реализовано)
      this.getTimeTrackingData(projectId, startDate),
      // Использование бюджета
      this.getBudgetUsageData(projectId),
    ]);

    const completedMilestones = milestones.filter(m => m.status === 'COMPLETED').length;
    const totalMilestones = milestones.length;
    const milestoneProgress = totalMilestones > 0
      ? (completedMilestones / totalMilestones) * 100
      : 0;

    return {
      communication: {
        messageCount: messages,
        avgResponseTime: await this.calculateAvgResponseTime(projectId, startDate),
      },
      milestones: {
        total: totalMilestones,
        completed: completedMilestones,
        progress: Math.round(milestoneProgress),
        upcoming: milestones.filter(m => m.status === 'PENDING'),
      },
      timeTracking,
      budgetUsage,
    };
  }

  private static async getTimeTrackingData(projectId: string, startDate: Date) {
    // Здесь можно интегрировать с системой трекинга времени
    return {
      totalHours: 0,
      billedHours: 0,
      remainingHours: 0,
    };
  }

  private static async getBudgetUsageData(projectId: string) {
    const transactions = await prisma.transaction.findMany({
      where: {
        projectId,
        type: { in: ['ESCROW_HOLD', 'ESCROW_RELEASE', 'ESCROW_REFUND'] },
      },
    });

    const totalBudget = transactions
      .filter(t => t.type === 'ESCROW_HOLD')
      .reduce((sum, t) => sum + t.amount, 0);

    const releasedAmount = transactions
      .filter(t => t.type === 'ESCROW_RELEASE')
      .reduce((sum, t) => sum + t.amount, 0);

    const refundedAmount = transactions
      .filter(t => t.type === 'ESCROW_REFUND')
      .reduce((sum, t) => sum + t.amount, 0);

    const usedBudget = releasedAmount - refundedAmount;
    const usagePercentage = totalBudget > 0 ? (usedBudget / totalBudget) * 100 : 0;

    return {
      totalBudget,
      usedBudget: Math.round(usedBudget),
      remainingBudget: Math.round(totalBudget - usedBudget),
      usagePercentage: Math.round(usagePercentage),
      transactions: transactions.length,
    };
  }

  private static async calculateAvgResponseTime(projectId: string, startDate: Date) {
    const messages = await prisma.message.findMany({
      where: {
        conversation: { projectId },
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: 'asc' },
      select: { senderId: true, createdAt: true },
    });

    if (messages.length < 2) return 0;

    let totalResponseTime = 0;
    let responseCount = 0;

    for (let i = 1; i < messages.length; i++) {
      if (messages[i].senderId !== messages[i - 1].senderId) {
        const responseTime = messages[i].createdAt.getTime() - 
                            messages[i - 1].createdAt.getTime();
        totalResponseTime += responseTime;
        responseCount++;
      }
    }

    return responseCount > 0 
      ? Math.round(totalResponseTime / responseCount / 1000 / 60) // в минутах
      : 0;
  }

  // Тренды навыков
  static async getSkillTrends(req: Request, res: Response) {
    try {
      const { category, days = 30, limit = 20 } = req.query;

      const where: any = {};
      if (category) {
        where.categoryId = category;
      }

      // Анализ проектов за указанный период
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days as string));

      const projects = await prisma.project.findMany({
        where: {
          ...where,
          createdAt: { gte: startDate },
          status: 'ACTIVE',
        },
        select: {
          skills: true,
          budgetMax: true,
          categoryId: true,
        },
      });

      // Анализ фрилансеров
      const freelancers = await prisma.user.findMany({
        where: {
          type: 'FREELANCER',
          isActive: true,
        },
        select: {
          skills: true,
          hourlyRate: true,
        },
      });

      // Расчет трендов
      const trends = await AnalyticsService.getTrendingSkills();

      res.json({
        success: true,
        data: trends,
      });
    } catch (error) {
      logger.error('Get skill trends error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при получении трендов навыков',
      });
    }
  }
}