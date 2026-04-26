import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import dbConnect from "@/lib/mongodb"
import Case from "@/lib/models/Case"
import Client from "@/lib/models/Client"
import Appointment from "@/lib/models/Appointment"
import Invoice from "@/lib/models/Invoice"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    await dbConnect()

    const userId = session.user.id

    // Obtener estadisticas en paralelo
    const [
      totalCases,
      activeCases,
      totalClients,
      activeClients,
      upcomingAppointments,
      totalInvoices,
      invoiceStats,
      recentCases,
      recentAppointments,
    ] = await Promise.all([
      // Total de casos
      Case.countDocuments({ abogadoPrincipal: userId }),
      // Casos activos
      Case.countDocuments({ 
        abogadoPrincipal: userId, 
        estado: { $in: ["activo", "en_tramite", "audiencia_pendiente"] } 
      }),
      // Total de clientes
      Client.countDocuments({ abogadoAsignado: userId }),
      // Clientes activos
      Client.countDocuments({ abogadoAsignado: userId, activo: true }),
      // Citas proximas (proximos 7 dias)
      Appointment.countDocuments({
        abogadoId: userId,
        fechaInicio: { 
          $gte: new Date(), 
          $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) 
        },
        estado: { $in: ["programada", "confirmada"] },
      }),
      // Total facturas
      Invoice.countDocuments({ abogadoId: userId }),
      // Estadisticas de facturacion
      Invoice.aggregate([
        { $match: { abogadoId: userId } },
        {
          $group: {
            _id: null,
            totalFacturado: { $sum: "$total" },
            totalPagado: { $sum: "$montoPagado" },
            totalPendiente: { $sum: "$saldoPendiente" },
          },
        },
      ]),
      // Casos recientes con cliente
      Case.find({ abogadoPrincipal: userId })
        .populate("clienteId", "nombre apellido razonSocial tipo")
        .sort({ updatedAt: -1 })
        .limit(5)
        .lean(),
      // Citas proximas
      Appointment.find({
        abogadoId: userId,
        fechaInicio: { $gte: new Date() },
        estado: { $in: ["programada", "confirmada"] },
      })
        .populate("clienteId", "nombre apellido razonSocial tipo")
        .populate("casoId", "titulo numeroInterno")
        .sort({ fechaInicio: 1 })
        .limit(5)
        .lean(),
    ])

    const stats = invoiceStats[0] || { totalFacturado: 0, totalPagado: 0, totalPendiente: 0 }

    return NextResponse.json({
      stats: {
        casos: {
          total: totalCases,
          activos: activeCases,
        },
        clientes: {
          total: totalClients,
          activos: activeClients,
        },
        citas: {
          proximas: upcomingAppointments,
        },
        facturacion: {
          total: totalInvoices,
          totalFacturado: stats.totalFacturado,
          totalPagado: stats.totalPagado,
          totalPendiente: stats.totalPendiente,
        },
      },
      recentCases,
      recentAppointments,
    })
  } catch (error) {
    console.error("Error fetching dashboard:", error)
    return NextResponse.json({ error: "Error al obtener datos del dashboard" }, { status: 500 })
  }
}
