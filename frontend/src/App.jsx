const API_URL = import.meta.env.VITE_API_URL || `${API_URL}`;
import React, { useState, useEffect } from 'react';

// ============================================================================
// COMPONENTE INTERNO: VISOR MULTIMEDIA
// ============================================================================
const VisorMultimedia = ({ urls = [] }) => {
  const [indice, setIndice] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  
  if (!urls || urls.length === 0) return null;
  const urlActual = urls[indice];
  const ext = urlActual.split('.').pop().toLowerCase();
  
  const render = (url, full = false) => {
    if (['mp4','webm','mov'].includes(ext)) return <video src={url} controls className={full ? "max-h-[90vh]" : "max-h-[500px] w-full rounded-2xl bg-black"} />;
    if (ext === 'pdf') return <iframe src={url} className={full ? "w-[80vw] h-[90vh]" : "w-full h-96 rounded-2xl"} title="pdf"/>;
    return <img src={url} className={full ? "max-h-[90vh] object-contain" : "max-h-[500px] w-full object-cover rounded-2xl cursor-zoom-in"} onClick={() => !full && setLightbox(true)} alt="evidencia"/>;
  };

  return (
    <div className="relative mt-4">
      {render(urlActual)}
      {urls.length > 1 && (
        <div className="absolute bottom-4 right-4 bg-black/60 text-white px-4 py-1.5 rounded-full text-sm font-bold flex items-center shadow-lg backdrop-blur-sm">
          <button onClick={(e) => {e.stopPropagation(); setIndice(i => i===0 ? urls.length-1 : i-1)}} className="hover:text-blue-300 p-1">◀</button>
          <span className="mx-3">{indice + 1} / {urls.length}</span>
          <button onClick={(e) => {e.stopPropagation(); setIndice(i => i===urls.length-1 ? 0 : i+1)}} className="hover:text-blue-300 p-1">▶</button>
        </div>
      )}
      {lightbox && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4" onClick={() => setLightbox(false)}>
          <button className="absolute top-4 right-4 text-white text-4xl font-black hover:text-red-500 z-50">✕</button>
          <div className="relative w-full max-w-7xl flex justify-center" onClick={e => e.stopPropagation()}>
            {render(urlActual, true)}
            {urls.length > 1 && (
              <>
                <button onClick={(e) => {e.stopPropagation(); setIndice(i => i===0 ? urls.length-1 : i-1)}} className="absolute -left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full w-14 h-14 flex items-center justify-center text-2xl transition shadow-xl">◀</button>
                <button onClick={(e) => {e.stopPropagation(); setIndice(i => i===urls.length-1 ? 0 : i+1)}} className="absolute -right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full w-14 h-14 flex items-center justify-center text-2xl transition shadow-xl">▶</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

function tiempoTranscurrido(fechaPublicacion) {
  if (!fechaPublicacion) return "hace un momento";
  const segundos = Math.floor((new Date() - new Date(fechaPublicacion)) / 1000);
  if (segundos < 0) return "hace un momento";
  let intervalo = segundos / 31536000;
  if (intervalo >= 1) return "hace " + Math.floor(intervalo) + (Math.floor(intervalo) === 1 ? " año" : " años");
  intervalo = segundos / 2592000;
  if (intervalo >= 1) return "hace " + Math.floor(intervalo) + (Math.floor(intervalo) === 1 ? " mes" : " meses");
  intervalo = segundos / 86400;
  if (intervalo >= 1) return "hace " + Math.floor(intervalo) + (Math.floor(intervalo) === 1 ? " día" : " días");
  intervalo = segundos / 3600;
  if (intervalo >= 1) return "hace " + Math.floor(intervalo) + (Math.floor(intervalo) === 1 ? " hora" : " horas");
  intervalo = segundos / 60;
  if (intervalo >= 1) return "hace " + Math.floor(intervalo) + (Math.floor(intervalo) === 1 ? " minuto" : " minutos");
  return "hace " + Math.floor(segundos) + " segundos";
}

// ============================================================================
// COMPONENTE: VISTA DE PERFIL (propio o ajeno)
// ============================================================================
const VistaPerfil = ({ emailPerfil, usuarioLogueado, reportes, onVolver, onAbrirConfig, onVerPerfil, onAbrirReporte }) => {
  const [perfilData, setPerfilData] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [fileBanner, setFileBanner] = useState(null);
  const [subiendoBanner, setSubiendoBanner] = useState(false);

  const esMiPerfil = emailPerfil === usuarioLogueado.email;

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      try {
        const res = await fetch(`${API_URL}/api/auth/perfil/${encodeURIComponent(emailPerfil)}`, { credentials: 'include' });
        const data = await res.json();
        if (res.ok) setPerfilData(data);
      } catch (err) { console.error(err); }
      finally { setCargando(false); }
    };
    cargar();
  }, [emailPerfil]);

  useEffect(() => {
    if (esMiPerfil && perfilData) {
      setPerfilData(prev => ({
        ...prev,
        fotoPerfilUrl: usuarioLogueado.fotoPerfilUrl,
        bannerUrl: usuarioLogueado.bannerUrl,
        nombre: usuarioLogueado.nombre,
        comunidad: usuarioLogueado.comunidad,
      }));
    }
  }, [usuarioLogueado]);

  const subirBanner = async (file) => {
    if (!file || !esMiPerfil) return;
    setSubiendoBanner(true);
    const fd = new FormData();
    fd.append('bannerPerfil', file);
    fd.append('datos', JSON.stringify({ nombre: usuarioLogueado.nombre, email: usuarioLogueado.email, comunidad: usuarioLogueado.comunidad }));
    try {
      const res = await fetch(`${API_URL}/api/auth/profile`, { method: 'PUT', credentials: 'include', body: fd });
      const data = await res.json();
      if (res.ok) {
        setPerfilData(prev => ({ ...prev, bannerUrl: data.usuario.bannerUrl }));
        window.dispatchEvent(new CustomEvent('crowdfix:usuarioActualizado', { detail: data.usuario }));
      }
    } catch (err) { console.error(err); }
    finally { setSubiendoBanner(false); setFileBanner(null); }
  };

  if (cargando) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
  if (!perfilData) return (
    <div className="text-center py-20 text-slate-400 font-bold">Usuario no encontrado.</div>
  );

  const misReportes = reportes.filter(r => {
    if (r.autorEmail !== emailPerfil) return false;
    return esMiPerfil ? true : r.estado !== 'Bloqueado';
  });
  
  const totalReportes = misReportes.length;
  const totalVotosRecibidos = misReportes.reduce((acc, r) => acc + (r.votos || 0), 0);
  const totalComentarios = reportes.reduce((acc, r) => {
    return acc + (r.comentarios || []).filter(c => c.autorEmail === emailPerfil).length;
  }, 0);
  const fechaRegistro = perfilData.fechaRegistro
    ? new Date(perfilData.fechaRegistro).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'N/A';

  const bannerActual = fileBanner ? URL.createObjectURL(fileBanner) : (perfilData.bannerUrl || null);

  return (
    <div className="animate-fadeIn max-w-3xl mx-auto">
      <button onClick={onVolver} className="mb-6 font-bold text-slate-500 hover:text-slate-800 bg-white px-5 py-3 rounded-xl shadow-sm border border-slate-200 transition">← Regresar</button>

      <div className="relative w-full h-52 rounded-3xl overflow-hidden mb-0 shadow-sm border border-slate-200 bg-gradient-to-br from-slate-700 via-blue-800 to-slate-900 group">
        {bannerActual
          ? <img src={bannerActual} className="w-full h-full object-cover" alt="banner" />
          : (
            <div className="w-full h-full flex items-center justify-center opacity-30">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            </div>
          )
        }
        {esMiPerfil && (
          <label className={`absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition cursor-pointer ${subiendoBanner ? 'opacity-100' : ''}`}>
            {subiendoBanner
              ? <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              : <span className="text-white font-black text-sm bg-black/50 px-5 py-2.5 rounded-full backdrop-blur-sm flex items-center gap-2">🖼️ Cambiar Banner</span>
            }
            <input type="file" accept="image/*" className="hidden" onChange={e => {
              const f = e.target.files[0];
              if (f) { setFileBanner(f); subirBanner(f); }
            }} />
          </label>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm px-8 pt-0 pb-8 -mt-1 relative">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-14 mb-6">
          <div className="relative w-28 h-28 flex-shrink-0">
            <img src={perfilData.fotoPerfilUrl || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} className="w-28 h-28 rounded-full border-4 border-white shadow-lg object-cover" alt="pfp" />
          </div>
          <div className="flex-1 pb-1">
            <h2 className="text-2xl font-black text-slate-900 leading-tight">{perfilData.nombre}</h2>
            <p className="text-sm font-bold text-blue-600 uppercase tracking-wide">{perfilData.comunidad}</p>
            <p className="text-xs text-slate-400 font-medium mt-0.5">{perfilData.email}</p>
          </div>
          {esMiPerfil && (
            <button onClick={onAbrirConfig} className="self-start sm:self-end bg-slate-100 hover:bg-slate-200 text-slate-700 font-black px-5 py-2.5 rounded-xl text-sm transition border">⚙️ Editar Perfil</button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Reportes', value: totalReportes, icon: '📋', color: 'blue' },
            { label: 'Votos recibidos', value: totalVotosRecibidos, icon: '▲', color: 'orange' },
            { label: 'Comentarios', value: totalComentarios, icon: '💬', color: 'green' },
            { label: 'Miembro desde', value: fechaRegistro, icon: '📅', color: 'slate', small: true },
          ].map(stat => (
            <div key={stat.label} className={`bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col items-center text-center`}>
              <span className="text-2xl mb-1">{stat.icon}</span>
              <span className={`font-black text-xl ${stat.color === 'blue' ? 'text-blue-600' : stat.color === 'orange' ? 'text-orange-500' : stat.color === 'green' ? 'text-green-600' : 'text-slate-700'} ${stat.small ? 'text-sm leading-tight' : ''}`}>{stat.value}</span>
              <span className="text-xs text-slate-400 font-bold uppercase mt-1">{stat.label}</span>
            </div>
          ))}
        </div>

        <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
          🚨 Reportes publicados
          <span className="bg-slate-100 text-slate-500 text-xs font-bold px-2 py-0.5 rounded-full">{totalReportes}</span>
        </h3>
        <div className="space-y-4">
          {misReportes.length === 0 && (
            <div className="text-center py-10 text-slate-400 font-bold border border-dashed border-slate-200 rounded-2xl">Sin reportes aún.</div>
          )}
          {misReportes
            .sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion))
            .map(r => {
              const esAlerta = r.titulo.includes('[🚨 RIESGO INMINENTE]');
              const tituloVisual = r.titulo.replace('[🚨 RIESGO INMINENTE] ', '');
              return (
                <div key={r._id} onClick={() => onAbrirReporte && onAbrirReporte(r)} className={`border rounded-2xl p-5 flex gap-4 items-start bg-white hover:shadow-md transition cursor-pointer ${esAlerta ? 'border-red-300 bg-red-50/20' : 'border-slate-200'}`}>
                  <div className="flex flex-col items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 min-w-[52px] text-center">
                    <span className={`font-black text-lg ${r.votos > 0 ? 'text-orange-500' : 'text-slate-300'}`}>▲</span>
                    <span className="font-black text-base text-slate-700">{r.votos}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    {esAlerta && <span className="inline-block mb-1 bg-red-100 text-red-700 text-[10px] font-black px-2 py-0.5 rounded-md uppercase border border-red-200">Alerta Máxima</span>}
                    {r.estado === 'Bloqueado' && <span className="inline-block mb-1 ml-2 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase border border-red-700">CENSURADO</span>}
                    <p className="font-black text-slate-800 leading-snug">{tituloVisual}</p>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs font-bold text-slate-400">
                      <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md border border-blue-100">{r.tipoProblema}</span>
                      <span>💬 {r.comentarios?.length || 0}</span>
                      <span>{tiempoTranscurrido(r.fechaCreacion)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENTE: VISTA DE ADMINISTRADOR MAESTRO
// ============================================================================
const VistaAdmin = ({ adminStats, recargarDatos }) => {
  if (!adminStats) return <div className="text-center py-20 font-bold text-slate-400">Cargando datos crudos...</div>;

  const { totalUsuarios, totalReportes, usuariosPorZona, reportesCrudos } = adminStats;
  const topZonasUsuarios = Object.entries(usuariosPorZona).sort((a,b) => b[1] - a[1]);
  const maxUsuariosZona = topZonasUsuarios.length > 0 ? topZonasUsuarios[0][1] : 1;

  const bloquearReporte = async (id) => {
    const motivo = window.prompt("¿Motivo del bloqueo? (Se le notificará al usuario):");
    if (!motivo) return;
    try {
      await fetch(`${API_URL}/api/admin/bloquear-reporte/${id}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ motivo }), credentials: 'include'
      });
      recargarDatos();
    } catch (err) { alert("Error al bloquear"); }
  };

  const reactivarReporte = async (id) => {
    if (!window.confirm("¿Reactivar este reporte para que vuelva a ser público?")) return;
    try {
      await fetch(`${API_URL}/api/admin/reactivar-reporte/${id}`, { method: 'POST', credentials: 'include' });
      recargarDatos();
    } catch (err) { alert("Error al reactivar"); }
  };

  const enviarRespuestaApelacion = async (id, texto) => {
    if (!texto.trim()) return;
    try {
      await fetch(`${API_URL}/api/admin/apelacion/${id}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto }), credentials: 'include'
      });
      recargarDatos();
    } catch (err) { alert("Error al enviar respuesta"); }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-8 animate-fadeIn">
      <div className="mb-8 border-b-4 border-red-500 pb-4">
        <h2 className="text-4xl font-black text-slate-900">👑 Panel de Control Maestro</h2>
        <p className="text-red-500 font-bold mt-1 uppercase tracking-widest text-sm">Acceso Nivel Administrador</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl flex items-center justify-between">
          <div><p className="text-slate-400 font-bold uppercase text-sm mb-1">Usuarios Registrados</p><h3 className="text-5xl font-black">{totalUsuarios}</h3></div>
          <span className="text-5xl">👥</span>
        </div>
        <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl flex items-center justify-between">
          <div><p className="text-slate-400 font-bold uppercase text-sm mb-1">Reportes Totales</p><h3 className="text-5xl font-black">{totalReportes}</h3></div>
          <span className="text-5xl">📋</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 h-fit lg:col-span-1">
          <h3 className="text-lg font-black text-slate-800 mb-6">📍 Densidad de Usuarios</h3>
          <div className="space-y-4">
            {topZonasUsuarios.map(([zona, count]) => (
              <div key={zona}>
                <div className="flex justify-between text-xs font-bold text-slate-600 mb-1"><span>{zona}</span><span>{count} usr</span></div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden"><div className="bg-red-500 h-3 rounded-full" style={{ width: `${(count / maxUsuariosZona) * 100}%` }}></div></div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 lg:col-span-2">
          <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center justify-between">
            <span>🛡️ Moderación de Feed</span>
            <span className="text-xs bg-slate-100 text-slate-500 px-3 py-1 rounded-full">Total: {reportesCrudos?.length || 0}</span>
          </h3>
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            {reportesCrudos?.map(r => {
              const estaBloqueado = r.estado === 'Bloqueado';
              return (
                <div key={r._id} className={`p-4 rounded-2xl border ${estaBloqueado ? 'bg-red-50/50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 pr-4">
                      {estaBloqueado && (
                        <span className={`inline-block text-white text-[10px] font-black px-2 py-0.5 rounded uppercase mb-1 ${r.revisadoPorBot && r.motivoBloqueo ? 'bg-indigo-600' : 'bg-red-600'}`}>
                          {r.revisadoPorBot && r.motivoBloqueo ? '🤖 Bloqueado por IA' : 'Censurado por Admin'}
                        </span>
                      )}
                      <p className="font-bold text-slate-800 line-clamp-2 leading-tight">{r.titulo}</p>
                      <p className="text-xs text-slate-500 mt-1 font-medium">Por: {r.autorNombre} ({r.autorEmail})</p>
                    </div>
                    {estaBloqueado ? (
                      <button onClick={() => reactivarReporte(r._id)} className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1.5 rounded-lg text-xs font-black transition">Reactivar</button>
                    ) : (
                      <button onClick={() => bloquearReporte(r._id)} className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1.5 rounded-lg text-xs font-black transition">Bloquear</button>
                    )}
                  </div>
                  {estaBloqueado && r.motivoBloqueo && <p className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded mt-2"><strong>Motivo:</strong> {r.motivoBloqueo}</p>}
                  
                  {estaBloqueado && r.apelacion && (
                    <div className="mt-4 bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-inner">
                      <h4 className="text-sm font-black text-slate-500 uppercase mb-4 flex items-center gap-2">💬 Apelación ({r.apelacion.estado})</h4>
                      <div className="space-y-3 mb-4 max-h-80 overflow-y-auto pr-2">
                        {r.apelacion.mensajes.map((m, i) => (
                          <div key={i} className={`text-sm p-3 rounded-xl shadow-sm w-fit max-w-[85%] ${m.isAdmin ? 'bg-slate-800 text-white ml-auto' : 'bg-white border border-slate-200 text-slate-800'}`}>
                            <strong className="block mb-1 opacity-60 text-[10px] uppercase tracking-wider">{m.autor}</strong> 
                            <span className="font-medium">{m.texto}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-3 mt-2">
                        <input 
                          type="text" 
                          id={`apelacion-${r._id}`} 
                          placeholder="Escribe una respuesta al usuario..." 
                          className="flex-1 text-sm font-medium border border-slate-300 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition bg-white" 
                          onKeyDown={(e) => { 
                            if (e.key === 'Enter') { 
                              document.getElementById(`btn-enviar-${r._id}`).click(); 
                            } 
                          }} 
                        />
                        <button 
                          id={`btn-enviar-${r._id}`} 
                          onClick={() => {
                            const input = document.getElementById(`apelacion-${r._id}`);
                            enviarRespuestaApelacion(r._id, input.value);
                            input.value = '';
                          }} 
                          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-6 py-3 rounded-xl font-black transition shadow-md"
                        >
                          Enviar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
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
  
  const [adminStats, setAdminStats] = useState(null);
  const [notificaciones, setNotificaciones] = useState([]);
  const [mostrarBuzon, setMostrarBuzon] = useState(false);

  const [vistaActual, setVistaActual] = useState('feed');
  const [emailPerfilViendo, setEmailPerfilViendo] = useState(null);
  
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [comunidad, setComunidad] = useState('Puente Moreno');

  const [reportes, setReportes] = useState([]);
  const [cats, setCategorias] = useState({ oficiales: [], populares: [] });
  const [reporteSeleccionado, setReporteSeleccionado] = useState(null);
  
  const [filtroZona, setFiltroZona] = useState('General');
  const [filtroCat, setFiltroCat] = useState('Todas');
  const [orden, setOrden] = useState('Recientes');
  
  const [busqueda, setBusqueda] = useState('');
  const [historial, setHistorial] = useState([]);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [menuMobileAbierto, setMenuMobileAbierto] = useState(false); 

  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [nuevoTipo, setNuevoTipo] = useState('Automático');
  const [customTipo, setCustomTipo] = useState('');
  const [esAlertaMaxima, setEsAlertaMaxima] = useState(false);
  const [archivos, setArchivos] = useState([]);
  const [previews, setPreviews] = useState([]);
  
  const [analizando, setAnalizando] = useState(false);
  const [generandoPDF, setGenerandoPDF] = useState(false);

  const [textoComentario, setTextoComentario] = useState('');
  const [archivosComentario, setArchivosComentario] = useState([]); 
  const [previewsComentario, setPreviewsComentario] = useState([]);
  const [mostrarCajaComentario, setMostrarCajaComentario] = useState(false);

  const [showConfig, setShowConfig] = useState(false);
  const [fileFoto, setFileFoto] = useState(null);
  const [configNombre, setConfigNombre] = useState('');
  const [configEmail, setConfigEmail] = useState('');
  const [configComunidad, setConfigComunidad] = useState('');
  const [configCurrentPassword, setConfigCurrentPassword] = useState('');
  const [configNewPassword, setConfigNewPassword] = useState('');

  const listaZonas = [
    'General', 'Puente Moreno', 'Lagos de Puente Moreno', 'Arboledas San Ramón',
    'Las Palmas', 'Residencial Marino', 'Arboledas de San Miguel',
    'Leonardo Rodríguez Alcaine', 'Paso del Campestre', 'Nuevo Medellín'
  ];

  useEffect(() => {
    const handler = (e) => setUsuarioLogueado(e.detail);
    window.addEventListener('crowdfix:usuarioActualizado', handler);
    return () => window.removeEventListener('crowdfix:usuarioActualizado', handler);
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/me`, { credentials: 'include' });
        const data = await res.json();
        if (res.ok) setUsuarioLogueado(data.usuario);
      } catch {} finally { setVerificando(false); }
    };
    init();
    setHistorial(JSON.parse(localStorage.getItem('historialBusqueda')) || []);
  }, []);

  useEffect(() => { 
    if (usuarioLogueado) { 
      fetchReportes(); 
      fetchCategorias(); 
      fetchNotificaciones();
    }
  }, [usuarioLogueado]);

  useEffect(() => {
    let intervalo;
    if (usuarioLogueado) {
      intervalo = setInterval(async () => {
        try {
          const resRep = await fetch(`${API_URL}/api/reportes`);
          if (resRep.ok) {
            const dataRep = await resRep.json();
            setReportes(dataRep);
            setReporteSeleccionado(prev => {
              if (!prev) return null;
              return dataRep.find(r => r._id === prev._id) || prev;
            });
          }
          const resNot = await fetch(`${API_URL}/api/auth/notificaciones`, { credentials: 'include' });
          if (resNot.ok) {
            const dataNot = await resNot.json();
            setNotificaciones(dataNot.reverse());
          }
          if (usuarioLogueado.email === 'admin@crowdfix.com') {
            const resAdmin = await fetch(`${API_URL}/api/admin/stats`, { credentials: 'include' });
            if (resAdmin.ok) setAdminStats(await resAdmin.json());
          }
        } catch (err) { console.error("Error actualizando datos en vivo", err); }
      }, 5000); 
    }
    return () => clearInterval(intervalo);
  }, [usuarioLogueado]);

  const fetchReportes = async () => {
    try {
      const res = await fetch(`${API_URL}/api/reportes`);
      const data = await res.json();
      if(res.ok) setReportes(data);
    } catch(err) { console.error(err); }
  };
  const fetchCategorias = async () => {
    try {
      const res = await fetch(`${API_URL}/api/reportes/categorias`);
      const data = await res.json();
      if(res.ok) setCategorias(data);
    } catch(err) { console.error(err); }
  };
  const fetchNotificaciones = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/notificaciones`, { credentials: 'include' });
      const data = await res.json();
      if(res.ok) setNotificaciones(data.reverse()); 
    } catch(err) { console.error(err); }
  };
  const cargarAdminStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/stats`, { credentials: 'include' });
      if(res.ok) setAdminStats(await res.json());
    } catch(err) { console.error(err); }
  };

  const manejarSubmitAuth = async (e) => {
    e.preventDefault();
    const endpoint = esRegistro ? 'register' : 'login';
    try {
      const res = await fetch(`${API_URL}/api/auth/${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify(esRegistro ? { nombre, email, password, comunidad } : { email, password })
      });
      const datos = await res.json();
      if (res.ok) {
        if (esRegistro) { alert('Registro exitoso. Inicia sesión.'); setEsRegistro(false); setPassword(''); } 
        else setUsuarioLogueado(datos.usuario);
      } else { alert(datos.mensaje); }
    } catch (err) { alert('Error de conexión.'); }
  };

  const ejecutarBusqueda = (termino) => {
    setBusqueda(termino); setMostrarHistorial(false);
    if (!termino.trim()) return;
    let nuevoHistorial = historial.filter(item => item !== termino);
    nuevoHistorial.unshift(termino);
    if (nuevoHistorial.length > 5) nuevoHistorial.pop();
    setHistorial(nuevoHistorial);
    localStorage.setItem('historialBusqueda', JSON.stringify(nuevoHistorial));
  };
  const borrarDelHistorial = (e, termino) => {
    e.stopPropagation();
    const nuevoHistorial = historial.filter(item => item !== termino);
    setHistorial(nuevoHistorial); localStorage.setItem('historialBusqueda', JSON.stringify(nuevoHistorial));
  };

  const verPerfil = (emailTarget) => { setEmailPerfilViendo(emailTarget); setVistaActual('perfil'); setReporteSeleccionado(null); setMenuMobileAbierto(false); };

  const manejarCrearAlerta = async (e) => {
    e.preventDefault();
    setAnalizando(true); 
    
    const fd = new FormData();
    fd.append('titulo', esAlertaMaxima ? `[🚨 RIESGO INMINENTE] ${nuevoTitulo}` : nuevoTitulo);
    fd.append('tipoProblema', nuevoTipo); fd.append('customTipo', customTipo); fd.append('ubicacion', usuarioLogueado.comunidad);
    fd.append('autorNombre', usuarioLogueado.nombre); fd.append('autorEmail', usuarioLogueado.email); fd.append('autorFoto', usuarioLogueado.fotoPerfilUrl);
    archivos.forEach(a => fd.append('archivos', a));
    
    try {
      const res = await fetch(`${API_URL}/api/reportes`, { method: 'POST', body: fd });
      if (res.ok) { 
        const data = await res.json();
        if (data.estado === 'Bloqueado') {
          alert(`🤖 Tu publicación fue pausada por el filtro automático.\nMotivo: ${data.motivoBloqueo}\nPuedes apelar la decisión en tu perfil.`);
        } else {
          alert('¡Reporte publicado exitosamente!');
        }
        setNuevoTitulo(''); setArchivos([]); setPreviews([]); setNuevoTipo('Automático'); setCustomTipo(''); setEsAlertaMaxima(false); 
        fetchReportes(); fetchCategorias(); 
      }
    } catch (error) {
      alert("Hubo un error al conectar con el servidor.");
    } finally {
      setAnalizando(false); 
    }
  };

  const manejarEditarReporte = async (id, tituloActual, e) => {
    e.stopPropagation();
    const nuevo = window.prompt("Edita tu publicación:", tituloActual);
    if (!nuevo || nuevo === tituloActual) return;
    await fetch(`${API_URL}/api/reportes/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ titulo: nuevo }) });
    fetchReportes();
  };

  const manejarEliminarReporte = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("¿Seguro que deseas eliminar esta publicación?")) return;
    await fetch(`${API_URL}/api/reportes/${id}`, { method: 'DELETE' });
    fetchReportes(); if(reporteSeleccionado?._id === id) setReporteSeleccionado(null);
  };

  const manejarAgregarComentario = async (e) => {
    e.preventDefault(); if (!textoComentario) return;
    const formData = new FormData();
    formData.append('usuario', usuarioLogueado.nombre); formData.append('autorEmail', usuarioLogueado.email); formData.append('autorFoto', usuarioLogueado.fotoPerfilUrl || ''); formData.append('texto', textoComentario);
    archivosComentario.forEach(archivo => formData.append('archivosComentario', archivo));
    const res = await fetch(`${API_URL}/api/reportes/${reporteSeleccionado._id}/comentar`, { method: 'POST', body: formData });
    if (res.ok) { setTextoComentario(''); setArchivosComentario([]); setPreviewsComentario([]); setMostrarCajaComentario(false); fetchReportes(); 
      const updated = await fetch(`${API_URL}/api/reportes`).then(r => r.json());
      setReporteSeleccionado(updated.find(r => r._id === reporteSeleccionado._id));
    }
  };

  const manejarEditarComentario = async (idReporte, fecha, textoActual) => {
    const nuevo = window.prompt("Edita tu respuesta:", textoActual);
    if (!nuevo || nuevo === textoActual) return;
    await fetch(`${API_URL}/api/reportes/${idReporte}/comentar/${fecha}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ texto: nuevo }) });
    fetchReportes(); const updated = await fetch(`${API_URL}/api/reportes`).then(r => r.json()); setReporteSeleccionado(updated.find(r => r._id === reporteSeleccionado._id));
  };
  const manejarEliminarComentario = async (idReporte, fecha) => {
    if (!window.confirm("¿Eliminar tu respuesta?")) return;
    await fetch(`${API_URL}/api/reportes/${idReporte}/comentar/${fecha}`, { method: 'DELETE' });
    fetchReportes(); const updated = await fetch(`${API_URL}/api/reportes`).then(r => r.json()); setReporteSeleccionado(updated.find(r => r._id === reporteSeleccionado._id));
  };

  const manejarEnviarApelacionUsuario = async (e, idReporte) => {
    e.preventDefault();
    const texto = e.target.textoApelacion.value;
    if (!texto.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/reportes/${idReporte}/apelacion`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario: usuarioLogueado.nombre, texto })
      });
      if (res.ok) {
        fetchReportes();
        const dataApelacion = await res.json();
        setReporteSeleccionado({...reporteSeleccionado, apelacion: dataApelacion});
        e.target.reset();
      }
    } catch (err) { console.error(err); }
  };

  const abrirConfiguracion = () => { setConfigNombre(usuarioLogueado.nombre); setConfigEmail(usuarioLogueado.email); setConfigComunidad(usuarioLogueado.comunidad); setConfigCurrentPassword(''); setConfigNewPassword(''); setFileFoto(null); setShowConfig(true); };

  const updatePerfil = async (e) => {
    e.preventDefault();
    const fd = new FormData(); if (fileFoto) fd.append('fotoPerfil', fileFoto);
    fd.append('datos', JSON.stringify({ nombre: configNombre, email: configEmail, comunidad: configComunidad, currentPassword: configCurrentPassword, newPassword: configNewPassword }));
    const res = await fetch(`${API_URL}/api/auth/profile`, { method: 'PUT', credentials: 'include', body: fd });
    const data = await res.json();
    if (res.ok) { setUsuarioLogueado(data.usuario); setShowConfig(false); fetchReportes(); alert("Perfil actualizado."); } else { alert(data.mensaje); }
  };

  const cerrarVistaDetallada = () => { setReporteSeleccionado(null); setMostrarCajaComentario(false); setArchivosComentario([]); setPreviewsComentario([]); setTextoComentario(''); };

  // ==========================================
  // NUEVO: GENERADOR DE OFICIO CON LLAMA 3
  // ==========================================
  const generarOficioPDF = async (reporte) => {
    setGenerandoPDF(true); 

    // ¡AQUÍ ESTÁ EL TRUCO PARA EL NAVEGADOR! 
    // Abrimos la ventana INMEDIATAMENTE al hacer clic, antes del fetch.
    const ventana = window.open('', '', 'width=800,height=900'); 
    
    if (ventana) {
      // Le pintamos una pantalla de carga para que no se vea blanco en lo que termina la IA
      ventana.document.write(`
        <div style="display:flex; justify-content:center; align-items:center; height:100vh; font-family:sans-serif; text-align:center; background-color:#f8fafc; color:#334155;">
          <div>
            <h2 style="font-size:24px;">🤖 La IA está redactando tu dictamen técnico...</h2>
            <p style="font-size:16px; margin-top:20px;">Esto tomará alrededor de un minuto.<br>Por favor no cierres esta pestaña.</p>
          </div>
        </div>
      `);
    } else {
      // Si el usuario tiene bloqueadas las ventanas emergentes al 100%, le avisamos.
      alert("⚠️ Tu navegador bloqueó la ventana emergente. Por favor permite los pop-ups para esta página.");
      setGenerandoPDF(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/reportes/${reporte._id}/oficio-formal`, { 
        method: 'POST',
        credentials: 'include' 
      });
      
      const data = await res.json();
      
      let htmlDictamen = "";
      if (res.ok && data.htmlIA) {
        htmlDictamen = data.htmlIA; 
      } else {
        htmlDictamen = `<div class="seccion"><h4>Descripción Técnica (Fallback)</h4><p>${reporte.titulo.replace('[🚨 RIESGO INMINENTE] ', '')}</p></div>`;
      }

      const htmlOficio = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <title>Dictamen Técnico - CrowdFix</title>
          <style>
            body { font-family: 'Times New Roman', serif; padding: 60px; line-height: 1.6; color: #222; }
            .header { text-align: right; margin-bottom: 40px; font-size: 14px; }
            .title { font-weight: bold; font-size: 18px; margin-bottom: 30px; text-transform: uppercase; text-align: center;}
            .subtitle { font-weight: bold; font-size: 14px; margin-bottom: 20px; text-decoration: underline; }
            .content { text-align: justify; font-size: 14px; }
            .seccion { margin-bottom: 20px; }
            .seccion h4 { margin-bottom: 5px; color: #000; font-size: 15px; text-transform: uppercase; border-bottom: 1px solid #ccc; padding-bottom: 3px; }
            .seccion p { margin-top: 5px; }
            .seccion ul { margin-top: 5px; padding-left: 20px; }
            .firmas { margin-top: 60px; text-align: center; }
            .linea-firma { width: 300px; border-bottom: 1px solid #333; margin: 0 auto 10px auto; }
            .footer { margin-top: 50px; font-size: 11px; color: #555; text-align: center; border-top: 1px solid #ddd; padding-top: 10px; }
            .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 100px; color: rgba(0,0,0,0.03); z-index: -1; white-space: nowrap; pointer-events: none; }
          </style>
        </head>
        <body>
          <div class="watermark">DOCUMENTO OFICIAL</div>
          <div class="header">
            <strong>H. Ayuntamiento de Medellín de Bravo, Veracruz.</strong><br/>
            A ${new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}<br/>
            <strong>Folio de Dictamen:</strong> CFX-${reporte._id.slice(-6).toUpperCase()}<br/>
            <strong>Respaldos Ciudadanos:</strong> ${reporte.votos} firmas validadas
          </div>
          
          <div class="title">DICTAMEN TÉCNICO DE INCIDENCIA OPERATIVA</div>
          <div class="subtitle">Atención: Dirección de Obras Públicas y Protección Civil</div>
          
          <div class="content">
            <p>Por medio del presente documento, derivado del sistema de inteligencia ciudadana <strong>CrowdFix</strong>, se emite el siguiente análisis técnico correspondiente a la jurisdicción de <strong>${reporte.ubicacion}</strong> bajo el rubro de <strong>${reporte.tipoProblema}</strong>.</p>
            
            ${htmlDictamen}

          </div>
          
          <div class="firmas">
            <div class="linea-firma"></div>
            <strong>${reporte.autorNombre}</strong><br/>
            Promovente Ciudadano<br/>
            Contacto: ${reporte.autorEmail}
          </div>
          
          <div class="footer">
            Generado automáticamente mediante el motor de Inteligencia Artificial de CrowdFix.<br/>
            Sistema validado por el Instituto Tecnológico Superior de Alvarado (ITSAV).
          </div>
        </body>
        </html>
      `;

      // Borramos el "Cargando..." e inyectamos el HTML perrón
      ventana.document.open(); 
      ventana.document.write(htmlOficio); 
      ventana.document.close(); 
      
      // Lanzamos la impresión
      setTimeout(() => { ventana.print(); }, 800);

    } catch (err) {
      if (ventana) ventana.close(); // Si truena, cerramos la ventana emergente para que no estorbe
      alert("Hubo un error al generar el oficio formal con IA.");
      console.error(err);
    } finally {
      setGenerandoPDF(false); 
    }
  };

  let filtrados = reportes.filter(r => 
    r.estado !== 'Bloqueado' && 
    (filtroZona === 'General' || r.ubicacion === filtroZona) && 
    (filtroCat === 'Todas' || r.tipoProblema === filtroCat) &&
    (busqueda.trim() === '' || r.titulo.toLowerCase().includes(busqueda.toLowerCase()) || r.tipoProblema.toLowerCase().includes(busqueda.toLowerCase()))
  );
  filtrados.sort((a, b) => orden === 'Recientes' ? new Date(b.fechaCreacion) - new Date(a.fechaCreacion) : b.votos - a.votos);

  const renderEstadisticas = () => {
    const reportesActivos = reportes.filter(r => r.estado !== 'Bloqueado');
    const totalReportes = reportesActivos.length;
    const porZona = {}; reportesActivos.forEach(r => porZona[r.ubicacion] = (porZona[r.ubicacion] || 0) + 1);
    const topZonas = Object.entries(porZona).sort((a,b) => b[1] - a[1]).slice(0, 5);
    const maxZona = topZonas.length > 0 ? topZonas[0][1] : 1;
    const porTipo = {}; reportesActivos.forEach(r => porTipo[r.tipoProblema] = (porTipo[r.tipoProblema] || 0) + 1);
    const topTipos = Object.entries(porTipo).sort((a,b) => b[1] - a[1]).slice(0, 5);
    const maxTipo = topTipos.length > 0 ? topTipos[0][1] : 1;

    return (
      <div className="max-w-6xl mx-auto p-4 lg:p-8 animate-fadeIn">
        <div className="flex justify-between items-center mb-8">
          <div><h2 className="text-4xl font-black text-slate-800">Panel de Inteligencia</h2><p className="text-slate-500 font-medium mt-1">Mapa de calor y métricas de Medellín de Bravo</p></div>
          <div className="bg-blue-600 text-white px-6 py-3 rounded-2xl shadow-lg text-center"><p className="text-sm font-bold uppercase opacity-80">Total Reportes</p><p className="text-3xl font-black">{totalReportes}</p></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <h3 className="text-xl font-black text-slate-800 mb-6">📍 Zonas más afectadas</h3>
            <div className="space-y-5">
              {topZonas.map(([zona, count]) => (<div key={zona}><div className="flex justify-between text-sm font-bold text-slate-600 mb-1"><span>{zona}</span><span>{count}</span></div><div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden"><div className="bg-orange-500 h-4 rounded-full" style={{ width: `${(count / maxZona) * 100}%` }}></div></div></div>))}
            </div>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <h3 className="text-xl font-black text-slate-800 mb-6">🔥 Tipos de Incidencias</h3>
            <div className="space-y-5">
              {topTipos.map(([tipo, count]) => (<div key={tipo}><div className="flex justify-between text-sm font-bold text-slate-600 mb-1"><span>{tipo}</span><span>{count}</span></div><div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden"><div className="bg-blue-600 h-4 rounded-full" style={{ width: `${(count / maxTipo) * 100}%` }}></div></div></div>))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (verificando) return <div className="min-h-screen bg-slate-100 flex items-center justify-center font-bold text-slate-400">Cargando...</div>;

  if (!usuarioLogueado) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-10 border border-slate-100 animate-fadeIn">
          <div className="text-center mb-10"><h1 className="text-5xl font-black text-blue-600 tracking-tight">CrowdFix</h1><p className="text-slate-500 text-sm mt-2 font-medium">ITSAV - Ingeniería de Software</p></div>
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

  const notificacionesNoLeidas = notificaciones.filter(n => !n.leida).length;

  return (
    <div className="min-h-screen bg-slate-50 font-sans relative">
      
      {/* MENÚ MÓVIL */}
      <div className={`fixed inset-0 bg-black/60 z-50 lg:hidden ${menuMobileAbierto ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setMenuMobileAbierto(false)}></div>
      <div className={`fixed inset-y-0 left-0 w-4/5 max-w-xs bg-slate-50 shadow-2xl z-[60] transform transition-transform duration-300 flex flex-col p-6 overflow-y-auto lg:hidden ${menuMobileAbierto ? 'translate-x-0' : '-translate-x-full'}`}>
        <button onClick={() => setMenuMobileAbierto(false)} className="absolute top-4 right-4 text-2xl font-black text-slate-400">✕</button>
        <div className="flex flex-col mb-6 pb-6 border-b border-slate-200 mt-4">
          <div className="flex items-center gap-4 mb-4">
            <img src={usuarioLogueado.fotoPerfilUrl || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} className="w-14 h-14 rounded-full border shadow-sm object-cover cursor-pointer" alt="pfp" onClick={() => verPerfil(usuarioLogueado.email)} />
            <div className="flex-1 min-w-0"><p className="font-black text-slate-800 truncate cursor-pointer hover:text-blue-600" onClick={() => verPerfil(usuarioLogueado.email)}>{usuarioLogueado.nombre}</p><p className="text-xs text-slate-500 font-bold uppercase">{usuarioLogueado.comunidad}</p></div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => {abrirConfiguracion(); setMenuMobileAbierto(false);}} className="flex-1 text-sm bg-slate-200 text-slate-700 px-3 py-2.5 rounded-xl font-bold transition">⚙️ Ajustes</button>
            <button onClick={async () => { await fetch(`${API_URL}/api/auth/logout`, {method:'POST', credentials:'include'}); window.location.reload(); }} className="flex-1 text-sm bg-red-100 text-red-600 px-3 py-2.5 rounded-xl font-bold transition">Salir</button>
          </div>
        </div>
        
        {usuarioLogueado.email === 'admin@crowdfix.com' && (
          <button onClick={() => { setMenuMobileAbierto(false); setVistaActual('admin'); setReporteSeleccionado(null); cargarAdminStats(); }} className="w-full text-left p-4 rounded-xl font-black mb-2 bg-red-50 border text-red-600">👑 Panel Maestro</button>
        )}

        <button onClick={() => { setVistaActual('estadisticas'); setMenuMobileAbierto(false); }} className={`w-full text-left p-4 rounded-xl font-black mb-6 transition flex items-center gap-2 ${vistaActual === 'estadisticas' ? 'bg-slate-900 text-white' : 'bg-white border text-slate-700'}`}>📊 Estadísticas de Impacto</button>
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Categorías</h3>
        <button onClick={() => {setFiltroCat('Todas'); setVistaActual('feed'); setMenuMobileAbierto(false);}} className={`w-full text-left p-3 rounded-xl font-bold mb-2 transition ${filtroCat === 'Todas' ? 'bg-blue-600 text-white' : 'hover:bg-slate-200 text-slate-600'}`}>🌎 Todas</button>
        {cats.oficiales.map(c => (
          <button key={c} onClick={() => {setFiltroCat(c); setVistaActual('feed'); setMenuMobileAbierto(false);}} className={`w-full text-left p-3 rounded-xl font-bold mb-1 transition ${filtroCat === c ? 'bg-blue-600 text-white' : 'hover:bg-slate-200 text-slate-600'}`}>📍 {c}</button>
        ))}
      </div>

      {/* NAVBAR */}
      <nav className="bg-white border-b sticky top-0 z-40 p-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="lg:hidden text-slate-500 hover:text-slate-800 p-2 text-2xl font-black rounded-lg bg-slate-50 border" onClick={() => setMenuMobileAbierto(true)}>☰</button>
          <h2 className="text-2xl lg:text-3xl font-black text-blue-600 cursor-pointer" onClick={() => {setReporteSeleccionado(null); setFiltroCat('Todas'); setBusqueda(''); setVistaActual('feed');}}>CrowdFix</h2>
        </div>
        
        {vistaActual === 'feed' && (
          <div className="flex-1 max-w-2xl mx-6 relative hidden sm:block">
            <div className="relative">
              <input type="text" placeholder="Buscar publicaciones..." className="w-full bg-slate-100 px-5 py-3 rounded-full outline-none focus:bg-slate-200 transition text-sm font-bold border border-transparent focus:border-blue-200" value={busqueda} onChange={e => setBusqueda(e.target.value)} onFocus={() => setMostrarHistorial(true)} onBlur={() => setTimeout(() => setMostrarHistorial(false), 200)} onKeyDown={e => { if (e.key === 'Enter') ejecutarBusqueda(busqueda); }} />
              {busqueda && <button onClick={() => {setBusqueda(''); setMostrarHistorial(false);}} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 font-black w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-300">✕</button>}
            </div>
            {mostrarHistorial && historial.length > 0 && (
              <div className="absolute top-full mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50">
                <div className="text-xs font-black text-slate-400 uppercase p-3 bg-slate-50 border-b">Búsquedas Recientes</div>
                {historial.map((h, i) => (
                  <div key={i} className="flex justify-between items-center px-4 py-3 hover:bg-blue-50 cursor-pointer transition" onClick={() => ejecutarBusqueda(h)}>
                    <span className="text-sm font-bold text-slate-700">🔍 {h}</span>
                    <button onClick={(e) => borrarDelHistorial(e, h)} className="text-slate-300 hover:text-red-500 font-bold text-sm px-3 py-1">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="hidden lg:flex items-center gap-4">
          {usuarioLogueado.email === 'admin@crowdfix.com' && (
            <button onClick={() => { setVistaActual('admin'); setReporteSeleccionado(null); cargarAdminStats(); }} className={`mr-1 px-5 py-2.5 rounded-full font-black transition ${vistaActual === 'admin' ? 'bg-red-500 text-white' : 'bg-red-50 text-red-600'}`}>👑 Admin</button>
          )}

          {/* BOTÓN BUZÓN DE NOTIFICACIONES */}
          <div className="relative">
            <button onClick={() => setMostrarBuzon(!mostrarBuzon)} className="text-2xl bg-slate-100 hover:bg-slate-200 w-12 h-12 rounded-full flex items-center justify-center transition relative">
              🔔
              {notificacionesNoLeidas > 0 && <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">{notificacionesNoLeidas}</span>}
            </button>
            
            {/* DROPDOWN BUZÓN */}
            {mostrarBuzon && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
                  <span className="font-black">Buzón de Alertas</span>
                  {notificacionesNoLeidas > 0 && (
                    <button onClick={async () => {
                      await fetch(`${API_URL}/api/auth/notificaciones/leer`, {method:'POST', credentials:'include'});
                      fetchNotificaciones();
                    }} className="text-xs text-blue-300 hover:text-white font-bold">Marcar leídas</button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto bg-slate-50">
                  {notificaciones.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 font-bold text-sm">Nada por aquí ✨</div>
                  ) : (
                    notificaciones.map(n => (
                      <div key={n.id} className={`p-4 border-b border-slate-100 ${!n.leida ? 'bg-blue-50/50 border-l-4 border-l-blue-500' : 'opacity-70'}`}>
                        <div className="flex gap-3">
                          <span className="text-2xl">{n.tipo === 'bloqueo' ? '🚫' : '🔔'}</span>
                          <div>
                            <p className="font-black text-sm text-slate-800">{n.titulo}</p>
                            <p className="text-xs text-slate-600 mt-1 leading-snug">{n.mensaje}</p>
                            <p className="text-[10px] text-slate-400 mt-2 font-bold">{tiempoTranscurrido(n.fecha)}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button onClick={() => { setVistaActual('estadisticas'); setReporteSeleccionado(null); }} className={`px-5 py-2.5 rounded-full font-black ${vistaActual === 'estadisticas' ? 'bg-slate-900 text-white shadow-md' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>📊 Estadísticas</button>
          <div className="text-right hidden xl:block cursor-pointer hover:opacity-80 transition" onClick={() => verPerfil(usuarioLogueado.email)}>
            <p className="font-black text-sm text-slate-800 leading-tight">{usuarioLogueado.nombre}</p>
            <p className="text-xs text-slate-500 font-bold uppercase">{usuarioLogueado.comunidad}</p>
          </div>
          <img src={usuarioLogueado.fotoPerfilUrl || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} className="w-12 h-12 rounded-full border shadow-sm object-cover cursor-pointer hover:ring-2 hover:ring-blue-400" alt="pfp" onClick={() => verPerfil(usuarioLogueado.email)} />
          <button onClick={abrirConfiguracion} className="text-xl bg-slate-100 hover:bg-slate-200 w-12 h-12 rounded-full flex items-center justify-center transition">⚙️</button>
          <button onClick={async () => { await fetch(`${API_URL}/api/auth/logout`, {method:'POST', credentials:'include'}); window.location.reload(); }} className="font-bold text-red-500 hover:bg-red-50 px-5 py-2.5 rounded-xl transition border border-transparent hover:border-red-200">Salir</button>
        </div>
      </nav>

      {/* RENDERIZADO DE VISTAS */}
      {vistaActual === 'admin' && usuarioLogueado.email === 'admin@crowdfix.com' ? (
        <VistaAdmin adminStats={adminStats} recargarDatos={cargarAdminStats} />
      ) : vistaActual === 'estadisticas' ? (
        renderEstadisticas()
      ) : vistaActual === 'perfil' ? (
        <div className="w-full max-w-3xl mx-auto p-4 lg:p-8">
          <VistaPerfil 
            emailPerfil={emailPerfilViendo} 
            usuarioLogueado={usuarioLogueado} 
            reportes={reportes} 
            onVolver={() => setVistaActual('feed')} 
            onAbrirConfig={abrirConfiguracion} 
            onVerPerfil={verPerfil} 
            onAbrirReporte={(r) => { setReporteSeleccionado(r); setVistaActual('feed'); }}
          />
        </div>
      ) : (
        <div className="w-full max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 p-4 lg:p-8">
          {/* SIDEBAR IZQUIERDO */}
          {!reporteSeleccionado && (
            <aside className="hidden lg:block lg:col-span-3 xl:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-3xl border shadow-sm sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Categorías</h3>
                <button onClick={() => setFiltroCat('Todas')} className={`w-full text-left p-3 rounded-xl font-bold mb-2 transition ${filtroCat === 'Todas' ? 'bg-blue-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>🌎 Todas</button>
                {cats.oficiales.map(c => ( <button key={c} onClick={() => setFiltroCat(c)} className={`w-full text-left p-3 rounded-xl font-bold mb-1 transition ${filtroCat === c ? 'bg-blue-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>📍 {c}</button> ))}
                {cats.populares.length > 0 && <div className="border-t my-4 pt-4 text-xs font-black text-slate-400 uppercase">Tendencias 🔥</div>}
                {cats.populares.map(c => ( <button key={c.nombre} onClick={() => setFiltroCat(c.nombre)} className={`w-full text-left p-3 rounded-xl font-bold mb-1 text-sm transition ${filtroCat === c.nombre ? 'bg-orange-500 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>🔸 {c.nombre}</button> ))}
              </div>
            </aside>
          )}

          {/* FEED CENTRAL */}
          <main className={`${reporteSeleccionado ? 'lg:col-span-8 lg:col-start-3 xl:col-span-8 xl:col-start-3' : 'lg:col-span-6 xl:col-span-8'} space-y-8 mb-32`}>
            {reporteSeleccionado ? (
              // VISTA DETALLADA DEL REPORTE
              <div className="animate-fadeIn relative">
                <button onClick={cerrarVistaDetallada} className="mb-6 font-bold text-slate-500 hover:text-slate-800 bg-white px-5 py-3 rounded-xl shadow-sm border border-slate-200 transition">← Regresar</button>
                
                <article className={`bg-white p-8 rounded-3xl border shadow-sm mb-6 ${reporteSeleccionado.titulo.includes('[🚨 RIESGO INMINENTE]') ? 'border-red-400 bg-red-50/30' : ''}`}>
                  <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <div className="flex items-center gap-4">
                      <img src={reporteSeleccionado.autorFoto || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} className="w-14 h-14 rounded-full border shadow-sm object-cover cursor-pointer hover:ring-2 hover:ring-blue-400 transition" alt="pfp" onClick={() => verPerfil(reporteSeleccionado.autorEmail)} />
                      <div>
                        <p className="font-black text-lg text-slate-800 cursor-pointer hover:text-blue-600 transition" onClick={() => verPerfil(reporteSeleccionado.autorEmail)}>{reporteSeleccionado.autorNombre}</p>
                        <p className="text-sm font-medium text-slate-500">{tiempoTranscurrido(reporteSeleccionado.fechaCreacion)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      
                      {/* BOTÓN MÁGICO PARA PC */}
                      {reporteSeleccionado.votos >= 3 && (
                        <button 
                          onClick={() => generarOficioPDF(reporteSeleccionado)} 
                          disabled={generandoPDF}
                          className={`hidden sm:flex text-sm font-black text-white px-4 py-2 rounded-xl transition shadow-md items-center gap-2 ${generandoPDF ? 'bg-slate-600 cursor-wait' : 'bg-slate-900 hover:bg-black'}`}
                        >
                          {generandoPDF ? '⏳ Redactando Oficio...' : '📄 Generar Oficio'}
                        </button>
                      )}

                      {reporteSeleccionado.autorEmail === usuarioLogueado.email && (
                        <>
                          <button onClick={(e) => manejarEditarReporte(reporteSeleccionado._id, reporteSeleccionado.titulo.replace('[🚨 RIESGO INMINENTE] ', ''), e)} className="text-sm font-bold text-slate-400 hover:text-blue-600 bg-slate-50 px-3 py-2 rounded-xl transition">✏️ Editar</button>
                          <button onClick={(e) => manejarEliminarReporte(reporteSeleccionado._id, e)} className="text-sm font-bold text-slate-400 hover:text-red-500 bg-red-50 px-3 py-2 rounded-xl transition">🗑️ Eliminar</button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {reporteSeleccionado.titulo.includes('[🚨 RIESGO INMINENTE]') && <div className="mb-4 inline-block bg-red-600 text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider animate-pulse">🚨 Alerta Máxima</div>}
                  <h2 className="text-3xl lg:text-4xl font-black mb-6 leading-tight text-slate-800">{reporteSeleccionado.titulo.replace('[🚨 RIESGO INMINENTE] ', '')}</h2>
                  <VisorMultimedia urls={reporteSeleccionado.archivosUrls} />
                  
                  {/* BOTÓN MÁGICO PARA MÓVIL */}
                  {reporteSeleccionado.votos >= 3 && (
                    <button 
                      onClick={() => generarOficioPDF(reporteSeleccionado)} 
                      disabled={generandoPDF}
                      className={`sm:hidden w-full mt-6 text-sm font-black text-white px-4 py-4 rounded-xl transition shadow-md flex justify-center items-center gap-2 ${generandoPDF ? 'bg-slate-600 cursor-wait' : 'bg-slate-900 hover:bg-black'}`}
                    >
                      {generandoPDF ? '⏳ Redactando Oficio...' : '📄 Generar Oficio Formal (PDF)'}
                    </button>
                  )}

                </article>

                {/* SI ESTÁ BLOQUEADO MUESTRA LA APELACIÓN, SI NO, LOS COMENTARIOS */}
                {reporteSeleccionado.estado === 'Bloqueado' ? (
                  <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-6 md:p-8 mt-6">
                    <h3 className="text-2xl font-black text-red-700 mb-2 flex items-center gap-2">🚫 Publicación Censurada</h3>
                    <p className="text-red-600 font-medium mb-6">Tu reporte infringió las normas. <strong>Motivo:</strong> {reporteSeleccionado.motivoBloqueo}</p>
                    
                    <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-red-100">
                      <h4 className="font-black text-slate-800 mb-4">Centro de Apelaciones</h4>
                      <div className="space-y-4 mb-6 max-h-64 overflow-y-auto pr-2">
                        {reporteSeleccionado.apelacion?.mensajes?.length > 0 ? (
                          reporteSeleccionado.apelacion.mensajes.map((msg, i) => (
                            <div key={i} className={`p-4 rounded-2xl w-fit max-w-[85%] ${msg.isAdmin ? 'bg-slate-900 text-white ml-auto' : 'bg-slate-100 text-slate-800'}`}>
                              <p className="text-[10px] font-black uppercase mb-1 opacity-60 tracking-wider">{msg.autor}</p>
                              <p className="text-sm font-medium">{msg.texto}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-slate-400 font-bold text-center py-4">Inicia una apelación si crees que esto fue un error.</p>
                        )}
                      </div>
                      
                      <form onSubmit={(e) => manejarEnviarApelacionUsuario(e, reporteSeleccionado._id)} className="flex gap-3">
                        <input name="textoApelacion" type="text" placeholder="Escribe tu mensaje a moderación..." className="flex-1 px-5 py-3 rounded-xl border bg-slate-50 outline-none focus:border-red-400 focus:bg-white font-medium transition" required />
                        <button type="submit" className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-black transition shadow-md">Enviar</button>
                      </form>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="font-black text-slate-800 text-2xl mb-6 px-2">Respuestas Operativas ({reporteSeleccionado.comentarios.length})</h3>
                    
                    <div className="space-y-6">
                      {reporteSeleccionado.comentarios.map((com, index) => (
                        <div key={index} className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
                          <div className="flex justify-between items-center mb-4 border-b pb-4">
                            <div className="flex items-center gap-3">
                              <img src={com.autorFoto || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} className="w-10 h-10 rounded-full border shadow-sm object-cover cursor-pointer hover:ring-2 hover:ring-blue-400 transition flex-shrink-0" alt="pfp" onClick={() => verPerfil(com.autorEmail)} />
                              <div>
                                <span className="font-black text-base text-slate-800 cursor-pointer hover:text-blue-600 transition" onClick={() => verPerfil(com.autorEmail)}>{com.usuario}</span>
                                <p className="text-xs text-slate-400 font-bold">{tiempoTranscurrido(com.fecha)}</p>
                              </div>
                            </div>
                            {com.autorEmail === usuarioLogueado.email && (
                              <div className="flex gap-2">
                                <button onClick={() => manejarEditarComentario(reporteSeleccionado._id, com.fecha, com.texto)} className="text-sm font-bold text-slate-400 hover:text-blue-600 transition">✏️</button>
                                <button onClick={() => manejarEliminarComentario(reporteSeleccionado._id, com.fecha)} className="text-sm font-bold text-slate-400 hover:text-red-500 transition">🗑️</button>
                              </div>
                            )}
                          </div>
                          <p className="text-slate-700 leading-relaxed text-base">{com.texto}</p>
                          <VisorMultimedia urls={com.archivosUrls} />
                        </div>
                      ))}
                    </div>

                    {!mostrarCajaComentario ? (
                      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-30">
                        <button onClick={() => setMostrarCajaComentario(true)} className="bg-blue-600 text-white shadow-2xl px-10 py-5 rounded-full font-black text-lg flex items-center gap-3 hover:scale-105 transition">💬 Añadir respuesta</button>
                      </div>
                    ) : (
                      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-[95%] max-w-3xl bg-white shadow-2xl border border-slate-200 rounded-3xl p-4 z-30 animate-fadeIn">
                        <form onSubmit={manejarAgregarComentario} className="flex flex-col">
                          {previewsComentario.length > 0 && (
                            <div className="flex gap-2 px-3 pt-2 pb-2 overflow-x-auto scrollbar-hide">
                              {previewsComentario.map((url, i) => (
                                <div key={i} className="relative flex-shrink-0 border border-slate-200 rounded-xl overflow-hidden h-20 w-20">
                                  {archivosComentario[i].type.startsWith('video') ? <video src={url} className="h-full w-full object-cover" /> : archivosComentario[i].type === 'application/pdf' ? <div className="h-full w-full bg-red-100 flex items-center justify-center text-xs font-bold text-red-600">PDF</div> : <img src={url} className="h-full w-full object-cover" alt="prev"/>}
                                </div>
                              ))}
                              <button type="button" onClick={() => {setArchivosComentario([]); setPreviewsComentario([]);}} className="text-sm font-bold text-red-500 ml-3 hover:underline">Quitar Todo</button>
                            </div>
                          )}
                          <div className="flex items-center gap-3 px-2">
                            <img src={usuarioLogueado.fotoPerfilUrl || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} className="w-9 h-9 rounded-full object-cover border shadow-sm flex-shrink-0" alt="yo" />
                            <label className="cursor-pointer text-slate-400 hover:text-blue-600 p-2 transition"><input type="file" multiple accept="image/*,video/*,application/pdf" className="hidden" onChange={e => { const files = Array.from(e.target.files); setArchivosComentario(files); setPreviewsComentario(files.map(f => URL.createObjectURL(f))); }} /><span className="text-3xl">📎</span></label>
                            <textarea value={textoComentario} onChange={(e) => setTextoComentario(e.target.value)} placeholder="Describa el seguimiento..." className="flex-1 bg-slate-50 rounded-2xl px-4 text-slate-800 py-3 max-h-32 min-h-[56px] resize-none outline-none font-medium border focus:border-blue-300" required />
                            <div className="flex gap-2 p-1 items-center">
                              <button type="button" onClick={() => {setMostrarCajaComentario(false); setArchivosComentario([]); setPreviewsComentario([]); setTextoComentario('');}} className="p-2 text-slate-400 hover:text-slate-700 font-black text-2xl rounded-full">✕</button>
                              <button type="submit" className="bg-blue-600 text-white p-3 rounded-2xl w-14 h-14 flex items-center justify-center shadow-lg hover:bg-blue-700 transition">⬆️</button>
                            </div>
                          </div>
                        </form>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              // FEED LISTA
              <div className="space-y-8">
                {/* CAJA DE PUBLICAR */}
                <div className={`p-8 rounded-3xl border shadow-sm transition-colors duration-300 ${esAlertaMaxima ? 'bg-red-50 border-red-200' : 'bg-white'}`}>
                  <form onSubmit={manejarCrearAlerta} className="space-y-5">
                    <div className="flex gap-5">
                      <img src={usuarioLogueado.fotoPerfilUrl || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} className="w-16 h-16 rounded-full object-cover border-2 border-slate-100 shadow-sm cursor-pointer hover:ring-2 hover:ring-blue-400 transition" alt="pfp" onClick={() => verPerfil(usuarioLogueado.email)} />
                      <div className="flex-1">
                        <textarea value={nuevoTitulo} onChange={e => setNuevoTitulo(e.target.value)} placeholder="¿Qué incidencia operativa detectas?" className="w-full text-2xl outline-none resize-none pt-2 font-medium bg-transparent" rows="2" required />
                        {nuevoTipo === 'Otro' && <input type="text" placeholder="Escribe la categoría personalizada..." className="w-full p-4 mt-2 rounded-xl border border-blue-200 bg-blue-50 font-bold text-blue-700 outline-none focus:border-blue-500" value={customTipo} onChange={e => setCustomTipo(e.target.value)} required />}
                        {previews.length > 0 && (
                          <div className="flex gap-3 mt-4 overflow-x-auto scrollbar-hide border rounded-2xl p-3 bg-white/50">
                            {previews.map((url, i) => (
                              <div key={i} className="relative flex-shrink-0 rounded-xl overflow-hidden h-24 w-24 shadow-sm border border-slate-200">
                                {archivos[i].type.startsWith('video') ? <video src={url} className="h-full w-full object-cover" /> : archivos[i].type === 'application/pdf' ? <div className="h-full w-full bg-red-100 flex items-center justify-center text-sm font-black text-red-600">PDF</div> : <img src={url} className="h-full w-full object-cover" alt="prev"/>}
                              </div>
                            ))}
                            <button type="button" onClick={() => {setArchivos([]); setPreviews([]);}} className="bg-white text-red-600 px-4 rounded-xl font-bold text-sm border hover:bg-red-50 transition">Quitar Todo</button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-t border-slate-200/60 pt-5">
                      <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                        <select value={nuevoTipo} onChange={e => setNuevoTipo(e.target.value)} className="bg-white border border-slate-200 py-3 px-4 rounded-full font-bold outline-none cursor-pointer flex-1 sm:flex-none">
                          <option value="Automático">🤖 Automático (IA)</option>
                          <option value="Bache">⚠️ Bache</option>
                          <option value="Fuga de Agua">💧 Fuga de Agua</option>
                          <option value="Alumbrado">💡 Alumbrado</option>
                          <option value="Basura">🗑️ Basura</option>
                          <option value="Otro">📌 Otro (Escribir)</option>
                        </select>
                        <label className="cursor-pointer bg-white text-blue-600 hover:bg-blue-50 border border-blue-200 px-6 py-3 rounded-full font-black flex items-center justify-center gap-2 transition flex-1 sm:flex-none">
                          📸 Evidencias
                          <input type="file" multiple accept="image/*,video/*,application/pdf" className="hidden" onChange={e => { const files = Array.from(e.target.files); if(files.length > 150) return alert("Máximo 150 archivos."); setArchivos(files); setPreviews(files.map(f => URL.createObjectURL(f))); }} />
                        </label>
                      </div>
                      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <div className={`w-12 h-6 rounded-full relative transition-colors ${esAlertaMaxima ? 'bg-red-500' : 'bg-slate-300'}`}><div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${esAlertaMaxima ? 'translate-x-6' : 'translate-x-0.5'}`}></div></div>
                          <span className={`text-sm font-black uppercase ${esAlertaMaxima ? 'text-red-600' : 'text-slate-400 group-hover:text-slate-600'}`}>🚨 Alerta</span>
                          <input type="checkbox" className="hidden" checked={esAlertaMaxima} onChange={(e) => setEsAlertaMaxima(e.target.checked)} />
                        </label>
                        <button 
                          type="submit" 
                          disabled={analizando}
                          className={`w-full sm:w-auto text-white px-10 py-3.5 rounded-full font-black shadow-lg transition text-lg ${analizando ? 'bg-slate-500 cursor-not-allowed opacity-80' : esAlertaMaxima ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-900 hover:bg-black'}`}
                        >
                          {analizando ? '🤖 Analizando...' : 'Publicar'}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>

                {/* LISTA DE POSTS */}
                {filtrados.length === 0 && <div className="p-16 text-center bg-white rounded-3xl border border-dashed border-slate-300"><p className="text-2xl font-black text-slate-400">Sin resultados ✨</p></div>}
                {filtrados.map(r => {
                  const haVotado = r.votosUsuarios && r.votosUsuarios.includes(usuarioLogueado.email);
                  const esAlerta = r.titulo.includes('[🚨 RIESGO INMINENTE]');
                  const tituloVisual = r.titulo.replace('[🚨 RIESGO INMINENTE] ', '');
                  return (
                    <article key={r._id} onClick={() => setReporteSeleccionado(r)} className={`bg-white border shadow-sm rounded-3xl p-6 lg:p-8 flex flex-col sm:flex-row gap-6 hover:shadow-md transition cursor-pointer group relative overflow-hidden ${esAlerta ? 'border-red-400' : 'border-slate-200'}`}>
                      {esAlerta && <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500 animate-pulse"></div>}
                      <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-start bg-slate-50 rounded-2xl p-3 h-fit sm:min-w-[70px] border">
                        <button onClick={async (e) => { e.stopPropagation(); await fetch(`${API_URL}/api/reportes/${r._id}/votar`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({emailUsuario: usuarioLogueado.email})}); fetchReportes(); }} className={`text-3xl font-black transition ${haVotado ? 'text-orange-500 drop-shadow-md' : 'text-slate-300 hover:text-orange-400'}`}>▲</button>
                        <span className={`font-black text-xl sm:my-2 ${haVotado ? 'text-orange-600' : 'text-slate-600'}`}>{r.votos}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center gap-4">
                            <img src={r.autorFoto || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} className="w-12 h-12 rounded-full object-cover border shadow-sm cursor-pointer hover:ring-2 hover:ring-blue-400 transition" alt="pfp" onClick={(e) => { e.stopPropagation(); verPerfil(r.autorEmail); }} />
                            <div>
                              <p className="font-black text-base text-slate-900 cursor-pointer hover:text-blue-600 transition" onClick={(e) => { e.stopPropagation(); verPerfil(r.autorEmail); }}>{r.autorNombre}</p>
                              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                <p className="text-xs text-blue-600 font-black uppercase tracking-wide">{r.ubicacion}</p><span className="text-xs text-slate-300">•</span><p className="text-xs text-slate-400 font-bold uppercase">{tiempoTranscurrido(r.fechaCreacion)}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 items-center">
                            {r.votos >= 3 && <span className="text-xl mr-2" title="Oficio Disponible">📄</span>}
                            {r.autorEmail === usuarioLogueado.email && (
                              <>
                                <button onClick={(e) => manejarEditarReporte(r._id, tituloVisual, e)} className="text-sm font-bold text-slate-400 hover:text-blue-600 bg-slate-100 p-2 rounded-lg transition">✏️</button>
                                <button onClick={(e) => manejarEliminarReporte(r._id, e)} className="text-sm font-bold text-slate-400 hover:text-red-500 bg-slate-100 p-2 rounded-lg transition">🗑️</button>
                              </>
                            )}
                          </div>
                        </div>
                        {esAlerta && <div className="mb-2 inline-block bg-red-100 text-red-700 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider border border-red-200">Alerta Máxima</div>}
                        <h3 className="text-2xl font-black mb-4 text-slate-800 leading-snug">{tituloVisual}</h3>
                        <div onClick={e => e.stopPropagation()}><VisorMultimedia urls={r.archivosUrls} /></div>
                        <div className="flex flex-wrap gap-4 items-center font-bold text-slate-500 mt-6 border-t pt-5">
                          <span className="bg-blue-50 border border-blue-100 text-blue-700 px-4 py-1.5 rounded-lg text-sm">{r.tipoProblema}</span>
                          <span className="text-sm bg-slate-50 px-4 py-1.5 rounded-lg border">💬 {r.comentarios.length} Respuestas</span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </main>

          {/* SIDEBAR DERECHO */}
          {!reporteSeleccionado && (
            <aside className="hidden lg:block lg:col-span-3 xl:col-span-2 space-y-6">
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
                  <button onClick={() => setOrden('Recientes')} className={`w-full p-3 rounded-xl font-bold text-sm mb-2 transition flex items-center gap-2 ${orden === 'Recientes' ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>🕐 Recientes</button>
                  <button onClick={() => setOrden('Relevantes')} className={`w-full p-3 rounded-xl font-bold text-sm transition flex items-center gap-2 ${orden === 'Relevantes' ? 'bg-orange-500 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>🔥 Relevantes</button>
                </div>
              </div>
            </aside>
          )}
        </div>
      )}

      {/* ===== MODAL CONFIGURACIÓN PERFIL ===== */}
      {showConfig && (
        <div className="fixed inset-0 bg-slate-950/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white p-8 rounded-3xl max-w-md w-full relative shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowConfig(false)} className="absolute top-4 right-4 bg-slate-100 text-slate-500 w-10 h-10 rounded-full font-black hover:bg-red-500 hover:text-white transition flex items-center justify-center">✕</button>
            <h2 className="text-2xl font-black mb-6 text-slate-900 flex items-center gap-2">⚙️ Tu Panel</h2>
            <form onSubmit={updatePerfil} className="space-y-4">
              <div className="flex flex-col items-center gap-4 mb-8">
                <img src={fileFoto ? URL.createObjectURL(fileFoto) : (usuarioLogueado.fotoPerfilUrl || 'https://cdn-icons-png.flaticon.com/512/149/149071.png')} className="w-28 h-28 rounded-full border-4 border-blue-50 object-cover shadow-lg" alt="pfp" />
                <label className="bg-slate-100 hover:bg-slate-200 px-5 py-2.5 rounded-full font-bold text-sm cursor-pointer transition flex items-center gap-2 border">
                  📸 Cambiar Foto
                  <input type="file" accept="image/*" className="hidden" onChange={e => setFileFoto(e.target.files[0])} />
                </label>
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-2">Nombre Completo</label>
                <input type="text" value={configNombre} onChange={e => setConfigNombre(e.target.value)} className="w-full px-5 py-3.5 rounded-xl border bg-slate-50 outline-none focus:border-blue-500 focus:bg-white font-medium" required placeholder="Nombre" />
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-2">Correo</label>
                <input type="email" value={configEmail} onChange={e => setConfigEmail(e.target.value)} className="w-full px-5 py-3.5 rounded-xl border bg-slate-50 outline-none focus:border-blue-500 focus:bg-white font-medium" required placeholder="Correo" />
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-2">Jurisdicción</label>
                <select value={configComunidad} onChange={e => setConfigComunidad(e.target.value)} className="w-full px-5 py-3.5 rounded-xl border bg-slate-50 outline-none font-bold transition">
                  {listaZonas.filter(z => z !== 'General').map(z => <option key={z} value={z}>{z}</option>)}
                </select>
              </div>
              <div className="border-t pt-6 mt-4">
                <p className="text-xs font-black uppercase text-slate-400 mb-3">Actualizar Contraseña</p>
                <input type="password" value={configNewPassword} onChange={e => setConfigNewPassword(e.target.value)} placeholder="Nueva contraseña (Opcional)" className="w-full px-5 py-3.5 rounded-xl border bg-slate-50 outline-none mb-3 font-medium focus:border-blue-500 focus:bg-white" />
                {configNewPassword && <input type="password" value={configCurrentPassword} onChange={e => setConfigCurrentPassword(e.target.value)} placeholder="Contraseña actual requerida" className="w-full px-5 py-3.5 rounded-xl border border-amber-300 bg-amber-50 outline-none font-medium" required />}
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-black shadow-lg hover:bg-blue-700 transition mt-6 text-lg">Guardar Cambios</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;