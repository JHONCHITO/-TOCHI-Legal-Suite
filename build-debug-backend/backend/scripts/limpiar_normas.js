const { MongoClient } = require("mongodb");
require("dotenv").config();

function hasValidCodigo(doc) {
  return typeof doc.codigo === "string" && doc.codigo.trim().length > 0;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    const db = client.db();
    const collection = db.collection("normas");

    const total = await collection.countDocuments();
    const sinCodigo = await collection.countDocuments({
      $or: [{ codigo: { $exists: false } }, { codigo: "" }, { codigo: null }],
    });
    const conEmbedding = await collection.countDocuments({
      embedding: { $exists: true },
    });
    const embeddingVacio = await collection.countDocuments({
      embedding: { $size: 0 },
    });

    console.log(JSON.stringify({
      total,
      sinCodigo,
      conEmbedding,
      embeddingVacio,
      modo: apply ? "apply" : "dry-run",
    }, null, 2));

    const duplicados = await collection.aggregate([
      {
        $match: {
          codigo: { $exists: true, $nin: [null, ""] },
          articulo: { $exists: true, $ne: "" },
        },
      },
      {
        $group: {
          _id: { codigo: "$codigo", articulo: "$articulo" },
          count: { $sum: 1 },
        },
      },
      { $match: { count: { $gt: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 25 },
    ]).toArray();

    console.log("DUPLICADOS", JSON.stringify(duplicados, null, 2));

    if (!apply) {
      console.log("Ejecuta de nuevo con --apply para borrar documentos sin codigo.");
      return;
    }

    const deleteResult = await collection.deleteMany({
      $or: [{ codigo: { $exists: false } }, { codigo: "" }, { codigo: null }],
    });

    console.log(`Eliminados: ${deleteResult.deletedCount}`);
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
