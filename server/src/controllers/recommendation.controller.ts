import { Request, Response } from 'express';
import { db } from '../lib/db';
import { AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';

export class RecommendationController {
  // Рекомендации проектов для фрилансера
  static async getProjectRecommendations(req: AuthRequest, res: Response) {
    try {
      const freelancerId = req.user.id;
      const { limit = 10 } = req.query;
      const take = parseInt(limit as string);

      // Получение профиля фрилансера
      const freelancer = await db.findOne<any>('profiles', freelancerId);

      if (!freelancer) {
        return res.status(404).json({
          success: false,
          message: 'Фрилансер не найден',
        });
      }

      // Проверка что пользователь фрилансер
      if (freelancer.user_type !== 'freelancer') {
        return res.status(400).json({
          success: false,
          message: 'Рекомендации проектов доступны только фрилансерам',
        });
      }

      // Поиск подходящих проектов
      const where: any[] = [
        { column: 'status', operator: 'eq', value: 'ACTIVE' },
        { column: 'is_hidden', operator: 'eq', value: false },
        { column: 'deadline', operator: 'gt', value: new Date().toISOString() }
      ];

      // Рекомендации по категории
      if (freelancer.category_id) {
        where.push({ column: 'category_id', operator: 'eq', value: freelancer.category_id });
      }

      // Поиск проектов (базовый поиск)
      const projectsResult = await db.find<any>('projects', {
        where,
        limit: take * 2, // Берем больше для фильтрации
        orderBy: {
          column: 'created_at',
          ascending: false
        }
      });

      if (!projectsResult.data || projectsResult.data.length === 0) {
        return res.json({
          success: true,
          data: [],
          message: 'Нет подходящих проектов в данный момент'
        });
      }

      // Расчет релевантности для каждого проекта
      const recommendations = await Promise.all(
        projectsResult.data.map(async (project: any) => {
          let relevanceScore = 0;
          const matchReasons: string[] = [];

          // Получаем связанные данные
          const [client, category, subcategory, skills, bidCountResult] = await Promise.all([
            db.findOneBy<any>('profiles', 'id', project.client_id),
            project.category_id ? db.findOne<any>('categories', project.category_id) : null,
            project.subcategory_id ? db.findOne<any>('subcategories', project.subcategory_id) : null,
            project.skills || [],
            db.count('bids', [
              { column: 'project_id', operator: 'eq', value: project.id }
            ])
          ]);

          const bidCount = bidCountResult || 0;

          // Совпадение навыков (если есть навыки у фрилансера и проекта)
          if (freelancer.skills && skills.length > 0) {
            const freelancerSkills = Array.isArray(freelancer.skills) ? freelancer.skills : [];
            const matchedSkills = freelancerSkills.filter((skill: string) =>
              skills.includes(skill)
            );
            if (matchedSkills.length > 0) {
              relevanceScore += matchedSkills.length * 10;
              matchReasons.push(`Совпадение навыков: ${matchedSkills.join(', ')}`);
            }
          }

          // Совпадение категории
          if (freelancer.category_id === project.category_id) {
            relevanceScore += 20;
            matchReasons.push('Совпадение категории');
          }

          // Совпадение подкатегории
          if (freelancer.subcategory_id === project.subcategory_id) {
            relevanceScore += 30;
            matchReasons.push('Совпадение специализации');
          }

          // Бюджет в диапазоне (примерно 2x почасовой ставки)
          if (freelancer.hourly_rate && project.budget_max) {
            const estimatedHours = project.budget_max / freelancer.hourly_rate;
            if (estimatedHours >= 5 && estimatedHours <= 100) {
              relevanceScore += 15;
              matchReasons.push('Подходящий бюджет');
            }
          }

          // Актуальность (новые проекты получают бонус)
          const projectCreated = new Date(project.created_at);
          const daysOld = Math.floor(
            (new Date().getTime() - projectCreated.getTime()) /
            (1000 * 60 * 60 * 24)
          );
          if (daysOld < 3) {
            relevanceScore += 25;
            matchReasons.push('Свежий проект');
          }

          // Проекты с меньшим количеством предложений
          if (bidCount < 5) {
            relevanceScore += 10;
            matchReasons.push('Мало конкурентов');
          }

          // Дополнительные факторы
          if (client?.rating && client.rating >= 4) {
            relevanceScore += 5;
            matchReasons.push('Надежный клиент');
          }

          return {
            id: project.id,
            title: project.title,
            description: project.description,
            budgetMin: project.budget_min,
            budgetMax: project.budget_max,
            deadline: project.deadline,
            status: project.status,
            createdAt: project.created_at,
            client: client ? {
              id: client.id,
              firstName: client.first_name,
              lastName: client.last_name,
              avatar: client.avatar,
              rating: client.rating,
            } : null,
            category: category,
            subcategory: subcategory,
            skills: skills,
            bidCount,
            relevanceScore: Math.round(relevanceScore),
            matchReasons: matchReasons.length > 0 ? matchReasons : ['Базовые рекомендации'],
          };
        })
      );

      // Сортировка по релевантности
      recommendations.sort((a, b) => b.relevanceScore - a.relevanceScore);

      // Фильтруем слишком низкую релевантность (меньше 10 баллов)
      const filteredRecommendations = recommendations
        .filter(item => item.relevanceScore >= 10)
        .slice(0, take);

      res.json({
        success: true,
        data: filteredRecommendations,
        metadata: {
          totalAnalyzed: recommendations.length,
          recommended: filteredRecommendations.length,
          minRelevanceScore: filteredRecommendations.length > 0 
            ? Math.min(...filteredRecommendations.map(r => r.relevanceScore))
            : 0,
        },
      });
    } catch (error: any) {
      logger.error('Get project recommendations error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при получении рекомендаций',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Рекомендации фрилансеров для проекта
  static async getFreelancerRecommendations(req: AuthRequest, res: Response) {
    try {
      const { projectId } = req.params;
      const { limit = 10 } = req.query;
      const take = parseInt(limit as string);

      // Получение проекта
      const project = await db.findOne<any>('projects', projectId);

      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Проект не найден',
        });
      }

      // Проверка прав доступа
      if (project.client_id !== req.user.id && req.user.type !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Нет прав для получения рекомендаций',
        });
      }

      // Поиск подходящих фрилансеров
      const where: any[] = [
        { column: 'user_type', operator: 'eq', value: 'freelancer' },
        { column: 'is_active', operator: 'eq', value: true },
        { column: 'is_verified', operator: 'eq', value: true }
      ];

      // Фильтрация по категории
      if (project.category_id) {
        where.push({ column: 'category_id', operator: 'eq', value: project.category_id });
      }

      // Фильтрация по уровню опыта
      if (project.experience_level) {
        switch (project.experience_level) {
          case 'ENTRY':
            where.push({ column: 'experience_years', operator: 'lte', value: 2 });
            break;
          case 'INTERMEDIATE':
            where.push({ column: 'experience_years', operator: 'gte', value: 2 });
            where.push({ column: 'experience_years', operator: 'lte', value: 5 });
            break;
          case 'EXPERT':
            where.push({ column: 'experience_years', operator: 'gte', value: 5 });
            break;
        }
      }

      // Поиск фрилансеров
      const freelancersResult = await db.find<any>('profiles', {
        where,
        limit: take * 2, // Берем больше для фильтрации
        orderBy: {
          column: 'rating',
          ascending: false
        }
      });

      if (!freelancersResult.data || freelancersResult.data.length === 0) {
        return res.json({
          success: true,
          data: {
            recommendations: [],
            byCategory: {},
            projectDetails: {
              title: project.title,
              budget: project.budget_max,
              skills: project.skills,
            },
          },
          message: 'Нет подходящих фрилансеров в данный момент'
        });
      }

      // Расчет релевантности для каждого фрилансера
      const recommendations = await Promise.all(
        freelancersResult.data.map(async (freelancer: any) => {
          let relevanceScore = 0;
          const matchReasons: string[] = [];

          // Получаем данные портфолио
          const portfolioResult = await db.find<any>('portfolio_items', {
            where: [
              { column: 'user_id', operator: 'eq', value: freelancer.id },
              { column: 'is_hidden', operator: 'eq', value: false }
            ],
            limit: 3
          });

          const portfolioCount = portfolioResult.count || 0;

          // Совпадение навыков
          const projectSkills = Array.isArray(project.skills) ? project.skills : [];
          const freelancerSkills = Array.isArray(freelancer.skills) ? freelancer.skills : [];
          
          if (projectSkills.length > 0 && freelancerSkills.length > 0) {
            const matchedSkills = projectSkills.filter(skill =>
              freelancerSkills.includes(skill)
            );
            if (matchedSkills.length > 0) {
              relevanceScore += matchedSkills.length * 15;
              matchReasons.push(`Совпадение навыков: ${matchedSkills.join(', ')}`);
            }
          }

          // Совпадение категории
          if (project.category_id === freelancer.category_id) {
            relevanceScore += 20;
            matchReasons.push('Совпадение категории');
          }

          // Рейтинг фрилансера
          if (freelancer.rating) {
            relevanceScore += freelancer.rating * 10;
            matchReasons.push(`Рейтинг: ${freelancer.rating}`);
          }

          // Опыт работы
          if (freelancer.experience_years) {
            relevanceScore += freelancer.experience_years * 5;
            matchReasons.push(`Опыт: ${freelancer.experience_years} лет`);
          }

          // Количество завершенных проектов
          const completedProjects = freelancer.completed_projects_count || 0;
          relevanceScore += Math.min(completedProjects, 50);
          matchReasons.push(`Проектов: ${completedProjects}`);

          // Портфолио
          relevanceScore += Math.min(portfolioCount, 10) * 2;
          if (portfolioCount > 0) {
            matchReasons.push(`Портфолио: ${portfolioCount} работ`);
          }

          // Соответствие бюджету
          if (freelancer.hourly_rate && project.budget_max) {
            const estimatedHours = project.budget_max / freelancer.hourly_rate;
            if (estimatedHours >= 10 && estimatedHours <= 200) {
              relevanceScore += 15;
              matchReasons.push('Соответствие бюджету');
            }
          }

          // Активность (последний логин)
          if (freelancer.last_login) {
            const lastLogin = new Date(freelancer.last_login);
            const daysSinceLogin = Math.floor(
              (new Date().getTime() - lastLogin.getTime()) /
              (1000 * 60 * 60 * 24)
            );
            if (daysSinceLogin < 7) {
              relevanceScore += 10;
              matchReasons.push('Активный недавно');
            }
          }

          // Расчет примерной стоимости
          let estimatedCost = 0;
          if (freelancer.hourly_rate && project.budget_max) {
            const estimatedHours = project.budget_max / freelancer.hourly_rate;
            estimatedCost = Math.round(freelancer.hourly_rate * estimatedHours);
          }

          // Получаем категорию фрилансера
          let category = null;
          if (freelancer.category_id) {
            category = await db.findOne<any>('categories', freelancer.category_id);
          }

          return {
            id: freelancer.id,
            firstName: freelancer.first_name,
            lastName: freelancer.last_name,
            avatar: freelancer.avatar,
            title: freelancer.title,
            description: freelancer.description,
            rating: freelancer.rating || 0,
            hourlyRate: freelancer.hourly_rate || 0,
            experienceYears: freelancer.experience_years || 0,
            skills: freelancerSkills,
            portfolioCount,
            completedProjects,
            relevanceScore: Math.round(relevanceScore),
            matchReasons: matchReasons.length > 0 ? matchReasons : ['Базовые рекомендации'],
            estimatedCost,
            categoryName: category?.name || 'Без категории',
          };
        })
      );

      // Сортировка по релевантности
      recommendations.sort((a, b) => b.relevanceScore - a.relevanceScore);

      // Фильтруем слишком низкую релевантность
      const filteredRecommendations = recommendations
        .filter(item => item.relevanceScore >= 20)
        .slice(0, take);

      // Группировка по категориям
      const byCategory = filteredRecommendations.reduce((acc, freelancer) => {
        const category = freelancer.categoryName;
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(freelancer);
        return acc;
      }, {} as { [key: string]: any[] });

      res.json({
        success: true,
        data: {
          recommendations: filteredRecommendations,
          byCategory,
          projectDetails: {
            title: project.title,
            budget: project.budget_max,
            skills: project.skills,
            experienceLevel: project.experience_level,
          },
        },
        metadata: {
          totalAnalyzed: recommendations.length,
          recommended: filteredRecommendations.length,
          categoriesCount: Object.keys(byCategory).length,
        },
      });
    } catch (error: any) {
      logger.error('Get freelancer recommendations error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при получении рекомендаций',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Умное сопоставление (Smart Matching)
  static async getSmartMatches(req: AuthRequest, res: Response) {
    try {
      const userId = req.user.id;
      const userType = req.user.type;
      const { limit = 5 } = req.query;

      if (userType === 'FREELANCER') {
        // Для фрилансера: лучшие проекты
        return this.getProjectRecommendations(req, res);
      } else if (userType === 'CLIENT') {
        // Для клиента: лучшие фрилансеры для его активных проектов
        
        // Получение активных проектов клиента
        const activeProjectsResult = await db.find<any>('projects', {
          where: [
            { column: 'client_id', operator: 'eq', value: userId },
            { column: 'status', operator: 'eq', value: 'ACTIVE' }
          ],
          limit: 3,
          orderBy: {
            column: 'created_at',
            ascending: false
          }
        });

        const activeProjects = activeProjectsResult.data || [];

        if (activeProjects.length === 0) {
          return res.json({
            success: true,
            data: {
              message: 'У вас нет активных проектов',
              matches: [],
            },
          });
        }

        // Получение рекомендаций для каждого проекта
        const allMatches = [];
        
        for (const project of activeProjects) {
          try {
            // Упрощенный поиск фрилансеров для проекта
            const freelancersResult = await db.find<any>('profiles', {
              where: [
                { column: 'user_type', operator: 'eq', value: 'freelancer' },
                { column: 'is_active', operator: 'eq', value: true },
                { column: 'is_verified', operator: 'eq', value: true },
                project.category_id ? { column: 'category_id', operator: 'eq', value: project.category_id } : null
              ].filter(Boolean),
              limit: 3,
              orderBy: {
                column: 'rating',
                ascending: false
              }
            });

            const freelancers = freelancersResult.data || [];

            // Расчет match score
            const freelancersWithScore = freelancers.map(freelancer => {
              let matchScore = 50; // Базовый балл
              
              // Категория
              if (freelancer.category_id === project.category_id) {
                matchScore += 20;
              }
              
              // Рейтинг
              if (freelancer.rating) {
                matchScore += freelancer.rating * 5;
              }
              
              // Опыт
              if (freelancer.experience_years) {
                matchScore += Math.min(freelancer.experience_years, 10) * 2;
              }

              return {
                id: freelancer.id,
                firstName: freelancer.first_name,
                lastName: freelancer.last_name,
                avatar: freelancer.avatar,
                title: freelancer.title,
                rating: freelancer.rating || 0,
                hourlyRate: freelancer.hourly_rate || 0,
                matchScore: Math.min(Math.round(matchScore), 100),
              };
            });

            allMatches.push({
              project: {
                id: project.id,
                title: project.title,
              },
              freelancers: freelancersWithScore.sort((a, b) => b.matchScore - a.matchScore),
            });
          } catch (error) {
            logger.error(`Error getting matches for project ${project.id}:`, error);
          }
        }

        res.json({
          success: true,
          data: {
            matches: allMatches,
            summary: {
              activeProjects: activeProjects.length,
              totalFreelancers: allMatches.reduce((sum, match) => sum + match.freelancers.length, 0),
            },
          },
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Неподдерживаемый тип пользователя',
        });
      }
    } catch (error: any) {
      logger.error('Get smart matches error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при получении умных совпадений',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Сохранение лайков/дизлайков для улучшения рекомендаций
  static async saveFeedback(req: AuthRequest, res: Response) {
    try {
      const { type, itemId, liked } = req.body;

      if (!type || !itemId || liked === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Недостаточно данных',
        });
      }

      // Валидация типа
      const validTypes = ['PROJECT', 'FREELANCER'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Неверный тип. Допустимые значения: PROJECT, FREELANCER',
        });
      }

      // Проверка существования элемента
      let itemExists = false;
      if (type === 'PROJECT') {
        const project = await db.findOne<any>('projects', itemId);
        itemExists = !!project;
      } else if (type === 'FREELANCER') {
        const freelancer = await db.findOne<any>('profiles', itemId);
        itemExists = !!freelancer && freelancer.user_type === 'freelancer';
      }

      if (!itemExists) {
        return res.status(404).json({
          success: false,
          message: 'Элемент не найден',
        });
      }

      // Сохранение фидбека
      const feedback = await db.create<any>('recommendation_feedback', {
        user_id: req.user.id,
        type,
        item_id: itemId,
        liked: Boolean(liked),
        created_at: new Date().toISOString(),
      });

      // Обновление рекомендаций пользователя (можно вынести в фоновую задачу)
      // Пока просто логируем
      logger.info(`User ${req.user.id} feedback: ${type} ${itemId} - ${liked ? 'liked' : 'disliked'}`);

      res.json({
        success: true,
        message: 'Спасибо за обратную связь! Это поможет улучшить рекомендации.',
        data: feedback,
      });
    } catch (error: any) {
      logger.error('Save feedback error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при сохранении обратной связи',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Получение трендовых навыков
  static async getTrendingSkills(req: Request, res: Response) {
    try {
      const { days = 30, limit = 10 } = req.query;
      const daysInt = parseInt(days as string);
      const limitInt = parseInt(limit as string);

      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - daysInt);

      // Анализ проектов за указанный период
      const recentProjectsResult = await db.find<any>('projects', {
        where: [
          { column: 'created_at', operator: 'gte', value: daysAgo.toISOString() },
          { column: 'status', operator: 'eq', value: 'ACTIVE' }
        ],
        limit: 1000
      });

      const recentProjects = recentProjectsResult.data || [];

      // Анализ навыков фрилансеров
      const freelancersResult = await db.find<any>('profiles', {
        where: [
          { column: 'user_type', operator: 'eq', value: 'freelancer' },
          { column: 'is_active', operator: 'eq', value: true }
        ],
        limit: 1000
      });

      const freelancers = freelancersResult.data || [];

      // Сбор статистики по навыкам
      const skillStats: {
        [key: string]: {
          count: number;
          totalBudget: number;
          avgHourlyRate: number;
          demandScore: number;
        }
      } = {};

      // Анализ спроса (проекты)
      recentProjects.forEach((project: any) => {
        const skills = Array.isArray(project.skills) ? project.skills : [];
        skills.forEach((skill: string) => {
          if (!skill) return;
          
          if (!skillStats[skill]) {
            skillStats[skill] = {
              count: 0,
              totalBudget: 0,
              avgHourlyRate: 0,
              demandScore: 0,
            };
          }
          skillStats[skill].count++;
          skillStats[skill].totalBudget += project.budget_max || 0;
        });
      });

      // Анализ предложения (фрилансеры)
      const freelancerSkillCount: { [key: string]: number } = {};
      const freelancerHourlyRates: { [key: string]: number[] } = {};

      freelancers.forEach((freelancer: any) => {
        const skills = Array.isArray(freelancer.skills) ? freelancer.skills : [];
        skills.forEach((skill: string) => {
          if (!skill) return;
          
          freelancerSkillCount[skill] = (freelancerSkillCount[skill] || 0) + 1;
          
          if (!freelancerHourlyRates[skill]) {
            freelancerHourlyRates[skill] = [];
          }
          freelancerHourlyRates[skill].push(freelancer.hourly_rate || 0);
        });
      });

      // Расчет метрик
      const skillsWithMetrics = Object.entries(skillStats)
        .map(([skill, stats]) => {
          const freelancerCount = freelancerSkillCount[skill] || 0;
          const projectCount = stats.count;
          
          // Спрос/предложение
          const demandSupplyRatio = freelancerCount > 0 
            ? projectCount / freelancerCount 
            : projectCount;
          
          // Средний бюджет на проект
          const avgBudgetPerProject = projectCount > 0
            ? stats.totalBudget / projectCount
            : 0;
          
          // Средняя почасовая ставка
          const rates = freelancerHourlyRates[skill] || [];
          const avgHourlyRate = rates.length > 0 
            ? rates.reduce((a, b) => a + b, 0) / rates.length 
            : 0;
          
          // Расчет трендового скора
          const demandScore = (
            demandSupplyRatio * 0.4 +
            (avgBudgetPerProject / 10000) * 0.3 +
            (projectCount / Math.max(recentProjects.length, 1)) * 0.3
          );

          return {
            skill,
            projectCount,
            freelancerCount,
            demandSupplyRatio: Math.round(demandSupplyRatio * 100) / 100,
            avgBudgetPerProject: Math.round(avgBudgetPerProject),
            avgHourlyRate: Math.round(avgHourlyRate),
            demandScore: Math.round(demandScore * 100) / 100,
            demandLevel: demandSupplyRatio > 2 ? 'ВЫСОКИЙ' : demandSupplyRatio > 0.5 ? 'СРЕДНИЙ' : 'НИЗКИЙ',
          };
        })
        .filter(item => item.projectCount >= 3) // Минимум 3 проекта
        .sort((a, b) => b.demandScore - a.demandScore)
        .slice(0, limitInt);

      res.json({
        success: true,
        data: {
          trendingSkills: skillsWithMetrics,
          periodDays: daysInt,
          totalProjectsAnalyzed: recentProjects.length,
          totalFreelancersAnalyzed: freelancers.length,
          updatedAt: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      logger.error('Get trending skills error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при получении трендовых навыков',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Аналитика для фрилансера
  static async getFreelancerAnalytics(req: AuthRequest, res: Response) {
    try {
      const freelancerId = req.user.id;

      // Проверка что пользователь фрилансер
      const freelancer = await db.findOne<any>('profiles', freelancerId);

      if (!freelancer || freelancer.user_type !== 'freelancer') {
        return res.status(403).json({
          success: false,
          message: 'Доступно только для фрилансеров',
        });
      }

      // Статистика за последние 30 дней
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [
        projectsWonResult,
        projectsAppliedResult,
        totalEarningsResult,
        profileViewsResult,
        skillDemandResult,
      ] = await Promise.all([
        // Выигранные проекты (проекты где фрилансер назначен)
        db.count('projects', [
          { column: 'freelancer_id', operator: 'eq', value: freelancerId },
          { column: 'status', operator: 'in', value: ['IN_PROGRESS', 'COMPLETED'] },
          { column: 'created_at', operator: 'gte', value: thirtyDaysAgo.toISOString() }
        ]),
        
        // Отправленные предложения
        db.count('bids', [
          { column: 'freelancer_id', operator: 'eq', value: freelancerId },
          { column: 'created_at', operator: 'gte', value: thirtyDaysAgo.toISOString() }
        ]),
        
        // Заработок (транзакции для фрилансера)
        db.queryRaw(`
          SELECT COALESCE(SUM(amount), 0) as total_earned
          FROM transactions
          WHERE user_id = '${freelancerId}'
            AND type IN ('ESCROW_RELEASE', 'PROJECT_PAYMENT')
            AND status = 'COMPLETED'
            AND created_at >= '${thirtyDaysAgo.toISOString()}'
        `),
        
        // Просмотры профиля
        db.count('profile_views', [
          { column: 'viewed_user_id', operator: 'eq', value: freelancerId },
          { column: 'viewed_at', operator: 'gte', value: thirtyDaysAgo.toISOString() }
        ]).catch(() => 0), // Если таблицы нет
        
        // Спрос на навыки фрилансера
        this.getSkillDemandForFreelancer(freelancerId)
      ]);

      const projectsWon = projectsWonResult || 0;
      const projectsApplied = projectsAppliedResult || 0;
      const totalEarnings = totalEarningsResult.data?.[0]?.total_earned || 0;
      const profileViews = profileViewsResult || 0;
      const skillDemand = skillDemandResult;

      // Коэффициент успеха
      const successRate = projectsApplied > 0
        ? (projectsWon / projectsApplied) * 100
        : 0;

      // Рекомендации
      const recommendations = this.generateFreelancerRecommendations({
        successRate,
        projectsApplied,
        projectsWon,
        skillDemand,
        profileViews,
      });

      res.json({
        success: true,
        data: {
          period: '30_days',
          dateRange: {
            start: thirtyDaysAgo.toISOString(),
            end: new Date().toISOString(),
          },
          overview: {
            projectsWon,
            projectsApplied,
            successRate: Math.round(successRate * 10) / 10,
            totalEarnings: Math.round(totalEarnings),
            profileViews,
            avgEarningsPerProject: projectsWon > 0 ? Math.round(totalEarnings / projectsWon) : 0,
          },
          skillDemand,
          recommendations,
          insights: this.generateFreelancerInsights({
            successRate,
            totalEarnings,
            profileViews,
            projectsApplied,
          }),
        },
      });
    } catch (error: any) {
      logger.error('Get freelancer analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при получении аналитики',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  private static async getSkillDemandForFreelancer(freelancerId: string) {
    try {
      // Получение навыков фрилансера
      const freelancer = await db.findOne<any>('profiles', freelancerId);
      
      if (!freelancer?.skills || !Array.isArray(freelancer.skills)) {
        return [];
      }

      const skills = freelancer.skills;
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const skillDemand = await Promise.all(
        skills.map(async (skill: string) => {
          const [projectCountResult, freelancerCountResult] = await Promise.all([
            // Количество проектов с этим навыком
            db.count('projects', [
              { column: 'skills', operator: 'cs', value: `{${skill}}` },
              { column: 'status', operator: 'eq', value: 'ACTIVE' },
              { column: 'created_at', operator: 'gte', value: thirtyDaysAgo.toISOString() }
            ]),
            
            // Количество фрилансеров с этим навыком
            db.count('profiles', [
              { column: 'skills', operator: 'cs', value: `{${skill}}` },
              { column: 'user_type', operator: 'eq', value: 'freelancer' },
              { column: 'is_active', operator: 'eq', value: true }
            ])
          ]);

          const projectCount = projectCountResult || 0;
          const freelancerCount = freelancerCountResult || 0;

          const demandScore = freelancerCount > 0
            ? projectCount / freelancerCount
            : projectCount;

          return {
            skill,
            projectCount,
            freelancerCount,
            demandScore: Math.round(demandScore * 100) / 100,
            demandLevel: demandScore > 2 ? 'ВЫСОКИЙ' : demandScore > 0.5 ? 'СРЕДНИЙ' : 'НИЗКИЙ',
          };
        })
      );

      return skillDemand.sort((a, b) => b.demandScore - a.demandScore);
    } catch (error) {
      logger.error('Get skill demand for freelancer error:', error);
      return [];
    }
  }

  private static generateFreelancerRecommendations(data: any) {
    const recommendations = [];

    if (data.successRate < 10 && data.projectsApplied >= 5) {
      recommendations.push({
        type: 'SUCCESS_RATE',
        title: 'Низкий процент побед',
        message: 'Попробуйте улучшить качество предложений: добавляйте портфолио, подробное описание, предлагайте конкурентные цены.',
        action: 'review_portfolio',
        priority: 'HIGH',
      });
    }

    if (data.projectsApplied < 5) {
      recommendations.push({
        type: 'ACTIVITY',
        title: 'Мало активностей',
        message: 'Отправляйте больше предложений. Рекомендуется 5-10 предложений в неделю для лучших результатов.',
        action: 'increase_activity',
        priority: 'MEDIUM',
      });
    }

    if (data.profileViews < 10) {
      recommendations.push({
        type: 'PROFILE_VISIBILITY',
        title: 'Низкая видимость профиля',
        message: 'Заполните профиль полностью, добавьте портфолио, отзывы и сертификаты.',
        action: 'complete_profile',
        priority: 'MEDIUM',
      });
    }

    // Рекомендации по навыкам
    const lowDemandSkills = data.skillDemand?.filter((s: any) => s.demandLevel === 'НИЗКИЙ') || [];
    if (lowDemandSkills.length > 0) {
      recommendations.push({
        type: 'SKILL_DEMAND',
        title: 'Низкий спрос на навыки',
        message: `Рассмотрите изучение более востребованных навыков: ${lowDemandSkills.map((s: any) => s.skill).join(', ')}`,
        action: 'upskill',
        priority: 'MEDIUM',
      });
    }

    return recommendations;
  }

  private static generateFreelancerInsights(data: any) {
    const insights = [];

    if (data.successRate > 30) {
      insights.push({
        type: 'POSITIVE',
        message: 'Отличный процент побед! Продолжайте в том же духе.',
      });
    }

    if (data.totalEarnings > 50000) {
      insights.push({
        type: 'POSITIVE',
        message: 'Отличные заработки за период!',
      });
    }

    if (data.profileViews > 50) {
      insights.push({
        type: 'POSITIVE',
        message: 'Ваш профиль привлекает внимание клиентов.',
      });
    }

    if (data.projectsApplied > 20 && data.successRate < 15) {
      insights.push({
        type: 'NEUTRAL',
        message: 'Много заявок, но мало побед. Возможно стоит более тщательно выбирать проекты.',
      });
    }

    return insights;
  }
}