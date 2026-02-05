-- Создание таблицы заказов
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  freelancer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category_id UUID REFERENCES categories(id),
  budget DECIMAL(10, 2) NOT NULL,
  deadline DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'open',
  -- Статусы: open, in_progress, completed, cancelled, disputed
  
  -- Детали проекта
  skills TEXT[], -- Массив требуемых навыков
  attachments TEXT[], -- Массив ссылок на файлы
  is_urgent BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  
  -- Местоположение
  location_type VARCHAR(50) DEFAULT 'remote', -- remote, onsite, hybrid
  location_city VARCHAR(100),
  location_country VARCHAR(100),
  
  -- Таймстампы
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Индексы для быстрого поиска
  INDEX idx_orders_client_id (client_id),
  INDEX idx_orders_freelancer_id (freelancer_id),
  INDEX idx_orders_status (status),
  INDEX idx_orders_category_id (category_id),
  INDEX idx_orders_created_at (created_at DESC)
);

-- Триггер для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_orders_updated_at 
  BEFORE UPDATE ON orders 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Создание таблицы категорий
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50),
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Вставка основных категорий
INSERT INTO categories (name, slug, description, icon, order_index) VALUES
  ('Веб-разработка', 'web-development', 'Создание и поддержка веб-сайтов', 'Globe', 1),
  ('Дизайн', 'design', 'UI/UX, графика, логотипы', 'Palette', 2),
  ('Маркетинг', 'marketing', 'SEO, SMM, контент-маркетинг', 'TrendingUp', 3),
  ('Тексты и переводы', 'writing-translation', 'Копирайтинг, переводы, редактирование', 'FileText', 4),
  ('Видео и анимация', 'video-animation', 'Монтаж, анимация, видеопроизводство', 'Video', 5),
  ('Бизнес и консалтинг', 'business-consulting', 'Аналитика, стратегия, консультации', 'Briefcase', 6),
  ('IT и программирование', 'it-programming', 'Разработка ПО, мобильные приложения', 'Code', 7),
  ('Мобильные приложения', 'mobile-apps', 'iOS, Android разработка', 'Smartphone', 8),
  ('Администрирование', 'administration', 'Поддержка, администрирование', 'Settings', 9),
  ('Музыка и аудио', 'music-audio', 'Создание музыки, звуковой дизайн', 'Music', 10);