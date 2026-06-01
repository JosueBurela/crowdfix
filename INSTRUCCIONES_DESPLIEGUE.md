# 🚀 Guía de Despliegue en Servidor Linux (CrowdFix)

¡Hola! Esta es la guía detallada de pasos para desplegar **CrowdFix** en tu servidor Linux para que sea accesible desde cualquier parte del mundo. 

Hemos refactorizado el código del proyecto para eliminar las direcciones locales (`localhost:5000` y `localhost:5173`) hardcodeadas. Ahora el sistema utiliza **variables de entorno**, permitiendo configurar las IPs o dominios de tu servidor de manera profesional sin alterar el código fuente.

---

## 📋 Arquitectura del Despliegue

* **Frontend (React + Vite + Tailwind)**: Se compila a archivos estáticos óptimos y se sirve de forma ultra rápida usando **Nginx**.
* **Backend (Node.js + Express + SQLite/nedb)**: Corre en segundo plano administrado por **PM2** en el puerto `5000` (o el que definas).
* **Base de Datos**: Local (`.db` en formato archivo), por lo que **no** requiere instalar motores de bases de datos pesados como PostgreSQL o MySQL.

💡 **Lanzadores de un solo clic**: 
Hemos agregado archivos de inicio rápido en la raíz del proyecto para simplificar pruebas y desarrollo rápido en local o en el servidor:
* **`start.sh` (Linux/macOS)**: Ejecuta `bash start.sh` para iniciar tanto el frontend como el backend de forma simultánea en segundo plano.
* **`start.bat` (Windows)**: Haz doble clic en `start.bat` para levantar el backend y el frontend localmente en ventanas independientes.

---

## Paso 1: Subir los cambios a GitHub (Acción para ti)
Para que tu compañero tenga la versión actualizada y dinámica del proyecto, ejecuta los siguientes comandos en la terminal de tu computadora local (en la raíz de `crowdfix`):

```bash
git add .
git commit -m "Refactor: Configuración dinámica de URLs por variables de entorno"
git push origin main
```

---

## Paso 2: Preparación del Servidor Linux (Acción para tu amigo)

Tu amigo debe conectarse a su servidor Linux vía SSH y preparar el entorno de ejecución instalando Node.js, Git, Nginx y PM2.

### 2.1 Actualizar el sistema e instalar dependencias básicas
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl nginx
```

### 2.2 Instalar Node.js (Versión LTS recomendada)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```
Verifica la instalación ejecutando `node -v` y `npm -v`.

### 2.3 Instalar PM2 (Gestor de procesos de Node.js)
PM2 mantendrá el servidor backend activo 24/7 y lo reiniciará automáticamente si el servidor Linux se apaga o hay un fallo de código.
```bash
sudo npm install -y -g pm2
```

---

## Paso 3: Clonar y Configurar el Proyecto en el Servidor

### 3.1 Clonar el repositorio
Elige una ruta en tu servidor, por ejemplo `/var/www/crowdfix`:
```bash
sudo mkdir -y -p /var/www
sudo chown -R $USER:$USER /var/www
cd /var/www
git clone https://github.com/JosueBurela/crowdfix.git
cd crowdfix
```

---

## Paso 4: Despliegue del Backend (Node.js)

### 4.1 Instalar dependencias del backend
```bash
cd backend
npm install
```

### 4.2 Crear archivo de configuración `.env`
Crea el archivo `.env` en la carpeta `backend` para definir el puerto de escucha y el origen permitido para las cookies (CORS):
```bash
nano .env
```
Escribe el siguiente contenido (reemplaza `http://tudominio.com` o la IP de tu servidor por la dirección donde se accederá al frontend):
```env
PORT=5000
FRONTEND_URL=http://tu-ip-publica-o-dominio
# Puedes agregar aquí otras variables necesarias, como credenciales de correo si nodemailer las requiere
```
*(Para guardar en `nano`, presiona `Ctrl + O`, `Enter` y luego `Ctrl + X`)*.

### 4.3 Iniciar el Backend con PM2
Iniciamos la ejecución del backend y nos aseguramos de que persista en el arranque del sistema operativo:
```bash
pm2 start server.js --name "crowdfix-backend"
pm2 save
pm2 startup
```
*(El comando `pm2 startup` te dará una línea de código específica que debes copiar, pegar y ejecutar para habilitar el inicio con el sistema).*

---

## Paso 5: Despliegue del Frontend (React + Vite)

### 5.1 Instalar dependencias del frontend
```bash
cd ../frontend
npm install
```

### 5.2 Configurar variable de entorno para apuntar al Backend
Debemos indicarle al compilador de React dónde se ubicará nuestra API en el servidor.
Crea el archivo `.env` en la carpeta `frontend`:
```bash
nano .env
```
Agrega la URL de tu API (reemplaza por tu IP o dominio de producción):
```env
VITE_API_URL=http://tu-ip-publica-o-dominio:5000
```

### 5.3 Compilar el frontend
Compilamos la aplicación de React. Esto generará la carpeta `/dist` optimizada para producción:
```bash
npm run build
```

---

## Paso 6: Configurar Nginx para Servir el Frontend y Redirigir el Tráfico

Nginx actuará como un servidor web de altísimo rendimiento para los archivos estáticos del frontend, y opcionalmente puede redirigir peticiones.

### 6.1 Crear configuración en Nginx
Crea un nuevo archivo de configuración para CrowdFix:
```bash
sudo nano /etc/nginx/sites-available/crowdfix
```

Pega la siguiente configuración (reemplaza `tu-ip-publica-o-dominio` por el dominio o IP real del servidor):

```nginx
server {
    listen 80;
    server_name tu-ip-publica-o-dominio;

    # Ruta del frontend compilado
    root /var/www/crowdfix/frontend/dist;
    index index.html;

    # Configuración para soportar el enrutador de React/Vite
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy opcional: si quieres redirigir peticiones del backend a través de Nginx
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Servir las subidas de archivos e imágenes desde el backend
    location /uploads/ {
        proxy_pass http://localhost:5000/uploads/;
        proxy_set_header Host $host;
    }
}
```

### 6.2 Habilitar el sitio y reiniciar Nginx
Enlaza el archivo de configuración para activarlo, valida que no haya errores de sintaxis y reinicia el servicio:
```bash
sudo ln -s /etc/nginx/sites-available/crowdfix /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```
*(Si ya tenías un sitio por defecto que interfiere, puedes deshabilitarlo con `sudo rm /etc/nginx/sites-enabled/default` y volver a reiniciar Nginx).*

---

## Paso 7: Configuración del Firewall (Muy Importante)

Asegúrate de permitir el acceso de tráfico externo a los puertos requeridos (80 para Nginx, y 5000 para el Backend si la petición se hace directa al puerto 5000):

```bash
sudo ufw allow 80/tcp
sudo ufw allow 5000/tcp
sudo ufw reload
```

> 💡 **Nota de oro**: Si usas un proveedor en la nube (como AWS, Azure, Google Cloud, Oracle Cloud o DigitalOcean), asegúrate de abrir los puertos **80** e **5000** en el panel web de tu proveedor (Security Groups / Redes).

---

## 🎉 ¡Listo para Disfrutar!

Ahora podrás abrir cualquier navegador y entrar a `http://tu-ip-publica-o-dominio`. La aplicación cargará al instante y se conectará con el servidor backend.

### Comandos útiles para tu amigo en el día a día:
* Ver el estado del backend: `pm2 status`
* Ver los logs en tiempo real de errores o impresiones de consola: `pm2 logs`
* Reiniciar el backend: `pm2 restart crowdfix-backend`
* Actualizar el servidor con nuevos cambios de GitHub:
  ```bash
  cd /var/www/crowdfix
  git pull
  # Si hubo cambios en backend, reinstalar y reiniciar:
  cd backend && npm install && pm2 restart crowdfix-backend
  # Si hubo cambios en frontend, recompilar:
  cd ../frontend && npm install && npm run build
  ```
