-- ====================================================
-- V12: Actualización del módulo de Recursos Humanos
-- Agrega campos para Colombia y configuración de nómina
-- ====================================================

-- Agregar campos de seguridad social Colombia a empleados
ALTER TABLE employees ADD COLUMN IF NOT EXISTS nss VARCHAR(15);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS eps VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS arl VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS afp VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS cesantias_box VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS salary_type VARCHAR(20) DEFAULT 'ORDINARIO';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS has_transport_allowance BOOLEAN DEFAULT TRUE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS contract_type_enum VARCHAR(30);

-- Crear tabla de configuración de nómina si no existe
CREATE TABLE IF NOT EXISTS payroll_configuration (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL UNIQUE,
    
    -- Prestaciones
    aguinaldo_days INTEGER DEFAULT 15,
    vacation_days_per_year INTEGER DEFAULT 15,
    vacation_premium_percentage DECIMAL(5,2) DEFAULT 25.00,
    
    -- Impuestos
    apply_isr BOOLEAN DEFAULT TRUE,
    apply_imss BOOLEAN DEFAULT TRUE,
    imss_worker_percentage DECIMAL(5,2) DEFAULT 4.00,
    imss_employer_percentage DECIMAL(5,2) DEFAULT 12.00,
    
    -- Salarios referencia
    minimum_wage DECIMAL(12,2) DEFAULT 1300000.00,
    uma_value DECIMAL(12,2) DEFAULT 47065.00,
    
    -- Timbrado CFDI
    enable_cfdi_timbrado BOOLEAN DEFAULT FALSE,
    pac_provider VARCHAR(50),
    pac_api_key VARCHAR(255),
    pac_api_url VARCHAR(255),
    
    -- Banco
    bank_layout_format VARCHAR(50) DEFAULT 'STANDARD',
    
    -- Contabilidad
    enable_accounting_integration BOOLEAN DEFAULT TRUE,
    payroll_expense_account VARCHAR(20),
    taxes_payable_account VARCHAR(20),
    salaries_payable_account VARCHAR(20),
    
    -- Notificaciones
    send_receipts_by_email BOOLEAN DEFAULT TRUE,
    send_receipts_by_whatsapp BOOLEAN DEFAULT FALSE,
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_payroll_config_customer 
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Índice para búsqueda por customer
CREATE INDEX IF NOT EXISTS idx_payroll_config_customer ON payroll_configuration(customer_id);

-- Comentarios
COMMENT ON TABLE payroll_configuration IS 'Configuración de nómina por tenant';
COMMENT ON COLUMN payroll_configuration.aguinaldo_days IS 'Días de aguinaldo (México: min 15)';
COMMENT ON COLUMN payroll_configuration.vacation_days_per_year IS 'Días de vacaciones por año';
COMMENT ON COLUMN payroll_configuration.minimum_wage IS 'Salario mínimo vigente (Colombia: SMMLV)';
COMMENT ON COLUMN payroll_configuration.uma_value IS 'UMA México / UVT Colombia';
COMMENT ON COLUMN employees.eps IS 'EPS - Entidad Promotora de Salud (Colombia)';
COMMENT ON COLUMN employees.arl IS 'ARL - Administradora de Riesgos Laborales (Colombia)';
COMMENT ON COLUMN employees.afp IS 'AFP - Fondo de Pensiones (Colombia)';
COMMENT ON COLUMN employees.cesantias_box IS 'Caja de Cesantías (Colombia)';
COMMENT ON COLUMN employees.salary_type IS 'Tipo de salario: ORDINARIO o INTEGRAL';
COMMENT ON COLUMN employees.has_transport_allowance IS 'Si aplica auxilio de transporte';
