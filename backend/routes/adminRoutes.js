import express from 'express';
import { dbUsuarios, dbReportes } from '../db.js';
import jwt from 'jsonwebtoken';

const router = express.Router();
const SECRET_JWT_KEY = 'esta-es-una-llave-secreta-super-larga-y-segura-para-la-tarea-del-itsav';

// Middleware de verificación de Admin
const verificarAdmin = (req, res, next) => {
  const token = req.cookies.access_token;
  if (!token) return res.status(401).json({ mensaje: 'No autorizado' });
  try {
    const decoded = jwt.verify(token, SECRET_JWT_KEY);
    if (decoded.email !== 'admin@crowdfix.com') {
      return res.status(403).json({ mensaje: 'Acceso denegado.' });
    }
    next();
  } catch (err) {
    res.status(401).json({ mensaje: 'Token inválido' });
  }
};

// 1. Obtener Stats y Reportes Crudos
router.get('/stats', verificarAdmin, async (req, res) => {
  try {
    const usuarios = await dbUsuarios.find({});
    // Traemos los reportes ordenados por fecha
    const reportes = await dbReportes.find({}).sort({ fechaCreacion: -1 });

    const totalUsuarios = usuarios.length;
    const totalReportes = reportes.length;

    const usuariosPorZona = {};
    usuarios.forEach(u => {
      usuariosPorZona[u.comunidad] = (usuariosPorZona[u.comunidad] || 0) + 1;
    });

    res.json({ totalUsuarios, totalReportes, usuariosPorZona, reportesCrudos: reportes });
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

// 2. Censurar/Bloquear Reporte
router.post('/bloquear-reporte/:id', verificarAdmin, async (req, res) => {
  try {
    const { motivo } = req.body;
    const reporte = await dbReportes.findOne({ _id: req.params.id });
    
    if (!reporte) return res.status(404).json({ mensaje: 'Reporte no encontrado' });

    // Actualizamos el estado del reporte
    await dbReportes.update({ _id: req.params.id }, { $set: { estado: 'Bloqueado', motivoBloqueo: motivo } });

    // Le mandamos la notificación al autor
    const nuevaNotificacion = {
      id: Date.now().toString(),
      tipo: 'bloqueo',
      titulo: 'Publicación Ocultada por Moderación',
      mensaje: `Tu reporte "${reporte.titulo.replace('[🚨 RIESGO INMINENTE] ', '')}" fue bloqueado. Motivo: ${motivo}`,
      fecha: new Date().toISOString(),
      leida: false
    };

    // Actualizamos el buzón del usuario (si no tiene el array, se crea)
    await dbUsuarios.update(
      { email: reporte.autorEmail },
      { $push: { notificaciones: nuevaNotificacion } }
    );

    res.json({ mensaje: 'Reporte bloqueado y usuario notificado.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Reactivar Reporte (por si el admin se equivoca)
router.post('/reactivar-reporte/:id', verificarAdmin, async (req, res) => {
  try {
    await dbReportes.update({ _id: req.params.id }, { $set: { estado: 'Activo' }, $unset: { motivoBloqueo: true } });
    res.json({ mensaje: 'Reporte reactivado.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// NUEVO: SISTEMA DE APELACIONES (ADMINISTRADOR)
// ==========================================
router.post('/apelacion/:id', verificarAdmin, async (req, res) => {
  try {
    const { texto } = req.body;
    const reporte = await dbReportes.findOne({ _id: req.params.id });

    if (!reporte) return res.status(404).json({ mensaje: 'Reporte no encontrado' });

    let apelacion = reporte.apelacion || { estado: 'Abierta', mensajes: [] };
    apelacion.mensajes.push({
      autor: 'Administración de CrowdFix',
      isAdmin: true,
      texto,
      fecha: new Date().toISOString()
    });

    // Notificar al usuario que el admin respondió en el chat
    const nuevaNotificacion = {
      id: Date.now().toString(),
      tipo: 'campana',
      titulo: 'Nueva respuesta del Administrador',
      mensaje: `Tienes un nuevo mensaje en la apelación de tu reporte censurado: "${reporte.titulo.replace('[🚨 RIESGO INMINENTE] ', '')}".`,
      fecha: new Date().toISOString(),
      leida: false
    };

    await dbUsuarios.update(
      { email: reporte.autorEmail },
      { $push: { notificaciones: nuevaNotificacion } }
    );

    await dbReportes.update({ _id: req.params.id }, { $set: { apelacion } });
    res.json(apelacion);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;