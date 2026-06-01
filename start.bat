@echo off
title Lanzador de CrowdFix
echo =========================================
echo 🚀 Iniciando CrowdFix (Backend + Frontend)
echo =========================================

:: Guardar ruta actual
set ROOT_DIR=%cd%

:: 1. Configurar Backend
echo 📦 Configurando Backend...
cd /d "%ROOT_DIR%\backend"
if not exist node_modules (
    echo Instalando dependencias del Backend...
    call npm install
)

if not exist .env (
    echo Creando archivo .env por defecto para Backend...
    echo PORT=5000 > .env
    echo FRONTEND_URL=http://localhost:5173 >> .env
)

echo Iniciando Backend en una nueva ventana...
start "CrowdFix Backend API" cmd /k "npm run start"

:: 2. Configurar Frontend
cd /d "%ROOT_DIR%\frontend"
echo 💻 Configurando Frontend...
if not exist node_modules (
    echo Instalando dependencias del Frontend...
    call npm install
)

if not exist .env (
    echo Creando archivo .env por defecto para Frontend...
    echo VITE_API_URL=http://localhost:5000 > .env
)

echo Iniciando Frontend...
start "CrowdFix Frontend Web App" cmd /k "npm run dev"

echo =========================================
echo 🎉 ¡Ambos servicios se han abierto en ventanas independientes!
echo.
echo 🔗 Frontend: http://localhost:5173
echo 🔗 Backend API: http://localhost:5000
echo =========================================
pause
