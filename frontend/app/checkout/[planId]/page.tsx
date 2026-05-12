import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPlanById } from '@/lib/products'
import { CheckoutForm } from '@/components/checkout/checkout-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Check, Scale } from 'lucide-react'

interface CheckoutPageProps {
  params: Promise<{ planId: string }>
}

export async function generateMetadata({ params }: CheckoutPageProps) {
  const { planId } = await params
  const plan = getPlanById(planId)
  
  if (!plan) {
    return { title: 'Plan no encontrado' }
  }

  return {
    title: `Checkout - ${plan.name} | TOCHI Legal Suite`,
    description: `Suscribete al ${plan.name} de TOCHI Legal Suite`,
  }
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { planId } = await params
  const plan = getPlanById(planId)

  if (!plan) {
    notFound()
  }

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
          <Link href="/precios">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a planes
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12">
          {/* Plan Summary */}
          <div className="order-2 lg:order-1">
            <div className="sticky top-8">
              <h2 className="text-2xl font-bold mb-6">Resumen de tu suscripcion</h2>
              
              <div className="border rounded-xl p-6 bg-card">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">{plan.name}</h3>
                    <p className="text-muted-foreground text-sm">{plan.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{plan.priceMonthly}</p>
                    <p className="text-sm text-muted-foreground">/mes</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                  <div className="rounded-lg bg-muted/60 p-3">
                    <p className="text-muted-foreground">Casos activos</p>
                    <p className="font-semibold">{plan.limits.cases}</p>
                  </div>
                  <div className="rounded-lg bg-muted/60 p-3">
                    <p className="text-muted-foreground">Clientes activos</p>
                    <p className="font-semibold">{plan.limits.clients}</p>
                  </div>
                  <div className="rounded-lg bg-muted/60 p-3">
                    <p className="text-muted-foreground">Consultas IA</p>
                    <p className="font-semibold">{plan.limits.aiQueries}/mes</p>
                  </div>
                  <div className="rounded-lg bg-muted/60 p-3">
                    <p className="text-muted-foreground">Usuarios</p>
                    <p className="font-semibold">{plan.limits.users}</p>
                  </div>
                </div>

                <hr className="my-4" />

                <h4 className="font-medium mb-3">Incluye:</h4>
                <ul className="space-y-2">
                  {plan.features.slice(0, 6).map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                  {plan.features.length > 6 && (
                    <li className="text-sm text-muted-foreground pl-6">
                      + {plan.features.length - 6} beneficios mas...
                    </li>
                  )}
                </ul>

                <hr className="my-4" />

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Facturacion mensual</span>
                  <span className="font-medium">{plan.priceMonthly}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-semibold">Total hoy</span>
                  <span className="text-xl font-bold text-primary">{plan.priceMonthly}</span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground text-center">
                  Tu suscripcion incluye {plan.trialBusinessDays} dias habiles de prueba gratuita. 
                  Puedes cancelar en cualquier momento.
                </p>
              </div>
            </div>
          </div>

          {/* Checkout Form */}
          <div className="order-1 lg:order-2">
            <h2 className="text-2xl font-bold mb-6">Informacion de pago</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Puedes continuar con tarjeta o con Nequi. El checkout seguro de Wompi se encarga de procesar y confirmar la transaccion.
            </p>
            <div className="border rounded-xl overflow-hidden bg-card">
              <CheckoutForm planId={planId} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
