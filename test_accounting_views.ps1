# Script para probar vistas de contabilidad
Write-Host "=== VERIFICACIÓN DE VISTAS DE CONTABILIDAD ===" -ForegroundColor Cyan

Write-Host "`nLas siguientes vistas están disponibles:" -ForegroundColor Green
Write-Host "1. Libro Diario: http://localhost:3000/contabilidad/libro-diario" -ForegroundColor Yellow
Write-Host "2. Estado Resultados: http://localhost:3000/contabilidad/estado-resultados" -ForegroundColor Yellow
Write-Host "3. Balance General: http://localhost:3000/contabilidad/balance-general" -ForegroundColor Yellow

Write-Host "`nAbriendo vistas en el navegador..." -ForegroundColor Cyan

Start-Process "http://localhost:3000/contabilidad/libro-diario"
Start-Sleep -Seconds 2
Start-Process "http://localhost:3000/contabilidad/estado-resultados"
Start-Sleep -Seconds 2
Start-Process "http://localhost:3000/contabilidad/balance-general"

Write-Host "`n✅ Las 3 pestañas deberían abrirse en tu navegador" -ForegroundColor Green
Write-Host "Si ves algún error, verifica:" -ForegroundColor Yellow
Write-Host "  - Que estés logueado en http://localhost:3000" -ForegroundColor Gray
Write-Host "  - Que el servidor frontend esté corriendo (npm run dev)" -ForegroundColor Gray
Write-Host "  - Que el backend esté corriendo en :8080" -ForegroundColor Gray
