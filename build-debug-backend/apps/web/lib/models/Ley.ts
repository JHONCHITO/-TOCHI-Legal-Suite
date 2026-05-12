import mongoose, { Schema, models, model } from "mongoose";

// 🔹 Subdocumento: Artículos
const ArticuloSchema = new Schema(
  {
    numero: {
      type: String,
      required: true,
      index: true,
    },
    titulo: {
      type: String,
      default: "",
    },
    contenido: {
      type: String,
      required: true,
    },
    palabrasClave: [
      {
        type: String,
        index: true,
      },
    ],
  },
  { _id: false }
);

// 🔹 Documento principal: Ley / Código
const LeySchema = new Schema(
  {
    nombre: {
      type: String,
      required: true,
    },

    codigo: {
      type: String,
      required: true,
      index: true, // 🔥 para búsquedas rápidas
    },

    descripcion: {
      type: String,
      default: "",
    },

    fuente: {
      type: String, // SUIN, Senado, etc.
      default: "manual",
    },

    actualizado: {
      type: Date,
      default: Date.now,
    },

    articulos: [ArticuloSchema],
  },
  { timestamps: true }
);

// 🔥 Índice de texto (BUSCADOR PRO)
LeySchema.index({
  nombre: "text",
  descripcion: "text",
  "articulos.numero": "text",
  "articulos.titulo": "text",
  "articulos.contenido": "text",
});

export default models.Ley || model("Ley", LeySchema);