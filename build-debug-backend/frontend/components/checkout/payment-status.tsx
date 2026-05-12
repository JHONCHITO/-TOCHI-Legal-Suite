'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'

type StatusResponse = {
  reference: string
  planId?: string
  subscriptionStatus?: string
  paymentStatus?: string
  paymentMethodPreference?: string | null
  paymentTransactionId?: string | null
  isActive?: boolean
  notes?: string | null
}

interface PaymentStatusProps {
  reference: string
  planId?: string
}

export function PaymentStatus({ reference, planId }: PaymentStatusProps) {
  const router = useRouter()
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!reference) {
      setLoading(false)
      setError('No pudimos identificar la referencia del pago.')
      return
    }

    let cancelled = false

    const fetchStatus = async () => {
      try {
        const response = await fetch(`/api/payments/wompi/status?reference=${encodeURIComponent(reference)}`, {
          cache: 'no-store',
        })

        if (!response.ok) {
          throw new Error('No pudimos consultar el estado del pago')
        }

        const data = (await response.json()) as StatusResponse
        if (!cancelled) {
          setStatus(data)
          setError(null)
          setLoading(false)
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError(fetchError instanceof Error ? fetchError.message : 'Error consultando el pago')
          setLoading(false)
        }
      }
    }

    fetchStatus()
    const interval = window.setInterval(fetchStatus, 4000)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [reference])

  const isApproved = useMemo(() => {
    return status?.isActive || status?.paymentStatus === 'approved' || status?.subscriptionStatus === 'active'
  }, [status])

  useEffect(() => {
    if (!isApproved) {
      return
    }

    const timeout = window.setTimeout(() => {
      router.push('/dashboard')
    }, 1800)

    return () => window.clearTimeout(timeout)
  }, [isApproved, router])

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Verificando tu pago...</p>
  }

  if (isApproved) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-900">
          <p className="font-semibold">Pago aprobado</p>
          <p className="text-sm">Tu suscripcion ya quedo activa y puedes entrar al panel.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard">
            <Button>Ir al panel</Button>
          </Link>
          <Link href={planId ? `/checkout/${planId}` : '/precios'}>
            <Button variant="outline">Ver planes</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (status?.paymentStatus === 'declined' || status?.paymentStatus === 'error') {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-900">
          <p className="font-semibold">El pago no pudo completarse</p>
          <p className="text-sm">Puedes volver a intentar con tarjeta o Nequi.</p>
        </div>
        <Link href={planId ? `/checkout/${planId}` : '/precios'}>
          <Button>Intentar de nuevo</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card p-4">
        <p className="font-semibold">Estamos validando tu pago</p>
        <p className="text-sm text-muted-foreground">
          Wompi puede tardar unos segundos en confirmar la transaccion. No cierres esta ventana todavia.
        </p>
      </div>
      <Link href={planId ? `/checkout/${planId}` : '/precios'}>
        <Button variant="outline">Volver a intentar</Button>
      </Link>
    </div>
  )
}
