// lib/db.ts
import { createClient } from '@/lib/supabase/server';

export async function getPushTokenByUserId(userId: string) {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('user_push_tokens')
      .select('push_token')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      console.error('Error fetching push token:', error);
      return null;
    }

    return data.push_token;
  } catch (error) {
    console.error('Error in getPushTokenByUserId:', error);
    return null;
  }
}

// Другие функции базы данных, если нужны...