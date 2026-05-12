export interface Plan {
  id: string
  name: string
  description: string
  priceInCents: number
  priceMonthly: string
  features: string[]
  popular?: boolean
  color: string
}

// Planes de suscripcion para TOCHI Legal Suite
// Precios en COP (Pesos Colombianos) - convertidos a centavos USD para Stripe
export const PLANS: Plan[] = [
  {
    id: 'plan-esencial',
    name: 'Plan Esencial',
    description: 'Ideal para abogados independientes que inician su practica digital',
    priceInCents: 4900, // $49 USD ~ $200,000 COP/mes
    priceMonthly: '$49',
    color: 'bg-slate-100',
    features: [
      'Hasta 50 casos activos',
      'Hasta 100 clientes',
      'Calendario de citas basico',
      'Consulta de Codigos Legales',
      'Buscador de articulos',
      '50 consultas IA/mes',
      '5 plantillas de documentos',
      'Notificaciones por email',
      'Soporte por email',
    ],
  },
  {
    id: 'plan-profesional',
    name: 'Plan Profesional',
    description: 'Para abogados establecidos que buscan optimizar su productividad',
    priceInCents: 9900, // $99 USD ~ $400,000 COP/mes
    priceMonthly: '$99',
    color: 'bg-primary/10',
    popular: true,
    features: [
      'Casos ilimitados',
      'Clientes ilimitados',
      'Calendario avanzado con recordatorios',
      'Todos los Codigos Legales + Jurisprudencia',
      'Busqueda semantica con IA',
      '500 consultas IA/mes',
      'Todas las plantillas de documentos',
      'Generacion de documentos con IA',
      'Notificaciones push + email + SMS',
      'Actualizaciones de leyes en tiempo real',
      'Exportar a PDF/Word',
      'Soporte prioritario',
    ],
  },
  {
    id: 'plan-firma',
    name: 'Plan Firma',
    description: 'Solucion completa para firmas de abogados y equipos legales',
    priceInCents: 19900, // $199 USD ~ $800,000 COP/mes
    priceMonthly: '$199',
    color: 'bg-accent/10',
    features: [
      'Todo lo del Plan Profesional',
      'Hasta 10 usuarios (abogados)',
      'Panel de administracion de firma',
      'Asignacion de casos por abogado',
      'Reportes y estadisticas avanzadas',
      'Consultas IA ilimitadas',
      'Portal de clientes personalizado',
      'Integracion con WhatsApp Business',
      'Facturacion electronica integrada',
      'API para integraciones',
      'Backup automatico de datos',
      'Soporte 24/7 con SLA',
      'Capacitacion personalizada',
    ],
  },
]

export function getPlanById(id: string): Plan | undefined {
  return PLANS.find((plan) => plan.id === id)
}
