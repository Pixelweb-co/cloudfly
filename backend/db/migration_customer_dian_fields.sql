-- ============================================================================
-- MIGRACIÓN: Agregar campos DIAN a tabla Customer (clientes)
-- Descripción: Agrega todos los campos necesarios para facturación electrónica
--              DIAN UBL 2.1 Colombia a la tabla clientes existente
-- NOTA: El campo 'id' de esta tabla ya representa el tenant_id
-- Fecha: 2024-12-29
-- ============================================================================

USE cloudfly_erp;

-- Agregar campos de identificación tributaria DIAN
ALTER TABLE clientes
    ADD COLUMN IF NOT EXISTS tipo_documento_dian VARCHAR(2) DEFAULT NULL COMMENT 'Tipo doc DIAN: 31=NIT, 13=CC, 22=CE',
    ADD COLUMN IF NOT EXISTS digito_verificacion VARCHAR(1) DEFAULT NULL COMMENT 'Dígito verificación NIT';

-- Agregar nombres legales y comerciales
ALTER TABLE clientes
    ADD COLUMN IF NOT EXISTS razon_social VARCHAR(450) DEFAULT NULL COMMENT 'Razón social legal',
    ADD COLUMN IF NOT EXISTS nombre_comercial VARCHAR(450) DEFAULT NULL COMMENT 'Nombre comercial';

-- Agregar responsabilidades fiscales
ALTER TABLE clientes
    ADD COLUMN IF NOT EXISTS responsabilidades_fiscales VARCHAR(500) DEFAULT NULL COMMENT 'R-99-PN, O-13, O-15, etc',
    ADD COLUMN IF NOT EXISTS regimen_fiscal VARCHAR(20) DEFAULT NULL COMMENT 'COMUN, SIMPLE, ESPECIAL',
    ADD COLUMN IF NOT EXISTS obligaciones_dian VARCHAR(500) DEFAULT NULL COMMENT 'Obligaciones DIAN';

-- Agregar ubicación geográfica DIAN
ALTER TABLE clientes
    ADD COLUMN IF NOT EXISTS codigo_dane_ciudad VARCHAR(5) DEFAULT NULL COMMENT 'Código DANE ciudad (5 dígitos)',
    ADD COLUMN IF NOT EXISTS ciudad_dian VARCHAR(100) DEFAULT NULL COMMENT 'Nombre ciudad',
    ADD COLUMN IF NOT EXISTS codigo_dane_departamento VARCHAR(2) DEFAULT NULL COMMENT 'Código DANE depto (2 dígitos)',
    ADD COLUMN IF NOT EXISTS departamento_dian VARCHAR(100) DEFAULT NULL COMMENT 'Nombre departamento',
    ADD COLUMN IF NOT EXISTS pais_codigo VARCHAR(2) DEFAULT 'CO' COMMENT 'Código país',
    ADD COLUMN IF NOT EXISTS pais_nombre VARCHAR(100) DEFAULT 'Colombia' COMMENT 'Nombre país',
    ADD COLUMN IF NOT EXISTS codigo_postal VARCHAR(10) DEFAULT NULL COMMENT 'Código postal';

-- Agregar información económica
ALTER TABLE clientes
    ADD COLUMN IF NOT EXISTS actividad_economica_ciiu VARCHAR(10) DEFAULT NULL COMMENT 'Código CIIU actividad económica',
    ADD COLUMN IF NOT EXISTS actividad_economica_desc VARCHAR(500) DEFAULT NULL COMMENT 'Descripción actividad';

-- Agregar contacto facturación electrónica
ALTER TABLE clientes
    ADD COLUMN IF NOT EXISTS email_facturacion_dian VARCHAR(255) DEFAULT NULL COMMENT 'Email para FE',
    ADD COLUMN IF NOT EXISTS sitio_web VARCHAR(255) DEFAULT NULL COMMENT 'Sitio web';

-- Agregar representante legal
ALTER TABLE clientes
    ADD COLUMN IF NOT EXISTS representante_legal_nombre VARCHAR(255) DEFAULT NULL COMMENT 'Nombre representante legal',
    ADD COLUMN IF NOT EXISTS representante_legal_tipo_doc VARCHAR(2) DEFAULT NULL COMMENT 'Tipo doc representante',
    ADD COLUMN IF NOT EXISTS representante_legal_numero_doc VARCHAR(20) DEFAULT NULL COMMENT 'Número doc representante';

-- Agregar configuración facturación electrónica
ALTER TABLE clientes
    ADD COLUMN IF NOT EXISTS es_emisor_fe BOOLEAN DEFAULT FALSE COMMENT 'Es emisor de facturas electrónicas',
    ADD COLUMN IF NOT EXISTS es_emisor_principal BOOLEAN DEFAULT FALSE COMMENT 'Es emisor principal del tenant',
    ADD COLUMN IF NOT EXISTS notas_dian TEXT DEFAULT NULL COMMENT 'Notas configuración DIAN';

-- Agregar auditoría
ALTER TABLE clientes
    ADD COLUMN IF NOT EXISTS created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha creación',
    ADD COLUMN IF NOT EXISTS updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Fecha actualización';

-- Crear índices para mejorar rendimiento
-- NOTA: No se crea índice para tenant_id porque el campo 'id' ya es el primary key/tenant
CREATE INDEX IF NOT EXISTS idx_nit ON clientes(identificacion_cliente);
CREATE INDEX IF NOT EXISTS idx_status ON clientes(status_cliente);
CREATE INDEX IF NOT EXISTS idx_emisor_fe ON clientes(es_emisor_fe);

-- ============================================================================
-- DATOS DE EJEMPLO (Opcional - solo para desarrollo/testing)
-- ============================================================================

-- Actualizar customers existentes con valores por defecto para campos DIAN
UPDATE clientes 
SET 
    tipo_documento_dian = '31', -- Asumiendo que son NIT
    pais_codigo = 'CO',
    pais_nombre = 'Colombia',
    es_emisor_fe = FALSE,
    es_emisor_principal = FALSE
WHERE tipo_documento_dian IS NULL;

-- Copiar datos existentes a nuevos campos
UPDATE clientes 
SET 
    razon_social = nombre_cliente,
    nombre_comercial = nombre_cliente,
    ciudad_dian = 'Bogotá D.C.',
    departamento_dian = 'Cundinamarca',
    codigo_dane_ciudad = '11001',
    codigo_dane_departamento = '11',
    email_facturacion_dian = email_cliente
WHERE razon_social IS NULL AND nombre_cliente IS NOT NULL;

-- ============================================================================
-- COMENTARIOS TABLA
-- ============================================================================

ALTER TABLE clientes COMMENT = 'Clientes y Emisores de Facturación Electrónica DIAN';

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Verificar que las columnas se agregaron correctamente
SELECT 
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'cloudfly_erp'
  AND TABLE_NAME = 'clientes'
  AND COLUMN_NAME LIKE '%dian%' OR COLUMN_NAME LIKE '%fiscal%' OR COLUMN_NAME LIKE '%emisor%'
ORDER BY ORDINAL_POSITION;

-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================
