-- Создание таблицы администраторов
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL, -- super_admin, admin, moderator, support
  permissions JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  
  -- Контактная информация
  phone VARCHAR(20),
  telegram VARCHAR(100),
  
  -- Настройки уведомлений
  email_notifications BOOLEAN DEFAULT true,
  telegram_notifications BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_admins_user_id (user_id),
  INDEX idx_admins_role (role),
  INDEX idx_admins_is_active (is_active)
);

-- Триггер для обновления updated_at
CREATE TRIGGER update_admins_updated_at 
  BEFORE UPDATE ON admins 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Создание таблицы действий администраторов (лог)
CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES admins(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  action_type VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50), -- user, order, review, bid, etc.
  entity_id UUID,
  
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_admin_actions_admin_id (admin_id),
  INDEX idx_admin_actions_user_id (user_id),
  INDEX idx_admin_actions_action_type (action_type),
  INDEX idx_admin_actions_created_at (created_at DESC)
);

-- Создание таблицы отчетов
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Что именно репортится
  entity_type VARCHAR(50) NOT NULL, -- user, review, order, bid, message
  entity_id UUID NOT NULL,
  
  -- Причина
  reason VARCHAR(100) NOT NULL,
  description TEXT,
  evidence TEXT[], -- Ссылки на скриншоты и другие доказательства
  
  -- Статус обработки
  status VARCHAR(50) DEFAULT 'pending', -- pending, reviewing, resolved, rejected
  priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
  
  -- Кто обработал
  assigned_to UUID REFERENCES admins(id),
  resolved_by UUID REFERENCES admins(id),
  resolution TEXT,
  
  -- Таймстампы
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  
  -- Индексы
  INDEX idx_reports_reporter_id (reporter_id),
  INDEX idx_reports_entity_type_entity_id (entity_type, entity_id),
  INDEX idx_reports_status (status),
  INDEX idx_reports_priority (priority),
  INDEX idx_reports_created_at (created_at DESC)
);

-- Триггер для обновления updated_at
CREATE TRIGGER update_reports_updated_at 
  BEFORE UPDATE ON reports 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Создание таблицы заморозки/блокировки пользователей
CREATE TABLE IF NOT EXISTS user_suspensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Тип блокировки
  suspension_type VARCHAR(50) NOT NULL, -- temporary, permanent, warning
  reason TEXT NOT NULL,
  
  -- Сроки
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ends_at TIMESTAMP WITH TIME ZONE,
  
  -- Действия при блокировке
  restrictions JSONB, -- Какие действия запрещены
  
  -- Кто заблокировал
  issued_by UUID NOT NULL REFERENCES admins(id),
  
  -- Статус
  is_active BOOLEAN DEFAULT true,
  revoked_by UUID REFERENCES admins(id),
  revoked_at TIMESTAMP WITH TIME ZONE,
  revocation_reason TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_user_suspensions_user_id (user_id),
  INDEX idx_user_suspensions_is_active (is_active),
  INDEX idx_user_suspensions_ends_at (ends_at)
);

-- Создание таблицы системных настроек
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(50) NOT NULL, -- general, finance, security, notifications
  value JSONB NOT NULL,
  data_type VARCHAR(20) NOT NULL, -- string, number, boolean, array, object
  description TEXT,
  
  is_public BOOLEAN DEFAULT false,
  is_editable BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES admins(id),
  
  INDEX idx_system_settings_key (key),
  INDEX idx_system_settings_category (category)
);

-- Триггер для обновления updated_at
CREATE TRIGGER update_system_settings_updated_at 
  BEFORE UPDATE ON system_settings 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Вставка основных системных настроек
INSERT INTO system_settings (key, category, value, data_type, description, is_public) VALUES
  -- Общие настройки
  ('site_name', 'general', '"WorkFinder"', 'string', 'Название сайта', true),
  ('site_description', 'general', '"Фриланс-биржа для поиска работы и исполнителей"', 'string', 'Описание сайта', true),
  ('site_url', 'general', '"https://workfinder.ru"', 'string', 'Основной URL сайта', true),
  ('support_email', 'general', '"support@workfinder.ru"', 'string', 'Email поддержки', true),
  ('support_phone', 'general', '"8-800-123-45-67"', 'string', 'Телефон поддержки', true),
  
  -- Финансовые настройки
  ('commission_rate_freelancer', 'finance', '{"min": 5, "max": 10, "default": 8}', 'object', 'Комиссия для фрилансеров (%)', false),
  ('commission_rate_client', 'finance', '{"min": 0, "max": 0, "default": 0}', 'object', 'Комиссия для клиентов (%)', false),
  ('min_withdrawal_amount', 'finance', '500', 'number', 'Минимальная сумма вывода (₽)', true),
  ('max_withdrawal_amount', 'finance', '1000000', 'number', 'Максимальная сумма вывода (₽)', true),
  ('withdrawal_processing_time', 'finance', '3', 'number', 'Время обработки вывода (дни)', true),
  
  -- Настройки безопасности
  ('max_login_attempts', 'security', '5', 'number', 'Максимальное количество попыток входа', false),
  ('session_duration', 'security', '30', 'number', 'Длительность сессии (дни)', false),
  ('require_email_verification', 'security', 'true', 'boolean', 'Требовать подтверждение email', false),
  ('require_phone_verification', 'security', 'false', 'boolean', 'Требовать подтверждение телефона', false),
  
  -- Настройки уведомлений
  ('email_notifications_enabled', 'notifications', 'true', 'boolean', 'Включить email уведомления', false),
  ('push_notifications_enabled', 'notifications', 'true', 'boolean', 'Включить push уведомления', false),
  ('telegram_notifications_enabled', 'notifications', 'false', 'boolean', 'Включить Telegram уведомления', false),
  
  -- Настройки модерации
  ('auto_moderate_reviews', 'moderation', 'true', 'boolean', 'Автоматическая модерация отзывов', false),
  ('review_moderation_threshold', 'moderation', '3', 'number', 'Порог для ручной модерации отзывов', false),
  ('max_reports_before_suspension', 'moderation', '5', 'number', 'Максимум жалоб до блокировки', false),
  
  -- Настройки SEO
  ('meta_title', 'seo', '"WorkFinder - Фриланс биржа"', 'string', 'Meta title', false),
  ('meta_description', 'seo', '"Найдите работу или исполнителя на WorkFinder"', 'string', 'Meta description', false),
  ('meta_keywords', 'seo', '["фриланс", "работа", "исполнитель", "заказ", "проект"]', 'array', 'Meta keywords', false);

-- Создание таблицы уведомлений администраторов
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  
  type VARCHAR(50) NOT NULL, -- new_report, new_user, system_alert, etc.
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  
  is_read BOOLEAN DEFAULT false,
  is_important BOOLEAN DEFAULT false,
  
  -- Ссылки на связанные сущности
  entity_type VARCHAR(50),
  entity_id UUID,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  
  INDEX idx_admin_notifications_admin_id (admin_id),
  INDEX idx_admin_notifications_is_read (is_read),
  INDEX idx_admin_notifications_created_at (created_at DESC)
);