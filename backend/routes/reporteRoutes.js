import express from 'express';
import { dbReportes, dbCategorias } from '../db.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();
const carpetaUploads = './uploads';
const almacenamiento = multer.diskStorage({
  destination: (req, file, cb) => cb(null, carpetaUploads),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: almacenamiento });

// 1. OBTENER REPORTES
router.get('/', async (req, res) => {
  try {
    const reportes = await dbReportes.find({});
    res.json(reportes.map(r => ({...r, votosUsuarios: r.votosUsuarios || [], archivosUrls: r.archivosUrls || []})));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 2. OBTENER CATEGORÍAS (DINÁMICAS)
router.get('/categorias', async (req, res) => {
  try {
    const oficiales = ['Bache', 'Fuga de Agua', 'Alumbrado', 'Basura'];
    const dinamicas = await dbCategorias.find({});
    const populares = dinamicas.filter(c => !oficiales.includes(c.nombre)).sort((a, b) => b.usos - a.usos).slice(0, 10);
    res.json({ oficiales, populares });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3. PUBLICAR REPORTE (CON LÓGICA DE CATEGORÍA)
router.post('/', upload.array('archivos', 150), async (req, res) => {
  try {
    let { titulo, tipoProblema, customTipo, ubicacion, autorNombre, autorEmail, autorFoto } = req.body;
    let categoriaFinal = tipoProblema;
    if (tipoProblema === 'Otro' && customTipo) {
      categoriaFinal = customTipo.trim();
      const existe = await dbCategorias.findOne({ nombre: categoriaFinal });
      if (existe) await dbCategorias.update({ _id: existe._id }, { $set: { usos: (existe.usos || 0) + 1 } });
      else await dbCategorias.insert({ nombre: categoriaFinal, usos: 1, esOficial: false });
    }
    let archivosUrls = [];
    if (req.files) archivosUrls = req.files.map(f => `http://localhost:5000/uploads/${f.filename}`);
    const nuevo = await dbReportes.insert({
      titulo, tipoProblema: categoriaFinal, ubicacion, autorNombre, autorEmail, autorFoto,
      archivosUrls, estado: 'Activo', votos: 0, votosUsuarios: [], comentarios: [], fechaCreacion: new Date().toISOString()
    });
    res.status(201).json(nuevo);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// 4. VOTAR (UN VOTO POR USUARIO)
router.post('/:id/votar', async (req, res) => {
  try {
    const { emailUsuario } = req.body;
    const reporte = await dbReportes.findOne({ _id: req.params.id });
    let votantes = reporte.votosUsuarios || [];
    if (votantes.includes(emailUsuario)) votantes = votantes.filter(e => e !== emailUsuario);
    else votantes.push(emailUsuario);
    await dbReportes.update({ _id: req.params.id }, { $set: { votosUsuarios: votantes, votos: votantes.length } });
    res.json({ success: true, votos: votantes.length });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// 5. COMENTAR
router.post('/:id/comentar', upload.array('archivosComentario', 150), async (req, res) => {
  try {
    const { usuario, autorEmail, texto } = req.body;
    let archivosUrls = [];
    if (req.files) archivosUrls = req.files.map(f => `http://localhost:5000/uploads/${f.filename}`);
    const com = { usuario, autorEmail, texto, archivosUrls, fecha: new Date().toISOString() };
    await dbReportes.update({ _id: req.params.id }, { $push: { comentarios: com } });
    res.status(201).json(com);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ====== AQUÍ ESTÁN LAS QUE FALTABAN ======

// 6. EDITAR REPORTE
router.put('/:id', async (req, res) => {
  try {
    await dbReportes.update({ _id: req.params.id }, { $set: { titulo: req.body.titulo } });
    res.json({ mensaje: 'Actualizado.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 7. ELIMINAR REPORTE
router.delete('/:id', async (req, res) => {
  try {
    await dbReportes.remove({ _id: req.params.id });
    res.json({ mensaje: 'Eliminado.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 8. EDITAR COMENTARIO (POR FECHA)
router.put('/:id/comentar/:fecha', async (req, res) => {
  try {
    const reporte = await dbReportes.findOne({ _id: req.params.id });
    const nuevosComentarios = reporte.comentarios.map(c => {
      if (c.fecha === req.params.fecha) return { ...c, texto: req.body.texto };
      return c;
    });
    await dbReportes.update({ _id: req.params.id }, { $set: { comentarios: nuevosComentarios } });
    res.json({ mensaje: 'Comentario editado.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 9. ELIMINAR COMENTARIO (POR FECHA)
router.delete('/:id/comentar/:fecha', async (req, res) => {
  try {
    const reporte = await dbReportes.findOne({ _id: req.params.id });
    const nuevosComentarios = reporte.comentarios.filter(c => c.fecha !== req.params.fecha);
    await dbReportes.update({ _id: req.params.id }, { $set: { comentarios: nuevosComentarios } });
    res.json({ mensaje: 'Comentario eliminado.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;