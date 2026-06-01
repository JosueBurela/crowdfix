import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import cookieParser from 'cookie-parser'; // <-- Nuevo import
import './db.js'; 
import reporteRoutes from './routes/reporteRoutes.js'; 
import authRoutes from './routes/authRoutes.js'; 
import adminRoutes from './routes/adminRoutes.js'; // <-- ¡AQUÍ ESTÁ LA LÍNEA QUE FALTABA!

dotenv.config();

const app = express();

// Middlewares globales (CORS configurado para aceptar Cookies)
app.use(cors({
  origin: 'http://localhost:5173', // Debe apuntar exacto a tu frontend
  credentials: true // Permite que viajen las cookies
}));
app.use(express.json()); 
app.use(cookieParser()); // <-- Para que Express pueda leer las cookies

// Carpeta de almacenamiento estático para las evidencias fotográficas
app.use('/uploads', express.static(path.resolve('uploads')));

// Enrutamiento de la API
app.use('/api/reportes', reporteRoutes); 
app.use('/api/auth', authRoutes); 
app.use('/api/admin', adminRoutes); // <-- Ahora sí el sistema sabe qué es esto

app.get('/', (req, res) => {
  res.send('Servidor de la API de CrowdFix operando correctamente.');
});

const PORT = process.env.PORT || 5000;

// =========================================================
// AQUÍ ESTÁ EL CAMBIO: GUARDAMOS EL SERVER Y LE DAMOS TIEMPO
// =========================================================
const server = app.listen(PORT, () => {
  console.log(`Servidor del backend corriendo en el puerto ${PORT}`);
});

// Le damos 5 minutos (300,000 milisegundos) de paciencia a Node
// para que tu RTX 2050 termine de redactar el oficio sin que se corte la conexión.
server.setTimeout(300000);
server.keepAliveTimeout = 300000;
server.headersTimeout = 300000;