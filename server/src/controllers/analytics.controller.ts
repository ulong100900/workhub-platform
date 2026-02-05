import { Request, Response } from 'express';
import { db } from '../lib/db';
import { AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';

export class AnalyticsController {
  // Получение общей аналитики (для администраторов)
  static async getAnalytics(req: AuthRequest, res: Response) {
    try {
      // Проверка прав администратора
      if (req.user.type !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Требуются права администратора',
        });
      }

      const { period = 'month' } = req.query;
      
      // Расчет дат для периода
      const now = new Date();
      let startDate = new Date();
      
      switch (period) {
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case 'quarter':
          startDate.setDate(startDate.getDate() - 90);
          break;
        case 'year':
          startDate.setDate(startDate.getDate() - 365);
          break;
        default:
          startDate.setDate(startDate.getDate() - 30);
      }

      // Параллельные запросы для производительности
      const [
        totalUsersResult,
        totalProjectsResult,
        completedProjectsResult,
        totalTransactionsResult,
        activeUsersResult,
        revenueResult,
        popularCategoriesResult,
        userGrowthResult
      ] = await Promise.all([
        // Всего пользователей
        db.count('profiles', []),
        
        // Всего проектов
        db.count('projects', []),
        
        // Завершенные проекты
        db.count('projects', [
          { column: 'status', operator: 'eq', value: 'COMPLETED' }
        ]),
        
        // Всего транзакций
        db.count('transactions', [
          { column: 'created_at', operator: 'gte', value: startDate.toISOString() }
        ]),
        
        // Активные пользователи (залогинились за последние 30 дней)
        db.count('profiles', [
          { column: 'last_login', operator: 'gte', value: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
          { column: 'is_active', operator: 'eq', value: true }
        ]),
        
        // Выручка (комиссии)
        db.find('transactions', {
          where: [
            { column: 'type', operator: 'eq', value: 'COMMISSION' },
            { column: 'status', operator: 'eq', value: 'COMPLETED' },
            { column: 'created_at', operator: 'gte', value: startDate.toISOString() }
          ]
        }),
        
        // Популярные категории
        db.queryRaw(`
          SELECT 
            c.name as category_name,
            COUNT(p.id) as project_count,
            AVG(p.budget_max) as avg_budget
          FROM projects p
          JOIN categories c ON p.category_id = c.id
          WHERE p.created_at >= '${startDate.toISOString()}'
          GROUP BY c.name
          ORDER BY project_count DESC
          LIMIT 10
        `),
        
        // Рост пользователей по месяцам
        db.queryRaw(`
          SELECT 
            DATE_TRUNC('month', created_at) as month,
            COUNT(*) as new_users
          FROM profiles
          WHERE created_at >= '${startDate.toISOString()}'
          GROUP BY DATE_TRUNC('month', created_at)
          ORDER BY month ASC
        `)
      ]);

      // Расчет метрик
      const totalUsers = totalUsersResult || 0;
      const totalProjects = totalProjectsResult || 0;
      const completedProjects = completedProjectsResult || 0;
      const totalBids = 0; // TODO: Нужна таблица bids
      const activeUsers = activeUsersResult || 0;
      
      // Расчет выручки
      let totalRevenue = 0;
      if (revenueResult.data) {
        totalRevenue = revenueResult.data.reduce((sum, tx) => sum + (tx.amount || 0), 0);
      }

      // Коэффициент конверсии
      const conversionRate = totalProjects > 0 
        ? (completedProjects / totalProjects) * 100 
        : 0;

      // Популярные категории
      const popularCategories = popularCategoriesResult.data?.map((cat: any) => ({
        name: cat.category_name,
        projectCount: cat.project_count,
        avgBudget: cat.avg_budget
      })) || [];

      // Рост пользователей
      const userGrowth = userGrowthResult.data?.map((row: any) => ({
        month: row.month,
        newUsers: row.new_users
      })) || [];

      // Выручка по месяцам
      const revenueByMonth = []; // TODO: Реализовать более сложный запрос

      res.json({
        success: true,
        data: {
          period,
          overview: {
            totalUsers,
            totalProjects,
            totalBids,
            totalRevenue,
            activeUsers,
            completedProjects,
            conversionRate: Math.round(conversionRate * 10) / 10,
          },
          categories: {
            popularCategories,
          },
          trends: {
            userGrowth,
            revenueByMonth,
          },
          timestamp: new Date().toISOString(),
        }
      });
    } catch (error: any) {
      logger.error('Get analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при получении аналитики',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Аналитика пользователя
  static async getUserAnalytics(req: AuthRequest, res: Response) {
    try {
      const userId = req.params.userId || req.user.id;
      
      // Проверка прав (админ или сам пользователь)
      if (userId !== req.user.id && req.user.type !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Нет прав для просмотра этой аналитики',
        });
      }

      const { period = 'month' } = req.query;
      let startDate = new Date();
      startDate.setDate(startDate.getDate() - 30); // По умолчанию 30 дней

      // Получение данных пользователя
      const [userData, projectsPosted, projectsCompleted, bidsSubmitted, bidsWon, totalEarned, totalSpent] = await Promise.all([
        // Данные пользователя
        db.findOne<any>('profiles', userId),
        
        // Проекты размещенные
        db.count('projects', [
          { column: 'client_id', operator: 'eq', value: userId },
          { column: 'created_at', operator: 'gte', value: startDate.toISOString() }
        ]),
        
        // Проекты завершенные
        db.count('projects', [
          { column: 'client_id', operator: 'eq', value: userId },
          { column: 'status', operator: 'eq', value: 'COMPLETED' },
          { column: 'created_at', operator: 'gte', value: startDate.toISOString() }
        ]),
        
        // Предложения отправленные
        db.count('bids', [
          { column: 'freelancer_id', operator: 'eq', value: userId },
          { column: 'created_at', operator: 'gte', value: startDate.toISOString() }
        ]),
        
        // Предложения выигранные
        db.count('bids', [
          { column: 'freelancer_id', operator: 'eq', value: userId },
          { column: 'status', operator: 'eq', value: 'ACCEPTED' },
          { column: 'created_at', operator: 'gte', value: startDate.toISOString() }
        ]),
        
        // Заработано (для фрилансеров)
        db.queryRaw(`
          SELECT COALESCE(SUM(amount), 0) as total_earned
          FROM transactions
          WHERE user_id = '${userId}'
            AND type IN ('ESCROW_RELEASE', 'WITHDRAWAL_REFUND')
            AND status = 'COMPLETED'
            AND created_at >= '${startDate.toISOString()}'
        `),
        
        // Потрачено (для клиентов)
        db.queryRaw(`
          SELECT COALESCE(SUM(amount), 0) as total_spent
          FROM transactions
          WHERE user_id = '${userId}'
            AND type IN ('DEPOSIT', 'PROJECT_PAYMENT')
            AND status = 'COMPLETED'
            AND created_at >= '${startDate.toISOString()}'
        `)
      ]);

      if (!userData) {
        return res.status(404).json({
          success: false,
          message: 'Пользователь не найден',
        });
      }

      // Расчет метрик
      const projectsPostedCount = projectsPosted || 0;
      const projectsCompletedCount = projectsCompleted || 0;
      const bidsSubmittedCount = bidsSubmitted || 0;
      const bidsWonCount = bidsWon || 0;
      const totalEarnedAmount = totalEarned.data?.[0]?.total_earned || 0;
      const totalSpentAmount = totalSpent.data?.[0]?.total_spent || 0;

      const successRate = bidsSubmittedCount > 0
        ? (bidsWonCount / bidsSubmittedCount) * 100
        : 0;

      const completionRate = projectsPostedCount > 0
        ? (projectsCompletedCount / projectsPostedCount) * 100
        : 0;

      // Профиль пользователя
      const userType = userData.user_type;
      const averageRating = userData.rating || 0;

      res.json({
        success: true,
        data: {
          user: {
            id: userData.id,
            type: userType,
            name: `${userData.first_name} ${userData.last_name}`,
            rating: averageRating,
          },
          period: period,
          dateRange: {
            start: startDate.toISOString(),
            end: new Date().toISOString(),
          },
          metrics: {
            projectsPosted: projectsPostedCount,
            projectsCompleted: projectsCompletedCount,
            totalSpent: totalSpentAmount,
            totalEarned: totalEarnedAmount,
            averageRating,
            bidsSubmitted: bidsSubmittedCount,
            bidsWon: bidsWonCount,
            successRate: Math.round(successRate * 10) / 10,
            completionRate: Math.round(completionRate * 10) / 10,
          },
          recommendations: this.generateUserRecommendations({
            userType,
            successRate,
            completionRate,
            projectsPostedCount,
            bidsSubmittedCount,
          }),
        }
      });
    } catch (error: any) {
      logger.error('Get user analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при получении аналитики пользователя',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Аналитика проекта
  static async getProjectAnalytics(req: AuthRequest, res: Response) {
    try {
      const { projectId } = req.params;

      // Получение проекта
      const project = await db.findOne<any>('projects', projectId);
      
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Проект не найден',
        });
      }

      // Проверка прав (клиент проекта или админ)
      if (project.client_id !== req.user.id && req.user.type !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Нет прав для просмотра этой аналитики',
        });
      }

      // Параллельные запросы
      const [viewsResult, bidsResult] = await Promise.all([
        // Просмотры (если есть таблица project_views)
        db.count('project_views', [
          { column: 'project_id', operator: 'eq', value: projectId }
        ]).catch(() => ({ count: 0 })), // Если таблицы нет
        
        // Все предложения
        db.find('bids', {
          where: [
            { column: 'project_id', operator: 'eq', value: projectId }
          ]
        })
      ]);

      const views = typeof viewsResult === 'number' ? viewsResult : (viewsResult.count || 0);
      const bids = bidsResult.data || [];
      const bidsCount = bidsResult.count || 0;

      // Расчет метрик
      const bidAmounts = bids.map((bid: any) => bid.amount || 0).filter(amount => amount > 0);
      const averageBid = bidAmounts.length > 0 
        ? bidAmounts.reduce((a, b) => a + b, 0) / bidAmounts.length 
        : 0;
      const maxBid = bidAmounts.length > 0 ? Math.max(...bidAmounts) : 0;
      const minBid = bidAmounts.length > 0 ? Math.min(...bidAmounts) : 0;

      // Время до первого предложения
      let timeToFirstBid = 0;
      if (bids.length > 0) {
        const firstBid = bids.reduce((earliest, bid) => 
          new Date(bid.created_at) < new Date(earliest.created_at) ? bid : earliest
        );
        const projectCreated = new Date(project.created_at);
        const firstBidCreated = new Date(firstBid.created_at);
        timeToFirstBid = Math.round((firstBidCreated.getTime() - projectCreated.getTime()) / (1000 * 60)); // в минутах
      }

      // Коэффициент конверсии (предложения в выбранного фрилансера)
      const hasFreelancer = !!project.freelancer_id;
      const conversionRate = hasFreelancer && bidsCount > 0 ? (1 / bidsCount) * 100 : 0;

      res.json({
        success: true,
        data: {
          project: {
            id: project.id,
            title: project.title,
            status: project.status,
            budget: project.budget_max,
          },
          metrics: {
            views,
            bidsCount,
            averageBid: Math.round(averageBid),
            maxBid,
            minBid,
            timeToFirstBid,
            conversionRate: Math.round(conversionRate * 10) / 10,
          },
          timeline: {
            createdAt: project.created_at,
            deadline: project.deadline,
            firstBidAt: bids.length > 0 ? bids[0].created_at : null,
          },
          recommendations: this.generateProjectRecommendations({
            views,
            bidsCount,
            averageBid,
            projectBudget: project.budget_max,
            timeToFirstBid,
          }),
        }
      });
    } catch (error: any) {
      logger.error('Get project analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при получении аналитики проекта',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Финансовая аналитика
  static async getFinancialAnalytics(req: AuthRequest, res: Response) {
    try {
      // Только для администраторов
      if (req.user.type !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Требуются права администратора',
        });
      }

      const { period = 'month' } = req.query;
      let startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const [
        revenueResult,
        withdrawalsResult,
        depositsResult,
        pendingPayoutsResult,
        topEarnersResult
      ] = await Promise.all([
        // Общая выручка (комиссии)
        db.find('transactions', {
          where: [
            { column: 'type', operator: 'eq', value: 'COMMISSION' },
            { column: 'status', operator: 'eq', value: 'COMPLETED' },
            { column: 'created_at', operator: 'gte', value: startDate.toISOString() }
          ]
        }),
        
        // Выводы средств
        db.find('withdrawals', {
          where: [
            { column: 'status', operator: 'eq', value: 'COMPLETED' },
            { column: 'created_at', operator: 'gte', value: startDate.toISOString() }
          ]
        }),
        
        // Депозиты
        db.find('transactions', {
          where: [
            { column: 'type', operator: 'eq', value: 'DEPOSIT' },
            { column: 'status', operator: 'eq', value: 'COMPLETED' },
            { column: 'created_at', operator: 'gte', value: startDate.toISOString() }
          ]
        }),
        
        // Ожидающие выплаты
        db.find('withdrawals', {
          where: [
            { column: 'status', operator: 'eq', value: 'PENDING' }
          ]
        }),
        
        // Топ-фрилансеры по заработку
        db.queryRaw(`
          SELECT 
            p.id,
            p.first_name,
            p.last_name,
            COALESCE(SUM(t.amount), 0) as total_earned
          FROM profiles p
          LEFT JOIN transactions t ON p.id = t.user_id
            AND t.type = 'ESCROW_RELEASE'
            AND t.status = 'COMPLETED'
            AND t.created_at >= '${startDate.toISOString()}'
          WHERE p.user_type = 'freelancer'
            AND p.is_active = true
          GROUP BY p.id, p.first_name, p.last_name
          ORDER BY total_earned DESC
          LIMIT 10
        `)
      ]);

      // Расчеты
      const totalRevenue = revenueResult.data?.reduce((sum, tx) => sum + (tx.amount || 0), 0) || 0;
      const platformFees = totalRevenue * 0.1; // 10% комиссия
      const withdrawals = withdrawalsResult.data?.reduce((sum, w) => sum + (w.amount || 0), 0) || 0;
      const deposits = depositsResult.data?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0;
      const pendingPayouts = pendingPayoutsResult.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      // Выручка по методам оплаты
      const revenueByPaymentMethod = {}; // TODO: Реализовать когда добавим payment_method в транзакции

      // Ежедневная выручка
      const dailyRevenue = []; // TODO: Реализовать сложный запрос

      // Топ-фрилансеры
      const topEarners = topEarnersResult.data?.map((row: any) => ({
        id: row.id,
        name: `${row.first_name} ${row.last_name}`,
        totalEarned: row.total_earned,
      })) || [];

      res.json({
        success: true,
        data: {
          period,
          summary: {
            totalRevenue: Math.round(totalRevenue),
            platformFees: Math.round(platformFees),
            netRevenue: Math.round(totalRevenue - platformFees),
            withdrawals: Math.round(withdrawals),
            deposits: Math.round(deposits),
            pendingPayouts: Math.round(pendingPayouts),
            balance: Math.round(deposits - withdrawals - pendingPayouts),
          },
          details: {
            revenueByPaymentMethod,
            dailyRevenue,
            topEarners,
          },
          timestamp: new Date().toISOString(),
        }
      });
    } catch (error: any) {
      logger.error('Get financial analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при получении финансовой аналитики',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Аналитика производительности
  static async getPerformanceAnalytics(req: AuthRequest, res: Response) {
    try {
      // Только для администраторов
      if (req.user.type !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Требуются права администратора',
        });
      }

      // Метрики системы (заглушки для продакшена)
      res.json({
        success: true,
        data: {
          responseTime: 0,
          uptime: 100,
          errorRate: 0,
          activeConnections: 0,
          memoryUsage: 0,
          cpuUsage: 0,
          databasePerformance: {
            queryTime: 0,
            connections: 0
          }
        }
      });
    } catch (error: any) {
      logger.error('Get performance analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при получении аналитики производительности',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Вспомогательные методы для генерации рекомендаций
  private static generateUserRecommendations(data: any) {
    const recommendations = [];

    if (data.userType === 'freelancer') {
      if (data.successRate < 10 && data.bidsSubmittedCount > 5) {
        recommendations.push({
          type: 'SUCCESS_RATE',
          title: 'Низкий процент побед',
          message: 'Попробуйте улучшить качество предложений: добавляйте портфолио, подробное описание, предлагайте конкурентные цены.',
          priority: 'high',
        });
      }

      if (data.bidsSubmittedCount < 3) {
        recommendations.push({
          type: 'ACTIVITY',
          title: 'Низкая активность',
          message: 'Отправляйте больше предложений. Рекомендуется 5-10 предложений в неделю для лучших результатов.',
          priority: 'medium',
        });
      }
    } else if (data.userType === 'client') {
      if (data.completionRate < 50 && data.projectsPostedCount > 3) {
        recommendations.push({
          type: 'COMPLETION_RATE',
          title: 'Низкий процент завершения проектов',
          message: 'Улучшайте описание проектов, ставьте реалистичные сроки и бюджеты, активнее общайтесь с фрилансерами.',
          priority: 'medium',
        });
      }
    }

    return recommendations;
  }

  private static generateProjectRecommendations(data: any) {
    const recommendations = [];

    if (data.views < 10) {
      recommendations.push({
        type: 'VISIBILITY',
        title: 'Низкая видимость проекта',
        message: 'Добавьте больше деталей в описание, укажите четкие требования, прикрепите примеры если есть.',
        priority: 'medium',
      });
    }

    if (data.bidsCount === 0 && data.timeToFirstBid > 24 * 60) { // более 24 часов
      recommendations.push({
        type: 'NO_BIDS',
        title: 'Нет предложений',
        message: 'Рассмотрите возможность увеличения бюджета или упрощения требований.',
        priority: 'high',
      });
    }

    if (data.averageBid > data.projectBudget * 1.5) {
      recommendations.push({
        type: 'BUDGET_MISMATCH',
        title: 'Бюджет ниже рыночного',
        message: 'Среднее предложение значительно выше вашего бюджета. Рассмотрите увеличение бюджета.',
        priority: 'medium',
      });
    }

    return recommendations;
  }
}