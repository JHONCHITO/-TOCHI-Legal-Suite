import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Scale, BookOpen, Calendar, Users, Brain, FileText, Bell, Shield, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Aplicacion legal para abogados en Colombia | TOCHI Legal Suite',
  description:
    'TOCHI Legal Suite es una aplicacion legal para abogados y despachos en Colombia. Gestiona casos, clientes, documentos, facturacion, agenda, notificaciones y portal de clientes en una sola plataforma.',
}

async function checkSession() {
  try {
    // Solo intentar auth si MONGODB_URI está configurada
    if (!process.env.MONGODB_URI) {
      return null
    }
    const { auth } = await import('@/lib/auth')
    return await auth()
  } catch {
    return null
  }
}

export default async function HomePage() {
  const session = await checkSession()

  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Scale className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">TOCHI Legal Suite</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/software-juridico" className="text-muted-foreground hover:text-foreground transition-colors">
              Aplicacion legal
            </Link>
            <Link href="#caracteristicas" className="text-muted-foreground hover:text-foreground transition-colors">
              Caracteristicas
            </Link>
            <Link href="/precios" className="text-muted-foreground hover:text-foreground transition-colors">
              Precios
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Iniciar Sesion</Button>
            </Link>
            <Link href="/precios">
              <Button>Comenzar Gratis</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Shield className="w-4 h-4" />
            Aplicacion legal para abogados, despachos y consultorios en Colombia
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 text-balance max-w-4xl mx-auto">
            Aplicacion legal para abogados en Colombia
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8 text-pretty">
            Gestiona casos, clientes, citas, documentos, facturacion y portal de clientes. Consulta
            codigos legales colombianos actualizados y usa IA especializada en derecho colombiano.
            Pensado para despachos, consultorios juridicos y abogados independientes que buscan una
            aplicacion legal facil de usar y lista para trabajar.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/precios">
              <Button size="lg" className="text-lg px-8">
                Comenzar prueba gratuita
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Ya tengo cuenta
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            14 dias gratis. Sin tarjeta de credito.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="caracteristicas" className="py-20 container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Gestion legal completa para abogados colombianos
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Herramientas disenadas especificamente para la practica legal en Colombia
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="border rounded-xl p-6 bg-card hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Codigos Legales Colombianos</h3>
            <p className="text-muted-foreground">
              Acceso completo a todos los codigos: Civil, Penal, CGP, Laboral, Comercio, Constitucion y mas. 
              Actualizados automaticamente desde fuentes oficiales.
            </p>
          </div>

          <div className="border rounded-xl p-6 bg-card hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
              <Brain className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Asistente IA Legal</h3>
            <p className="text-muted-foreground">
              Consulta articulos, genera documentos y obtiene respuestas fundamentadas en la legislacion 
              colombiana con inteligencia artificial.
            </p>
          </div>

          <div className="border rounded-xl p-6 bg-card hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Gestion de Casos</h3>
            <p className="text-muted-foreground">
              Organiza todos tus casos por area del derecho, estado y cliente. 
              Rastrea fechas importantes y documentos asociados.
            </p>
          </div>

          <div className="border rounded-xl p-6 bg-card hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Gestion de Clientes</h3>
            <p className="text-muted-foreground">
              Mantene toda la informacion de tus clientes organizada: contacto, casos, 
              historial de citas y documentos.
            </p>
          </div>

          <div className="border rounded-xl p-6 bg-card hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Calendario y Citas</h3>
            <p className="text-muted-foreground">
              Agenda citas, audiencias y compromisos. Recibe recordatorios automaticos 
              para nunca olvidar una fecha importante.
            </p>
          </div>

          <div className="border rounded-xl p-6 bg-card hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
              <Bell className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Notificaciones Inteligentes</h3>
            <p className="text-muted-foreground">
              Alertas de vencimientos, actualizaciones de leyes relevantes para tus casos 
              y recordatorios de citas.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Comienza tu prueba gratuita hoy
          </h2>
          <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-8">
            Unete a cientos de abogados colombianos que ya optimizan su practica con TOCHI Legal Suite
          </p>
          <Link href="/precios">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Ver planes y precios
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-card">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
                <Scale className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold">TOCHI Legal Suite</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/precios" className="hover:text-foreground transition-colors">
                Precios
              </Link>
              <Link href="/login" className="hover:text-foreground transition-colors">
                Iniciar Sesion
              </Link>
              <Link href="/register" className="hover:text-foreground transition-colors">
                Registrarse
              </Link>
            </div>
          </div>
          <div className="text-center text-sm text-muted-foreground mt-8 pt-8 border-t">
            <p>&copy; 2024 TOCHI Legal Suite. Todos los derechos reservados.</p>
            <p className="mt-1">Plataforma diseñada para abogados colombianos</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
