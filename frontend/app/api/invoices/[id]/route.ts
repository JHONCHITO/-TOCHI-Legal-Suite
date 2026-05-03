import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Invoice from "@/lib/models/Invoice"
import User from "@/lib/models/User"
import Client from "@/lib/models/Client"

type SessionLike = { user?: { id?: string; email?: string } } | null

async function getInvoiceAccessFilter(session: SessionLike) {
  const user = await User.findById(session?.user?.id).select("rol").lean()
  const userRole = (user as { rol?: string } | null)?.rol || "abogado"

  if (userRole === "superadmin" || userRole === "admin") {
    return {}
  }

  if (userRole === "cliente") {
    const clientRecord = await Client.findOne({ email: session?.user?.email }).select("_id").lean()
    if (!clientRecord) return null
    return { clienteId: clientRecord._id }
  }

  return { abogadoId: session?.user?.id }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params
    await dbConnect()
    const accessFilter = await getInvoiceAccessFilter(session)
    if (!accessFilter) {
      return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 })
    }

    const invoice = await Invoice.findOne({
      _id: id,
      ...accessFilter,
    })
      .populate("clienteId", "nombre apellido razonSocial tipo email telefono direccion ciudad")
      .populate("casoId", "titulo numeroInterno")
      .lean()

    if (!invoice) {
      return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 })
    }

    return NextResponse.json(invoice)
  } catch (error) {
    console.error("Error fetching invoice:", error)
    return NextResponse.json({ error: "Error al obtener factura" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    await dbConnect()
    const accessFilter = await getInvoiceAccessFilter(session)
    if (!accessFilter) {
      return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 })
    }

    if (body.fechaVencimiento) {
      body.fechaVencimiento = new Date(body.fechaVencimiento)
    }

    const updatedInvoice = await Invoice.findOneAndUpdate(
      { _id: id, ...accessFilter },
      { $set: body },
      { new: true, runValidators: true }
    )
      .populate("clienteId", "nombre apellido razonSocial tipo email telefono")
      .populate("casoId", "titulo numeroInterno")
      .lean()

    if (!updatedInvoice) {
      return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 })
    }

    return NextResponse.json(updatedInvoice)
  } catch (error) {
    console.error("Error updating invoice:", error)
    return NextResponse.json({ error: "Error al actualizar factura" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params
    await dbConnect()
    const accessFilter = await getInvoiceAccessFilter(session)
    if (!accessFilter) {
      return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 })
    }

    const deletedInvoice = await Invoice.findOneAndDelete({
      _id: id,
      ...accessFilter,
    })

    if (!deletedInvoice) {
      return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 })
    }

    return NextResponse.json({ message: "Factura eliminada correctamente" })
  } catch (error) {
    console.error("Error deleting invoice:", error)
    return NextResponse.json({ error: "Error al eliminar factura" }, { status: 500 })
  }
}

// Agregar pago a la factura
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    await dbConnect()
    const accessFilter = await getInvoiceAccessFilter(session)
    if (!accessFilter) {
      return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 })
    }

    if (body.pago) {
      const invoice = await Invoice.findOne({
        _id: id,
        ...accessFilter,
      })

      if (!invoice) {
        return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 })
      }

      invoice.pagos.push({
        ...body.pago,
        fecha: new Date(body.pago.fecha),
      })

      await invoice.save()

      const updatedInvoice = await Invoice.findById(id)
        .populate("clienteId", "nombre apellido razonSocial tipo email telefono")
        .populate("casoId", "titulo numeroInterno")
        .lean()

      return NextResponse.json(updatedInvoice)
    }

    return NextResponse.json({ error: "Accion no soportada" }, { status: 400 })
  } catch (error) {
    console.error("Error patching invoice:", error)
    return NextResponse.json({ error: "Error al actualizar factura" }, { status: 500 })
  }
}
