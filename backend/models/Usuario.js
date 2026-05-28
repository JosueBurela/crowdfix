import mongoose from 'mongoose';

const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  comunidad: { 
    type: String, 
    default: 'Medellín de Bravo', // Forzado a tu zona de enfoque
    required: true 
  },
  fechaRegistro: { type: Date, default: Date.now }
});

const Usuario = mongoose.model('Usuario', usuarioSchema);
export default Usuario;