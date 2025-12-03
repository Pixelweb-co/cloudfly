CREATE TABLE quotes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    customer_id BIGINT,
    quote_number VARCHAR(50) NOT NULL UNIQUE,
    quote_date DATETIME NOT NULL,
    expiration_date DATETIME,
    status VARCHAR(20) NOT NULL,
    subtotal DECIMAL(10, 2),
    tax DECIMAL(10, 2),
    discount DECIMAL(10, 2),
    total DECIMAL(10, 2),
    notes TEXT,
    terms TEXT,
    created_by BIGINT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE quote_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    quote_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    discount DECIMAL(10, 2),
    subtotal DECIMAL(10, 2) NOT NULL,
    tax DECIMAL(10, 2),
    total DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
);

CREATE INDEX idx_quotes_tenant ON quotes(tenant_id);
CREATE INDEX idx_quotes_customer ON quotes(customer_id);
