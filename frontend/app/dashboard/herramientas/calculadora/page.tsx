"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Calculator,
  Calendar,
  CalendarDays,
  Clock,
  Info,
} from "lucide-react";
import {
  agregarDiasHabiles,
  agregarDiasCalendario,
  agregarMeses,
  agregarAnos,
  contarDiasHabiles,
  contarDiasCalendario,
  formatearFecha,
  esDiaHabil,
  terminosLegales,
} from "@/lib/utils/legal-calculator";
import { formatDateShort } from "@/lib/utils/format";

export default function CalculadoraPage() {
  const [fechaInicio, setFechaInicio] = useState<string>("");
  const [cantidad, setCantidad] = useState<string>("10");
  const [tipoTermino, setTipoTermino] = useState<string>("habil");
  const [terminoSeleccionado, setTerminoSeleccionado] = useState<string>("");
  
  const [fechaInicioConteo, setFechaInicioConteo] = useState<string>("");
  const [fechaFinConteo, setFechaFinConteo] = useState<string>("");
  
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todos");

  const resultado = useMemo(() => {
    if (!fechaInicio || !cantidad) return null;
    
    const fecha = new Date(fechaInicio + "T12:00:00");
    const cant = parseInt(cantidad);
    
    if (isNaN(cant) || cant <= 0) return null;
    
    let fechaFinal: Date;
    
    switch (tipoTermino) {
      case "habil":
        fechaFinal = agregarDiasHabiles(fecha, cant);
        break;
      case "calendario":
        fechaFinal = agregarDiasCalendario(fecha, cant);
        break;
      case "mes":
        fechaFinal = agregarMeses(fecha, cant);
        break;
      case "anio":
        fechaFinal = agregarAnos(fecha, cant);
        break;
      default:
        fechaFinal = fecha;
    }
    
    const esHabil = esDiaHabil(fechaFinal);
    
    return {
      fechaFinal,
      fechaFormateada: formatearFecha(fechaFinal),
      esHabil,
    };
  }, [fechaInicio, cantidad, tipoTermino]);

  const resultadoConteo = useMemo(() => {
    if (!fechaInicioConteo || !fechaFinConteo) return null;
    
    const inicio = new Date(fechaInicioConteo + "T12:00:00");
    const fin = new Date(fechaFinConteo + "T12:00:00");
    
    if (fin <= inicio) return null;
    
    return {
      diasHabiles: contarDiasHabiles(inicio, fin),
      diasCalendario: contarDiasCalendario(inicio, fin),
    };
  }, [fechaInicioConteo, fechaFinConteo]);

  const aplicarTermino = () => {
    if (!terminoSeleccionado) return;
    
    const termino = terminosLegales.find(t => t.nombre === terminoSeleccionado);
    if (!termino) return;
    
    setCantidad(termino.dias.toString());
    setTipoTermino(termino.tipo);
  };

  const terminosFiltrados = useMemo(() => {
    if (filtroCategoria === "todos") return terminosLegales;
    
    const filtros: Record<string, string[]> = {
      procesal: ["CGP"],
      constitucional: ["Decreto 2591", "CPACA"],
      laboral: ["CPL", "CST"],
      penal: ["CPP", "CP"],
    };
    
    const palabras = filtros[filtroCategoria] || [];
    return terminosLegales.filter(t => 
      palabras.some(p => t.norma.includes(p))
    );
  }, [filtroCategoria]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calculadora de Terminos Judiciales</h1>
          <p className="text-muted-foreground">
            Calcula dias habiles, vencimientos y plazos legales segun la normativa colombiana.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/herramientas">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a herramientas
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="calcular" className="space-y-6">
        <TabsList>
          <TabsTrigger value="calcular">
            <Calculator className="mr-2 h-4 w-4" />
            Calcular vencimiento
          </TabsTrigger>
          <TabsTrigger value="contar">
            <CalendarDays className="mr-2 h-4 w-4" />
            Contar dias
          </TabsTrigger>
          <TabsTrigger value="terminos">
            <Clock className="mr-2 h-4 w-4" />
            Terminos legales
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calcular" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Calcular fecha de vencimiento</CardTitle>
                <CardDescription>
                  Ingresa la fecha inicial y el plazo para obtener la fecha de vencimiento.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Termino legal predefinido</Label>
                  <div className="flex gap-2">
                    <Select value={terminoSeleccionado} onValueChange={setTerminoSeleccionado}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Seleccionar termino..." />
                      </SelectTrigger>
                      <SelectContent>
                        {terminosLegales.map((t) => (
                          <SelectItem key={t.nombre} value={t.nombre}>
                            {t.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={aplicarTermino}>
                      Aplicar
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Fecha de inicio</Label>
                    <Input
                      type="date"
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cantidad</Label>
                    <Input
                      type="number"
                      min="1"
                      value={cantidad}
                      onChange={(e) => setCantidad(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tipo de termino</Label>
                  <Select value={tipoTermino} onValueChange={setTipoTermino}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="habil">Dias habiles</SelectItem>
                      <SelectItem value="calendario">Dias calendario</SelectItem>
                      <SelectItem value="mes">Meses</SelectItem>
                      <SelectItem value="anio">Anos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resultado</CardTitle>
                <CardDescription>
                  Fecha de vencimiento calculada
                </CardDescription>
              </CardHeader>
              <CardContent>
                {resultado ? (
                  <div className="space-y-4">
                    <div className="rounded-lg border bg-primary/5 p-6 text-center">
                      <Calendar className="mx-auto mb-4 h-12 w-12 text-primary" />
                      <p className="text-2xl font-bold">{formatDateShort(resultado.fechaFinal)}</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {resultado.fechaFormateada}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-center gap-2">
                      <Badge variant={resultado.esHabil ? "default" : "secondary"}>
                        {resultado.esHabil ? "Dia habil" : "Dia no habil"}
                      </Badge>
                    </div>

                    {!resultado.esHabil && (
                      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
                        <Info className="mt-0.5 h-4 w-4 text-amber-600" />
                        <p className="text-amber-800">
                          La fecha de vencimiento cae en dia no habil. Segun el CGP, el termino se
                          extiende hasta el siguiente dia habil.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Calculator className="mb-4 h-12 w-12 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Ingresa los datos para calcular el vencimiento
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="contar" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Contar dias entre fechas</CardTitle>
                <CardDescription>
                  Calcula cuantos dias habiles y calendario hay entre dos fechas.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Fecha inicial</Label>
                    <Input
                      type="date"
                      value={fechaInicioConteo}
                      onChange={(e) => setFechaInicioConteo(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha final</Label>
                    <Input
                      type="date"
                      value={fechaFinConteo}
                      onChange={(e) => setFechaFinConteo(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resultado</CardTitle>
                <CardDescription>
                  Dias entre las fechas seleccionadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {resultadoConteo ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border bg-primary/5 p-6 text-center">
                      <p className="text-4xl font-bold text-primary">{resultadoConteo.diasHabiles}</p>
                      <p className="mt-2 text-sm text-muted-foreground">Dias habiles</p>
                    </div>
                    <div className="rounded-lg border bg-muted/50 p-6 text-center">
                      <p className="text-4xl font-bold">{resultadoConteo.diasCalendario}</p>
                      <p className="mt-2 text-sm text-muted-foreground">Dias calendario</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <CalendarDays className="mb-4 h-12 w-12 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Selecciona las fechas para contar los dias
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="terminos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Terminos legales comunes</CardTitle>
              <CardDescription>
                Referencia rapida de plazos procesales segun la normativa colombiana.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="procesal">Procesal civil</SelectItem>
                    <SelectItem value="constitucional">Constitucional</SelectItem>
                    <SelectItem value="laboral">Laboral</SelectItem>
                    <SelectItem value="penal">Penal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Termino</TableHead>
                    <TableHead>Plazo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Norma</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {terminosFiltrados.map((termino) => (
                    <TableRow key={termino.nombre}>
                      <TableCell className="font-medium">{termino.nombre}</TableCell>
                      <TableCell>{termino.dias}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {termino.tipo === "habil" ? "Dias habiles" :
                           termino.tipo === "calendario" ? "Dias calendario" :
                           termino.tipo === "mes" ? "Meses" :
                           termino.tipo === "anio" ? "Anos" :
                           termino.tipo === "hora" ? "Horas" : termino.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{termino.norma}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
