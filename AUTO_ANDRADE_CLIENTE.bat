@echo off
REM Auto Andrade - Sistema de Gestión de Taller Automotriz
REM Script para cliente - Versión simplificada

REM Cambiar al directorio del script
cd /d "%~dp0"

REM Liberar puertos si están ocupados
echo Iniciando Auto Andrade...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000') do (
    taskkill /f /pid %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do (
    taskkill /f /pid %%a >nul 2>&1
)

REM Esperar 3 segundos para que se liberen los puertos
timeout /t 3 /nobreak >nul

REM Crear archivos VBS para ejecutar comandos completamente invisibles
echo Set WshShell = CreateObject("WScript.Shell") > start_backend.vbs
echo WshShell.Run "cmd /c ""py -m uvicorn app.main:app --host 0.0.0.0 --port 8000""", 0, True >> start_backend.vbs

echo Set WshShell = CreateObject("WScript.Shell") > start_frontend.vbs
echo WshShell.Run "cmd /c ""cd dashboard && npm run dev""", 0, True >> start_frontend.vbs

REM Ejecutar backend invisible
start /min "" start_backend.vbs

REM Esperar 6 segundos para que el backend se inicie completamente
timeout /t 6 /nobreak >nul

REM Ejecutar frontend invisible
start /min "" start_frontend.vbs

REM Esperar 10 segundos para que el frontend se inicie completamente
timeout /t 10 /nobreak >nul

REM Abrir el navegador con la aplicación
start http://localhost:3000

REM Limpiar archivos temporales
del start_backend.vbs
del start_frontend.vbs

REM Cerrar esta ventana después de 2 segundos
timeout /t 2 /nobreak >nul
exit
