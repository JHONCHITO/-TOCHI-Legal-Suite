import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { consumeAiQuery } from "@/lib/subscription"

const plantillas: Record<string, (datos: any) => string> = {
  tutela: (datos) => `
SEÑOR
JUEZ DE TUTELA (REPARTO)
${datos.ciudad?.toUpperCase() || "E. S. D."}

REF: ACCIÓN DE TUTELA
ACCIONANTE: ${datos.demandante || "[NOMBRE DEL ACCIONANTE]"}
ACCIONADO: ${datos.demandado || "[NOMBRE DEL ACCIONADO]"}

${datos.demandante || "[NOMBRE DEL ACCIONANTE]"}, mayor de edad, identificado(a) como aparece al pie de mi firma, actuando en nombre propio, respetuosamente acudo ante su Despacho para interponer ACCIÓN DE TUTELA contra ${datos.demandado || "[NOMBRE DEL ACCIONADO]"}, por la vulneración de mis derechos fundamentales${datos.derechoVulnerado ? `, especialmente el derecho a ${datos.derechoVulnerado}` : ""}, con fundamento en los siguientes:

HECHOS

${datos.hechos || `PRIMERO: [Describir los hechos relevantes]

SEGUNDO: [Continuar con la descripción de los hechos]

TERCERO: [Hechos adicionales]`}

DERECHOS FUNDAMENTALES VULNERADOS

${datos.derechoVulnerado ? `Se vulnera el derecho fundamental a ${datos.derechoVulnerado}, consagrado en la Constitución Política de Colombia.` : "Se vulneran los derechos fundamentales consagrados en la Constitución Política de Colombia."}

FUNDAMENTOS DE DERECHO

${datos.fundamentos || `La presente acción se fundamenta en:

- Artículo 86 de la Constitución Política de Colombia
- Decreto 2591 de 1991
- Jurisprudencia de la Corte Constitucional`}

PRETENSIONES

${datos.pretensiones || `Solicito al señor Juez que TUTELE mis derechos fundamentales vulnerados y en consecuencia ORDENE:

1. [Primera pretensión]
2. [Segunda pretensión]
3. [Pretensiones adicionales]`}

PRUEBAS

1. Copia del documento de identidad del accionante.
2. [Enumerar las pruebas documentales]

JURAMENTO

Bajo la gravedad del juramento manifiesto que no he interpuesto otra acción de tutela por los mismos hechos y derechos.

NOTIFICACIONES

ACCIONANTE: [Dirección y datos de contacto]
ACCIONADO: [Dirección y datos de contacto]

Del señor Juez,

Atentamente,


_________________________
${datos.demandante || "[NOMBRE DEL ACCIONANTE]"}
C.C. No. [NÚMERO]
`,

  "derecho-peticion": (datos) => `
${datos.ciudad || "[CIUDAD]"}, ${new Date().toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" })}

SEÑORES
${datos.demandado || "[NOMBRE DE LA ENTIDAD O PERSONA]"}
${datos.juzgado || "[DIRECCIÓN]"}
Ciudad

REF: DERECHO DE PETICIÓN
ART. 23 CONSTITUCIÓN POLÍTICA - LEY 1755 DE 2015

${datos.demandante || "[NOMBRE DEL PETICIONARIO]"}, mayor de edad, identificado(a) con cédula de ciudadanía No. [NÚMERO], residente en [DIRECCIÓN], actuando en nombre propio, respetuosamente me dirijo a ustedes para formular DERECHO DE PETICIÓN, con fundamento en el artículo 23 de la Constitución Política y la Ley 1755 de 2015, en los siguientes términos:

HECHOS

${datos.hechos || `1. [Describir los hechos relevantes]

2. [Continuar con la descripción de los hechos]

3. [Hechos adicionales]`}

PETICIÓN

${datos.pretensiones || `Con fundamento en los hechos expuestos, respetuosamente solicito:

1. [Primera petición concreta]
2. [Segunda petición]
3. [Peticiones adicionales]`}

FUNDAMENTO JURÍDICO

${datos.fundamentos || `- Artículo 23 de la Constitución Política de Colombia
- Ley 1755 de 2015 (Derecho de Petición)
- [Otras normas aplicables]`}

PRUEBAS Y ANEXOS

1. Copia del documento de identidad
2. [Enumerar documentos anexos]

NOTIFICACIONES

Recibiré notificaciones en: [DIRECCIÓN]
Correo electrónico: [EMAIL]
Teléfono: [TELÉFONO]

Atentamente,


_________________________
${datos.demandante || "[NOMBRE DEL PETICIONARIO]"}
C.C. No. [NÚMERO]
`,

  "demanda-civil": (datos) => `
SEÑOR
JUEZ CIVIL ${datos.juzgado ? `- ${datos.juzgado}` : "(REPARTO)"}
${datos.ciudad?.toUpperCase() || "E. S. D."}

REF: DEMANDA [TIPO DE PROCESO]
DEMANDANTE: ${datos.demandante || "[NOMBRE DEL DEMANDANTE]"}
DEMANDADO: ${datos.demandado || "[NOMBRE DEL DEMANDADO]"}

${datos.demandante || "[NOMBRE DEL DEMANDANTE]"}, mayor de edad, identificado(a) como aparece al pie de mi firma, por medio del presente escrito me permito presentar DEMANDA [TIPO] contra ${datos.demandado || "[NOMBRE DEL DEMANDADO]"}, con fundamento en los siguientes:

HECHOS

${datos.hechos || `PRIMERO: [Describir los hechos relevantes de manera cronológica]

SEGUNDO: [Continuar con la descripción de los hechos]

TERCERO: [Hechos adicionales que fundamentan la demanda]`}

PRETENSIONES

${datos.pretensiones || `Solicito al señor Juez que mediante sentencia se declare y condene:

PRIMERA: [Primera pretensión principal]

SEGUNDA: [Segunda pretensión]

SUBSIDIARIA: [En caso de no prosperar las anteriores...]`}

FUNDAMENTOS DE DERECHO

${datos.fundamentos || `La presente demanda se fundamenta en:

- Código General del Proceso (Ley 1564 de 2012)
- Código Civil Colombiano
- [Normas específicas aplicables al caso]`}

PRUEBAS

Solicito se decreten y practiquen las siguientes pruebas:

DOCUMENTALES:
1. [Enumerar documentos]

TESTIMONIALES:
1. [Nombre y dirección de testigos]

CUANTÍA Y COMPETENCIA

[Establecer la cuantía del proceso y la competencia del juez]

PROCEDIMIENTO

La presente demanda se tramitará por el procedimiento [verbal/verbal sumario/ordinario].

ANEXOS

1. Copia de la demanda para traslado
2. Poder debidamente otorgado
3. [Enumerar anexos]

NOTIFICACIONES

DEMANDANTE: [Dirección y datos de contacto]
DEMANDADO: [Dirección para notificación]

Del señor Juez,

Atentamente,


_________________________
${datos.demandante || "[NOMBRE]"}
C.C. No. [NÚMERO]
T.P. No. [NÚMERO] (si es abogado)
`,

  "demanda-laboral": (datos) => `
SEÑOR
JUEZ LABORAL DEL CIRCUITO ${datos.juzgado ? `- ${datos.juzgado}` : "(REPARTO)"}
${datos.ciudad?.toUpperCase() || "E. S. D."}

REF: DEMANDA ORDINARIA LABORAL
DEMANDANTE: ${datos.demandante || "[NOMBRE DEL TRABAJADOR]"}
DEMANDADO: ${datos.demandado || "[NOMBRE DEL EMPLEADOR]"}

${datos.demandante || "[NOMBRE DEL TRABAJADOR]"}, mayor de edad, identificado(a) como aparece al pie de mi firma, por medio del presente escrito presento DEMANDA ORDINARIA LABORAL contra ${datos.demandado || "[NOMBRE DEL EMPLEADOR]"}, para que previos los trámites del proceso ordinario laboral, se profieran las declaraciones y condenas que adelante se indicarán.

HECHOS

${datos.hechos || `PRIMERO: El demandante laboró al servicio del demandado desde el [FECHA INICIO] hasta el [FECHA TERMINACIÓN].

SEGUNDO: El cargo desempeñado fue [CARGO] con un salario de [VALOR].

TERCERO: [Describir las circunstancias de la terminación del contrato]

CUARTO: [Hechos adicionales relevantes]`}

PRETENSIONES

${datos.pretensiones || `Solicito al señor Juez que mediante sentencia declare y condene:

PRIMERA: Que existió contrato de trabajo entre las partes.

SEGUNDA: Que el demandado debe pagar al demandante las siguientes sumas:
- Cesantías: $[VALOR]
- Intereses sobre cesantías: $[VALOR]
- Prima de servicios: $[VALOR]
- Vacaciones: $[VALOR]
- Indemnización por despido injusto: $[VALOR]

TERCERA: Que se condene al demandado a pagar la indexación de las sumas adeudadas.

CUARTA: Que se condene en costas al demandado.`}

FUNDAMENTOS DE DERECHO

${datos.fundamentos || `- Código Sustantivo del Trabajo
- Código Procesal del Trabajo y de la Seguridad Social
- Ley 50 de 1990
- Ley 789 de 2002
- Jurisprudencia de la Corte Suprema de Justicia, Sala Laboral`}

PRUEBAS

DOCUMENTALES:
1. Contrato de trabajo (si existe)
2. Desprendibles de nómina
3. Certificación laboral
4. [Otros documentos]

TESTIMONIALES:
1. [Nombre y datos de testigos]

EXHIBICIÓN DE DOCUMENTOS:
Solicito se ordene al demandado exhibir: [nóminas, planillas, etc.]

COMPETENCIA

Es competente el Juez Laboral del Circuito de ${datos.ciudad || "[CIUDAD]"} por el domicilio del demandado.

CUANTÍA

La cuantía de las pretensiones supera los 20 SMLMV.

ANEXOS

1. Poder debidamente otorgado
2. Copia de la demanda para traslado
3. [Enumerar documentos anexos]

NOTIFICACIONES

DEMANDANTE: [Dirección y datos de contacto]
DEMANDADO: [Dirección para notificación personal]

Del señor Juez,

Atentamente,


_________________________
${datos.demandante || "[NOMBRE]"}
C.C. No. [NÚMERO]
T.P. No. [NÚMERO]
`,

  contestacion: (datos) => `
SENOR
JUEZ ${datos.juzgado || "[JUZGADO]"}
${datos.ciudad?.toUpperCase() || "E. S. D."}

REF: CONTESTACION DE DEMANDA
DEMANDANTE: ${datos.demandante || "[NOMBRE DEL DEMANDANTE]"}
DEMANDADO: ${datos.demandado || "[NOMBRE DEL DEMANDADO]"}

${datos.demandado || "[NOMBRE DEL DEMANDADO]"}, identificado(a) como aparece al pie de mi firma, dentro del termino legal y por conducto de apoderado, me permito contestar la demanda de la referencia en los siguientes terminos:

PRONUNCIAMIENTO FRENTE A LOS HECHOS

${datos.hechos || `1. Se aceptan los hechos que sean expresamente ciertos.

2. Se niegan los que no sean ciertos o no consten en documentos.

3. [Desarrollar la contestacion concreta de cada hecho].`}

PRONUNCIAMIENTO FRENTE A LAS PRETENSIONES

${datos.pretensiones || `Me opongo a las pretensiones de la demanda por carecer de fundamento factico y juridico suficiente.

Solicito se nieguen todas las pretensiones de la parte demandante.`}

EXCEPCIONES Y DEFENSAS

${datos.fundamentos || `1. Inexistencia de los presupuestos facticos invocados.
2. Falta de sustento probatorio suficiente.
3. Las demas excepciones que resulten probadas dentro del proceso.`}

PRUEBAS

Solicito tener y decretar las siguientes pruebas:

1. Documentales: [Relacionar documentos]
2. Testimoniales: [Relacionar testigos]
3. Interrogatorio de parte: [Si aplica]

NOTIFICACIONES

DEMANDADO: [Direccion, correo y telefono]
APODERADO: [Direccion, correo y telefono]

Atentamente,


_________________________
${datos.demandado || "[NOMBRE]"}
C.C. No. [NUMERO]
T.P. No. [NUMERO]
`,

  poder: (datos) => `
PODER ESPECIAL

${datos.demandante || "[NOMBRE DEL PODERDANTE]"}, mayor de edad, identificado(a) con cédula de ciudadanía No. [NÚMERO] de [LUGAR], domiciliado(a) en ${datos.ciudad || "[CIUDAD]"}, por medio del presente escrito confiero PODER ESPECIAL amplio y suficiente al abogado(a) ${datos.demandado || "[NOMBRE DEL APODERADO]"}, identificado(a) con cédula de ciudadanía No. [NÚMERO] y Tarjeta Profesional No. [NÚMERO], para que en mi nombre y representación:

${datos.pretensiones || `1. Me represente en el proceso [TIPO DE PROCESO] que adelantaré contra/ante [PARTE CONTRARIA/ENTIDAD].

2. Presente demandas, contestaciones, recursos, memoriales y cualquier actuación procesal necesaria.

3. Asista a audiencias, diligencias y conciliaciones.

4. Reciba notificaciones.

5. Desista, transija, concilie y suscriba acuerdos cuando lo considere conveniente para mis intereses.

6. Sustituya el presente poder de ser necesario.`}

HECHOS QUE FUNDAMENTAN ESTE PODER:

${datos.hechos || "[Breve descripción de los hechos que originan el proceso]"}

El apoderado queda facultado para recibir y disponer del dinero que se obtenga como resultado del proceso.

NOTIFICACIONES:

Poderdante: [Dirección, teléfono y correo]
Apoderado: [Dirección, teléfono y correo]

Dado en ${datos.ciudad || "[CIUDAD]"}, a los ${new Date().toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" })}.

ACEPTO:


_________________________          _________________________
PODERDANTE                         APODERADO
${datos.demandante || "[NOMBRE]"}                    ${datos.demandado || "[NOMBRE]"}
C.C. No.                           C.C. No.
                                   T.P. No.
`,

  memorial: (datos) => `
SEÑOR
JUEZ ${datos.juzgado || "[JUZGADO]"}
${datos.ciudad?.toUpperCase() || "E. S. D."}

REF: [TIPO DE PROCESO]
RADICADO: [NÚMERO]
DEMANDANTE: ${datos.demandante || "[NOMBRE]"}
DEMANDADO: ${datos.demandado || "[NOMBRE]"}

${datos.demandante || "[NOMBRE]"}, identificado(a) como aparece al pie de mi firma, actuando como [apoderado/parte] dentro del proceso de la referencia, respetuosamente me permito presentar el siguiente:

MEMORIAL

${datos.hechos || `[Exponer el asunto del memorial]`}

PETICIÓN

${datos.pretensiones || `Solicito al Despacho:

1. [Primera solicitud]
2. [Segunda solicitud]`}

FUNDAMENTO

${datos.fundamentos || `[Normas o argumentos que sustentan la petición]`}

Del señor Juez,

Atentamente,


_________________________
${datos.demandante || "[NOMBRE]"}
C.C. No. [NÚMERO]
T.P. No. [NÚMERO]

NOTIFICACIONES: [Dirección y correo electrónico]
`,
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { tipo, datos } = await request.json()

    if (!tipo) {
      return NextResponse.json(
        { error: "Tipo de documento requerido" },
        { status: 400 }
      )
    }

    try {
      await consumeAiQuery(session.user.id)
    } catch (limitError) {
      return NextResponse.json(
        { error: limitError instanceof Error ? limitError.message : "Limite de IA alcanzado" },
        { status: 403 }
      )
    }

    // Buscar la plantilla correspondiente
    const generarDocumento = plantillas[tipo]
    
    if (!generarDocumento) {
      // Si no hay plantilla específica, generar una genérica
      const documentoGenerico = `
DOCUMENTO LEGAL

Tipo: ${tipo.toUpperCase().replace(/-/g, " ")}
Fecha: ${new Date().toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" })}

PARTES:
- ${datos.demandante || "[PARTE 1]"}
- ${datos.demandado || "[PARTE 2]"}

CONTENIDO:

${datos.hechos || "[Contenido del documento]"}

SOLICITUD/OBJETO:

${datos.pretensiones || "[Objeto del documento]"}

FUNDAMENTO LEGAL:

${datos.fundamentos || "[Fundamento jurídico]"}

---
Documento generado automáticamente. Revisar y ajustar según corresponda.
`
      return NextResponse.json({ documento: documentoGenerico })
    }

    const documento = generarDocumento(datos)

    return NextResponse.json({ documento })
  } catch (error) {
    console.error("Error generando documento:", error)
    return NextResponse.json(
      { error: "Error al generar el documento" },
      { status: 500 }
    )
  }
}
