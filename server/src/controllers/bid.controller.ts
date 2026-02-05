import { Request, Response } from 'express';
import { db } from '../lib/db';
import { bidSchema } from '../utils/validation';
import { AuthRequest } from '../middleware/auth';
import { sendEmail, emailTemplates } from '../utils/email';
import logger from '../utils/logger';

export class BidController {
  // Создание предложения
  static async createBid(req: AuthRequest, res: Response) {
    try {
      const { projectId } = req.params;

      // Валидация
      const { error } = bidSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
        });
      }

      // Проверка, что пользователь фрилансер
      if (req.user.type !== 'FREELANCER' && req.user.type !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Только фрилансеры могут делать предложения',
        });
      }

      // Проверка существования проекта
      const project = await db.findOne<any>('projects', projectId);
      
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Проект не найден',
        });
      }

      // Получаем данные клиента для email
      const client = await db.findOneBy<any>('profiles', 'id', project.client_id);

      // Проверка статуса проекта
      if (project.status !== 'PUBLISHED') {
        return res.status(400).json({
          success: false,
          message: 'Проект не принимает предложения',
        });
      }

      // Проверка, что фрилансер не является клиентом проекта
      if (project.client_id === req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'Нельзя сделать предложение на свой собственный проект',
        });
      }

      // Проверка, что фрилансер уже делал предложение
      const existingBidResult = await db.find<any>('bids', {
        where: [
          { column: 'project_id', operator: 'eq', value: projectId },
          { column: 'freelancer_id', operator: 'eq', value: req.user.id }
        ]
      });

      if (existingBidResult.data.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Вы уже делали предложение на этот проект',
        });
      }

      const { amount, description, timeline, isHourly } = req.body;

      // Создание предложения
      const bidData = {
        project_id: projectId,
        freelancer_id: req.user.id,
        amount: parseFloat(amount),
        description,
        timeline,
        is_hourly: isHourly || false,
        status: 'PENDING',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const bid = await db.create<any>('bids', bidData);

      // Получаем данные фрилансера для ответа
      const freelancer = await db.findOneBy<any>('profiles', 'id', req.user.id);

      // Обновление счетчика предложений проекта
      await db.update<any>('projects', projectId, {
        proposals_count: (project.proposals_count || 0) + 1,
        updated_at: new Date().toISOString()
      });

      // Формируем ответ
      const responseBid = {
        ...bid,
        freelancer: freelancer ? {
          id: freelancer.id,
          firstName: freelancer.first_name,
          lastName: freelancer.last_name,
          avatar: freelancer.avatar,
          rating: freelancer.rating,
          reviewsCount: freelancer.reviews_count,
          completedProjects: freelancer.completed_projects,
          skills: freelancer.skills,
        } : null,
        project: {
          title: project.title,
          budgetMin: project.budget_min,
          budgetMax: project.budget_max,
        }
      };

      // Отправка уведомления клиенту
      try {
        if (client && client.email) {
          await sendEmail({
            to: client.email,
            ...emailTemplates.newBid(
              project.title, 
              `${req.user.firstName} ${req.user.lastName}`, 
              parseFloat(amount)
            ),
          });
        }
      } catch (emailError) {
        logger.error('Failed to send new bid email:', emailError);
      }

      res.status(201).json({
        success: true,
        message: 'Предложение успешно отправлено',
        data: responseBid,
      });
    } catch (error: any) {
      logger.error('Create bid error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при создании предложения',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Получение предложений проекта
  static async getProjectBids(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const { status } = req.query;

      const where: any[] = [
        { column: 'project_id', operator: 'eq', value: projectId }
      ];
      
      if (status) {
        where.push({ column: 'status', operator: 'eq', value: status });
      }

      const bidsResult = await db.find<any>('bids', {
        where,
        orderBy: { column: 'created_at', ascending: false }
      });

      // Получаем данные фрилансеров для каждого предложения
      const bidsWithFreelancers = await Promise.all(
        bidsResult.data.map(async (bid) => {
          const freelancer = await db.findOneBy<any>('profiles', 'id', bid.freelancer_id);
          const project = await db.findOne<any>('projects', bid.project_id);

          return {
            ...bid,
            freelancer: freelancer ? {
              id: freelancer.id,
              firstName: freelancer.first_name,
              lastName: freelancer.last_name,
              avatar: freelancer.avatar,
              rating: freelancer.rating,
              reviewsCount: freelancer.reviews_count,
              completedProjects: freelancer.completed_projects,
              skills: freelancer.skills,
              hourlyRate: freelancer.hourly_rate,
              bio: freelancer.bio,
            } : null,
            project: project ? {
              title: project.title,
              budgetMin: project.budget_min,
              budgetMax: project.budget_max,
            } : null
          };
        })
      );

      res.json({
        success: true,
        data: bidsWithFreelancers,
      });
    } catch (error: any) {
      logger.error('Get project bids error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при получении предложений',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Получение предложений фрилансера
  static async getFreelancerBids(req: AuthRequest, res: Response) {
    try {
      const { freelancerId } = req.params;
      const { status } = req.query;

      // Проверка прав доступа
      if (freelancerId !== req.user.id && req.user.type !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Нет прав для просмотра этих предложений',
        });
      }

      const where: any[] = [
        { column: 'freelancer_id', operator: 'eq', value: freelancerId }
      ];
      
      if (status) {
        where.push({ column: 'status', operator: 'eq', value: status });
      }

      const bidsResult = await db.find<any>('bids', {
        where,
        orderBy: { column: 'created_at', ascending: false }
      });

      // Получаем данные проектов для каждого предложения
      const bidsWithProjects = await Promise.all(
        bidsResult.data.map(async (bid) => {
          const project = await db.findOne<any>('projects', bid.project_id);
          let projectClient = null;
          
          if (project) {
            projectClient = await db.findOneBy<any>('profiles', 'id', project.client_id);
          }

          return {
            ...bid,
            project: project ? {
              id: project.id,
              title: project.title,
              description: project.description,
              budgetMin: project.budget_min,
              budgetMax: project.budget_max,
              budgetType: project.budget_type,
              status: project.status,
              client: projectClient ? {
                id: projectClient.id,
                firstName: projectClient.first_name,
                lastName: projectClient.last_name,
                avatar: projectClient.avatar,
                rating: projectClient.rating,
                companyName: projectClient.company_name,
              } : null
            } : null
          };
        })
      );

      res.json({
        success: true,
        data: bidsWithProjects,
      });
    } catch (error: any) {
      logger.error('Get freelancer bids error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при получении предложений фрилансера',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Обновление предложения
  static async updateBid(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      // Проверка прав доступа
      const bid = await db.findOne<any>('bids', id);

      if (!bid) {
        return res.status(404).json({
          success: false,
          message: 'Предложение не найдено',
        });
      }

      if (bid.freelancer_id !== req.user.id && req.user.type !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Нет прав для обновления этого предложения',
        });
      }

      // Проверка статуса предложения
      if (bid.status !== 'PENDING') {
        return res.status(400).json({
          success: false,
          message: 'Можно обновлять только предложения в статусе PENDING',
        });
      }

      // Валидация
      const { error } = bidSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
        });
      }

      const { amount, description, timeline, isHourly } = req.body;

      // Обновление предложения
      const updatedBid = await db.update<any>('bids', id, {
        amount: parseFloat(amount),
        description,
        timeline,
        is_hourly: isHourly || false,
        updated_at: new Date().toISOString(),
      });

      // Получаем данные фрилансера и проекта для ответа
      const freelancer = await db.findOneBy<any>('profiles', 'id', bid.freelancer_id);
      const project = await db.findOne<any>('projects', bid.project_id);
      let projectClient = null;
      
      if (project) {
        projectClient = await db.findOneBy<any>('profiles', 'id', project.client_id);
      }

      const responseBid = {
        ...updatedBid,
        freelancer: freelancer ? {
          id: freelancer.id,
          firstName: freelancer.first_name,
          lastName: freelancer.last_name,
          avatar: freelancer.avatar,
          rating: freelancer.rating,
        } : null,
        project: project ? {
          title: project.title,
          clientId: project.client_id,
          client: projectClient ? {
            firstName: projectClient.first_name,
            lastName: projectClient.last_name,
          } : null
        } : null
      };

      res.json({
        success: true,
        message: 'Предложение успешно обновлено',
        data: responseBid,
      });
    } catch (error: any) {
      logger.error('Update bid error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при обновлении предложения',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Отзыв предложения
  static async withdrawBid(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      // Проверка прав доступа
      const bid = await db.findOne<any>('bids', id);
      
      if (!bid) {
        return res.status(404).json({
          success: false,
          message: 'Предложение не найдено',
        });
      }

      const project = await db.findOne<any>('projects', bid.project_id);

      if (bid.freelancer_id !== req.user.id && req.user.type !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Нет прав для отзыва этого предложения',
        });
      }

      // Проверка статуса предложения
      if (bid.status !== 'PENDING') {
        return res.status(400).json({
          success: false,
          message: 'Можно отозвать только предложения в статусе PENDING',
        });
      }

      // Обновление статуса предложения
      const updatedBid = await db.update<any>('bids', id, {
        status: 'WITHDRAWN',
        updated_at: new Date().toISOString(),
      });

      // Обновление счетчика предложений проекта
      if (project) {
        await db.update<any>('projects', bid.project_id, {
          proposals_count: Math.max((project.proposals_count || 1) - 1, 0),
          updated_at: new Date().toISOString()
        });
      }

      res.json({
        success: true,
        message: 'Предложение успешно отозвано',
        data: updatedBid,
      });
    } catch (error: any) {
      logger.error('Withdraw bid error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при отзыве предложения',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Удаление предложения
  static async deleteBid(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      // Проверка прав доступа
      const bid = await db.findOne<any>('bids', id);

      if (!bid) {
        return res.status(404).json({
          success: false,
          message: 'Предложение не найдено',
        });
      }

      if (bid.freelancer_id !== req.user.id && req.user.type !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Нет прав для удаления этого предложения',
        });
      }

      // Проверка статуса предложения
      if (bid.status !== 'PENDING') {
        return res.status(400).json({
          success: false,
          message: 'Можно удалить только предложения в статусе PENDING',
        });
      }

      const project = await db.findOne<any>('projects', bid.project_id);

      // Удаление предложения
      await db.delete('bids', id);

      // Обновление счетчика предложений проекта
      if (project) {
        await db.update<any>('projects', bid.project_id, {
          proposals_count: Math.max((project.proposals_count || 1) - 1, 0),
          updated_at: new Date().toISOString()
        });
      }

      res.json({
        success: true,
        message: 'Предложение успешно удалено',
      });
    } catch (error: any) {
      logger.error('Delete bid error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при удалении предложения',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}