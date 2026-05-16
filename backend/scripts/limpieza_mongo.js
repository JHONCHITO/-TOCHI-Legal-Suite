const { MongoClient } = require("mongodb");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

function loadEnvFile(filePath) {
  if (!filePath) return false;
  if (!fs.existsSync(filePath)) return false;
  dotenv.config({ path: filePath, override: false });
  return true;
}

function bootstrapEnv() {
  const candidates = [
    process.env.MONGODB_URI ? null : path.resolve(process.cwd(), ".env.local"),
    process.env.MONGODB_URI ? null : path.resolve(process.cwd(), "frontend", ".env.local"),
    process.env.MONGODB_URI ? null : path.resolve(process.cwd(), "backend", ".env.local"),
    process.env.MONGODB_URI ? null : path.resolve(__dirname, "..", ".env.local"),
    process.env.MONGODB_URI ? null : path.resolve(__dirname, "..", "..", ".env.local"),
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (loadEnvFile(candidate)) {
      console.log(`Env cargado desde: ${candidate}`);
      if (process.env.MONGODB_URI) return;
    }
  }
}

bootstrapEnv();

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || process.env.MONGODB_DATABASE || "prestamosDB";
const APPLY = process.argv.includes("--apply");
const DROP_LEGACY_ARTICLES = process.argv.includes("--drop-legacy-articles");
const DROP_LEGACY_LEYES = process.argv.includes("--drop-legacy-leyes");
const PURGE_TEST_DATA = process.argv.includes("--purge-test-data");

if (!MONGODB_URI) {
  console.error("Falta MONGODB_URI. Ejecuta el script en una terminal donde exista .env.local o exporta la variable.");
  process.exit(1);
}

const JUNK = /demo|test|prueba|sample|dummy|basura|temp|temporal/i;

function buildExistsFilter(fields) {
  return fields.map((field) => ({
    [field]: { $exists: true, $nin: [null, ""] },
  }));
}

function buildGroupId(fields) {
  return fields.reduce((acc, field) => {
    acc[field] = `$${field}`;
    return acc;
  }, {});
}

function getBestScore(doc, contentFields) {
  let score = 0;

  if (Array.isArray(doc.embedding) && doc.embedding.length > 0) {
    score += 100000;
  }

  const content = contentFields
    .map((field) => (typeof doc[field] === "string" ? doc[field].trim() : ""))
    .find(Boolean) || "";

  if (content) {
    score += Math.min(content.length, 10000);
  }

  const updatedAt = doc.updatedAt ? new Date(doc.updatedAt).getTime() : 0;
  const createdAt = doc.createdAt ? new Date(doc.createdAt).getTime() : 0;
  score += Math.floor(Math.max(updatedAt, createdAt) / 1000000000);

  return score;
}

async function dedupeCollection(collection, label, keyFields, contentFields) {
  const groupId = buildGroupId(keyFields);
  const matchFilter = {
    $and: buildExistsFilter(keyFields),
  };

  const groups = await collection
    .aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: groupId,
          ids: { $push: "$_id" },
          count: { $sum: 1 },
        },
      },
      { $match: { count: { $gt: 1 } } },
      { $sort: { count: -1 } },
    ])
    .toArray();

  console.log(`[${label}] grupos duplicados: ${groups.length}`);

  let deleted = 0;

  for (const group of groups) {
    const docs = await collection.find({ _id: { $in: group.ids } }).toArray();
    if (docs.length <= 1) continue;

    docs.sort((a, b) => getBestScore(b, contentFields) - getBestScore(a, contentFields));

    const keep = docs[0];
    const dropIds = docs.slice(1).map((doc) => doc._id);

    console.log(
      `  ${label} key=${JSON.stringify(group._id)} keep=${String(keep._id)} drop=${dropIds.length}`
    );

    if (APPLY && dropIds.length > 0) {
      const result = await collection.deleteMany({ _id: { $in: dropIds } });
      deleted += result.deletedCount || 0;
    }
  }

  if (APPLY) {
    console.log(`[${label}] duplicados eliminados: ${deleted}`);
  }
}

async function purgeByFilter(collection, label, filter) {
  const count = await collection.countDocuments(filter);
  console.log(`[${label}] candidatos para borrar: ${count}`);

  if (!APPLY || count === 0) return;

  const result = await collection.deleteMany(filter);
  console.log(`[${label}] borrados: ${result.deletedCount || 0}`);
}

async function dropCollectionIfExists(db, name) {
  const exists = await db.listCollections({ name }).toArray();
  if (!exists.length) {
    console.log(`[${name}] no existe`);
    return;
  }

  const count = await db.collection(name).estimatedDocumentCount();
  console.log(`[${name}] documentos actuales: ${count}`);

  if (!APPLY) return;

  await db.collection(name).drop();
  console.log(`[${name}] coleccion eliminada`);
}

async function main() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(DB_NAME);

    console.log(`DB: ${DB_NAME}`);
    console.log(`Modo: ${APPLY ? "apply" : "dry-run"}`);

    const stats = [
      "normas",
      "articulos",
      "articles",
      "leys",
      "legalcodes",
      "users",
      "clients",
      "cases",
      "appointments",
      "documents",
      "invoices",
      "notifications",
      "chats",
    ];

    for (const name of stats) {
      const exists = await db.listCollections({ name }).toArray();
      if (!exists.length) continue;
      const count = await db.collection(name).estimatedDocumentCount();
      console.log(`[${name}] documentos: ${count}`);
    }

    await dedupeCollection(db.collection("normas"), "normas", ["codigo", "articulo"], ["contenido", "titulo"]);
    await dedupeCollection(
      db.collection("articulos"),
      "articulos",
      ["codigoRef", "numeroArticulo"],
      ["contenido", "tituloArticulo"]
    );
    await dedupeCollection(
      db.collection("articles"),
      "articles",
      ["codigoId", "numero"],
      ["contenido", "epigrafe"]
    );

    await purgeByFilter(db.collection("normas"), "normas-sin-codigo", {
      $or: [{ codigo: { $exists: false } }, { codigo: null }, { codigo: "" }],
    });

    await purgeByFilter(db.collection("articles"), "articles-vacios", {
      $or: [{ codigoId: { $exists: false } }, { numero: { $exists: false } }, { contenido: { $exists: false } }],
    });

    if (PURGE_TEST_DATA) {
      const testCollections = [
        {
          name: "users",
          fields: ["email", "nombre", "apellido", "telefono", "avatar", "firma", "tarjetaProfesional"],
        },
        {
          name: "clients",
          fields: ["email", "nombre", "apellido", "razonSocial", "cedula", "nit", "telefono", "celular", "direccion", "ciudad", "departamento", "notas"],
        },
        {
          name: "cases",
          fields: ["numeroInterno", "numeroProceso", "titulo", "descripcion", "hechos", "pretensiones", "contraparte", "despacho", "notas"],
        },
        {
          name: "appointments",
          fields: ["titulo", "descripcion", "ubicacion", "notas", "linkVirtual"],
        },
        {
          name: "documents",
          fields: ["nombre", "descripcion", "archivoNombre", "contenido"],
        },
        {
          name: "invoices",
          fields: ["numero", "concepto", "notas", "terminos"],
        },
        {
          name: "notifications",
          fields: ["titulo", "mensaje", "enlace"],
        },
        {
          name: "chats",
          fields: ["mensajes.texto"],
        },
      ];

      for (const item of testCollections) {
        const filter = {
          $or: item.fields.map((field) => ({ [field]: JUNK })),
        };

        await purgeByFilter(db.collection(item.name), `${item.name}-test`, filter);
      }
    }

    if (DROP_LEGACY_ARTICLES) {
      await dropCollectionIfExists(db, "articles");
    }

    if (DROP_LEGACY_LEYES) {
      await dropCollectionIfExists(db, "leys");
    }

    console.log("Limpieza terminada.");
    if (!APPLY) {
      console.log("Nada fue borrado porque estas en dry-run. Repite con --apply si los resultados te cuadran.");
    }
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error("Error en limpieza:", error);
  process.exit(1);
});
