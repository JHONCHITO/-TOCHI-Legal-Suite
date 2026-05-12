import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import LegalCode from "@/lib/models/LegalCode";
import { buildLegalCodeCatalog } from "@/lib/services/legal-catalog";

export async function GET(request: NextRequest) {
  try {
    const catalog = await buildLegalCodeCatalog();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim().toLowerCase() || "";
    const categoria = searchParams.get("categoria")?.trim().toLowerCase() || "";
    const tipo = searchParams.get("tipo")?.trim().toLowerCase() || "";

    const filtered = catalog.filter((code) => {
      const matchesSearch =
        !search ||
        code.name.toLowerCase().includes(search) ||
        code.code.toLowerCase().includes(search) ||
        code.description.toLowerCase().includes(search) ||
        code.tags.some((tag) => tag.toLowerCase().includes(search)) ||
        code.articles.some(
          (article) =>
            article.title.toLowerCase().includes(search) ||
            article.content.toLowerCase().includes(search) ||
            article.number.toLowerCase().includes(search)
        );

      const matchesCategory =
        !categoria || code.category.toLowerCase().includes(categoria);
      const matchesType =
        !tipo || code.category.toLowerCase().includes(tipo) || code.code.toLowerCase().includes(tipo);

      return matchesSearch && matchesCategory && matchesType;
    });

    return NextResponse.json(filtered);
  } catch (error) {
    console.error("Error fetching legal codes:", error);
    return NextResponse.json({ error: "Error al obtener codigos legales" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const data = await request.json();

    const newCode = new LegalCode(data);
    await newCode.save();

    return NextResponse.json(newCode, { status: 201 });
  } catch (error) {
    console.error("Error creating legal code:", error);
    return NextResponse.json({ error: "Error al crear codigo legal" }, { status: 500 });
  }
}
