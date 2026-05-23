; CloudFly POS — Script Inno Setup 6
; Instalador profesional para Windows

#define AppName "CloudFly POS"
#define AppVersion "1.0.0"
#define AppPublisher "CloudFly"
#define AppURL "https://cloudfly.com.co"
#define AppExeName "CloudFlyPOS.exe"
#define DataDir "{commonappdata}\CloudFly POS"

[Setup]
AppId={{CF2026-POS-1000-CLOUDFLY-WINDOWS}}
AppName={#AppName}
AppVersion={#AppVersion}
AppVerName={#AppName} v{#AppVersion}
AppPublisher={#AppPublisher}
AppPublisherURL={#AppURL}
AppSupportURL={#AppURL}
AppUpdatesURL={#AppURL}
DefaultDirName={autopf}\CloudFly POS
DefaultGroupName={#AppName}
AllowNoIcons=no
DisableDirPage=no
DisableProgramGroupPage=yes
LicenseFile=license.txt
OutputDir=output
OutputBaseFilename=CloudFlyPOS_Setup_v{#AppVersion}
SetupIconFile=..\assets\icon.ico
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
; Requiere Windows 10 o superior
MinVersion=10.0
; Archivos de 64 bits
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
; No requiere admin para instalar en Program Files
PrivilegesRequired=admin
; Crear carpeta ProgramData con permisos de escritura para todos los usuarios
[Dirs]
Name: "{commonappdata}\CloudFly POS"; Permissions: users-modify
Name: "{commonappdata}\CloudFly POS\cache"; Permissions: users-modify
Name: "{commonappdata}\CloudFly POS\cache\images"; Permissions: users-modify

[Languages]
Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"

[Tasks]
; Acceso directo en escritorio - MARCADO por defecto
Name: "desktopicon"; Description: "Crear un acceso directo en el &Escritorio"; GroupDescription: "Opciones adicionales:"
; Iniciar con Windows - desmarcado por defecto
Name: "startupicon"; Description: "Iniciar CloudFly POS automáticamente con &Windows"; GroupDescription: "Opciones adicionales:"; Flags: unchecked

[Files]
; Ejecutable principal
Source: "..\dist\{#AppExeName}"; DestDir: "{app}"; Flags: ignoreversion

; Archivo de configuración inicial (sólo si no existe, para no sobrescribir)
Source: "..\config.json"; DestDir: "{commonappdata}\CloudFly POS"; Flags: onlyifdoesntexist

[Icons]
; Acceso directo en Menú Inicio
Name: "{group}\{#AppName}"; Filename: "{app}\{#AppExeName}"; IconFilename: "{app}\{#AppExeName}"
Name: "{group}\Desinstalar {#AppName}"; Filename: "{uninstallexe}"
; Acceso directo en Escritorio (opcional)
Name: "{autodesktop}\{#AppName}"; Filename: "{app}\{#AppExeName}"; IconFilename: "{app}\{#AppExeName}"; Tasks: desktopicon

[Run]
; Ofrecer al usuario abrir la app al terminar la instalación
Filename: "{app}\{#AppExeName}"; Description: "Iniciar {#AppName} ahora"; Flags: nowait postinstall skipifsilent

[Registry]
; Registrar en Panel de Control → Programas y características
Root: HKLM; Subkey: "Software\CloudFly\POS"; ValueType: string; ValueName: "InstallPath"; ValueData: "{app}"; Flags: uninsdeletekey
Root: HKLM; Subkey: "Software\CloudFly\POS"; ValueType: string; ValueName: "Version"; ValueData: "{#AppVersion}"

[UninstallDelete]
; Al desinstalar, NO borrar los datos del usuario en ProgramData
; (pos_local.db, config.json, cache)
; Solo se borra el ejecutable y accesos directos (manejado automáticamente por Inno Setup)

[Messages]
WelcomeLabel2=Este asistente instalará [name/ver] en su computador.%n%nSe recomienda cerrar todas las demás aplicaciones antes de continuar.%n%nLos datos de ventas se almacenarán en:%n%n  C:\ProgramData\CloudFly POS\%n%nEsta carpeta se conserva al desinstalar.
FinishedHeadingLabel=¡Instalación completada!
FinishedLabel=CloudFly POS ha sido instalado correctamente en su computador.%n%nYa puede iniciar el Punto de Venta desde el acceso directo en el Escritorio o en el Menú Inicio.
