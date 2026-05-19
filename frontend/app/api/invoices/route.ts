import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Invoice from "@/lib/models/Invoice"
import User from "@/lib/models/User"
import { ensureClientProfileForSession } from "@/lib/services/client-profile"
import { notifyClientByClientId } from "@/lib/services/client-notifications"
import { assertPlanLimit, shouldEnforcePlanLimits } from "@/lib/subscription"

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    await dbConnect()
    
    // Obtener rol del usuario
    const user = await User.findById(session.user.id).select("rol").lean()
    const userRole = (user as any)?.rol || "abogado"

    const { searchParams } = new URL(request.url)
    const clienteId = searchParams.get("clienteId")
    const estado = searchParams.get("estado")
    const casoId = searchParams.get("casoId")

    // Filtrar según el rol del usuario
    let query: Record<string, unknown> = {}
    
    if (userRole === "superadmin" || userRole === "admin") {
      // SuperAdmin y Admin ven todas las facturas
      query = {}
    } else if (userRole === "cliente") {
      // Cliente solo ve sus propias facturas
      const clientRecord = await ensureClientProfileForSession({
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      })
      if (clientRecord) {
        query = { clienteId: String((clientRecord as { _id: unknown })._id), portalCompartido: true }
      } else {
        return NextResponse.json([])
      }
    } else {
      // Abogado/Asistente ven facturas creadas por ellos
      query = { abogadoId: session.user.id }
    }

    if (clienteId && userRole !== "cliente") query.clienteId = clienteId
    if (casoId) query.casoId = casoId
    if (estado && estado !== "todos") query.estado = estado

    const invoices = await Invoice.find(query)
      .populate("clienteId", "nombre apellido razonSocial tipo email telefono")
      .populate("casoId", "titulo numeroInterno")
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json(invoices)
  } catch (error) {
    console.error("Error fetching invoices:", error)
    return NextResponse.json({ error: "Error al obtener facturas" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    await dbConnect()

    if (!body.clienteId || !body.concepto || !body.fechaVencimiento) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: clienteId, concepto y fechaVencimiento" },
        { status: 400 }
      )
    }

    const activeInvoices = await Invoice.countDocuments({
      abogadoId: session.user.id,
      estado: { $ne: "cancelada" },
    })

    if (shouldEnforcePlanLimits()) {
      try {
        await assertPlanLimit(session.user.id, "invoices", activeInvoices)
      } catch (limitError) {
        return NextResponse.json(
          { error: limitError instanceof Error ? limitError.message : "Limite de facturas alcanzado" },
          { status: 403 }
        )
      }
    }

    const items = Array.isArray(body.items)
      ? body.items.map((item: Record<string, unknown>) => {
          const cantidad = Number(item.cantidad ?? 1) || 1
          const valorUnitario = Number(item.valorUnitario ?? 0) || 0
          const subtotal = Number(item.subtotal ?? cantidad * valorUnitario) || 0

          return {
            descripcion: String(item.descripcion ?? ""),
            cantidad,
            valorUnitario,
            subtotal,
          }
        })
      : []

    const subtotal = items.length
      ? items.reduce((sum: number, item: { subtotal: number }) => sum + item.subtotal, 0)
      : Number(body.subtotal ?? 0) || 0

    const ivaPorcentaje =
      body.ivaPorcentaje === undefined || body.ivaPorcentaje === null || body.ivaPorcentaje === ""
        ? 19
        : Number(body.ivaPorcentaje) || 0
    const impuestos = Number(body.impuestos ?? body.iva ?? Math.round(subtotal * (ivaPorcentaje / 100))) || 0
    const descuento = Number(body.descuento ?? 0) || 0
    const total = Number(body.total ?? subtotal + impuestos - descuento) || subtotal + impuestos - descuento
    const generatedNumero = `FAC-${new Date().getFullYear()}-${String((await Invoice.countDocuments()) + 1).padStart(5, "0")}`

    const newInvoice = new Invoice({
      ...body,
      numero: body.numero || generatedNumero,
      items,
      abogadoId: session.user.id,
      portalCompartido: Boolean(body.portalCompartido),
      ...(body.portalCompartido ? { portalCompartidoEn: new Date() } : {}),
      subtotal,
      ivaPorcentaje,
      impuestos,
      descuento,
      total,
      saldoPendiente: total,
      fechaEmision: body.fechaEmision || new Date(),
      fechaVencimiento: new Date(body.fechaVencimiento),
      pagos: [],
    })

    await newInvoice.save()

    const populatedInvoice = await Invoice.findById(newInvoice._id)
      .populate("clienteId", "nombre apellido razonSocial tipo email telefono")
      .populate("casoId", "titulo numeroInterno")
      .lean()

    const invoiceClientId = (populatedInvoice as { clienteId?: { _id?: unknown } | unknown } | null)?.clienteId
    const notificationClientId =
      invoiceClientId && typeof invoiceClientId === "object" && "_id" in invoiceClientId
        ? (invoiceClientId as { _id?: unknown })._id
        : invoiceClientId

    if (notificationClientId) {
      await notifyClientByClientId({
        clientId: notificationClientId,
        tipo: "sistema",
        prioridad: "media",
        titulo: `Nueva factura emitida: ${newInvoice.numero}`,
        mensaje: `Se emitió la factura ${newInvoice.numero} por ${newInvoice.total.toLocaleString(
          "es-CO",
          { style: "currency", currency: "COP", maximumFractionDigits: 0 }
        )}.`,
        enlace: "/portal#facturas",
        casoId: body.casoId,
      })
    }

    return NextResponse.json(populatedInvoice, { status: 201 })
  } catch (error) {
    console.error("Error creating invoice:", error)
    return NextResponse.json({ error: "Error al crear factura" }, { status: 500 })
  }
}
