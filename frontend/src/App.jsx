import React, { useState, useEffect } from 'react';

// ============================================================================
// COMPONENTE INTERNO: VISOR MULTIMEDIA (CARRUSEL Y LIGHTBOX)
// ============================================================================
const VisorMultimedia = ({ urls = [] }) => {
  const [indice, setIndice] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  
  if (!urls || urls.length === 0) return null;
  const urlActual = urls[indice];
  const ext = urlActual.split('.').pop().toLowerCase();
  
  const render = (url, full = false) => {
    if (['mp4','webm','mov'].includes(ext)) return <video src={url} controls className={full ? "max-h-[90vh]" : "max-h-[400px] w-full rounded-2xl bg-black"} />;
    if (ext === 'pdf') return <iframe src={url} className={full ? "w-[80vw] h-[90vh]" : "w-full h-80 rounded-2xl"} title="pdf"/>;
    return <img src={url} className={full ? "max-h-[90vh] object-contain" : "max-h-[400px] w-full object-cover rounded-2xl cursor-zoom-in"} onClick={() => !full && setLightbox(true)} alt="evidencia"/>;
  };

  return (
    <div className="relative mt-4">
      {render(urlActual)}
      {urls.length > 1 && (
        <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center">
          <button onClick={(e) => {e.stopPropagation(); setIndice(i => i===0 ? urls.length-1 : i-1)}} className="hover:text-blue-300">◀</button>
          <span className="mx-3">{indice + 1} / {urls.length}</span>
          <button onClick={(e) => {e.stopPropagation(); setIndice(i => i===urls.length-1 ? 0 : i+1)}} className="hover:text-blue-300">▶</button>
        </div>
      )}
      {lightbox && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4" onClick={() => setLightbox(false)}>
          <button className="absolute top-4 right-4 text-white text-3xl font-black hover:text-red-500 z-50">✕</button>
          <div className="relative w-full max-w-5xl flex justify-center" onClick={e => e.stopPropagation()}>
            {render(urlActual, true)}
            {urls.length > 1 && (
              <>
                <button onClick={(e) => {e.stopPropagation(); setIndice(i => i===0 ? urls.length-1 : i-1)}} className="absolute -left-4 sm:left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl transition">◀</button>
                <button onClick={(e) => {e.stopPropagation(); setIndice(i => i===urls.length-1 ? 0 : i+1)}} className="absolute -right-4 sm:right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl transition">▶</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// APLICACIÓN PRINCIPAL
// ============================================================================
function App() {
  const [usuarioLogueado, setUsuarioLogueado] = useState(null);
  const [verificando, setVerificando] = useState(true);
  const [esRegistro, setEsRegistro] = useState(false);
  
  // LOGIN / REGISTRO
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [comunidad, setComunidad] = useState('Puente Moreno');

  // DATA
  const [reportes, setReportes] = useState([]);
  const [cats, setCategorias] = useState({ oficiales: [], populares: [] });
  const [reporteSeleccionado, setReporteSeleccionado] = useState(null);
  
  // FILTROS
  const [filtroZona, setFiltroZona] = useState('General');
  const [filtroCat, setFiltroCat] = useState('Todas');
  const [orden, setOrden] = useState('Recientes');

  // CREAR POST
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [nuevoTipo, setNuevoTipo] = useState('Bache');
  const [customTipo, setCustomTipo] = useState('');
  const [archivos, setArchivos] = useState([]);
  const [previews, setPreviews] = useState([]);

  // COMENTARIOS ESTILO GEMINI
  const [textoComentario, setTextoComentario] = useState('');
  const [archivosComentario, setArchivosComentario] = useState([]); 
  const [previewsComentario, setPreviewsComentario] = useState([]);
  const [mostrarCajaComentario, setMostrarCajaComentario] = useState(false);

  // CONFIG PERFIL
  const [showConfig, setShowConfig] = useState(false);
  const [fileFoto, setFileFoto] = useState(null);
  const [configNombre, setConfigNombre] = useState('');
  const [configEmail, setConfigEmail] = useState('');
  const [configComunidad, setConfigComunidad] = useState('');
  const [configCurrentPassword, setConfigCurrentPassword] = useState('');
  const [configNewPassword, setConfigNewPassword] = useState('');

  const listaZonas = [
    'General', 
    'Puente Moreno', 
    'Lagos de Puente Moreno', 
    'Arboledas San Ramón', 
    'Las Palmas', 
    'Residencial Marino',
    'Arboledas de San Miguel',
    'Leonardo Rodríguez Alcaine',
    'Paso del Campestre',
    'Nuevo Medellín'
  ];

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/auth/me', { credentials: 'include' });
        const data = await res.json();
        if (res.ok) setUsuarioLogueado(data.usuario);
      } catch {} finally { setVerificando(false); }
    };
    init();
  }, []);

  useEffect(() => { 
    if (usuarioLogueado) {
      fetchReportes();
      fetchCategorias();
    }
  }, [usuarioLogueado]);

  const fetchReportes = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/reportes');
      const data = await res.json();
      if(res.ok) setReportes(data);
    } catch(err) { console.error(err); }
  };

  const fetchCategorias = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/reportes/categorias');
      const data = await res.json();
      if(res.ok) setCategorias(data);
    } catch(err) { console.error(err); }
  };

  const manejarSubmitAuth = async (e) => {
    e.preventDefault();
    const endpoint = esRegistro ? 'register' : 'login';
    const body = esRegistro ? { nombre, email, password, comunidad } : { email, password };
    try {
      const res = await fetch(`http://localhost:5000/api/auth/${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify(body)
      });
      const datos = await res.json();
      if (res.ok) {
        if (esRegistro) { alert('Registro exitoso. Inicia sesión.'); setEsRegistro(false); setPassword(''); } 
        else setUsuarioLogueado(datos.usuario);
      } else { alert(datos.mensaje); }
    } catch (err) { alert('Error de conexión.'); }
  };

  // CRUD REPORTES
  const manejarCrearAlerta = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('titulo', nuevoTitulo);
    fd.append('tipoProblema', nuevoTipo);
    fd.append('customTipo', customTipo);
    fd.append('ubicacion', usuarioLogueado.comunidad);
    fd.append('autorNombre', usuarioLogueado.nombre);
    fd.append('autorEmail', usuarioLogueado.email);
    fd.append('autorFoto', usuarioLogueado.fotoPerfilUrl);
    archivos.forEach(a => fd.append('archivos', a));
    const res = await fetch('http://localhost:5000/api/reportes', { method: 'POST', body: fd });
    if (res.ok) {
      setNuevoTitulo(''); setArchivos([]); setPreviews([]); setNuevoTipo('Bache'); setCustomTipo('');
      fetchReportes(); fetchCategorias();
    }
  };

  const manejarEditarReporte = async (id, tituloActual, e) => {
    e.stopPropagation();
    const nuevo = window.prompt("Edita tu publicación:", tituloActual);
    if (!nuevo || nuevo === tituloActual) return;
    try {
      await fetch(`http://localhost:5000/api/reportes/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ titulo: nuevo })
      });
      fetchReportes();
    } catch (err) { console.error(err); }
  };

  const manejarEliminarReporte = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("¿Seguro que deseas eliminar esta publicación?")) return;
    try {
      await fetch(`http://localhost:5000/api/reportes/${id}`, { method: 'DELETE' });
      fetchReportes(); if(reporteSeleccionado?._id === id) setReporteSeleccionado(null);
    } catch (err) { console.error(err); }
  };

  // CRUD COMENTARIOS
  const manejarAgregarComentario = async (e) => {
    e.preventDefault();
    if (!textoComentario) return;
    const formData = new FormData();
    formData.append('usuario', usuarioLogueado.nombre);
    formData.append('autorEmail', usuarioLogueado.email); 
    formData.append('texto', textoComentario);
    archivosComentario.forEach(archivo => formData.append('archivosComentario', archivo));
    const res = await fetch(`http://localhost:5000/api/reportes/${reporteSeleccionado._id}/comentar`, { method: 'POST', body: formData });
    if (res.ok) {
      setTextoComentario(''); setArchivosComentario([]); setPreviewsComentario([]); setMostrarCajaComentario(false); 
      fetchReportes(); 
      const updated = await fetch('http://localhost:5000/api/reportes').then(r => r.json());
      setReporteSeleccionado(updated.find(r => r._id === reporteSeleccionado._id));
    }
  };

  const manejarEditarComentario = async (idReporte, fecha, textoActual) => {
    const nuevo = window.prompt("Edita tu respuesta:", textoActual);
    if (!nuevo || nuevo === textoActual) return;
    try {
      await fetch(`http://localhost:5000/api/reportes/${idReporte}/comentar/${fecha}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ texto: nuevo })
      });
      fetchReportes();
      const updated = await fetch('http://localhost:5000/api/reportes').then(r => r.json());
      setReporteSeleccionado(updated.find(r => r._id === reporteSeleccionado._id));
    } catch (err) { console.error(err); }
  };

  const manejarEliminarComentario = async (idReporte, fecha) => {
    if (!window.confirm("¿Eliminar tu respuesta?")) return;
    try {
      await fetch(`http://localhost:5000/api/reportes/${idReporte}/comentar/${fecha}`, { method: 'DELETE' });
      fetchReportes();
      const updated = await fetch('http://localhost:5000/api/reportes').then(r => r.json());
      setReporteSeleccionado(updated.find(r => r._id === reporteSeleccionado._id));
    } catch (err) { console.error(err); }
  };

  // CONFIG PERFIL
  const abrirConfiguracion = () => {
    setConfigNombre(usuarioLogueado.nombre); setConfigEmail(usuarioLogueado.email);
    setConfigComunidad(usuarioLogueado.comunidad); setConfigCurrentPassword(''); setConfigNewPassword('');
    setFileFoto(null); setShowConfig(true);
  };

  const updatePerfil = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    if (fileFoto) fd.append('fotoPerfil', fileFoto);
    fd.append('datos', JSON.stringify({ 
      nombre: configNombre, email: configEmail, comunidad: configComunidad, 
      currentPassword: configCurrentPassword, newPassword: configNewPassword 
    }));
    
    try {
      const res = await fetch('http://localhost:5000/api/auth/profile', { method: 'PUT', credentials: 'include', body: fd });
      const data = await res.json();
      if (res.ok) {
        setUsuarioLogueado(data.usuario); setShowConfig(false); fetchReportes(); alert("Perfil actualizado.");
      } else { alert(data.mensaje); }
    } catch (err) { console.error(err); }
  };

  const cerrarVistaDetallada = () => {
    setReporteSeleccionado(null);
    setMostrarCajaComentario(false);
    setArchivosComentario([]);
    setPreviewsComentario([]);
    setTextoComentario('');
  };

  // LOGICA FILTRADO
  let filtrados = reportes.filter(r => (filtroZona === 'General' || r.ubicacion === filtroZona) && (filtroCat === 'Todas' || r.tipoProblema === filtroCat));
  filtrados.sort((a, b) => orden === 'Recientes' ? new Date(b.fechaCreacion) - new Date(a.fechaCreacion) : b.votos - a.votos);

  if (verificando) return <div className="min-h-screen bg-slate-100 flex items-center justify-center font-bold text-slate-400">Cargando...</div>;

  if (!usuarioLogueado) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-10 border border-slate-100 animate-fadeIn">
          <div className="text-center mb-10">
            <h1 className="text-5xl font-black text-blue-600 tracking-tight">CrowdFix</h1>
            <p className="text-slate-500 text-sm mt-2 font-medium">ITSAV - Ingeniería de Software</p>
          </div>
          <form onSubmit={manejarSubmitAuth} className="space-y-5">
            {esRegistro && <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full px-5 py-4 rounded-xl border bg-slate-50 outline-none focus:border-blue-500" placeholder="Nombre Completo" required />}
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-5 py-4 rounded-xl border bg-slate-50 outline-none focus:border-blue-500" placeholder="Correo Electrónico" required />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-5 py-4 rounded-xl border bg-slate-50 outline-none focus:border-blue-500" placeholder="Contraseña" required />
            {esRegistro && (
              <div>
                <label className="block text-sm font-bold uppercase text-slate-500 mb-2">Localidad Asignada</label>
                <select value={comunidad} onChange={(e) => setComunidad(e.target.value)} className="w-full px-5 py-4 rounded-xl border bg-slate-50 outline-none focus:border-blue-500 font-medium transition">
                  {listaZonas.filter(z => z !== 'General').map(z => <option key={z} value={z}>{z}</option>)}
                </select>
              </div>
            )}
            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-md hover:bg-blue-700 transition">{esRegistro ? 'Registrar Usuario' : 'Autenticar Sesión'}</button>
          </form>
          <button onClick={() => setEsRegistro(!esRegistro)} className="w-full text-center mt-6 font-bold text-blue-600">{esRegistro ? '¿Ya tienes cuenta? Entrar' : 'Crear cuenta nueva'}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <nav className="bg-white border-b sticky top-0 z-40 p-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h2 className="text-2xl font-black text-blue-600 cursor-pointer" onClick={() => {setReporteSeleccionado(null); setFiltroCat('Todas')}}>CrowdFix</h2>
          <div className="flex items-center gap-4">
            <img src={usuarioLogueado.fotoPerfilUrl || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} className="w-10 h-10 rounded-full border shadow-sm object-cover" alt="pfp" />
            <button onClick={abrirConfiguracion} className="text-xl bg-slate-100 hover:bg-slate-200 w-10 h-10 rounded-full flex items-center justify-center transition">⚙️</button>
            <button onClick={async () => { await fetch('http://localhost:5000/api/auth/logout', {method:'POST', credentials:'include'}); window.location.reload(); }} className="font-bold text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl transition">Salir</button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 p-4 lg:p-8">
        
        {/* SIDEBAR IZQUIERDO: CATEGORÍAS */}
        {!reporteSeleccionado && (
          <aside className="hidden lg:block lg:col-span-3 space-y-6">
            {/* LÍMITE DE ALTURA Y SCROLL PARA QUE NO SE CORTE */}
            <div className="bg-white p-6 rounded-3xl border shadow-sm sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Categorías</h3>
              <button onClick={() => setFiltroCat('Todas')} className={`w-full text-left p-3 rounded-xl font-bold mb-2 transition ${filtroCat === 'Todas' ? 'bg-blue-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>🌎 Todas</button>
              {cats.oficiales.map(c => (
                <button key={c} onClick={() => setFiltroCat(c)} className={`w-full text-left p-3 rounded-xl font-bold mb-1 transition ${filtroCat === c ? 'bg-blue-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>📍 {c}</button>
              ))}
              {cats.populares.length > 0 && <div className="border-t my-4 pt-4 text-xs font-black text-slate-400 uppercase">Tendencias 🔥</div>}
              {cats.populares.map(c => (
                <button key={c.nombre} onClick={() => setFiltroCat(c.nombre)} className={`w-full text-left p-3 rounded-xl font-bold mb-1 text-sm transition ${filtroCat === c.nombre ? 'bg-orange-500 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>🔸 {c.nombre}</button>
              ))}
            </div>
          </aside>
        )}

        {/* FEED CENTRAL */}
        <main className={`${reporteSeleccionado ? 'lg:col-span-8 lg:col-start-3' : 'lg:col-span-6'} space-y-8 mb-32`}>
          {reporteSeleccionado ? (
            /* VISTA DEL HILO CON EDICIÓN/BORRADO */
            <div className="animate-fadeIn relative">
              <button onClick={cerrarVistaDetallada} className="mb-6 font-bold text-slate-500 hover:text-slate-800 bg-white px-5 py-2 rounded-xl shadow-sm border border-slate-200 transition">← Regresar</button>
              
              <article className="bg-white p-8 rounded-3xl border shadow-sm mb-6">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                  <div className="flex items-center gap-4">
                    <img src={reporteSeleccionado.autorFoto || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} className="w-12 h-12 rounded-full border shadow-sm object-cover" alt="pfp" />
                    <div>
                      <p className="font-bold text-slate-800">{reporteSeleccionado.autorNombre}</p>
                      <p className="text-sm font-medium text-slate-500">{new Date(reporteSeleccionado.fechaCreacion || Date.now()).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {reporteSeleccionado.autorEmail === usuarioLogueado.email && (
                    <div className="flex gap-2">
                      <button onClick={(e) => manejarEditarReporte(reporteSeleccionado._id, reporteSeleccionado.titulo, e)} className="text-xs font-bold text-slate-400 hover:text-blue-600">✏️ Editar</button>
                      <button onClick={(e) => manejarEliminarReporte(reporteSeleccionado._id, e)} className="text-xs font-bold text-slate-400 hover:text-red-500">🗑️ Eliminar</button>
                    </div>
                  )}
                </div>
                <h2 className="text-3xl font-black mb-4 leading-tight">{reporteSeleccionado.titulo}</h2>
                <VisorMultimedia urls={reporteSeleccionado.archivosUrls} />
              </article>

              <h3 className="font-black text-slate-800 text-xl mb-4 px-2">Respuestas Operativas ({reporteSeleccionado.comentarios.length})</h3>
              
              <div className="space-y-4">
                {reporteSeleccionado.comentarios.map((com, index) => (
                  <div key={index} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="flex justify-between items-center mb-3 border-b pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{com.usuario}</span>
                        <span className="text-xs text-slate-400">• {new Date(com.fecha || new Date()).toLocaleDateString()}</span>
                      </div>
                      {com.autorEmail === usuarioLogueado.email && (
                        <div className="flex gap-2">
                          <button onClick={() => manejarEditarComentario(reporteSeleccionado._id, com.fecha, com.texto)} className="text-xs font-bold text-slate-400 hover:text-blue-600">✏️ Editar</button>
                          <button onClick={() => manejarEliminarComentario(reporteSeleccionado._id, com.fecha)} className="text-xs font-bold text-slate-400 hover:text-red-500">🗑️ Eliminar</button>
                        </div>
                      )}
                    </div>
                    <p className="text-slate-700 leading-relaxed">{com.texto}</p>
                    <VisorMultimedia urls={com.archivosUrls} />
                  </div>
                ))}
              </div>

              {/* CAJA COMENTARIOS ESTILO GEMINI */}
              {!mostrarCajaComentario ? (
                <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-30">
                  <button onClick={() => setMostrarCajaComentario(true)} className="bg-slate-900 text-white shadow-xl px-8 py-4 rounded-full font-black flex items-center gap-2 hover:scale-105 transition">💬 Añadir respuesta técnica</button>
                </div>
              ) : (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-[95%] max-w-2xl bg-white shadow-2xl border border-slate-200 rounded-3xl p-3 z-30 animate-fadeIn">
                  <form onSubmit={manejarAgregarComentario} className="flex flex-col">
                    {previewsComentario.length > 0 && (
                      <div className="flex gap-2 px-3 pt-2 pb-2 overflow-x-auto scrollbar-hide">
                        {previewsComentario.map((url, i) => (
                          <div key={i} className="relative flex-shrink-0 border border-slate-200 rounded-xl overflow-hidden h-16 w-16">
                            {archivosComentario[i].type.startsWith('video') ? <video src={url} className="h-full w-full object-cover" /> 
                            : archivosComentario[i].type === 'application/pdf' ? <div className="h-full w-full bg-red-100 flex items-center justify-center text-[10px] font-bold text-red-600">PDF</div> 
                            : <img src={url} className="h-full w-full object-cover" alt="prev"/>}
                          </div>
                        ))}
                        <button type="button" onClick={() => {setArchivosComentario([]); setPreviewsComentario([]);}} className="text-xs font-bold text-red-500 ml-2 hover:underline">Quitar</button>
                      </div>
                    )}
                    <div className="flex items-end gap-2 px-2">
                      <label className="cursor-pointer text-slate-400 hover:text-blue-600 p-2 transition">
                        <input type="file" multiple accept="image/*,video/*,application/pdf" className="hidden" onChange={e => {
                          const files = Array.from(e.target.files);
                          setArchivosComentario(files); setPreviewsComentario(files.map(f => URL.createObjectURL(f)));
                        }} />
                        <span className="text-2xl">📎</span>
                      </label>
                      <textarea value={textoComentario} onChange={(e) => setTextoComentario(e.target.value)} placeholder="Describa el seguimiento..." className="flex-1 bg-transparent text-slate-800 py-3 max-h-32 min-h-[48px] resize-none outline-none font-medium" required />
                      <div className="flex gap-2 p-1">
                        <button type="button" onClick={() => {setMostrarCajaComentario(false); setArchivosComentario([]); setPreviewsComentario([]); setTextoComentario('');}} className="p-2 text-slate-400 hover:text-slate-600 font-bold text-xl rounded-full">✕</button>
                        <button type="submit" className="bg-slate-900 text-white p-2 rounded-full w-10 h-10 flex items-center justify-center shadow-md">⬆️</button>
                      </div>
                    </div>
                  </form>
                </div>
              )}
            </div>
          ) : (
            /* FEED PRINCIPAL CON EDICIÓN/BORRADO */
            <div className="space-y-8">
              {/* FILTROS MÓVIL */}
              <div className="lg:hidden flex flex-col gap-3">
                <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-hide">
                  <button onClick={() => setFiltroCat('Todas')} className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold border transition ${filtroCat === 'Todas' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600'}`}>🌎 Todas</button>
                  {cats.oficiales.map(c => <button key={c} onClick={() => setFiltroCat(c)} className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold border transition ${filtroCat === c ? 'bg-blue-600 text-white' : 'bg-white text-slate-600'}`}>{c}</button>)}
                  {cats.populares.map(c => <button key={c.nombre} onClick={() => setFiltroCat(c.nombre)} className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold border transition ${filtroCat === c.nombre ? 'bg-orange-500 text-white' : 'bg-white text-slate-600'}`}>{c.nombre}</button>)}
                </div>
              </div>

              {/* CAJA DE PUBLICAR */}
              <div className="bg-white p-6 rounded-3xl border shadow-sm">
                <form onSubmit={manejarCrearAlerta} className="space-y-4">
                  <div className="flex gap-4">
                    <img src={usuarioLogueado.fotoPerfilUrl || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} className="w-12 h-12 rounded-full object-cover border" alt="pfp"/>
                    <div className="flex-1">
                      <textarea value={nuevoTitulo} onChange={e => setNuevoTitulo(e.target.value)} placeholder="¿Qué incidencia operativa detectas?" className="w-full text-xl outline-none resize-none pt-2" rows="2" required />
                      
                      {nuevoTipo === 'Otro' && (
                        <input type="text" placeholder="Escribe la categoría personalizada..." className="w-full p-3 mt-2 rounded-xl border border-blue-200 bg-blue-50 font-bold text-blue-700 outline-none focus:border-blue-500" value={customTipo} onChange={e => setCustomTipo(e.target.value)} required />
                      )}

                      {previews.length > 0 && (
                        <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide border rounded-2xl p-2 bg-slate-50">
                          {previews.map((url, i) => (
                            <div key={i} className="relative flex-shrink-0 rounded-xl overflow-hidden h-20 w-20 shadow-sm border">
                              {archivos[i].type.startsWith('video') ? <video src={url} className="h-full w-full object-cover" /> 
                              : archivos[i].type === 'application/pdf' ? <div className="h-full w-full bg-red-100 flex items-center justify-center text-xs font-bold text-red-600">PDF</div> 
                              : <img src={url} className="h-full w-full object-cover" alt="prev"/>}
                            </div>
                          ))}
                          <button type="button" onClick={() => {setArchivos([]); setPreviews([]);}} className="bg-red-100 text-red-600 px-3 rounded-xl font-bold text-xs hover:bg-red-200 transition">Quitar Todo</button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 items-center justify-between border-t pt-4">
                    <div className="flex items-center gap-4">
                      <select value={nuevoTipo} onChange={e => setNuevoTipo(e.target.value)} className="bg-slate-50 border p-2 rounded-full font-bold text-sm outline-none cursor-pointer">
                        <option value="Bache">⚠️ Bache</option>
                        <option value="Fuga de Agua">💧 Fuga de Agua</option>
                        <option value="Alumbrado">💡 Alumbrado</option>
                        <option value="Basura">🗑️ Basura</option>
                        <option value="Otro">📌 Otro (Escribir)</option>
                      </select>
                      <label className="cursor-pointer bg-slate-50 hover:bg-slate-100 border px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 transition">
                        📸 Evidencias
                        <input type="file" multiple accept="image/*,video/*,application/pdf" className="hidden" onChange={e => {
                          const files = Array.from(e.target.files);
                          if(files.length > 150) return alert("Máximo 150 archivos por reporte.");
                          setArchivos(files); setPreviews(files.map(f => URL.createObjectURL(f)));
                        }} />
                      </label>
                    </div>
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-full font-bold shadow-md transition">Publicar Reporte</button>
                  </div>
                </form>
              </div>

              {/* LISTA DE POSTS CON EDICIÓN/BORRADO */}
              {filtrados.length === 0 && <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300"><p className="text-xl font-bold text-slate-500">Jurisdicción limpia de reportes ✨</p></div>}

              {filtrados.map(r => {
                const haVotado = r.votosUsuarios && r.votosUsuarios.includes(usuarioLogueado.email);
                return (
                  <article key={r._id} onClick={() => setReporteSeleccionado(r)} className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 flex gap-5 hover:bg-slate-50 transition cursor-pointer group">
                    <div className="flex flex-col items-center bg-slate-50 rounded-full p-2 h-fit min-w-[50px] border">
                      <button onClick={async (e) => { e.stopPropagation(); await fetch(`http://localhost:5000/api/reportes/${r._id}/votar`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({emailUsuario: usuarioLogueado.email})}); fetchReportes(); }} className={`text-xl font-bold transition ${haVotado ? 'text-orange-500' : 'text-slate-400 hover:text-orange-400'}`}>▲</button>
                      <span className={`font-black my-1 ${haVotado ? 'text-orange-600' : 'text-slate-700'}`}>{r.votos}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-3">
                          <img src={r.autorFoto || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} className="w-10 h-10 rounded-full object-cover border" alt="pfp" />
                          <div>
                            <p className="font-bold text-sm text-slate-800">{r.autorNombre}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{r.ubicacion}</p>
                          </div>
                        </div>
                        {r.autorEmail === usuarioLogueado.email && (
                          <div className="flex gap-2">
                            <button onClick={(e) => manejarEditarReporte(r._id, r.titulo, e)} className="text-xs font-bold text-slate-400 hover:text-blue-600 transition">✏️</button>
                            <button onClick={(e) => manejarEliminarReporte(r._id, e)} className="text-xs font-bold text-slate-400 hover:text-red-500 transition">🗑️</button>
                          </div>
                        )}
                      </div>
                      <h3 className="text-xl font-bold mb-3 leading-snug">{r.titulo}</h3>
                      <div onClick={e => e.stopPropagation()}>
                        <VisorMultimedia urls={r.archivosUrls} />
                      </div>
                      <div className="flex gap-4 text-sm font-bold text-slate-500 mt-4 border-t pt-4">
                        <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-md text-xs">{r.tipoProblema}</span>
                        <span className="pt-1 text-xs">💬 {r.comentarios.length} Respuestas técnicas</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>

        {/* SIDEBAR DERECHO: ZONAS Y ORDEN */}
        {!reporteSeleccionado && (
          <aside className="hidden lg:block lg:col-span-3 space-y-6">
            {/* LÍMITE DE ALTURA Y SCROLL PARA QUE NO SE CORTE */}
            <div className="bg-white p-6 rounded-3xl border shadow-sm sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">📍 Jurisdicciones</h3>
              {listaZonas.map(z => (
                <button key={z} onClick={() => setFiltroZona(z)} className={`w-full text-left p-3 rounded-xl font-bold mb-1 text-sm transition flex justify-between items-center ${filtroZona === z ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'hover:bg-slate-50 text-slate-600 border border-transparent'}`}>
                  <span>{z === 'General' ? '🌎 Todas' : z}</span>
                  {filtroZona === z && <span className="w-2 h-2 rounded-full bg-blue-600 self-center"></span>}
                </button>
              ))}
              <div className="border-t mt-4 pt-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Prioridad</h3>
                <button onClick={() => setOrden('Recientes')} className={`w-full p-3 rounded-xl font-bold text-sm mb-2 transition flex items-center gap-2 ${orden === 'Recientes' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>🕐 Recientes</button>
                <button onClick={() => setOrden('Relevantes')} className={`w-full p-3 rounded-xl font-bold text-sm transition flex items-center gap-2 ${orden === 'Relevantes' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>🔥 Relevantes</button>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* ================= MODAL CONFIGURACIÓN PERFIL (AQUÍ ESTÁ LA FOTO) ================= */}
      {showConfig && (
        <div className="fixed inset-0 bg-slate-950/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white p-8 rounded-3xl max-w-md w-full relative shadow-2xl border border-slate-100">
            <button onClick={() => setShowConfig(false)} className="absolute top-4 right-4 bg-slate-100 text-slate-500 w-8 h-8 rounded-full font-bold hover:bg-red-500 hover:text-white transition flex items-center justify-center">✕</button>
            <h2 className="text-2xl font-black mb-6 text-slate-900 flex items-center gap-2">⚙️ Tu Panel Técnico</h2>
            <form onSubmit={updatePerfil} className="space-y-4">
              {/* SUBIDA DE FOTO PERFIL */}
              <div className="flex flex-col items-center gap-3 mb-6">
                <img src={fileFoto ? URL.createObjectURL(fileFoto) : (usuarioLogueado.fotoPerfilUrl || 'https://cdn-icons-png.flaticon.com/512/149/149071.png')} className="w-24 h-24 rounded-full border-4 border-blue-50 object-cover shadow-md" alt="pfp" />
                <label className="bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-full font-bold text-xs cursor-pointer transition flex items-center gap-1.5">
                  📸 Cambiar Foto
                  <input type="file" accept="image/*" className="hidden" onChange={e => setFileFoto(e.target.files[0])} />
                </label>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Nombre Completo</label>
                <input type="text" value={configNombre} onChange={e => setConfigNombre(e.target.value)} className="w-full px-4 py-3 rounded-xl border bg-slate-50 outline-none focus:border-blue-500 focus:bg-white" required placeholder="Nombre" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Correo Institucional</label>
                <input type="email" value={configEmail} onChange={e => setConfigEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border bg-slate-50 outline-none focus:border-blue-500 focus:bg-white" required placeholder="Correo" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Jurisdicción</label>
                <select value={configComunidad} onChange={e => setConfigComunidad(e.target.value)} className="w-full px-4 py-3 rounded-xl border bg-slate-50 outline-none font-medium transition">
                  {listaZonas.filter(z => z !== 'General').map(z => <option key={z} value={z}>{z}</option>)}
                </select>
              </div>
              <div className="border-t pt-4 mt-2">
                <p className="text-xs font-bold uppercase text-slate-400 mb-3">Actualizar Contraseña</p>
                <input type="password" value={configNewPassword} onChange={e => setConfigNewPassword(e.target.value)} placeholder="Nueva contraseña (Opcional)" className="w-full px-4 py-3 rounded-xl border bg-slate-50 outline-none mb-3 text-sm focus:border-blue-500 focus:bg-white" />
                {configNewPassword && <input type="password" value={configCurrentPassword} onChange={e => setConfigCurrentPassword(e.target.value)} placeholder="Contraseña actual requerida" className="w-full px-4 py-3 rounded-xl border border-amber-300 bg-amber-50 outline-none text-sm" required />}
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold shadow-md hover:bg-blue-700 transition mt-4">Guardar Parámetros</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;