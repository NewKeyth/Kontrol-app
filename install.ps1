Write-Host "KONTROL - Instalador 1-Click para Windows" -ForegroundColor Cyan

Write-Host "-> Paso 1: Instalando Motor de Hardware ViGEmBus..." -ForegroundColor Yellow
Invoke-WebRequest -Uri "https://github.com/ViGEm/ViGEmBus/releases/latest/download/ViGEmBus_Setup_1.22.0.exe" -OutFile "$env:TEMP\ViGEmBus_Setup.exe"
Start-Process -FilePath "$env:TEMP\ViGEmBus_Setup.exe" -ArgumentList "/q", "/norestart" -Wait -NoNewWindow

Write-Host "-> Paso 2: Instalando Servidor Principal..." -ForegroundColor Yellow
$DesktopPath = [Environment]::GetFolderPath("Desktop")
Invoke-WebRequest -Uri "https://github.com/NewKeyth/Kontrol-app/releases/latest/download/KONTROL_Server_Windows.exe" -OutFile "$DesktopPath\KONTROL.exe"

Write-Host "--------------------------------------------------------" -ForegroundColor Cyan
Write-Host "¡Instalación completamente exitosa!" -ForegroundColor Green
Write-Host "Se ha dejado la aplicacion 'KONTROL' en tu Escritorio."
Write-Host "Ejecutando por primera vez..." -ForegroundColor Gray
Write-Host "--------------------------------------------------------" -ForegroundColor Cyan

Start-Sleep -Seconds 2
Start-Process -FilePath "$DesktopPath\KONTROL.exe"
