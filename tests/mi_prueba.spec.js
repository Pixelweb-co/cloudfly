// tests/mi_prueba.spec.js
const { test, expect } = require('@playwright/test');

test('Prueba de flujo con emulación de navegador', async ({ page }) => {
  // 1. Configuración de cabeceras
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'es-ES,es;q=0.9',
    'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Upgrade-Insecure-Requests': '1'
  });

  // 2. Navegación inicial
  await page.goto('URL_DE_TU_SISTEMA_LOCAL');
  
  // 3. Crear publicación y seleccionar tipo
  await page.locator('span', { hasText: 'Crear publicación' }).click();
  await page.waitForTimeout(5000);
  await page.locator('button').filter({ has: page.getByText('Artículo en venta') }).click();
  await page.waitForTimeout(5000);

  // 4. Llenar Título y Precio
  await page.locator('label').filter({ hasText: 'Título' }).locator('input').fill('Kit de Herramientas CloudFly');
  await page.locator('label').filter({ hasText: 'Precio' }).locator('input').fill('45000');

  // 5. Seleccionar Categoría "Herramientas"
  await page.getByRole('combobox', { name: 'Categoría' }).click();
  await page.getByText('Herramientas', { exact: true }).click();
  await page.waitForTimeout(2000);

  // 6. Seleccionar Estado "Nuevo"
  console.log('Abriendo menú de Estado...');
  await page.getByRole('combobox', { name: 'Estado' }).click();
  
  console.log('Seleccionando estado "Nuevo"...');
  // Seleccionamos la opción "Nuevo" de la lista
  await page.getByText('Nuevo', { exact: true }).click();
  await page.waitForTimeout(2000);

  console.log('Estado seleccionado con éxito');
});
