import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import cookieParser from 'cookie-parser'; // <-- Nuevo import
import './db.js'; 
import reporteRoutes from './routes/reporteRoutes.js'; 
import authRoutes from './routes/authRoutes.js'; 

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

app.get('/', (req, res) => {
  res.send('Servidor de la API de CrowdFix operando correctamente.');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor del backend corriendo en el puerto ${PORT}`);
});