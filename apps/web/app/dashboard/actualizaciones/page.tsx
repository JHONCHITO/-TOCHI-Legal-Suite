"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowUpRight,
  Gavel,
  Loader2,
  RefreshCcw,
  Scale,
} from "lucide-react";
import {
  LEGAL_AREAS,
  getFallbackLegalUpdates,
  type LegalAreaKey,
  type LegalUpdatesPayload,
} from "@/lib/legal-updates";

export default function ActualizacionesPage() {
  const [selectedArea, setSelectedArea] = useState<LegalAreaKey>("laboral");
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState<LegalUpdatesPayload>(getFallbackLegalUpdates("laboral"));
  const [error, setError] = useState<string | null>(null);

  const currentArea = useMemo(
    () => LEGAL_AREAS.find((item) => item.key === selectedArea) ?? LEGAL_AREAS[0],
    [selectedArea]
  );

  const loadUpdates = async (area: LegalAreaKey) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/legal-updates?area=${area}`);
      const data = (await response.json()) as LegalUpdatesPayload;

      if (!response.ok) {
        throw new Error("No se pudieron cargar las novedades juridicas.");
      }

      setPayload(data);
    } catch (err) {
      setPayload(getFallbackLegalUpdates(area));
      setError(err instanceof Error ? err.message : "Error cargando novedades.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUpdates(selectedArea);
  }, [selectedArea]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Novedades Juridicas</h1>
          <p className="text-muted-foreground">
            Monitor diario por areas para normas, modificaciones y jurisprudencia reciente.
          </p>
        </div>
        <Button variant="outline" onClick={() => void loadUpdates(selectedArea)} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
          Actualizar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{payload.legalUpdates.length}</div>
            <p className="text-xs text-muted-foreground">Novedades normativas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{payload.jurisprudenceUpdates.length}</div>
            <p className="text-xs text-muted-foreground">Novedades jurisprudenciales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{payload.monitoringLinks.length}</div>
            <p className="text-xs text-muted-foreground">Fuentes oficiales vigiladas</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedArea} onValueChange={(value) => setSelectedArea(value as LegalAreaKey)} className="space-y-6">
        <TabsList className="flex h-auto flex-wrap">
          {LEGAL_AREAS.filter((item) => item.key !== "todas").map((area) => (
            <TabsTrigger key={area.key} value={area.key}>
              {area.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {LEGAL_AREAS.filter((item) => item.key !== "todas").map((area) => (
          <TabsContent key={area.key} value={area.key} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{currentArea.label}</CardTitle>
                <CardDescription>{currentArea.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{payload.summary}</p>
                <div className="flex flex-wrap gap-2">
                  {currentArea.keywords.map((item) => (
                    <Badge key={item} variant="secondary">
                      {item}
                    </Badge>
                  ))}
                  {payload.usedFallback ? <Badge variant="outline">Modo respaldo</Badge> : <Badge>Fuente IA + web</Badge>}
                </div>
                {error ? (
                  <p className="text-sm text-destructive">{error}</p>
                ) : null}
              </CardContent>
            </Card>

            <div className="grid gap-6 xl:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scale className="h-5 w-5" />
                    Normas y modificaciones
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {payload.legalUpdates.map((item) => (
                    <div key={`${item.type}-${item.title}`} className="rounded-lg border p-4">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">{item.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.source} - {item.date}
                          </p>
                        </div>
                        <Badge variant="secondary">Norma</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.summary}</p>
                      <p className="mt-2 text-sm">{item.impact}</p>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        Abrir fuente oficial
                        <ArrowUpRight className="h-4 w-4" />
                      </a>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gavel className="h-5 w-5" />
                    Jurisprudencia y sentencias
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {payload.jurisprudenceUpdates.map((item) => (
                    <div key={`${item.type}-${item.title}`} className="rounded-lg border p-4">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">{item.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.source} - {item.date}
                          </p>
                        </div>
                        <Badge variant="outline">Jurisprudencia</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.summary}</p>
                      <p className="mt-2 text-sm">{item.impact}</p>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        Abrir fuente oficial
                        <ArrowUpRight className="h-4 w-4" />
                      </a>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Fuentes oficiales del area</CardTitle>
                <CardDescription>Enlaces listos para vigilancia diaria del abogado.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {payload.monitoringLinks.map((item) => (
                    <a
                      key={item.id}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground capitalize">{item.type}</p>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
