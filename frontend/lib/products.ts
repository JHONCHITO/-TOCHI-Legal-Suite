export interface Plan {
  id: string
  name: string
  description: string
  priceInCents: number
  priceMonthly: string
  currency: string
  trialBusinessDays: number
  limits: PlanLimits
  features: string[]
  popular?: boolean
  color: string
}

export interface PlanLimits {
  cases: number
  clients: number
  appointments: number
  documents: number
  invoices: number
  communications: number
  aiQueries: number
  users: number
}

export const TRIAL_BUSINESS_DAYS = 7

// Planes de suscripcion para TOCHI Legal Suite
// Precios en COP en unidades menores para el checkout de pagos
export const PLANS: Plan[] = [
  {
    id: 'plan-esencial',
    name: 'Plan Esencial',
    description: 'Ideal para abogados independientes que inician su practica digital',
    priceInCents: 3000000,
    priceMonthly: 'COP $30.000',
    currency: 'cop',
    trialBusinessDays: TRIAL_BUSINESS_DAYS,
    color: 'bg-slate-100',
    features: [
      'Hasta 10 casos activos',
      'Hasta 25 clientes activos',
      'Hasta 15 citas activas',
      'Hasta 20 documentos',
      '25 consultas IA/mes',
      'Consulta de codigos legales y jurisprudencia',
      'Buscador de articulos y fuentes oficiales',
      'Prueba gratuita de 7 dias habiles',
      'Notificaciones por email',
    ],
    limits: {
      cases: 10,
      clients: 25,
      appointments: 15,
      documents: 20,
      invoices: 15,
      communications: 50,
      aiQueries: 25,
      users: 1,
    },
  },
  {
    id: 'plan-profesional',
    name: 'Plan Profesional',
    description: 'Para abogados establecidos que buscan optimizar su productividad',
    priceInCents: 5000000,
    priceMonthly: 'COP $50.000',
    currency: 'cop',
    trialBusinessDays: TRIAL_BUSINESS_DAYS,
    color: 'bg-primary/10',
    popular: true,
    features: [
      'Hasta 50 casos activos',
      'Hasta 150 clientes activos',
      'Hasta 60 citas activas',
      'Hasta 100 documentos',
      '150 consultas IA/mes',
      'Busqueda semantica con IA',
      'Generacion de documentos con IA',
      'Actualizaciones de leyes y jurisprudencia',
      'Exportar a PDF/Word',
      'Prueba gratuita de 7 dias habiles',
    ],
    limits: {
      cases: 50,
      clients: 150,
      appointments: 60,
      documents: 100,
      invoices: 60,
      communications: 250,
      aiQueries: 150,
      users: 3,
    },
  },
  {
    id: 'plan-firma',
    name: 'Plan Firma',
    description: 'Solucion completa para firmas de abogados y equipos legales',
    priceInCents: 7000000,
    priceMonthly: 'COP $70.000',
    currency: 'cop',
    trialBusinessDays: TRIAL_BUSINESS_DAYS,
    color: 'bg-accent/10',
    features: [
      'Todo lo del Plan Profesional',
      'Hasta 10 usuarios (abogados)',
      'Panel de administracion de firma',
      'Asignacion de casos por abogado',
      'Reportes y estadisticas avanzadas',
      '500 consultas IA/mes',
      'Portal de clientes personalizado',
      'Integracion con WhatsApp Business',
      'Facturacion electronica integrada',
      'API para integraciones',
      'Backup automatico de datos',
      'Soporte 24/7 con SLA',
      'Capacitacion personalizada',
      'Prueba gratuita de 7 dias habiles',
    ],
    limits: {
      cases: 150,
      clients: 500,
      appointments: 250,
      documents: 500,
      invoices: 250,
      communications: 1000,
      aiQueries: 500,
      users: 10,
    },
  },
]

export function getPlanById(id: string): Plan | undefined {
  return PLANS.find((plan) => plan.id === id)
}
