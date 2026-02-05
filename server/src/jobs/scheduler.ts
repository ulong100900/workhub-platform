import cron from 'node-cron';
import { prisma } from '../index';
import { AnalyticsService } from '../services/analytics.service';
import logger from '../utils/logger';
import { sendEmail } from '../services/email.service';

export const scheduleJobs = () => {
  logger.info('🕐 Scheduling background jobs...');

  // Ежедневная аналитика в 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    try {
      logger.info('Starting daily analytics collection...');
      await AnalyticsService.collectPlatformAnalytics();
      logger.info('Daily analytics collection completed');
    } catch (error) {
      logger.error('Daily analytics job error:', error);
    }
  });

  // Очистка старых сессий каждый час
  cron.schedule('0 * * * *', async () => {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      await prisma.session.deleteMany({
        where: {
          expiresAt: { lt: sevenDaysAgo },
        },
      });
      
      logger.info('Cleaned up old sessions');
    } catch (error) {
      logger.error('Cleanup sessions job error:', error);
    }
  });

  // Отправка напоминаний о проектах каждый день в 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    try {
      const projects = await prisma.project.findMany({
        where: {
          status: 'IN_PROGRESS',
          deadline: {
            lte: new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000), // 3 дня до дедлайна
            gte: new Date(),
          },
        },
        include: {
          client: true,
          freelancer: true,
        },
      });

      for (const project of projects) {
        // Отправка уведомления клиенту
        await sendEmail({
          to: project.client.email,
          subject: `Напоминание о проекте: ${project.title}`,
          template: 'project-reminder',
          data: {
            projectName: project.title,
            deadline: project.deadline.toLocaleDateString(),
            freelancerName: `${project.freelancer?.firstName} ${project.freelancer?.lastName}`,
          },
        });

        // Отправка уведомления фрилансеру
        if (project.freelancer) {
          await sendEmail({
            to: project.freelancer.email,
            subject: `Напоминание о проекте: ${project.title}`,
            template: 'project-reminder',
            data: {
              projectName: project.title,
              deadline: project.deadline.toLocaleDateString(),
              clientName: `${project.client.firstName} ${project.client.lastName}`,
            },
          });
        }
      }

      logger.info(`Sent ${projects.length} project reminders`);
    } catch (error) {
      logger.error('Project reminders job error:', error);
    }
  });

  // Проверка неактивных пользователей каждую неделю
  cron.schedule('0 0 * * 0', async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const inactiveUsers = await prisma.user.findMany({
        where: {
          lastLogin: { lt: thirtyDaysAgo },
          isActive: true,
          type: { in: ['FREELANCER', 'CLIENT'] },
        },
        take: 100,
      });

      for (const user of inactiveUsers) {
        await sendEmail({
          to: user.email,
          subject: 'Мы по вам скучаем!',
          template: 're-engagement',
          data: {
            userName: `${user.firstName} ${user.lastName}`,
          },
        });
      }

      logger.info(`Sent ${inactiveUsers.length} re-engagement emails`);
    } catch (error) {
      logger.error('Re-engagement job error:', error);
    }
  });

  // Сбор статистики по навыкам каждый месяц
  cron.schedule('0 0 1 * *', async () => {
    try {
      const trendingSkills = await prisma.$queryRaw`
        SELECT 
          UNNEST(skills) as skill,
          COUNT(*) as project_count,
          AVG(budget_max) as avg_budget
        FROM projects
        WHERE created_at >= NOW() - INTERVAL '30 days'
          AND status = 'ACTIVE'
        GROUP BY skill
        ORDER BY project_count DESC
        LIMIT 20
      `;

      // Сохранение в базу для аналитики
      await prisma.skillTrend.create({
        data: {
          period: 'MONTHLY',
          data: trendingSkills,
          createdAt: new Date(),
        },
      });

      logger.info('Monthly skill trends collected');
    } catch (error) {
      logger.error('Skill trends job error:', error);
    }
  });

  logger.info('✅ All background jobs scheduled');
};