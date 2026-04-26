'use server'

import { getStripe } from '@/lib/stripe'
import { getPlanById } from '@/lib/products'
import { headers } from 'next/headers'

export async function createCheckoutSession(planId: string) {
  const plan = getPlanById(planId)

  if (!plan) {
    throw new Error('Plan no encontrado')
  }

  const headersList = await headers()
  const origin = headersList.get('origin') || 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    ui_mode: 'embedded' as never,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `TOCHI Legal Suite - ${plan.name}`,
            description: plan.description,
          },
          unit_amount: plan.priceInCents,
          recurring: {
            interval: 'month',
          },
        },
        quantity: 1,
      },
    ],
    mode: 'subscription',
    return_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    metadata: {
      planId: plan.id,
    },
  })

  return { clientSecret: session.client_secret }
}

export async function getCheckoutSession(sessionId: string) {
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['subscription', 'customer'],
  })

  return {
    status: session.status,
    customerEmail: session.customer_details?.email,
    planId: session.metadata?.planId,
  }
}
