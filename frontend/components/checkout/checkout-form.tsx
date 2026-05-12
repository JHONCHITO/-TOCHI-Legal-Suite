'use client'

import Script from 'next/script'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { createWompiCheckoutSession } from '@/app/actions/wompi'
import { getWompiCheckoutUrl } from '@/lib/wompi'
import type { PaymentMethodPreference } from '@/lib/models/Subscription'

type WompiCheckoutInstance = {
  open: (callback: (result: any) => void) => void
}

type WompiWidgetConstructor = new (config: Record<string, unknown>) => WompiCheckoutInstance

declare global {
  interface Window {
    WidgetCheckout?: WompiWidgetConstructor
  }
}

interface CheckoutFormProps {
  planId: string
}

export function CheckoutForm({ planId }: CheckoutFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loadingMethod, setLoadingMethod] = useState<PaymentMethodPreference | null>(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)

  async function openCheckout(paymentMethodPreference: PaymentMethodPreference) {
    setError(null)
    setLoadingMethod(paymentMethodPreference)

    try {
      const config = await createWompiCheckoutSession(planId, paymentMethodPreference)
      const WidgetCheckout = window.WidgetCheckout

      if (!WidgetCheckout) {
        throw new Error('No se pudo cargar el checkout seguro de Wompi')
      }

      const checkout = new WidgetCheckout({
        currency: config.currency,
        amountInCents: config.amountInCents,
        reference: config.reference,
        publicKey: config.publicKey,
        redirectUrl: config.redirectUrl,
        customerData: config.customerData,
      })

      checkout.open((result: { transaction?: { id?: string; status?: string } } | undefined) => {
        const transactionId = result?.transaction?.id
        const reference = config.reference
        const query = new URLSearchParams({
          reference,
          planId,
          method: paymentMethodPreference,
        })

        if (transactionId) {
          query.set('transactionId', transactionId)
        }

        router.push(`/checkout/success?${query.toString()}`)
      })
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : 'Error al procesar el pago')
    } finally {
      setLoadingMethod(null)
    }
  }

  return (
    <div className="p-6 space-y-5">
      <Script src={getWompiCheckoutUrl()} strategy="afterInteractive" onLoad={() => setScriptLoaded(true)} />

      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">Elige tu medio de pago</h3>
        <p className="text-sm text-muted-foreground">
          El checkout seguro de Wompi te permite completar el pago con tarjeta o con Nequi.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          type="button"
          size="lg"
          className="w-full"
          onClick={() => openCheckout('card')}
          disabled={Boolean(loadingMethod) || !scriptLoaded}
        >
          {loadingMethod === 'card' ? 'Abriendo checkout...' : 'Pagar con tarjeta'}
        </Button>

        <Button
          type="button"
          size="lg"
          variant="secondary"
          className="w-full"
          onClick={() => openCheckout('nequi')}
          disabled={Boolean(loadingMethod) || !scriptLoaded}
        >
          {loadingMethod === 'nequi' ? 'Abriendo checkout...' : 'Pagar con Nequi'}
        </Button>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {!scriptLoaded ? (
        <p className="text-xs text-muted-foreground">
          Cargando la pasarela segura...
        </p>
      ) : null}
    </div>
  )
}

