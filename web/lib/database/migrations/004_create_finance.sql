-- Создание таблицы транзакций
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  -- Типы: deposit (пополнение), withdrawal (вывод), payment (оплата заказа),
  --       refund (возврат), commission (комиссия), bonus (бонус)
  
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'RUB',
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  -- Статусы: pending, processing, completed, failed, cancelled
  
  description TEXT,
  metadata JSONB, -- Дополнительные данные в формате JSON
  
  -- Ссылки на связанные сущности
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  bid_id UUID REFERENCES bids(id) ON DELETE SET NULL,
  
  -- Платежная информация
  payment_method VARCHAR(100),
  payment_id VARCHAR(255), -- ID платежа во внешней системе
  payment_provider VARCHAR(50), -- ЮKassa, Tinkoff, Stripe и т.д.
  
  -- Информация о выводе
  withdrawal_method VARCHAR(50), -- bank_card, bank_account, yoomoney, qiwi
  withdrawal_details JSONB, -- Реквизиты для вывода
  
  -- Таймстампы
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Индексы
  INDEX idx_transactions_user_id (user_id),
  INDEX idx_transactions_type (type),
  INDEX idx_transactions_status (status),
  INDEX idx_transactions_created_at (created_at DESC),
  INDEX idx_transactions_payment_id (payment_id)
);

-- Триггер для обновления updated_at
CREATE TRIGGER update_transactions_updated_at 
  BEFORE UPDATE ON transactions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Создание таблицы балансов пользователей
CREATE TABLE IF NOT EXISTS user_balances (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance DECIMAL(10, 2) DEFAULT 0.00,
  frozen_balance DECIMAL(10, 2) DEFAULT 0.00, -- Замороженные средства (в работе)
  total_earned DECIMAL(10, 2) DEFAULT 0.00,
  total_withdrawn DECIMAL(10, 2) DEFAULT 0.00,
  
  -- Настройки выплат
  default_withdrawal_method VARCHAR(50),
  withdrawal_details JSONB,
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_user_balances_user_id (user_id),
  INDEX idx_user_balances_balance (balance DESC)
);

-- Триггер для создания записи баланса при регистрации
CREATE OR REPLACE FUNCTION create_user_balance()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_balances (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_user_balance_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_balance();

-- Создание таблицы счетов
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  bid_id UUID NOT NULL REFERENCES bids(id) ON DELETE CASCADE,
  
  amount DECIMAL(10, 2) NOT NULL,
  commission DECIMAL(10, 2) NOT NULL, -- Комиссия платформы
  net_amount DECIMAL(10, 2) NOT NULL, -- Сумма к выплате фрилансеру
  
  status VARCHAR(50) DEFAULT 'pending',
  -- Статусы: pending, paid, cancelled, disputed
  
  due_date DATE,
  paid_at TIMESTAMP WITH TIME ZONE,
  
  -- Таймстампы
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Индексы
  INDEX idx_invoices_user_id (user_id),
  INDEX idx_invoices_order_id (order_id),
  INDEX idx_invoices_status (status),
  INDEX idx_invoices_due_date (due_date)
);

-- Триггер для обновления updated_at
CREATE TRIGGER update_invoices_updated_at 
  BEFORE UPDATE ON invoices 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Создание таблицы комиссий
CREATE TABLE IF NOT EXISTS commission_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_type VARCHAR(50) NOT NULL, -- freelancer, client
  min_amount DECIMAL(10, 2),
  max_amount DECIMAL(10, 2),
  rate DECIMAL(5, 2) NOT NULL, -- Процент комиссии
  fixed_fee DECIMAL(10, 2), -- Фиксированная комиссия
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_commission_rates_user_type (user_type),
  INDEX idx_commission_rates_is_active (is_active)
);

-- Вставка стандартных ставок комиссии
INSERT INTO commission_rates (user_type, min_amount, max_amount, rate, fixed_fee) VALUES
  ('freelancer', 0, 10000, 10.00, 0),
  ('freelancer', 10000, 50000, 8.00, 0),
  ('freelancer', 50000, NULL, 5.00, 0),
  ('client', NULL, NULL, 0, 0); -- Клиенты не платят комиссию

-- Создание таблицы промо-акций и скидок
CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  type VARCHAR(50) NOT NULL, -- percentage, fixed, first_order
  value DECIMAL(10, 2) NOT NULL, -- Значение скидки (процент или фиксированная сумма)
  min_order_amount DECIMAL(10, 2), -- Минимальная сумма заказа
  max_discount DECIMAL(10, 2), -- Максимальная сумма скидки
  
  usage_limit INTEGER, -- Лимит использований
  used_count INTEGER DEFAULT 0,
  
  valid_from DATE NOT NULL,
  valid_until DATE,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_promotions_code (code),
  INDEX idx_promotions_is_active (is_active),
  INDEX idx_promotions_valid_until (valid_until)
);

-- Создание таблицы использования промокодов
CREATE TABLE IF NOT EXISTS promo_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  
  discount_amount DECIMAL(10, 2) NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_promo_usage_user_id (user_id),
  INDEX idx_promo_usage_promotion_id (promotion_id),
  INDEX idx_promo_usage_order_id (order_id)
);