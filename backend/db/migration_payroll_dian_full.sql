-- ============================================================================
-- MIGRACIÓN COMPLETA: Nómina Electrónica DIAN
-- Fecha: 2024-12-29
-- ============================================================================

USE cloudfly_erp;

-- 1. Actualizar Payroll Receipts (Tabla Padre)
ALTER TABLE payroll_receipts
    ADD COLUMN cune VARCHAR(500) COMMENT 'Código Único de Nómina Electrónica',
    ADD COLUMN consecutive BIGINT COMMENT 'Consecutivo interno DIAN',
    ADD COLUMN payroll_type VARCHAR(20) DEFAULT '102' COMMENT '102=Nómina Individual, 103=Nota Ajuste',
    ADD COLUMN payment_method VARCHAR(2) DEFAULT '1' COMMENT '1=Efectivo, 10=Cheque, 42=Consignación',
    ADD COLUMN dian_status VARCHAR(20) DEFAULT 'PENDING' COMMENT 'PENDING, SENT, ACCEPTED, REJECTED, ERROR',
    ADD COLUMN dian_message TEXT,
    ADD COLUMN xml_dian LONGBLOB,
    ADD COLUMN xml_response LONGBLOB,
    ADD COLUMN qr_code TEXT,
    ADD COLUMN sent_at DATETIME;

-- Eliminar columnas legacy (opcional, si estás seguro)
-- ALTER TABLE payroll_receipts DROP COLUMN uuid, DROP COLUMN xml_path;

-- 2. Crear Tabla de Totales (1 a 1 con Receipts)
CREATE TABLE IF NOT EXISTS payroll_totales (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    payroll_receipt_id BIGINT NOT NULL UNIQUE,
    devengado_total DECIMAL(15,2),
    deduccion_total DECIMAL(15,2),
    comprobante_total DECIMAL(15,2), -- Neto
    sueldo_trabajado DECIMAL(15,2),
    auxilio_transporte DECIMAL(15,2),
    salud_total DECIMAL(15,2),
    pension_total DECIMAL(15,2),
    fondo_sp_total DECIMAL(15,2),
    total_provisiones DECIMAL(15,2),
    total_costo_empleador DECIMAL(15,2),
    FOREIGN KEY (payroll_receipt_id) REFERENCES payroll_receipts(id) ON DELETE CASCADE
);

-- 3. Crear Tabla Devengados (1 a N con Receipts)
CREATE TABLE IF NOT EXISTS payroll_devengados (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    payroll_receipt_id BIGINT NOT NULL,
    concept_id BIGINT,
    dian_code VARCHAR(50) NOT NULL, -- BASICO, HED, ETC
    description VARCHAR(255),
    amount DECIMAL(15,2) NOT NULL,
    quantity DECIMAL(10,2), -- Días u Horas
    percentage DECIMAL(5,2),
    start_date DATETIME,
    end_date DATETIME,
    is_salary BOOLEAN DEFAULT TRUE,
    payment_type VARCHAR(50),
    FOREIGN KEY (payroll_receipt_id) REFERENCES payroll_receipts(id) ON DELETE CASCADE,
    FOREIGN KEY (concept_id) REFERENCES payroll_concepts(id)
);

-- 4. Crear Tabla Deducciones (1 a N con Receipts)
CREATE TABLE IF NOT EXISTS payroll_deducciones (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    payroll_receipt_id BIGINT NOT NULL,
    concept_id BIGINT,
    dian_code VARCHAR(50) NOT NULL, -- SALUD, PENSION, ETC
    description VARCHAR(255),
    amount DECIMAL(15,2) NOT NULL,
    percentage DECIMAL(5,2),
    fund_name VARCHAR(200),
    FOREIGN KEY (payroll_receipt_id) REFERENCES payroll_receipts(id) ON DELETE CASCADE,
    FOREIGN KEY (concept_id) REFERENCES payroll_concepts(id)
);

-- 5. Actualizar Conceptos para incluir Código DIAN
-- Agregar columna si no existe
ALTER TABLE payroll_concepts ADD COLUMN IF NOT EXISTS dian_code VARCHAR(30);

-- Mapeo inicial de conceptos estándar
UPDATE payroll_concepts SET dian_code = 'BASICO' WHERE name LIKE '%Sueldo%' OR name LIKE '%Salario%';
UPDATE payroll_concepts SET dian_code = 'TRANSPORTE' WHERE name LIKE '%Transporte%';
UPDATE payroll_concepts SET dian_code = 'HED' WHERE name LIKE '%Extra Diurna%';
UPDATE payroll_concepts SET dian_code = 'HEN' WHERE name LIKE '%Extra Nocturna%';
UPDATE payroll_concepts SET dian_code = 'COMISION' WHERE name LIKE '%Comisi%';
UPDATE payroll_concepts SET dian_code = 'BONIFICACION' WHERE name LIKE '%Bono%';
