import { Request, Response } from 'express';
import { db } from '../lib/db';  // Используем наш db вместо prisma
import { AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import { promisify } from 'util';
import { pipeline } from 'stream';
import multer from 'multer';

const pump = promisify(pipeline);

export class PortfolioController {
  // Конфигурация загрузки файлов
  private static storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = process.env.UPLOAD_PATH || './uploads/portfolio';
      // Создаем директорию, если ее нет
      fs.mkdir(uploadPath, { recursive: true }).catch(console.error);
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    },
  });

  private static upload = multer({
    storage: this.storage,
    limits: {
      fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|mp4|mov|avi/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);
      
      if (extname && mimetype) {
        return cb(null, true);
      } else {
        cb(new Error('Неподдерживаемый тип файла'));
      }
    },
  });

  // Получение портфолио пользователя
  static async getUserPortfolio(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { category, featured, page = 1, limit = 20 } = req.query;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const take = parseInt(limit as string);

      const where: any[] = [
        { column: 'user_id', operator: 'eq', value: userId },
        { column: 'is_hidden', operator: 'eq', value: false }
      ];

      if (category) {
        where.push({ column: 'category_id', operator: 'eq', value: category });
      }

      if (featured === 'true') {
        where.push({ column: 'is_featured', operator: 'eq', value: true });
      }

      const [itemsResult, totalResult] = await Promise.all([
        db.find<any>('portfolio_items', {
          where,
          limit: take,
          offset: skip,
          orderBy: {
            column: 'created_at',
            ascending: false
          }
        }),
        db.count('portfolio_items', where)
      ]);

      const total = totalResult || 0;

      // Получаем связанные данные
      const itemsWithDetails = await Promise.all(
        itemsResult.data.map(async (item: any) => {
          let category = null;
          if (item.category_id) {
            category = await db.findOne<any>('categories', item.category_id);
          }

          const user = await db.findOneBy<any>('profiles', 'id', item.user_id);

          return {
            id: item.id,
            userId: item.user_id,
            title: item.title,
            description: item.description,
            categoryId: item.category_id,
            category: category,
            workType: item.work_type,
            url: item.url,
            thumbnail: item.thumbnail,
            technologies: item.technologies,
            clientName: item.client_name,
            projectUrl: item.project_url,
            projectDate: item.project_date,
            isFeatured: item.is_featured,
            isHidden: item.is_hidden,
            viewsCount: item.views_count,
            likesCount: item.likes_count,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
            user: user ? {
              id: user.id,
              firstName: user.first_name,
              lastName: user.last_name,
              avatar: user.avatar,
            } : null
          };
        })
      );

      // Получение статистики
      const statsResult = await db.find<any>('portfolio_items', {
        where: [
          { column: 'user_id', operator: 'eq', value: userId }
        ]
      });

      const stats = {
        totalItems: statsResult.count || 0,
        totalViews: statsResult.data.reduce((sum, item) => sum + (item.views_count || 0), 0),
        totalLikes: statsResult.data.reduce((sum, item) => sum + (item.likes_count || 0), 0)
      };

      res.json({
        success: true,
        data: {
          items: itemsWithDetails,
          stats,
          pagination: {
            page: parseInt(page as string),
            limit: take,
            total,
            pages: Math.ceil(total / take),
          },
        },
      });
    } catch (error: any) {
      logger.error('Get user portfolio error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при получении портфолио',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Создание элемента портфолио
  static async createPortfolioItem(req: AuthRequest, res: Response) {
    try {
      // Используем multer для загрузки файла
      this.upload.single('file')(req as any, res as any, async (err) => {
        if (err) {
          return res.status(400).json({
            success: false,
            message: err.message,
          });
        }

        const {
          title,
          description,
          categoryId,
          workType,
          url,
          technologies,
          clientName,
          projectUrl,
          projectDate,
        } = req.body;

        // Проверка обязательных полей
        if (!title) {
          return res.status(400).json({
            success: false,
            message: 'Название обязательно',
          });
        }

        // Определение типа работы и URL
        let fileUrl = url;
        let thumbnailUrl = null;

        if (req.file) {
          // Если загружен файл
          fileUrl = `/uploads/portfolio/${req.file.filename}`;
          
          // Генерация thumbnail для изображений
          if (req.file.mimetype.startsWith('image/')) {
            // Здесь можно добавить генерацию thumbnail с помощью sharp
            thumbnailUrl = fileUrl;
          }
        } else if (!url) {
          return res.status(400).json({
            success: false,
            message: 'Необходим файл или ссылка на работу',
          });
        }

        // Преобразование technologies из строки в массив
        let techArray: string[] = [];
        if (technologies) {
          techArray = Array.isArray(technologies)
            ? technologies
            : technologies.split(',').map((tech: string) => tech.trim());
        }

        // Создание элемента портфолио
        const portfolioItem = await db.create<any>('portfolio_items', {
          user_id: req.user.id,
          title,
          description,
          category_id: categoryId || null,
          work_type: workType || 'image',
          url: fileUrl,
          thumbnail: thumbnailUrl,
          technologies: techArray,
          client_name: clientName || null,
          project_url: projectUrl || null,
          project_date: projectDate ? new Date(projectDate).toISOString() : null,
          is_featured: false,
          is_hidden: false,
          views_count: 0,
          likes_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

        // Получаем связанные данные
        let category = null;
        if (categoryId) {
          category = await db.findOne<any>('categories', categoryId);
        }

        const user = await db.findOneBy<any>('profiles', 'id', req.user.id);

        const responseData = {
          ...portfolioItem,
          category: category,
          user: user ? {
            id: user.id,
            firstName: user.first_name,
            lastName: user.last_name,
            avatar: user.avatar,
          } : null
        };

        res.status(201).json({
          success: true,
          message: 'Работа добавлена в портфолио',
          data: responseData,
        });
      });
    } catch (error: any) {
      logger.error('Create portfolio item error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при создании работы',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Обновление элемента портфолио
  static async updatePortfolioItem(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Поиск элемента портфолио
      const portfolioItem = await db.findOne<any>('portfolio_items', id);

      if (!portfolioItem) {
        return res.status(404).json({
          success: false,
          message: 'Работа не найдена',
        });
      }

      // Проверка прав доступа
      if (portfolioItem.user_id !== req.user.id && req.user.type !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Нет прав для обновления этой работы',
        });
      }

      // Обработка technologies
      if (updateData.technologies) {
        updateData.technologies = Array.isArray(updateData.technologies)
          ? updateData.technologies
          : updateData.technologies.split(',').map((tech: string) => tech.trim());
      }

      // Обработка даты
      if (updateData.projectDate) {
        updateData.project_date = new Date(updateData.projectDate).toISOString();
        delete updateData.projectDate;
      }

      // Преобразуем camelCase в snake_case
      const snakeCaseData: any = {};
      Object.keys(updateData).forEach(key => {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        snakeCaseData[snakeKey] = updateData[key];
      });

      snakeCaseData.updated_at = new Date().toISOString();

      // Обновление элемента
      const updatedItem = await db.update<any>('portfolio_items', id, snakeCaseData);

      // Получаем связанные данные
      let category = null;
      if (updatedItem.category_id) {
        category = await db.findOne<any>('categories', updatedItem.category_id);
      }

      const user = await db.findOneBy<any>('profiles', 'id', updatedItem.user_id);

      const responseData = {
        ...updatedItem,
        category: category,
        user: user ? {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          avatar: user.avatar,
        } : null
      };

      res.json({
        success: true,
        message: 'Работа обновлена',
        data: responseData,
      });
    } catch (error: any) {
      logger.error('Update portfolio item error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при обновлении работы',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Удаление элемента портфолио
  static async deletePortfolioItem(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      // Поиск элемента портфолио
      const portfolioItem = await db.findOne<any>('portfolio_items', id);

      if (!portfolioItem) {
        return res.status(404).json({
          success: false,
          message: 'Работа не найдена',
        });
      }

      // Проверка прав доступа
      if (portfolioItem.user_id !== req.user.id && req.user.type !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Нет прав для удаления этой работы',
        });
      }

      // Удаление файла, если он существует
      if (portfolioItem.url && portfolioItem.url.startsWith('/uploads/')) {
        try {
          const filePath = path.join(
            process.cwd(),
            portfolioItem.url
          );
          await fs.unlink(filePath);
        } catch (error) {
          logger.warn('Could not delete portfolio file:', error);
        }
      }

      // Удаление элемента из базы
      await db.delete('portfolio_items', id);

      // Удаление связанных данных (лайки, просмотры)
      await db.deleteMany('portfolio_likes', [
        { column: 'portfolio_id', operator: 'eq', value: id }
      ]);

      await db.deleteMany('portfolio_views', [
        { column: 'portfolio_id', operator: 'eq', value: id }
      ]);

      res.json({
        success: true,
        message: 'Работа удалена',
      });
    } catch (error: any) {
      logger.error('Delete portfolio item error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при удалении работы',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Просмотр работы (увеличение счетчика просмотров)
  static async viewPortfolioItem(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id; // Необязательная аутентификация

      // Поиск элемента портфолио
      const portfolioItem = await db.findOne<any>('portfolio_items', id);

      if (!portfolioItem) {
        return res.status(404).json({
          success: false,
          message: 'Работа не найдена',
        });
      }

      // Увеличение счетчика просмотров
      const updatedItem = await db.update<any>('portfolio_items', id, {
        views_count: (portfolioItem.views_count || 0) + 1,
        updated_at: new Date().toISOString()
      });

      // Запись просмотра в историю
      if (userId && userId !== portfolioItem.user_id) {
        await db.create<any>('portfolio_views', {
          portfolio_id: id,
          user_id: userId,
          viewed_at: new Date().toISOString()
        });
      }

      res.json({
        success: true,
        data: updatedItem,
      });
    } catch (error: any) {
      logger.error('View portfolio item error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при просмотре работы',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Лайк/дизлайк работы
  static async toggleLike(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      // Проверка существования работы
      const portfolioItem = await db.findOne<any>('portfolio_items', id);

      if (!portfolioItem) {
        return res.status(404).json({
          success: false,
          message: 'Работа не найдена',
        });
      }

      // Проверка, что пользователь не лайкает свою работу
      if (portfolioItem.user_id === req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'Нельзя лайкать свою работу',
        });
      }

      // Поиск существующего лайка
      const existingLikeResult = await db.find<any>('portfolio_likes', {
        where: [
          { column: 'portfolio_id', operator: 'eq', value: id },
          { column: 'user_id', operator: 'eq', value: req.user.id }
        ]
      });

      const existingLike = existingLikeResult.data[0];
      let updatedItem;
      let message;

      if (existingLike) {
        // Удаление лайка
        await db.delete('portfolio_likes', existingLike.id);

        updatedItem = await db.update<any>('portfolio_items', id, {
          likes_count: Math.max(0, (portfolioItem.likes_count || 0) - 1),
          updated_at: new Date().toISOString()
        });

        message = 'Лайк удален';
      } else {
        // Добавление лайка
        await db.create<any>('portfolio_likes', {
          portfolio_id: id,
          user_id: req.user.id,
          liked_at: new Date().toISOString()
        });

        updatedItem = await db.update<any>('portfolio_items', id, {
          likes_count: (portfolioItem.likes_count || 0) + 1,
          updated_at: new Date().toISOString()
        });

        message = 'Лайк добавлен';
      }

      res.json({
        success: true,
        message,
        data: updatedItem,
      });
    } catch (error: any) {
      logger.error('Toggle like error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при обработке лайка',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Получение лайков работы
  static async getItemLikes(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const take = parseInt(limit as string);

      const [likesResult, totalResult] = await Promise.all([
        db.find<any>('portfolio_likes', {
          where: [
            { column: 'portfolio_id', operator: 'eq', value: id }
          ],
          limit: take,
          offset: skip,
          orderBy: {
            column: 'liked_at',
            ascending: false
          }
        }),
        db.count('portfolio_likes', [
          { column: 'portfolio_id', operator: 'eq', value: id }
        ])
      ]);

      const total = totalResult || 0;

      // Получаем данные пользователей для лайков
      const likesWithUsers = await Promise.all(
        likesResult.data.map(async (like: any) => {
          const user = await db.findOneBy<any>('profiles', 'id', like.user_id);
          
          return {
            ...like,
            user: user ? {
              id: user.id,
              firstName: user.first_name,
              lastName: user.last_name,
              avatar: user.avatar,
              title: user.title,
            } : null
          };
        })
      );

      res.json({
        success: true,
        data: {
          likes: likesWithUsers,
          pagination: {
            page: parseInt(page as string),
            limit: take,
            total,
            pages: Math.ceil(total / take),
          },
        },
      });
    } catch (error: any) {
      logger.error('Get item likes error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при получении лайков',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Просмотр профиля пользователя
  static async viewProfile(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;

      // Проверка, что пользователь не просматривает свой профиль
      if (userId !== req.user.id) {
        await db.create<any>('profile_views', {
          viewed_user_id: userId,
          viewer_id: req.user.id,
          viewed_at: new Date().toISOString()
        });
      }

      res.json({
        success: true,
        message: 'Просмотр профиля зарегистрирован',
      });
    } catch (error: any) {
      logger.error('View profile error:', error);
      // Не возвращаем ошибку, чтобы не портить UX
      res.json({
        success: true,
        message: 'Просмотр профиля зарегистрирован',
      });
    }
  }

  // Получение статистики просмотров профиля
  static async getProfileViews(req: AuthRequest, res: Response) {
    try {
      const { days = 30 } = req.query;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days as string));

      const viewsResult = await db.find<any>('profile_views', {
        where: [
          { column: 'viewed_user_id', operator: 'eq', value: req.user.id },
          { column: 'viewed_at', operator: 'gte', value: startDate.toISOString() }
        ],
        orderBy: {
          column: 'viewed_at',
          ascending: false
        }
      });

      const views = viewsResult.data;

      // Агрегация по дням
      const viewsByDay = views.reduce((acc: any, view: any) => {
        const date = view.viewed_at.split('T')[0];
        if (!acc[date]) {
          acc[date] = 0;
        }
        acc[date]++;
        return acc;
      }, {});

      // Получаем данные просмотровщиков
      const viewsWithUsers = await Promise.all(
        views.map(async (view: any) => {
          const viewer = await db.findOneBy<any>('profiles', 'id', view.viewer_id);
          
          return {
            ...view,
            viewer: viewer ? {
              id: viewer.id,
              firstName: viewer.first_name,
              lastName: viewer.last_name,
              avatar: viewer.avatar,
              title: viewer.title,
              type: viewer.user_type,
            } : null
          };
        })
      );

      res.json({
        success: true,
        data: {
          totalViews: views.length,
          uniqueViewers: new Set(views.map((v: any) => v.viewer_id)).size,
          viewsByDay,
          viewsWithUsers,
        },
      });
    } catch (error: any) {
      logger.error('Get profile views error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при получении статистики просмотров',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Получение популярных работ (по категориям)
  static async getPopularItems(req: Request, res: Response) {
    try {
      const { category, days = 7, limit = 10 } = req.query;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days as string));

      const where: any[] = [
        { column: 'is_hidden', operator: 'eq', value: false },
        { column: 'created_at', operator: 'gte', value: startDate.toISOString() }
      ];

      if (category) {
        where.push({ column: 'category_id', operator: 'eq', value: category });
      }

      const popularItemsResult = await db.find<any>('portfolio_items', {
        where,
        limit: parseInt(limit as string),
        orderBy: {
          column: 'likes_count',
          ascending: false
        }
      });

      // Получаем связанные данные
      const itemsWithDetails = await Promise.all(
        popularItemsResult.data.map(async (item: any) => {
          const user = await db.findOneBy<any>('profiles', 'id', item.user_id);
          let category = null;
          if (item.category_id) {
            category = await db.findOne<any>('categories', item.category_id);
          }

          return {
            ...item,
            user: user ? {
              id: user.id,
              firstName: user.first_name,
              lastName: user.last_name,
              avatar: user.avatar,
              title: user.title,
              rating: user.rating,
            } : null,
            category: category
          };
        })
      );

      res.json({
        success: true,
        data: itemsWithDetails,
      });
    } catch (error: any) {
      logger.error('Get popular items error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при получении популярных работ',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Поиск по портфолио
  static async searchPortfolio(req: Request, res: Response) {
    try {
      const {
        query,
        category,
        technologies,
        minLikes,
        minViews,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        limit = 20,
      } = req.query;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const take = parseInt(limit as string);

      const where: any[] = [
        { column: 'is_hidden', operator: 'eq', value: false }
      ];

      // Поиск по тексту
      if (query) {
        where.push({ 
          column: 'title', 
          operator: 'ilike', 
          value: `%${query}%` 
        });
      }

      // Фильтры
      if (category) {
        where.push({ column: 'category_id', operator: 'eq', value: category });
      }

      if (technologies) {
        const techArray = (technologies as string).split(',');
        // Для Supabase поиск по массиву
        where.push({ 
          column: 'technologies', 
          operator: 'cs', 
          value: `{${techArray.join(',')}}` 
        });
      }

      if (minLikes) {
        where.push({ 
          column: 'likes_count', 
          operator: 'gte', 
          value: parseInt(minLikes as string) 
        });
      }

      if (minViews) {
        where.push({ 
          column: 'views_count', 
          operator: 'gte', 
          value: parseInt(minViews as string) 
        });
      }

      // Сортировка
      let orderByColumn = 'created_at';
      if (sortBy === 'likes') {
        orderByColumn = 'likes_count';
      } else if (sortBy === 'views') {
        orderByColumn = 'views_count';
      }

      const [itemsResult, totalResult] = await Promise.all([
        db.find<any>('portfolio_items', {
          where,
          limit: take,
          offset: skip,
          orderBy: {
            column: orderByColumn,
            ascending: sortOrder === 'asc'
          }
        }),
        db.count('portfolio_items', where)
      ]);

      const total = totalResult || 0;

      // Получаем связанные данные
      const itemsWithDetails = await Promise.all(
        itemsResult.data.map(async (item: any) => {
          const user = await db.findOneBy<any>('profiles', 'id', item.user_id);
          let category = null;
          if (item.category_id) {
            category = await db.findOne<any>('categories', item.category_id);
          }

          return {
            ...item,
            user: user ? {
              id: user.id,
              firstName: user.first_name,
              lastName: user.last_name,
              avatar: user.avatar,
              title: user.title,
              rating: user.rating,
            } : null,
            category: category
          };
        })
      );

      // Получение уникальных технологий для фильтров
      const uniqueTechResult = await db.find<any>('portfolio_items', {
        select: ['technologies'],
        where: [
          { column: 'is_hidden', operator: 'eq', value: false }
        ]
      });

      const allTechnologies = Array.from(
        new Set(
          uniqueTechResult.data.flatMap((item: any) => item.technologies || [])
        )
      ).filter(Boolean);

      res.json({
        success: true,
        data: {
          items: itemsWithDetails,
          filters: {
            technologies: allTechnologies,
          },
          pagination: {
            page: parseInt(page as string),
            limit: take,
            total,
            pages: Math.ceil(total / take),
          },
        },
      });
    } catch (error: any) {
      logger.error('Search portfolio error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при поиске по портфолио',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}