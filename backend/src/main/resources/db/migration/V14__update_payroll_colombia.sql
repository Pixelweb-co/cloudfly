-- =====================================================
-- Migración: Actualización de Nómina para Colombia
-- Versión: V14
-- Descripción: Agrega campos detallados para liquidación
--              de nómina y configuración de factores
-- =====================================================

-- =====================================================
-- 1. ACTUALIZAR CONFIGURACIÓN (NUEVOS FACTORES)
-- =====================================================
ALTER TABLE payroll_configuration
ADD COLUMN IF NOT EXISTS overtime_day_factor DECIMAL(5,4) DEFAULT 1.2500,
ADD COLUMN IF NOT EXISTS overtime_night_factor DECIMAL(5,4) DEFAULT 1.7500,
ADD COLUMN IF NOT EXISTS night_surcharge_factor DECIMAL(5,4) DEFAULT 0.3500,
ADD COLUMN IF NOT EXISTS sunday_holiday_factor DECIMAL(5,4) DEFAULT 1.7500;

-- =====================================================
-- 2. AGREGAR CAMPOS DE DEVENGOS A RECIBOS
-- =====================================================
ALTER TABLE payroll_receipts
ADD COLUMN IF NOT EXISTS salary_amount DECIMAL(12,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS overtime_amount DECIMAL(12,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS commissions_amount DECIMAL(12,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS transport_allowance_amount DECIMAL(12,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS bonuses_amount DECIMAL(12,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS other_earnings DECIMAL(12,2) DEFAULT 0.00;

-- =====================================================
-- 3. AGREGAR CAMPOS DE DEDUCCIONES LEGALES
-- =====================================================
ALTER TABLE payroll_receipts
ADD COLUMN IF NOT EXISTS health_deduction DECIMAL(12,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS pension_deduction DECIMAL(12,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS other_deductions DECIMAL(12,2) DEFAULT 0.00;

-- =====================================================
-- 4. AGREGAR CAMPOS DE COSTOS DEL EMPLEADOR
-- =====================================================
ALTER TABLE payroll_receipts
ADD COLUMN IF NOT EXISTS employer_health_contribution DECIMAL(12,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS employer_pension_contribution DECIMAL(12,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS arl_contribution DECIMAL(12,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS sena_contribution DECIMAL(12,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS icbf_contribution DECIMAL(12,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS caja_compensacion_contribution DECIMAL(12,2) DEFAULT 0.00;

-- =====================================================
-- 5. AGREGAR CAMPOS DE PROVISIONES
-- =====================================================
ALTER TABLE payroll_receipts
ADD COLUMN IF NOT EXISTS prima_servicios_provision DECIMAL(12,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS cesantias_provision DECIMAL(12,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS intereses_cesantias_provision DECIMAL(12,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS vacaciones_provision DECIMAL(12,2) DEFAULT 0.00;

-- =====================================================
-- 6. AGREGAR CAMPOS DE TOTALES
-- =====================================================
ALTER TABLE payroll_receipts
ADD COLUMN IF NOT EXISTS total_employer_costs DECIMAL(12,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS total_provisions DECIMAL(12,2) DEFAULT 0.00;

-- =====================================================
-- 7. ELIMINAR/RENOMBRAR CAMPOS NO APLICABLES
-- =====================================================
-- Comentar estos campos en lugar de eliminarlos para retrocompatibilidad
-- Se pueden eliminar en una migración futura si es necesario
COMMENT ON COLUMN payroll_receipts.isr_amount IS 'Deprecated: Campo específico de México. Usar health_deduction y pension_deduction para Colombia.';
COMMENT ON COLUMN payroll_receipts.imss_amount IS 'Deprecated: Campo específico de México. Usar los campos de contribuciones colombianas.';
COMMENT ON COLUMN payroll_receipts.uuid IS 'Deprecated: UUID de CFDI México. No aplica para Colombia.';
COMMENT ON COLUMN payroll_receipts.xml_path IS 'Deprecated: XML de CFDI México. No aplica para Colombia.';
COMMENT ON COLUMN payroll_receipts.stamped_at IS 'Deprecated: Timbrado CFDI México. No aplica para Colombia.';

-- =====================================================
-- 8. CREAR ÍNDICES PARA MEJORAR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_payroll_receipts_period_status 
    ON payroll_receipts(payroll_period_id, status);

CREATE INDEX IF NOT EXISTS idx_payroll_receipts_employee_period 
    ON payroll_receipts(employee_id, payroll_period_id);

CREATE INDEX IF NOT EXISTS idx_payroll_receipts_calculation_date 
    ON payroll_receipts(calculation_date);

CREATE INDEX IF NOT EXISTS idx_payroll_receipts_paid_at 
    ON payroll_receipts(paid_at) 
    WHERE paid_at IS NOT NULL;

-- =====================================================
-- 9. AGREGAR COMENTARIOS DESCRIPTIVOS
-- =====================================================
COMMENT ON COLUMN payroll_receipts.salary_amount IS 'Salario base proporcional a días trabajados';
COMMENT ON COLUMN payroll_receipts.overtime_amount IS 'Valor total de horas extras (con recargos)';
COMMENT ON COLUMN payroll_receipts.commissions_amount IS 'Comisiones ganadas en el período';
COMMENT ON COLUMN payroll_receipts.transport_allowance_amount IS 'Auxilio de transporte (solo si salario < 2 SMMLV)';
COMMENT ON COLUMN payroll_receipts.bonuses_amount IS 'Bonos e incentivos del período';
COMMENT ON COLUMN payroll_receipts.other_earnings IS 'Otros devengos no clasificados';

COMMENT ON COLUMN payroll_receipts.health_deduction IS 'Aporte a salud del empleado (4% sobre salario base + HE)';
COMMENT ON COLUMN payroll_receipts.pension_deduction IS 'Aporte a pensión del empleado (4% sobre salario base + HE)';
COMMENT ON COLUMN payroll_receipts.other_deductions IS 'Otras deducciones: préstamos, embargos, anticipos';

COMMENT ON COLUMN payroll_receipts.employer_health_contribution IS 'Aporte a salud del empleador (8.5%)';
COMMENT ON COLUMN payroll_receipts.employer_pension_contribution IS 'Aporte a pensión del empleador (12%)';
COMMENT ON COLUMN payroll_receipts.arl_contribution IS 'Aporte ARL según nivel de riesgo (0.522% - 6.96%)';
COMMENT ON COLUMN payroll_receipts.sena_contribution IS 'Aporte SENA (2% si aplica)';
COMMENT ON COLUMN payroll_receipts.icbf_contribution IS 'Aporte ICBF (3% si aplica)';
COMMENT ON COLUMN payroll_receipts.caja_compensacion_contribution IS 'Aporte Caja de Compensación Familiar (4%)';

COMMENT ON COLUMN payroll_receipts.prima_servicios_provision IS 'Provisión prima de servicios: (Salario × Días) / 360';
COMMENT ON COLUMN payroll_receipts.cesantias_provision IS 'Provisión cesantías: ((Salario + Aux.Transporte) × Días) / 360';
COMMENT ON COLUMN payroll_receipts.intereses_cesantias_provision IS 'Provisión intereses sobre cesantías: Cesantías × 12% × Días / 360';
COMMENT ON COLUMN payroll_receipts.vacaciones_provision IS 'Provisión vacaciones: (Salario × Días) / 720';

COMMENT ON COLUMN payroll_receipts.total_employer_costs IS 'Total costos patronales (suma de contribuciones del empleador)';
COMMENT ON COLUMN payroll_receipts.total_provisions IS 'Total provisiones (prima, cesantías, intereses, vacaciones)';

-- =====================================================
-- FIN DE MIGRACIÓN V14
-- =====================================================
