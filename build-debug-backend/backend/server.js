const http = require("http");
const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

const envPaths = [
  path.resolve(process.cwd(), ".env.local"),
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "..", ".env.local"),
  path.resolve(process.cwd(), "..", ".env"),
  path.resolve(process.cwd(), "..", "..", ".env"),
];

for (const envPath of envPaths) {
  dotenv.config({ path: envPath, override: false });
}

const MONGODB_URI = (process.env.MONGODB_URI || "").trim();

if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI. Put it in the root .env or backend/.env.local");
  process.exit(1);
}

async function connectMongo() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  });
  const dbName = mongoose.connection?.db?.databaseName || "unknown";
  console.log(`✅ MongoDB conectado en backend (${dbName})`);
}

function startServer(port) {
  const server = http.createServer((req, res) => {
    res.setHeader("Content-Type", "application/json; charset=utf-8");

    if (req.url === "/health") {
      res.statusCode = 200;
      res.end(JSON.stringify({ ok: true, service: "backend", status: "running" }));
      return;
    }

    res.statusCode = 200;
    res.end(
      JSON.stringify({
        ok: true,
        service: "backend",
        message: "Backend connected and running.",
      })
    );
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.warn(`Port ${port} busy, using the next available port`);
      startServer(Number(port) + 1);
      return;
    }
    throw error;
  });

  server.listen(port, () => {
    console.log(`Backend running on http://localhost:${port}`);
  });
}

(async () => {
  await connectMongo();
  startServer(process.env.PORT || 4000);
})();
