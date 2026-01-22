# Script para instalar el Túnel Cloudflare como una tarea de Windows (Startup)
# Este script asume que cloudflared está instalado en WSL

$TaskName = "CloudflareTunnel_Cloudfly"

# Comando para ejecutar el túnel en WSL usando el usuario edwin y su configuración
$WSL_USER = "edwin"
$TUNNEL_COMMAND = "cloudflared tunnel run"

# 1. Definir la acción: Correr cloudflared en WSL
$Action = New-ScheduledTaskAction -Execute "wsl" -Argument "-u $WSL_USER bash -c '$TUNNEL_COMMAND'"

# 2. Definir el disparador: Al iniciar el equipo (At Startup)
$Trigger = New-ScheduledTaskTrigger -AtStartup

# 3. Definir configuraciones de la tarea (Correr con privilegios máximos, no importa si el usuario está logueado)
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

# 4. Registrar la tarea en el sistema
try {
    # Borrar si ya existe
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
    
    Register-ScheduledTask -Action $Action -Trigger $Trigger -Settings $Settings -TaskName $TaskName -User "SYSTEM" -RunLevel Highest -Force
    Write-Host "✅ Tarea programada '$TaskName' creada exitosamente."
    Write-Host "🚀 El túnel se iniciará automáticamente en cada reinicio de Windows."
    Write-Host "`nNOTA: Para verificar si está corriendo, abre el Administrador de Tareas o usa: Get-ScheduledTask -TaskName $TaskName"
}
catch {
    Write-Error "No se pudo registrar la tarea. Asegúrate de ejecutar este script como Administrador de PowerShell."
}
