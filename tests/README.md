# 🧪 CloudFly Automated Tests

Tests automatizados con Selenium para el módulo de Recursos Humanos.

## 📋 Requisitos

- Python 3.8+
- Google Chrome instalado
- Backend corriendo en `http://localhost:8080`
- Frontend corriendo en `http://localhost:3000`

## 🚀 Instalación

```bash
cd tests
pip install -r requirements.txt
```

## ⚙️ Configuración

1. Copia `.env.example` a `.env`:
```bash
copy .env.example .env
```

2. Edita `.env` con tus credenciales:
```
USERNAME=edwing2022
PASSWORD=Edwin2025*
```

## 🏃 Ejecutar Tests

### Todos los tests
```bash
pytest
```

### Test específico
```bash
pytest test_01_login.py
```

### Con reporte HTML
```bash
pytest --html=logs/report.html
```

### En modo headless (sin interfaz gráfica)
```bash
# Edita .env y pon HEADLESS=true
pytest
```

## 📊 Tests Disponibles

### test_01_login.py
- ✅ TC-001: Cargar página de login
- ✅ TC-002: Login exitoso
- ✅ TC-003: Login inválido

### test_02_employees.py
- ✅ TC-101: Navegar a empleados
- ✅ TC-102: Ver lista de empleados
- ✅ TC-103: Abrir diálogo de crear empleado
- ✅ TC-104: Crear empleado completo (UC-001)
- ✅ TC-105: Activar/Desactivar empleado (UC-004)

### test_03_payroll_processing.py
- ✅ TC-201: Navegar a periodos
- ✅ TC-202: Crear periodo (UC-101)
- ✅ TC-203: Navegar a procesamiento
- ✅ TC-204: Calcular nómina (UC-102)
- ✅ TC-205: Aprobar nómina (UC-104)
- ✅ TC-206: Registrar pago (UC-105)
- ✅ TC-207: Ver recibos (UC-103)

## 📁 Estructura

```
tests/
├── conftest.py              # Configuración de pytest y fixtures
├── test_01_login.py         # Tests de login
├── test_02_employees.py     # Tests de empleados
├── test_03_payroll_processing.py  # Tests de nómina
├── requirements.txt         # Dependencias Python
├── .env.example            # Template de variables
├── pytest.ini              # Configuración de pytest
├── logs/                   # Logs y reportes
│   ├── test_run_*.log     # Logs detallados
│   ├── report.html        # Reporte HTML
│   └── *.png              # Screenshots de fallos
└── README.md              # Esta guía
```

## 📝 Logs

Todos los tests generan logs detallados en `logs/`:

- **test_run_YYYYMMDD_HHMMSS.log**: Log completo de la ejecución
- **failure_*.png**: Screenshots de tests fallidos
- **report.html**: Reporte HTML con resultados

## 🔍 Debugging

Si un test falla:

1. Revisa el log en `logs/test_run_*.log`
2. Busca el screenshot en `logs/failure_*.png`
3. Ejecuta el test individual con `-s` para ver output:
   ```bash
   pytest test_02_employees.py::TestEmployees::test_create_employee_complete_flow -s
   ```

## ✅ Verificar que todo funciona

```bash
# 1. Generar datos demo
pytest -k "demo_data"

# 2. Ejecutar smoke tests (rápidos)
pytest -m smoke

# 3. Ejecutar todos los tests
pytest

# 4. Ver reporte
start logs/report.html  # Windows
# o
open logs/report.html   # Mac/Linux
```

## 🐛 Solución de Problemas

### ChromeDriver not found
```bash
pip install --upgrade webdriver-manager
```

### Timeout errors
- Aumenta el `implicitly_wait` en `conftest.py`
- Verifica que el frontend/backend estén corriendo

### Login fails
- Verifica credenciales en `.env`
- Revisa screenshot en `logs/login_failure.png`

## 📊 CI/CD

Para integrar en CI/CD:

```yaml
# GitHub Actions example
- name: Run tests
  run: |
    cd tests
    pip install -r requirements.txt
    pytest --html=report.html
```

---

**Fecha de creación:** 2025-12-16  
**Módulo:** HR & Payroll  
**Autor:** Automated Testing Suite
