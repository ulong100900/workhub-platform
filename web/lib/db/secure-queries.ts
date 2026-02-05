import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Безопасные методы запросов
export class SecureQueryBuilder {
  
  // Безопасный поиск
  static async safeSearch(table: string, filters: Record<string, any>) {
    let query = supabase.from(table).select('*')
    
    for (const [key, value] of Object.entries(filters)) {
      // Используем параметризованные условия
      if (typeof value === 'string') {
        query = query.ilike(key, `%${this.escapeLike(value)}%`)
      } else {
        query = query.eq(key, value)
      }
    }
    
    return query
  }
  
  // Экранирование для LIKE запросов
  private static escapeLike(str: string): string {
    return str.replace(/[\\%_]/g, '\\$&')
  }
  
  // Безопасное создание записи
  static async safeInsert(table: string, data: Record<string, any>) {
    // Валидация типов данных
    const validatedData = this.validateDataTypes(data)
    
    return supabase.from(table).insert(validatedData)
  }
  
  // Валидация типов данных
  private static validateDataTypes(data: Record<string, any>): Record<string, any> {
    const validated: Record<string, any> = {}
    
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        // Обрезаем слишком длинные строки
        validated[key] = value.slice(0, 1000)
      } else if (typeof value === 'number') {
        // Проверяем на NaN и Infinity
        validated[key] = isFinite(value) ? value : 0
      } else if (value === null || value === undefined) {
        validated[key] = null
      } else {
        validated[key] = value
      }
    }
    
    return validated
  }
  
  // Безопасное выполнение raw SQL (если необходимо)
  static async safeRawSQL(query: string, params: any[] = []) {
    // Используем параметризованные запросы
    const { data, error } = await supabase.rpc('execute_safe_sql', {
      query,
      params: JSON.stringify(params)
    })
    
    if (error) throw error
    return data
  }
}

// Валидация входных параметров
export function validateInput(input: any, type: 'string' | 'number' | 'boolean' | 'uuid'): boolean {
  if (input === null || input === undefined) return false
  
  switch (type) {
    case 'string':
      return typeof input === 'string' && input.length <= 1000
    case 'number':
      return typeof input === 'number' && isFinite(input)
    case 'boolean':
      return typeof input === 'boolean'
    case 'uuid':
      return typeof input === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input)
    default:
      return false
  }
}

// SQL Injection detection
export function detectSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC|ALTER|CREATE|TRUNCATE)\b)/i,
    /(\b(OR|AND)\s+['"\d])/i,
    /(--|\#|\/\*)/,
    /(\b(WAITFOR|DELAY)\b)/i,
    /(\b(SLEEP|BENCHMARK)\b)/i,
  ]
  
  return sqlPatterns.some(pattern => pattern.test(input))
}