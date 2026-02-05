import { Request, Response } from 'express';
import { prisma } from '../index';
import { paymentSchema } from '../utils/validation';
import { AuthRequest } from '../middleware/auth';
import Stripe from 'stripe';
import { YooCheckout, ICreatePayment } from '@a2seven/yoo-checkout';
import logger from '../utils/logger';
import crypto from 'crypto';

export class PaymentController {
  private static stripe: Stripe;
  private static yooCheckout: YooCheckout;

  static initialize() {
    // Инициализация Stripe
    if (process.env.STRIPE_SECRET_KEY) {
      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2023-10-16',
      });
    }

    // Инициализация ЮKassa
    if (process.env.YOOKASSA_SHOP_ID && process.env.YOOKASSA_SECRET_KEY) {
      this.yooCheckout = new YooCheckout({
        shopId: process.env.YOOKASSA_SHOP_ID,
        secretKey: process.env.YOOKASSA_SECRET_KEY,
      });
    }
  }

  // Пополнение баланса
  static async createDeposit(req: AuthRequest, res: Response) {
    try {
      // Валидация
      const { error } = paymentSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
        });
      }

      const { amount, currency, method } = req.body;
      const depositAmount = parseFloat(amount);

      // Создание транзакции
      const transaction = await prisma.transaction.create({
        data: {
          userId: req.user.id,
          type: 'DEPOSIT',
          amount: depositAmount,
          currency: currency || 'RUB',
          status: 'PENDING',
          description: `Пополнение баланса на ${depositAmount.toLocaleString()} ${currency || 'RUB'}`,
          metadata: {
            method,
            userId: req.user.id,
            email: req.user.email,
          },
        },
      });

      let paymentData;

      // Выбор платежной системы
      if (method === 'stripe') {
        // Stripe платеж
        if (!this.stripe) {
          throw new Error('Stripe не настроен');
        }

        const paymentIntent = await this.stripe.paymentIntents.create({
          amount: Math.round(depositAmount * 100), // Конвертация в копейки/центы
          currency: currency.toLowerCase() || 'rub',
          metadata: {
            transactionId: transaction.id,
            userId: req.user.id,
          },
          description: `Пополнение баланса #${transaction.id}`,
        });

        paymentData = {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
        };

      } else if (method === 'yookassa') {
        // ЮKassa платеж
        if (!this.yooCheckout) {
          throw new Error('ЮKassa не настроена');
        }

        const idempotenceKey = crypto.randomUUID();
        const payment: ICreatePayment = {
          amount: {
            value: depositAmount.toFixed(2),
            currency: currency || 'RUB',
          },
          confirmation: {
            type: 'redirect',
            return_url: `${process.env.CLIENT_URL}/dashboard/finance`,
          },
          description: `Пополнение баланса #${transaction.id}`,
          metadata: {
            transactionId: transaction.id,
            userId: req.user.id,
          },
          receipt: {
            customer: {
              email: req.user.email,
            },
            items: [
              {
                description: 'Пополнение баланса на WorkFinder',
                quantity: '1',
                amount: {
                  value: depositAmount.toFixed(2),
                  currency: currency || 'RUB',
                },
                vat_code: 1,
              },
            ],
          },
        };

        const yooPayment = await this.yooCheckout.createPayment(
          payment,
          idempotenceKey
        );

        paymentData = {
          confirmationUrl: yooPayment.confirmation.confirmation_url,
          paymentId: yooPayment.id,
        };

        // Обновление транзакции
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            externalId: yooPayment.id,
          },
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Неподдерживаемый метод оплаты',
        });
      }

      res.json({
        success: true,
        message: 'Платеж создан',
        data: {
          transaction,
          payment: paymentData,
        },
      });
    } catch (error) {
      logger.error('Create deposit error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при создании платежа',
      });
    }
  }

  // Webhook для обработки платежей
  static async handleWebhook(req: Request, res: Response) {
    try {
      const signature = req.headers['stripe-signature'] as string;
      const payload = req.body;

      if (signature) {
        // Обработка Stripe webhook
        let event;
        try {
          event = this.stripe.webhooks.constructEvent(
            payload,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
          );
        } catch (err) {
          logger.error('Stripe webhook signature verification failed:', err);
          return res.status(400).send(`Webhook Error: ${(err as Error).message}`);
        }

        // Обработка события
        switch (event.type) {
          case 'payment_intent.succeeded':
            await this.handleStripePaymentSuccess(event.data.object);
            break;
          case 'payment_intent.payment_failed':
            await this.handleStripePaymentFailure(event.data.object);
            break;
        }
      } else if (payload.event === 'payment.waiting_for_capture') {
        // Обработка ЮKassa webhook
        await this.handleYooKassaPayment(payload.object);
      }

      res.json({ received: true });
    } catch (error) {
      logger.error('Webhook error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка обработки webhook',
      });
    }
  }

  // Обработка успешного платежа Stripe
  private static async handleStripePaymentSuccess(paymentIntent: any) {
    try {
      const transactionId = paymentIntent.metadata.transactionId;
      const userId = paymentIntent.metadata.userId;

      // Поиск транзакции
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
      });

      if (!transaction || transaction.status !== 'PENDING') {
        return;
      }

      // Обновление транзакции
      await prisma.$transaction([
        prisma.transaction.update({
          where: { id: transactionId },
          data: {
            status: 'COMPLETED',
            externalId: paymentIntent.id,
            processedAt: new Date(),
            completedAt: new Date(),
          },
        }),
        prisma.user.update({
          where: { id: userId },
          data: {
            balance: { increment: transaction.amount },
          },
        }),
      ]);

      logger.info(`Payment completed: ${transactionId}`);
    } catch (error) {
      logger.error('Handle stripe payment success error:', error);
    }
  }

  // Обработка неудачного платежа Stripe
  private static async handleStripePaymentFailure(paymentIntent: any) {
    try {
      const transactionId = paymentIntent.metadata.transactionId;

      await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'FAILED',
          externalId: paymentIntent.id,
          processedAt: new Date(),
        },
      });

      logger.info(`Payment failed: ${transactionId}`);
    } catch (error) {
      logger.error('Handle stripe payment failure error:', error);
    }
  }

  // Обработка платежа ЮKassa
  private static async handleYooKassaPayment(payment: any) {
    try {
      const transactionId = payment.metadata.transactionId;
      const userId = payment.metadata.userId;

      if (payment.status !== 'succeeded') {
        return;
      }

      // Подтверждение платежа
      const idempotenceKey = crypto.randomUUID();
      await this.yooCheckout.capturePayment(payment.id, idempotenceKey);

      // Поиск транзакции
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
      });

      if (!transaction || transaction.status !== 'PENDING') {
        return;
      }

      // Обновление транзакции
      await prisma.$transaction([
        prisma.transaction.update({
          where: { id: transactionId },
          data: {
            status: 'COMPLETED',
            externalId: payment.id,
            processedAt: new Date(),
            completedAt: new Date(),
          },
        }),
        prisma.user.update({
          where: { id: userId },
          data: {
            balance: { increment: transaction.amount },
          },
        }),
      ]);

      logger.info(`YooKassa payment completed: ${transactionId}`);
    } catch (error) {
      logger.error('Handle YooKassa payment error:', error);
    }
  }

  // Запрос на вывод средств
  static async createWithdrawal(req: AuthRequest, res: Response) {
    try {
      const { amount, method, details } = req.body;
      const withdrawalAmount = parseFloat(amount);

      // Проверка баланса
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Пользователь не найден',
        });
      }

      if (user.balance < withdrawalAmount) {
        return res.status(400).json({
          success: false,
          message: 'Недостаточно средств на балансе',
        });
      }

      // Минимальная сумма вывода
      const minWithdrawal = 1000; // 1000 ₽
      if (withdrawalAmount < minWithdrawal) {
        return res.status(400).json({
          success: false,
          message: `Минимальная сумма вывода: ${minWithdrawal.toLocaleString()} ₽`,
        });
      }

      // Создание запроса на вывод
      const withdrawal = await prisma.withdrawal.create({
        data: {
          userId: req.user.id,
          amount: withdrawalAmount,
          method,
          details,
          status: 'PENDING',
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      // Создание транзакции
      const transaction = await prisma.transaction.create({
        data: {
          userId: req.user.id,
          type: 'WITHDRAWAL',
          amount: withdrawalAmount,
          currency: 'RUB',
          status: 'PENDING',
          description: `Вывод средств на сумму ${withdrawalAmount.toLocaleString()} ₽`,
          metadata: {
            withdrawalId: withdrawal.id,
            method,
            details,
          },
        },
      });

      // Связывание транзакции с выводом
      await prisma.withdrawal.update({
        where: { id: withdrawal.id },
        data: {
          transactionId: transaction.id,
        },
      });

      // Блокировка средств на балансе
      await prisma.user.update({
        where: { id: req.user.id },
        data: {
          balance: { decrement: withdrawalAmount },
        },
      });

      // TODO: Отправить уведомление администратору

      res.status(201).json({
        success: true,
        message: 'Запрос на вывод средств создан',
        data: withdrawal,
      });
    } catch (error) {
      logger.error('Create withdrawal error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при создании запроса на вывод',
      });
    }
  }

  // Получение транзакций пользователя
  static async getUserTransactions(req: AuthRequest, res: Response) {
    try {
      const { page = 1, limit = 20, type, status } = req.query;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const take = parseInt(limit as string);

      const where: any = {
        userId: req.user.id,
      };

      if (type) {
        where.type = type;
      }

      if (status) {
        where.status = status;
      }

      const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
          where,
          skip,
          take,
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            project: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        }),
        prisma.transaction.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          transactions,
          pagination: {
            page: parseInt(page as string),
            limit: take,
            total,
            pages: Math.ceil(total / take),
          },
        },
      });
    } catch (error) {
      logger.error('Get user transactions error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка при получении транзакций',
      });
    }
  }

  // Создание платежа за проект (эскроу)
  static async createProjectPayment(req: AuthRequest, res: Response) {
    try {
      const { projectId, bidId } = req.params;

      // Проверка проекта и предложения
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          client: true,
          freelancer: true,
        },
      });

      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Проект не найден',
        });
      }

      const bid = await prisma.bid.findUnique({
        where: { id: bidId },
      });

      if (!bid) {
        return res.status(404).json({
          success: false,
          message: 'Предложение не найдено',
        });
      }

      // Проверка прав доступа
      if (project.clientId !== req.user.id && req.user.type !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Нет прав для создания платежа',
        });
      }

      // Проверка статуса проекта
      if (project.status !== 'IN_PROGRESS') {
        return res.status(400).json({
          success: false,
          message: 'Платеж можно создать только для проекта в статусе "В работе"',
        });
      }

      // Расчет суммы с учетом комиссии
      const amount = bid.amount;
      const commissionRate = 0.10; // 10% комиссия
      const commission = amount * commissionRate;
      const freelancerAmount = amount - commission;

      // Проверка баланса клиента
      if (project.client.balance < amount) {
        return res.status(400).json({
          success: false,
          message: 'Недостаточно средств на балансе',
        });
      }

      // Создание транзакции эскроу
      const transaction = await prisma.transaction.create({
        data: {
          userId: req.user.id,
          projectId,
          bidId,
          type: 'ESCROW_HOLD',
          amount,
          currency: 'RUB',
          status: 'PENDING',
          description: `Оплата проекта "${project.title}"`,
          metadata: {
            projectId,
            bidId,
            freelancerId: bid.freelancerId,
            commissionRate,
            commission,
            freelancerAmount,
          },
        },
      });

      // Блокировка средств на балансе клиента
      await prisma.user.update({
        where: { id: req.user.id },
        data: {
          balance: { decrement: amount },
        },
      });

      res.status(201).json({
        success: true,
        message: 'Платеж создан, средства заморожены в эскроу',
        data: {
          transaction,
          amount,
          commission,
          freelancerAmount,
        },
      });
  } catch (error) {
    logger.error('Create project payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при создании платежа за проект',
    });
  }
}

// Выплата фрилансеру (разблокировка эскроу)
static async releaseEscrow(req: AuthRequest, res: Response) {
  try {
    const { projectId } = req.params;
    const { transactionId } = req.body;

    // Проверка проекта
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        client: true,
        freelancer: true,
        bids: true,
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Проект не найден',
      });
    }

    // Проверка статуса проекта
    if (project.status !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Можно выплатить средства только после завершения проекта',
      });
    }

    // Поиск транзакции эскроу
    const escrowTransaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        projectId,
        type: 'ESCROW_HOLD',
        status: 'COMPLETED',
      },
    });

    if (!escrowTransaction) {
      return res.status(404).json({
        success: false,
        message: 'Транзакция эскроу не найдена',
      });
    }

    const { amount, metadata } = escrowTransaction;
    const freelancerId = metadata?.freelancerId;
    const commission = metadata?.commission || 0;
    const freelancerAmount = amount - commission;

    // Проверка прав доступа
    if (project.clientId !== req.user.id && req.user.type !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Нет прав для выплаты средств',
      });
    }

    // Создание транзакции выплаты
    const paymentTransaction = await prisma.transaction.create({
      data: {
        userId: req.user.id,
        projectId,
        type: 'ESCROW_RELEASE',
        amount: freelancerAmount,
        currency: 'RUB',
        status: 'COMPLETED',
        description: `Выплата фрилансеру за проект "${project.title}"`,
        metadata: {
          fromEscrow: transactionId,
          freelancerId,
          commission,
        },
      },
    });

    // Зачисление средств фрилансеру
    await prisma.user.update({
      where: { id: freelancerId },
      data: {
        balance: { increment: freelancerAmount },
        totalEarned: { increment: freelancerAmount },
      },
    });

    // Создание транзакции комиссии
    if (commission > 0) {
      await prisma.transaction.create({
        data: {
          userId: req.user.id,
          projectId,
          type: 'COMMISSION',
          amount: commission,
          currency: 'RUB',
          status: 'COMPLETED',
          description: `Комиссия за проект "${project.title}"`,
          metadata: {
            projectId,
            rate: metadata?.commissionRate,
          },
        },
      });
    }

    res.json({
      success: true,
      message: 'Средства успешно выплачены фрилансеру',
      data: {
        transaction: paymentTransaction,
        freelancerAmount,
        commission,
      },
    });
  } catch (error) {
    logger.error('Release escrow error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при выплате средств',
    });
  }
}

// Возврат средств клиенту (отмена эскроу)
static async refundEscrow(req: AuthRequest, res: Response) {
  try {
    const { projectId } = req.params;
    const { transactionId, reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Причина возврата обязательна',
      });
    }

    // Проверка проекта
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        client: true,
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Проект не найден',
      });
    }

    // Поиск транзакции эскроу
    const escrowTransaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        projectId,
        type: 'ESCROW_HOLD',
        status: 'COMPLETED',
      },
    });

    if (!escrowTransaction) {
      return res.status(404).json({
        success: false,
        message: 'Транзакция эскроу не найдена',
      });
    }

    const { amount } = escrowTransaction;

    // Проверка прав доступа
    if (project.clientId !== req.user.id && req.user.type !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Нет прав для возврата средств',
      });
    }

    // Проверка статуса проекта
    if (project.status !== 'CANCELLED' && req.user.type !== 'ADMIN') {
      return res.status(400).json({
        success: false,
        message: 'Возврат возможен только для отмененных проектов',
      });
    }

    // Создание транзакции возврата
    const refundTransaction = await prisma.transaction.create({
      data: {
        userId: req.user.id,
        projectId,
        type: 'ESCROW_REFUND',
        amount,
        currency: 'RUB',
        status: 'COMPLETED',
        description: `Возврат средств за проект "${project.title}"`,
        metadata: {
          fromEscrow: transactionId,
          reason,
        },
      },
    });

    // Возврат средств клиенту
    await prisma.user.update({
      where: { id: project.clientId },
      data: {
        balance: { increment: amount },
      },
    });

    res.json({
      success: true,
      message: 'Средства успешно возвращены',
      data: {
        transaction: refundTransaction,
        amount,
      },
    });
  } catch (error) {
    logger.error('Refund escrow error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при возврате средств',
    });
  }
}

// Получение финансовой статистики
static async getFinanceStats(req: AuthRequest, res: Response) {
  try {
    const userId = req.user.id;

    // Получение текущего баланса
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        balance: true,
        totalEarned: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден',
      });
    }

    // Статистика за последние 30 дней
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [deposits, withdrawals, completedPayments] = await Promise.all([
      prisma.transaction.aggregate({
        where: {
          userId,
          type: 'DEPOSIT',
          status: 'COMPLETED',
          createdAt: { gte: thirtyDaysAgo },
        },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.transaction.aggregate({
        where: {
          userId,
          type: 'WITHDRAWAL',
          status: 'COMPLETED',
          createdAt: { gte: thirtyDaysAgo },
        },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.transaction.aggregate({
        where: {
          userId,
          type: 'ESCROW_RELEASE',
          status: 'COMPLETED',
          createdAt: { gte: thirtyDaysAgo },
        },
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    // Предстоящие выплаты
    const pendingWithdrawals = await prisma.withdrawal.findMany({
      where: {
        userId,
        status: 'PENDING',
      },
      select: {
        id: true,
        amount: true,
        method: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      data: {
        balance: user.balance,
        totalEarned: user.totalEarned || 0,
        statistics: {
          deposits: {
            total: deposits._sum.amount || 0,
            count: deposits._count.id || 0,
          },
          withdrawals: {
            total: withdrawals._sum.amount || 0,
            count: withdrawals._count.id || 0,
          },
          earnings: {
            total: completedPayments._sum.amount || 0,
            count: completedPayments._count.id || 0,
          },
        },
        pendingWithdrawals,
      },
    });
  } catch (error) {
    logger.error('Get finance stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении финансовой статистики',
    });
  }
}

// Получение истории платежей по проекту
static async getProjectPayments(req: AuthRequest, res: Response) {
  try {
    const { projectId } = req.params;

    // Проверка проекта и прав доступа
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        clientId: true,
        freelancerId: true,
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Проект не найден',
      });
    }

    // Проверка, что пользователь связан с проектом
    if (![project.clientId, project.freelancerId].includes(req.user.id) && 
        req.user.type !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Нет прав для просмотра платежей этого проекта',
      });
    }

    // Получение транзакций по проекту
    const transactions = await prisma.transaction.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    logger.error('Get project payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении платежей проекта',
    });
  }
}
}