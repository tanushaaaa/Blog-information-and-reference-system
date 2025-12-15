-- Создание базы данных для информационно-справочной системы блогов
-- PostgreSQL

-- Удаление существующих таблиц (если нужно пересоздать)
DROP TABLE IF EXISTS blogs CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Создание типа для роли пользователя
DROP TYPE IF EXISTS user_role;
CREATE TYPE user_role AS ENUM ('USER', 'ADMIN');

-- Таблица пользователей
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание индекса для email
CREATE INDEX idx_email ON users(email);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер для автоматического обновления updated_at в таблице users
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Таблица категорий блогов
CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица блогов
CREATE TABLE blogs (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    image_url VARCHAR(500),
    category_id BIGINT,
    author_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    views_count INTEGER DEFAULT 0,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Создание индексов для таблицы blogs
CREATE INDEX idx_category ON blogs(category_id);
CREATE INDEX idx_author ON blogs(author_id);
CREATE INDEX idx_created_at ON blogs(created_at);
CREATE INDEX idx_title ON blogs(title);

-- Триггер для автоматического обновления updated_at в таблице blogs
CREATE TRIGGER update_blogs_updated_at BEFORE UPDATE ON blogs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Вставка начальных данных (категории)
INSERT INTO categories (name, slug, description) VALUES
    ('Технологии', 'tech', 'Блоги о технологиях, программировании и IT'),
    ('Образ жизни', 'lifestyle', 'Блоги о здоровом образе жизни, саморазвитии'),
    ('Путешествия', 'travel', 'Блоги о путешествиях и туризме'),
    ('Еда', 'food', 'Блоги о кулинарии и рецептах'),
    ('Образование', 'education', 'Блоги об образовании и обучении'),
    ('Дизайн', 'design', 'Блоги о дизайне и визуальном искусстве'),
    ('Бизнес', 'business', 'Блоги о бизнесе и предпринимательстве');

-- Вставка тестового администратора
-- Пароль "admin123" хеширован через BCrypt
INSERT INTO users (name, email, password, role) VALUES
    ('Администратор', 'admin@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'ADMIN');

-- Вставка тестовых пользователей
-- Пароль "user123" хеширован через BCrypt
INSERT INTO users (name, email, password, role) VALUES
    ('Иван Иванов', 'ivan@example.com', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HHFxG9B0F4a0YPM3hm7hu', 'USER'),
    ('Мария Петрова', 'maria@example.com', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HHFxG9B0F4a0YPM3hm7hu', 'USER'),
    ('Алексей Сидоров', 'alex@example.com', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HHFxG9B0F4a0YPM3hm7hu', 'USER');

-- Вставка реальных блогов
INSERT INTO blogs (title, content, excerpt, image_url, category_id, author_id, views_count) VALUES
    ('Искусственный интеллект в 2025: новые возможности и вызовы', 
     'Искусственный интеллект продолжает трансформировать наш мир. В 2025 году мы видим беспрецедентный рост возможностей ИИ в различных сферах: от здравоохранения до образования, от бизнеса до развлечений. ChatGPT, Midjourney, и другие инструменты стали неотъемлемой частью нашей повседневной жизни. Однако вместе с возможностями возникают и новые вызовы: вопросы этики, приватности данных, и влияние на рынок труда.',
     'Обзор последних достижений в области искусственного интеллекта и их влияние на различные сферы жизни в 2025 году.',
     'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
     1, 1, 1250),
    
    ('Здоровый образ жизни: простые шаги к лучшему самочувствию', 
     'Здоровый образ жизни - это не просто модная тенденция, это инвестиция в ваше будущее. Начните с малого: добавьте 30 минут физической активности в день, пейте больше воды, и старайтесь спать не менее 7-8 часов. Питание играет ключевую роль - включите в рацион больше овощей, фруктов, цельнозерновых продуктов.',
     'Практические советы по формированию здоровых привычек для улучшения физического и ментального здоровья.',
     'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800',
     2, 2, 890),
    
    ('Топ-10 направлений для путешествий в 2025 году', 
     '2025 год открывает новые возможности для путешественников. Япония остается популярным направлением благодаря уникальному сочетанию традиций и современных технологий. Исландия привлекает любителей северного сияния и природных чудес. Португалия предлагает отличное соотношение цены и качества, красивые пляжи и богатую культуру.',
     'Обзор самых интересных и доступных направлений для путешествий в 2025 году с практическими советами.',
     'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800',
     3, 3, 2100),
    
    ('Рецепты здорового питания: вкусно и полезно', 
     'Здоровое питание не означает отказ от вкусной еды. Начните день с питательного завтрака: овсянка с ягодами и орехами, или яичница с овощами. На обед попробуйте салат с курицей или рыбой, богатый белком и клетчаткой.',
     'Простые и вкусные рецепты для здорового питания, которые легко приготовить дома.',
     'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800',
     4, 2, 1560),
    
    ('Онлайн-образование: будущее обучения уже здесь', 
     'Онлайн-образование переживает настоящий бум. Платформы вроде Coursera, edX, Udemy предлагают тысячи курсов от ведущих университетов мира. Преимущества очевидны: гибкий график, доступность из любой точки мира, относительно низкая стоимость.',
     'Как эффективно использовать возможности онлайн-образования для профессионального и личностного роста.',
     'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800',
     5, 1, 980);
