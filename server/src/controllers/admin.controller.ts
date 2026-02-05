import { Request, Response } from 'express';
import { db } from '../lib/db';
import { AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';

export class AdminController {
  // Проверка прав администратора
  private static checkAdmin(req: AuthRequest) {
    return req.user?.type === 'ADMIN';
  }

  // Получение статистики платформы
  static async getPlatformStats(req: AuthRequest, res: Response) {
    try {
      if (!this.checkAdmin(req)) {
        return res.status(403).json({
          success: false,
          message: 'Требуются права администратора',
        });
      }

      // Получаем общее количество пользователей
      const profilesResult = await db.find<any>('profiles', {});
      const totalUsers = profilesResult.count || 0;

      // Получаем фрилансеров
      const freelancersResult = await db.find<any>('profiles', {
        where: [{ column: 'user_type', operator: 'eq', value: 'freelancer' }]
      });
      const totalFreelancers = freelancersResult.count || 0;

      // Получаем клиентов
      const clientsResult = await db.find<any>('profiles', {
        where: [{ column: 'user_type', operator: 'eq', value: 'client' }]
      });
      const totalClients = clientsResult.count || 0;

      // Получаем общее количество проектов
      const projectsResult = await db.find<any>('projects', {});
      const totalProjects = projectsResult.count || 0;

      // Активные проекты
      const activeProjectsResult = await db.find<any>('projects', {
        where: [{ column: 'status', operator: 'eq', value: 'IN_PROGRESS' }]
      });
      const activeProjects = activeProjectsResult.count || 0;

      // Завершенные проекты
      const completedProjectsResult = await db.find<any>('projects', {
        where: [{ column: 'status', operator: 'eq', value: 'COMPLETED' }]
      });
      const completedProjects = completedProjectsResult.count || 0;

      // Транзакции
      const transactionsResult = await db.find<any>('transactions', {
        where: [{ column: 'status', operator: 'eq', value: 'COMPLETED' }]
      });
      const totalTransactions = transactionsResult.count || 0;

      // Доход (комиссии) - нужно агрегировать вручную
      const commissionResult = await db.find<any>('transactions', {
        where: [
          { column: 'type', operator: 'eq', value: 'COMMISSION' },
          { column: 'status', operator: 'eq', value: 'COMPLETED' }
        ]
      });

      let totalRevenue = 0;
      if (commissionResult.data.length > 0) {
        totalRevenue = commissionResult.data.reduce((sum, transaction) => sum + (transaction.amount || 0), 0);
      }

      // Пользователи за сегодня
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayUsersResult = await db.find<any>('profiles', {
        where: [
          { column: 'created_at', operator: 'gte', value: today.toISOString() },
          { column: 'created_at', operator: 'lt', value: tomorrow.toISOString() }
        ]
      });
      const todayUsers = todayUsersResult.count || 0;

      // Проекты за сегодня
      const todayProjectsResult = await db.find<any>('projects', {
        where: [
          { column: 'created_at', operator: 'gte', value: today.toISOString() },
          { column: 'created_at', operator: 'lt', value: tomorrow.toISOString() }
        ]
      });
      const todayProjects = todayProjectsResult.count || 0;

      res.json({
        success: true,
        data: {
          users: {
            total: totalUsers,
            freelancers: totalFreelancers,
            clients: totalClients,
            today: todayUsers,
          },
          projects: {
            total: totalProjects,
            active: activeProjects,
            completed: completedProjects,
            today: todayProjects,
          },
          finance: {
            transactions: totalTransactions,
            revenue: totalRevenue,
          },
        },
      });
    } catch (error: any) {
      logger.error('Get platform stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при получении статистики',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Получение списка пользователей
  static async getUsers(req: AuthRequest, res: Response) {
    try {
      if (!this.checkAdmin(req)) {
        return res.status(403).json({
          success: false,
          message: 'Требуются права администратора',
        });
      }

      const {
        page = 1,
        limit = 20,
        type,
        status,
        search,
        sortBy = 'created_at',
        sortOrder = 'desc',
      } = req.query;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const take = parseInt(limit as string);

      const where: any[] = [];

      if (type) {
        where.push({ column: 'user_type', operator: 'eq', value: type });
      }

      if (status) {
        const isActive = status === 'active';
        where.push({ column: 'is_active', operator: 'eq', value: isActive });
      }

      if (search) {
        // Для Supabase нужно разделить поиск на несколько условий
        // Пока ищем только по email, можно расширить позже
        where.push({ column: 'email', operator: 'ilike', value: `%${search}%` });
      }

      const usersResult = await db.find<any>('profiles', {
        where,
        orderBy: {
          column: sortBy as string,
          ascending: sortOrder === 'asc'
        },
        limit: take,
        offset: skip
      });

      const total = usersResult.count || 0;

      // Форматируем ответ
      const users = usersResult.data.map((profile: any) => ({
        id: profile.id,
        firstName: profile.first_name,
        lastName: profile.last_name,
        email: profile.email,
        type: profile.user_type?.toUpperCase(),
        isActive: profile.is_active,
        isVerified: profile.is_verified,
        rating: profile.rating,
        balance: profile.balance,
        totalEarned: profile.total_earned,
        createdAt: profile.created_at,
        lastLogin: profile.last_login,
      }));

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            page: parseInt(page as string),
            limit: take,
            total,
            pages: Math.ceil(total / take),
          },
        },
      });
    } catch (error: any) {
      logger.error('Get users error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при получении пользователей',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Получение списка проектов
  static async getProjects(req: AuthRequest, res: Response) {
    try {
      if (!this.checkAdmin(req)) {
        return res.status(403).json({
          success: false,
          message: 'Требуются права администратора',
        });
      }

      const {
        page = 1,
        limit = 20,
        status,
        category,
        search,
        sortBy = 'created_at',
        sortOrder = 'desc',
      } = req.query;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const take = parseInt(limit as string);

      const where: any[] = [];

      if (status) {
        where.push({ column: 'status', operator: 'eq', value: status });
      }

      if (category) {
        where.push({ column: 'category', operator: 'eq', value: category });
      }

      if (search) {
        where.push({ column: 'title', operator: 'ilike', value: `%${search}%` });
      }

      const projectsResult = await db.find<any>('projects', {
        where,
        orderBy: {
          column: sortBy as string,
          ascending: sortOrder === 'asc'
        },
        limit: take,
        offset: skip
      });

      const total = projectsResult.count || 0;

      // Получаем связанные данные для проектов
      const projectsWithDetails = await Promise.all(
        projectsResult.data.map(async (project: any) => {
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
              email: client.email,
            } : null,
            freelancer: freelancer ? {
              id: freelancer.id,
              firstName: freelancer.first_name,
              lastName: freelancer.last_name,
              email: freelancer.email,
            } : null,
            _count: {
              bids: bidsResult.count || 0
            }
          };
        })
      );

      res.json({
        success: false,
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
      logger.error('Get projects error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при получении проектов',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Получение списка транзакций
  static async getTransactions(req: AuthRequest, res: Response) {
    try {
      if (!this.checkAdmin(req)) {
        return res.status(403).json({
          success: false,
          message: 'Требуются права администратора',
        });
      }

      const {
        page = 1,
        limit = 20,
        type,
        status,
        startDate,
        endDate,
        sortBy = 'created_at',
        sortOrder = 'desc',
      } = req.query;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const take = parseInt(limit as string);

      const where: any[] = [];

      if (type) {
        where.push({ column: 'type', operator: 'eq', value: type });
      }

      if (status) {
        where.push({ column: 'status', operator: 'eq', value: status });
      }

      if (startDate) {
        where.push({ column: 'created_at', operator: 'gte', value: startDate });
      }

      if (endDate) {
        where.push({ column: 'created_at', operator: 'lte', value: endDate });
      }

      const transactionsResult = await db.find<any>('transactions', {
        where,
        orderBy: {
          column: sortBy as string,
          ascending: sortOrder === 'asc'
        },
        limit: take,
        offset: skip
      });

      const total = transactionsResult.count || 0;

      // Получаем данные пользователей для транзакций
      const transactionsWithUsers = await Promise.all(
        transactionsResult.data.map(async (transaction: any) => {
          const user = await db.findOneBy<any>('profiles', 'id', transaction.user_id);
          let project = null;
          if (transaction.project_id) {
            project = await db.findOne<any>('projects', transaction.project_id);
          }

          return {
            ...transaction,
            user: user ? {
              id: user.id,
              firstName: user.first_name,
              lastName: user.last_name,
              email: user.email,
            } : null,
            project: project ? {
              id: project.id,
              title: project.title,
            } : null
          };
        })
      );

      // Агрегация сумм
      let totalAmount = 0;
      if (transactionsResult.data.length > 0) {
        totalAmount = transactionsResult.data.reduce(
          (sum, transaction) => sum + (transaction.amount || 0), 0
        );
      }

      res.json({
        success: true,
        data: {
          transactions: transactionsWithUsers,
          totalAmount,
          pagination: {
            page: parseInt(page as string),
            limit: take,
            total,
            pages: Math.ceil(total / take),
          },
        },
      });
    } catch (error: any) {
      logger.error('Get transactions error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при получении транзакций',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Получение запросов на вывод средств
  static async getWithdrawals(req: AuthRequest, res: Response) {
    try {
      if (!this.checkAdmin(req)) {
        return res.status(403).json({
          success: false,
          message: 'Требуются права администратора',
        });
      }

      const {
        page = 1,
        limit = 20,
        status,
        sortBy = 'created_at',
        sortOrder = 'desc',
      } = req.query;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const take = parseInt(limit as string);

      const where: any[] = [];

      if (status) {
        where.push({ column: 'status', operator: 'eq', value: status });
      }

      // Предполагаем, что таблица называется 'withdrawals'
      const withdrawalsResult = await db.find<any>('withdrawals', {
        where,
        orderBy: {
          column: sortBy as string,
          ascending: sortOrder === 'asc'
        },
        limit: take,
        offset: skip
      });

      const total = withdrawalsResult.count || 0;

      // Получаем данные пользователей
      const withdrawalsWithUsers = await Promise.all(
        withdrawalsResult.data.map(async (withdrawal: any) => {
          const user = await db.findOneBy<any>('profiles', 'id', withdrawal.user_id);
          
          return {
            ...withdrawal,
            user: user ? {
              id: user.id,
              firstName: user.first_name,
              lastName: user.last_name,
              email: user.email,
              balance: user.balance,
            } : null
          };
        })
      );

      res.json({
        success: true,
        data: {
          withdrawals: withdrawalsWithUsers,
          pagination: {
            page: parseInt(page as string),
            limit: take,
            total,
            pages: Math.ceil(total / take),
          },
        },
      });
    } catch (error: any) {
      logger.error('Get withdrawals error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при получении запросов на вывод',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Обновление статуса вывода средств
  static async updateWithdrawalStatus(req: AuthRequest, res: Response) {
    try {
      if (!this.checkAdmin(req)) {
        return res.status(403).json({
          success: false,
          message: 'Требуются права администратора',
        });
      }

      const { id } = req.params;
      const { status, adminComment } = req.body;

      // Находим запрос на вывод
      const withdrawal = await db.findOne<any>('withdrawals', id);
      
      if (!withdrawal) {
        return res.status(404).json({
          success: false,
          message: 'Запрос на вывод не найден',
        });
      }

      // Получаем пользователя
      const user = await db.findOneBy<any>('profiles', 'id', withdrawal.user_id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Пользователь не найден',
        });
      }

      // Обновление статуса
      const updatedWithdrawal = await db.update<any>('withdrawals', id, {
        status,
        admin_comment: adminComment,
        processed_at: status !== 'PENDING' ? new Date().toISOString() : null,
        completed_at: status === 'COMPLETED' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      });

      // Если статус REJECTED, возвращаем средства пользователю
      if (status === 'REJECTED') {
        await db.update<any>('profiles', user.id, {
          balance: (user.balance || 0) + withdrawal.amount,
          updated_at: new Date().toISOString(),
        });

        // Создаем транзакцию возврата
        await db.create<any>('transactions', {
          user_id: withdrawal.user_id,
          type: 'WITHDRAWAL_REFUND',
          amount: withdrawal.amount,
          currency: 'RUB',
          status: 'COMPLETED',
          description: `Возврат средств из-за отклонения вывода #${withdrawal.id}`,
          metadata: {
            withdrawalId: withdrawal.id,
            reason: adminComment,
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      // TODO: Отправить уведомление пользователю

      res.json({
        success: true,
        message: 'Статус вывода обновлен',
        data: updatedWithdrawal,
      });
    } catch (error: any) {
      logger.error('Update withdrawal status error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при обновлении статуса вывода',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Блокировка/разблокировка пользователя
  static async toggleUserStatus(req: AuthRequest, res: Response) {
    try {
      if (!this.checkAdmin(req)) {
        return res.status(403).json({
          success: false,
          message: 'Требуются права администратора',
        });
      }

      const { userId } = req.params;
      const { isActive, reason } = req.body;

      const user = await db.findOne<any>('profiles', userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Пользователь не найден',
        });
      }

      // Нельзя блокировать администраторов
      if (user.user_type === 'admin') {
        return res.status(400).json({
          success: false,
          message: 'Нельзя заблокировать администратора',
        });
      }

      const updatedUser = await db.update<any>('profiles', userId, {
        is_active: isActive,
        blocked_at: !isActive ? new Date().toISOString() : null,
        block_reason: !isActive ? reason : null,
        updated_at: new Date().toISOString(),
      });

      // TODO: Отправить уведомление пользователю

      res.json({
        success: true,
        message: `Пользователь ${isActive ? 'разблокирован' : 'заблокирован'}`,
        data: updatedUser,
      });
    } catch (error: any) {
      logger.error('Toggle user status error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при изменении статуса пользователя',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Управление проектами
  static async updateProjectStatus(req: AuthRequest, res: Response) {
    try {
      if (!this.checkAdmin(req)) {
        return res.status(403).json({
          success: false,
          message: 'Требуются права администратора',
        });
      }

      const { projectId } = req.params;
      const { status, reason } = req.body;

      const project = await db.findOne<any>('projects', projectId);

      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Проект не найден',
        });
      }

      const updatedProject = await db.update<any>('projects', projectId, {
        status,
        admin_comment: reason,
        updated_at: new Date().toISOString(),
      });

      // TODO: Отправить уведомление участникам проекта

      res.json({
        success: true,
        message: 'Статус проекта обновлен',
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

  // Получение жалоб и репортов
  static async getReports(req: AuthRequest, res: Response) {
    try {
      if (!this.checkAdmin(req)) {
        return res.status(403).json({
          success: false,
          message: 'Требуются права администратора',
        });
      }

      const {
        page = 1,
        limit = 20,
        type,
        resolved,
        sortBy = 'created_at',
        sortOrder = 'desc',
      } = req.query;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const take = parseInt(limit as string);

      const where: any[] = [];

      if (type) {
        where.push({ column: 'type', operator: 'eq', value: type });
      }

      if (resolved !== undefined) {
        where.push({ column: 'resolved', operator: 'eq', value: resolved === 'true' });
      }

      // Предполагаем, что таблица называется 'reports'
      const reportsResult = await db.find<any>('reports', {
        where,
        orderBy: {
          column: sortBy as string,
          ascending: sortOrder === 'asc'
        },
        limit: take,
        offset: skip
      });

      const total = reportsResult.count || 0;

      res.json({
        success: true,
        data: {
          reports: reportsResult.data,
          pagination: {
            page: parseInt(page as string),
            limit: take,
            total,
            pages: Math.ceil(total / take),
          },
        },
      });
    } catch (error: any) {
      logger.error('Get reports error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при получении жалоб',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}