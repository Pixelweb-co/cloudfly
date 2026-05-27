@echo off
echo Actualizando modulo ADMINISTRACION con menu DIAN (Docker)...
echo Conectando a contenedor docke 'mysql'...

:: Pipe content from host file to mysql inside docker container
type "c:\apps\cloudfly\backend\db\update_module_dian.sql" | docker exec -i mysql mysql -u root -pwidowmaker cloud_master

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Fallo al ejecutar el comando docker exec.
    echo Asegurese de que docker este corriendo y el contenedor 'mysql' exista.
    pause
    exit /b 1
)

echo Actualizacion completada exitosamente via Docker.
