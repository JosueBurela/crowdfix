import express from 'express';
import { dbUsuarios } from '../db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configuración de Multer para Fotos de Perfil
const carpetaUploads = './uploads';
if (!fs.existsSync(carpetaUploads)){
    fs.mkdirSync(carpetaUploads);
}
const almacenamiento = multer.diskStorage({
  destination: (req, file, cb) => cb(null, carpetaUploads),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'pfp-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: almacenamiento });

const SECRET_JWT_KEY = 'esta-es-una-llave-secreta-super-larga-y-segura-para-la-tarea-del-itsav';
const SALT_ROUNDS = 10;

// 1. REGISTRO (CON FOTO DEFAULT)
router.post('/register', async (req, res) => {
  try {
    const { nombre, email, password, comunidad } = req.body;
    const usuarioExiste = await dbUsuarios.findOne({ email });
    if (usuarioExiste) return res.status(400).json({ mensaje: 'El correo ya existe.' });

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    await dbUsuarios.insert({
      nombre, email, password: hashedPassword, comunidad,
      fotoPerfilUrl: 'https://cdn-icons-png.flaticon.com/512/149/149071.png', // Default
      fechaRegistro: new Date()
    });
    res.status(201).json({ mensaje: 'Usuario registrado.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 2. LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const usuario = await dbUsuarios.findOne({ email });
    if (!usuario) return res.status(400).json({ mensaje: 'Credenciales inválidas.' });

    const passwordValido = await bcrypt.compare(password, usuario.password);
    if (!passwordValido) return res.status(400).json({ mensaje: 'Credenciales inválidas.' });
    
    const token = jwt.sign(
      { _id: usuario._id, nombre: usuario.nombre, email: usuario.email, comunidad: usuario.comunidad, fotoPerfilUrl: usuario.fotoPerfilUrl }, 
      SECRET_JWT_KEY, { expiresIn: '12h' }
    );
    res.cookie('access_token', token, { httpOnly: true, maxAge: 1000 * 60 * 60 * 12 });
    res.json({ usuario: { _id: usuario._id, nombre: usuario.nombre, email: usuario.email, comunidad: usuario.comunidad, fotoPerfilUrl: usuario.fotoPerfilUrl } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3. ACTUALIZAR PERFIL (INCLUYE FOTO) - ESTA ES LA QUE FALTABA
router.put('/profile', upload.single('fotoPerfil'), async (req, res) => {
  const token = req.cookies.access_token;
  if (!token) return res.status(401).json({ mensaje: 'Sesión expirada.' });

  try {
    const decoded = jwt.verify(token, SECRET_JWT_KEY);
    // Los datos de texto vienen como JSON en un campo 'datos'
    const datosUpdates = JSON.parse(req.body.datos);
    let dataToUpdate = { 
      nombre: datosUpdates.nombre, 
      email: datosUpdates.email, 
      comunidad: datosUpdates.comunidad 
    };

    // Si subió foto nueva, actualizamos la URL
    if (req.file) {
      dataToUpdate.fotoPerfilUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    }

    // Lógica de cambio de contraseña
    if (datosUpdates.newPassword) {
      const usuarioActual = await dbUsuarios.findOne({ _id: decoded._id });
      const ok = await bcrypt.compare(datosUpdates.currentPassword, usuarioActual.password);
      if (!ok) return res.status(400).json({ mensaje: 'Contraseña actual incorrecta.' });
      dataToUpdate.password = await bcrypt.hash(datosUpdates.newPassword, SALT_ROUNDS);
    }

    await dbUsuarios.update({ _id: decoded._id }, { $set: dataToUpdate });
    const userUpdated = await dbUsuarios.findOne({ _id: decoded._id });

    // Regenerar token con datos nuevos
    const newToken = jwt.sign(
      { _id: userUpdated._id, nombre: userUpdated.nombre, email: userUpdated.email, comunidad: userUpdated.comunidad, fotoPerfilUrl: userUpdated.fotoPerfilUrl }, 
      SECRET_JWT_KEY, { expiresIn: '12h' }
    );
    res.cookie('access_token', newToken, { httpOnly: true });
    res.json({ usuario: { _id: userUpdated._id, nombre: userUpdated.nombre, email: userUpdated.email, comunidad: userUpdated.comunidad, fotoPerfilUrl: userUpdated.fotoPerfilUrl } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/me', (req, res) => {
  try {
    const decoded = jwt.verify(req.cookies.access_token, SECRET_JWT_KEY);
    res.json({ usuario: decoded });
  } catch { res.status(401).json({ mensaje: 'No hay sesión.' }); }
});

router.post('/logout', (req, res) => { res.clearCookie('access_token'); res.json({ mensaje: 'Adiós.' }); });

export default router;