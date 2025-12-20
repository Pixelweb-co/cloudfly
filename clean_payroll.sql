SET FOREIGN_KEY_CHECKS = 0;

-- Eliminar datos de nómina en orden inverso de dependencia (aunque FK checks 0 ayuda)
DELETE FROM payroll_receipts;
DELETE FROM payroll_novelties;
DELETE FROM payroll_periods;

-- Intentar eliminar detalles legacy si existen (ignorar error si no)
-- DELETE FROM payroll_receipt_details; 

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Limpieza de nómina completada' AS status;
