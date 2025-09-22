@echo off
REM Auto Andrade - Sistema de Gestión de Taller Automotriz
REM Script para cliente - Inicio automático sin consolas visibles

REM Cambiar al directorio del script
cd /d "%~dp0"

REM Iniciar backend en segundo plano (sin ventana visible)
start /min /b "" py -m uvicorn app.main:app --host 0.0.0.0 --port 8000

REM Esperar 3 segundos para que el backend se inicie
timeout /t 3 /nobreak >nul

REM Cambiar al directorio del frontend
cd dashboard

REM Iniciar frontend en segundo plano (sin ventana visible)
start /min /b "" npm run dev

REM Esperar 5 segundos para que el frontend se inicie
timeout /t 5 /nobreak >nul

REM Abrir el navegador con la aplicación
start http://localhost:3000

REM Salir del script (las ventanas quedan ejecutándose en segundo plano)
exit
