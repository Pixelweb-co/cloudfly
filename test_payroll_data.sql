-- Crear empleado de prueba
INSERT INTO employees (
    customer_id, employee_number, first_name, last_name, national_id,
    email, phone, hire_date, base_salary, payment_method, payment_frequency,
    is_active, has_transport_allowance, has_family_subsidy,
    created_at, updated_at
) VALUES (
    1, 'EMP001', 'Juan', 'Pérez', '123456789',
    'juan.perez@cloudfly.com', '3001234567', '2024-01-01', 1500000.00, 'BANK_TRANSFER', 'MONTHLY',
    1, 1, 0,
    NOW(), NOW()
);

SET @employee_id = LAST_INSERT_ID();

-- Crear período del 1 al 15 de diciembre de 2025
INSERT INTO payroll_periods (
    customer_id, period_name, period_type, year, period_number,
    start_date, end_date, payment_date, working_days, status,
    created_at, updated_at
) VALUES (
    1, 'Primera Quincena Diciembre 2025', 'BIWEEKLY', 2025, 23,
    '2025-12-01', '2025-12-15', '2025-12-20', 15, 'OPEN',
    NOW(), NOW()
);

SET @period_id = LAST_INSERT_ID();

-- Asignar empleado al período
INSERT INTO payroll_period_employees (period_id, employee_id)
VALUES (@period_id, @employee_id);

-- Verificar inserción
SELECT 'Empleado creado:' as Info, e.* FROM employees e WHERE e.id = @employee_id;
SELECT 'Período creado:' as Info, p.* FROM payroll_periods p WHERE p.id = @period_id;
