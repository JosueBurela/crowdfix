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

// 3. PUBLICAR REPORTE (MODERACIÓN + AUTO-CLASIFICACIÓN CON LLAMA 3)
router.post('/', upload.array('archivos', 150), async (req, res) => {
  try {
    let { titulo, tipoProblema, customTipo, ubicacion, autorNombre, autorEmail, autorFoto } = req.body;
    let categoriaFinal = tipoProblema;

    if (tipoProblema === 'Otro' && customTipo) {
      categoriaFinal = customTipo.trim();
    }

    let estadoFinal = 'Activo';
    let motivoBloqueoBot = '';

    const oficiales = ['Bache', 'Fuga de Agua', 'Alumbrado', 'Basura'];
    const dinamicas = await dbCategorias.find({});
    const nombresDinamicas = dinamicas.map(c => c.nombre);
    const todasLasCategorias = [...oficiales, ...nombresDinamicas].join(', ');

    const promptSistema = `Eres un moderador estricto y clasificador de incidencias ciudadanas de CrowdFix en Medellín de Bravo.
    TAREA 1: CENSURA el reporte si contiene NSFW, insultos, spam o no tiene sentido.
    TAREA 2: Si es válido, asígnale la categoría que mejor encaje de esta lista: [${todasLasCategorias}]. Si no encaja en NINGUNA, inventa una categoría corta (máximo 3 palabras).
    RESPONDE ESTRICTAMENTE EN ESTE FORMATO:
    Si es inválido: BLOQUEADO|Razón corta del bloqueo
    Si es válido: VALIDO|NombreDeLaCategoria`;

    const mensajeUsuario = `Descripción del reporte: ${titulo}`;

    try {
      console.log("Iniciando análisis y clasificación con Llama 3...");
      const aiResponse = await fetch('http://127.0.0.1:1234/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: "lmstudio-community/Meta-Llama-3-8B-Instruct-Q4_K_M.gguf", 
          messages: [
            { role: "system", content: promptSistema },
            { role: "user", content: mensajeUsuario }
          ],
          temperature: 0.1, 
          max_tokens: 50
        })
      });

      const aiData = await aiResponse.json();
      const respuestaBot = aiData.choices[0].message.content.trim();
      console.log("El bot dijo:", respuestaBot);

      const partes = respuestaBot.split('|');
      const veredicto = partes[0] ? partes[0].trim().toUpperCase() : '';
      const clasificacionIA = partes[1] ? partes[1].trim() : 'Otro';

      if (veredicto.includes('BLOQUEADO')) {
        estadoFinal = 'Bloqueado';
        motivoBloqueoBot = clasificacionIA; 
      } else if (veredicto.includes('VALIDO')) {
        if (tipoProblema === 'Automático') {
          categoriaFinal = clasificacionIA.charAt(0).toUpperCase() + clasificacionIA.slice(1);
        }
      }
    } catch (aiError) {
      console.error("Error conectando con LM Studio.", aiError.message);
      if (tipoProblema === 'Automático') categoriaFinal = 'Otro'; 
    }

    if (!oficiales.includes(categoriaFinal)) {
      const existe = await dbCategorias.findOne({ nombre: categoriaFinal });
      if (existe) {
        await dbCategorias.update({ _id: existe._id }, { $set: { usos: (existe.usos || 0) + 1 } });
      } else {
        await dbCategorias.insert({ nombre: categoriaFinal, usos: 1, esOficial: false });
      }
    }

    let archivosUrls = [];
    if (req.files) archivosUrls = req.files.map(f => `http://localhost:5000/uploads/${f.filename}`);
    
    const nuevo = await dbReportes.insert({
      titulo, 
      tipoProblema: categoriaFinal, 
      ubicacion, 
      autorNombre, 
      autorEmail, 
      autorFoto,
      archivosUrls, 
      estado: estadoFinal, 
      motivoBloqueo: motivoBloqueoBot,
      revisadoPorBot: true, 
      votos: 0, 
      votosUsuarios: [], 
      comentarios: [], 
      fechaCreacion: new Date().toISOString()
    });
    
    res.status(201).json(nuevo);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// 4. VOTAR
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
    const { usuario, autorEmail, autorFoto, texto } = req.body;
    let archivosUrls = [];
    if (req.files) archivosUrls = req.files.map(f => `http://localhost:5000/uploads/${f.filename}`);
    const com = { 
      usuario, 
      autorEmail, 
      autorFoto: autorFoto || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
      texto, 
      archivosUrls, 
      fecha: new Date().toISOString() 
    };
    await dbReportes.update({ _id: req.params.id }, { $push: { comentarios: com } });
    res.status(201).json(com);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

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

// 8. EDITAR COMENTARIO
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

// 9. ELIMINAR COMENTARIO
router.delete('/:id/comentar/:fecha', async (req, res) => {
  try {
    const reporte = await dbReportes.findOne({ _id: req.params.id });
    const nuevosComentarios = reporte.comentarios.filter(c => c.fecha !== req.params.fecha);
    await dbReportes.update({ _id: req.params.id }, { $set: { comentarios: nuevosComentarios } });
    res.json({ mensaje: 'Comentario eliminado.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// APELACIONES (USUARIO)
// ==========================================
router.post('/:id/apelacion', async (req, res) => {
  try {
    const { usuario, texto } = req.body;
    const reporte = await dbReportes.findOne({ _id: req.params.id });

    if (!reporte) return res.status(404).json({ mensaje: 'Reporte no encontrado' });

    let apelacion = reporte.apelacion || { estado: 'Abierta', mensajes: [] };
    apelacion.estado = 'Abierta'; 
    apelacion.mensajes.push({
      autor: usuario,
      isAdmin: false,
      texto,
      fecha: new Date().toISOString()
    });

    await dbReportes.update({ _id: req.params.id }, { $set: { apelacion } });
    res.json(apelacion);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// NUEVO: GENERADOR DE DICTAMEN TÉCNICO (PDF IA)
// ==========================================
router.post('/:id/oficio-formal', async (req, res) => {
  try {
    const reporte = await dbReportes.findOne({ _id: req.params.id });
    if (!reporte) return res.status(404).json({ mensaje: 'Reporte no encontrado' });

    // Le pedimos a Llama 3 que actúe como burócrata experto
    const promptSistema = `Eres un perito experto en Protección Civil y Obras Públicas. Tu tarea es redactar un dictamen técnico formal basado en una queja ciudadana informal.
    Debes responder ÚNICAMENTE con código HTML usando esta estructura exacta, sin texto extra al principio ni al final:
    <div class="seccion"><h4>1. Descripción Técnica de la Incidencia</h4><p>[Redacta formalmente el problema]</p></div>
    <div class="seccion"><h4>2. Análisis de Riesgos y Afectación a la Población</h4><p>[Explica detalladamente los peligros de no atenderlo]</p></div>
    <div class="seccion"><h4>3. Plan de Acción Operativo Sugerido</h4><p>[Describe los pasos técnicos para solucionarlo]</p></div>
    <div class="seccion"><h4>4. Requerimientos Estimados (Material y Personal)</h4><ul><li>[Requerimiento 1]</li><li>[Requerimiento 2]</li></ul></div>`;

    const mensajeUsuario = `Convierte este reporte ciudadano a dictamen técnico formal. Título del ciudadano: "${reporte.titulo.replace('[🚨 RIESGO INMINENTE] ', '')}". Categoría asignada: ${reporte.tipoProblema}. Ubicación: ${reporte.ubicacion}.`;

    console.log("Redactando oficio formal con Llama 3...");
    
    // Conexión a LM Studio
    const aiResponse = await fetch('http://127.0.0.1:1234/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "lmstudio-community/Meta-Llama-3-8B-Instruct-Q4_K_M.gguf",
        messages: [
          { role: "system", content: promptSistema },
          { role: "user", content: mensajeUsuario }
        ],
        temperature: 0.3, // Un poquito de creatividad para rellenar los detalles burocráticos
        max_tokens: 600
      })
    });

    const aiData = await aiResponse.json();
    const htmlGenerado = aiData.choices[0].message.content.trim();
    
    console.log("Oficio generado exitosamente.");
    res.json({ htmlIA: htmlGenerado });
  } catch (err) { 
    console.error("Error generando oficio con IA:", err.message);
    res.status(500).json({ error: 'No se pudo generar el oficio inteligente en este momento.' }); 
  }
});

export default router;