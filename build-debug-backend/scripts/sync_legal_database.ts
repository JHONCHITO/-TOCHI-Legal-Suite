import "dotenv/config";

import { syncLegalCodeCatalog, syncLegacyLeyCatalog } from "../lib/services/legal-catalog";

async function main() {
  try {
    console.log("🚀 Sincronizando catalogo legal...");
    const codes = await syncLegalCodeCatalog();
    const leyes = await syncLegacyLeyCatalog();

    console.log(
      `✅ Catalogo sincronizado: ${codes.codesUpserted} codigos, ${codes.articlesUpserted} articulos, ${leyes.leyesUpserted} leyes y ${leyes.leyArticlesUpserted} articulos de ley`
    );
    process.exit(0);
  } catch (error) {
    console.error("💣 Error sincronizando catalogo legal:", error);
    process.exit(1);
  }
}

main();
