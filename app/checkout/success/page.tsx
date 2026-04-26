import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCheckoutSession } from '@/app/actions/stripe'
import { getPlanById } from '@/lib/products'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Scale, ArrowRight } from 'lucide-react'

// 🔥 IMPORTANTE: evitar ejecución en build
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Pago Exitoso - TOCHI Legal Suite',
  description: 'Tu suscripcion ha sido activada exitosamente',
}

interface SuccessPageProps {
  searchParams: { session_id?: string } // ✅ FIX
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const session_id = searchParams?.session_id

  // 🔒 validación básica
  if (!session_id) {
    redirect('/precios')
  }

  let session = null

  // 🔥 PROTECCIÓN STRIPE (CLAVE)
  try {
    session = await getCheckoutSession(session_id)
  } catch (error) {
    console.error('Error Stripe:', error)
    redirect('/precios')
  }

  if (!session || session.status !== 'complete') {
    redirect('/precios')
  }

  const plan = session.planId ? getPlanById(session.planId) : null

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mb-4">
            <CheckCircle className="w-10 h-10 text-accent" />
          </div>
          <CardTitle className="text-2xl">¡Pago Exitoso!</CardTitle>
          <CardDescription>
            Tu suscripcion ha sido activada correctamente
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            {plan && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Plan</span>
                <span className="font-medium">{plan.name}</span>
              </div>
            )}

            {session.customerEmail && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{session.customerEmail}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Estado</span>
              <span className="text-accent font-medium">Activo</span>
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>
              Hemos enviado un correo de confirmacion a{' '}
              <span className="font-medium text-foreground">
                {session.customerEmail || 'tu correo'}
              </span>
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Link href="/dashboard">
              <Button className="w-full" size="lg">
                Ir al Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>

            <Link href="/precios">
              <Button variant="outline" className="w-full">
                Ver otros planes
              </Button>
            </Link>
          </div>

          <div className="text-center pt-4 border-t">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                <Scale className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-medium">TOCHI Legal Suite</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}