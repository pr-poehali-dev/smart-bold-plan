
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  phone VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sessions (
  id VARCHAR(64) PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '30 days'
);

CREATE TABLE services (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(100) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price_from INTEGER NOT NULL,
  category VARCHAR(100) NOT NULL
);

CREATE TABLE cart_items (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  service_id INTEGER REFERENCES services(id),
  quantity INTEGER DEFAULT 1,
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, service_id)
);

CREATE TABLE favorites (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  service_id INTEGER REFERENCES services(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, service_id)
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  total_amount INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  payment_id VARCHAR(255),
  payment_status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id),
  service_id INTEGER REFERENCES services(id),
  title VARCHAR(255) NOT NULL,
  price INTEGER NOT NULL,
  quantity INTEGER DEFAULT 1
);

INSERT INTO services (slug, title, description, price_from, category) VALUES
  ('fdm', 'FDM-печать', 'Послойная печать пластиком', 299, 'printing'),
  ('sla', 'Фотополимер (SLA)', 'Высокая точность и гладкая поверхность', 599, 'printing'),
  ('modeling-small', 'Моделирование: малый объект', 'Небольшие детали до 10 см', 599, 'modeling'),
  ('modeling-medium', 'Моделирование: средний объект', 'Детали от 10 до 30 см', 899, 'modeling'),
  ('modeling-large', 'Моделирование: крупный объект', 'Сложные детали и сборки от 30 см', 1499, 'modeling');
