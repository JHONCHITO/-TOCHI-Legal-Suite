// Formatear moneda colombiana
export function formatCurrencyCop(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value)
}

// Formatear fecha
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date))
}

// Formatear fecha corta
export function formatDateShort(date: string | Date): string {
  return new Intl.DateTimeFormat("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date))
}

// Formatear hora
export function formatTime(date: string | Date): string {
  return new Intl.DateTimeFormat("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date))
}

// Formatear fecha y hora
export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date))
}

// Obtener nombre de cliente
export function getClientDisplayName(client: {
  tipo: string
  nombre?: string
  apellido?: string
  razonSocial?: string
}): string {
  if (client.tipo === "persona_juridica") {
    return client.razonSocial || "Empresa"
  }
  return [client.nombre, client.apellido].filter(Boolean).join(" ") || "Cliente"
}

// Obtener iniciales
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((chunk) => chunk[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

// Labels para tipos de caso
export const caseTypeLabels: Record<string, string> = {
  civil: "Civil",
  penal: "Penal",
  laboral: "Laboral",
  familia: "Familia",
  comercial: "Comercial",
  administrativo: "Administrativo",
  constitucional: "Constitucional",
  tributario: "Tributario",
  otro: "Otro",
}

// Labels para estados de caso
export const caseStatusLabels: Record<string, string> = {
  consulta: "Consulta",
  activo: "Activo",
  en_tramite: "En tramite",
  audiencia_pendiente: "Audiencia pendiente",
  sentencia: "Sentencia",
  apelacion: "Apelacion",
  cerrado: "Cerrado",
  archivado: "Archivado",
}

// Colores para estados de caso
export const caseStatusColors: Record<string, string> = {
  consulta: "bg-muted text-muted-foreground",
  activo: "bg-accent/20 text-accent",
  en_tramite: "bg-primary/20 text-primary",
  audiencia_pendiente: "bg-amber-100 text-amber-800",
  sentencia: "bg-emerald-100 text-emerald-800",
  apelacion: "bg-orange-100 text-orange-800",
  cerrado: "bg-muted text-muted-foreground",
  archivado: "bg-muted text-muted-foreground",
}

// Labels para tipos de cita
export const appointmentTypeLabels: Record<string, string> = {
  consulta: "Consulta",
  audiencia: "Audiencia",
  reunion: "Reunion",
  diligencia: "Diligencia",
  conciliacion: "Conciliacion",
  visita: "Visita",
  otro: "Otro",
}

// Colores para tipos de cita
export const appointmentTypeColors: Record<string, string> = {
  audiencia: "bg-destructive/20 text-destructive",
  reunion: "bg-primary/20 text-primary",
  consulta: "bg-chart-3/20 text-chart-3",
  seguimiento: "bg-accent/20 text-accent",
  conciliacion: "bg-amber-100 text-amber-800",
  diligencia: "bg-blue-100 text-blue-800",
  visita: "bg-purple-100 text-purple-800",
  otro: "bg-muted text-muted-foreground",
}

// Labels para estados de factura
export const invoiceStatusLabels: Record<string, string> = {
  borrador: "Borrador",
  pendiente: "Pendiente",
  pagada: "Pagada",
  vencida: "Vencida",
  cancelada: "Cancelada",
}

// Colores para estados de factura
export const invoiceStatusColors: Record<string, string> = {
  borrador: "bg-muted text-muted-foreground",
  pendiente: "bg-amber-100 text-amber-800",
  pagada: "bg-emerald-100 text-emerald-800",
  vencida: "bg-destructive/20 text-destructive",
  cancelada: "bg-muted text-muted-foreground",
}

// Labels para tipos de documento
export const documentTypeLabels: Record<string, string> = {
  demanda: "Demanda",
  contestacion: "Contestacion",
  tutela: "Tutela",
  derecho_peticion: "Derecho de Peticion",
  contrato: "Contrato",
  poder: "Poder",
  memorial: "Memorial",
  recurso: "Recurso",
  concepto: "Concepto",
  acta: "Acta",
  otro: "Otro",
}
