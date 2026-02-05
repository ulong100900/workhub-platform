import { Request, Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';

export class SearchController {
  // Поиск проектов
  static async searchProjects(req: Request, res: Response) {
    try {
      const {
        query,
        category,
        subcategory,
        minBudget,
        maxBudget,
        experienceLevel,
        status,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        limit = 20,
      } = req.query;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const take = parseInt(limit as string);

      // Построение фильтров
      const where: any = {
        status: { in: ['ACTIVE', 'IN_PROGRESS'] }, // Показываем только активные проекты
        isHidden: false,
      };

      // Поиск по тексту
      if (query) {
        where.OR = [
          { title: { contains: query as string, mode: 'insensitive' } },
          { description: { contains: query as string, mode: 'insensitive' } },
          { tags: { has: query as string } },
        ];
      }

      // Фильтры
      if (category) {
        where.categoryId = category;
      }

      if (subcategory) {
        where.subcategoryId = subcategory;
      }

      if (minBudget || maxBudget) {
        where.budgetMax = {};
        if (minBudget) where.budgetMax.gte = parseFloat(minBudget as string);
        if (maxBudget) where.budgetMax.lte = parseFloat(maxBudget as string);
      }

      if (experienceLevel) {
        where.experienceLevel = experienceLevel;
      }

      if (status) {
        where.status = status;
      }

      // Сортировка
      const orderBy: any = {};
      switch (sortBy) {
        case 'budgetMax':
          orderBy.budgetMax = sortOrder;
          break;
        case 'deadline':
          orderBy.deadline = sortOrder;
          break;
        case 'popularity':
          orderBy.viewsCount = sortOrder;
          break;
        default:
          orderBy.createdAt = sortOrder;
      }

      // Поиск проектов
      const [projects, total] = await Promise.all([
        prisma.project.findMany({
          where,
          skip,
          take,
          orderBy,
          include: {
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
                rating: true,
                reviewsCount: true,
              },
            },
            category: true,
            subcategory: true,
            skills: true,
            _count: {
              select: {
                bids: true,
              },
            },
          },
        }),
        prisma.project.count({ where }),
      ]);

      // Формирование агрегаций для фильтров
      const aggregations = await prisma.project.aggregate({
        where,
        _min: { budgetMax: true },
        _max: { budgetMax: true },
        _count: true,
      });

      res.json({
        success: true,
        data: {
          projects,
          aggregations: {
            budget: {
              min: aggregations._min.budgetMax || 0,
              max: aggregations._max.budgetMax || 0,
            },
            total: aggregations._count,
          },
          pagination: {
            page: parseInt(page as string),
            limit: take,
            total,
            pages: Math.ceil(total / take),
          },
        },
      });
    } catch (error) {
      logger.error('Search projects error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при поиске проектов',
      });
    }
  }

  // Поиск фрилансеров
  static async searchFreelancers(req: Request, res: Response) {
    try {
      const {
        query,
        category,
        skills,
        minRate,
        maxRate,
        minRating,
        country,
        city,
        experience,
        sortBy = 'rating',
        sortOrder = 'desc',
        page = 1,
        limit = 20,
      } = req.query;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const take = parseInt(limit as string);

      // Построение фильтров
      const where: any = {
        type: 'FREELANCER',
        isActive: true,
        isVerified: true,
      };

      // Поиск по тексту
      if (query) {
        where.OR = [
          { firstName: { contains: query as string, mode: 'insensitive' } },
          { lastName: { contains: query as string, mode: 'insensitive' } },
          { title: { contains: query as string, mode: 'insensitive' } },
          { description: { contains: query as string, mode: 'insensitive' } },
        ];
      }

      // Фильтры
      if (skills) {
        const skillsArray = (skills as string).split(',');
        where.skills = {
          hasSome: skillsArray,
        };
      }

      if (minRate || maxRate) {
        where.hourlyRate = {};
        if (minRate) where.hourlyRate.gte = parseFloat(minRate as string);
        if (maxRate) where.hourlyRate.lte = parseFloat(maxRate as string);
      }

      if (minRating) {
        where.rating = { gte: parseFloat(minRating as string) };
      }

      if (country) {
        where.country = country;
      }

      if (city) {
        where.city = { contains: city as string, mode: 'insensitive' };
      }

      if (experience) {
        where.experienceYears = { gte: parseInt(experience as string) };
      }

      // Сортировка
      const orderBy: any = {};
      switch (sortBy) {
        case 'rate':
          orderBy.hourlyRate = sortOrder;
          break;
        case 'experience':
          orderBy.experienceYears = sortOrder;
          break;
        case 'projects':
          orderBy.completedProjectsCount = sortOrder;
          break;
        default:
          orderBy.rating = sortOrder;
      }

      // Поиск фрилансеров
      const [freelancers, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take,
          orderBy,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            title: true,
            description: true,
            rating: true,
            reviewsCount: true,
            hourlyRate: true,
            country: true,
            city: true,
            experienceYears: true,
            completedProjectsCount: true,
            skills: true,
            portfolio: true,
            languages: true,
            certifications: true,
          },
        }),
        prisma.user.count({ where }),
      ]);

      // Получение уникальных навыков для фильтров
      const uniqueSkills = await prisma.user.findMany({
        where: {
          type: 'FREELANCER',
          isActive: true,
        },
        select: {
          skills: true,
        },
      });

      const allSkills = uniqueSkills
        .flatMap(u => u.skills || [])
        .filter((skill, index, arr) => arr.indexOf(skill) === index);

      res.json({
        success: true,
        data: {
          freelancers,
          filters: {
            skills: allSkills,
          },
          pagination: {
            page: parseInt(page as string),
            limit: take,
            total,
            pages: Math.ceil(total / take),
          },
        },
      });
    } catch (error) {
      logger.error('Search freelancers error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при поиске фрилансеров',
      });
    }
  }

  // Автодополнение поиска
  static async autocomplete(req: Request, res: Response) {
    try {
      const { q, type = 'all' } = req.query;
      const query = q as string;

      if (!query || query.length < 2) {
        return res.json({
          success: true,
          data: [],
        });
      }

      const results = [];

      // Поиск проектов
      if (type === 'all' || type === 'projects') {
        const projects = await prisma.project.findMany({
          where: {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
            ],
            status: { in: ['ACTIVE', 'IN_PROGRESS'] },
            isHidden: false,
          },
          take: 5,
          select: {
            id: true,
            title: true,
            budgetMax: true,
            deadline: true,
            category: {
              select: {
                name: true,
              },
            },
          },
        });

        results.push(
          ...projects.map(p => ({
            type: 'project',
            id: p.id,
            title: p.title,
            subtitle: p.category?.name,
            meta: {
              budget: p.budgetMax,
              deadline: p.deadline,
            },
          }))
        );
      }

      // Поиск фрилансеров
      if (type === 'all' || type === 'freelancers') {
        const freelancers = await prisma.user.findMany({
          where: {
            OR: [
              { firstName: { contains: query, mode: 'insensitive' } },
              { lastName: { contains: query, mode: 'insensitive' } },
              { title: { contains: query, mode: 'insensitive' } },
            ],
            type: 'FREELANCER',
            isActive: true,
          },
          take: 5,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
            rating: true,
            skills: true,
          },
        });

        results.push(
          ...freelancers.map(f => ({
            type: 'freelancer',
            id: f.id,
            title: `${f.firstName} ${f.lastName}`,
            subtitle: f.title,
            meta: {
              rating: f.rating,
              skills: f.skills?.slice(0, 3),
            },
          }))
        );
      }

      // Поиск навыков
      if (type === 'all' || type === 'skills') {
        const allSkills = await prisma.user.findMany({
          where: {
            type: 'FREELANCER',
            isActive: true,
          },
          select: {
            skills: true,
          },
        });

        const uniqueSkills = [
          ...new Set(allSkills.flatMap(u => u.skills || [])),
        ];

        const matchedSkills = uniqueSkills
          .filter(skill =>
            skill.toLowerCase().includes(query.toLowerCase())
          )
          .slice(0, 5);

        results.push(
          ...matchedSkills.map(skill => ({
            type: 'skill',
            id: skill,
            title: skill,
            subtitle: 'Навык',
          }))
        );
      }

      res.json({
        success: true,
        data: results,
      });
    } catch (error) {
      logger.error('Autocomplete error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при автодополнении',
      });
    }
  }

  // Поиск по тегам
  static async searchByTag(req: Request, res: Response) {
    try {
      const { tag } = req.params;
      const { type = 'projects', page = 1, limit = 20 } = req.query;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const take = parseInt(limit as string);

      let results: any[] = [];
      let total = 0;

      if (type === 'projects') {
        // Поиск проектов по тегам
        [results, total] = await Promise.all([
          prisma.project.findMany({
            where: {
              tags: { has: tag },
              status: { in: ['ACTIVE', 'IN_PROGRESS'] },
              isHidden: false,
            },
            skip,
            take,
            include: {
              client: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                  rating: true,
                },
              },
              category: true,
              subcategory: true,
              _count: {
                select: {
                  bids: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          }),
          prisma.project.count({
            where: {
              tags: { has: tag },
              status: { in: ['ACTIVE', 'IN_PROGRESS'] },
              isHidden: false,
            },
          }),
        ]);
      } else if (type === 'freelancers') {
        // Поиск фрилансеров по навыкам
        [results, total] = await Promise.all([
          prisma.user.findMany({
            where: {
              skills: { has: tag },
              type: 'FREELANCER',
              isActive: true,
            },
            skip,
            take,
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              title: true,
              rating: true,
              hourlyRate: true,
              skills: true,
              experienceYears: true,
            },
            orderBy: {
              rating: 'desc',
            },
          }),
          prisma.user.count({
            where: {
              skills: { has: tag },
              type: 'FREELANCER',
              isActive: true,
            },
          }),
        ]);
      }

      res.json({
        success: true,
        data: {
          results,
          tag,
          type,
          pagination: {
            page: parseInt(page as string),
            limit: take,
            total,
            pages: Math.ceil(total / take),
          },
        },
      });
    } catch (error) {
      logger.error('Search by tag error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при поиске по тегу',
      });
    }
  }

  // Получение популярных запросов
  static async getPopularSearches(req: Request, res: Response) {
    try {
      // Здесь можно реализовать сбор популярных запросов
      // Пока вернем статические данные
      const popularSearches = [
        { query: 'веб-разработка', count: 1234 },
        { query: 'дизайн логотипа', count: 876 },
        { query: 'мобильное приложение', count: 765 },
        { query: 'SEO оптимизация', count: 543 },
        { query: 'контент-маркетинг', count: 432 },
        { query: 'SMM продвижение', count: 321 },
        { query: 'копирайтинг', count: 210 },
        { query: 'видеомонтаж', count: 198 },
      ];

      res.json({
        success: true,
        data: popularSearches,
      });
    } catch (error) {
      logger.error('Get popular searches error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при получении популярных запросов',
      });
    }
  }

  // Поиск по местоположению
  static async searchByLocation(req: Request, res: Response) {
    try {
      const { country, city, radius, type = 'freelancers' } = req.query;

      if (!country && !city) {
        return res.status(400).json({
          success: false,
          message: 'Укажите страну или город для поиска',
        });
      }

      const where: any = {};

      if (country) {
        where.country = country;
      }

      if (city) {
        where.city = { contains: city as string, mode: 'insensitive' };
      }

      if (type === 'freelancers') {
        where.type = 'FREELANCER';
        where.isActive = true;
        where.isVerified = true;
      }

      const results = await prisma.user.findMany({
        where,
        take: 50,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
          title: true,
          rating: true,
          country: true,
          city: true,
          hourlyRate: true,
          skills: true,
        },
        orderBy: {
          rating: 'desc',
        },
      });

      // Группировка по городам
      const byCity = results.reduce((acc, user) => {
        const city = user.city || 'Другое';
        if (!acc[city]) {
          acc[city] = [];
        }
        acc[city].push(user);
        return acc;
      }, {} as { [key: string]: any[] });

      res.json({
        success: true,
        data: {
          results,
          byCity,
          total: results.length,
        },
      });
    } catch (error) {
      logger.error('Search by location error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при поиске по местоположению',
      });
    }
  }
}