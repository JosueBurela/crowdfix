import mongoose from 'mongoose';

const reporteSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  descripcion: { type: String, required: true },
  tipoProblema: { type: String, enum: ['Bache', 'Fuga de Agua', 'Alumbrado', 'Basura', 'Otro'], default: 'Otro' },
  latitud: { type: Number, required: true },
  longitud: { type: Number, required: true },
  imagenUrl: { type: String, default: '' },
  
  // AQUÍ AGREGAMOS 'Bloqueado' AL ENUM
  estado: { type: String, enum: ['Activo', 'En Progreso', 'Resuelto', 'Bloqueado'], default: 'Activo' },
  
  // NUEVOS CAMPOS PARA EL BOT Y MODERACIÓN
  motivoBloqueo: { type: String, default: '' },
  revisadoPorBot: { type: Boolean, default: false },
  
  // TOQUES DE RED SOCIAL (Estilo Reddit)
  votos: { type: Number, default: 0 }, 
  votosUsuarios: [{ type: String }], 
  comentarios: [
    {
      usuario: { type: String, required: true },
      texto: { type: String, required: true },
      fecha: { type: Date, default: Date.now }
    }
  ],
  
  fechaCreacion: { type: Date, default: Date.now }
});

const Reporte = mongoose.model('Reporte', reporteSchema);
export default Reporte;