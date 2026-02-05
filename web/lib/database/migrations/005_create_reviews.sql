-- Создание таблицы отзывов
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Кто оставил отзыв
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewer_type VARCHAR(20) NOT NULL, -- client или freelancer
  
  -- О ком отзыв
  reviewed_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewed_user_type VARCHAR(20) NOT NULL, -- client или freelancer
  
  -- Оценки
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  deadline_rating INTEGER CHECK (deadline_rating >= 1 AND deadline_rating <= 5),
  
  -- Текст отзыва
  title VARCHAR(255),
  comment TEXT,
  
  -- Ответ на отзыв
  reply TEXT,
  replied_at TIMESTAMP WITH TIME ZONE,
  
  -- Модерация
  is_verified BOOLEAN DEFAULT false, -- Подтвержден ли заказ
  is_published BOOLEAN DEFAULT true,
  is_edited BOOLEAN DEFAULT false,
  
  -- Таймстампы
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Индексы
  UNIQUE(order_id, reviewer_id), -- Один отзыв на заказ от каждого участника
  INDEX idx_reviews_reviewed_user_id (reviewed_user_id),
  INDEX idx_reviews_reviewer_id (reviewer_id),
  INDEX idx_reviews_order_id (order_id),
  INDEX idx_reviews_rating (rating),
  INDEX idx_reviews_created_at (created_at DESC)
);

-- Триггер для обновления updated_at
CREATE TRIGGER update_reviews_updated_at 
  BEFORE UPDATE ON reviews 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Создание таблицы статистики рейтингов пользователей
CREATE TABLE IF NOT EXISTS user_ratings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Основной рейтинг
  average_rating DECIMAL(3,2) DEFAULT 0.00,
  total_reviews INTEGER DEFAULT 0,
  
  -- Детализация по категориям
  quality_avg DECIMAL(3,2) DEFAULT 0.00,
  communication_avg DECIMAL(3,2) DEFAULT 0.00,
  deadline_avg DECIMAL(3,2) DEFAULT 0.00,
  
  -- Распределение по звездам
  star_5 INTEGER DEFAULT 0,
  star_4 INTEGER DEFAULT 0,
  star_3 INTEGER DEFAULT 0,
  star_2 INTEGER DEFAULT 0,
  star_1 INTEGER DEFAULT 0,
  
  -- Дополнительная статистика
  last_review_at TIMESTAMP WITH TIME ZONE,
  positive_percentage DECIMAL(5,2) DEFAULT 0.00,
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_user_ratings_average_rating (average_rating DESC),
  INDEX idx_user_ratings_total_reviews (total_reviews DESC)
);

-- Функция для обновления статистики рейтингов
CREATE OR REPLACE FUNCTION update_user_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Обновляем статистику для reviewed_user_id
  WITH rating_stats AS (
    SELECT 
      reviewed_user_id,
      COUNT(*) as total_reviews,
      AVG(rating::DECIMAL) as average_rating,
      AVG(quality_rating::DECIMAL) as quality_avg,
      AVG(communication_rating::DECIMAL) as communication_avg,
      AVG(deadline_rating::DECIMAL) as deadline_avg,
      COUNT(CASE WHEN rating = 5 THEN 1 END) as star_5,
      COUNT(CASE WHEN rating = 4 THEN 1 END) as star_4,
      COUNT(CASE WHEN rating = 3 THEN 1 END) as star_3,
      COUNT(CASE WHEN rating = 2 THEN 1 END) as star_2,
      COUNT(CASE WHEN rating = 1 THEN 1 END) as star_1,
      MAX(created_at) as last_review_at,
      (COUNT(CASE WHEN rating >= 4 THEN 1 END) * 100.0 / COUNT(*)) as positive_percentage
    FROM reviews
    WHERE reviewed_user_id = NEW.reviewed_user_id
      AND is_published = true
    GROUP BY reviewed_user_id
  )
  INSERT INTO user_ratings (
    user_id,
    average_rating,
    total_reviews,
    quality_avg,
    communication_avg,
    deadline_avg,
    star_5,
    star_4,
    star_3,
    star_2,
    star_1,
    last_review_at,
    positive_percentage,
    updated_at
  )
  SELECT 
    reviewed_user_id,
    COALESCE(average_rating, 0),
    COALESCE(total_reviews, 0),
    COALESCE(quality_avg, 0),
    COALESCE(communication_avg, 0),
    COALESCE(deadline_avg, 0),
    COALESCE(star_5, 0),
    COALESCE(star_4, 0),
    COALESCE(star_3, 0),
    COALESCE(star_2, 0),
    COALESCE(star_1, 0),
    last_review_at,
    COALESCE(positive_percentage, 0),
    NOW()
  FROM rating_stats
  ON CONFLICT (user_id) 
  DO UPDATE SET
    average_rating = EXCLUDED.average_rating,
    total_reviews = EXCLUDED.total_reviews,
    quality_avg = EXCLUDED.quality_avg,
    communication_avg = EXCLUDED.communication_avg,
    deadline_avg = EXCLUDED.deadline_avg,
    star_5 = EXCLUDED.star_5,
    star_4 = EXCLUDED.star_4,
    star_3 = EXCLUDED.star_3,
    star_2 = EXCLUDED.star_2,
    star_1 = EXCLUDED.star_1,
    last_review_at = EXCLUDED.last_review_at,
    positive_percentage = EXCLUDED.positive_percentage,
    updated_at = EXCLUDED.updated_at;
    
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггеры для автоматического обновления статистики
CREATE TRIGGER update_rating_stats_on_insert
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_user_rating_stats();

CREATE TRIGGER update_rating_stats_on_update
  AFTER UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_user_rating_stats();

CREATE TRIGGER update_rating_stats_on_delete
  AFTER DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_user_rating_stats();

-- Создание таблицы жалоб на отзывы
CREATE TABLE IF NOT EXISTS review_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  reason VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- pending, reviewed, resolved, rejected
  
  admin_notes TEXT,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_review_reports_review_id (review_id),
  INDEX idx_review_reports_reporter_id (reporter_id),
  INDEX idx_review_reports_status (status)
);