import { prisma } from '../index';
import logger from '../utils/logger';

export class AnalyticsService {
  // Сбор аналитики по платформе
  static async collectPlatformAnalytics() {
    try {
      const now = new Date();
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      const monthStart = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

      const [
        dailyStats,
        weeklyStats,
        monthlyStats,
        userGrowth,
        revenueStats,
        projectStats,
      ] = await Promise.all([
        this.getDailyStats(dayStart),
        this.getWeeklyStats(weekStart),
        this.getMonthlyStats(monthStart),
        this.getUserGrowth(),
        this.getRevenueStats(),
        this.getProjectStats(),
      ]);

      const analytics = {
        timestamp: now,
        daily: dailyStats,
        weekly: weeklyStats,
        monthly: monthlyStats,
        userGrowth,
        revenue: revenueStats,
        projects: projectStats,
        platformHealth: this.calculatePlatformHealth({
          daily: dailyStats,
          weekly: weeklyStats,
          userGrowth,
        }),
      };

      // Сохранение в базу
      await prisma.analyticsSnapshot.create({
        data: {
          data: analytics,
          period: 'DAILY',
        },
      });

      return analytics;
    } catch (error) {
      logger.error('Collect platform analytics error:', error);
      throw error;
    }
  }

  private static async getDailyStats(since: Date) {
    const [
      newUsers,
      newProjects,
      newBids,
      completedProjects,
      revenue,
    ] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: since } } }),
      prisma.project.count({ where: { createdAt: { gte: since } } }),
      prisma.bid.count({ where: { createdAt: { gte: since } } }),
      prisma.project.count({
        where: {
          status: 'COMPLETED',
          updatedAt: { gte: since },
        },
      }),
      prisma.transaction.aggregate({
        where: {
          type: 'COMMISSION',
          status: 'COMPLETED',
          createdAt: { gte: since },
        },
        _sum: { amount: true },
      }),
    ]);

    return {
      newUsers,
      newProjects,
      newBids,
      completedProjects,
      revenue: revenue._sum.amount || 0,
    };
  }

  private static async getWeeklyStats(since: Date) {
    const stats = await this.getDailyStats(since);
    
    // Дополнительная аналитика за неделю
    const activeUsers = await prisma.user.count({
      where: {
        lastLogin: { gte: since },
      },
    });

    const popularCategories = await prisma.project.groupBy({
      by: ['categoryId'],
      where: { createdAt: { gte: since } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    return {
      ...stats,
      activeUsers,
      popularCategories: await Promise.all(
        popularCategories.map(async (cat) => {
          const category = await prisma.category.findUnique({
            where: { id: cat.categoryId },
          });
          return {
            category: category?.name || 'Unknown',
            count: cat._count.id,
          };
        })
      ),
    };
  }

  private static async getMonthlyStats(since: Date) {
    const stats = await this.getWeeklyStats(since);

    // Retention rate (пользователи, вернувшиеся через 30 дней)
    const thirtyDaysAgo = new Date(since.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const usersMonthAgo = await prisma.user.findMany({
      where: { createdAt: { gte: thirtyDaysAgo, lt: since } },
      select: { id: true },
    });

    const userIds = usersMonthAgo.map(u => u.id);
    
    const retainedUsers = await prisma.user.count({
      where: {
        id: { in: userIds },
        lastLogin: { gte: since },
      },
    });

    const retentionRate = usersMonthAgo.length > 0
      ? (retainedUsers / usersMonthAgo.length) * 100
      : 0;

    // ARPU (Average Revenue Per User)
    const totalRevenue = stats.revenue;
    const totalUsers = await prisma.user.count();
    const arpu = totalUsers > 0 ? totalRevenue / totalUsers : 0;

    return {
      ...stats,
      retentionRate,
      arpu,
    };
  }

  private static async getUserGrowth() {
    const now = new Date();
    const periods = [7, 30, 90, 365]; // дни

    const growthData = await Promise.all(
      periods.map(async (days) => {
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        
        const newUsers = await prisma.user.count({
          where: { createdAt: { gte: startDate } },
        });

        const activeUsers = await prisma.user.count({
          where: {
            lastLogin: { gte: startDate },
          },
        });

        return {
          periodDays: days,
          newUsers,
          activeUsers,
          growthRate: days > 7 ? (newUsers / days) * 30 : newUsers, // нормализация на 30 дней
        };
      })
    );

    return growthData;
  }

  private static async getRevenueStats() {
    const now = new Date();
    const periods = [
      { label: 'today', days: 1 },
      { label: 'week', days: 7 },
      { label: 'month', days: 30 },
      { label: 'quarter', days: 90 },
      { label: 'year', days: 365 },
    ];

    const revenueData = await Promise.all(
      periods.map(async ({ label, days }) => {
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        
        const revenue = await prisma.transaction.aggregate({
          where: {
            type: 'COMMISSION',
            status: 'COMPLETED',
            createdAt: { gte: startDate },
          },
          _sum: { amount: true },
        });

        const withdrawals = await prisma.withdrawal.aggregate({
          where: {
            status: 'COMPLETED',
            completedAt: { gte: startDate },
          },
          _sum: { amount: true },
        });

        return {
          period: label,
          revenue: revenue._sum.amount || 0,
          withdrawals: withdrawals._sum.amount || 0,
          netRevenue: (revenue._sum.amount || 0) - (withdrawals._sum.amount || 0),
        };
      })
    );

    return revenueData;
  }

  private static async getProjectStats() {
    const projectStatuses = await prisma.project.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const avgProjectStats = await prisma.project.aggregate({
      _avg: {
        budgetMax: true,
      },
      _count: {
        id: true,
      },
    });

    const successRateData = await prisma.project.groupBy({
      by: ['status'],
      where: {
        createdAt: {
          gte: new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      _count: { id: true },
    });

    const completedCount = successRateData.find(s => s.status === 'COMPLETED')?._count.id || 0;
    const totalRecentCount = successRateData.reduce((sum, s) => sum + s._count.id, 0);
    const successRate = totalRecentCount > 0 ? (completedCount / totalRecentCount) * 100 : 0;

    return {
      byStatus: projectStatuses.map(s => ({
        status: s.status,
        count: s._count.id,
      })),
      averageBudget: avgProjectStats._avg.budgetMax || 0,
      totalProjects: avgProjectStats._count.id,
      successRate,
    };
  }

  private static calculatePlatformHealth(data: any) {
    let healthScore = 100;
    const issues: string[] = [];

    // Проверка активности
    if (data.daily.newUsers < 5) {
      healthScore -= 10;
      issues.push('Низкий приток новых пользователей');
    }

    if (data.daily.newProjects < 10) {
      healthScore -= 15;
      issues.push('Мало новых проектов');
    }

    if (data.daily.completedProjects === 0) {
      healthScore -= 20;
      issues.push('Нет завершенных проектов');
    }

    // Проверка роста
    const weeklyGrowth = data.userGrowth.find((g: any) => g.periodDays === 7);
    if (weeklyGrowth && weeklyGrowth.newUsers < 10) {
      healthScore -= 10;
      issues.push('Слабый недельный рост');
    }

    // Проверка завершенности проектов
    if (data.weekly && data.weekly.completedProjects / data.weekly.newProjects < 0.1) {
      healthScore -= 15;
      issues.push('Низкий процент завершения проектов');
    }

    return {
      score: Math.max(0, Math.min(100, healthScore)),
      status: healthScore >= 80 ? 'HEALTHY' : healthScore >= 60 ? 'WARNING' : 'CRITICAL',
      issues,
      recommendations: this.generateRecommendations(issues),
    };
  }

  private static generateRecommendations(issues: string[]) {
    const recommendations: string[] = [];

    if (issues.includes('Низкий приток новых пользователей')) {
      recommendations.push('Запустить реферальную программу');
      recommendations.push('Увеличить маркетинговый бюджет');
    }

    if (issues.includes('Мало новых проектов')) {
      recommendations.push('Упростить процесс создания проектов');
      recommendations.push('Добавить шаблоны проектов');
    }

    if (issues.includes('Низкий процент завершения проектов')) {
      recommendations.push('Улучшить систему эскроу');
      recommendations.push('Добавить посредника для сложных проектов');
    }

    return recommendations;
  }

  // Аналитика для конкретного пользователя
  static async getUserAnalytics(userId: string, periodDays: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays);

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { type: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (user.type === 'FREELANCER') {
        return await this.getFreelancerAnalytics(userId, startDate);
      } else if (user.type === 'CLIENT') {
        return await this.getClientAnalytics(userId, startDate);
      }

      return null;
    } catch (error) {
      logger.error('Get user analytics error:', error);
      throw error;
    }
  }

  private static async getFreelancerAnalytics(userId: string, startDate: Date) {
    const [
      projectsWon,
      projectsApplied,
      earnings,
      profileViews,
      portfolioViews,
      skillsPerformance,
    ] = await Promise.all([
      prisma.project.count({
        where: {
          freelancerId: userId,
          status: 'IN_PROGRESS',
          updatedAt: { gte: startDate },
        },
      }),
      prisma.bid.count({
        where: {
          freelancerId: userId,
          createdAt: { gte: startDate },
        },
      }),
      prisma.transaction.aggregate({
        where: {
          metadata: {
            path: ['freelancerId'],
            equals: userId,
          },
          type: 'ESCROW_RELEASE',
          status: 'COMPLETED',
          createdAt: { gte: startDate },
        },
        _sum: { amount: true },
      }),
      prisma.profileView.count({
        where: {
          viewedUserId: userId,
          viewedAt: { gte: startDate },
        },
      }),
      prisma.portfolioView.count({
        where: {
          portfolio: { userId },
          viewedAt: { gte: startDate },
        },
      }),
      this.analyzeFreelancerSkills(userId, startDate),
    ]);

    const successRate = projectsApplied > 0
      ? (projectsWon / projectsApplied) * 100
      : 0;

    return {
      overview: {
        projectsWon,
        projectsApplied,
        successRate: Math.round(successRate * 10) / 10,
        earnings: earnings._sum.amount || 0,
        profileViews,
        portfolioViews,
      },
      skillsPerformance,
      insights: this.generateFreelancerInsights({
        successRate,
        projectsApplied,
        skillsPerformance,
      }),
    };
  }

  private static async analyzeFreelancerSkills(userId: string, startDate: Date) {
    const freelancer = await prisma.user.findUnique({
      where: { id: userId },
      select: { skills: true },
    });

    if (!freelancer?.skills) {
      return [];
    }

    const skillAnalysis = await Promise.all(
      freelancer.skills.map(async (skill) => {
        // Проекты с этим навыком, на которые фрилансер откликался
        const projectsWithSkill = await prisma.project.count({
          where: {
            skills: { has: skill },
            status: 'ACTIVE',
            createdAt: { gte: startDate },
            bids: {
              some: { freelancerId: userId },
            },
          },
        });

        // Выигранные проекты с этим навыком
        const wonProjectsWithSkill = await prisma.project.count({
          where: {
            skills: { has: skill },
            freelancerId: userId,
            status: 'IN_PROGRESS',
            updatedAt: { gte: startDate },
          },
        });

        // Средний бюджет проектов с этим навыком
        const budgetStats = await prisma.project.aggregate({
          where: {
            skills: { has: skill },
            status: 'ACTIVE',
            createdAt: { gte: startDate },
          },
          _avg: { budgetMax: true },
          _count: { id: true },
        });

        const successRate = projectsWithSkill > 0
          ? (wonProjectsWithSkill / projectsWithSkill) * 100
          : 0;

        return {
          skill,
          projectsApplied: projectsWithSkill,
          projectsWon: wonProjectsWithSkill,
          successRate: Math.round(successRate * 10) / 10,
          avgBudget: budgetStats._avg.budgetMax || 0,
          marketDemand: budgetStats._count.id,
        };
      })
    );

    return skillAnalysis.sort((a, b) => b.successRate - a.successRate);
  }

  private static generateFreelancerInsights(data: any) {
    const insights = [];

    if (data.successRate < 20) {
      insights.push({
        type: 'SUCCESS_RATE',
        title: 'Низкий процент успеха',
        description: 'Рассмотрите возможность пересмотра стратегии подачи предложений',
        priority: 'HIGH',
        suggestions: [
          'Улучшите качество сопроводительных писем',
          'Скорректируйте цены в соответствии с рынком',
          'Добавьте больше работ в портфолио',
        ],
      });
    }

    if (data.projectsApplied < 10) {
      insights.push({
        type: 'ACTIVITY',
        title: 'Мало активности',
        description: 'Увеличьте количество откликов для повышения шансов',
        priority: 'MEDIUM',
        suggestions: [
          'Установите ежедневную цель по откликам',
          'Используйте систему рекомендаций',
          'Настройте уведомления о новых проектах',
        ],
      });
    }

    const underperformingSkills = data.skillsPerformance.filter(
      (skill: any) => skill.successRate < 30 && skill.projectsApplied > 5
    );

    if (underperformingSkills.length > 0) {
      insights.push({
        type: 'SKILL_PERFORMANCE',
        title: 'Навыки с низкой эффективностью',
        description: `Некоторые навыки показывают низкий процент успеха: ${underperformingSkills.map((s: any) => s.skill).join(', ')}`,
        priority: 'MEDIUM',
        suggestions: [
          'Повысьте квалификацию по этим навыкам',
          'Сосредоточьтесь на более сильных навыках',
          'Пересмотрите ценовую политику для этих навыков',
        ],
      });
    }

    return insights;
  }

  private static async getClientAnalytics(userId: string, startDate: Date) {
    const [
      projectsCreated,
      projectsCompleted,
      totalSpent,
      freelancersHired,
      projectSuccessRate,
    ] = await Promise.all([
      prisma.project.count({
        where: {
          clientId: userId,
          createdAt: { gte: startDate },
        },
      }),
      prisma.project.count({
        where: {
          clientId: userId,
          status: 'COMPLETED',
          updatedAt: { gte: startDate },
        },
      }),
      prisma.transaction.aggregate({
        where: {
          userId,
          type: 'ESCROW_HOLD',
          status: 'COMPLETED',
          createdAt: { gte: startDate },
        },
        _sum: { amount: true },
      }),
      prisma.project.count({
        where: {
          clientId: userId,
          freelancerId: { not: null },
          createdAt: { gte: startDate },
        },
      }),
      this.calculateClientProjectSuccessRate(userId, startDate),
    ]);

    const avgProjectCost = projectsCreated > 0
      ? (totalSpent._sum.amount || 0) / projectsCreated
      : 0;

    const hireRate = projectsCreated > 0
      ? (freelancersHired / projectsCreated) * 100
      : 0;

    return {
      overview: {
        projectsCreated,
        projectsCompleted,
        totalSpent: totalSpent._sum.amount || 0,
        avgProjectCost: Math.round(avgProjectCost),
        freelancersHired,
        hireRate: Math.round(hireRate * 10) / 10,
        projectSuccessRate: Math.round(projectSuccessRate * 10) / 10,
      },
      insights: this.generateClientInsights({
        hireRate,
        projectSuccessRate,
        projectsCreated,
      }),
    };
  }

  private static async calculateClientProjectSuccessRate(userId: string, startDate: Date) {
    const allProjects = await prisma.project.count({
      where: {
        clientId: userId,
        createdAt: { gte: startDate },
        status: { in: ['COMPLETED', 'CANCELLED'] },
      },
    });

    const successfulProjects = await prisma.project.count({
      where: {
        clientId: userId,
        status: 'COMPLETED',
        updatedAt: { gte: startDate },
      },
    });

    return allProjects > 0 ? (successfulProjects / allProjects) * 100 : 0;
  }

  private static generateClientInsights(data: any) {
    const insights = [];

    if (data.hireRate < 50) {
      insights.push({
        type: 'HIRE_RATE',
        title: 'Низкий процент найма',
        description: 'Мало проектов завершается наймом фрилансера',
        priority: 'HIGH',
        suggestions: [
          'Уточняйте требования в описании проекта',
          'Рассмотрите возможность увеличения бюджета',
          'Быстрее отвечайте на предложения фрилансеров',
        ],
      });
    }

    if (data.projectSuccessRate < 70) {
      insights.push({
        type: 'SUCCESS_RATE',
        title: 'Низкий процент успешных проектов',
        description: 'Многие проекты завершаются неудачно',
        priority: 'HIGH',
        suggestions: [
          'Улучшите коммуникацию с фрилансерами',
          'Используйте систему эскроу для всех проектов',
          'Тщательнее выбирайте фрилансеров',
        ],
      });
    }

    if (data.projectsCreated === 0) {
      insights.push({
        type: 'ACTIVITY',
        title: 'Нет активности',
        description: 'Вы еще не создали ни одного проекта',
        priority: 'MEDIUM',
        suggestions: [
          'Создайте первый проект',
          'Изучите возможности платформы',
          'Посмотрите примеры успешных проектов',
        ],
      });
    }

    return insights;
  }

  // Отслеживание событий
  static async trackEvent(userId: string, eventType: string, data: any = {}) {
    try {
      await prisma.analyticsEvent.create({
        data: {
          userId,
          eventType,
          data,
        },
      });

      // Обновление счетчиков в реальном времени (опционально)
      await this.updateRealTimeCounters(eventType);
    } catch (error) {
      logger.error('Track event error:', error);
    }
  }

  private static async updateRealTimeCounters(eventType: string) {
    // Здесь можно обновлять счетчики в Redis для реальной аналитики
    // Например, количество активных пользователей, проектов и т.д.
  }
}