-- ============================================
-- MIGRACIÓN: Integración Contable
-- Fecha: 2025-12-11
-- Descripción: Agrega campos contables a Contact y crea tablas del módulo de contabilidad
-- ============================================

-- ============================================
-- PASO 1: Actualizar tabla contacts
-- ============================================

ALTER TABLE contacts 
ADD COLUMN document_type VARCHAR(20) COMMENT 'CC, NIT, CE, PASAPORTE',
ADD COLUMN document_number VARCHAR(20) COMMENT 'Número de documento sin DV',
ADD COLUMN verification_digit CHAR(1) COMMENT 'Dígito de verificación para NIT',
ADD COLUMN business_name VARCHAR(255) COMMENT 'Razón social (empresas)',
ADD COLUMN trade_name VARCHAR(255) COMMENT 'Nombre comercial',
ADD COLUMN first_name VARCHAR(100) COMMENT 'Primer nombre (personas)',
ADD COLUMN last_name VARCHAR(100) COMMENT 'Apellido',
ADD COLUMN mobile VARCHAR(20) COMMENT 'Celular',
ADD COLUMN city VARCHAR(100) COMMENT 'Ciudad',
ADD COLUMN department VARCHAR(100) COMMENT 'Departamento de Colombia',
ADD COLUMN country VARCHAR(50) DEFAULT 'Colombia' COMMENT 'País',
ADD COLUMN tax_regime VARCHAR(50) COMMENT 'SIMPLIFICADO, COMÚN, GRAN_CONTRIBUYENTE',
ADD COLUMN is_tax_responsible BOOLEAN DEFAULT FALSE COMMENT 'Responsable de IVA',
ADD COLUMN is_withholding_agent BOOLEAN DEFAULT FALSE COMMENT 'Agente de retención',
ADD COLUMN apply_withholding_tax BOOLEAN DEFAULT FALSE COMMENT 'Aplica retención en la fuente',
ADD COLUMN apply_vat_withholding BOOLEAN DEFAULT FALSE COMMENT 'Aplica ReteIVA',
ADD COLUMN apply_ica_withholding BOOLEAN DEFAULT FALSE COMMENT 'Aplica ReteICA',
ADD COLUMN custom_withholding_rate DECIMAL(5,2) COMMENT 'Porcentaje personalizado',
ADD COLUMN default_account_code VARCHAR(10) COMMENT 'Cuenta contable por defecto',
ADD COLUMN payment_terms_days INT DEFAULT 0 COMMENT 'Plazo de pago en días',
ADD COLUMN credit_limit DECIMAL(15,2) DEFAULT 0.0 COMMENT 'Límite de crédito',
ADD COLUMN current_balance DECIMAL(15,2) DEFAULT 0.0 COMMENT 'Saldo actual',
ADD COLUMN is_active BOOLEAN DEFAULT TRUE COMMENT 'Activo/Inactivo';

-- Índices para contacts
CREATE INDEX idx_contacts_document ON contacts(document_type, document_number);
CREATE INDEX idx_contacts_tax_regime ON contacts(tax_regime);
CREATE INDEX idx_contacts_active ON contacts(is_active);

-- ============================================
-- PASO 2: Crear tablas del módulo de contabilidad
-- ============================================

-- Tabla: Plan Único de Cuentas (PUC)
CREATE TABLE chart_of_accounts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(10) NOT NULL UNIQUE COMMENT 'Código PUC: 1105, 110505, etc.',
    name VARCHAR(255) NOT NULL COMMENT 'Nombre de la cuenta',
    account_type VARCHAR(50) COMMENT 'ACTIVO, PASIVO, PATRIMONIO, INGRESO, GASTO, COSTO',
    level INT COMMENT '1=Clase, 2=Grupo, 3=Cuenta, 4=Subcuenta',
    parent_code VARCHAR(10) COMMENT 'Código de la cuenta padre',
    nature VARCHAR(10) COMMENT 'DEBITO, CREDITO',
    requires_third_party BOOLEAN DEFAULT FALSE COMMENT 'Requiere tercero (cliente/proveedor)',
    requires_cost_center BOOLEAN DEFAULT FALSE COMMENT 'Requiere centro de costo',
    is_active BOOLEAN DEFAULT TRUE,
    is_system BOOLEAN DEFAULT FALSE COMMENT 'Cuenta del sistema, no se puede eliminar',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_parent (parent_code),
    INDEX idx_type (account_type),
    INDEX idx_level (level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Plan Único de Cuentas (PUC Colombia)';

-- Tabla: Centros de Costo
CREATE TABLE cost_centers (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(20) NOT NULL UNIQUE COMMENT 'Código del centro de costo',
    name VARCHAR(255) NOT NULL COMMENT 'Nombre del centro',
    description TEXT COMMENT 'Descripción',
    parent_id BIGINT COMMENT 'Centro padre (jerarquía)',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES cost_centers(id) ON DELETE SET NULL,
    INDEX idx_code (code),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Centros de Costo';

-- Tabla: Comprobantes Contables
CREATE TABLE accounting_vouchers (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    voucher_type VARCHAR(20) NOT NULL COMMENT 'INGRESO, EGRESO, NOTA_CONTABLE, APERTURA, CIERRE',
    voucher_number VARCHAR(20) NOT NULL COMMENT 'Consecutivo por tipo',
    date DATE NOT NULL COMMENT 'Fecha del comprobante',
    description TEXT COMMENT 'Descripción general',
    reference VARCHAR(100) COMMENT 'Referencia externa (factura, recibo, etc.)',
    status VARCHAR(20) DEFAULT 'DRAFT' COMMENT 'DRAFT, POSTED, VOID',
    tenant_id INT NOT NULL COMMENT 'ID del tenant',
    created_by BIGINT COMMENT 'Usuario que creó',
    approved_by BIGINT COMMENT 'Usuario que aprobó',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    posted_at TIMESTAMP COMMENT 'Fecha de contabilización',
    fiscal_year INT COMMENT 'Año fiscal',
    fiscal_period INT COMMENT 'Período fiscal (1-12)',
    total_debit DECIMAL(15,2) DEFAULT 0 COMMENT 'Total débitos',
    total_credit DECIMAL(15,2) DEFAULT 0 COMMENT 'Total créditos',
    UNIQUE KEY uk_type_number (voucher_type, voucher_number, tenant_id),
    INDEX idx_date (date),
    INDEX idx_status (status),
    INDEX idx_fiscal (fiscal_year, fiscal_period),
    INDEX idx_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Comprobantes Contables';

-- Tabla: Movimientos Contables (Detalle de comprobantes)
CREATE TABLE accounting_entries (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    voucher_id BIGINT NOT NULL COMMENT 'ID del comprobante',
    line_number INT COMMENT 'Número de línea',
    account_code VARCHAR(10) NOT NULL COMMENT 'Código de cuenta',
    third_party_id BIGINT COMMENT 'ID del tercero (contact)',
    cost_center_id BIGINT COMMENT 'ID del centro de costo',
    description VARCHAR(255) COMMENT 'Descripción del movimiento',
    debit_amount DECIMAL(15,2) DEFAULT 0 COMMENT 'Valor débito',
    credit_amount DECIMAL(15,2) DEFAULT 0 COMMENT 'Valor crédito',
    base_value DECIMAL(15,2) COMMENT 'Base para retenciones',
    tax_value DECIMAL(15,2) COMMENT 'Valor del impuesto',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (voucher_id) REFERENCES accounting_vouchers(id) ON DELETE CASCADE,
    FOREIGN KEY (account_code) REFERENCES chart_of_accounts(code) ON DELETE RESTRICT,
    FOREIGN KEY (third_party_id) REFERENCES contacts(id) ON DELETE SET NULL,
    FOREIGN KEY (cost_center_id) REFERENCES cost_centers(id) ON DELETE SET NULL,
    INDEX idx_voucher (voucher_id),
    INDEX idx_account (account_code),
    INDEX idx_third_party (third_party_id),
    INDEX idx_cost_center (cost_center_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Movimientos Contables';

-- Tabla: Retenciones
CREATE TABLE tax_withholdings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    entry_id BIGINT NOT NULL COMMENT 'ID del movimiento contable',
    tax_type VARCHAR(20) NOT NULL COMMENT 'RETEIVA, RETEICA, RETEFUENTE',
    tax_code VARCHAR(10) COMMENT 'Código del concepto',
    tax_name VARCHAR(100) COMMENT 'Nombre del impuesto',
    base_amount DECIMAL(15,2) COMMENT 'Base gravable',
    tax_rate DECIMAL(5,2) COMMENT 'Tarifa (%)',
    tax_amount DECIMAL(15,2) COMMENT 'Valor de la retención',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (entry_id) REFERENCES accounting_entries(id) ON DELETE CASCADE,
    INDEX idx_entry (entry_id),
    INDEX idx_type (tax_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Retenciones (IVA, ICA, Fuente)';

-- Tabla: Períodos Fiscales
CREATE TABLE fiscal_periods (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL COMMENT 'ID del tenant',
    year INT NOT NULL COMMENT 'Año fiscal',
    period INT NOT NULL COMMENT 'Período (1-12)',
    start_date DATE NOT NULL COMMENT 'Fecha inicio',
    end_date DATE NOT NULL COMMENT 'Fecha fin',
    status VARCHAR(20) DEFAULT 'OPEN' COMMENT 'OPEN, CLOSED',
    closed_at TIMESTAMP COMMENT 'Fecha de cierre',
    closed_by BIGINT COMMENT 'Usuario que cerró',
    UNIQUE KEY uk_year_period (tenant_id, year, period),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Períodos Fiscales';

-- Tabla: Saldos de Cierre
CREATE TABLE closing_balances (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    fiscal_year INT NOT NULL,
    fiscal_period INT NOT NULL,
    account_code VARCHAR(10) NOT NULL,
    third_party_id BIGINT,
    cost_center_id BIGINT,
    debit_balance DECIMAL(15,2) DEFAULT 0 COMMENT 'Saldo débito',
    credit_balance DECIMAL(15,2) DEFAULT 0 COMMENT 'Saldo crédito',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_code) REFERENCES chart_of_accounts(code) ON DELETE RESTRICT,
    FOREIGN KEY (third_party_id) REFERENCES contacts(id) ON DELETE SET NULL,
    FOREIGN KEY (cost_center_id) REFERENCES cost_centers(id) ON DELETE SET NULL,
    UNIQUE KEY uk_closing (tenant_id, fiscal_year, fiscal_period, account_code, third_party_id, cost_center_id),
    INDEX idx_fiscal (fiscal_year, fiscal_period),
    INDEX idx_account (account_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Saldos de Cierre por Período';

-- ============================================
-- PASO 3: Insertar datos iniciales
-- ============================================

-- Centro de costo por defecto
INSERT INTO cost_centers (code, name, description, is_active) 
VALUES ('GENERAL', 'General', 'Centro de costo general', TRUE);

-- Abrir período fiscal actual
INSERT INTO fiscal_periods (tenant_id, year, period, start_date, end_date, status)
VALUES 
(1, YEAR(CURDATE()), MONTH(CURDATE()), 
 DATE_FORMAT(CURDATE(), '%Y-%m-01'), 
 LAST_DAY(CURDATE()), 
 'OPEN');

-- ============================================
-- FIN DE MIGRACIÓN
-- ============================================
