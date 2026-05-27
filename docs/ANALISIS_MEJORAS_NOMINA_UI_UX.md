# 📊 Análisis de Mejoras UI/UX - Módulo de Nómina CloudFly

## 🎯 Objetivo
Crear un módulo de nómina con UI/UX de nivel profesional, similar o mejor que Alegra, Siigo y Actualícese, intuitivo y fácil de usar.

---

## ✅ Lo que YA tenemos implementado

| Funcionalidad | Estado | Página |
|--------------|--------|--------|
| Gestión de Empleados | ✅ Completo | `/hr/employees` |
| Conceptos de Nómina | ✅ Básico | `/hr/concepts` |
| Periodos de Nómina | ✅ Funcional | `/hr/periods` |
| Procesar Nómina (Stepper) | ✅ Funcional | `/hr/process` |
| Recibos de Nómina | ✅ **MEJORADO** | `/hr/receipts` |
| Configuración | ✅ Nuevo | `/hr/config` |
| Envío de Colillas por Email | ✅ **FUNCIONAL** | Integrado en Recibos |
| Campos Colombia (EPS, ARL, AFP) | ✅ Backend + Form | En `EmployeeFormDialog` |
| **🆕 Dashboard de Nómina** | ✅ **NUEVO** | `/hr/dashboard` |
| **🆕 Perfil de Empleado con Tabs** | ✅ **NUEVO** | `/hr/employees/[id]` |

### Mejoras Implementadas (17/12/2024):

#### 1. Dashboard de Nómina (`/hr/dashboard`) ✅
- Widget de Nómina del Mes con tendencia vs mes anterior
- Widget de Seguridad Social (Salud + Pensión + ARL)
- Widget de Parafiscales (SENA + ICBF + CCF)
- Widget de Empleados Activos
- Sección de Alertas y Recordatorios (primas, cesantías)
- Últimas Nóminas Procesadas
- Accesos Rápidos a todas las secciones

#### 2. Página de Recibos Mejorada (`/hr/receipts`) ✅
- Cards de resumen (Percepciones, Deducciones, Neto, Empleados)
- Barra de búsqueda por empleado o recibo
- Botones funcionales: Descargar PDF, Enviar Email
- Modal de vista previa con detalle del recibo
- Botón "Enviar Todas por Email" para envío masivo
- Feedback con Snackbar de éxito/error

#### 3. Perfil de Empleado con Tabs (`/hr/employees/[id]`) ✅
- Tab Datos Personales (contacto, dirección)
- Tab Datos Laborales (cargo, salario, banco)
- Tab Seguridad Social (EPS, ARL, AFP, Cesantías Colombia)
- Tab Historial de Nómina (últimos recibos)
- Header con Avatar, Estado, y Resumen Salarial
- Filas de empleados clicables desde lista

---

## ❌ Lo que FALTA implementar

### 🔴 CRÍTICO - Liquidación de Nómina Colombia

#### 1. **Dashboard de Nómina con Resumen Visual**
**Referencia:** Alegra tiene un dashboard con widgets
- [ ] Widget de **Nómina del Mes** (total a pagar)
- [ ] Widget de **Aportes Seguridad Social** (salud, pensión, ARL)
- [ ] Widget de **Parafiscales** (SENA, ICBF, Caja Compensación)
- [ ] Widget de **Prestaciones Acumuladas** (cesantías, primas)
- [ ] Gráfico de **Histórico por Período**
- [ ] Alertas de **concepto próximo a vencer** (pago de primas, cesantías)

```
UI Sugerida:
┌─────────────────────────────────────────────────────────────┐
│  💰 NÓMINA DEL MES     │  🏥 SEGURIDAD SOCIAL  │  📊 PARAFISCALES  │
│  $12,500,000           │  $2,100,000           │  $560,000         │
│  ↑ 3% vs mes anterior  │  Salud + Pensión + ARL│  SENA + ICBF + CCF │
├─────────────────────────────────────────────────────────────┤
│  📉 HISTÓRICO DE NÓMINA (6 meses)                           │
│  [────▄───▄▄▄──▄▄▄▄▄──▄▄▄▄▄▄──]                            │
│   Jul   Ago   Sep   Oct   Nov   Dic                         │
└─────────────────────────────────────────────────────────────┘
```

#### 2. **Calculadora de Liquidación Colombia**
**Referencia:** [Actualícese - Calculadoras](https://actualicese.com/nomina/)
- [ ] **Liquidador de Salario**: Calcular IBC, deducciones
- [ ] **Liquidador de Prima de Servicios** (junio y diciembre)
- [ ] **Liquidador de Cesantías** (31 dic y terminación contrato)
- [ ] **Liquidador de Intereses de Cesantías** (31 enero)
- [ ] **Liquidador de Vacaciones** (15 días hábiles/año)
- [ ] **Liquidador de Contrato** (liquidación final)

**Fórmulas clave Colombia 2025:**
```
Prima de Servicios = (Salario + Aux. Transporte) × Días trabajados / 360
Cesantías = (Salario + Aux. Transporte) × Días trabajados / 360
Intereses Cesantías = Cesantías × Días × 12% / 360
Vacaciones = Salario base × 15 / 360
```

#### 3. **Porcentajes Colombia 2025**
```
CONCEPTO                  | EMPLEADOR | TRABAJADOR | TOTAL
--------------------------|-----------|------------|-------
Salud                     | 8.5%      | 4%         | 12.5%
Pensión                   | 12%       | 4%         | 16%
ARL (Riesgo I)            | 0.522%    | -          | 0.522%
SENA                      | 2%        | -          | 2%
ICBF                      | 3%        | -          | 3%
Caja de Compensación      | 4%        | -          | 4%
Auxilio de Transporte 2025| $200,000 (aprox)        | -
SMMLV 2025               | $1,423,500             | -
```

---

### 🟠 IMPORTANTE - Mejoras de UI/UX

#### 4. **Página de Recibos Mejorada**
- [ ] **Modal de detalle del recibo** (expandible)
- [ ] **Vista previa del PDF** en modal
- [ ] **Botón "Enviar por Email"** funcional (conectar con backend)
- [ ] **Botón "Enviar por WhatsApp"** (futuro)
- [ ] **Descargar colillas masivas** como ZIP
- [ ] **Filtros avanzados** (por empleado, estado, fecha)
- [ ] **Búsqueda rápida**

#### 5. **Proceso de Nómina Visual (Tipo Wizard)**
Mejorar el Stepper actual:
- [ ] Agregar **icono visual** a cada paso
- [ ] Mostrar **resumen de valores** en cada paso
- [ ] Agregar **paso de revisión detallada** antes de aprobar
- [ ] Mostrar **diferencias vs periodo anterior** (comparativa)
- [ ] Agregar **comentarios/notas** al aprobar
- [ ] **Botón de Reprocesar** si hay cambios

#### 6. **Ficha del Empleado Completa** (Card visual)
Cambiar de formulario modal a **página completa**:
- [ ] Pestaña **Datos Personales**
- [ ] Pestaña **Datos Laborales**
- [ ] Pestaña **Seguridad Social** (EPS, ARL, AFP, Cesantías)
- [ ] Pestaña **Historial de Nómina** (últimos recibos)
- [ ] Pestaña **Novedades** (incapacidades, licencias, horas extra)
- [ ] Avatar/Foto del empleado
- [ ] Estado visual (activo/inactivo)

---

### 🟡 MEJORAS ADICIONALES

#### 7. **Gestión de Novedades**
**Referencia:** Alegra tiene módulo de novedades
- [ ] **Incapacidades** (enfermedad común, laboral, maternidad)
- [ ] **Licencias** (maternidad, paternidad, luto, matrimonio)
- [ ] **Horas Extra** (diurnas, nocturnas, festivos)
- [ ] **Recargos Nocturnos**
- [ ] **Comisiones**
- [ ] **Préstamos a empleados** (descuento automático)
- [ ] **Libranzas**
- [ ] **Embargos judiciales**

#### 8. **Calendario de Nómina Visual**
- [ ] Vista mensual tipo calendario
- [ ] Marcar fechas de pago
- [ ] Alertas de vencimientos (primas, cesantías)
- [ ] Drag & drop para fechas de pago

#### 9. **Reportes y Exportaciones**
- [ ] **Reporte de nómina por período** (Excel, PDF)
- [ ] **Reporte de aportes seguridad social**
- [ ] **Reporte de parafiscales**
- [ ] **Certificado laboral** (generación automática)
- [ ] **Archivo plano PILA** (para pago seguridad social)
- [ ] **Formato 220 DIAN** (certificado de ingresos y retenciones)

#### 10. **Integración Contable Automática**
- [ ] Generar póliza contable automáticamente al aprobar nómina
- [ ] Configurar cuentas por defecto
- [ ] Mostrar preview del asiento antes de generar

---

## 🎨 MEJORAS DE DISEÑO UI

### Paleta de Colores Sugerida (Estilo Alegra)
```css
--primary: #00897B;       /* Teal - Principal */
--secondary: #455A64;     /* Gris azulado */
--success: #4CAF50;       /* Verde - Percepciones */
--error: #F44336;         /* Rojo - Deducciones */
--warning: #FF9800;       /* Naranja - Alertas */
--background: #FAFAFA;    /* Fondo claro */
--card-shadow: 0 2px 8px rgba(0,0,0,0.1);
```

### Componentes a Implementar
- [ ] **Cards con glassmorphism** (efecto cristal)
- [ ] **Tablas con filas alternadas** y hover suave
- [ ] **Badges/Chips** con colores semánticos
- [ ] **Tooltips informativos** en campos complejos
- [ ] **Skelleton loaders** (carga animada)
- [ ] **Animaciones suaves** en transiciones
- [ ] **Dark mode** completo
- [ ] **Responsive** para tablet/móvil

---

## 📱 PÁGINAS NUEVAS SUGERIDAS

| Página | Ruta | Prioridad |
|--------|------|-----------|
| Dashboard Nómina | `/hr/dashboard` | 🔴 Alta |
| Novedades | `/hr/novedades` | 🟠 Media |
| Liquidador | `/hr/liquidador` | 🟠 Media |
| Reportes | `/hr/reports` | 🟡 Baja |
| Calendario | `/hr/calendar` | 🟡 Baja |
| Perfil Empleado | `/hr/employees/[id]` | 🔴 Alta |

---

## ⏱️ PLAN DE IMPLEMENTACIÓN SUGERIDO

### Fase 1: Dashboard y Visualización (1-2 días)
1. Crear página `/hr/dashboard` con widgets
2. Agregar gráficos con Recharts
3. Mostrar resumen de nómina actual

### Fase 2: Mejoras UI Recibos (1 día)
1. Modal de detalle con vista previa PDF
2. Conectar botones de envío email
3. Agregar búsqueda y filtros

### Fase 3: Perfil Empleado (1-2 días)
1. Crear página dinámica `/hr/employees/[id]`
2. Diseño con tabs/pestañas
3. Historial de recibos por empleado

### Fase 4: Novedades (2-3 días)
1. CRUD de novedades
2. Tipos: incapacidades, licencias, horas extra
3. Integración con cálculo de nómina

### Fase 5: Liquidadores Colombia (2 días)
1. Calculadora de prestaciones
2. Liquidación de contrato
3. Fórmulas actualizadas 2025

---

## ✅ CHECKLIST DE PRIORIDADES

### 🔴 Inmediato (esta semana)
- [ ] Dashboard con widgets de resumen
- [ ] Conectar botones de email en recibos
- [ ] Modal de vista previa de colilla

### 🟠 Corto plazo (2 semanas)
- [ ] Página de perfil de empleado con tabs
- [ ] Módulo de novedades (incapacidades, horas extra)
- [ ] Calculadora de prestaciones Colombia

### 🟡 Mediano plazo (1 mes)
- [ ] Reportes exportables (Excel, PDF)
- [ ] Calendario visual
- [ ] Integración contable automática
- [ ] Dark mode

---

**Documento creado:** 2025-12-17  
**Referencia:** Alegra Colombia, Siigo, Actualícese
