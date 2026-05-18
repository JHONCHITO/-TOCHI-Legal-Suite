import { NextResponse } from "next/server"
import mongoose from "mongoose"
import { auth } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Case from "@/lib/models/Case"
import Client from "@/lib/models/Client"
import User from "@/lib/models/User"
import { reserveNextCaseNumber } from "@/lib/services/case-number"
import { ensureClientProfileForSession } from "@/lib/services/client-profile"
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
    const estado = searchParams.get("estado")
    const tipo = searchParams.get("tipo")
    const search = searchParams.get("search")
    const clienteId = searchParams.get("clienteId")

    // Filtrar según el rol del usuario
    let query: Record<string, unknown> = {}
    
    if (userRole === "superadmin" || userRole === "admin") {
      // SuperAdmin y Admin ven todos los casos
      query = {}
    } else if (userRole === "cliente") {
      // Cliente solo ve sus propios casos (donde es el cliente)
      const clientRecord = await ensureClientProfileForSession({
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      })
      if (clientRecord) {
        query = { clienteId: String((clientRecord as { _id: unknown })._id) }
      } else {
        return NextResponse.json([]) // No tiene casos si no está registrado como cliente
      }
    } else {
      // Abogado/Asistente ven casos donde son el abogado principal
      query = { abogadoPrincipal: session.user.id }
    }

    if (clienteId) {
      query.clienteId = clienteId
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

    if (
      typeof body.clienteId !== "string" ||
      !body.clienteId.trim() ||
      !mongoose.isValidObjectId(body.clienteId)
    ) {
      return NextResponse.json({ error: "Cliente no válido" }, { status: 400 })
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

    const numeroInterno = await reserveNextCaseNumber()

    const newCase = new Case({
      ...body,
      numeroInterno,
      abogadoPrincipal: session.user.id,
      fechaInicio: body.fechaInicio || new Date(),
      actuaciones: [],
      documentos: [],
    })

    let savedCase = null
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        savedCase = await newCase.save()
        break
      } catch (saveError) {
        const errorObject = saveError as {
          code?: number
          keyPattern?: Record<string, unknown>
          keyValue?: Record<string, unknown>
        }
        const isDuplicateNumeroInterno =
          errorObject.code === 11000 &&
          JSON.stringify(errorObject.keyPattern || errorObject.keyValue || {}).includes("numeroInterno")

        if (!isDuplicateNumeroInterno || attempt === 1) {
          throw saveError
        }

        delete (newCase as { numeroInterno?: string }).numeroInterno
      }
    }

    if (!savedCase) {
      throw new Error("No se pudo generar el numero interno del caso")
    }

    // Actualizar el cliente con el nuevo caso sin bloquear el guardado del expediente.
    try {
      await Client.findByIdAndUpdate(body.clienteId, {
        $addToSet: { casos: savedCase._id },
      })
    } catch (clientLinkError) {
      console.warn("No se pudo enlazar el caso al cliente:", clientLinkError)
    }

    const populatedCase = await Case.findById(savedCase._id)
      .populate("clienteId", "nombre apellido razonSocial tipo email telefono")
      .lean()

    return NextResponse.json(populatedCase, { status: 201 })
  } catch (error) {
    console.error("Error creating case:", error)
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Error al crear caso"

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
