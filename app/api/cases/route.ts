import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Case from "@/lib/models/Case"
import Client from "@/lib/models/Client"
import User from "@/lib/models/User"
import { assertPlanLimit, shouldEnforcePlanLimits } from "@/lib/subscription"
import { createNotificationForUsers } from "@/lib/services/automation"

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
    const estado = searchParams.get("estado")
    const tipo = searchParams.get("tipo")
    const search = searchParams.get("search")

    // Filtrar según el rol del usuario
    let query: Record<string, unknown> = {}
    
    if (userRole === "superadmin" || userRole === "admin") {
      // SuperAdmin y Admin ven todos los casos
      query = {}
    } else if (userRole === "cliente") {
      // Cliente solo ve sus propios casos (donde es el cliente)
      const clientRecord = await Client.findOne({ email: session.user.email }).select("_id").lean()
      if (clientRecord) {
        query = { clienteId: (clientRecord as any)._id }
      } else {
        return NextResponse.json([]) // No tiene casos si no está registrado como cliente
      }
    } else {
      // Abogado/Asistente ven casos donde son el abogado principal
      query = { abogadoPrincipal: session.user.id }
    }

    if (estado && estado !== "todos") {
      query.estado = estado
    }
    if (tipo && tipo !== "todos") {
      query.tipo = tipo
    }
    if (search) {
      query.$or = [
        { titulo: { $regex: search, $options: "i" } },
        { numeroInterno: { $regex: search, $options: "i" } },
        { numeroProceso: { $regex: search, $options: "i" } },
        { despacho: { $regex: search, $options: "i" } },
      ]
    }

    const cases = await Case.find(query)
      .populate("clienteId", "nombre apellido razonSocial tipo email telefono")
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json(cases)
  } catch (error) {
    console.error("Error fetching cases:", error)
    return NextResponse.json({ error: "Error al obtener casos" }, { status: 500 })
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

    // Validar campos requeridos
    if (!body.titulo || !body.tipo || !body.clienteId || !body.calidadCliente) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: titulo, tipo, clienteId, calidadCliente" },
        { status: 400 }
      )
    }

    // Verificar que el cliente existe
    const clientExists = await Client.findById(body.clienteId)
    if (!clientExists) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    const activeCases = await Case.countDocuments({
      abogadoPrincipal: session.user.id,
      estado: { $nin: ["cerrado", "archivado"] },
    })

    if (shouldEnforcePlanLimits()) {
      try {
        await assertPlanLimit(session.user.id, "cases", activeCases)
      } catch (limitError) {
        return NextResponse.json(
          { error: limitError instanceof Error ? limitError.message : "Limite de casos alcanzado" },
          { status: 403 }
        )
      }
    }

    const newCase = new Case({
      ...body,
      abogadoPrincipal: session.user.id,
      fechaInicio: body.fechaInicio || new Date(),
      actuaciones: [],
      documentos: [],
    })

    await newCase.save()

    // Actualizar el cliente con el nuevo caso
    await Client.findByIdAndUpdate(body.clienteId, {
      $push: { casos: newCase._id }
    })

    const clientRecord = await Client.findById(body.clienteId)
      .select("userId nombre apellido razonSocial tipo")
      .lean()

    const recipients = new Set<string>()
    recipients.add(String(session.user.id))

    if (Array.isArray(body.abogadosAsociados)) {
      for (const lawyerId of body.abogadosAsociados) {
        if (lawyerId) {
          recipients.add(String(lawyerId))
        }
      }
    }

    if (clientRecord?.userId) {
      recipients.add(String(clientRecord.userId))
    }

    const clientName =
      clientRecord?.tipo === "persona_juridica"
        ? clientRecord.razonSocial || "cliente juridico"
        : [clientRecord?.nombre, clientRecord?.apellido].filter(Boolean).join(" ").trim() || "cliente"

    await createNotificationForUsers({
      userIds: [...recipients],
      tipo: "caso_actualizado",
      prioridad: "media",
      titulo: `Nuevo caso: ${newCase.titulo}`,
      mensaje: `Se creo el expediente ${newCase.numeroInterno} para ${clientName}. Revisa el resumen y la primera actuacion registrada.`,
      enlace: `/dashboard/casos/${newCase._id}`,
      casoId: newCase._id,
    })

    const populatedCase = await Case.findById(newCase._id)
      .populate("clienteId", "nombre apellido razonSocial tipo email telefono")
      .lean()

    return NextResponse.json(populatedCase, { status: 201 })
  } catch (error) {
    console.error("Error creating case:", error)
    return NextResponse.json({ error: "Error al crear caso" }, { status: 500 })
  }
}
