-- Create departamentos table
CREATE TABLE IF NOT EXISTS departamentos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    cod_dane VARCHAR(5) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    estado BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create ciudades table
CREATE TABLE IF NOT EXISTS ciudades (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    cod_dane VARCHAR(10) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    departamento_cod VARCHAR(5) NOT NULL,
    estado BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_ciudad_depto FOREIGN KEY (departamento_cod) REFERENCES departamentos(cod_dane)
);

-- Basic Seed Data
INSERT IGNORE INTO departamentos (cod_dane, nombre) VALUES 
('05', 'Antioquia'),
('08', 'Atlántico'),
('11', 'Bogotá D.C.'),
('13', 'Bolívar'),
('15', 'Boyacá'),
('17', 'Caldas'),
('18', 'Caquetá'),
('19', 'Cauca'),
('20', 'Cesar'),
('23', 'Córdoba'),
('25', 'Cundinamarca'),
('27', 'Chocó'),
('41', 'Huila'),
('44', 'La Guajira'),
('47', 'Magdalena'),
('50', 'Meta'),
('52', 'Nariño'),
('54', 'Norte de Santander'),
('63', 'Quindío'),
('66', 'Risaralda'),
('68', 'Santander'),
('70', 'Sucre'),
('73', 'Tolima'),
('76', 'Valle del Cauca');

INSERT IGNORE INTO ciudades (cod_dane, nombre, departamento_cod) VALUES 
('05001', 'Medellín', '05'),
('05002', 'Abejorral', '05'),
('05004', 'Abriaquí', '05'),
('08001', 'Barranquilla', '08'),
('11001', 'Bogotá', '11'),
('13001', 'Cartagena', '13'),
('17001', 'Manizales', '17'),
('66001', 'Pereira', '66'),
('68001', 'Bucaramanga', '68'),
('76001', 'Cali', '76');
