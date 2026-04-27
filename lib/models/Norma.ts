import mongoose from "mongoose";

const NormaSchema = new mongoose.Schema({
  codigo: String,
  nombre: String,
  articulo: String,
  titulo: String,
  contenido: String,

  // 🔥 IMPORTANTE PARA IA
  embedding: {
    type: [Number],
    default: []
  }
});

export default mongoose.models.Norma ||
  mongoose.model("Norma", NormaSchema);