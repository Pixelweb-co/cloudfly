# 📄 NÓMINA ELECTRÓNICA DIAN (PAYROLL)

## 🎯 ESTADO ACTUAL

El módulo de nómina ha sido actualizado para cumplir con la **Resolución 000013 de 2021 de la DIAN** (Nómina Electrónica).

### ✅ CARACTERÍSTICAS
- **Cálculos Legales Colombia**: Salud, Pensión, ARL, Parafiscales, Provisiones.
- **Entidad `PayrollReceipt` Actualizada**: Campos específicos para DIAN agregados en sustitución de campos legacy.
- **Soporte CUNE**: Código Único de Nómina Electrónica.
- **Estados DIAN**: Control de flujo PENDING → SENT → ACCEPTED/REJECTED.

---

## 🛠️ CAMBIOS REALIZADOS

### 1. Entidad `PayrollReceipt`
Se eliminaron los campos de facturación mexicana (CFDI) y se agregaron los colombianos:

| Campo Nuevo | Tipo | Descripción |
|-------------|------|-------------|
| `cune` | String | Código Único de Nómina Electrónica (Hash único) |
| `consecutive` | Long | Consecutivo interno para DIAN |
| `payrollType` | String | `102` (Nómina) o `103` (Ajuste) |
| `paymentMethod` | String | Código medio pago (1=Efectivo, 42=Consignación) |
| `dianStatus` | Enum | Estado del envío (PENDING, SENT, ACCEPTED, REJECTED) |
| `dianMessage` | String | Respuesta detallada de la DIAN |
| `xmlDian` | Blob | XML UBL 2.1 firmado |
| `xmlResponse` | Blob | XML ApplicationResponse de la DIAN |
| `qrCode` | String | Cadena QR para el PDF |

---

## 🚀 FLUJO DE NÓMINA ELECTRÓNICA

```mermaid
graph TD
    A[Generar Nómina (LIQUIDATED)] --> B[Generar XML UBL 2.1]
    B --> C[Firmar XML]
    C --> D[Enviar a DIAN]
    D --> E{Respuesta DIAN}
    E -->|Aceptado| F[Estado ACCEPTED]
    E -->|Rechazado| G[Estado REJECTED]
    
    F --> H[Generar PDF Representación Gráfica]
    F --> I[Enviar Email a Empleado]
```

---

## ⚠️ PENDIENTES DE IMPLEMENTACIÓN

Para completar el ciclo de transmisión:

1. **Servicio de Transmisión (`PayrollDianService`)**:
   - Falta crear la clase que orqueste la generación del XML y el consumo del microservicio DIAN.
   
2. **Generación XML**:
   - Falta implementar `PayrollXmlGenerator` que mapee `PayrollReceipt` a la estructura UBL 2.1 estricta.

3. **Notas de Ajuste**:
   - Implementar lógica para tipo `103` (Reemplazar o Eliminar nóminas enviadas).

---

## 🔧 MIGRACIÓN BASE DE DATOS

Ejecutar el script generado para actualizar la estructura:

```sql
mysql -u root -p cloudfly_erp < backend/db/migration_payroll_dian.sql
```

Esto adaptará la tabla `payroll_receipts` eliminando columnas innecesarias y agregando las requeridas por DIAN.
