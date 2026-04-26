"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calculator, FileText, Scale, Clock, Calendar, BookOpen, Gavel, FileSearch } from "lucide-react"
import Link from "next/link"

const herramientas = [
  {
    title: "Calculadora de Términos",
    description: "Calcula días hábiles, vencimientos y términos judiciales según el calendario colombiano",
    icon: Calculator,
    href: "/dashboard/herramientas/calculadora",
    color: "bg-blue-500",
  },
  {
    title: "Generador de Documentos",
    description: "Genera demandas, tutelas, contratos y otros documentos legales con ayuda de IA",
    icon: FileText,
    href: "/dashboard/herramientas/generador",
    color: "bg-green-500",
  },
  {
    title: "Consulta de Procesos",
    description: "Consulta el estado de procesos en la Rama Judicial",
    icon: Scale,
    href: "/dashboard/herramientas/consulta-procesos",
    color: "bg-purple-500",
  },
  {
    title: "Cronómetro de Audiencias",
    description: "Controla el tiempo de intervenciones en audiencias",
    icon: Clock,
    href: "/dashboard/herramientas/cronometro",
    color: "bg-orange-500",
  },
  {
    title: "Calendario Judicial",
    description: "Consulta días hábiles, festivos y vacancia judicial",
    icon: Calendar,
    href: "/dashboard/herramientas/calendario-judicial",
    color: "bg-red-500",
  },
  {
    title: "Biblioteca Legal",
    description: "Accede a códigos, leyes y jurisprudencia actualizada",
    icon: BookOpen,
    href: "/dashboard/herramientas/biblioteca",
    color: "bg-indigo-500",
  },
  {
    title: "Liquidador de Costas",
    description: "Calcula costas procesales y agencias en derecho",
    icon: Gavel,
    href: "/dashboard/herramientas/liquidador",
    color: "bg-teal-500",
  },
  {
    title: "Verificador de Documentos",
    description: "Verifica la autenticidad de documentos judiciales",
    icon: FileSearch,
    href: "/dashboard/herramientas/verificador",
    color: "bg-pink-500",
  },
]

export default function HerramientasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Herramientas Legales</h1>
        <p className="text-muted-foreground">
          Herramientas especializadas para optimizar tu trabajo legal diario
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {herramientas.map((herramienta) => (
          <Link key={herramienta.href} href={herramienta.href}>
            <Card className="h-full cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]">
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg ${herramienta.color} flex items-center justify-center mb-2`}>
                  <herramienta.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">{herramienta.title}</CardTitle>
                <CardDescription>{herramienta.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Abrir herramienta
                </Button>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
