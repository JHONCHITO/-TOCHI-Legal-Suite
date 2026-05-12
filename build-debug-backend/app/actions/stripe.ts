'use server'

import { auth } from '@/lib/auth'
import { addBusinessDays, setCheckoutSubscriptionPlan } from '@/lib/subscription'
import { getStripe } from '@/lib/stripe'
import { getPlanById } from '@/lib/products'
import { headers } from 'next/headers'

export async function createCheckoutSession(planId: string) {
  const stripe = getStripe(); // ✅ IMPORTANTE

  const plan = getPlanById(planId)

  if (!plan) {
    throw new Error('Plan no encontrado')
  }

  const sessionUser = await auth()
  if (sessionUser?.user?.id) {
    await setCheckoutSubscriptionPlan(sessionUser.user.id, plan.id)
  }

  const headersList = await headers()
  const origin = headersList.get('origin') || 'http://localhost:3000'
  const trialEnd = addBusinessDays(new Date(), plan.trialBusinessDays)

  const session = await stripe.checkout.sessions.create({
    ui_mode: 'embedded' as never,
    line_items: [
      {
        price_data: {
          currency: plan.currency,
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
    subscription_data: {
      trial_end: Math.floor(trialEnd.getTime() / 1000),
    },
    return_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    metadata: {
      planId: plan.id,
    },
  })

  return { clientSecret: session.client_secret }
}

export async function getCheckoutSession(sessionId: string) {
  const stripe = getStripe(); // 🔥 ESTE ES EL FIX

  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['subscription', 'customer'],
  })

  return {
    status: session.status,
    customerEmail: session.customer_details?.email,
    planId: session.metadata?.planId,
  }
}
