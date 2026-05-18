"use client"

import Link from "next/link"
import {
  BookOpen,
  Calendar,
  Calculator,
  Clock,
  FileSearch,
  FileText,
  Gavel,
  Scale,
  Sparkles,
  ArrowRight,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const herramientas = [
  {
    title: "Calculadora de Términos",
    description: "Calcula días hábiles, vencimientos y plazos judiciales con soporte legal colombiano.",
    icon: Calculator,
    href: "/dashboard/herramientas/calculadora",
    color: "from-blue-500 to-cyan-500",
  },
  {
    title: "Generador de Documentos",
    description: "Crea demandas, tutelas, contratos y escritos con ayuda de IA.",
    icon: FileText,
    href: "/dashboard/herramientas/generador",
    color: "from-emerald-500 to-teal-500",
  },
  {
    title: "Consulta de Procesos",
    description: "Consulta expedientes reales cargados en TOCHI y contrasta con la Rama Judicial.",
    icon: Scale,
    href: "/dashboard/herramientas/consulta-procesos",
    color: "from-violet-500 to-fuchsia-500",
  },
  {
    title: "Cronómetro de Audiencias",
    description: "Controla el tiempo de intervenciones, alegatos y pausas de audiencia.",
    icon: Clock,
    href: "/dashboard/herramientas/cronometro",
    color: "from-orange-500 to-amber-500",
  },
  {
    title: "Calendario Judicial",
    description: "Consulta días hábiles, festivos, vacancia y fechas clave.",
    icon: Calendar,
    href: "/dashboard/herramientas/calendario-judicial",
    color: "from-red-500 to-rose-500",
  },
  {
    title: "Biblioteca Legal",
    description: "Accede a códigos, leyes y jurisprudencia actualizada.",
    icon: BookOpen,
    href: "/dashboard/herramientas/biblioteca",
    color: "from-indigo-500 to-blue-500",
  },
  {
    title: "Liquidador de Costas",
    description: "Calcula costas procesales y agencias en derecho.",
    icon: Gavel,
    href: "/dashboard/herramientas/liquidador",
    color: "from-teal-500 to-cyan-500",
  },
  {
    title: "Verificador de Documentos",
    description: "Verifica autenticidad y consistencia de documentos judiciales.",
    icon: FileSearch,
    href: "/dashboard/herramientas/verificador",
    color: "from-pink-500 to-rose-500",
  },
]

export default function HerramientasPage() {
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-border/70 bg-gradient-to-br from-card via-card to-accent/5 shadow-[0_24px_70px_-35px_rgba(15,23,42,0.24)]">
        <CardContent className="p-0">
          <div className="grid gap-6 p-6 lg:grid-cols-[1.15fr_.85fr] lg:p-8">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                Caja de herramientas legal
              </div>
              <div className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tight text-balance lg:text-4xl">
                  Herramientas pensadas para trabajar rapido, sin perder rigor.
                </h1>
                <p className="max-w-2xl text-muted-foreground text-pretty">
                  Reunimos utilidades legales, calculadoras y validadores en una sola capa visual para
                  que no saltes entre pantallas innecesariamente.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge className="rounded-full bg-accent/15 px-3 py-1 text-accent hover:bg-accent/15">
                  {herramientas.length} herramientas
                </Badge>
                <Badge variant="outline" className="rounded-full border-border/70 px-3 py-1">
                  Legal suite optimizada
                </Badge>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild className="rounded-full">
                  <Link href="/dashboard/herramientas/calculadora">
                    Abrir calculadora
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full border-border/70">
                  <Link href="/dashboard/documentos">Ir a documentos</Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.5rem] border border-border/70 bg-background/80 p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Plazos</p>
                <p className="mt-2 text-2xl font-semibold">Control fino</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Calcula vencimientos, terminos y dias habiles con contexto juridico.
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-border/70 bg-background/80 p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Documentos</p>
                <p className="mt-2 text-2xl font-semibold">Produccion rapida</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Genera y revisa escritos sin salir del flujo de trabajo.
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-border/70 bg-background/80 p-5 shadow-sm sm:col-span-2">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Navegacion</p>
                <p className="mt-2 text-2xl font-semibold">Todo en una sola vista</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Las utilidades estan organizadas por tarea para llegar mas rapido a lo que necesitas.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {herramientas.map((herramienta) => (
          <Link key={herramienta.href} href={herramienta.href} className="group">
            <Card className="h-full overflow-hidden border-border/70 bg-card/90 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_24px_70px_-35px_rgba(15,23,42,0.24)]">
              <CardHeader className="space-y-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${herramienta.color} shadow-lg shadow-primary/10`}>
                  <herramienta.icon className="h-6 w-6 text-white" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-lg">{herramienta.title}</CardTitle>
                  <CardDescription className="text-sm">{herramienta.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/80 px-4 py-3 text-sm text-muted-foreground transition-colors group-hover:border-primary/20 group-hover:text-foreground">
                  <span>Abrir herramienta</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
