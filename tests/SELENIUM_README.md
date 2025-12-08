# 🧪 Testing con Selenium - Chat Omnicanal

## 🎯 Propósito

Este sistema de tests con Selenium permite:
- ✅ Verificar que la interfaz funciona correctamente
- ✅ Automatizar pruebas end-to-end
- ✅ Generar screenshots automáticos
- ✅ Validar flujos completos de usuario
- ✅ CI/CD automatizado

---

## 📦 Instalación

### 1. Instalar Python Dependencies

```bash
pip install selenium webdriver-manager
```

### 2. Instalar ChromeDriver

**Opción A - Automático**:
```bash
pip install webdriver-manager
```

**Opción B - Manual**:
1. Descargar ChromeDriver: https://chromedriver.chromium.org/
2. Colocar en PATH del sistema

---

## 🚀 Uso

### Ejecutar Tests Completos

```bash
cd tests
python selenium_chat_test.py
```

### Con Parámetros Personalizados

```bash
# URL personalizada
python selenium_chat_test.py --url https://dashboard.cloudfly.com.co

# Credenciales diferentes
python selenium_chat_test.py --email user@example.com --password mypassword

# Modo headless (sin ventana)
python selenium_chat_test.py --headless

# Todo junto
python selenium_chat_test.py --url http://localhost:3000 --email admin@test.com --password admin123 --headless
```

---

## 📊 Tests Incluidos

El script ejecuta los siguientes tests automáticamente:

1. **Setup**: Inicializar navegador Chrome
2. **Login**: Autenticación en el sistema
3. **Navigate**: Ir a página de conversaciones
4. **Verify Kanban**: Verificar las 3 columnas (LEAD, POTENTIAL, CLIENT)
5. **Verify Connection**: Validar estado de Socket.IO
6. **Open Chat**: Abrir ventana de chat con un contacto
7. **Send Message**: Enviar mensaje de prueba

---

## 📸 Screenshots

Los tests generan screenshots automáticamente:

- `test_final_success.png` - Si todos los tests pasan
- `test_critical_error.png` - Si hay un error crítico
- `error_conversations.png` - Si falla la carga de conversaciones
- `error_open_chat.png` - Si falla abrir el chat
- `error_send_message.png` - Si falla el envío de mensaje

---

## 🔧 Uso Programático

```python
from selenium_chat_test import ChatTester

# Crear instancia
tester = ChatTester(base_url="http://localhost:3000", headless=False)

# Ejecutar tests completos
results = tester.run_full_test()

# O ejecutar tests individuales
tester.setup()
tester.login("admin@cloudfly.com", "admin123")
tester.navigate_to_conversations()
tester.verify_kanban_columns()
tester.click_first_contact()
tester.send_message("Hola desde Selenium!")
tester.take_screenshot("mi_screenshot.png")
tester.teardown()
```

---

## 🐳 Ejecutar con Docker

### docker-compose.selenium.yml

```yaml
version: '3'
services:
  selenium-tests:
    image: selenium/standalone-chrome:latest
    ports:
      - "4444:4444"
      - "7900:7900"  # VNC viewer
    environment:
      - SE_NODE_MAX_SESSIONS=3
      - SE_NODE_SESSION_TIMEOUT=300
    volumes:
      - ./tests:/tests
      - ./screenshots:/screenshots
```

### Ejecutar

```bash
docker-compose -f docker-compose.selenium.yml up -d

# Ejecutar tests
docker exec selenium-tests python /tests/selenium_chat_test.py

# Ver navegador en vivo (VNC)
# Abrir: http://localhost:7900 (password: secret)
```

---

## 🤖 Integración CI/CD

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: UI Tests

on: [push, pull_request]

jobs:
  selenium-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.9'
          
      - name: Install dependencies
        run: |
          pip install selenium webdriver-manager
          
      - name: Start application
        run: |
          docker-compose up -d
          # Esperar que esté listo
          sleep 30
          
      - name: Run tests
        run: |
          python tests/selenium_chat_test.py --headless
          
      - name: Upload screenshots
        if: failure()
        uses: actions/upload-artifact@v2
        with:
          name: test-screenshots
          path: '*.png'
```

---

## 📝 Ejemplo de Salida

```
============================================================
🚀 INICIANDO TESTS DE CHAT OMNICANAL
============================================================

🔐 Realizando login...
✅ Login exitoso
📱 Navegando a Conversaciones...
✅ Página de conversaciones cargada
📊 Verificando columnas del Kanban...
✅ Las 3 columnas están presentes
🔌 Verificando estado de conexión...
✅ Socket.IO conectado
👤 Buscando primer contacto...
✅ Chat window abierto
💬 Enviando mensaje: 'Mensaje de prueba automatizado'
✅ Mensaje enviado
📸 Screenshot guardado: test_final_success.png

============================================================
📊 RESULTADOS DE LOS TESTS
============================================================
✅ PASS - setup
✅ PASS - login
✅ PASS - navigate_conversations
✅ PASS - verify_kanban
✅ PASS - verify_connection
✅ PASS - open_chat
✅ PASS - send_message

Total: 7/7 tests pasaron
============================================================
```

---

## 🔍 Troubleshooting

### Error: ChromeDriver version mismatch
```bash
# Actualizar ChromeDriver
pip install --upgrade webdriver-manager
```

### Error: Element not found
- Verificar que la aplicación esté corriendo
- Aumentar timeouts en el código
- Revisar selectores CSS/XPath

### Tests fallan en headless
- Algunos elementos pueden comportarse diferente
- Intentar con `--window-size=1920,1080`

---

## 🎓 Tips Avanzados

### 1. Esperas Explícitas
```python
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

element = WebDriverWait(driver, 10).until(
    EC.presence_of_element_located((By.ID, "myElement"))
)
```

### 2. Ejecutar JavaScript
```python
driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
```

### 3. Cambiar entre Tabs
```python
driver.switch_to.window(driver.window_handles[1])
```

### 4. Guardar HTML completo
```python
with open('page_source.html', 'w', encoding='utf-8') as f:
    f.write(driver.page_source)
```

---

## 🆚 Alternativas

### Playwright (Recomendado para TypeScript)
```bash
npm install -D @playwright/test
npx playwright install
```

### Cypress (Popular en React)
```bash
npm install -D cypress
npx cypress open
```

### Puppeteer (Node.js)
```bash
npm install puppeteer
```

---

## ✅ Checklist de Testing

- [ ] Login funciona
- [ ] Navegación a conversaciones
- [ ] Kanban muestra 3 columnas
- [ ] Socket.IO conectado
- [ ] Click en contacto abre chat
- [ ] Envío de mensajes funciona
- [ ] Mensajes aparecen en tiempo real
- [ ] Drag & drop entre columnas
- [ ] Typing indicators funcionan
- [ ] Screenshots se generan correctamente

---

## 📞 Soporte

Si los tests fallan:
1. Verificar que la app esté corriendo en `localhost:3000`
2. Revisar screenshots generados
3. Ejecutar sin `--headless` para ver qué pasa
4. Verificar logs del navegador en DevTools

---

¡Tests automatizados listos! 🎉
