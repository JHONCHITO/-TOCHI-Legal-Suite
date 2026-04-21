"use client";

import { useState, useEffect, use } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  Scale,
  ExternalLink,
  Star,
  ArrowLeft,
  BookOpen,
  Copy,
  Check,
  MessageSquare,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { CODIGOS_COLOMBIANOS } from "@/lib/types";

// Mock articles data - in production would come from database
const mockArticles: Record<string, Array<{
  numero: string;
  epigrafe: string;
  contenido: string;
  libro?: string;
  titulo?: string;
  capitulo?: string;
  vigente: boolean;
}>> = {
  codigo_civil: [
    {
      numero: "1494",
      epigrafe: "Fuentes de las obligaciones",
      contenido: "Las obligaciones nacen, ya del concurso real de las voluntades de dos o mas personas, como en los contratos o convenciones; ya de un hecho voluntario de la persona que se obliga, como en la aceptacion de una herencia o legado y en todos los cuasicontratos; ya a consecuencia de un hecho que ha inferido injuria o dano a otra persona, como en los delitos; ya por disposicion de la ley, como entre los padres y los hijos de familia.",
      libro: "Cuarto",
      titulo: "De las obligaciones en general",
      capitulo: "Definiciones",
      vigente: true,
    },
    {
      numero: "1495",
      epigrafe: "Definicion de contrato",
      contenido: "Contrato o convencion es un acto por el cual una parte se obliga para con otra a dar, hacer o no hacer alguna cosa. Cada parte puede ser de una o de muchas personas.",
      libro: "Cuarto",
      titulo: "De las obligaciones en general",
      capitulo: "Definiciones",
      vigente: true,
    },
    {
      numero: "1502",
      epigrafe: "Requisitos para obligarse",
      contenido: "Para que una persona se obligue a otra por un acto o declaracion de voluntad, es necesario: 1. Que sea legalmente capaz. 2. Que consienta en dicho acto o declaracion y su consentimiento no adolezca de vicio. 3. Que recaiga sobre un objeto licito. 4. Que tenga una causa licita. La capacidad legal de una persona consiste en poderse obligar por si misma, sin el ministerio o la autorizacion de otra.",
      libro: "Cuarto",
      titulo: "De las obligaciones en general",
      capitulo: "De los actos y declaraciones de voluntad",
      vigente: true,
    },
    {
      numero: "1503",
      epigrafe: "Presuncion de capacidad",
      contenido: "Toda persona es legalmente capaz, excepto aquellas que la ley declara incapaces.",
      libro: "Cuarto",
      titulo: "De las obligaciones en general",
      capitulo: "De los actos y declaraciones de voluntad",
      vigente: true,
    },
    {
      numero: "1504",
      epigrafe: "Incapacidades absolutas y relativas",
      contenido: "Son absolutamente incapaces los dementes y los impuberes. Sus actos no producen ni aun obligaciones naturales, y no admiten caucion. Son tambien incapaces los menores adultos, pero la incapacidad de estas personas no es absoluta y sus actos pueden tener valor en ciertas circunstancias y bajo ciertos respectos determinados por las leyes.",
      libro: "Cuarto",
      titulo: "De las obligaciones en general",
      capitulo: "De los actos y declaraciones de voluntad",
      vigente: true,
    },
  ],
  codigo_penal: [
    {
      numero: "1",
      epigrafe: "Dignidad humana",
      contenido: "El derecho penal tendra como fundamento el respeto a la dignidad humana.",
      libro: "Primero",
      titulo: "De las normas rectoras de la ley penal colombiana",
      capitulo: "Unico",
      vigente: true,
    },
    {
      numero: "9",
      epigrafe: "Conducta punible",
      contenido: "Para que la conducta sea punible se requiere que sea tipica, antijuridica y culpable. La causalidad por si sola no basta para la imputacion juridica del resultado. Para que la conducta del inimputable sea punible se requiere que sea tipica, antijuridica y se constate la inexistencia de causales de ausencia de responsabilidad.",
      libro: "Primero",
      titulo: "De las normas rectoras de la ley penal colombiana",
      capitulo: "Unico",
      vigente: true,
    },
    {
      numero: "103",
      epigrafe: "Homicidio",
      contenido: "El que matare a otro, incurrira en prision de doscientos ocho (208) a cuatrocientos cincuenta (450) meses.",
      libro: "Segundo",
      titulo: "Delitos contra la vida y la integridad personal",
      capitulo: "Del homicidio",
      vigente: true,
    },
  ],
  codigo_sustantivo_trabajo: [
    {
      numero: "1",
      epigrafe: "Objeto",
      contenido: "La finalidad primordial de este Codigo es la de lograr la justicia en las relaciones que surgen entre empleadores y trabajadores, dentro de un espiritu de coordinacion economica y equilibrio social.",
      libro: "Primero",
      titulo: "Preliminar",
      vigente: true,
    },
    {
      numero: "22",
      epigrafe: "Definicion de contrato de trabajo",
      contenido: "1. Contrato de trabajo es aquel por el cual una persona natural se obliga a prestar un servicio personal a otra persona, natural o juridica, bajo la continuada dependencia o subordinacion de la segunda y mediante remuneracion. 2. Quien presta el servicio se denomina trabajador, quien lo recibe y remunera, empleador, y la remuneracion, cualquiera que sea su forma, salario.",
      libro: "Primero",
      titulo: "Contrato individual de trabajo",
      capitulo: "Definicion y normas generales",
      vigente: true,
    },
    {
      numero: "62",
      epigrafe: "Terminacion del contrato por justa causa",
      contenido: "Son justas causas para dar por terminado unilateralmente el contrato de trabajo: A) Por parte del empleador: 1. El haber sufrido engano por parte del trabajador, mediante la presentacion de certificados falsos para su admision o tendientes a obtener un provecho indebido. 2. Todo acto de violencia, injuria, malos tratamientos o grave indisciplina en que incurra el trabajador en sus labores, contra el empleador, los miembros de su familia, el personal directivo o los companeros de trabajo. 3. Todo acto grave de violencia, injuria o malos tratamientos en que incurra el trabajador fuera del servicio, en contra del empleador, de los miembros de su familia o de sus representantes y socios, jefes de taller, vigilantes o celadores.",
      libro: "Primero",
      titulo: "Contrato individual de trabajo",
      capitulo: "Terminacion del contrato de trabajo",
      vigente: true,
    },
    {
      numero: "64",
      epigrafe: "Terminacion unilateral del contrato sin justa causa",
      contenido: "En todo contrato de trabajo va envuelta la condicion resolutoria por incumplimiento de lo pactado, con indemnizacion de perjuicios a cargo de la parte responsable. Esta indemnizacion comprende el lucro cesante y el dano emergente.",
      libro: "Primero",
      titulo: "Contrato individual de trabajo",
      capitulo: "Terminacion del contrato de trabajo",
      vigente: true,
    },
  ],
  codigo_general_proceso: [
    {
      numero: "1",
      epigrafe: "Objeto",
      contenido: "Este codigo regula la actividad procesal en los asuntos civiles, comerciales, de familia y agrarios. Se aplica, ademas, a todos los asuntos de cualquier jurisdiccion o especialidad y a las actuaciones de particulares y autoridades administrativas, cuando ejerzan funciones jurisdiccionales, en cuanto no esten regulados expresamente en otras leyes.",
      libro: "Primero",
      titulo: "Disposiciones generales",
      vigente: true,
    },
    {
      numero: "90",
      epigrafe: "Admision de la demanda",
      contenido: "El juez admitira la demanda que reuna los requisitos de ley y le dara el tramite que legalmente le corresponda aunque el demandante haya indicado una via procesal inadecuada.",
      libro: "Segundo",
      titulo: "Actos procesales",
      capitulo: "La demanda",
      vigente: true,
    },
  ],
  constitucion_1991: [
    {
      numero: "1",
      epigrafe: "Estado Social de Derecho",
      contenido: "Colombia es un Estado social de derecho, organizado en forma de Republica unitaria, descentralizada, con autonomia de sus entidades territoriales, democratica, participativa y pluralista, fundada en el respeto de la dignidad humana, en el trabajo y la solidaridad de las personas que la integran y en la prevalencia del interes general.",
      titulo: "De los principios fundamentales",
      vigente: true,
    },
    {
      numero: "11",
      epigrafe: "Derecho a la vida",
      contenido: "El derecho a la vida es inviolable. No habra pena de muerte.",
      titulo: "De los derechos fundamentales",
      vigente: true,
    },
    {
      numero: "13",
      epigrafe: "Derecho a la igualdad",
      contenido: "Todas las personas nacen libres e iguales ante la ley, recibiran la misma proteccion y trato de las autoridades y gozaran de los mismos derechos, libertades y oportunidades sin ninguna discriminacion por razones de sexo, raza, origen nacional o familiar, lengua, religion, opinion politica o filosofica.",
      titulo: "De los derechos fundamentales",
      vigente: true,
    },
    {
      numero: "29",
      epigrafe: "Debido proceso",
      contenido: "El debido proceso se aplicara a toda clase de actuaciones judiciales y administrativas. Nadie podra ser juzgado sino conforme a leyes preexistentes al acto que se le imputa, ante juez o tribunal competente y con observancia de la plenitud de las formas propias de cada juicio. En materia penal, la ley permisiva o favorable, aun cuando sea posterior, se aplicara de preferencia a la restrictiva o desfavorable.",
      titulo: "De los derechos fundamentales",
      vigente: true,
    },
    {
      numero: "86",
      epigrafe: "Accion de tutela",
      contenido: "Toda persona tendra accion de tutela para reclamar ante los jueces, en todo momento y lugar, mediante un procedimiento preferente y sumario, por si misma o por quien actue a su nombre, la proteccion inmediata de sus derechos constitucionales fundamentales, cuando quiera que estos resulten vulnerados o amenazados por la accion o la omision de cualquier autoridad publica.",
      titulo: "De la proteccion y aplicacion de los derechos",
      vigente: true,
    },
  ],
};

export default function CodigoDetailPage({ params }: { params: Promise<{ codigo: string }> }) {
  const resolvedParams = use(params);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedArticle, setCopiedArticle] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const codigoData = CODIGOS_COLOMBIANOS.find(
    (c) => c.codigo.toLowerCase() === resolvedParams.codigo.toLowerCase()
  );

  const articles = mockArticles[resolvedParams.codigo.toLowerCase()] || [];

  const filteredArticles = articles.filter(
    (article) =>
      article.numero.includes(searchQuery) ||
      article.epigrafe.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.contenido.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group articles by titulo/capitulo
  const groupedArticles = filteredArticles.reduce((acc, article) => {
    const key = article.titulo || "General";
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(article);
    return acc;
  }, {} as Record<string, typeof articles>);

  const copyToClipboard = async (text: string, articleNum: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedArticle(articleNum);
    setTimeout(() => setCopiedArticle(null), 2000);
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  // Expand all sections by default
  useEffect(() => {
    setExpandedSections(new Set(Object.keys(groupedArticles)));
  }, [resolvedParams.codigo]);

  if (!codigoData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Scale className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Codigo no encontrado</h2>
        <p className="text-muted-foreground mb-4">
          El codigo solicitado no existe en nuestra base de datos
        </p>
        <Button asChild>
          <Link href="/dashboard/leyes">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Codigos
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button and header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/dashboard/leyes" className="hover:text-foreground">
              Codigos Legales
            </Link>
            <span>/</span>
            <span>{codigoData.nombreCorto}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{codigoData.nombre}</h1>
          <p className="text-muted-foreground">{codigoData.numeroNorma}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={codigoData.urlSenado} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Ver en Senado
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/asistente?context=${codigoData.codigo}`}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Consultar IA
            </Link>
          </Button>
        </div>
      </div>

      {/* Info Card */}
      <Card>
        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Entidad Emisora</p>
              <p className="font-medium">{codigoData.entidadEmisora}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tipo</p>
              <p className="font-medium capitalize">{codigoData.tipo}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Areas del Derecho</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {codigoData.areasDelDerecho.map((area) => (
                  <Badge key={area} variant="secondary" className="text-xs">
                    {area}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fuentes Oficiales</p>
              <div className="flex gap-2 mt-1">
                <a
                  href={codigoData.urlSUIN}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline"
                >
                  SUIN
                </a>
                <a
                  href={codigoData.urlSenado}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline"
                >
                  Senado
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar articulos por numero o contenido..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Articles */}
      <div className="space-y-4">
        {Object.entries(groupedArticles).map(([titulo, articulos]) => (
          <Card key={titulo}>
            <CardHeader
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => toggleSection(titulo)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {expandedSections.has(titulo) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <CardTitle className="text-lg">{titulo}</CardTitle>
                  <Badge variant="secondary">{articulos.length} articulos</Badge>
                </div>
              </div>
            </CardHeader>
            {expandedSections.has(titulo) && (
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {articulos.map((article) => (
                    <div
                      key={article.numero}
                      className="border rounded-lg p-4 hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">Art. {article.numero}</Badge>
                            <span className="font-medium">{article.epigrafe}</span>
                            {article.vigente && (
                              <Badge variant="secondary" className="bg-accent/20 text-accent">
                                Vigente
                              </Badge>
                            )}
                          </div>
                          {article.capitulo && (
                            <p className="text-xs text-muted-foreground mb-2">
                              {article.libro && `Libro ${article.libro} - `}
                              {article.capitulo}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {article.contenido}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              copyToClipboard(
                                `Art. ${article.numero}. ${article.epigrafe}\n\n${article.contenido}`,
                                article.numero
                              )
                            }
                          >
                            {copiedArticle === article.numero ? (
                              <Check className="h-4 w-4 text-accent" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Star className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {filteredArticles.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-8 w-8 text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">No se encontraron articulos</h3>
            <p className="text-sm text-muted-foreground text-center">
              {searchQuery
                ? "Intenta con otros terminos de busqueda"
                : "No hay articulos cargados para este codigo"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
