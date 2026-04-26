import OpenAI from "openai";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    // ✅ Leer body
    const body = await req.json().catch(() => null);

    if (!body) {
      return new Response(
        JSON.stringify({ error: "Body inválido (JSON requerido)" }),
        { status: 400 }
      );
    }

    const pregunta = body.pregunta;

    // ✅ Validar input
    if (!pregunta || typeof pregunta !== "string") {
      return new Response(
        JSON.stringify({ error: "La propiedad 'pregunta' es requerida" }),
        { status: 400 }
      );
    }

    // ✅ Validar API key
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.error("❌ Falta OPENAI_API_KEY");
      return new Response(
        JSON.stringify({ error: "Falta OPENAI_API_KEY" }),
        { status: 500 }
      );
    }

    // ✅ OpenAI
    const openai = new OpenAI({ apiKey });

    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: pregunta,
    });

    const texto = response.output_text ?? "Sin respuesta";

    return new Response(
      JSON.stringify({ respuesta: texto }),
      { status: 200 }
    );

  } catch (error: any) {
    console.error("🔥 ERROR:", error);

    return new Response(
      JSON.stringify({
        error: error.message || "Error interno",
      }),
      { status: 500 }
    );
  }
}