-- ============================================================================
-- MIGRATION: Create DANE codes table for Colombian geographic data
-- Description: Creates dane_codes table for managing departamentos and ciudades
--              Used for DIAN electronic invoicing location fields
-- Date: 2025-12-29
-- ============================================================================

USE cloudfly_erp;

-- Create DANE codes table
CREATE TABLE IF NOT EXISTS dane_codes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tipo VARCHAR(15) NOT NULL COMMENT 'DEPARTAMENTO or CIUDAD',
    codigo VARCHAR(5) NOT NULL UNIQUE COMMENT 'DANE code: 2 digits for dept, 5 for city',
    nombre VARCHAR(150) NOT NULL COMMENT 'Department or city name',
    codigo_departamento VARCHAR(2) NULL COMMENT 'Parent department code (only for cities)',
    activo BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Is active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_dane_tipo (tipo),
    INDEX idx_dane_codigo (codigo),
    INDEX idx_dane_depto (codigo_departamento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='DANE geographic codes for Colombia - Departamentos y Ciudades';

-- ============================================================================
-- SEED DATA: Colombian Departments and Major Cities
-- ============================================================================

-- Insert Departments (33 departments of Colombia)
INSERT INTO dane_codes (tipo, codigo, nombre, codigo_departamento, activo) VALUES
('DEPARTAMENTO', '05', 'Antioquia', NULL, TRUE),
('DEPARTAMENTO', '08', 'Atlántico', NULL, TRUE),
('DEPARTAMENTO', '11', 'Bogotá D.C.', NULL, TRUE),
('DEPARTAMENTO', '13', 'Bolívar', NULL, TRUE),
('DEPARTAMENTO', '15', 'Boyacá', NULL, TRUE),
('DEPARTAMENTO', '17', 'Caldas', NULL, TRUE),
('DEPARTAMENTO', '18', 'Caquetá', NULL, TRUE),
('DEPARTAMENTO', '19', 'Cauca', NULL, TRUE),
('DEPARTAMENTO', '20', 'Cesar', NULL, TRUE),
('DEPARTAMENTO', '23', 'Córdoba', NULL, TRUE),
('DEPARTAMENTO', '25', 'Cundinamarca', NULL, TRUE),
('DEPARTAMENTO', '27', 'Chocó', NULL, TRUE),
('DEPARTAMENTO', '41', 'Huila', NULL, TRUE),
('DEPARTAMENTO', '44', 'La Guajira', NULL, TRUE),
('DEPARTAMENTO', '47', 'Magdalena', NULL, TRUE),
('DEPARTAMENTO', '50', 'Meta', NULL, TRUE),
('DEPARTAMENTO', '52', 'Nariño', NULL, TRUE),
('DEPARTAMENTO', '54', 'Norte de Santander', NULL, TRUE),
('DEPARTAMENTO', '63', 'Quindío', NULL, TRUE),
('DEPARTAMENTO', '66', 'Risaralda', NULL, TRUE),
('DEPARTAMENTO', '68', 'Santander', NULL, TRUE),
('DEPARTAMENTO', '70', 'Sucre', NULL, TRUE),
('DEPARTAMENTO', '73', 'Tolima', NULL, TRUE),
('DEPARTAMENTO', '76', 'Valle del Cauca', NULL, TRUE),
('DEPARTAMENTO', '81', 'Arauca', NULL, TRUE),
('DEPARTAMENTO', '85', 'Casanare', NULL, TRUE),
('DEPARTAMENTO', '86', 'Putumayo', NULL, TRUE),
('DEPARTAMENTO', '88', 'Archipiélago de San Andrés', NULL, TRUE),
('DEPARTAMENTO', '91', 'Amazonas', NULL, TRUE),
('DEPARTAMENTO', '94', 'Guainía', NULL, TRUE),
('DEPARTAMENTO', '95', 'Guaviare', NULL, TRUE),
('DEPARTAMENTO', '97', 'Vaupés', NULL, TRUE),
('DEPARTAMENTO', '99', 'Vichada', NULL, TRUE)
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- Insert Major Cities (Capitals and important cities)
INSERT INTO dane_codes (tipo, codigo, nombre, codigo_departamento, activo) VALUES
-- Antioquia
('CIUDAD', '05001', 'Medellín', '05', TRUE),
('CIUDAD', '05088', 'Bello', '05', TRUE),
('CIUDAD', '05360', 'Itagüí', '05', TRUE),
('CIUDAD', '05266', 'Envigado', '05', TRUE),

-- Atlántico
('CIUDAD', '08001', 'Barranquilla', '08', TRUE),
('CIUDAD', '08758', 'Soledad', '08', TRUE),

-- Bogotá D.C.
('CIUDAD', '11001', 'Bogotá D.C.', '11', TRUE),

-- Bolívar
('CIUDAD', '13001', 'Cartagena de Indias', '13', TRUE),

-- Boyacá
('CIUDAD', '15001', 'Tunja', '15', TRUE),
('CIUDAD', '15759', 'Sogamoso', '15', TRUE),

-- Caldas
('CIUDAD', '17001', 'Manizales', '17', TRUE),

-- Cauca
('CIUDAD', '19001', 'Popayán', '19', TRUE),

-- Cesar
('CIUDAD', '20001', 'Valledupar', '20', TRUE),

-- Córdoba
('CIUDAD', '23001', 'Montería', '23', TRUE),

-- Cundinamarca
('CIUDAD', '25001', 'Agua de Dios', '25', TRUE),
('CIUDAD', '25754', 'Soacha', '25', TRUE),
('CIUDAD', '25099', 'Chía', '25', TRUE),

-- Huila
('CIUDAD', '41001', 'Neiva', '41', TRUE),

-- La Guajira
('CIUDAD', '44001', 'Riohacha', '44', TRUE),

-- Magdalena
('CIUDAD', '47001', 'Santa Marta', '47', TRUE),

-- Meta
('CIUDAD', '50001', 'Villavicencio', '50', TRUE),

-- Nariño
('CIUDAD', '52001', 'Pasto', '52', TRUE),

-- Norte de Santander
('CIUDAD', '54001', 'Cúcuta', '54', TRUE),

-- Quindío
('CIUDAD', '63001', 'Armenia', '63', TRUE),

-- Risaralda
('CIUDAD', '66001', 'Pereira', '66', TRUE),

-- Santander
('CIUDAD', '68001', 'Bucaramanga', '68', TRUE),
('CIUDAD', '68276', 'Floridablanca', '68', TRUE),

-- Sucre
('CIUDAD', '70001', 'Sincelejo', '70', TRUE),

-- Tolima
('CIUDAD', '73001', 'Ibagué', '73', TRUE),

-- Valle del Cauca
('CIUDAD', '76001', 'Cali', '76', TRUE),
('CIUDAD', '76520', 'Palmira', '76', TRUE),
('CIUDAD', '76111', 'Buenaventura', '76', TRUE)

ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT COUNT(*) as total_departamentos FROM dane_codes WHERE tipo = 'DEPARTAMENTO' AND activo = TRUE;
SELECT COUNT(*) as total_ciudades FROM dane_codes WHERE tipo = 'CIUDAD' AND activo = TRUE;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
