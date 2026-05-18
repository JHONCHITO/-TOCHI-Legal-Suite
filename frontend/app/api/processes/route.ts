import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Case from "@/lib/models/Case"
import Client from "@/lib/models/Client"
import User from "@/lib/models/User"
import ProcessSearch from "@/lib/models/ProcessSearch"
import { caseStatusLabels, caseTypeLabels, getClientDisplayName } from "@/lib/utils/format"

export const runtime = "nodejs"

type SearchType = "radicado" | "cedula" | "nombre"

type ProcessResult = {
  caseId: string
  numeroInterno: string
  radicado: string
  despacho: string
  tipo: string
  demandante: string
  demandado: string
  estado: string
  fechaRadicacion?: string
  ultimaActuacion?: string
  ciudad?: string
  officialUrl: string
  source: string
  matchedField: string
}

type RecentSearch = {
  _id: string
  searchType: SearchType
  searchValue: string
  resultsCount: number
  createdAt: string
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function normalizeSearchValue(searchType: SearchType, value: string) {
  const trimmed = value.trim()
  if (searchType === "cedula") {
    return trimmed.replace(/\D/g, "")
  }
  return trimmed
}

function buildAccessFilter(userRole: string, userEmail: string | null, userId: string) {
  if (userRole === "superadmin" || userRole === "admin") {
    return {}
  }

  if (userRole === "cliente") {
    return { email: userEmail || "__no_client__" }
  }

  return { abogadoAsignado: userId }
}

function getLatestActuacion(caseRecord: {
  actuaciones?: Array<{ fecha?: Date; descripcion?: string; tipo?: string }>
}) {
  const actuaciones = Array.isArray(caseRecord.actuaciones) ? caseRecord.actuaciones : []
  if (actuaciones.length === 0) {
    return ""
  }

  const latest = [...actuaciones].sort((a, b) => {
    const left = a.fecha ? new Date(a.fecha).getTime() : 0
    const right = b.fecha ? new Date(b.fecha).getTime() : 0
    return right - left
  })[0]

  return latest?.descripcion ? latest.descripcion : latest?.tipo || ""
}

function mapCaseToResult(caseRecord: Record<string, any>): ProcessResult {
  const client = caseRecord.clienteId || {}
  const clientName = getClientDisplayName({
    tipo: client.tipo || "persona_natural",
    nombre: client.nombre,
    apellido: client.apellido,
    razonSocial: client.razonSocial,
  })
  const counterpartName = caseRecord.contraparte || "Parte contraria"
  const clientIsDefense = caseRecord.calidadCliente === "demandado"

  return {
    caseId: String(caseRecord._id),
    numeroInterno: String(caseRecord.numeroInterno || ""),
    radicado: String(caseRecord.numeroRadicado || caseRecord.numeroProceso || caseRecord.numeroInterno || ""),
    despacho: String(caseRecord.despacho || "Sin despacho"),
    tipo: caseTypeLabels[caseRecord.tipo] || String(caseRecord.tipo || "otro"),
    demandante: clientIsDefense ? counterpartName : clientName,
    demandado: clientIsDefense ? clientName : counterpartName,
    estado: caseStatusLabels[caseRecord.estado] || String(caseRecord.estado || "consulta"),
    fechaRadicacion: caseRecord.fechaRadicacion ? new Date(caseRecord.fechaRadicacion).toISOString() : undefined,
    ultimaActuacion: getLatestActuacion(caseRecord),
    ciudad: caseRecord.ciudad || "",
    officialUrl: "https://consultaprocesos.ramajudicial.gov.co/",
    source: "Expediente interno TOCHI",
    matchedField: "Busqueda en base propia",
  }
}

async function getRecentSearches(userId: string): Promise<RecentSearch[]> {
  const recent = await ProcessSearch.find({ userId })
    .sort({ createdAt: -1 })
    .limit(8)
    .lean()

  return recent.map((item) => ({
    _id: String(item._id),
    searchType: item.searchType as SearchType,
    searchValue: String(item.searchValue || ""),
    resultsCount: Number(item.resultsCount || 0),
    createdAt: new Date(item.createdAt).toISOString(),
  }))
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    await dbConnect()

    return NextResponse.json({
      results: [],
      recentSearches: await getRecentSearches(session.user.id),
      total: 0,
    })
  } catch (error) {
    console.error("Error obteniendo historial de procesos:", error)
    return NextResponse.json({ error: "No se pudo obtener la consulta de procesos" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = (await request.json()) as { searchType?: SearchType; searchValue?: string }
    const searchType = body.searchType || "radicado"
    const normalizedValue = normalizeSearchValue(searchType, body.searchValue || "")

    if (!normalizedValue) {
      return NextResponse.json({ error: "Ingresa un valor para buscar" }, { status: 400 })
    }

    await dbConnect()

    const user = await User.findById(session.user.id).select("rol email").lean()
    const userRole = String((user as { rol?: string } | null)?.rol || "abogado")
    const userEmail = (user as { email?: string } | null)?.email || null
    const accessFilter = buildAccessFilter(userRole, userEmail, session.user.id)
    const query: Record<string, unknown> = { ...accessFilter }
    const escaped = escapeRegex(normalizedValue)

    if (searchType === "radicado") {
      query.$or = [
        { numeroRadicado: { $regex: escaped, $options: "i" } },
        { numeroProceso: { $regex: escaped, $options: "i" } },
        { numeroInterno: { $regex: escaped, $options: "i" } },
        { titulo: { $regex: escaped, $options: "i" } },
        { despacho: { $regex: escaped, $options: "i" } },
        { contraparte: { $regex: escaped, $options: "i" } },
      ]
    } else {
      const clientQuery: Record<string, unknown> = {
        ...buildAccessFilter(userRole, userEmail, session.user.id),
        $or: [
          { nombre: { $regex: escaped, $options: "i" } },
          { apellido: { $regex: escaped, $options: "i" } },
          { razonSocial: { $regex: escaped, $options: "i" } },
          { cedula: { $regex: escaped, $options: "i" } },
          { nit: { $regex: escaped, $options: "i" } },
        ],
      }

      const matchingClients = await Client.find(clientQuery).select("_id").lean()
      const clientIds = matchingClients.map((item) => item._id)

      if (clientIds.length === 0) {
        const emptySearch = await ProcessSearch.create({
          userId: session.user.id,
          searchType,
          searchValue: normalizedValue,
          resultsCount: 0,
        })

        return NextResponse.json({
          results: [],
          recentSearches: await getRecentSearches(session.user.id),
          total: 0,
          recordedSearch: {
            _id: String(emptySearch._id),
            searchType,
            searchValue: normalizedValue,
            resultsCount: 0,
            createdAt: emptySearch.createdAt.toISOString(),
          },
        })
      }

      query.clienteId = { $in: clientIds }
    }

    const cases = await Case.find(query)
      .populate("clienteId", "nombre apellido razonSocial tipo cedula nit")
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(25)
      .lean()

    const results = cases.map(mapCaseToResult)

    await ProcessSearch.create({
      userId: session.user.id,
      searchType,
      searchValue: normalizedValue,
      resultsCount: results.length,
    })

    return NextResponse.json({
      results,
      recentSearches: await getRecentSearches(session.user.id),
      total: results.length,
      searchType,
      searchValue: normalizedValue,
    })
  } catch (error) {
    console.error("Error consultando procesos:", error)
    return NextResponse.json({ error: "No se pudo consultar procesos" }, { status: 500 })
  }
}
