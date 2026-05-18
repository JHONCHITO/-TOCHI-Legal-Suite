import useSWR from "swr"

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const contentType = res.headers.get("content-type") || ""
    if (contentType.includes("application/json")) {
      try {
        const error = await res.json()
        throw new Error(error.error || `Error al obtener datos (${res.status})`)
      } catch {
        // Fallback to plain text below.
      }
    }

    const text = (await res.text()).trim()
    throw new Error(text || `Error al obtener datos (${res.status})`)
  }
  return res.json()
}

// Dashboard
export function useDashboard() {
  const { data, error, isLoading, mutate } = useSWR("/api/dashboard", fetcher)
  return {
    data,
    isLoading,
    isError: error,
    mutate,
  }
}

// Casos
export function useCases(filters?: { estado?: string; tipo?: string; search?: string }) {
  const params = new URLSearchParams()
  if (filters?.estado) params.set("estado", filters.estado)
  if (filters?.tipo) params.set("tipo", filters.tipo)
  if (filters?.search) params.set("search", filters.search)
  
  const url = `/api/cases${params.toString() ? `?${params.toString()}` : ""}`
  const { data, error, isLoading, mutate } = useSWR(url, fetcher)
  
  return {
    cases: data || [],
    isLoading,
    isError: error,
    mutate,
  }
}

export function useCase(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/cases/${id}` : null,
    fetcher
  )
  return {
    case: data,
    isLoading,
    isError: error,
    mutate,
  }
}

// Clientes
export function useClients(filters?: { search?: string; tipo?: string; activo?: string }) {
  const params = new URLSearchParams()
  if (filters?.search) params.set("search", filters.search)
  if (filters?.tipo) params.set("tipo", filters.tipo)
  if (filters?.activo) params.set("activo", filters.activo)
  
  const url = `/api/clients${params.toString() ? `?${params.toString()}` : ""}`
  const { data, error, isLoading, mutate } = useSWR(url, fetcher)
  
  return {
    clients: data || [],
    isLoading,
    isError: error,
    mutate,
  }
}

export function useClient(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/clients/${id}` : null,
    fetcher
  )
  return {
    client: data,
    isLoading,
    isError: error,
    mutate,
  }
}

// Citas
export function useAppointments(filters?: { fecha?: string; tipo?: string; estado?: string }) {
  const params = new URLSearchParams()
  if (filters?.fecha) params.set("fecha", filters.fecha)
  if (filters?.tipo) params.set("tipo", filters.tipo)
  if (filters?.estado) params.set("estado", filters.estado)
  
  const url = `/api/appointments${params.toString() ? `?${params.toString()}` : ""}`
  const { data, error, isLoading, mutate } = useSWR(url, fetcher)
  
  return {
    appointments: data || [],
    isLoading,
    isError: error,
    mutate,
  }
}

// Documentos
export function useDocuments(filters?: { casoId?: string; clienteId?: string; tipo?: string; estado?: string }) {
  const params = new URLSearchParams()
  if (filters?.casoId) params.set("casoId", filters.casoId)
  if (filters?.clienteId) params.set("clienteId", filters.clienteId)
  if (filters?.tipo) params.set("tipo", filters.tipo)
  if (filters?.estado) params.set("estado", filters.estado)
  
  const url = `/api/documents${params.toString() ? `?${params.toString()}` : ""}`
  const { data, error, isLoading, mutate } = useSWR(url, fetcher)
  
  return {
    documents: data || [],
    isLoading,
    isError: error,
    mutate,
  }
}

// Facturas
export function useInvoices(filters?: { clienteId?: string; casoId?: string; estado?: string }) {
  const params = new URLSearchParams()
  if (filters?.clienteId) params.set("clienteId", filters.clienteId)
  if (filters?.casoId) params.set("casoId", filters.casoId)
  if (filters?.estado) params.set("estado", filters.estado)
  
  const url = `/api/invoices${params.toString() ? `?${params.toString()}` : ""}`
  const { data, error, isLoading, mutate } = useSWR(url, fetcher)
  
  return {
    invoices: data || [],
    isLoading,
    isError: error,
    mutate,
  }
}

// Notificaciones
export function useNotifications() {
  const { data, error, isLoading, mutate } = useSWR("/api/notifications", fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    refreshWhenHidden: false,
  })
  return {
    notifications: data?.notifications || [],
    unreadCount: data?.unreadCount || 0,
    isLoading,
    isError: error,
    mutate,
  }
}

// Comunicaciones
export function useCommunications(filters?: { clienteId?: string; casoId?: string; canal?: string; estado?: string }) {
  const params = new URLSearchParams()
  if (filters?.clienteId) params.set("clienteId", filters.clienteId)
  if (filters?.casoId) params.set("casoId", filters.casoId)
  if (filters?.canal) params.set("canal", filters.canal)
  if (filters?.estado) params.set("estado", filters.estado)

  const url = `/api/communications${params.toString() ? `?${params.toString()}` : ""}`
  const { data, error, isLoading, mutate } = useSWR(url, fetcher)

  return {
    communications: data || [],
    isLoading,
    isError: error,
    mutate,
  }
}

// Funciones de mutacion
export async function createCase(data: Record<string, unknown>) {
  const res = await fetch("/api/cases", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const contentType = res.headers.get("content-type") || ""
    if (contentType.includes("application/json")) {
      try {
        const error = await res.json()
        throw new Error(error.error || `Error al crear caso (${res.status})`)
      } catch {
        // Fallback to plain text below.
      }
    }

    const text = (await res.text()).trim()
    throw new Error(text || `Error al crear caso (${res.status})`)
  }
  return res.json()
}

export async function updateCase(id: string, data: Record<string, unknown>) {
  const res = await fetch(`/api/cases/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const contentType = res.headers.get("content-type") || ""
    if (contentType.includes("application/json")) {
      try {
        const error = await res.json()
        throw new Error(error.error || `Error al actualizar caso (${res.status})`)
      } catch {
        // Fallback to plain text below.
      }
    }

    const text = (await res.text()).trim()
    throw new Error(text || `Error al actualizar caso (${res.status})`)
  }
  return res.json()
}

export async function deleteCase(id: string) {
  const res = await fetch(`/api/cases/${id}`, { method: "DELETE" })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Error al eliminar caso")
  }
  return res.json()
}

export async function createClient(data: Record<string, unknown>) {
  const res = await fetch("/api/clients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Error al crear cliente")
  }
  return res.json()
}

export async function updateClient(id: string, data: Record<string, unknown>) {
  const res = await fetch(`/api/clients/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Error al actualizar cliente")
  }
  return res.json()
}

export async function syncClientPortal(id: string) {
  const res = await fetch(`/api/clients/${id}/portal`, {
    method: "POST",
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Error al sincronizar el portal del cliente")
  }
  return res.json()
}

export async function deleteClient(id: string) {
  const res = await fetch(`/api/clients/${id}`, { method: "DELETE" })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Error al eliminar cliente")
  }
  return res.json()
}

export async function createAppointment(data: Record<string, unknown>) {
  const res = await fetch("/api/appointments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Error al crear cita")
  }
  return res.json()
}

export async function updateAppointment(id: string, data: Record<string, unknown>) {
  const res = await fetch(`/api/appointments/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Error al actualizar cita")
  }
  return res.json()
}

export async function deleteAppointment(id: string) {
  const res = await fetch(`/api/appointments/${id}`, { method: "DELETE" })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Error al eliminar cita")
  }
  return res.json()
}

export async function createDocument(data: Record<string, unknown>) {
  const res = await fetch("/api/documents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Error al crear documento")
  }
  return res.json()
}

export async function uploadDocument(formData: FormData) {
  const res = await fetch("/api/documents/upload", {
    method: "POST",
    body: formData,
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Error al cargar documento")
  }
  return res.json()
}

export async function approvePortalDocument(id: string, data: Record<string, unknown>) {
  const res = await fetch(`/api/documents/${id}/approval`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Error al aprobar documento")
  }
  return res.json()
}

export async function createInvoice(data: Record<string, unknown>) {
  const res = await fetch("/api/invoices", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Error al crear factura")
  }
  return res.json()
}

export async function addPayment(invoiceId: string, pago: Record<string, unknown>) {
  const res = await fetch(`/api/invoices/${invoiceId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pago }),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Error al agregar pago")
  }
  return res.json()
}

export async function markNotificationsRead(id?: string) {
  const res = await fetch("/api/notifications", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(id ? { id } : {}),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Error al marcar notificaciones")
  }
  return res.json()
}
