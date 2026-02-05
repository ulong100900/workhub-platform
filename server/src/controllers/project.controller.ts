import { Request, Response } from 'express';
import { db } from '../lib/db';
import { projectSchema } from '../utils/validation';
import { AuthRequest } from '../middleware/auth';
import { sendEmail, emailTemplates } from '../utils/email';
import logger from '../utils/logger';
import { createClient } from '@supabase/supabase-js';

export class ProjectController {
  // Инициализация Supabase клиента для хранилища файлов
  private static getSupabaseClient() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    
    if (!url || !key) {
      throw new Error('Supabase credentials not configured');
    }
    
    return createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    });
  }

  // Создание проекта
  static async createProject(req: AuthRequest, res: Response) {
    try {
      // Валидация
      const { error } = projectSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
        });
      }

      // Проверка, что пользователь клиент
      if (req.user.type !== 'CLIENT' && req.user.type !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Только клиенты могут создавать проекты',
        });
      }

      const {
        title,
        description,
        detailedDescription,
        category,
        subcategory,
        skills,
        budgetMin,
        budgetMax,
        budgetType,
        estimatedDuration,
        isRemote,
        locationCity,
        locationCountry,
        isUrgent,
        attachments,
      } = req.body;

      // Создание проекта через Supabase
      const project = await db.create<any>('projects', {
        title,
        description,
        detailed_description: detailedDescription || null,
        category,
        subcategory: subcategory || null,
        skills,
        budget_min: parseFloat(budgetMin),
        budget_max: parseFloat(budgetMax),
        budget_type: budgetType,
        estimated_duration: estimatedDuration,
        is_remote: isRemote !== undefined ? isRemote : true,
        location_city: isRemote ? null : locationCity,
        location_country: isRemote ? null : locationCountry,
        is_urgent: isUrgent || false,
        client_id: req.user.id,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        published_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        views_count: 0,
        bids_count: 0
      });

      // Получаем клиента для включения в ответ
      const client = await db.findOneBy<any>('profiles', 'id', req.user.id);

      // Обработка вложений (если есть)
      if (attachments && Array.isArray(attachments)) {
        try {
          // Сохраняем информацию о файлах в базе данных
          const fileRecords = await Promise.all(
            attachments.map(async (attachment: any) => {
              return db.create<any>('project_attachments', {
                project_id: project.id,
                file_name: attachment.name,
                file_url: attachment.url,
                file_type: attachment.type,
                file_size: attachment.size,
                uploaded_by: req.user.id,
                uploaded_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
            })
          );

          // Добавляем attachments к проекту для ответа
          project.attachments = fileRecords;
        } catch (attachmentError) {
          logger.warn('Ошибка при обработке вложений проекта:', attachmentError);
        }
      }

      // Отправка уведомления клиенту
      try {
        await sendEmail({
          to: req.user.email,
          ...emailTemplates.projectPublished(title, `${req.user.firstName} ${req.user.lastName}`),
        });
      } catch (emailError) {
        logger.error('Failed to send project published email:', emailError);
      }

      // Формируем ответ с данными клиента
      const responseProject = {
        ...project,
        client: {
          id: client?.id,
          first_name: client?.first_name,
          last_name: client?.last_name,
          avatar: client?.avatar,
          rating: client?.rating,
          reviews_count: client?.reviews_count,
          company_name: client?.company_name,
        }
      };

      res.status(201).json({
        success: true,
        message: 'Проект успешно создан',
        data: responseProject,
      });
    } catch (error: any) {
      logger.error('Create project error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при создании проекта',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Получение списка проектов
  static async getProjects(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        category,
        minBudget,
        maxBudget,
        status,
        search,
        sortBy = 'created_at',
        sortOrder = 'desc',
      } = req.query;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const take = parseInt(limit as string);

      // Фильтры
      const where: any[] = [
        { column: 'status', operator: 'eq', value: 'PUBLISHED' },
        { column: 'visibility', operator: 'eq', value: 'PUBLIC' }
      ];

      if (category) {
        where.push({ column: 'category', operator: 'eq', value: category });
      }

      if (minBudget) {
        where.push({ column: 'budget_min', operator: 'gte', value: parseFloat(minBudget as string) });
      }

      if (maxBudget) {
        where.push({ column: 'budget_max', operator: 'lte', value: parseFloat(maxBudget as string) });
      }

      if (status) {
        where.push({ column: 'status', operator: 'eq', value: status });
      }

      // Поиск (обработка отдельно)
      let searchWhere = where;
      if (search) {
        // Для поиска нужно использовать другой подход, так как у нас нет OR в текущей реализации
        // Пока упрощаем - ищем только в заголовке
        searchWhere = [
          ...where,
          { column: 'title', operator: 'ilike', value: `%${search}%` }
        ];
      }

      // Получение проектов
      const projectsResult = await db.find<any>('projects', {
        where: searchWhere,
        orderBy: {
          column: sortBy as string,
          ascending: sortOrder === 'asc'
        },
        limit: take,
        offset: skip
      });

      const total = projectsResult.count || 0;

      // Получаем данные клиентов для каждого проекта
      const projectsWithClients = await Promise.all(
        projectsResult.data.map(async (project) => {
          const client = await db.findOneBy<any>('profiles', 'id', project.client_id);
          
          // Получаем первые 3 вложения
          const attachmentsResult = await db.find<any>('project_attachments', {
            where: [{ column: 'project_id', operator: 'eq', value: project.id }],
            limit: 3
          });

          // Получаем количество предложений
          const bidsResult = await db.find<any>('bids', {
            where: [{ column: 'project_id', operator: 'eq', value: project.id }]
          });

          return {
            ...project,
            client: client ? {
              id: client.id,
              firstName: client.first_name,
              lastName: client.last_name,
              avatar: client.avatar,
              rating: client.rating,
              reviewsCount: client.reviews_count,
              companyName: client.company_name,
            } : null,
            attachments: attachmentsResult.data.map((att: any) => ({
              id: att.id,
              fileName: att.file_name,
              fileUrl: att.file_url,
              fileType: att.file_type,
            })),
            _count: {
              bids: bidsResult.count || 0
            }
          };
        })
      );

      // Увеличение счетчика просмотров для популярных проектов
      if (projectsWithClients.length > 0 && (req as any).user?.id) {
        // Логика для увеличения просмотров (можно реализовать позже)
      }

      res.json({
        success: true,
        data: {
          projects: projectsWithClients,
          pagination: {
            page: parseInt(page as string),
            limit: take,
            total,
            pages: Math.ceil(total / take),
          },
        },
      });
    } catch (error: any) {
      logger.error('Get projects error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при получении проектов',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Получение проекта по ID
  static async getProjectById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const project = await db.findOne<any>('projects', id);
      
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Проект не найден',
        });
      }

      // Получаем данные клиента
      const client = await db.findOneBy<any>('profiles', 'id', project.client_id);
      
      // Получаем данные фрилансера (если есть)
      let freelancer = null;
      if (project.freelancer_id) {
        freelancer = await db.findOneBy<any>('profiles', 'id', project.freelancer_id);
      }

      // Получаем вложения
      const attachmentsResult = await db.find<any>('project_attachments', {
        where: [{ column: 'project_id', operator: 'eq', value: id }],
        orderBy: { column: 'uploaded_at', ascending: false }
      });

      // Получаем предложения
      const bidsResult = await db.find<any>('bids', {
        where: [{ column: 'project_id', operator: 'eq', value: id }],
        orderBy: { column: 'created_at', ascending: false }
      });

      // Получаем данные фрилансеров для предложений
      const bidsWithFreelancers = await Promise.all(
        bidsResult.data.map(async (bid) => {
          const bidFreelancer = await db.findOneBy<any>('profiles', 'id', bid.freelancer_id);
          return {
            ...bid,
            freelancer: bidFreelancer ? {
              id: bidFreelancer.id,
              firstName: bidFreelancer.first_name,
              lastName: bidFreelancer.last_name,
              avatar: bidFreelancer.avatar,
              rating: bidFreelancer.rating,
              reviewsCount: bidFreelancer.reviews_count,
              completedProjects: bidFreelancer.completed_projects,
              skills: bidFreelancer.skills,
            } : null
          };
        })
      );

      // Увеличение счетчика просмотров
      await db.update<any>('projects', id, {
        views_count: (project.views_count || 0) + 1,
        updated_at: new Date().toISOString()
      });

      // Проверка доступа
      let canViewBids = false;
      const reqUser = (req as any).user;
      if (reqUser) {
        const isClient = project.client_id === reqUser.id;
        const isAdmin = reqUser.type === 'ADMIN';
        canViewBids = isClient || isAdmin;
      }

      // Формируем ответ
      const responseProject = {
        ...project,
        client: client ? {
          id: client.id,
          firstName: client.first_name,
          lastName: client.last_name,
          avatar: client.avatar,
          rating: client.rating,
          reviewsCount: client.reviews_count,
          companyName: client.company_name,
          createdAt: client.created_at,
        } : null,
        freelancer: freelancer ? {
          id: freelancer.id,
          firstName: freelancer.first_name,
          lastName: freelancer.last_name,
          avatar: freelancer.avatar,
          rating: freelancer.rating,
          reviewsCount: freelancer.reviews_count,
        } : null,
        attachments: attachmentsResult.data.map((att: any) => ({
          id: att.id,
          fileName: att.file_name,
          fileUrl: att.file_url,
          fileType: att.file_type,
          fileSize: att.file_size,
          uploadedAt: att.uploaded_at,
          uploadedBy: att.uploaded_by,
        })),
        bids: canViewBids ? bidsWithFreelancers : [],
        _count: {
          bids: bidsResult.count || 0
        }
      };

      res.json({
        success: true,
        data: responseProject,
      });
    } catch (error: any) {
      logger.error('Get project by id error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при получении проекта',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Метод для загрузки файла в проект
  static async uploadProjectFile(req: AuthRequest, res: Response) {
    try {
      const { projectId } = req.params;
      
      // Проверяем права доступа
      const project = await db.findOne<any>('projects', projectId);

      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Проект не найден',
        });
      }

      if (project.client_id !== req.user.id && req.user.type !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Нет прав для загрузки файлов в этот проект',
        });
      }

      // Проверяем, можно ли загружать файлы
      if (project.status === 'COMPLETED' || project.status === 'CANCELLED') {
        return res.status(400).json({
          success: false,
          message: 'Нельзя загружать файлы в завершенный проект',
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Файл не найден в запросе',
        });
      }

      // Создаем уникальное имя файла
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const originalName = req.file.originalname;
      const fileExtension = originalName.split('.').pop();
      const fileName = `${timestamp}_${randomString}.${fileExtension}`;
      
      // Путь к файлу в проектной папке
      const filePath = `projects/${projectId}/${fileName}`;

      // Загружаем файл в Supabase Storage
      const supabase = this.getSupabaseClient();
      const { data, error } = await supabase.storage
        .from('project-images')
        .upload(filePath, req.file.buffer, {
          contentType: req.file.mimetype,
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        logger.error('Ошибка загрузки файла в Supabase:', error);
        return res.status(500).json({
          success: false,
          message: 'Ошибка загрузки файла в хранилище',
        });
      }

      // Получаем публичную ссылку
      const { data: urlData } = supabase.storage
        .from('project-images')
        .getPublicUrl(filePath);

      // Сохраняем информацию о файле в базе
      const attachment = await db.create<any>('project_attachments', {
        project_id: projectId,
        file_name: originalName,
        file_url: urlData.publicUrl,
        file_type: req.file.mimetype,
        file_size: req.file.size,
        uploaded_by: req.user.id,
        uploaded_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      res.json({
        success: true,
        message: 'Файл успешно загружен',
        data: attachment,
      });

    } catch (error: any) {
      logger.error('Upload project file error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при загрузке файла',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Метод для удаления файла проекта
  static async deleteProjectFile(req: AuthRequest, res: Response) {
    try {
      const { projectId, fileId } = req.params;
      
      // Проверяем права доступа
      const project = await db.findOne<any>('projects', projectId);

      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Проект не найден',
        });
      }

      if (project.client_id !== req.user.id && req.user.type !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Нет прав для удаления файлов из этого проекта',
        });
      }

      // Получаем информацию о файле
      const file = await db.findOne<any>('project_attachments', fileId);

      if (!file || file.project_id !== projectId) {
        return res.status(404).json({
          success: false,
          message: 'Файл не найден',
        });
      }

      // Извлекаем путь к файлу из URL
      const fileUrl = file.file_url;
      const urlParts = fileUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `projects/${projectId}/${fileName}`;

      // Удаляем файл из Supabase Storage
      const supabase = this.getSupabaseClient();
      const { error } = await supabase.storage
        .from('project-images')
        .remove([filePath]);

      if (error) {
        logger.error('Ошибка удаления файла из Supabase:', error);
        // Продолжаем удаление записи из базы даже если файл не найден в хранилище
      }

      // Удаляем запись из базы
      await db.delete('project_attachments', fileId);

      res.json({
        success: true,
        message: 'Файл успешно удален',
      });

    } catch (error: any) {
      logger.error('Delete project file error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при удалении файла',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Метод для получения списка файлов проекта
  static async getProjectFiles(req: AuthRequest, res: Response) {
    try {
      const { projectId } = req.params;
      
      // Проверяем права доступа
      const project = await db.findOne<any>('projects', projectId);

      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Проект не найден',
        });
      }

      const isClient = project.client_id === req.user.id;
      const isFreelancer = project.freelancer_id === req.user.id;
      const isAdmin = req.user.type === 'ADMIN';

      if (!isClient && !isFreelancer && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Нет прав для просмотра файлов этого проекта',
        });
      }

      // Получаем список файлов из базы
      const filesResult = await db.find<any>('project_attachments', {
        where: [{ column: 'project_id', operator: 'eq', value: projectId }],
        orderBy: { column: 'uploaded_at', ascending: false }
      });

      // Получаем список файлов из Supabase Storage для проверки
      const supabase = this.getSupabaseClient();
      const { data: storageFiles, error } = await supabase.storage
        .from('project-images')
        .list(`projects/${projectId}`);

      if (error) {
        logger.warn('Ошибка при получении списка файлов из хранилища:', error);
      }

      res.json({
        success: true,
        data: {
          files: filesResult.data,
          storageCount: storageFiles?.length || 0,
        },
      });

    } catch (error: any) {
      logger.error('Get project files error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при получении файлов проекта',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Удаление проекта
  static async deleteProject(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      // Проверка прав доступа
      const project = await db.findOne<any>('projects', id);

      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Проект не найден',
        });
      }

      if (project.client_id !== req.user.id && req.user.type !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Нет прав для удаления этого проекта',
        });
      }

      // Проверка статуса проекта
      if (project.status === 'IN_PROGRESS' || project.status === 'COMPLETED') {
        return res.status(400).json({
          success: false,
          message: 'Нельзя удалить проект в статусе "В работе" или "Завершен"',
        });
      }

      // Получаем вложения проекта
      const attachmentsResult = await db.find<any>('project_attachments', {
        where: [{ column: 'project_id', operator: 'eq', value: id }]
      });

      // Удаляем файлы проекта из Supabase Storage
      if (attachmentsResult.data.length > 0) {
        try {
          const supabase = this.getSupabaseClient();
          // Удаляем папку проекта целиком
          const { error } = await supabase.storage
            .from('project-images')
            .remove([`projects/${id}`]);

          if (error) {
            logger.warn('Ошибка при удалении файлов проекта из хранилища:', error);
          }
        } catch (storageError) {
          logger.error('Ошибка при удалении файлов проекта:', storageError);
        }
      }

      // Удаляем вложения из базы (каскадно через Supabase политики или отдельно)
      for (const attachment of attachmentsResult.data) {
        await db.delete('project_attachments', attachment.id);
      }

      // Удаление проекта из базы данных
      await db.delete('projects', id);

      res.json({
        success: true,
        message: 'Проект успешно удален',
      });
    } catch (error: any) {
      logger.error('Delete project error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при удалении проекта',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Получение проектов пользователя
  static async getUserProjects(req: AuthRequest, res: Response) {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const take = parseInt(limit as string);

      const where: any[] = [];
      
      if (req.user.type === 'CLIENT' || req.user.type === 'ADMIN') {
        where.push({ column: 'client_id', operator: 'eq', value: req.user.id });
      } else if (req.user.type === 'FREELANCER') {
        where.push({ column: 'freelancer_id', operator: 'eq', value: req.user.id });
      }

      if (status) {
        where.push({ column: 'status', operator: 'eq', value: status });
      }

      const projectsResult = await db.find<any>('projects', {
        where,
        orderBy: { column: 'created_at', ascending: false },
        limit: take,
        offset: skip
      });

      const total = projectsResult.count || 0;

      // Получаем данные клиентов/фрилансеров
      const projectsWithDetails = await Promise.all(
        projectsResult.data.map(async (project) => {
          const client = await db.findOneBy<any>('profiles', 'id', project.client_id);
          let freelancer = null;
          if (project.freelancer_id) {
            freelancer = await db.findOneBy<any>('profiles', 'id', project.freelancer_id);
          }

          // Количество предложений
          const bidsResult = await db.find<any>('bids', {
            where: [{ column: 'project_id', operator: 'eq', value: project.id }]
          });

          return {
            ...project,
            client: client ? {
              id: client.id,
              firstName: client.first_name,
              lastName: client.last_name,
            } : null,
            freelancer: freelancer ? {
              id: freelancer.id,
              firstName: freelancer.first_name,
              lastName: freelancer.last_name,
            } : null,
            bidsCount: bidsResult.count || 0
          };
        })
      );

      res.json({
        success: true,
        data: {
          projects: projectsWithDetails,
          pagination: {
            page: parseInt(page as string),
            limit: take,
            total,
            pages: Math.ceil(total / take),
          },
        },
      });
    } catch (error: any) {
      logger.error('Get user projects error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при получении проектов пользователя',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
  // Обновление проекта
  static async updateProject(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Проверка существования проекта
      const project = await db.findOne<any>('projects', id);

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
          message: 'Нет прав для обновления этого проекта',
        });
      }

      // Проверка, можно ли обновлять проект
      if (project.status === 'COMPLETED' || project.status === 'CANCELLED') {
        return res.status(400).json({
          success: false,
          message: 'Нельзя обновлять завершенный или отмененный проект',
        });
      }

      if (project.status === 'IN_PROGRESS' && req.user.type !== 'ADMIN') {
        return res.status(400).json({
          success: false,
          message: 'Нельзя обновлять проект в процессе работы',
        });
      }

      // Преобразуем camelCase в snake_case
      const snakeCaseData: any = {};
      Object.keys(updateData).forEach(key => {
        if (key === 'detailedDescription') {
          snakeCaseData['detailed_description'] = updateData[key];
        } else if (key === 'budgetMin') {
          snakeCaseData['budget_min'] = updateData[key];
        } else if (key === 'budgetMax') {
          snakeCaseData['budget_max'] = updateData[key];
        } else if (key === 'budgetType') {
          snakeCaseData['budget_type'] = updateData[key];
        } else if (key === 'estimatedDuration') {
          snakeCaseData['estimated_duration'] = updateData[key];
        } else if (key === 'isRemote') {
          snakeCaseData['is_remote'] = updateData[key];
        } else if (key === 'locationCity') {
          snakeCaseData['location_city'] = updateData[key];
        } else if (key === 'locationCountry') {
          snakeCaseData['location_country'] = updateData[key];
        } else if (key === 'isUrgent') {
          snakeCaseData['is_urgent'] = updateData[key];
        } else {
          const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
          snakeCaseData[snakeKey] = updateData[key];
        }
      });

      snakeCaseData.updated_at = new Date().toISOString();

      // Обновление проекта
      const updatedProject = await db.update<any>('projects', id, snakeCaseData);

      // Получаем клиента для ответа
      const client = await db.findOneBy<any>('profiles', 'id', project.client_id);

      res.json({
        success: true,
        message: 'Проект успешно обновлен',
        data: {
          ...updatedProject,
          client: client ? {
            id: client.id,
            firstName: client.first_name,
            lastName: client.last_name,
            avatar: client.avatar,
          } : null,
        },
      });
    } catch (error: any) {
      logger.error('Update project error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при обновлении проекта',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Обновление статуса проекта
  static async updateProjectStatus(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;

      // Проверка существования проекта
      const project = await db.findOne<any>('projects', id);

      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Проект не найден',
        });
      }

      // Проверка прав доступа
      const isClient = project.client_id === req.user.id;
      const isFreelancer = project.freelancer_id === req.user.id;
      const isAdmin = req.user.type === 'ADMIN';

      if (!isClient && !isFreelancer && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Нет прав для обновления статуса этого проекта',
        });
      }

      // Валидация статуса
      const validStatuses = ['DRAFT', 'PUBLISHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'PAUSED'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Неверный статус проекта',
        });
      }

      // Логика перехода статусов
      let canChangeStatus = false;

      if (isAdmin) {
        canChangeStatus = true; // Админ может все
      } else if (isClient) {
        // Клиент может менять статус на определенные значения
        const clientAllowedTransitions: { [key: string]: string[] } = {
          'DRAFT': ['PUBLISHED', 'CANCELLED'],
          'PUBLISHED': ['CANCELLED'],
          'IN_PROGRESS': ['COMPLETED', 'PAUSED'],
          'PAUSED': ['IN_PROGRESS', 'CANCELLED'],
        };

        canChangeStatus = clientAllowedTransitions[project.status]?.includes(status) || false;
      } else if (isFreelancer) {
        // Фрилансер может завершить проект
        canChangeStatus = project.status === 'IN_PROGRESS' && status === 'COMPLETED';
      }

      if (!canChangeStatus) {
        return res.status(400).json({
          success: false,
          message: `Нельзя изменить статус с ${project.status} на ${status}`,
        });
      }

      // Обновление статуса
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (reason) {
        updateData.status_reason = reason;
      }

      if (status === 'COMPLETED') {
        updateData.completed_at = new Date().toISOString();
      } else if (status === 'CANCELLED') {
        updateData.cancelled_at = new Date().toISOString();
        updateData.cancelled_by = req.user.id;
        updateData.cancellation_reason = reason;
      } else if (status === 'IN_PROGRESS') {
        updateData.started_at = new Date().toISOString();
      }

      const updatedProject = await db.update<any>('projects', id, updateData);

      // Отправка уведомлений
      try {
        let notificationRecipientId = '';
        let notificationType = '';
        
        if (isClient && status === 'COMPLETED') {
          notificationRecipientId = project.freelancer_id;
          notificationType = 'PROJECT_COMPLETED';
        } else if (isFreelancer && status === 'COMPLETED') {
          notificationRecipientId = project.client_id;
          notificationType = 'PROJECT_COMPLETED';
        } else if (status === 'CANCELLED') {
          notificationRecipientId = isClient ? project.freelancer_id : project.client_id;
          notificationType = 'PROJECT_CANCELLED';
        }

        if (notificationRecipientId && notificationType) {
          // Здесь можно добавить отправку уведомления
          logger.info(`Should send notification to ${notificationRecipientId}: ${notificationType}`);
        }
      } catch (notificationError) {
        logger.error('Error sending notification:', notificationError);
      }

      res.json({
        success: true,
        message: `Статус проекта изменен на "${status}"`,
        data: updatedProject,
      });
    } catch (error: any) {
      logger.error('Update project status error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при обновлении статуса проекта',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Выбор фрилансера для проекта
  static async selectFreelancer(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { freelancerId, bidId, message } = req.body;

      if (!freelancerId) {
        return res.status(400).json({
          success: false,
          message: 'Не указан ID фрилансера',
        });
      }

      // Проверка существования проекта
      const project = await db.findOne<any>('projects', id);

      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Проект не найден',
        });
      }

      // Проверка прав доступа (только клиент проекта или админ)
      if (project.client_id !== req.user.id && req.user.type !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Только клиент проекта может выбрать фрилансера',
        });
      }

      // Проверка статуса проекта
      if (project.status !== 'PUBLISHED') {
        return res.status(400).json({
          success: false,
          message: 'Можно выбрать фрилансера только для опубликованного проекта',
        });
      }

      // Проверка существования фрилансера
      const freelancer = await db.findOne<any>('profiles', freelancerId);

      if (!freelancer || freelancer.user_type !== 'freelancer') {
        return res.status(404).json({
          success: false,
          message: 'Фрилансер не найден',
        });
      }

      // Проверка, что у фрилансера есть предложение (bid) на этот проект
      let hasBid = false;
      if (bidId) {
        const bid = await db.findOne<any>('bids', bidId);
        hasBid = bid && bid.project_id === id && bid.freelancer_id === freelancerId;
      } else {
        // Ищем любое предложение этого фрилансера на этот проект
        const bidsResult = await db.find<any>('bids', {
          where: [
            { column: 'project_id', operator: 'eq', value: id },
            { column: 'freelancer_id', operator: 'eq', value: freelancerId }
          ]
        });
        hasBid = bidsResult.count > 0;
      }

      if (!hasBid) {
        return res.status(400).json({
          success: false,
          message: 'У фрилансера нет предложения на этот проект',
        });
      }

      // Обновляем проект
      const updatedProject = await db.update<any>('projects', id, {
        freelancer_id: freelancerId,
        status: 'IN_PROGRESS',
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Обновляем статус выбранного предложения
      if (bidId) {
        await db.update<any>('bids', bidId, {
          status: 'ACCEPTED',
          accepted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }

      // Отклоняем остальные предложения
      const allBidsResult = await db.find<any>('bids', {
        where: [
          { column: 'project_id', operator: 'eq', value: id },
          { column: 'status', operator: 'eq', value: 'PENDING' }
        ]
      });

      for (const bid of allBidsResult.data) {
        if (bid.id !== bidId) {
          await db.update<any>('bids', bid.id, {
            status: 'REJECTED',
            updated_at: new Date().toISOString()
          });
        }
      }

      // Создаем чат между клиентом и фрилансером (если не существует)
      try {
        const existingChatResult = await db.find<any>('chats', {
          where: [
            { column: 'project_id', operator: 'eq', value: id },
            { column: 'type', operator: 'eq', value: 'PROJECT' }
          ]
        });

        if (existingChatResult.count === 0) {
          await db.create<any>('chats', {
            project_id: id,
            type: 'PROJECT',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      } catch (chatError) {
        logger.error('Error creating chat:', chatError);
      }

      // Отправляем уведомление фрилансеру
      try {
        await sendEmail({
          to: freelancer.email,
          ...emailTemplates.freelancerSelected(
            project.title,
            `${freelancer.first_name} ${freelancer.last_name}`,
            message
          ),
        });
      } catch (emailError) {
        logger.error('Failed to send freelancer selected email:', emailError);
      }

      res.json({
        success: true,
        message: 'Фрилансер выбран для проекта',
        data: {
          project: updatedProject,
          freelancer: {
            id: freelancer.id,
            firstName: freelancer.first_name,
            lastName: freelancer.last_name,
            email: freelancer.email,
            avatar: freelancer.avatar,
          }
        },
      });
    } catch (error: any) {
      logger.error('Select freelancer error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при выборе фрилансера',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}