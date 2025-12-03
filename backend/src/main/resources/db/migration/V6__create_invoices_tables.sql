CREATE TABLE invoices (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    customer_id BIGINT,
    order_id BIGINT,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    issue_date DATETIME NOT NULL,
    due_date DATETIME,
    status VARCHAR(20) NOT NULL,
    subtotal DECIMAL(10, 2),
    tax DECIMAL(10, 2),
    discount DECIMAL(10, 2),
    total DECIMAL(10, 2),
    notes TEXT,
    created_by BIGINT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE invoice_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    invoice_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    discount DECIMAL(10, 2),
    subtotal DECIMAL(10, 2) NOT NULL,
    tax DECIMAL(10, 2),
    total DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

CREATE INDEX idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
