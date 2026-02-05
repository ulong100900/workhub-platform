// server/src/lib/db.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ==================== ТИПЫ ====================
export interface QueryResult<T = any> {
  data: T[];
  error: string | null;
  count: number | null;
}

export interface WhereCondition {
  column: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'is' | 'cs' | 'cd';
  value: any;
}

export interface QueryOptions {
  select?: string;
  where?: WhereCondition[];
  orderBy?: { column: string; ascending: boolean };
  limit?: number;
  offset?: number;
}

// ==================== ИНТЕРФЕЙС БД ====================
export interface IDatabaseClient {
  find<T>(table: string, options?: QueryOptions): Promise<QueryResult<T>>;
  findOne<T>(table: string, id: string): Promise<T | null>;
  findOneBy<T>(table: string, column: string, value: any): Promise<T | null>;
  create<T>(table: string, data: Partial<T>): Promise<T>;
  update<T>(table: string, id: string, data: Partial<T>): Promise<T>;
  delete(table: string, id: string): Promise<boolean>;
  callFunction<T>(functionName: string, params?: any): Promise<T>;
  getClient(): SupabaseClient;
}

// ==================== РЕАЛИЗАЦИЯ SUPABASE ====================
class SupabaseDatabaseClient implements IDatabaseClient {
  private client: SupabaseClient;

  constructor(url: string, key: string) {
    if (!url || !key) {
      throw new Error('Supabase URL and Service Key are required');
    }

    this.client = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          'x-workfinder-server': 'v1.0.0',
        },
      },
    });
  }

  getClient(): SupabaseClient {
    return this.client;
  }

  async find<T>(table: string, options: QueryOptions = {}): Promise<QueryResult<T>> {
    try {
      let query = this.client.from(table).select(options.select || '*', { count: 'exact' });

      // Применяем WHERE условия
      if (options.where && options.where.length > 0) {
        options.where.forEach(condition => {
          query = query.filter(condition.column, condition.operator, condition.value);
        });
      }

      // Применяем сортировку
      if (options.orderBy) {
        query = query.order(options.orderBy.column, {
          ascending: options.orderBy.ascending,
        });
      }

      // Применяем пагинацию
      if (options.offset !== undefined && options.limit !== undefined) {
        query = query.range(options.offset, options.offset + options.limit - 1);
      } else if (options.limit !== undefined) {
        query = query.limit(options.limit);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error(`[DB] Error in find (${table}):`, error);
        return { data: [], error: error.message, count: null };
      }

      return {
        data: (data as T[]) || [],
        error: null,
        count: count || null,
      };
    } catch (error: any) {
      console.error(`[DB] Exception in find (${table}):`, error);
      return {
        data: [],
        error: error.message || 'Unknown error',
        count: null,
      };
    }
  }

  async findOne<T>(table: string, id: string): Promise<T | null> {
    try {
      const { data, error } = await this.client
        .from(table)
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error(`[DB] Error in findOne (${table}):`, error);
        return null;
      }

      return data as T;
    } catch (error: any) {
      console.error(`[DB] Exception in findOne (${table}):`, error);
      return null;
    }
  }

  async findOneBy<T>(table: string, column: string, value: any): Promise<T | null> {
    try {
      const { data, error } = await this.client
        .from(table)
        .select('*')
        .eq(column, value)
        .maybeSingle();

      if (error) {
        console.error(`[DB] Error in findOneBy (${table}.${column}):`, error);
        return null;
      }

      return data as T;
    } catch (error: any) {
      console.error(`[DB] Exception in findOneBy (${table}.${column}):`, error);
      return null;
    }
  }

  async create<T>(table: string, data: Partial<T>): Promise<T> {
    try {
      const { data: result, error } = await this.client
        .from(table)
        .insert(data)
        .select()
        .single();

      if (error) {
        console.error(`[DB] Error in create (${table}):`, error);
        throw new Error(error.message);
      }

      return result as T;
    } catch (error: any) {
      console.error(`[DB] Exception in create (${table}):`, error);
      throw error;
    }
  }

  async update<T>(table: string, id: string, data: Partial<T>): Promise<T> {
    try {
      const { data: result, error } = await this.client
        .from(table)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error(`[DB] Error in update (${table}):`, error);
        throw new Error(error.message);
      }

      return result as T;
    } catch (error: any) {
      console.error(`[DB] Exception in update (${table}):`, error);
      throw error;
    }
  }

  async delete(table: string, id: string): Promise<boolean> {
    try {
      const { error } = await this.client
        .from(table)
        .delete()
        .eq('id', id);

      if (error) {
        console.error(`[DB] Error in delete (${table}):`, error);
        return false;
      }

      return true;
    } catch (error: any) {
      console.error(`[DB] Exception in delete (${table}):`, error);
      return false;
    }
  }

  async callFunction<T>(functionName: string, params?: any): Promise<T> {
    try {
      const { data, error } = await this.client.rpc(functionName, params);

      if (error) {
        console.error(`[DB] Error calling function ${functionName}:`, error);
        throw new Error(error.message);
      }

      return data as T;
    } catch (error: any) {
      console.error(`[DB] Exception calling function ${functionName}:`, error);
      throw error;
    }
  }
}

// ==================== ФАБРИКА ====================
function createDatabaseClient(): IDatabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env'
    );
  }

  console.log('[DB] Initializing Supabase client');
  console.log('[DB] URL:', url.substring(0, 30) + '...');
  console.log('[DB] Key:', '***' + key.slice(-8));

  return new SupabaseDatabaseClient(url, key);
}

// ==================== ЭКСПОРТ ====================
export const db = createDatabaseClient();
export default db;