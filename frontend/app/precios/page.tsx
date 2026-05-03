import Link from 'next/link'
import { PLANS } from '@/lib/products'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Scale, Shield, Sparkles } from 'lucide-react'

export const metadata = {
  title: 'Precios - TOCHI Legal Suite',
  description: 'Planes de suscripcion para abogados colombianos',
}

export default function PreciosPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Scale className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">TOCHI Legal Suite</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Iniciar Sesion</Button>
            </Link>
            <Link href="/register">
              <Button>Registrarse</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">
            Planes diseñados para abogados colombianos
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            Elige el plan que mejor se adapte a tu practica legal. 
            Todos incluyen acceso a los Codigos Legales de Colombia actualizados.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {PLANS.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative flex flex-col ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-sm font-medium px-4 py-1 rounded-full flex items-center gap-1">
                    <Sparkles className="w-4 h-4" />
                    Mas Popular
                  </span>
                </div>
              )}
              
              <CardHeader className={`${plan.color} rounded-t-lg`}>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription className="text-foreground/70">
                  {plan.description}
                </CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">{plan.priceMonthly}</span>
                  <span className="text-muted-foreground">/mes</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Incluye prueba gratuita de {plan.trialBusinessDays} dias habiles.
                </p>
              </CardHeader>

              <CardContent className="flex-1 pt-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground/80">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="pt-6">
                <Link href={`/checkout/${plan.id}`} className="w-full">
                  <Button 
                    className="w-full" 
                    variant={plan.popular ? 'default' : 'outline'}
                    size="lg"
                  >
                    Comenzar ahora
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold">Pago Seguro</h3>
              <p className="text-sm text-muted-foreground">
                Procesado por Stripe con encriptacion de nivel bancario
              </p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Scale className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold">Leyes Actualizadas</h3>
              <p className="text-sm text-muted-foreground">
                Codigos colombianos sincronizados con fuentes oficiales
              </p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold">IA Especializada</h3>
              <p className="text-sm text-muted-foreground">
                Asistente legal entrenado en derecho colombiano
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Preguntas Frecuentes</h2>
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="border rounded-lg p-6">
            <h3 className="font-semibold mb-2">¿Puedo cambiar de plan despues?</h3>
            <p className="text-muted-foreground">
              Si, puedes actualizar o cambiar tu plan en cualquier momento desde tu panel de configuracion.
            </p>
          </div>
          <div className="border rounded-lg p-6">
            <h3 className="font-semibold mb-2">¿Ofrecen periodo de prueba?</h3>
            <p className="text-muted-foreground">
              Ofrecemos 7 dias habiles de prueba gratuita en todos los planes. No se requiere tarjeta de credito para comenzar.
            </p>
          </div>
          <div className="border rounded-lg p-6">
            <h3 className="font-semibold mb-2">¿Como se actualizan los codigos legales?</h3>
            <p className="text-muted-foreground">
              Nuestro sistema sincroniza automaticamente con SUIN-Juriscol y la Secretaria del Senado cada semana, 
              notificandote cuando hay cambios relevantes para tu practica.
            </p>
          </div>
          <div className="border rounded-lg p-6">
            <h3 className="font-semibold mb-2">¿Mis datos estan seguros?</h3>
            <p className="text-muted-foreground">
              Utilizamos encriptacion de nivel bancario y cumplimos con las normativas de proteccion de datos. 
              Tu informacion y la de tus clientes esta completamente protegida.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-card">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2024 TOCHI Legal Suite. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
