#!/bin/bash

# Asegurar permisos de ejecución y formato de fin de línea en Linux
# (Este script inicia tanto el backend como el frontend de CrowdFix en desarrollo/pruebas)

echo "========================================="
echo "🚀 Iniciando CrowdFix (Backend + Frontend)"
echo "========================================="

# Guardar la ruta raíz del proyecto
ROOT_DIR=$(pwd)

# 1. Configurar Backend
echo "📦 Configurando Backend..."
cd "$ROOT_DIR/backend"
if [ ! -d "node_modules" ]; then
    echo "Instalando dependencias del Backend..."
    npm install
fi

# Crear .env básico de backend si no existe
if [ ! -f ".env" ]; then
    echo "Creando archivo .env por defecto para Backend..."
    echo "PORT=5000" > .env
    echo "FRONTEND_URL=http://localhost:5173" >> .env
fi

# Iniciar Backend
echo "Iniciando Backend..."
npm run start > backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend iniciado en segundo plano (PID: $BACKEND_PID)"

# 2. Configurar Frontend
cd "$ROOT_DIR/frontend"
echo "💻 Configurando Frontend..."
if [ ! -d "node_modules" ]; then
    echo "Instalando dependencias del Frontend..."
    npm install
fi

# Crear .env básico de frontend si no existe
if [ ! -f ".env" ]; then
    echo "Creando archivo .env por defecto para Frontend..."
    echo "VITE_API_URL=http://localhost:5000" > .env
fi

# Iniciar Frontend
echo "Iniciando Frontend..."
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend iniciado en segundo plano (PID: $FRONTEND_PID)"

echo "========================================="
echo "🎉 ¡Servicios iniciados con éxito!"
echo "-----------------------------------------"
echo "🔗 Frontend: http://localhost:5173"
echo "🔗 Backend API: http://localhost:5000"
echo "📝 Logs disponibles en backend.log y frontend.log"
echo "========================================="
echo "Presiona Ctrl+C para detener ambos servicios de forma segura."

# Función para detener procesos hijos al salir
cleanup() {
    echo -e "\n🛑 Deteniendo servicios..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

# Capturar señales de salida
trap cleanup INT TERM

# Mantener el script en espera de los procesos en segundo plano
wait
