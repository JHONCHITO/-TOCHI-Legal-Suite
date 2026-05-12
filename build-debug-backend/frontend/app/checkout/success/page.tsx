'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { PaymentStatus } from '@/components/checkout/payment-status'

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const reference = searchParams.get('reference') || ''
  const planId = searchParams.get('planId') || ''

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="font-bold text-foreground">
            TOCHI Legal Suite
          </Link>
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              Ir al panel
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16 max-w-3xl">
        <div className="space-y-6">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Pago</p>
            <h1 className="text-3xl font-bold">Confirmacion de suscripcion</h1>
            <p className="text-muted-foreground mt-2">
              Estamos revisando el estado final de tu pago para activar la suscripcion en cuanto Wompi confirme la transaccion.
            </p>
          </div>

          <PaymentStatus reference={reference} planId={planId} />
        </div>
      </main>
    </div>
  )
}

