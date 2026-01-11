-- ============================================================================
-- MIGRACIÓN: Proveedor y Documento Soporte DIAN
-- Descripción: Crea tablas para proveedores y documentos soporte de compras
-- Fecha: 2024-12-29
-- ============================================================================

USE cloudfly_erp;

-- ============================================================================
-- TABLA: proveedores
-- ============================================================================

CREATE TABLE IF NOT EXISTS proveedores (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    
    -- Identificación
    tipo_documento VARCHAR(2) NOT NULL COMMENT '13=CC, 22=CE, 31=NIT',
    numero_documento VARCHAR(20) NOT NULL,
    dv VARCHAR(1) COMMENT 'Dígito verificación',
    
    -- Nombres
    razon_social VARCHAR(450) NOT NULL,
    nombre_comercial VARCHAR(450),
    
    -- Contacto
    direccion VARCHAR(500),
    telefono VARCHAR(50),
    email VARCHAR(255),
    
    -- Ubicación
    codigo_dane_ciudad VARCHAR(5),
    ciudad VARCHAR(100),
    codigo_dane_departamento VARCHAR(2),
    departamento VARCHAR(100),
    pais VARCHAR(2) DEFAULT 'CO',
    
    -- Información fiscal
    responsabilidades_fiscales VARCHAR(500),
    regimen_fiscal VARCHAR(20),
    
    -- Control
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    es_facturador_electronico BOOLEAN DEFAULT FALSE,
    notas TEXT,
    
    -- Auditoría
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    
    UNIQUE KEY uk_tenant_nit_proveedor (tenant_id, numero_documento),
    INDEX idx_prov_tenant (tenant_id),
    INDEX idx_prov_nit (numero_documento),
    INDEX idx_prov_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: documentos_soporte
-- ============================================================================

CREATE TABLE IF NOT EXISTS documentos_soporte (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    
    -- Identificación documento
    numero_documento VARCHAR(50) UNIQUE NOT NULL,
    prefijo_dian VARCHAR(10),
    consecutivo_dian BIGINT,
    cuds VARCHAR(500) COMMENT 'Código Único Documento Soporte',
    fecha DATE NOT NULL,
    hora_emision TIME,
    
    -- Relación proveedor
    proveedor_id BIGINT,
    
    -- Datos proveedor (snapshot histórico)
    proveedor_tipo_documento VARCHAR(2) NOT NULL,
    proveedor_numero_documento VARCHAR(20) NOT NULL,
    proveedor_dv VARCHAR(1),
    proveedor_razon_social VARCHAR(450) NOT NULL,
    proveedor_direccion VARCHAR(500),
    codigo_dane_ciudad_proveedor VARCHAR(5),
    proveedor_ciudad VARCHAR(100),
    codigo_dane_departamento_proveedor VARCHAR(2),
    proveedor_departamento VARCHAR(100),
    proveedor_pais VARCHAR(2) DEFAULT 'CO',
    proveedor_telefono VARCHAR(50),
    proveedor_email VARCHAR(255),
    cufe_proveedor VARCHAR(500),
    numero_factura_proveedor VARCHAR(50),
    
    -- Totales
    subtotal DECIMAL(15,2) NOT NULL,
    total_descuentos DECIMAL(15,2) DEFAULT 0.00,
    total_cargos DECIMAL(15,2) DEFAULT 0.00,
    base_gravable DECIMAL(15,2),
    total_iva DECIMAL(15,2) DEFAULT 0.00,
    total_impuestos DECIMAL(15,2) DEFAULT 0.00,
    total DECIMAL(15,2) NOT NULL,
    
    -- Estado
    estado VARCHAR(20) NOT NULL DEFAULT 'BORRADOR',
    ambiente_dian VARCHAR(1) DEFAULT '2',
    
    -- XML y respuestas
    xml_firmado LONGBLOB,
    xml_respuesta_dian LONGBLOB,
    mensaje_dian TEXT,
    observaciones TEXT,
    
    -- Control contable
    contabilidad_generada BOOLEAN DEFAULT FALSE,
    asiento_contable_id BIGINT,
    
    -- Auditoría
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    approved_by VARCHAR(100),
    approved_at DATETIME,
    
    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE SET NULL,
    INDEX idx_ds_tenant (tenant_id),
    INDEX idx_ds_numero (numero_documento),
    INDEX idx_ds_proveedor (proveedor_numero_documento),
    INDEX idx_ds_estado (estado),
    INDEX idx_ds_cuds (cuds(255)),
    INDEX idx_ds_fecha (fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: documento_soporte_items
-- ============================================================================

CREATE TABLE IF NOT EXISTS documento_soporte_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    documento_soporte_id BIGINT NOT NULL,
    numero_linea INT,
    
    -- Producto
    product_id BIGINT COMMENT 'ID producto inventario (si aplica)',
    productName VARCHAR(500) NOT NULL,
    codigo_producto VARCHAR(100),
    descripcion TEXT,
    
    -- Cantidades y precios
    quantity INT NOT NULL,
    unitPrice DECIMAL(12,2) NOT NULL,
    subtotal DECIMAL(12,2),
    
    -- DIAN
    unidad_medida_unece VARCHAR(10),
    marca VARCHAR(200),
    modelo VARCHAR(200),
    tipo_impuesto VARCHAR(20),
    tarifa_iva VARCHAR(20),
    porcentaje_impuesto DECIMAL(5,2),
    base_impuesto DECIMAL(12,2),
    impuesto_calculado DECIMAL(12,2),
    valor_descuentos DECIMAL(12,2) DEFAULT 0.00,
    valor_cargos DECIMAL(12,2) DEFAULT 0.00,
    
    -- Total
    total DECIMAL(12,2) NOT NULL,
    
    FOREIGN KEY (documento_soporte_id) REFERENCES documentos_soporte(id) ON DELETE CASCADE,
    INDEX idx_dsi_doc (documento_soporte_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- COMENTARIOS
-- ============================================================================

ALTER TABLE proveedores COMMENT = 'Maestro de proveedores';
ALTER TABLE documentos_soporte COMMENT = 'Documentos Soporte de Adquisiciones DIAN UBL 2.1';
ALTER TABLE documento_soporte_items COMMENT = 'Items de documentos soporte';

-- ============================================================================
-- DATOS DE EJEMPLO (Opcional)
-- ============================================================================

-- Crear proveedor de ejemplo
INSERT IGNORE INTO proveedores (
    tenant_id, tipo_documento, numero_documento, dv, razon_social,
    direccion, ciudad, departamento, telefono, email,
    activo, es_facturador_electronico, created_by
) VALUES (
    1, '31', '900123456', '7', 'PROVEEDOR EJEMPLO S.A.S.',
    'Calle 123 #45-67', 'Bogotá D.C.', 'Cundinamarca',
    '+57 1 234 5678', 'contacto@proveedor.com',
    TRUE, FALSE, 'system'
);

-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================
