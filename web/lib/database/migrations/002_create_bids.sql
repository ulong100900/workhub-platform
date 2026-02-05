-- Создание таблицы заявок (откликов на заказы)
CREATE TABLE IF NOT EXISTS bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  freelancer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  proposal TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  delivery_days INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  -- Статусы: pending, accepted, rejected, withdrawn
  
  -- Дополнительные предложения
  attachments TEXT[], -- Массив ссылок на файлы
  milestones JSONB, -- План по этапам
  
  -- Рейтинг и отзывы (после выполнения)
  client_rating INTEGER CHECK (client_rating >= 1 AND client_rating <= 5),
  client_feedback TEXT,
  freelancer_rating INTEGER CHECK (freelancer_rating >= 1 AND freelancer_rating <= 5),
  freelancer_feedback TEXT,
  
  -- Таймстампы
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Индексы для быстрого поиска
  UNIQUE(order_id, freelancer_id), -- Один фрилансер может подать только одну заявку на заказ
  INDEX idx_bids_order_id (order_id),
  INDEX idx_bids_freelancer_id (freelancer_id),
  INDEX idx_bids_status (status),
  INDEX idx_bids_created_at (created_at DESC)
);

-- Триггер для обновления updated_at
CREATE TRIGGER update_bids_updated_at 
  BEFORE UPDATE ON bids 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Создание таблицы чата по заявкам
CREATE TABLE IF NOT EXISTS bid_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_id UUID NOT NULL REFERENCES bids(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  attachments TEXT[],
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_bid_messages_bid_id (bid_id),
  INDEX idx_bid_messages_sender_id (sender_id),
  INDEX idx_bid_messages_created_at (created_at)
);