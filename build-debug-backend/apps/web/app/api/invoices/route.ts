import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Invoice from "@/lib/models/Invoice"
import User from "@/lib/models/User"
import Client from "@/lib/models/Client"

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
      const clientRecord = await Client.findOne({ email: session.user.email }).select("_id").lean()
      if (clientRecord) {
        query = { clienteId: (clientRecord as any)._id }
      } else {
        return NextResponse.json([])
      }
    } else {
      // Abogado/Asistente ven facturas creadas por ellos
      query = { abogadoId: session.user.id }
    }

    if (clienteId) query.clienteId = clienteId
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

    if (!body.clienteId || !body.concepto || !body.total || !body.fechaVencimiento) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: clienteId, concepto, total, fechaVencimiento" },
        { status: 400 }
      )
    }

    // Calcular subtotal si hay items
    let subtotal = body.subtotal || 0
    if (body.items && body.items.length > 0) {
      subtotal = body.items.reduce((sum: number, item: { subtotal: number }) => sum + item.subtotal, 0)
    }

    const newInvoice = new Invoice({
      ...body,
      abogadoId: session.user.id,
      subtotal,
      saldoPendiente: body.total,
      fechaEmision: body.fechaEmision || new Date(),
      fechaVencimiento: new Date(body.fechaVencimiento),
      pagos: [],
    })

    await newInvoice.save()

    const populatedInvoice = await Invoice.findById(newInvoice._id)
      .populate("clienteId", "nombre apellido razonSocial tipo email telefono")
      .populate("casoId", "titulo numeroInterno")
      .lean()

    return NextResponse.json(populatedInvoice, { status: 201 })
  } catch (error) {
    console.error("Error creating invoice:", error)
    return NextResponse.json({ error: "Error al crear factura" }, { status: 500 })
  }
}
