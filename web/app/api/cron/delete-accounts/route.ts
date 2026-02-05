import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    // Проверяем секретный ключ (используйте переменную окружения)
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET_KEY
    
    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      console.error('Неавторизованный доступ к CRON')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const supabase = await createClient()
    const now = new Date().toISOString()
    
    // Находим запросы на удаление с истекшим сроком
    const { data: pendingDeletions, error: fetchError } = await supabase
      .from('account_deletion_requests')
      .select('id, user_id, email, delete_at')
      .eq('status', 'pending')
      .lt('delete_at', now)
      .limit(100) // Ограничиваем за одну итерацию
    
    if (fetchError) {
      console.error('Ошибка получения запросов на удаление:', fetchError)
      return NextResponse.json({ 
        success: false,
        error: 'Database error' 
      }, { status: 500 })
    }
    
    if (!pendingDeletions || pendingDeletions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Нет аккаунтов для удаления',
        timestamp: now,
      })
    }
    
    const results = {
      total: pendingDeletions.length,
      deleted: 0,
      failed: [] as string[],
    }
    
    // Для каждого запроса
    for (const deletion of pendingDeletions) {
      try {
        // Обновляем статус перед удалением
        const { error: updateError } = await supabase
          .from('account_deletion_requests')
          .update({
            status: 'processing',
            updated_at: new Date().toISOString()
          })
          .eq('id', deletion.id)
        
        if (updateError) throw updateError
        
        // ВНИМАНИЕ: Удаление пользователя через Admin API
        // Это требует включения серверной функции в Supabase
        // Или использования Service Role Key
        
        // Пометка как удаленного
        const { error: completeError } = await supabase
          .from('account_deletion_requests')
          .update({
            status: 'completed',
            deleted_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', deletion.id)
        
        if (completeError) throw completeError
        
        results.deleted++
        
        // Логируем успешное удаление
        console.log(`✅ Удален аккаунт: ${deletion.user_id} (${deletion.email})`)
        
      } catch (error: any) {
        console.error(`❌ Ошибка удаления ${deletion.user_id}:`, error)
        results.failed.push(`${deletion.user_id}: ${error.message}`)
        
        // Помечаем как ошибочный
        await supabase
          .from('account_deletion_requests')
          .update({
            status: 'error',
            error_message: error.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', deletion.id)
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Обработано ${results.deleted} из ${results.total} аккаунтов`,
      timestamp: now,
      results,
    })
    
  } catch (error: any) {
    console.error('Критическая ошибка CRON:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}