import { useEffect, useRef, useState } from "react"
import useSWR from "swr"

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Error al obtener datos")
  }
  return res.json()
}

type BrowserNotificationPermission = "default" | "denied" | "granted" | "unsupported"

type NotificationStreamPayload = {
  kind?: "connected" | "created" | "updated" | "sync"
  userId?: string
  timestamp?: string
  notificationId?: string
  unreadCount?: number
  title?: string
  message?: string
  url?: string
  priority?: "alta" | "media" | "baja"
  type?: string
}

type BrowserNotificationOptions = NotificationOptions & {
  renotify?: boolean
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
export function useAppointments(filters?: { fecha?: string; tipo?: string; estado?: string; clienteId?: string; casoId?: string }) {
  const params = new URLSearchParams()
  if (filters?.fecha) params.set("fecha", filters.fecha)
  if (filters?.tipo) params.set("tipo", filters.tipo)
  if (filters?.estado) params.set("estado", filters.estado)
  if (filters?.clienteId) params.set("clienteId", filters.clienteId)
  if (filters?.casoId) params.set("casoId", filters.casoId)
  
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

// Notificaciones
export function useNotifications(options?: { desktopNotifications?: boolean }) {
  const desktopNotifications = options?.desktopNotifications ?? false
  const { data, error, isLoading, mutate } = useSWR("/api/notifications", fetcher, {
    refreshInterval: 15000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    refreshWhenHidden: false,
  })
  const [streamStatus, setStreamStatus] = useState<"connecting" | "connected" | "disconnected">("connecting")
  const [browserPermission, setBrowserPermission] = useState<BrowserNotificationPermission>("unsupported")
  const serviceWorkerRegistrationPromiseRef = useRef<Promise<ServiceWorkerRegistration | null> | null>(null)

  const ensureServiceWorkerRegistration = async () => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return null
    }

    if (!serviceWorkerRegistrationPromiseRef.current) {
      serviceWorkerRegistrationPromiseRef.current = navigator.serviceWorker
        .register("/notification-sw.js", { scope: "/" })
        .then((registration) => registration)
        .catch((swError) => {
          console.error("No se pudo registrar el service worker de notificaciones:", swError)
          serviceWorkerRegistrationPromiseRef.current = null
          return null
        })
    }

    return serviceWorkerRegistrationPromiseRef.current
  }

  const showBrowserNotification = async (payload: NotificationStreamPayload) => {
    if (typeof window === "undefined" || typeof Notification === "undefined") {
      return
    }

    if (browserPermission !== "granted" || !desktopNotifications) {
      return
    }

    const title = payload.title || "Nueva notificacion legal"
    const body = payload.message || "Tienes una nueva alerta en TOCHI Legal Suite."
    const targetUrl = payload.url || "/dashboard/notificaciones"
    const tag = payload.notificationId || payload.type || payload.kind || "tochi-legal-notification"

    const notificationOptions: BrowserNotificationOptions = {
      body,
      tag,
      data: {
        url: targetUrl,
        notificationId: payload.notificationId,
        type: payload.type,
      },
      icon: "/icon-light-32x32.png",
      badge: "/icon-light-32x32.png",
      requireInteraction: payload.priority === "alta",
      renotify: payload.priority === "alta",
      silent: false,
    }

    try {
      const registration = await ensureServiceWorkerRegistration()
      if (registration && "showNotification" in registration) {
        await registration.showNotification(title, notificationOptions)
        return
      }
    } catch (notificationError) {
      console.error("No se pudo mostrar la notificacion del navegador:", notificationError)
    }

    try {
      const notification = new Notification(title, notificationOptions)
      notification.onclick = () => {
        window.focus()
        window.open(targetUrl, "_blank", "noopener,noreferrer")
        notification.close()
      }
    } catch (fallbackError) {
      console.error("No se pudo mostrar la notificacion fallback:", fallbackError)
    }
  }

  const requestBrowserNotifications = async () => {
    if (typeof window === "undefined" || typeof Notification === "undefined") {
      setBrowserPermission("unsupported")
      return false
    }

    if (Notification.permission === "granted") {
      setBrowserPermission("granted")
      await ensureServiceWorkerRegistration()
      return true
    }

    if (Notification.permission === "denied") {
      setBrowserPermission("denied")
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      setBrowserPermission(permission)
      if (permission === "granted") {
        await ensureServiceWorkerRegistration()
        return true
      }
    } catch (permissionError) {
      console.error("No se pudo solicitar permiso de notificaciones:", permissionError)
    }

    return false
  }

  useEffect(() => {
    if (typeof window === "undefined" || !window.EventSource) {
      setStreamStatus("disconnected")
      return
    }

    if (typeof Notification !== "undefined") {
      setBrowserPermission(Notification.permission === "default" || Notification.permission === "denied" || Notification.permission === "granted"
        ? Notification.permission
        : "unsupported")
    } else {
      setBrowserPermission("unsupported")
    }

    let closed = false
    const stream = new EventSource("/api/notifications/stream")

    const refreshNow = () => {
      if (!closed) {
        void mutate()
      }
    }

    const handleNotificationEvent = (event: MessageEvent) => {
      refreshNow()

      if (!desktopNotifications || browserPermission !== "granted") {
        return
      }

      const payload = (() => {
        try {
          return JSON.parse(String(event.data)) as NotificationStreamPayload
        } catch {
          return null
        }
      })()

      if (!payload || payload.kind !== "created") {
        return
      }

      void showBrowserNotification(payload)
    }

    stream.onopen = () => {
      if (!closed) {
        setStreamStatus("connected")
        refreshNow()
      }
    }

    stream.addEventListener("connected", refreshNow as EventListener)
    stream.addEventListener("notification", handleNotificationEvent as EventListener)
    stream.onerror = () => {
      if (!closed) {
        setStreamStatus("disconnected")
      }
    }

    return () => {
      closed = true
      stream.close()
    }
  }, [browserPermission, desktopNotifications, mutate])

  useEffect(() => {
    if (!desktopNotifications || browserPermission !== "granted") {
      return
    }

    void ensureServiceWorkerRegistration()
  }, [browserPermission, desktopNotifications])

  return {
    notifications: data?.notifications || [],
    unreadCount: data?.unreadCount || 0,
    isLoading,
    isError: error,
    mutate,
    streamStatus,
    browserPermission,
    requestBrowserNotifications,
  }
}

export function useWhatsAppStatus() {
  const { data, error, isLoading, mutate } = useSWR("/api/whatsapp/status", fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  })

  return {
    whatsappStatus: data,
    isLoading,
    isError: error,
    mutate,
  }
}

export function useWhatsAppIntegration() {
  const { data, error, isLoading, mutate } = useSWR("/api/integrations/whatsapp", fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  })

  return {
    integration: data,
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
    const error = await res.json()
    throw new Error(error.error || "Error al crear caso")
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
    const error = await res.json()
    throw new Error(error.error || "Error al actualizar caso")
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

export async function sendWhatsAppCommunication(data: Record<string, unknown>) {
  const res = await fetch("/api/whatsapp/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(error.error || "Error al enviar WhatsApp")
  }

  return res.json()
}

export async function saveWhatsAppIntegration(data: Record<string, unknown>) {
  const res = await fetch("/api/integrations/whatsapp", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(error.error || "Error al guardar integracion WhatsApp")
  }

  return res.json()
}
