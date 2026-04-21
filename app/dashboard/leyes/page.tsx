"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Scale,
  ExternalLink,
  BookOpen,
  Star,
  Clock,
  FileText,
  Gavel,
} from "lucide-react";
import Link from "next/link";
import { CODIGOS_COLOMBIANOS } from "@/lib/types";

const recentSearches = [
  "Art. 1502 Codigo Civil",
  "Despido sin justa causa CST",
  "Art. 29 Constitucion",
  "Terminos de prescripcion CGP",
];

const jurisprudenciaReciente = [
  {
    numero: "C-123/24",
    corte: "Corte Constitucional",
    tema: "Derechos fundamentales en el trabajo",
    fecha: "2024-01-15",
  },
  {
    numero: "SL-456/24",
    corte: "Corte Suprema - Sala Laboral",
    tema: "Indemnizacion por despido injusto",
    fecha: "2024-01-10",
  },
  {
    numero: "T-789/24",
    corte: "Corte Constitucional",
    tema: "Tutela contra empleador",
    fecha: "2024-01-05",
  },
];

export default function LeyesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArea, setSelectedArea] = useState<string>("todos");

  const filteredCodigos = CODIGOS_COLOMBIANOS.filter((codigo) => {
    const matchesSearch =
      codigo.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      codigo.nombreCorto.toLowerCase().includes(searchQuery.toLowerCase()) ||
      codigo.areasDelDerecho.some((area) =>
        area.toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesArea =
      selectedArea === "todos" ||
      codigo.areasDelDerecho.some((area) =>
        area.toLowerCase().includes(selectedArea.toLowerCase())
      );
    return matchesSearch && matchesArea;
  });

  const areas = [
    "todos",
    ...new Set(CODIGOS_COLOMBIANOS.flatMap((c) => c.areasDelDerecho)),
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Codigos Legales Colombianos</h1>
        <p className="text-muted-foreground">
          Consulta los codigos y leyes de Colombia con actualizaciones automaticas
        </p>
      </div>

      {/* Search Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar articulos, leyes, temas... (ej: Art. 1502, despido injusto)"
                className="pl-10 h-12 text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button size="lg" className="h-12">
              <Search className="mr-2 h-4 w-4" />
              Buscar
            </Button>
          </div>

          {/* Recent searches */}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground">Recientes:</span>
            {recentSearches.map((search) => (
              <Badge
                key={search}
                variant="secondary"
                className="cursor-pointer hover:bg-secondary/80"
                onClick={() => setSearchQuery(search)}
              >
                <Clock className="mr-1 h-3 w-3" />
                {search}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="codigos" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="codigos">
            <BookOpen className="mr-2 h-4 w-4" />
            Codigos
          </TabsTrigger>
          <TabsTrigger value="jurisprudencia">
            <Gavel className="mr-2 h-4 w-4" />
            Jurisprudencia
          </TabsTrigger>
          <TabsTrigger value="favoritos">
            <Star className="mr-2 h-4 w-4" />
            Favoritos
          </TabsTrigger>
        </TabsList>

        {/* Codigos Tab */}
        <TabsContent value="codigos" className="space-y-6">
          {/* Area filters */}
          <div className="flex flex-wrap gap-2">
            {areas.slice(0, 8).map((area) => (
              <Badge
                key={area}
                variant={selectedArea === area ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedArea(area)}
              >
                {area === "todos" ? "Todos" : area}
              </Badge>
            ))}
          </div>

          {/* Codes Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCodigos.map((codigo) => (
              <Link
                key={codigo.codigo}
                href={`/dashboard/leyes/${codigo.codigo.toLowerCase()}`}
              >
                <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <Scale className="h-5 w-5 text-primary" />
                      </div>
                      <Badge variant="outline">{codigo.nombreCorto}</Badge>
                    </div>
                    <CardTitle className="text-base mt-3">{codigo.nombre}</CardTitle>
                    <CardDescription className="text-xs">
                      {codigo.numeroNorma}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {codigo.areasDelDerecho.slice(0, 2).map((area) => (
                        <Badge key={area} variant="secondary" className="text-xs">
                          {area}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Ver articulos</span>
                      <ExternalLink className="h-3 w-3" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </TabsContent>

        {/* Jurisprudencia Tab */}
        <TabsContent value="jurisprudencia" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Jurisprudencia Reciente</CardTitle>
              <CardDescription>
                Sentencias de las altas cortes colombianas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {jurisprudenciaReciente.map((sentencia) => (
                  <div
                    key={sentencia.numero}
                    className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="rounded-lg bg-chart-2/10 p-2">
                      <Gavel className="h-4 w-4 text-chart-2" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{sentencia.numero}</p>
                        <Badge variant="outline" className="text-xs">
                          {sentencia.corte}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {sentencia.tema}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {sentencia.fecha}
                      </p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Links to official sources */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Fuentes Oficiales</CardTitle>
              <CardDescription>
                Enlaces directos a las relatorias de las cortes colombianas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-3">
                <a
                  href="https://jurisprudencia.ramajudicial.gov.co/WebRelatoria/cc/index.xhtml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="rounded-lg bg-chart-1/10 p-2">
                    <Gavel className="h-4 w-4 text-chart-1" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Corte Constitucional</p>
                    <p className="text-xs text-muted-foreground">Sentencias C, T, SU</p>
                  </div>
                  <ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" />
                </a>
                <a
                  href="https://jurisprudencia.ramajudicial.gov.co/WebRelatoria/csj/index.xhtml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="rounded-lg bg-chart-2/10 p-2">
                    <Gavel className="h-4 w-4 text-chart-2" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Corte Suprema</p>
                    <p className="text-xs text-muted-foreground">Casaciones, Tutelas</p>
                  </div>
                  <ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" />
                </a>
                <a
                  href="https://jurisprudencia.ramajudicial.gov.co/WebRelatoria/ce/index.xhtml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="rounded-lg bg-chart-3/10 p-2">
                    <Gavel className="h-4 w-4 text-chart-3" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Consejo de Estado</p>
                    <p className="text-xs text-muted-foreground">Contencioso Administrativo</p>
                  </div>
                  <ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" />
                </a>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Favoritos Tab */}
        <TabsContent value="favoritos">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Star className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-2">Sin favoritos aun</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                Marca articulos como favoritos mientras navegas los codigos para acceder
                rapidamente a ellos
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Enlaces Oficiales</CardTitle>
          <CardDescription>
            Accede a las fuentes oficiales de la normativa colombiana
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <a
              href="https://www.suin-juriscol.gov.co/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-sm">SUIN-Juriscol</p>
                <p className="text-xs text-muted-foreground">+98,000 normas</p>
              </div>
            </a>
            <a
              href="http://www.secretariasenado.gov.co/senado/basedoc/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <BookOpen className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-sm">Secretaria del Senado</p>
                <p className="text-xs text-muted-foreground">Codigos actualizados</p>
              </div>
            </a>
            <a
              href="https://www.corteconstitucional.gov.co/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <Gavel className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-sm">Corte Constitucional</p>
                <p className="text-xs text-muted-foreground">Jurisprudencia</p>
              </div>
            </a>
            <a
              href="https://www.datos.gov.co/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <Scale className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-sm">Datos Abiertos</p>
                <p className="text-xs text-muted-foreground">API de datos</p>
              </div>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
