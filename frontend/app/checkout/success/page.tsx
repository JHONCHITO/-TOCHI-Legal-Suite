import { Suspense } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CheckoutSuccessClient } from './checkout-success-client'

function CheckoutSuccessFallback() {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-sm text-muted-foreground">Cargando estado del pago...</p>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
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

      <main className="container mx-auto max-w-3xl px-4 py-16">
        <div className="space-y-6">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Pago</p>
            <h1 className="text-3xl font-bold">Confirmacion de suscripcion</h1>
            <p className="mt-2 text-muted-foreground">
              Estamos revisando el estado final de tu pago para activar la suscripcion en cuanto Wompi confirme la transaccion.
            </p>
          </div>

          <Suspense fallback={<CheckoutSuccessFallback />}>
            <CheckoutSuccessClient />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
