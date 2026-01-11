-- ============================================================================
-- MIGRACIÓN ROBUSTA: Módulo Contable CloudFly con Soporte DIAN
-- ============================================================================

USE cloud_master;

-- 1. Asegurar columnas en chart_of_accounts (Ejecutar una por una o en bloque si se sabe que no existen)
-- Se usa sintaxis tolerante a fallos de MySQL (Si falla una, ignorar y seguir es manual)
-- Aquí asumimos que no existen las columnas de la V1. 
-- Si "nature" ya existe por V2, el ALTER podría dar warning o error, pero tenant_id es critico.

DELIMITER $$

CREATE PROCEDURE UpgradeChartOfAccounts()
BEGIN
    -- nature (Ya existe en V2, pero aseguramos tipo)
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='chart_of_accounts' AND COLUMN_NAME='nature' AND TABLE_SCHEMA=DATABASE()) THEN
        ALTER TABLE chart_of_accounts ADD COLUMN nature VARCHAR(10) COMMENT 'DEBITO, CREDITO';
    END IF;

    -- tax_type
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='chart_of_accounts' AND COLUMN_NAME='tax_type' AND TABLE_SCHEMA=DATABASE()) THEN
        ALTER TABLE chart_of_accounts ADD COLUMN tax_type VARCHAR(20) COMMENT 'IVA_GENERADO, RETEFUENTE, ICA, ETC';
    END IF;

    -- tax_rate
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='chart_of_accounts' AND COLUMN_NAME='tax_rate' AND TABLE_SCHEMA=DATABASE()) THEN
        ALTER TABLE chart_of_accounts ADD COLUMN tax_rate DECIMAL(5,2) COMMENT 'Porcentaje de impuesto';
    END IF;

    -- dian_code
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='chart_of_accounts' AND COLUMN_NAME='dian_code' AND TABLE_SCHEMA=DATABASE()) THEN
        ALTER TABLE chart_of_accounts ADD COLUMN dian_code VARCHAR(20) COMMENT 'Código para XML DIAN';
    END IF;

    -- tenant_id
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='chart_of_accounts' AND COLUMN_NAME='tenant_id' AND TABLE_SCHEMA=DATABASE()) THEN
        ALTER TABLE chart_of_accounts ADD COLUMN tenant_id INT NOT NULL DEFAULT 1;
    END IF;
END$$

DELIMITER ;

CALL UpgradeChartOfAccounts();
DROP PROCEDURE UpgradeChartOfAccounts;


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

-- 4. Asegurar índices en Entries para búsquedas rápidas (IF NOT EXISTS implícito en create index en algunas versiones o ignorar error)
-- Lo haremos vía Procedure para seguridad

DELIMITER $$
CREATE PROCEDURE EnsureAccountingIndices()
BEGIN
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_NAME = 'accounting_entries' AND INDEX_NAME = 'idx_entries_voucher') THEN
        CREATE INDEX idx_entries_voucher ON accounting_entries(voucher_id);
    END IF;
    
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_NAME = 'accounting_entries' AND INDEX_NAME = 'idx_entries_account') THEN
        CREATE INDEX idx_entries_account ON accounting_entries(account_code);
    END IF;

    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_NAME = 'accounting_entries' AND INDEX_NAME = 'idx_entries_third_party') THEN
        CREATE INDEX idx_entries_third_party ON accounting_entries(third_party_id);
    END IF;
END$$
DELIMITER ;

CALL EnsureAccountingIndices();
DROP PROCEDURE EnsureAccountingIndices;
