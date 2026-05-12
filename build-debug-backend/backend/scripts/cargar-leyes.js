require("dotenv").config();
const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGODB_URI;

mongoose.connect(MONGO_URI);

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
  await Ley.deleteMany({ codigo: "civil" });

  await Ley.create({
    nombre: "Código Civil Colombiano",
    codigo: "civil",
    fuente: "Manual",
    articulos: [
      {
        numero: "1",
        titulo: "Definición de ley",
        contenido: "La ley es una declaración de la voluntad soberana..."
      },
      {
        numero: "2",
        titulo: "Obligatoriedad",
        contenido: "La ley es obligatoria tanto a los nacionales como a los extranjeros..."
      },
      {
        numero: "3",
        titulo: "Ignorancia de la ley",
        contenido: "La ignorancia de la ley no sirve de excusa."
      },
      {
        numero: "1494",
        titulo: "Fuentes de las obligaciones",
        contenido: "Las obligaciones nacen ya del concurso real de las voluntades..."
      },
      {
        numero: "1495",
        titulo: "Definición de contrato",
        contenido: "Contrato o convención es un acto por el cual una parte se obliga para con otra..."
      },
      {
        numero: "1502",
        titulo: "Requisitos para obligarse",
        contenido: "Capacidad, consentimiento, objeto lícito y causa lícita."
      },
      {
        numero: "1503",
        titulo: "Capacidad legal",
        contenido: "Toda persona es legalmente capaz, excepto aquellas que la ley declara incapaces."
      },
      {
        numero: "1602",
        titulo: "Fuerza obligatoria del contrato",
        contenido: "Todo contrato legalmente celebrado es una ley para los contratantes."
      }
    ]
  });

  console.log("🔥 Código Civil ampliado cargado");
  process.exit();
}

cargar();