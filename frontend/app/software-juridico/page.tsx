import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Brain, Briefcase, Calendar, FileText, MessageSquare, Scale, ShieldCheck, Users, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Software juridico para abogados y despachos en Colombia",
  description:
    "TOCHI Legal Suite es un software juridico en linea para abogados y despachos en Colombia. Gestiona casos, clientes, documentos, facturacion, agenda, notificaciones, portal de clientes e IA legal.",
};

const faqs = [
  {
    question: "Que es un software juridico?",
    answer:
      "Es una plataforma web para administrar casos, clientes, documentos, facturas, citas y comunicaciones del despacho en un solo lugar.",
  },
  {
    question: "TOCHI sirve para abogados independientes?",
    answer:
      "Si. La plataforma funciona para abogados independientes, consultorios juridicos y firmas pequenas o medianas que necesitan orden y seguimiento.",
  },
  {
    question: "Puedo tener portal para clientes?",
    answer:
      "Si. TOCHI permite habilitar portal de cliente para compartir casos, documentos, citas, notificaciones y facturas con acceso restringido.",
  },
  {
    question: "TOCHI esta pensado para Colombia?",
    answer:
      "Si. La plataforma esta orientada a la practica juridica colombiana, con moneda COP, gestion documental y referencias a normativa local.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "TOCHI Legal Suite",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Software juridico para abogados y despachos en Colombia con gestion de casos, clientes, documentos, facturacion, agenda y portal de clientes.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "COP",
    url: "https://www.tochilegalsuite.online/precios",
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

export default function SoftwareJuridicoPage() {
  return (
    <main className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <header className="border-b bg-card/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Scale className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold leading-none">TOCHI Legal Suite</p>
              <p className="text-xs text-muted-foreground">Software juridico en Colombia</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" className="hidden sm:inline-flex">
              <Link href="/precios">Ver planes</Link>
            </Button>
            <Button asChild>
              <Link href="/login">
                Iniciar sesion
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="bg-gradient-to-b from-primary/8 via-background to-background">
        <div className="container mx-auto px-4 py-20">
          <div className="mx-auto max-w-4xl text-center">
            <Badge className="mb-6 rounded-full bg-primary/10 px-4 py-1 text-primary hover:bg-primary/10">
              Software juridico para despachos, consultorios y abogados
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-balance md:text-6xl">
              Software juridico para abogados y despachos en Colombia
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg text-muted-foreground text-pretty md:text-xl">
              TOCHI Legal Suite ayuda a gestionar casos, clientes, documentos, facturacion, agenda,
              notificaciones y portal de clientes desde una sola plataforma web. Si buscas software
              juridico en Colombia, esta pagina esta pensada para que Google entienda mejor tu
              solucion y para que tus clientes entiendan que haces.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" className="rounded-full px-8">
                <Link href="/precios">
                  Ver planes y precios
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full px-8">
                <Link href="/login">Entrar al sistema</Link>
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
              <span className="rounded-full border bg-card px-4 py-2">Gestion de casos</span>
              <span className="rounded-full border bg-card px-4 py-2">Portal de clientes</span>
              <span className="rounded-full border bg-card px-4 py-2">Facturacion en COP</span>
              <span className="rounded-full border bg-card px-4 py-2">IA legal</span>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <Card>
            <CardHeader>
              <Briefcase className="h-6 w-6 text-primary" />
              <CardTitle>Casos y expedientes</CardTitle>
              <CardDescription>
                Organiza procesos, actuaciones, fechas y responsables por cliente.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <FileText className="h-6 w-6 text-primary" />
              <CardTitle>Documentos y aprobaciones</CardTitle>
              <CardDescription>
                Comparte archivos, pide aprobacion y mantiene versiones de soporte.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Wallet className="h-6 w-6 text-primary" />
              <CardTitle>Facturacion legal</CardTitle>
              <CardDescription>
                Emite facturas en pesos colombianos y controla saldos pendientes.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Calendar className="h-6 w-6 text-primary" />
              <CardTitle>Agenda y recordatorios</CardTitle>
              <CardDescription>
                Programa citas, audiencias y seguimientos con notificaciones.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Brain className="h-6 w-6 text-primary" />
              <CardTitle>IA legal asistida</CardTitle>
              <CardDescription>
                Consulta articulos, redacta documentos y encuentra contexto juridico rapido.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <ShieldCheck className="h-6 w-6 text-primary" />
              <CardTitle>Portal de clientes</CardTitle>
              <CardDescription>
                Cada cliente ve solo lo suyo: casos, documentos, facturas y mensajes.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      <section className="border-y bg-muted/30">
        <div className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold tracking-tight">Para quienes es este software juridico</h2>
            <p className="mt-3 text-muted-foreground">
              Esta pagina responde a busquedas como software juridico para abogados, plataforma
              legal en Colombia, gestion de expedientes, portal de clientes y facturacion para
              despachos.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border bg-card p-5">
                <Users className="h-5 w-5 text-primary" />
                <p className="mt-3 font-medium">Despachos juridicos</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Centraliza el trabajo del equipo y evita perder informacion entre correos y hojas
                  sueltas.
                </p>
              </div>
              <div className="rounded-2xl border bg-card p-5">
                <Scale className="h-5 w-5 text-primary" />
                <p className="mt-3 font-medium">Abogados independientes</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Lleva control de casos, cobros, documentos y agenda sin depender de herramientas
                  separadas.
                </p>
              </div>
              <div className="rounded-2xl border bg-card p-5">
                <MessageSquare className="h-5 w-5 text-primary" />
                <p className="mt-3 font-medium">Clientes con acceso privado</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Comparte avances, documentos y notificaciones en un portal seguro y restringido.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold tracking-tight">Preguntas frecuentes</h2>
          <div className="mt-8 grid gap-4">
            {faqs.map((faq) => (
              <Card key={faq.question}>
                <CardHeader>
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-primary">
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl font-bold text-primary-foreground md:text-4xl">
            Si buscas software juridico en Colombia, esta es tu puerta de entrada
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/80">
            TOCHI Legal Suite combina gestion de casos, clientes, documentos, facturacion y portal
            de clientes en una sola plataforma lista para Google y para tu despacho.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild variant="secondary" size="lg" className="rounded-full px-8">
              <Link href="/precios">Ver planes</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full border-white/20 px-8 text-primary-foreground hover:bg-white/10 hover:text-primary-foreground">
              <Link href="/login">Entrar al sistema</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
