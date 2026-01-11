@echo off
REM ============================================================================
REM BATCH SCRIPT: Execute DANE migrations
REM Description: Runs the DANE module database migrations
REM ============================================================================

echo Ejecutando migracion de tabla dane_codes...
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p"Elian2020*" cloudfly_erp < "c:\apps\cloudfly\backend\db\migration_dane_codes.sql"

if %ERRORLEVEL% NEQ 0 (
    echo ERROR al ejecutar migration_dane_codes.sql
    pause
    exit /b 1
)

echo Migracion completada exitosamente.
echo.
echo Ejecutando seed de modulo DANE...
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p"Elian2020*" cloudfly_erp < "c:\apps\cloudfly\backend\db\seed_module_dane.sql"

if %ERRORLEVEL% NEQ 0 (
    echo ERROR al ejecutar seed_module_dane.sql
    pause
    exit /b 1
)

echo Seed completado exitosamente.
echo.
echo Verificando datos...
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p"Elian2020*" cloudfly_erp -e "SELECT COUNT(*) as total_departamentos FROM dane_codes WHERE tipo = 'DEPARTAMENTO' AND activo = TRUE; SELECT COUNT(*) as total_ciudades FROM dane_codes WHERE tipo = 'CIUDAD' AND activo = TRUE; SELECT * FROM modules WHERE name = 'DANE';"

echo.
echo Proceso completado.
pause
