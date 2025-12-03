-- Tabla de planes
CREATE TABLE IF NOT EXISTS plans (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    duration_days INT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de suscripciones
CREATE TABLE IF NOT EXISTS subscriptions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    plan_id BIGINT NOT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    is_auto_renew BOOLEAN DEFAULT false,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_dates ON subscriptions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_plans_active ON plans(is_active);

-- Insertar algunos planes de ejemplo
INSERT INTO plans (name, description, price, duration_days, is_active, created_at, updated_at) 
VALUES 
('Plan Básico', 'Acceso básico a todas las características', 9.99, 30, true, NOW(), NOW()),
('Plan Pro', 'Acceso profesional con soporte prioritario', 29.99, 30, true, NOW(), NOW()),
('Plan Enterprise', 'Acceso empresarial con funciones avanzadas', 99.99, 365, true, NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();
