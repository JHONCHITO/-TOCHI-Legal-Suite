import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Invoice from "@/lib/models/Invoice"

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    await dbConnect()

    const { searchParams } = new URL(request.url)
    const clienteId = searchParams.get("clienteId")
    const estado = searchParams.get("estado")
    const casoId = searchParams.get("casoId")

    const query: Record<string, unknown> = { abogadoId: session.user.id }

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
