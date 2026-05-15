'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { PaymentStatus } from '@/components/checkout/payment-status'

export function CheckoutSuccessClient() {
  const searchParams = useSearchParams()
  const reference = searchParams.get('reference') || ''
  const planId = searchParams.get('planId') || ''

  return <PaymentStatus reference={reference} planId={planId} />
}
