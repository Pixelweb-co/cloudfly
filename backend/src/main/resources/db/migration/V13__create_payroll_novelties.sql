-- Crear tabla de novedades de nómina
CREATE TABLE IF NOT EXISTS payroll_novelties (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    employee_id BIGINT NOT NULL,
    payroll_period_id BIGINT,
    type ENUM(
        'EXTRA_HOUR_DAY',
        'EXTRA_HOUR_NIGHT',
        'EXTRA_HOUR_SUNDAY',
        'BONUS_SALARY',
        'BONUS_NON_SALARY',
        'COMMISSION',
        'TRANSPORT_AID',
        'DEDUCTION_LOAN',
        'DEDUCTION_OTHER',
        'SICK_LEAVE',
        'LICENSE_MATERNITY',
        'LICENSE_UNPAID'
    ) NOT NULL,
    description VARCHAR(500) NOT NULL,
    novelty_date DATE,
    amount DECIMAL(19,2),
    quantity DECIMAL(10,2),
    status ENUM('PENDING', 'PROCESSED', 'CANCELLED') DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_novelty_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
    CONSTRAINT fk_novelty_employee FOREIGN KEY (employee_id) REFERENCES employees(id),
    CONSTRAINT fk_novelty_period FOREIGN KEY (payroll_period_id) REFERENCES payroll_periods(id)
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_novelty_customer ON payroll_novelties(customer_id);
CREATE INDEX idx_novelty_employee ON payroll_novelties(employee_id);
CREATE INDEX idx_novelty_period ON payroll_novelties(payroll_period_id);
CREATE INDEX idx_novelty_status ON payroll_novelties(status);
CREATE INDEX idx_novelty_date ON payroll_novelties(novelty_date);
