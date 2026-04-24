"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Copy,
  Download,
  Eye,
  FileCheck,
  FileClock,
  FileSignature,
  FileText,
  Folder,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";
import {
  demoDocuments,
  demoTemplates,
  getCaseById,
  getClientById,
  getClientDisplayName,
} from "@/lib/demo-data";

const categoriaColores: Record<string, string> = {
  Laboral: "bg-green-100 text-green-800",
  Constitucional: "bg-purple-100 text-purple-800",
  Civil: "bg-blue-100 text-blue-800",
  Administrativo: "bg-cyan-100 text-cyan-800",
};

const estadoIconos: Record<string, React.ReactNode> = {
  finalizado: <FileCheck className="h-4 w-4 text-green-500" />,
  borrador: <FileClock className="h-4 w-4 text-amber-500" />,
  revision: <FileSignature className="h-4 w-4 text-blue-500" />,
};

export default function DocumentosPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [generatingWithAI, setGeneratingWithAI] = useState(false);

  const filteredTemplates = useMemo(() => {
    return demoTemplates.filter(
      (item) =>
        item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.categoria.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const selectedTemplate = demoTemplates.find((item) => item.id === selectedTemplateId) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Documentos y Plantillas</h1>
          <p className="text-muted-foreground">
            Biblioteca legal para escritos, contratos, tutelas y documentos procesales.
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Subir Documento
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{demoTemplates.length}</div>
            <p className="text-xs text-muted-foreground">Plantillas activas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{demoDocuments.length}</div>
            <p className="text-xs text-muted-foreground">Documentos cargados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {demoDocuments.filter((item) => item.estado === "revision").length}
            </div>
            <p className="text-xs text-muted-foreground">En revision</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {demoDocuments.filter((item) => item.estado === "finalizado").length}
            </div>
            <p className="text-xs text-muted-foreground">Finalizados</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="plantillas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="plantillas">Plantillas</TabsTrigger>
          <TabsTrigger value="recientes">Documentos recientes</TabsTrigger>
          <TabsTrigger value="generador">Generador IA</TabsTrigger>
        </TabsList>

        <TabsContent value="plantillas" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar plantillas..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="transition-shadow hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <Badge className={categoriaColores[template.categoria]}>{template.categoria}</Badge>
                  </div>
                  <CardTitle className="text-lg">{template.nombre}</CardTitle>
                  <CardDescription>{template.descripcion}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setSelectedTemplateId(template.id)}
                        >
                          <Eye className="mr-1 h-4 w-4" />
                          Ver
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>{selectedTemplate?.nombre}</DialogTitle>
                          <DialogDescription>{selectedTemplate?.descripcion}</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <p className="text-sm text-muted-foreground">Campos requeridos:</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedTemplate?.campos.map((field) => (
                              <Badge key={field} variant="outline">
                                {field.replace(/_/g, " ")}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex gap-2 pt-4">
                            <Button className="flex-1 gap-2">
                              <Copy className="h-4 w-4" />
                              Usar plantilla
                            </Button>
                            <Button variant="outline" className="gap-2">
                              <Sparkles className="h-4 w-4" />
                              Generar con IA
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recientes">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Folder className="h-5 w-5" />
                Documentos recientes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {demoDocuments.map((doc) => {
                const client = getClientById(doc.clienteId);
                const caseData = doc.casoId ? getCaseById(doc.casoId) : undefined;
                return (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      {estadoIconos[doc.estado]}
                      <div>
                        <p className="font-medium">{doc.nombre}</p>
                        <p className="text-sm text-muted-foreground">
                          {client ? getClientDisplayName(client) : "Cliente"}{" "}
                          {caseData ? `- ${caseData.numeroInterno}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">{doc.fecha}</span>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generador">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Generador de documentos con IA
              </CardTitle>
              <CardDescription>
                Describe el escrito y usa la base juridica de la suite como apoyo inicial.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de documento</label>
                <select className="w-full rounded-md border border-input bg-background px-3 py-2">
                  <option value="">Seleccionar tipo...</option>
                  <option value="demanda">Demanda</option>
                  <option value="tutela">Accion de tutela</option>
                  <option value="recurso">Recurso</option>
                  <option value="derecho_peticion">Derecho de peticion</option>
                  <option value="contrato">Contrato</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Describe la situacion</label>
                <Textarea
                  placeholder="Ej: Necesito una demanda laboral por despido injustificado con liquidacion de prestaciones y enfoque en CST arts. 62 y 64..."
                  rows={6}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Caso relacionado</label>
                <select className="w-full rounded-md border border-input bg-background px-3 py-2">
                  {demoDocuments.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                className="w-full gap-2"
                disabled={generatingWithAI}
                onClick={() => setGeneratingWithAI((current) => !current)}
              >
                <Sparkles className="h-4 w-4" />
                {generatingWithAI ? "Preparando borrador..." : "Generar documento con IA"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
