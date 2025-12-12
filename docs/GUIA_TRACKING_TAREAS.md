# 🎯 SISTEMA DE TRACKING DE TAREAS - Contabilidad

## 📊 CÓMO USAR ESTE SISTEMA

### **1. Visualizar Progreso**
El documento `TAREAS_CONTABILIDAD_PROMPTS.md` muestra en tiempo real:
- Total de tareas completadas vs pendientes
- Progreso por fase
- Próxima tarea a realizar

### **2. Trabajar en una Tarea**

**ANTES de empezar:**
```markdown
## [ ] TAREA 1.1: Servicio Libro Diario
**Estado:** ⏳ Pendiente  
**Inicio:** --/--/----
```

**AL EMPEZAR (cambiar):**
```markdown
## [🔄] TAREA 1.1: Servicio Libro Diario
**Estado:** 🔄 En Progreso  
**Inicio:** 11/12/2025
```

**AL COMPLETAR (cambiar):**
```markdown
## [x] TAREA 1.1: Servicio Libro Diario
**Estado:** ✅ Completada  
**Inicio:** 11/12/2025
**Fin:** 13/12/2025
```

### **3. Marcar Criterios de Aceptación**

Durante el desarrollo, ir marcando cada criterio:
```markdown
**Criterios de aceptación:**
- [x] Service creado con método getLibroDiario()
- [x] DTO LibroDiarioDTO definido
- [ ] Ordenamiento cronológico funciona  ← Pendiente
- [ ] Cálculo de totales correcto
- [ ] Filtros implementados
```

### **4. Actualizar Progreso General**

En la sección de ESTADO ACTUAL, actualizar manualmente:

```markdown
**Última actualización:** 2025-12-13 15:30  
**Tareas completadas:** 1/29  
**Progreso general:** █░░░░░░░░░ 3.4%

### **Próxima tarea a realizar:**
➡️ **TAREA 1.2: Servicio Libro Mayor**
```

Y actualizar el progreso por fase:
```markdown
FASE 1: Backend - Libros Contables     [█░░░] 1/4 tareas  ← 25%
```

---

## 🔄 ESTADOS POSIBLES

| Símbolo | Estado | Descripción |
|---------|--------|-------------|
| `[ ]` | ⏳ Pendiente | No iniciada |
| `[🔄]` | 🔄 En Progreso | Actualmente trabajando |
| `[⚠️]` | ⚠️ Bloqueada | Esperando dependencia |
| `[x]` | ✅ Completada | Finalizada y revisada |
| `[❌]` | ❌ Cancelada | No se realizará |

---

## 📋 EJEMPLO COMPLETO DE SEGUIMIENTO

### **Escenario: Completando TAREA 1.1**

**1. Estado Inicial:**
```markdown
## [ ] TAREA 1.1: Servicio Libro Diario
**Estado:** ⏳ Pendiente  
**Inicio:** --/--/----  
**Fin:** --/--/----
```

**2. Inicio de Trabajo (11/12/2025):**
```markdown
## [🔄] TAREA 1.1: Servicio Libro Diario
**Estado:** 🔄 En Progreso  
**Inicio:** 11/12/2025  
**Fin:** --/--/----
```

**3. Durante Desarrollo:**
```markdown
**Criterios de aceptación:**
- [x] Service creado con método getLibroDiario()
- [x] DTO LibroDiarioDTO definido
- [🔄] Ordenamiento cronológico funciona  ← Trabajando
- [ ] Cálculo de totales correcto
- [ ] Filtros implementados
```

**4. Tarea Completada (13/12/2025):**
```markdown
## [x] TAREA 1.1: Servicio Libro Diario
**Estado:** ✅ Completada  
**Inicio:** 11/12/2025  
**Fin:** 13/12/2025

**Criterios de aceptación:**
- [x] Service creado con método getLibroDiario()
- [x] DTO LibroDiarioDTO definido
- [x] Ordenamiento cronológico funciona
- [x] Cálculo de totales correcto
- [x] Filtros implementados

**Notas:**
- Tests pasando 100%
- Code review aprobado por Jorge
- Deploy a staging exitoso
```

---

## 📈 CALCULAR PROGRESO

### **Progreso por Fase:**
```
Tareas completadas en Fase / Total tareas en Fase = %

Ejemplo:
Fase 1: 2/4 = 50% → [██░░]
```

### **Progreso General:**
```
Total tareas completadas / 29 tareas = %

Ejemplo:
5/29 = 17.2% → [█░░░░░░░░░]
```

### **Barras de Progreso:**
```
0-10%   [█░░░░░░░░░]
11-20%  [██░░░░░░░░]
21-30%  [███░░░░░░░]
31-40%  [████░░░░░░]
41-50%  [█████░░░░░]
51-60%  [██████░░░░]
61-70%  [███████░░░]
71-80%  [████████░░]
81-90%  [█████████░]
91-100% [██████████]
```

---

## 🎯 WORKFLOW RECOMENDADO

```
1. Abrir TAREAS_CONTABILIDAD_PROMPTS.md
   ↓
2. Ver "Próxima tarea a realizar"
   ↓
3. Marcar tarea como [🔄] En Progreso
   ↓
4. Copiar el PROMPT de la tarea
   ↓
5. Desarrollar siguiendo requisitos
   ↓
6. Marcar criterios [x] conforme se completan
   ↓
7. Al finalizar, marcar tarea como [x] Completada
   ↓
8. Actualizar progreso general y por fase
   ↓
9. Buscar siguiente tarea [ ] Pendiente
   ↓
10. Repetir proceso
```

---

## 🔍 BUSCAR PRÓXIMA TAREA

**En VS Code:**
1. Abrir `TAREAS_CONTABILIDAD_PROMPTS.md`
2. Presionar `Ctrl+F`
3. Buscar: `## [ ] TAREA`
4. Primera coincidencia = Próxima tarea

**En terminal:**
```bash
# Linux/Mac
grep -n "## \[ \] TAREA" TAREAS_CONTABILIDAD_PROMPTS.md | head -1

# PowerShell
Select-String "## \[ \] TAREA" TAREAS_CONTABILIDAD_PROMPTS.md | Select-Object -First 1
```

---

## 📝 PLANTILLA DE COMMIT

Al completar una tarea, usar este formato de commit:

```bash
git commit -m "✅ [TAREA 1.1] Servicio Libro Diario completado

- Implementado LibroDiarioService
- Creado LibroDiarioDTO
- Tests unitarios (cobertura 85%)
- Endpoints expuestos en controller

Closes #123"
```

---

## 🎉 CELEBRAR HITOS

### **Fase Completada:**
```markdown
# ✅ FASE 1: BACKEND - LIBROS CONTABLES COMPLETADA! 🎉

**Fecha de inicio:** 11/12/2025
**Fecha de fin:** 20/12/2025
**Duración:** 9 días (estimado: 10 días)
**Tareas:** 4/4 ✅

**Logros:**
- Libro Diario funcional
- Libro Mayor implementado
- API REST completa
- Tests con 90% cobertura

**Próximo:** Iniciar FASE 2 - Estados Financieros
```

---

**Última actualización:** 2025-12-11  
**Versión:** 1.0  
**Mantenido por:** CloudFly Team
