# 📋 CUSTOMER DIAN - DOCUMENTACIÓN CAMPOS FACTURACIÓN ELECTRÓNICA

## 🎯 Resumen

La entidad `Customer` ha sido actualizada para soportar **facturación electrónica DIAN** con todos los campos obligatorios del anexo técnico UBL 2.1 de Colombia.

---

## ✅ CAMBIOS REALIZADOS

### 1. **Campos Originales** - MANTENIDOS
Todos los campos existentes se mantienen sin cambios:
- `id, name, nit, phone, email, address, contact, position`
- `type, status, logoUrl, dateRegister`
- `businessType, businessDescription`

### 2. **Nuevos Campos DIAN** - AGREGADOS

> **NOTA IMPORTANTE**: En esta aplicación, el campo `id` de la entidad Customer ya representa el `tenant_id`. No se agregó un campo `tenantId` adicional.

#### 📌 Identificación Tributaria
| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `tipoDocumentoDian` | VARCHAR(2) | Tipo de documento DIAN | `31` (NIT) |
| `digitoVerificacion` | VARCHAR(1) | Dígito de verificación | `7` |

**Códigos tipo documento:**
- `31` = NIT (Número de Identificación Tributaria)
- `13` = Cédula de Ciudadanía
- `22` = Cédula de Extranjería
- `41` = Pasaporte
- `42` = Documento de identificación extranjero

#### 📌 Nombres Legales
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `razonSocial` | VARCHAR(450) | Razón social legal registrada |
| `nombreComercial` | VARCHAR(450) | Nombre comercial (marca) |

#### 📌 Responsabilidades Fiscales
| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `responsabilidadesFiscales` | VARCHAR(500) | Responsabilidades separadas por coma | `R-99-PN,O-13,O-15` |
| `regimenFiscal` | VARCHAR(20) | Régimen fiscal | `COMUN, SIMPLE, ESPECIAL` |
| `obligacionesDian` | VARCHAR(500) | Obligaciones DIAN | `O-13,O-15,O-23` |

**Responsabilidades Fiscales Comunes:**
- `R-99-PN` = Responsable del IVA (Persona Natural)
- `O-13` = Gran Contribuyente
- `O-15` = Autorretenedor
- `O-23` = Agente de retención en el impuesto sobre las ventas
- `O-47` = Régimen Simple de Tributación

#### 📌 Ubicación Geográfica
| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `codigoDaneCiudad` | VARCHAR(5) | Código DANE ciudad | `11001` (Bogotá) |
| `ciudadDian` | VARCHAR(100) | Nombre ciudad | `Bogotá D.C.` |
| `codigoDaneDepartamento` | VARCHAR(2) | Código DANE departamento | `11` (Cundinamarca) |
| `departamentoDian` | VARCHAR(100) | Nombre departamento | `Cundinamarca` |
| `paisCodigo` | VARCHAR(2) | Código país | `CO` |
| `paisNombre` | VARCHAR(100) | Nombre país | `Colombia` |
| `codigoPostal` | VARCHAR(10) | Código postal | `110111` |

**Códigos DANE Principales:**
- `11001` = Bogotá D.C.
- `05001` = Medellín
- `76001` = Cali
- `08001` = Barranquilla
- `13001` = Cartagena

#### 📌 Información Económica
| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `actividadEconomicaCiiu` | VARCHAR(10) | Código CIIU | `4651` (Comercio al por mayor de computadores) |
| `actividadEconomicaDescripcion` | VARCHAR(500) | Descripción actividad | `Venta de software` |

#### 📌 Contacto Facturación
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `emailFacturacionDian` | VARCHAR(255) | Email para recibir facturas electrónicas |
| `sitioWeb` | VARCHAR(255) | URL del sitio web |

#### 📌 Representante Legal
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `representanteLegalNombre` | VARCHAR(255) | Nombre completo |
| `representanteLegalTipoDoc` | VARCHAR(2) | Tipo de documento |
| `representanteLegalNumeroDoc` | VARCHAR(20) | Número de documento |

#### 📌 Configuración FE
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `esEmisorFE` | BOOLEAN | Indica si es emisor de facturas electrónicas |
| `esEmisorPrincipal` | BOOLEAN | Indica si es el emisor principal del tenant |
| `notasDian` | TEXT | Notas internas sobre configuración |

#### 📌 Multi-tenancy y Auditoría
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `tenantId` | BIGINT | ID del tenant |
| `createdAt` | DATETIME | Fecha de creación |
| `updatedAt` | DATETIME | Fecha de última actualización |

---

## 🔧 MÉTODOS AUXILIARES AGREGADOS

### `getNitCompleto()`
Retorna el NIT con dígito de verificación en formato estándar.
```java
customer.getNitCompleto(); // "900123456-7"
```

### `getResponsabilidadesFiscalesArray()`
Retorna las responsabilidades como array.
```java
String[] resp = customer.getResponsabilidadesFiscalesArray(); 
// ["R-99-PN", "O-13", "O-15"]
```

### `getObligacionesDianArray()`
Retorna las obligaciones como array.
```java
String[] oblig = customer.getObligacionesDianArray();
// ["O-13", "O-15"]
```

### `getNombreParaFacturacion()`
Retorna el nombre más apropiado para facturación (prioriza razón social).
```java
customer.getNombreParaFacturacion(); // "EMPRESA S.A.S."
```

### `tieneConfiguracionDianCompleta()`
Valida si tiene datos mínimos para facturar electrónicamente.
```java
if (customer.tieneConfiguracionDianCompleta()) {
    // Puede emitir facturas electrónicas
}
```

---

## 📊 EJEMPLO DE USO

### Crear Customer como Emisor DIAN

```java
Customer emisor = Customer.builder()
    // Datos básicos
    .name("Mi Empresa S.A.S.")
    .tenantId(1L)
    .status(true)
    
    // Identificación DIAN
    .tipoDocumentoDian("31")  // NIT
    .nit("900123456")
    .digitoVerificacion("7")
    
    // Nombres
    .razonSocial("MI EMPRESA S.A.S.")
    .nombreComercial("Mi Empresa")
    
    // Responsabilidades
    .responsabilidadesFiscales("R-99-PN,O-15")
    .regimenFiscal("COMUN")
    .obligacionesDian("O-13,O-15")
    
    // Ubicación
    .address("Calle 123 #45-67")
    .codigoDaneCiudad("11001")
    .ciudadDian("Bogotá D.C.")
    .codigoDaneDepartamento("11")
    .departamentoDian("Cundinamarca")
    .paisCodigo("CO")
    .codigoPostal("110111")
    
    // Económica
    .actividadEconomicaCiiu("4651")
    .actividadEconomicaDescripcion("Comercio al por mayor de computadores")
    
    // Contacto
    .phone("+57 1 234 5678")
    .email("contacto@miempresa.com")
    .emailFacturacionDian("facturacion@miempresa.com")
    .sitioWeb("https://www.miempresa.com")
    
    // Representante
    .representanteLegalNombre("Juan Pérez")
    .representanteLegalTipoDoc("13")
    .representanteLegalNumeroDoc("123456789")
    
    // Configuración FE
    .esEmisorFE(true)
    .esEmisorPrincipal(true)
    
    .build();
```

---

## 🗄️ MIGRACIÓN DE DATOS

Para actualizar la base de datos, ejecutar:

```bash
mysql -u root -p cloudfly_erp < backend/db/migration_customer_dian_fields.sql
```

O desde MySQL Workbench:
1. Abrir el archivo `migration_customer_dian_fields.sql`
2. Ejecutar el script completo

---

## ✅ VALIDACIONES RECOMENDADAS

### En el Frontend (Formularios)

```typescript
const validarEmisorDian = (data: Customer) => {
    const errores = [];
    
    if (!data.tipoDocumentoDian) errores.push("Tipo de documento es obligatorio");
    if (!data.nit) errores.push("NIT es obligatorio");
    if (data.tipoDocumentoDian === '31' && !data.digitoVerificacion) {
        errores.push("Dígito de verificación es obligatorio para NIT");
    }
    if (!data.razonSocial) errores.push("Razón social es obligatoria");
    if (!data.address) errores.push("Dirección es obligatoria");
    if (!data.ciudadDian) errores.push("Ciudad es obligatoria");
    if (!data.departamentoDian) errores.push("Departamento es obligatorio");
    if (!data.emailFacturacionDian && !data.email) {
        errores.push("Email es obligatorio");
    }
    
    return errores;
};
```

---

## 🎯 PRÓXIMOS PASOS

1. ✅ Ejecutar migración SQL
2. ⏳ Actualizar DTOs del frontend
3. ⏳ Crear formulario de configuración DIAN
4. ⏳ Integrar con módulo de facturación electrónica
5. ⏳ Agregar validaciones en el backend

---

## 📚 REFERENCIAS

- [Anexo Técnico UBL 2.1 DIAN](https://www.dian.gov.co/impuestos/factura-electronica/Documents/Anexo_técnico_factura_electr%C3%B3nica_vr_1_7_2020.pdf)
- [Códigos DANE](https://www.dane.gov.co/index.php/sistema-estadistico-nacional-sen/normas-y-estandares/nomenclaturas-y-clasificaciones)
- [Responsabilidades Fiscales DIAN](https://www.dian.gov.co/impuestos/personas/Responsabilidades_Fiscales_Paginas/Responsabilidades.aspx)

---

**Actualización:** 29 de Diciembre de 2024  
**Versión:** 1.0.0
