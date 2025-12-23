-- V18: Add cost_center_id to employees table for payroll-cost center integration
-- This enables tracking payroll costs by department/cost center

-- Add cost_center_id column to employees
ALTER TABLE employees 
ADD COLUMN cost_center_id BIGINT NULL AFTER department,
ADD CONSTRAINT fk_employee_cost_center 
    FOREIGN KEY (cost_center_id) REFERENCES cost_centers(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX idx_employee_cost_center ON employees(cost_center_id);

-- Add some sample cost centers if they don't exist
INSERT IGNORE INTO cost_centers (code, name, description, is_active, created_at, updated_at) VALUES
('CC-ADM', 'Administración', 'Gastos administrativos y gerenciales', TRUE, NOW(), NOW()),
('CC-VEN', 'Ventas', 'Departamento comercial y ventas', TRUE, NOW(), NOW()),
('CC-PRO', 'Producción', 'Área de producción y manufactura', TRUE, NOW(), NOW()),
('CC-LOG', 'Logística', 'Transporte y distribución', TRUE, NOW(), NOW()),
('CC-TEC', 'Tecnología', 'Sistemas y soporte técnico', TRUE, NOW(), NOW());

-- Create view for payroll costs by cost center (for reports)
CREATE OR REPLACE VIEW v_payroll_by_cost_center AS
SELECT 
    cc.id AS cost_center_id,
    cc.code AS cost_center_code,
    cc.name AS cost_center_name,
    pp.id AS period_id,
    pp.year AS period_year,
    pp.period_number,
    pp.period_type,
    pp.customer_id,
    COUNT(DISTINCT pr.employee_id) AS employee_count,
    COALESCE(SUM(pr.salary_amount), 0) AS total_salary,
    COALESCE(SUM(pr.overtime_amount), 0) AS total_overtime,
    COALESCE(SUM(pr.transport_allowance_amount), 0) AS total_transport,
    COALESCE(SUM(pr.total_perceptions), 0) AS total_perceptions,
    COALESCE(SUM(pr.total_deductions), 0) AS total_deductions,
    COALESCE(SUM(pr.net_pay), 0) AS total_net_pay,
    COALESCE(SUM(pr.employer_health_contribution), 0) AS total_employer_health,
    COALESCE(SUM(pr.employer_pension_contribution), 0) AS total_employer_pension,
    COALESCE(SUM(pr.arl_contribution), 0) AS total_arl,
    COALESCE(SUM(pr.caja_compensacion_contribution), 0) AS total_caja,
    COALESCE(SUM(pr.icbf_contribution), 0) AS total_icbf,
    COALESCE(SUM(pr.sena_contribution), 0) AS total_sena,
    COALESCE(SUM(pr.cesantias_provision), 0) AS total_cesantias,
    COALESCE(SUM(pr.prima_servicios_provision), 0) AS total_prima,
    COALESCE(SUM(pr.vacaciones_provision), 0) AS total_vacaciones,
    -- Total employer cost = perceptions + employer contributions + provisions
    COALESCE(SUM(pr.total_perceptions), 0) + 
    COALESCE(SUM(pr.employer_health_contribution), 0) +
    COALESCE(SUM(pr.employer_pension_contribution), 0) +
    COALESCE(SUM(pr.arl_contribution), 0) +
    COALESCE(SUM(pr.caja_compensacion_contribution), 0) +
    COALESCE(SUM(pr.icbf_contribution), 0) +
    COALESCE(SUM(pr.sena_contribution), 0) +
    COALESCE(SUM(pr.cesantias_provision), 0) +
    COALESCE(SUM(pr.prima_servicios_provision), 0) +
    COALESCE(SUM(pr.vacaciones_provision), 0) AS total_employer_cost
FROM payroll_receipts pr
JOIN employees e ON pr.employee_id = e.id
JOIN payroll_periods pp ON pr.payroll_period_id = pp.id
LEFT JOIN cost_centers cc ON e.cost_center_id = cc.id
GROUP BY 
    cc.id, cc.code, cc.name, 
    pp.id, pp.year, pp.period_number, pp.period_type, pp.customer_id;
