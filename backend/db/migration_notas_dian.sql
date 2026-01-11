-- ============================================================================
-- MIGRACIÓN: Notas Crédito y Débito DIAN
-- Descripción: Crea tablas para notas de crédito y débito electrónicas
-- Fecha: 2024-12-29
-- ============================================================================

USE cloudfly_erp;

-- ============================================================================
-- TABLA: notas_credito
-- ============================================================================

CREATE TABLE IF NOT EXISTS notas_credito (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    
    -- Identificación
    numero_nota_credito VARCHAR(50) UNIQUE,
    prefijo_dian VARCHAR(10),
    consecutivo_dian BIGINT,
    cufe VARCHAR(500),
    
    -- Referencia factura
    invoice_id_referencia BIGINT NOT NULL,
    cufe_factura_original VARCHAR(500),
    numero_factura_original VARCHAR(50),
    fecha_factura_original DATE,
    
    -- Motivo
    motivo TEXT NOT NULL,
    codigo_motivo_dian VARCHAR(2),
    
    -- Fechas
    fecha_emision DATE NOT NULL,
    hora_emision TIME,
    
    -- Totales
    subtotal DECIMAL(15,2),
    total_descuentos DECIMAL(15,2) DEFAULT 0.00,
    total_impuestos DECIMAL(15,2),
    total DECIMAL(15,2) NOT NULL,
    
    -- Estado
    estado VARCHAR(20) NOT NULL DEFAULT 'BORRADOR',
    ambiente_dian VARCHAR(1),
    
    -- XML y respuestas
    xml_firmado LONGBLOB,
    xml_respuesta_dian LONGBLOB,
    mensaje_dian TEXT,
    
    -- Control contable
    contabilidad_revertida BOOLEAN DEFAULT FALSE,
    asiento_reversion_id BIGINT,
    
    -- Auditoría
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    approved_by VARCHAR(100),
    approved_at DATETIME,
    
    INDEX idx_nc_tenant (tenant_id),
    INDEX idx_nc_invoice_ref (invoice_id_referencia),
    INDEX idx_nc_numero (numero_nota_credito),
    INDEX idx_nc_estado (estado),
    INDEX idx_nc_cufe (cufe(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: nota_credito_items
-- ============================================================================

CREATE TABLE IF NOT EXISTS nota_credito_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nota_credito_id BIGINT NOT NULL,
    numero_linea INT,
    
    -- Producto
    productId BIGINT NOT NULL,
    productName VARCHAR(500) NOT NULL,
    codigo_producto VARCHAR(100),
    descripcion TEXT,
    
    -- Cantidades y precios
    quantity INT NOT NULL,
    unitPrice DECIMAL(12,2) NOT NULL,
    subtotal DECIMAL(12,2),
    
    -- DIAN
    unidad_medida_unece VARCHAR(10),
    tipo_impuesto VARCHAR(20),
    porcentaje_impuesto DECIMAL(5,2),
    base_impuesto DECIMAL(12,2),
    impuesto_calculado DECIMAL(12,2),
    valor_descuentos DECIMAL(12,2) DEFAULT 0.00,
    
    -- Total
    total DECIMAL(12,2) NOT NULL,
    
    FOREIGN KEY (nota_credito_id) REFERENCES notas_credito(id) ON DELETE CASCADE,
    INDEX idx_nci_nota (nota_credito_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: notas_debito
-- ============================================================================

CREATE TABLE IF NOT EXISTS notas_debito (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    
    -- Identificación
    numero_nota_debito VARCHAR(50) UNIQUE,
    prefijo_dian VARCHAR(10),
    consecutivo_dian BIGINT,
    cufe VARCHAR(500),
    
    -- Referencia factura
    invoice_id_referencia BIGINT NOT NULL,
    cufe_factura_original VARCHAR(500),
    numero_factura_original VARCHAR(50),
    fecha_factura_original DATE,
    
    -- Motivo
    motivo TEXT NOT NULL,
    codigo_motivo_dian VARCHAR(2),
    
    -- Fechas
    fecha_emision DATE NOT NULL,
    hora_emision TIME,
    
    -- Totales
    subtotal DECIMAL(15,2),
    total_descuentos DECIMAL(15,2) DEFAULT 0.00,
    total_impuestos DECIMAL(15,2),
    total DECIMAL(15,2) NOT NULL,
    
    -- Estado
    estado VARCHAR(20) NOT NULL DEFAULT 'BORRADOR',
    ambiente_dian VARCHAR(1),
    
    -- XML y respuestas
    xml_firmado LONGBLOB,
    xml_respuesta_dian LONGBLOB,
    mensaje_dian TEXT,
    
    -- Control contable
    contabilidad_generada BOOLEAN DEFAULT FALSE,
    asiento_contable_id BIGINT,
    
    -- Auditoría
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    approved_by VARCHAR(100),
    approved_at DATETIME,
    
    INDEX idx_nd_tenant (tenant_id),
    INDEX idx_nd_invoice_ref (invoice_id_referencia),
    INDEX idx_nd_numero (numero_nota_debito),
    INDEX idx_nd_estado (estado),
    INDEX idx_nd_cufe (cufe(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: nota_debito_items
-- ============================================================================

CREATE TABLE IF NOT EXISTS nota_debito_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nota_debito_id BIGINT NOT NULL,
    numero_linea INT,
    
    -- Producto
    productId BIGINT NOT NULL,
    productName VARCHAR(500) NOT NULL,
    codigo_producto VARCHAR(100),
    descripcion TEXT,
    
    -- Cantidades y precios
    quantity INT NOT NULL,
    unitPrice DECIMAL(12,2) NOT NULL,
    subtotal DECIMAL(12,2),
    
    -- DIAN
    unidad_medida_unece VARCHAR(10),
    tipo_impuesto VARCHAR(20),
    porcentaje_impuesto DECIMAL(5,2),
    base_impuesto DECIMAL(12,2),
    impuesto_calculado DECIMAL(12,2),
    valor_descuentos DECIMAL(12,2) DEFAULT 0.00,
    
    -- Total
    total DECIMAL(12,2) NOT NULL,
    
    FOREIGN KEY (nota_debito_id) REFERENCES notas_debito(id) ON DELETE CASCADE,
    INDEX idx_ndi_nota (nota_debito_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- COMENTARIOS
-- ============================================================================

ALTER TABLE notas_credito COMMENT = 'Notas de Crédito Electrónicas DIAN UBL 2.1';
ALTER TABLE notas_debito COMMENT = 'Notas de Débito Electrónicas DIAN UBL 2.1';

-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================
