-- ============================================================================
-- MIGRACIÓN COMPLETA: Módulo Contable con Soporte DIAN
-- Fecha: 2024-12-29
-- ============================================================================

USE cloudfly_erp;

-- 1. Actualizar Plan de Cuentas (ChartOfAccount)
-- Agregar atributos fiscales para DIAN
ALTER TABLE chart_of_accounts
    ADD COLUMN nature VARCHAR(10) COMMENT 'DEBITO, CREDITO',
    ADD COLUMN tax_type VARCHAR(20) COMMENT 'IVA_GENERADO, RETEFUENTE, ICA, ETC',
    ADD COLUMN tax_rate DECIMAL(5,2) COMMENT 'Porcentaje de impuesto',
    ADD COLUMN dian_code VARCHAR(20) COMMENT 'Código para XML DIAN',
    ADD COLUMN tenant_id INT NOT NULL DEFAULT 1;

-- 2. Crear Tabla de Períodos Fiscales
CREATE TABLE IF NOT EXISTS accounting_fiscal_periods (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    year INT NOT NULL,
    month INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN', -- OPEN, CLOSED, LOCKED
    closed_at DATETIME,
    closed_by BIGINT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_period (tenant_id, year, month)
);

-- 3. Crear Libro Mayor (Ledger) para Balances Rápidos
CREATE TABLE IF NOT EXISTS accounting_ledger (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    fiscal_period_id BIGINT NOT NULL,
    account_code VARCHAR(10) NOT NULL,
    cost_center_id BIGINT,
    
    initial_balance DECIMAL(15,2) DEFAULT 0.00,
    debit_amount DECIMAL(15,2) DEFAULT 0.00,
    credit_amount DECIMAL(15,2) DEFAULT 0.00,
    final_balance DECIMAL(15,2) DEFAULT 0.00,
    
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (fiscal_period_id) REFERENCES accounting_fiscal_periods(id),
    FOREIGN KEY (account_code) REFERENCES chart_of_accounts(code),
    FOREIGN KEY (cost_center_id) REFERENCES cost_centers(id),
    
    INDEX idx_ledger_period (fiscal_period_id),
    INDEX idx_ledger_account (account_code)
);

-- 4. Asegurar índices en Entries para búsquedas rápidas
CREATE INDEX idx_entries_voucher ON accounting_entries(voucher_id);
CREATE INDEX idx_entries_account ON accounting_entries(account_code);
CREATE INDEX idx_entries_third_party ON accounting_entries(third_party_id);
