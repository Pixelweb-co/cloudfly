-- V33: Create Portfolio Module Tables (Cartera)

-- 1. Portfolio Documents (Cuentas por Cobrar / Pagar)
CREATE TABLE portfolio_documents (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    contact_id BIGINT NOT NULL,
    
    type VARCHAR(30) NOT NULL, -- RECEIVABLE (CxC), PAYABLE (CxP)
    document_source VARCHAR(50) NOT NULL, -- INVOICE, MANUAL, NOTE
    status VARCHAR(30) NOT NULL, -- OPEN, PARTIAL, PAID, OVERDUE, VOID
    
    document_number VARCHAR(100) NOT NULL, -- Copia del número de factura o referencia
    
    issue_date DATETIME NOT NULL,
    due_date DATETIME NOT NULL,
    
    total_amount DECIMAL(19,2) NOT NULL, -- Valor original
    balance DECIMAL(19,2) NOT NULL,      -- Saldo pendiente
    
    invoice_id BIGINT NULL, -- Relación opcional con Factura (si origen es INVOICE)
    
    notes TEXT,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT,
    
    INDEX idx_pd_tenant (tenant_id),
    INDEX idx_pd_contact (contact_id),
    INDEX idx_pd_status (status),
    INDEX idx_pd_due_date (due_date),
    
    CONSTRAINT fk_pd_contact FOREIGN KEY (contact_id) REFERENCES contacts(id),
    CONSTRAINT fk_pd_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL
);

-- 2. Portfolio Payments (Recaudos / Pagos recibidos o realizados)
CREATE TABLE portfolio_payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    contact_id BIGINT NOT NULL,
    
    type VARCHAR(30) NOT NULL, -- INCOMING (Recaudo), OUTGOING (Pago a Prov)
    
    payment_date DATETIME NOT NULL,
    amount DECIMAL(19,2) NOT NULL,         -- Monto total del pago
    unapplied_amount DECIMAL(19,2) NOT NULL, -- Monto disponible para aplicar
    
    payment_method VARCHAR(50), -- CASH, TRANSFER, CHECK, etc.
    reference VARCHAR(100),     -- Referencia externa, # Recibo, Hash, etc.
    notes TEXT,
    
    status VARCHAR(30) NOT NULL, -- DRAFT, POSTED, VOID
    
    accounting_voucher_id BIGINT NULL, -- Relación con asiento contable
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT,
    
    INDEX idx_pp_tenant (tenant_id),
    INDEX idx_pp_contact (contact_id),
    
    CONSTRAINT fk_pp_contact FOREIGN KEY (contact_id) REFERENCES contacts(id)
);

-- 3. Payment Applications (Cruces)
CREATE TABLE portfolio_applications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    
    payment_id BIGINT NOT NULL,
    document_id BIGINT NOT NULL,
    
    amount DECIMAL(19,2) NOT NULL, -- El monto que este pago reduce del documento
    
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_pa_payment (payment_id),
    INDEX idx_pa_document (document_id),
    
    CONSTRAINT fk_pa_payment FOREIGN KEY (payment_id) REFERENCES portfolio_payments(id) ON DELETE CASCADE,
    CONSTRAINT fk_pa_document FOREIGN KEY (document_id) REFERENCES portfolio_documents(id) ON DELETE RESTRICT
);
