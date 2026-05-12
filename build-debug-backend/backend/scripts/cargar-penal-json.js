require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");

const MONGO_URI = process.env.MONGODB_URI;

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ Mongo conectado"))
  .catch(err => console.error("❌ Error:", err));

const Ley = mongoose.model(
  "Ley",
  new mongoose.Schema({
    nombre: String,
    codigo: String,
    fuente: String,
    articulos: Array,
  })
);

async function cargar() {
  const data = JSON.parse(
    fs.readFileSync("./data/codigo_penal.json", "utf-8")
  );

  await Ley.deleteMany({ codigo: data.codigo });

  await Ley.create(data);

  console.log("🔥 Código Penal cargado COMPLETO");
  process.exit();
}

cargar();