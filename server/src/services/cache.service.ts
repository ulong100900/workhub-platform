import Redis from 'ioredis';
import logger from '../utils/logger';

export class CacheService {
  private client: Redis;
  private isConnected: boolean = false;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    this.client = new Redis(redisUrl, {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.client.on('connect', () => {
      this.isConnected = true;
      logger.info('✅ Redis connected successfully');
    });

    this.client.on('error', (error) => {
      this.isConnected = false;
      logger.error('Redis connection error:', error);
    });

    this.client.on('reconnecting', () => {
      logger.info('🔄 Redis reconnecting...');
    });
  }

  // Базовые операции
  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    try {
      const serializedValue = JSON.stringify(value);
      
      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }
      
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error:', error);
      return false;
    }
  }

  // Операции с множествами
  async addToSet(key: string, ...values: string[]): Promise<boolean> {
    try {
      await this.client.sadd(key, ...values);
      return true;
    } catch (error) {
      logger.error('Cache add to set error:', error);
      return false;
    }
  }

  async getSet(key: string): Promise<string[]> {
    try {
      return await this.client.smembers(key);
    } catch (error) {
      logger.error('Cache get set error:', error);
      return [];
    }
  }

  async isInSet(key: string, value: string): Promise<boolean> {
    try {
      const result = await this.client.sismember(key, value);
      return result === 1;
    } catch (error) {
      logger.error('Cache is in set error:', error);
      return false;
    }
  }

  // Операции с хэшами
  async setHash(key: string, field: string, value: any): Promise<boolean> {
    try {
      const serializedValue = JSON.stringify(value);
      await this.client.hset(key, field, serializedValue);
      return true;
    } catch (error) {
      logger.error('Cache set hash error:', error);
      return false;
    }
  }

  async getHash<T = any>(key: string, field: string): Promise<T | null> {
    try {
      const value = await this.client.hget(key, field);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache get hash error:', error);
      return null;
    }
  }

  async getAllHash<T = any>(key: string): Promise<Record<string, T>> {
    try {
      const data = await this.client.hgetall(key);
      const result: Record<string, T> = {};
      
      for (const [field, value] of Object.entries(data)) {
        result[field] = JSON.parse(value);
      }
      
      return result;
    } catch (error) {
      logger.error('Cache get all hash error:', error);
      return {};
    }
  }

  // Управление TTL
  async setTtl(key: string, seconds: number): Promise<boolean> {
    try {
      await this.client.expire(key, seconds);
      return true;
    } catch (error) {
      logger.error('Cache set TTL error:', error);
      return false;
    }
  }

  async getTtl(key: string): Promise<number> {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      logger.error('Cache get TTL error:', error);
      return -2; // Ключ не существует
    }
  }

  // Паттерны для конкретных данных
  async cacheUserData(userId: string, data: any): Promise<boolean> {
    const key = `user:${userId}`;
    return this.set(key, data, 3600); // 1 час
  }

  async getUserData<T = any>(userId: string): Promise<T | null> {
    const key = `user:${userId}`;
    return this.get<T>(key);
  }

  async cacheProjectData(projectId: string, data: any): Promise<boolean> {
    const key = `project:${projectId}`;
    return this.set(key, data, 1800); // 30 минут
  }

  async getProjectData<T = any>(projectId: string): Promise<T | null> {
    const key = `project:${projectId}`;
    return this.get<T>(key);
  }

  async cacheSearchResults(query: string, filters: any, results: any): Promise<boolean> {
    const key = this.generateSearchKey(query, filters);
    return this.set(key, results, 300); // 5 минут
  }

  async getSearchResults<T = any>(query: string, filters: any): Promise<T | null> {
    const key = this.generateSearchKey(query, filters);
    return this.get<T>(key);
  }

  private generateSearchKey(query: string, filters: any): string {
    const filterString = JSON.stringify(filters);
    const hash = require('crypto')
      .createHash('md5')
      .update(`${query}:${filterString}`)
      .digest('hex');
    
    return `search:${hash}`;
  }

  // Управление сессиями
  async setSession(sessionId: string, data: any): Promise<boolean> {
    const key = `session:${sessionId}`;
    return this.set(key, data, 86400); // 24 часа
  }

  async getSession<T = any>(sessionId: string): Promise<T | null> {
    const key = `session:${sessionId}`;
    return this.get<T>(key);
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    const key = `session:${sessionId}`;
    return this.delete(key);
  }

  // Rate limiting
  async checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<{
    allowed: boolean;
    remaining: number;
    reset: number;
  }> {
    const now = Date.now();
    const windowStart = now - (windowSeconds * 1000);
    
    // Используем Redis sorted set для rate limiting
    const cacheKey = `ratelimit:${key}`;
    
    try {
      // Удаляем старые записи
      await this.client.zremrangebyscore(cacheKey, 0, windowStart);
      
      // Добавляем текущий запрос
      await this.client.zadd(cacheKey, now, `${now}:${Math.random()}`);
      
      // Устанавливаем TTL
      await this.client.expire(cacheKey, windowSeconds);
      
      // Получаем количество запросов в окне
      const requestCount = await this.client.zcount(cacheKey, windowStart, now);
      
      return {
        allowed: requestCount <= limit,
        remaining: Math.max(0, limit - requestCount),
        reset: Math.ceil((windowStart + windowSeconds * 1000 - now) / 1000),
      };
    } catch (error) {
      logger.error('Rate limit check error:', error);
      // В случае ошибки Redis разрешаем запрос
      return {
        allowed: true,
        remaining: limit,
        reset: windowSeconds,
      };
    }
  }

  // Очистка кэша по паттерну
  async clearPattern(pattern: string): Promise<number> {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
      return keys.length;
    } catch (error) {
      logger.error('Clear pattern error:', error);
      return 0;
    }
  }

  // Статистика кэша
  async getStats(): Promise<any> {
    try {
      const info = await this.client.info();
      const keys = await this.client.dbsize();
      
      return {
        connected: this.isConnected,
        keys,
        info: this.parseRedisInfo(info),
      };
    } catch (error) {
      logger.error('Get cache stats error:', error);
      return {
        connected: this.isConnected,
        keys: 0,
        info: {},
      };
    }
  }

  private parseRedisInfo(info: string): Record<string, any> {
    const lines = info.split('\r\n');
    const result: Record<string, any> = {};
    
    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        result[key] = value;
      }
    }
    
    return result;
  }

  // Закрытие соединения
  async disconnect(): Promise<void> {
    await this.client.quit();
    this.isConnected = false;
  }
}

// Singleton экземпляр
let cacheService: CacheService | null = null;

export const getCacheService = (): CacheService => {
  if (!cacheService) {
    cacheService = new CacheService();
  }
  return cacheService;
};

export default getCacheService;