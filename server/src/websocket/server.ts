import { Server, Socket } from 'socket.io';
import { createServer } from 'http';
import app from '../index';
import { prisma } from '../index';
import logger from '../utils/logger';
import { verifyToken } from '../utils/auth';

interface SocketUser {
  id: string;
  firstName: string;
  lastName: string;
}

interface MessageData {
  roomId: string;
  content: string;
  type?: string;
  tempId?: string;
}

interface TypingData {
  roomId: string;
  isTyping: boolean;
}

interface ReadMessagesData {
  roomId: string;
  messageIds: string[];
}

interface CallData {
  userId: string;
  offer?: any;
  roomId?: string;
  callerId?: string;
  answer?: any;
  candidate?: any;
}

interface PushNotificationData {
  type: string;
  conversationId: string;
  messageId: string;
  senderId: string;
}

interface CustomSocket extends Socket {
  user?: SocketUser;
}

export class WebSocketServer {
  private io: Server;
  private activeUsers: Map<string, string> = new Map(); // socketId -> userId
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> socketIds[]

  constructor() {
    const httpServer = createServer(app);
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupMiddleware();
    this.setupEventHandlers();

    // Запуск на отдельном порту
    const WS_PORT = process.env.WS_PORT || 3002;
    httpServer.listen(WS_PORT, () => {
      logger.info(`🚀 WebSocket server is running on port ${WS_PORT}`);
    });
  }

  private setupMiddleware() {
    this.io.use(async (socket: CustomSocket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          return next(new Error('Authentication error'));
        }

        const decoded = verifyToken(token) as SocketUser;
        socket.user = decoded;
        
        next();
      } catch (error) {
        logger.error('Socket authentication error:', error);
        next(new Error('Authentication error'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: Socket) => {
      const customSocket = socket as CustomSocket;
      const user = customSocket.user;
      
      if (!user) {
        socket.disconnect();
        return;
      }

      // Регистрация пользователя
      this.registerUser(user.id, socket.id);

      logger.info(`User ${user.id} connected with socket ${socket.id}`);

      // Основные события
      socket.on('join_room', (roomId: string) => this.handleJoinRoom(socket, roomId));
      socket.on('leave_room', (roomId: string) => this.handleLeaveRoom(socket, roomId));
      socket.on('send_message', (data: MessageData) => this.handleSendMessage(customSocket, data));
      socket.on('typing', (data: TypingData) => this.handleTyping(customSocket, data));
      socket.on('read_messages', (data: ReadMessagesData) => this.handleReadMessages(customSocket, data));
      socket.on('call_user', (data: CallData) => this.handleCallUser(customSocket, data));
      socket.on('call_answer', (data: CallData) => this.handleCallAnswer(customSocket, data));
      socket.on('ice_candidate', (data: CallData) => this.handleIceCandidate(customSocket, data));
      socket.on('disconnect', () => this.handleDisconnect(customSocket));
    });
  }

  private registerUser(userId: string, socketId: string) {
    this.activeUsers.set(socketId, userId);
    
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socketId);

    // Уведомляем о входе пользователя
    this.io.emit('user_status', {
      userId,
      status: 'online',
      timestamp: new Date().toISOString(),
    });
  }

  private unregisterUser(socketId: string) {
    const userId = this.activeUsers.get(socketId);
    if (userId) {
      this.activeUsers.delete(socketId);
      
      const userSockets = this.userSockets.get(userId);
      if (userSockets) {
        userSockets.delete(socketId);
        if (userSockets.size === 0) {
          this.userSockets.delete(userId);
          
          // Уведомляем о выходе пользователя
          setTimeout(() => {
            if (!this.userSockets.has(userId)) {
              this.io.emit('user_status', {
                userId,
                status: 'offline',
                timestamp: new Date().toISOString(),
                lastSeen: new Date().toISOString(),
              });
            }
          }, 5000); // Задержка для предотвращения мерцания
        }
      }
    }
  }

  private handleJoinRoom(socket: Socket, roomId: string) {
    socket.join(roomId);
    logger.info(`Socket ${socket.id} joined room ${roomId}`);
  }

  private handleLeaveRoom(socket: Socket, roomId: string) {
    socket.leave(roomId);
    logger.info(`Socket ${socket.id} left room ${roomId}`);
  }

  private async handleSendMessage(socket: CustomSocket, data: MessageData) {
    try {
      const { roomId, content, type = 'text', tempId } = data;
      const user = socket.user!;

      if (!roomId || !content) {
        socket.emit('error', { message: 'Недостаточно данных' });
        return;
      }

      // Проверка прав доступа к комнате
      const hasAccess = await this.checkRoomAccess(roomId, user.id);
      if (!hasAccess) {
        socket.emit('error', { message: 'Нет доступа к этому чату' });
        return;
      }

      // Создание сообщения в базе данных
      const message = await prisma.message.create({
        data: {
          conversationId: roomId,
          senderId: user.id,
          content,
          type,
          isRead: false,
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      });

      // Отправка сообщения всем участникам комнаты
      this.io.to(roomId).emit('new_message', {
        ...message,
        tempId, // Для подтверждения доставки на клиенте
      });

      // Обновление времени последнего сообщения в беседе
      await prisma.conversation.update({
        where: { id: roomId },
        data: {
          lastMessageAt: new Date(),
          lastMessage: content.substring(0, 100),
        },
      });

      // Отправка push уведомлений
      await this.sendMessageNotifications(roomId, message, user.id);

    } catch (error: unknown) {
      logger.error('Handle send message error:', error);
      socket.emit('error', { message: 'Ошибка при отправке сообщения' });
    }
  }

  private async handleTyping(socket: CustomSocket, data: TypingData) {
    try {
      const { roomId, isTyping } = data;
      const user = socket.user!;

      // Отправка уведомления о наборе текста всем в комнате, кроме отправителя
      socket.to(roomId).emit('user_typing', {
        roomId,
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        isTyping,
        timestamp: new Date().toISOString(),
      });
    } catch (error: unknown) {
      logger.error('Handle typing error:', error);
    }
  }

  private async handleReadMessages(socket: CustomSocket, data: ReadMessagesData) {
    try {
      const { roomId, messageIds } = data;
      const user = socket.user!;

      // Обновление статуса прочтения сообщений
      await prisma.message.updateMany({
        where: {
          id: { in: messageIds },
          conversationId: roomId,
          senderId: { not: user.id }, // Не отмечаем свои сообщения как прочитанные
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      // Уведомление отправителей о прочтении
      const messages = await prisma.message.findMany({
        where: { id: { in: messageIds } },
        select: { senderId: true, id: true },
      });

      const senderIds = [...new Set(messages.map(m => m.senderId))];
      
      senderIds.forEach(senderId => {
        if (senderId !== user.id) {
          const senderSockets = this.userSockets.get(senderId);
          if (senderSockets) {
            senderSockets.forEach(socketId => {
              this.io.to(socketId).emit('messages_read', {
                roomId,
                readerId: user.id,
                messageIds: messages.filter(m => m.senderId === senderId).map(m => m.id),
                timestamp: new Date().toISOString(),
              });
            });
          }
        }
      });

    } catch (error: unknown) {
      logger.error('Handle read messages error:', error);
    }
  }

  private async handleCallUser(socket: CustomSocket, data: CallData) {
    try {
      const { userId, offer, roomId } = data;
      const caller = socket.user!;

      // Проверка, что пользователь онлайн
      const userSockets = this.userSockets.get(userId);
      if (!userSockets || userSockets.size === 0) {
        socket.emit('call_failed', {
          userId,
          reason: 'Пользователь не в сети',
        });
        return;
      }

      // Отправка звонка пользователю
      userSockets.forEach(socketId => {
        this.io.to(socketId).emit('incoming_call', {
          callerId: caller.id,
          callerName: `${caller.firstName} ${caller.lastName}`,
          offer,
          roomId,
          timestamp: new Date().toISOString(),
        });
      });

      // Уведомление звонящего о доставке
      socket.emit('call_sent', {
        userId,
        timestamp: new Date().toISOString(),
      });

    } catch (error: unknown) {
      logger.error('Handle call user error:', error);
      socket.emit('call_failed', {
        reason: 'Ошибка при установке звонка',
      });
    }
  }

  private async handleCallAnswer(socket: CustomSocket, data: CallData) {
    try {
      const { callerId, answer } = data;
      const receiver = socket.user!;

      // Отправка ответа звонящему
      const callerSockets = this.userSockets.get(callerId);
      if (callerSockets) {
        callerSockets.forEach(socketId => {
          this.io.to(socketId).emit('call_answered', {
            receiverId: receiver.id,
            receiverName: `${receiver.firstName} ${receiver.lastName}`,
            answer,
            timestamp: new Date().toISOString(),
          });
        });
      }
    } catch (error: unknown) {
      logger.error('Handle call answer error:', error);
    }
  }

  private async handleIceCandidate(socket: CustomSocket, data: CallData) {
    try {
      const { userId, candidate } = data;
      const sender = socket.user!;

      // Пересылка ICE кандидата
      const userSockets = this.userSockets.get(userId);
      if (userSockets) {
        userSockets.forEach(socketId => {
          this.io.to(socketId).emit('ice_candidate', {
            senderId: sender.id,
            candidate,
            timestamp: new Date().toISOString(),
          });
        });
      }
    } catch (error: unknown) {
      logger.error('Handle ice candidate error:', error);
    }
  }

  private async handleDisconnect(socket: CustomSocket) {
    try {
      const user = socket.user;
      logger.info(`User ${user?.id} disconnected with socket ${socket.id}`);
      
      this.unregisterUser(socket.id);
    } catch (error: unknown) {
      logger.error('Handle disconnect error:', error);
    }
  }

  private async checkRoomAccess(roomId: string, userId: string): Promise<boolean> {
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id: roomId },
        include: {
          participants: true,
        },
      });

      if (!conversation) {
        return false;
      }

      return conversation.participants.some(p => p.userId === userId);
    } catch (error: unknown) {
      logger.error('Check room access error:', error);
      return false;
    }
  }

  private async sendMessageNotifications(roomId: string, message: any, senderId: string) {
    try {
      // Получение участников беседы
      const conversation = await prisma.conversation.findUnique({
        where: { id: roomId },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  notificationSettings: true,
                },
              },
            },
          },
        },
      });

      if (!conversation) return;

      // Отправка уведомлений всем участникам, кроме отправителя
      for (const participant of conversation.participants) {
        if (participant.user.id !== senderId) {
          // Проверка настроек уведомлений
          const settings = participant.user.notificationSettings as any;
          if (settings?.messages) {
            // Отправка push уведомления
            this.sendPushNotification(
              participant.user.id,
              'Новое сообщение',
              `${message.sender.firstName}: ${message.content.substring(0, 50)}...`,
              {
                type: 'MESSAGE',
                conversationId: roomId,
                messageId: message.id,
                senderId: senderId,
              }
            );

            // Можно добавить отправку email уведомлений
          }
        }
      }
    } catch (error: unknown) {
      logger.error('Send message notifications error:', error);
    }
  }

  private sendPushNotification(userId: string, title: string, body: string, data: PushNotificationData) {
    // Здесь должна быть интеграция с Firebase Cloud Messaging или другим push сервисом
    // Для простоты просто эмитируем событие
    const userSockets = this.userSockets.get(userId);
    if (userSockets) {
      userSockets.forEach(socketId => {
        this.io.to(socketId).emit('push_notification', {
          title,
          body,
          data,
          timestamp: new Date().toISOString(),
        });
      });
    }
  }

  // Метод для отправки сообщений извне (например, из контроллеров)
  public sendToUser(userId: string, event: string, data: any) {
    const userSockets = this.userSockets.get(userId);
    if (userSockets) {
      userSockets.forEach(socketId => {
        this.io.to(socketId).emit(event, data);
      });
    }
  }

  public sendToRoom(roomId: string, event: string, data: any) {
    this.io.to(roomId).emit(event, data);
  }

  public getOnlineUsers(): string[] {
    return Array.from(this.userSockets.keys());
  }

  public isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId) && this.userSockets.get(userId)!.size > 0;
  }
}

// Экспорт singleton
let wsServer: WebSocketServer | null = null;

export const getWebSocketServer = (): WebSocketServer => {
  if (!wsServer) {
    wsServer = new WebSocketServer();
  }
  return wsServer;
};

export default getWebSocketServer;