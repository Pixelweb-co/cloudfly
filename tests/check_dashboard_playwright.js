const { chromium } = require('playwright');

(async () => {
  // Lanzamos el navegador en modo "headed" para que puedas verlo si tienes interfaz
  // o headless: false para depuración
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🚀 Navegando al Dashboard de CloudFly...');
  
  try {
    await page.goto('https://devdashboard.cloudfly.com.co', { waitUntil: 'networkidle' });
    
    const title = await page.title();
    console.log(`✅ Título de la página: ${title}`);

    // Verificamos si existe el contenedor principal de login o dashboard
    const content = await page.content();
    if (content.includes('Account')) {
      console.log('✅ Se detectó la sección de Configuración de Cuenta.');
    }

    // Tomamos una captura de pantalla de lo que ve el "agente"
    await page.screenshot({ path: 'playwright_screenshot.png' });
    console.log('📸 Captura de pantalla guardada como playwright_screenshot.png');

  } catch (error) {
    console.error('❌ Error durante la ejecución de Playwright:', error);
  } finally {
    await browser.close();
  }
})();
