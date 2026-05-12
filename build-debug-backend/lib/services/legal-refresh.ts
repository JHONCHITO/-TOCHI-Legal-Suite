import { syncLegalCodeCatalog, syncLegacyLeyCatalog } from "./legal-catalog";
import { refreshLegalEmbeddings, type LegalEmbeddingRefreshResult } from "./legal-embeddings";

export interface LegalRefreshResult {
  catalog: Awaited<ReturnType<typeof syncLegalCodeCatalog>>;
  legacyLey: Awaited<ReturnType<typeof syncLegacyLeyCatalog>>;
  embeddings: LegalEmbeddingRefreshResult;
}

export async function refreshLegalCorpus(): Promise<LegalRefreshResult> {
  const catalog = await syncLegalCodeCatalog({ markEmbeddingSourceHash: true });
  const legacyLey = await syncLegacyLeyCatalog({ markEmbeddingSourceHash: true });
  const embeddings = await refreshLegalEmbeddings();

  return {
    catalog,
    legacyLey,
    embeddings,
  };
}
