import OpenAI from "openai";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

type IntakeClientInput = {
  tipo?: string;
  nombre?: string;
  apellido?: string;
  razonSocial?: string;
  email?: string;
  telefono?: string;
  ciudad?: string;
  departamento?: string;
  notas?: string;
};

type IntakeCaseInput = {
  titulo?: string;
  tipo?: string;
  estado?: string;
  calidadCliente?: string;
  descripcion?: string;
  hechos?: string;
  pretensiones?: string;
  contraparte?: string;
  numeroProceso?: string;
  despacho?: string;
};

type IntakePayload = {
  cliente?: IntakeClientInput;
  caso?: IntakeCaseInput;
};

type IntakeInsights = {
  tituloCasoSugerido: string;
  tipoCasoSugerido: string;
  estadoSugerido: string;
  calidadClienteSugerida: string;
  resumen: string;
  hechosSugeridos: string;
  pretensionesSugeridas: string;
  palabrasClave: string[];
  proximaAccionSugerida: string;
  citaSugerida: {
    titulo: string;
    tipo: string;
    descripcion: string;
  };
};

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

function inferCaseType(text: string) {
  if (/laboral|despido|contrato de trabajo|salarios|prestaciones/i.test(text)) return "laboral";
  if (/penal|delito|denuncia|fiscalia|captura|homicidio|hurto/i.test(text)) return "penal";
  if (/familia|alimentos|custodia|divorcio|sucesion|herencia/i.test(text)) return "familia";
  if (/comercial|mercantil|contrato|sociedad|factura|ejecutivo|titulo valor/i.test(text)) return "comercial";
  if (/administrativo|nulidad|restablecimiento|derecho de peticion|sancion/i.test(text)) return "administrativo";
  if (/tutela|constitucional|derechos fundamentales|salud|educacion/i.test(text)) return "constitucional";
  if (/tributario|impuesto|dian|fiscal/i.test(text)) return "tributario";
  if (/civil|responsabilidad|arrendamiento|propiedad|obligaciones/i.test(text)) return "civil";
  return "otro";
}

function inferQuality(text: string) {
  if (/defender|demandado|sancion|investigado|querellado/i.test(text)) return "demandado";
  if (/tutela|victima|afectado|perjudicado|denunciante/i.test(text)) return "victima";
  if (/tercero|interviniente/i.test(text)) return "tercero";
  return "demandante";
}

function buildFallbackInsights(cliente?: IntakeClientInput, caso?: IntakeCaseInput): IntakeInsights {
  const sourceText = [
    cliente?.notas,
    caso?.titulo,
    caso?.descripcion,
    caso?.hechos,
    caso?.pretensiones,
    caso?.contraparte,
    caso?.despacho,
  ]
    .filter(Boolean)
    .join(" ");

  const tipoCasoSugerido = inferCaseType(sourceText);
  const calidadClienteSugerida = inferQuality(sourceText);
  const nombreCliente =
    cliente?.tipo === "persona_juridica"
      ? cliente?.razonSocial || "cliente juridico"
      : [cliente?.nombre, cliente?.apellido].filter(Boolean).join(" ").trim() || "cliente";
  const asuntoBase = caso?.titulo || caso?.descripcion || "Nuevo asunto";

  return {
    tituloCasoSugerido: caso?.titulo || `${asuntoBase.slice(0, 60)}${asuntoBase.length > 60 ? "..." : ""}`,
    tipoCasoSugerido,
    estadoSugerido: caso?.estado || "consulta",
    calidadClienteSugerida,
    resumen: `Se detecto una entrada para ${nombreCliente}. La informacion apunta a un asunto de tipo ${tipoCasoSugerido} con calidad ${calidadClienteSugerida}.`,
    hechosSugeridos: caso?.hechos || caso?.descripcion || "Hechos principales por completar con el relato del cliente.",
    pretensionesSugeridas:
      caso?.pretensiones ||
      "Definir pretensiones, medidas urgentes, solicitudes probatorias y resultado esperado del expediente.",
    palabrasClave: [
      tipoCasoSugerido,
      calidadClienteSugerida,
      cliente?.ciudad || "",
      cliente?.departamento || "",
    ].filter(Boolean),
    proximaAccionSugerida: "Revisar documentos soporte, validar competencias, y agendar la primera entrevista de estrategia.",
    citaSugerida: {
      titulo: `Seguimiento inicial - ${asuntoBase.slice(0, 40)}`,
      tipo: tipoCasoSugerido === "penal" ? "audiencia" : "consulta",
      descripcion: "Primera entrevista estrategica sugerida por la IA para validar datos y ruta procesal.",
    },
  };
}

function extractJson(text: string) {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenceMatch ? fenceMatch[1].trim() : trimmed;
  try {
    return JSON.parse(candidate);
  } catch {
    const jsonStart = candidate.indexOf("{");
    const jsonEnd = candidate.lastIndexOf("}");
    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      return JSON.parse(candidate.slice(jsonStart, jsonEnd + 1));
    }
    throw new Error("No se pudo interpretar la respuesta de la IA");
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const payload = (await request.json()) as IntakePayload;
    const cliente = payload?.cliente || {};
    const caso = payload?.caso || {};

    const hasCliente = Object.keys(cliente).length > 0;
    const hasCaso = Object.keys(caso).length > 0;

    if (!hasCliente && !hasCaso) {
      return NextResponse.json({ error: "No se recibio informacion para analizar" }, { status: 400 });
    }

    const fallback = buildFallbackInsights(cliente, caso);

    if (!openai) {
      return NextResponse.json({
        suggestions: fallback,
        fallback: true,
        model: "heuristic-intake",
      });
    }

    let suggestions = fallback;

    try {
      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "Eres un analista de intake legal para una firma de abogados colombiana. Devuelve SOLO JSON valido con claves: tituloCasoSugerido, tipoCasoSugerido, estadoSugerido, calidadClienteSugerida, resumen, hechosSugeridos, pretensionesSugeridas, palabrasClave, proximaAccionSugerida, citaSugerida. usa string arrays donde aplique.",
          },
          {
            role: "user",
            content: JSON.stringify({
              cliente,
              caso,
              instrucciones:
                "Sugiere una estructura legal util para abrir el expediente y la primera cita. No inventes hechos que no esten en el texto. Si falta informacion, redacta una sugerencia prudente y clara.",
            }),
          },
        ],
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content || "";
      const parsed = extractJson(content) as Partial<IntakeInsights>;

      suggestions = {
        tituloCasoSugerido: String(parsed.tituloCasoSugerido || fallback.tituloCasoSugerido),
        tipoCasoSugerido: String(parsed.tipoCasoSugerido || fallback.tipoCasoSugerido),
        estadoSugerido: String(parsed.estadoSugerido || fallback.estadoSugerido),
        calidadClienteSugerida: String(parsed.calidadClienteSugerida || fallback.calidadClienteSugerida),
        resumen: String(parsed.resumen || fallback.resumen),
        hechosSugeridos: String(parsed.hechosSugeridos || fallback.hechosSugeridos),
        pretensionesSugeridas: String(parsed.pretensionesSugeridas || fallback.pretensionesSugeridas),
        palabrasClave: Array.isArray(parsed.palabrasClave) ? parsed.palabrasClave.map((item) => String(item)).filter(Boolean) : fallback.palabrasClave,
        proximaAccionSugerida: String(parsed.proximaAccionSugerida || fallback.proximaAccionSugerida),
        citaSugerida: {
          titulo: String(parsed.citaSugerida && typeof parsed.citaSugerida === "object" ? (parsed.citaSugerida as { titulo?: string }).titulo || fallback.citaSugerida.titulo : fallback.citaSugerida.titulo),
          tipo: String(parsed.citaSugerida && typeof parsed.citaSugerida === "object" ? (parsed.citaSugerida as { tipo?: string }).tipo || fallback.citaSugerida.tipo : fallback.citaSugerida.tipo),
          descripcion: String(parsed.citaSugerida && typeof parsed.citaSugerida === "object" ? (parsed.citaSugerida as { descripcion?: string }).descripcion || fallback.citaSugerida.descripcion : fallback.citaSugerida.descripcion),
        },
      };
    } catch (aiError) {
      console.warn("Fallo el analisis con OpenAI, se usa respaldo local:", aiError);
    }

    return NextResponse.json({
      suggestions,
      fallback: suggestions === fallback,
      model: suggestions === fallback ? "heuristic-intake" : process.env.OPENAI_MODEL || "gpt-4o-mini",
    });
  } catch (error) {
    console.error("Error analizando intake:", error);
    return NextResponse.json({ error: "No se pudo analizar el intake" }, { status: 500 });
  }
}
