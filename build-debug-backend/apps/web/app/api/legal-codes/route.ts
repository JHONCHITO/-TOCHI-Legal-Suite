import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import LegalCode from "@/lib/models/LegalCode"

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const categoria = searchParams.get("categoria")
    const tipo = searchParams.get("tipo")

    const query: Record<string, unknown> = { vigente: true }
    
    if (search) {
      query.$or = [
        { nombre: { $regex: search, $options: "i" } },
        { codigo: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ]
    }
    
    if (categoria) {
      query.areasDelDerecho = categoria
    }
    
    if (tipo) {
      query.tipo = tipo
    }

    const codes = await LegalCode.find(query).sort({ nombre: 1 })
    return NextResponse.json(codes)
  } catch (error) {
    console.error("Error fetching legal codes:", error)
    return NextResponse.json({ error: "Error al obtener codigos legales" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    const data = await request.json()
    
    const newCode = new LegalCode(data)
    await newCode.save()
    
    return NextResponse.json(newCode, { status: 201 })
  } catch (error) {
    console.error("Error creating legal code:", error)
    return NextResponse.json({ error: "Error al crear codigo legal" }, { status: 500 })
  }
}
