import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  ArrowRight,
  Briefcase,
  Brain,
  BookOpen,
  Calendar,
  CheckCircle2,
  CreditCard,
  FileText,
  Scale,
  Shield,
  Sparkles,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

async function checkSession() {
  try {
    // Solo intentar auth si MONGODB_URI esta configurada
    if (!process.env.MONGODB_URI) {
      return null
    }
    const { auth } = await import('@/lib/auth')
    return await auth()
  } catch {
    return null
  }
}

const features = [
  {
    title: 'Codigos legales colombianos',
    description:
      'Consulta civil, penal, laboral, comercio, CPACA y mas con una experiencia de lectura clara y rápida.',
    icon: BookOpen,
  },
  {
    title: 'Asistente IA legal',
    description:
      'Pregunta, resume o redacta con apoyo de inteligencia artificial enfocada en derecho colombiano.',
    icon: Brain,
  },
  {
    title: 'Gestion de casos',
    description:
      'Organiza expedientes, actuaciones, audiencias y documentos con una estructura pensada para despacho.',
    icon: FileText,
  },
  {
    title: 'Clientes y cartera',
    description:
      'Mantén CRM, facturacion, recaudo y seguimiento comercial en una misma vista operativa.',
    icon: CreditCard,
  },
  {
    title: 'Agenda y alertas',
    description:
      'Audiencias, recordatorios y vencimientos con una navegación rápida y sin ruido visual.',
    icon: Calendar,
  },
  {
    title: 'Seguridad y control',
    description:
      'Accesos por rol, protección de datos y trazabilidad para trabajo profesional y confiable.',
    icon: Shield,
  },
]

const highlights = [
  { label: 'Despachos', value: '1 lugar' },
  { label: 'Casos', value: 'Seguimiento' },
  { label: 'Facturacion', value: 'Controlada' },
  { label: 'Alertas', value: 'Automáticas' },
]

const workflow = [
  {
    title: '1. Abrir el panel',
    description: 'Entras y ves lo urgente: casos activos, agenda, cartera y alertas.',
  },
  {
    title: '2. Resolver tarea',
    description: 'Usas herramientas, documentos o IA sin salir del flujo principal.',
  },
  {
    title: '3. Cerrar y medir',
    description: 'Revisas reportes, cumplimiento y resultados para tomar mejores decisiones.',
  },
]

export default async function HomePage() {
  const session = await checkSession()

  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.12),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.10),_transparent_28%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-gradient-to-b from-primary/10 to-transparent" />

      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-primary to-accent shadow-lg shadow-primary/15">
              <Scale className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="leading-tight">
              <p className="text-lg font-bold tracking-tight">TOCHI Legal Suite</p>
              <p className="text-xs text-muted-foreground">Centro operativo para abogados</p>
            </div>
          </div>

          <nav className="hidden items-center gap-6 md:flex">
            <Link href="#caracteristicas" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Caracteristicas
            </Link>
            <Link href="#flujo" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Flujo
            </Link>
            <Link href="/precios" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Precios
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="rounded-full">
                Iniciar sesion
              </Button>
            </Link>
            <Link href="/precios">
              <Button className="rounded-full">
                Comenzar gratis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="container mx-auto px-4 py-16 lg:py-24">
          <div className="grid gap-10 xl:grid-cols-[1.05fr_.95fr] xl:items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm">
                <Sparkles className="h-4 w-4 text-accent" />
                Diseñado para despachos y equipos legales
              </div>

              <div className="space-y-5">
                <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-balance md:text-6xl">
                  Una plataforma legal mas limpia, mas rapida y mucho mas completa.
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-muted-foreground text-pretty">
                  TOCHI centraliza expedientes, clientes, agenda, documentos, facturacion y base
                  juridica en una experiencia visual pensada para abogados colombianos.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/precios">
                  <Button size="lg" className="rounded-full px-8">
                    Ver planes y empezar
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="rounded-full border-border/70 px-8">
                    Entrar al panel
                  </Button>
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {highlights.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-3xl border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur"
                  >
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{item.label}</p>
                    <p className="mt-2 text-lg font-semibold">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-8 top-12 h-24 w-24 rounded-full bg-accent/15 blur-3xl" />
              <div className="absolute -right-6 bottom-10 h-28 w-28 rounded-full bg-primary/15 blur-3xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card/90 p-5 shadow-[0_30px_100px_-40px_rgba(15,23,42,0.35)] backdrop-blur">
                <div className="flex items-start justify-between gap-4 border-b border-border/70 pb-5">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Panel visual
                    </p>
                    <p className="text-xl font-semibold">Centro operativo en tiempo real</p>
                  </div>
                  <div className="rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent">
                    En linea
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl border border-border/70 bg-background/80 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Casos</span>
                      <BriefcaseIcon />
                    </div>
                    <p className="mt-3 text-3xl font-bold">24</p>
                    <p className="mt-1 text-sm text-muted-foreground">Expedientes activos y en seguimiento.</p>
                  </div>
                  <div className="rounded-3xl border border-border/70 bg-background/80 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Agenda</span>
                      <Calendar className="h-4 w-4 text-accent" />
                    </div>
                    <p className="mt-3 text-3xl font-bold">8</p>
                    <p className="mt-1 text-sm text-muted-foreground">Compromisos proximos y recordatorios.</p>
                  </div>
                  <div className="rounded-3xl border border-border/70 bg-background/80 p-4 sm:col-span-2">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                          Flujo de trabajo
                        </p>
                        <p className="mt-1 text-lg font-semibold">Documentos, clientes y cartera conectados</p>
                      </div>
                      <CheckCircle2 className="h-5 w-5 text-accent" />
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl bg-primary/10 p-3">
                        <FileText className="h-4 w-4 text-primary" />
                        <p className="mt-2 text-sm font-medium">Documentos listos</p>
                      </div>
                      <div className="rounded-2xl bg-accent/10 p-3">
                        <Users className="h-4 w-4 text-accent" />
                        <p className="mt-2 text-sm font-medium">Clientes ordenados</p>
                      </div>
                      <div className="rounded-2xl bg-amber-500/10 p-3">
                        <CreditCard className="h-4 w-4 text-amber-600" />
                        <p className="mt-2 text-sm font-medium">Cartera visible</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="caracteristicas" className="container mx-auto px-4 pb-24">
          <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-accent">Caracteristicas</p>
              <h2 className="text-3xl font-bold tracking-tight">Todo lo que necesita un despacho moderno</h2>
            </div>
            <p className="max-w-2xl text-muted-foreground">
              No es solo una lista de herramientas. Es una experiencia unificada para que el trabajo
              juridico fluya mejor desde la primera pantalla.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="group rounded-[1.75rem] border border-border/70 bg-card/85 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_24px_70px_-35px_rgba(15,23,42,0.22)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="rounded-2xl bg-primary/10 p-3">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="mt-5 text-xl font-semibold tracking-tight">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </section>

        <section id="flujo" className="container mx-auto px-4 pb-24">
          <div className="grid gap-6 xl:grid-cols-3">
            {workflow.map((step) => (
              <div
                key={step.title}
                className="rounded-[1.75rem] border border-border/70 bg-card/85 p-6 shadow-sm"
              >
                <p className="text-sm font-semibold text-accent">{step.title}</p>
                <p className="mt-3 text-base leading-7 text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-border/70 bg-gradient-to-r from-primary/90 via-primary to-accent/90 py-20 text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Lleva tu despacho a una experiencia mas clara y profesional.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/80">
              Empieza con la version gratuita y ve como TOCHI organiza tu operacion legal con un
              diseño que se siente serio, moderno y completo.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/precios">
                <Button size="lg" variant="secondary" className="rounded-full px-8">
                  Ver precios
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/register">
                <Button size="lg" variant="outline" className="rounded-full border-white/20 bg-white/10 px-8 text-primary-foreground hover:bg-white/20">
                  Crear cuenta
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <footer className="border-t border-border/70 bg-card/80 py-12">
          <div className="container mx-auto flex flex-col gap-6 px-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent">
                <Scale className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <p className="font-semibold">TOCHI Legal Suite</p>
                <p className="text-sm text-muted-foreground">Plataforma pensada para abogados colombianos</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
              <Link href="/precios" className="transition-colors hover:text-foreground">
                Precios
              </Link>
              <Link href="/login" className="transition-colors hover:text-foreground">
                Iniciar sesion
              </Link>
              <Link href="/register" className="transition-colors hover:text-foreground">
                Registrarse
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}

function BriefcaseIcon() {
  return <Briefcase className="h-4 w-4 text-primary" />
}
