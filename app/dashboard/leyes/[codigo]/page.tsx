"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Scale, BookOpen } from "lucide-react";
import { LegalCodeDetailView, type LegalCodeDetailItem, type LegalCodeListItem } from "@/components/legal/legal-code-detail-view";
import { getCodigoLegal, getLegalCodeContent, normalizeLegalSlug } from "@/lib/legal-library";

function extractYear(value: string, fallback = new Date().getFullYear()) {
  const match = value.match(/\b(18|19|20)\d{2}\b/);
  return match ? Number(match[0]) : fallback;
}

export default function CodigoDetailPage() {
  const router = useRouter();
  const params = useParams<{ codigo: string }>();
  const slug = normalizeLegalSlug(params.codigo);
  const codeData = useMemo(() => getCodigoLegal(slug), [slug]);
  const localContent = useMemo(() => (codeData ? getLegalCodeContent(codeData.codigo) : null), [codeData]);
  const [detail, setDetail] = useState<LegalCodeDetailItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!codeData) {
      setLoading(false);
      setDetail(null);
      setError(null);
      return;
    }

    let cancelled = false;

    const loadDetail = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/legal-codes/${encodeURIComponent(codeData.codigo)}`);
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload?.error || "No se pudo cargar el codigo legal");
        }

        if (!cancelled) {
          setDetail(payload);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "No se pudo cargar el codigo legal");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadDetail();

    return () => {
      cancelled = true;
    };
  }, [codeData]);

  if (!codeData) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Scale className="mb-4 h-12 w-12 text-muted-foreground" />
          <CardTitle className="mb-2">Codigo no encontrado</CardTitle>
          <CardDescription className="max-w-md">
            El codigo solicitado no coincide con ningun registro cargado en la suite.
          </CardDescription>
          <Button className="mt-6" onClick={() => router.push("/dashboard/leyes")}>
            <BookOpen className="mr-2 h-4 w-4" />
            Volver a la base juridica
          </Button>
        </CardContent>
      </Card>
    );
  }

  const summaryCode: LegalCodeListItem = {
    _id: codeData.codigo,
    code: codeData.codigo,
    name: codeData.nombre,
    description: localContent?.descripcion || codeData.numeroNorma || codeData.nombre,
    category: codeData.areasDelDerecho[0] || codeData.tipo,
    tags: Array.from(
      new Set(
        [codeData.nombreCorto, codeData.numeroNorma, codeData.tipo, ...codeData.areasDelDerecho].filter(Boolean)
      )
    ),
    year: extractYear(codeData.numeroNorma),
    source: "local",
    articles: localContent?.articulos.map((article) => ({
      number: article.numero,
      title: article.epigrafe || article.titulo || `Articulo ${article.numero}`,
      content: article.contenido || article.resumen || "Contenido no disponible.",
    })) || [],
  };

  return (
    <LegalCodeDetailView
      code={summaryCode}
      detail={detail}
      loading={loading}
      error={error}
      onBack={() => router.push("/dashboard/leyes")}
    />
  );
}
