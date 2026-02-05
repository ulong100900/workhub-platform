-- Создание таблицы уведомлений
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  -- Типы: new_bid, bid_accepted, bid_rejected, new_message, payment_received, 
  --       deadline_reminder, order_completed, system_alert
  
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB, -- Дополнительные данные в формате JSON
  
  is_read BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  
  -- Ссылки на связанные сущности
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  bid_id UUID REFERENCES bids(id) ON DELETE CASCADE,
  message_id UUID REFERENCES bid_messages(id) ON DELETE CASCADE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Индексы
  INDEX idx_notifications_user_id (user_id),
  INDEX idx_notifications_is_read (is_read),
  INDEX idx_notifications_created_at (created_at DESC),
  INDEX idx_notifications_type (type)
);

-- Создание таблицы настроек уведомлений пользователей
CREATE TABLE IF NOT EXISTS notification_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Email уведомления
  email_new_bids BOOLEAN DEFAULT true,
  email_bid_updates BOOLEAN DEFAULT true,
  email_messages BOOLEAN DEFAULT true,
  email_payments BOOLEAN DEFAULT true,
  email_system BOOLEAN DEFAULT true,
  
  -- Push уведомления
  push_new_bids BOOLEAN DEFAULT true,
  push_bid_updates BOOLEAN DEFAULT true,
  push_messages BOOLEAN DEFAULT true,
  push_payments BOOLEAN DEFAULT true,
  push_system BOOLEAN DEFAULT true,
  
  -- Настройки времени
  mute_until TIMESTAMP WITH TIME ZONE,
  daily_digest BOOLEAN DEFAULT true,
  digest_time TIME DEFAULT '18:00:00',
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_notification_settings_user_id (user_id)
);