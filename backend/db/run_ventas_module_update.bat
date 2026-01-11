@echo off
echo Actualizando modulo VENTAS con menu completo...
echo Conectando a contenedor docker 'mysql'...

:: Pipe content from host file to mysql inside docker container
type "c:\apps\cloudfly\backend\db\update_module_ventas.sql" | docker exec -i mysql mysql -u root -pwidowmaker cloud_master

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Fallo al ejecutar el comando docker exec.
    pause
    exit /b 1
)

echo Actualizacion VENTAS completada exitosamente.
