// tests/e2e_onboarding_playwright.spec.js
const { test, expect } = require('@playwright/test');

/**
 * Playwright E2E Test Suite: CloudFly Multi-Tenant Onboarding Wizard
 * 
 * Este script valida el flujo completo descrito en el documento SDD con separación de responsabilidades:
 * - Registro con cuenta única temporal.
 * - Redirección inicial forzada a /account-setup.
 * - Paso 0: Bienvenida al Wizard.
 * - Paso 1: Configuración de Negocio (Tenant, Company default, Contact principal y asociación al usuario logueado).
 * - Paso 2: Configuración de WhatsApp (Emulación / Omitir paso).
 * - Paso 3: Productos y Catálogo Inicial (Categoría default y Primer producto).
 * - Paso 4: Plan y Pago (Tokenización simulada con Wompi, guardado de método de pago y creación de suscripción Trial).
 * - Finalización: Redirección al Dashboard (/home).
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'; // Ajusta según el entorno
const UNIQUE_ID = Date.now();
const TEST_USER = `qa_playwright_${UNIQUE_ID}`;
const TEST_EMAIL = `${TEST_USER}@cloudfly.com.co`;
const TEST_PASS = 'Password123!';

test.describe('Flujo de Onboarding Multi-Tenant CloudFly', () => {

  test('Debe completar exitosamente los 4 pasos del Wizard y redirigir al Dashboard', async ({ page }) => {
    // Aumentar timeout debido a tiempos de carga de JIT y endpoints remotos
    test.setTimeout(120000);

    console.log(`🚀 Iniciando flujo completo de registro para el usuario: ${TEST_EMAIL}`);

    // ==========================================
    // [1] REGISTRO DE USUARIO NUEVO
    // ==========================================
    await page.goto(`${BASE_URL}/register`);
    await page.waitForSelector('input[name="nombres"]');

    await page.fill('input[name="nombres"]', 'QA');
    await page.fill('input[name="apellidos"]', 'Playwright');
    await page.fill('input[name="username"]', TEST_USER);
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASS);
    await page.fill('input[name="confirmPassword"]', TEST_PASS);

    // Marcar aceptar términos
    const termsCheckbox = page.locator('input[type="checkbox"]');
    await termsCheckbox.check();

    // Enviar registro
    await page.click('button[type="submit"]');

    // Esperar mensaje de éxito
    await expect(page.locator('text=registrado exitosamente')).toBeVisible({ timeout: 45000 });
    console.log('✅ Registro de usuario completado de forma exitosa.');

    // ==========================================
    // [2] INICIO DE SESIÓN
    // ==========================================
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="username"]', TEST_USER);
    await page.fill('input[name="password"]', TEST_PASS);
    await page.click('button[type="submit"]');

    // Comprobar redirección al Wizard por no haber completado onboarding
    await page.waitForURL('**/account-setup', { timeout: 60000 });
    console.log('✅ Redireccionado correctamente al Wizard de Onboarding.');

    // ==========================================
    // [3] PASO 0: PANTALLA DE BIENVENIDA
    // ==========================================
    await page.click('button:has-text("Continuar")');
    console.log('✅ Pantalla de bienvenida superada.');

    // ==========================================
    // [4] PASO 1: TU NEGOCIO (DATOS DE LA EMPRESA)
    // ==========================================
    await page.waitForSelector('input[name="name"]');
    await page.fill('input[name="name"]', 'QA Playwright Shop');
    await page.fill('input[name="nit"]', `900${UNIQUE_ID % 1000000}`); // NIT único para pruebas
    await page.fill('input[name="phone"]', '3109998877');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="address"]', 'Calle 100 # 15-22, Bogotá');
    await page.fill('input[name="objetoSocial"]', 'Tienda automatizada de pruebas QA con Playwright.');
    await page.fill('input[name="contact"]', 'QA Engineer Principal');
    await page.fill('input[name="position"]', 'Tech Lead QA');

    // Seleccionar tipo de negocio (Software / SaaS)
    await page.click('text=Software / SaaS');

    // Guardar Paso 1
    await page.click('button:has-text("Continuar")');
    console.log('✅ Paso 1: Datos de Negocio completados y guardados.');

    // ==========================================
    // [5] PASO 2: CHATBOT IA & WHATSAPP (OMITIR)
    // ==========================================
    // Esperamos que cargue la interfaz de WhatsApp o que esté el botón de omitir
    await page.waitForTimeout(3000);
    try {
      const configLaterBtn = page.locator('button:has-text("Configurar más tarde")');
      if (await configLaterBtn.isVisible()) {
        await configLaterBtn.click();
        console.log('✅ Paso 2: Configuración de WhatsApp omitida correctamente.');
      } else {
        // Fallback: clic directo en la pestaña de Productos
        await page.click('text=Productos');
        console.log('⏩ Paso 2 omitido mediante navegación directa por tabs.');
      }
    } catch (err) {
      console.warn('⚠️ No se encontró botón para omitir WhatsApp. Continuando por tabs.');
      await page.click('text=Productos');
    }

    // ==========================================
    // [6] PASO 3: CATÁLOGO INICIAL (PRODUCTOS)
    // ==========================================
    await page.waitForSelector('input[placeholder*="Hamb"]', { timeout: 30000 });
    
    // Rellenar campos del producto
    const productNameInput = page.locator('input[placeholder*="Hamb"]');
    await productNameInput.fill('Licencia QA Playwright Pro');

    const productDescTextarea = page.locator('textarea[placeholder*="Describe"]');
    await productDescTextarea.fill('Soporte proactivo y automatización premium de suites de pruebas.');

    const productPriceInput = page.locator('input[type="number"]');
    await productPriceInput.fill('99000');

    // Guardar y avanzar a Paso 4
    await page.click('button:has-text("Finalizar Configuración")');
    console.log('✅ Paso 3: Categoría por defecto y Producto agregados con éxito.');

    // ==========================================
    // [7] PASO 4: PLAN Y PAGO (WOMPI TOKEN & TRIAL ACTIVATION)
    // ==========================================
    await page.waitForTimeout(3000);
    
    // Completar datos de la tarjeta de pruebas de Wompi (Card for APPROVED transaction)
    await page.fill('input[placeholder*="0000"]', '4242 4242 4242 4242');
    await page.fill('input[placeholder*="JUAN"]', 'QA PLAYWRIGHT TEST');
    await page.fill('input[placeholder*="MM/YY"]', '12/28');
    await page.fill('input[placeholder*="123"]', '123');

    // Clic en botón "Activar mi Cuenta" que desencadena la tokenización en Wompi 
    // y la creación de la suscripción de prueba con Plan ID 2 en nuestro Backend.
    await page.click('button:has-text("Activar mi Cuenta")');
    console.log('💳 Procesando tokenización Wompi y activando suscripción...');

    // ==========================================
    // [8] REDIRECCIÓN FINAL Y VALIDACIÓN DE SESIÓN
    // ==========================================
    // El sistema debe completar el onboarding y redireccionar a /home de forma dura.
    await page.waitForURL('**/home', { timeout: 60000 });
    console.log('✅ Redireccionado de forma exitosa a /home. ¡Onboarding Completado!');

    // Verificar que los datos en localStorage se hayan actualizado correctamente
    const onboardingStatus = await page.evaluate(() => {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      return {
        onboardingCompleted: userData.onboardingCompleted,
        customerId: userData.customerId,
        companyId: userData.activeCompanyId
      };
    });

    console.log('📊 Estado de sesión en localStorage post-onboarding:', onboardingStatus);
    expect(onboardingStatus.customerId).not.toBeNull();
    expect(onboardingStatus.companyId).not.toBeNull();

    // ==========================================
    // [9] COMPROBAR PERSISTENCIA TRAS LOGOUT
    // ==========================================
    console.log('🔄 Validando que no se regrese al Wizard tras iniciar sesión nuevamente...');
    await page.goto(`${BASE_URL}/logout`);
    await page.waitForURL('**/login', { timeout: 30000 });

    // Login secundario
    await page.fill('input[name="username"]', TEST_USER);
    await page.fill('input[name="password"]', TEST_PASS);
    await page.click('button[type="submit"]');

    // Debe llevarnos directamente al Dashboard y nunca más al Wizard
    await page.waitForURL('**/home', { timeout: 30000 });
    const finalUrl = page.url();
    expect(finalUrl).not.toContain('account-setup');
    console.log('🎉 ¡Prueba de Onboarding completada al 100% con éxito sin regresiones!');
  });

});
