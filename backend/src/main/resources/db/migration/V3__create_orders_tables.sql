-- =====================================================
-- Script de Migración: Sistema POS - Órdenes de Venta
-- =====================================================
-- Este script crea las tablas necesarias para el módulo POS
-- Ejecutar este script en tu base de datos PostgreSQL/MySQL

-- =====================================================
-- Tabla: orders (Órdenes de Venta)
-- =====================================================
CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    customer_id BIGINT,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    subtotal DECIMAL(15,2) NOT NULL,
    tax DECIMAL(15,2) DEFAULT 0,
    discount DECIMAL(15,2) DEFAULT 0,
    total DECIMAL(15,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
    created_by BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar performance
CREATE INDEX idx_orders_tenant ON orders(tenant_id);
CREATE INDEX idx_orders_invoice ON orders(invoice_number);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_status ON orders(status);

-- =====================================================
-- Tabla: order_items (Items de Orden)
-- =====================================================
CREATE TABLE IF NOT EXISTS order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    sku VARCHAR(100),
    barcode VARCHAR(100),
    unit_price DECIMAL(15,2) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    discount DECIMAL(15,2) DEFAULT 0,
    subtotal DECIMAL(15,2) NOT NULL,
    CONSTRAINT fk_order_item_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_order_item_product FOREIGN KEY (product_id) REFERENCES productos(id)
);

-- Índices
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- =====================================================
-- Comentarios en las tablas
-- =====================================================
COMMENT ON TABLE orders IS 'Órdenes de venta del sistema POS';
COMMENT ON TABLE order_items IS 'Items individuales de cada orden de venta';

COMMENT ON COLUMN orders.tenant_id IS 'ID del tenant (multi-tenancy)';
COMMENT ON COLUMN orders.invoice_number IS 'Número único de factura generado automáticamente';
COMMENT ON COLUMN orders.payment_method IS 'Método de pago: CASH, CREDIT_CARD, DEBIT_CARD, TRANSFER';
COMMENT ON COLUMN orders.status IS 'Estado: COMPLETED, PENDING, CANCELLED';

COMMENT ON COLUMN order_items.product_name IS 'Snapshot del nombre del producto al momento de la venta';
COMMENT ON COLUMN order_items.unit_price IS 'Snapshot del precio al momento de la venta';

-- =====================================================
-- Datos de ejemplo (opcional - comentar si no deseas)
-- =====================================================
-- Uncomment para insertar datos de prueba
/*
INSERT INTO orders (tenant_id, invoice_number, subtotal, tax, discount, total, payment_method, status, created_by)
VALUES (1, 'INV-1-20231129-00001', 100.00, 0.00, 0.00, 100.00, 'CASH', 'COMPLETED', 1);

INSERT INTO order_items (order_id, product_id, product_name, sku, barcode, unit_price, quantity, discount, subtotal)
VALUES (1, 1, 'Producto de Prueba', 'TEST-001', '123456789', 50.00, 2, 0.00, 100.00);
*/

-- =====================================================
-- Verificación
-- =====================================================
SELECT 'Tabla orders creada exitosamente' as status;
SELECT 'Tabla order_items creada exitosamente' as status;
