import { CODIGOS_COLOMBIANOS, type CodigoLegalData } from "@/lib/types";
import penalCodeData from "@/data/codigo_penal.json";

export interface LegalArticleSummary {
  numero: string;
  epigrafe: string;
  resumen: string;
  contenido?: string;
  libro?: string;
  titulo?: string;
  capitulo?: string;
  vigente: boolean;
  palabrasClave?: string[];
}

export interface LegalCodeContent {
  codigo: string;
  descripcion: string;
  nivelContenido: "resumen_local" | "solo_fuentes";
  articulos: LegalArticleSummary[];
  temasClave: string[];
  notas?: string[];
}

export function normalizeLegalSlug(value: string) {
  return value.toLowerCase().replace(/-/g, "_");
}

export function toLegalSlug(value: string) {
  return normalizeLegalSlug(value);
}

export function getCodigoLegal(codigo: string) {
  const slug = normalizeLegalSlug(codigo);
  return CODIGOS_COLOMBIANOS.find(
    (item) => normalizeLegalSlug(item.codigo) === slug
  );
}

function buildArticleFromJson(article: any): LegalArticleSummary {
  return {
    numero: article.numero,
    epigrafe: article.titulo || article.numero,
    resumen: article.contenido
      ? article.contenido.slice(0, 140).trim() + "..."
      : "Resumen no disponible.",
    contenido: article.contenido,
    titulo: article.titulo,
    vigente: true,
    palabrasClave: [article.numero, ...(article.titulo?.split(" ") ?? [])].map((item) => item.toString().toLowerCase()),
  };
}

const JSON_LEGAL_LIBRARY: Record<string, LegalCodeContent> = {
  codigo_penal: {
    codigo: "CODIGO_PENAL",
    descripcion: "Texto básico del Código Penal Colombiano extraído de la base de datos interna.",
    nivelContenido: "resumen_local",
    temasClave: ["delitos", "legalidad penal", "procedimiento penal"],
    articulos: (penalCodeData.articulos || []).map(buildArticleFromJson),
    notas: [
      "Contenido cargado desde data/codigo_penal.json para una consulta más profunda en el módulo penal.",
    ],
  },
};

export function getLegalCodeContent(codigo: string): LegalCodeContent {
  const slug = normalizeLegalSlug(codigo);

  const base = LEGAL_CODE_LIBRARY[slug];
  const jsonContent = JSON_LEGAL_LIBRARY[slug];

  if (slug === "codigo_penal" || slug === "penal") {
    return jsonContent ?? base ?? {
      codigo: "CODIGO_PENAL",
      descripcion: "Código Penal Colombiano",
      nivelContenido: "solo_fuentes",
      temasClave: ["delitos"],
      articulos: [],
    };
  }

  if (base) {
    return base;
  }

  if (slug === "codigo_civil" || slug === "civil") {
    return {
      codigo: "CODIGO_CIVIL",
      descripcion: "Código Civil Colombiano",
      nivelContenido: "resumen_local",
      temasClave: ["obligaciones", "contratos"],
      articulos: [
        {
          numero: "1502",
          epigrafe: "Requisitos para obligarse",
          resumen:
            "Capacidad, consentimiento, objeto lícito y causa lícita.",
          contenido:
            "Para que haya obligación se requiere capacidad para obligarse, consentimiento libre de vicios, objeto lícito y causa lícita.",
          vigente: true,
          palabrasClave: ["1502", "contratos", "capacidad"]
        },
        {
          numero: "1495",
          epigrafe: "Definición de contrato",
          resumen:
            "Acto por el cual una parte se obliga con otra.",
          contenido:
            "El contrato es un acto por el cual una persona se obliga para con otra a dar, hacer o no hacer alguna cosa.",
          vigente: true,
          palabrasClave: ["1495", "contrato", "obligacion"]
        }
      ]
    };
  }

  return {
    codigo: slug.toUpperCase(),
    descripcion: "Contenido no disponible aún",
    nivelContenido: "solo_fuentes",
    temasClave: [],
    articulos: [],
  };
}

export function getOfficialLegalResources(codigoData: CodigoLegalData) {
  return [
    { label: "Fuente oficial", url: codigoData.urlOficial },
    { label: "SUIN", url: codigoData.urlSUIN },
    { label: "Senado", url: codigoData.urlSenado },
  ].filter((item) => Boolean(item.url));
}

export const LEGAL_CODE_LIBRARY: Record<string, LegalCodeContent> = {
  constitucion_1991: {
    codigo: "CONSTITUCION_1991",
    descripcion:
      "Resumen operativo de articulos clave para derechos fundamentales, debido proceso y accion de tutela.",
    nivelContenido: "resumen_local",
    temasClave: [
      "Estado social de derecho",
      "Debido proceso",
      "Igualdad",
      "Tutela",
    ],
    notas: [
      "Este modulo muestra resumenes practicos y siempre debe contrastarse con la fuente oficial.",
    ],
    articulos: [
      {
        numero: "1",
        epigrafe: "Estado social de derecho",
        resumen:
          "Fija la base constitucional del Estado colombiano y sirve como criterio transversal para interpretar derechos, cargas publicas y proteccion judicial.",
        titulo: "Principios fundamentales",
        vigente: true,
        palabrasClave: ["estado social", "principios", "dignidad"],
      },
      {
        numero: "13",
        epigrafe: "Igualdad",
        resumen:
          "Consagra igualdad ante la ley y obliga a las autoridades a evitar discriminacion y adoptar medidas de proteccion reforzada cuando sea necesario.",
        titulo: "Derechos fundamentales",
        vigente: true,
        palabrasClave: ["igualdad", "discriminacion"],
      },
      {
        numero: "29",
        epigrafe: "Debido proceso",
        resumen:
          "Exige juez competente, formas propias de cada juicio, defensa y aplicacion preferente de la norma penal favorable. Es central en litigio judicial y administrativo.",
        titulo: "Derechos fundamentales",
        vigente: true,
        palabrasClave: ["debido proceso", "defensa", "juez competente"],
      },
      {
        numero: "86",
        epigrafe: "Accion de tutela",
        resumen:
          "Permite reclamar proteccion inmediata de derechos fundamentales cuando exista amenaza o vulneracion atribuible a autoridad publica o, en ciertos casos, a particulares.",
        titulo: "Proteccion de los derechos",
        vigente: true,
        palabrasClave: ["tutela", "derechos fundamentales"],
      },
    ],
  },
  codigo_civil: {
    codigo: "CODIGO_CIVIL",
    descripcion:
      "Base de obligaciones, contratos, personas, bienes, familia y sucesiones.",
    nivelContenido: "resumen_local",
    temasClave: ["obligaciones", "contratos", "capacidad", "causa licita"],
    articulos: [
      {
        numero: "1494",
        epigrafe: "Fuentes de las obligaciones",
        resumen:
          "Ubica el origen de las obligaciones en contratos, hechos voluntarios, hechos danos y disposiciones legales.",
        libro: "Cuarto",
        titulo: "Obligaciones en general",
        capitulo: "Definiciones",
        vigente: true,
        palabrasClave: ["obligaciones", "contratos", "cuasicontratos"],
      },
      {
        numero: "1495",
        epigrafe: "Definicion de contrato",
        resumen:
          "Explica que el contrato es un acto por el cual una parte se obliga con otra a dar, hacer o no hacer una cosa.",
        libro: "Cuarto",
        titulo: "Obligaciones en general",
        capitulo: "Definiciones",
        vigente: true,
        palabrasClave: ["contrato", "convencion"],
      },
      {
        numero: "1502",
        epigrafe: "Requisitos para obligarse",
        resumen:
          "Exige capacidad, consentimiento libre de vicios, objeto licito y causa licita. Es uno de los articulos mas consultados en litigio civil y comercial.",
        libro: "Cuarto",
        titulo: "Obligaciones en general",
        capitulo: "Actos y declaraciones de voluntad",
        vigente: true,
        palabrasClave: ["1502", "capacidad", "objeto licito", "causa licita"],
      },
      {
        numero: "1503",
        epigrafe: "Presuncion de capacidad",
        resumen:
          "Parte de la regla general de capacidad salvo incapacidad declarada por la ley.",
        libro: "Cuarto",
        titulo: "Obligaciones en general",
        capitulo: "Actos y declaraciones de voluntad",
        vigente: true,
        palabrasClave: ["capacidad", "presuncion"],
      },
    ],
  },
  codigo_comercio: {
    codigo: "CODIGO_COMERCIO",
    descripcion:
      "Marco principal para actos mercantiles, comerciantes, sociedades, titulos valores y contratos comerciales.",
    nivelContenido: "resumen_local",
    temasClave: ["actos mercantiles", "sociedades", "titulos valores"],
    articulos: [
      {
        numero: "10",
        epigrafe: "Comerciantes",
        resumen:
          "Identifica quienes adquieren la calidad de comerciante por ejercer profesionalmente actividades mercantiles.",
        titulo: "Comerciantes y actos de comercio",
        vigente: true,
        palabrasClave: ["comerciantes", "actividad mercantil"],
      },
      {
        numero: "20",
        epigrafe: "Actos, operaciones y empresas mercantiles",
        resumen:
          "Lista actos y operaciones reputados mercantiles para efectos de competencia, prueba y regimen aplicable.",
        titulo: "Comerciantes y actos de comercio",
        vigente: true,
        palabrasClave: ["actos de comercio", "operaciones mercantiles"],
      },
      {
        numero: "98",
        epigrafe: "Contrato de sociedad",
        resumen:
          "Describe la sociedad como contrato por el cual dos o mas personas hacen aportes para repartirse utilidades dentro de una actividad o empresa social.",
        titulo: "Sociedades comerciales",
        vigente: true,
        palabrasClave: ["sociedad", "aportes", "utilidades"],
      },
    ],
  },
  codigo_penal: {
    codigo: "CODIGO_PENAL",
    descripcion:
      "Resume principios rectores, estructura de responsabilidad penal y delitos frecuentes.",
    nivelContenido: "resumen_local",
    temasClave: ["dignidad humana", "conducta punible", "homicidio"],
    articulos: [
      {
        numero: "1",
        epigrafe: "Dignidad humana",
        resumen:
          "Presenta la dignidad humana como fundamento del derecho penal colombiano.",
        titulo: "Normas rectoras",
        vigente: true,
        palabrasClave: ["dignidad humana", "principios penales"],
      },
      {
        numero: "9",
        epigrafe: "Conducta punible",
        resumen:
          "Exige tipicidad, antijuridicidad y culpabilidad para afirmar responsabilidad penal.",
        titulo: "Normas rectoras",
        vigente: true,
        palabrasClave: ["tipicidad", "antijuridicidad", "culpabilidad"],
      },
      {
        numero: "103",
        epigrafe: "Homicidio",
        resumen:
          "Tipifica el homicidio y establece la consecuencia punitiva base para este delito.",
        titulo: "Delitos contra la vida",
        vigente: true,
        palabrasClave: ["homicidio", "vida"],
      },
    ],
  },
  codigo_procedimiento_penal: {
    codigo: "CODIGO_PROCEDIMIENTO_PENAL",
    descripcion:
      "Puntos de referencia para actuacion penal, oralidad, partes e investigacion.",
    nivelContenido: "resumen_local",
    temasClave: ["oralidad", "debido proceso penal", "intervinientes"],
    articulos: [
      {
        numero: "9",
        epigrafe: "Oralidad",
        resumen:
          "La actuacion se desarrolla principalmente de manera oral y en audiencias, con reglas de inmediacion y contradiccion.",
        titulo: "Principios rectores y garantias",
        vigente: true,
        palabrasClave: ["oralidad", "audiencias"],
      },
      {
        numero: "10",
        epigrafe: "Actuacion procesal",
        resumen:
          "Determina que la actuacion debe surtirse con respeto por derechos, garantias y estructura del sistema acusatorio.",
        titulo: "Principios rectores y garantias",
        vigente: true,
        palabrasClave: ["garantias", "sistema acusatorio"],
      },
      {
        numero: "114",
        epigrafe: "Atribuciones de la Fiscalia",
        resumen:
          "Reune funciones de direccion de la investigacion, imputacion y acusacion dentro del proceso penal.",
        titulo: "Fiscalia General de la Nacion",
        vigente: true,
        palabrasClave: ["fiscalia", "investigacion", "acusacion"],
      },
    ],
  },
  codigo_general_proceso: {
    codigo: "CODIGO_GENERAL_PROCESO",
    descripcion:
      "Herramienta transversal para litigio civil, comercial, de familia y agrario.",
    nivelContenido: "resumen_local",
    temasClave: ["objeto", "demanda", "competencia", "prueba"],
    articulos: [
      {
        numero: "1",
        epigrafe: "Objeto",
        resumen:
          "Define el alcance del CGP para asuntos civiles, comerciales, de familia y agrarios, y su aplicacion supletoria en otros tramites.",
        titulo: "Disposiciones generales",
        vigente: true,
        palabrasClave: ["objeto", "alcance"],
      },
      {
        numero: "82",
        epigrafe: "Requisitos de la demanda",
        resumen:
          "Organiza la informacion minima que debe contener una demanda para ser admitida.",
        titulo: "Demanda y contestacion",
        vigente: true,
        palabrasClave: ["demanda", "requisitos"],
      },
      {
        numero: "90",
        epigrafe: "Admision de la demanda",
        resumen:
          "Ordena admitir la demanda cuando cumpla los requisitos y encauzarla por el tramite procesal adecuado.",
        titulo: "Demanda y contestacion",
        vigente: true,
        palabrasClave: ["admision", "demanda"],
      },
    ],
  },
  codigo_sustantivo_trabajo: {
    codigo: "CODIGO_SUSTANTIVO_TRABAJO",
    descripcion:
      "Nucleo laboral para contrato de trabajo, subordinacion, justa causa e indemnizaciones.",
    nivelContenido: "resumen_local",
    temasClave: ["contrato de trabajo", "justa causa", "indemnizacion"],
    articulos: [
      {
        numero: "1",
        epigrafe: "Objeto",
        resumen:
          "Fija como finalidad la justicia en las relaciones entre empleadores y trabajadores.",
        titulo: "Preliminar",
        vigente: true,
        palabrasClave: ["objeto", "justicia laboral"],
      },
      {
        numero: "22",
        epigrafe: "Definicion de contrato de trabajo",
        resumen:
          "Resume los elementos clasicos del contrato laboral: servicio personal, subordinacion y remuneracion.",
        titulo: "Contrato individual de trabajo",
        capitulo: "Definicion y normas generales",
        vigente: true,
        palabrasClave: ["contrato de trabajo", "subordinacion", "salario"],
      },
      {
        numero: "62",
        epigrafe: "Terminacion por justa causa",
        resumen:
          "Recoge las causas que permiten terminar unilateralmente el contrato por parte del empleador o del trabajador.",
        titulo: "Contrato individual de trabajo",
        capitulo: "Terminacion del contrato",
        vigente: true,
        palabrasClave: ["justa causa", "terminacion"],
      },
      {
        numero: "64",
        epigrafe: "Terminacion sin justa causa",
        resumen:
          "Sirve de referencia para discutir indemnizacion y efectos economicos del despido sin justa causa.",
        titulo: "Contrato individual de trabajo",
        capitulo: "Terminacion del contrato",
        vigente: true,
        palabrasClave: ["indemnizacion", "despido"],
      },
    ],
  },
  cpaca: {
    codigo: "CPACA",
    descripcion:
      "Base administrativa para actuaciones ante entidades y litigio contencioso administrativo.",
    nivelContenido: "resumen_local",
    temasClave: ["actuacion administrativa", "debido proceso", "medios de control"],
    articulos: [
      {
        numero: "3",
        epigrafe: "Principios",
        resumen:
          "Orienta la funcion administrativa con igualdad, moralidad, eficacia, economia, celeridad, imparcialidad y publicidad.",
        titulo: "Disposiciones generales",
        vigente: true,
        palabrasClave: ["principios", "funcion administrativa"],
      },
      {
        numero: "13",
        epigrafe: "Objeto y modalidades del derecho de peticion",
        resumen:
          "Organiza el derecho de peticion y su alcance frente a autoridades y ciertos particulares.",
        titulo: "Derecho de peticion",
        vigente: true,
        palabrasClave: ["derecho de peticion"],
      },
      {
        numero: "138",
        epigrafe: "Nulidad y restablecimiento del derecho",
        resumen:
          "Es uno de los medios de control mas usados para discutir actos administrativos individuales.",
        titulo: "Medios de control",
        vigente: true,
        palabrasClave: ["nulidad", "restablecimiento del derecho"],
      },
    ],
  },
  codigo_infancia_adolescencia: {
    codigo: "CODIGO_INFANCIA_ADOLESCENCIA",
    descripcion:
      "Proteccion integral de ninos, ninas y adolescentes, con enfoque de derechos y prevalencia.",
    nivelContenido: "resumen_local",
    temasClave: ["interes superior", "proteccion integral", "restablecimiento"],
    articulos: [
      {
        numero: "1",
        epigrafe: "Finalidad",
        resumen:
          "Establece reglas para garantizar el desarrollo integral y el ejercicio pleno de derechos de la infancia y adolescencia.",
        titulo: "Disposiciones generales",
        vigente: true,
        palabrasClave: ["finalidad", "proteccion integral"],
      },
      {
        numero: "8",
        epigrafe: "Interes superior",
        resumen:
          "Orienta decisiones judiciales y administrativas dando prioridad al interes superior del menor.",
        titulo: "Principios rectores",
        vigente: true,
        palabrasClave: ["interes superior", "menores"],
      },
      {
        numero: "50",
        epigrafe: "Restablecimiento de derechos",
        resumen:
          "Organiza las medidas institucionales cuando exista amenaza o vulneracion de derechos de menores.",
        titulo: "Proteccion integral",
        vigente: true,
        palabrasClave: ["restablecimiento", "derechos de menores"],
      },
    ],
  },
  codigo_general_disciplinario: {
    codigo: "CODIGO_GENERAL_DISCIPLINARIO",
    descripcion:
      "Referencia para responsabilidad disciplinaria de servidores publicos y particulares disciplinables.",
    nivelContenido: "resumen_local",
    temasClave: ["falta disciplinaria", "culpabilidad", "sanciones"],
    articulos: [
      {
        numero: "5",
        epigrafe: "Ilicitud sustancial",
        resumen:
          "La falta disciplinaria se estructura cuando se afecta el deber funcional sin justificacion.",
        titulo: "Principios rectores",
        vigente: true,
        palabrasClave: ["ilicitud sustancial", "deber funcional"],
      },
      {
        numero: "26",
        epigrafe: "Dolo y culpa",
        resumen:
          "Distingue la forma subjetiva de realizacion de la falta disciplinaria.",
        titulo: "Responsabilidad disciplinaria",
        vigente: true,
        palabrasClave: ["dolo", "culpa"],
      },
      {
        numero: "44",
        epigrafe: "Clases de sanciones",
        resumen:
          "Resume sanciones como destitucion, suspension, multa e inhabilidad segun la gravedad.",
        titulo: "Sanciones",
        vigente: true,
        palabrasClave: ["sanciones", "destitucion", "suspension"],
      },
    ],
  },
  estatuto_tributario: {
    codigo: "ESTATUTO_TRIBUTARIO",
    descripcion:
      "Punto de apoyo para obligaciones tributarias, declaraciones, sanciones e impuestos nacionales.",
    nivelContenido: "resumen_local",
    temasClave: ["obligaciones formales", "declaraciones", "sanciones"],
    articulos: [
      {
        numero: "571",
        epigrafe: "Obligados a cumplir deberes formales",
        resumen:
          "Define quienes deben presentar declaraciones, suministrar informacion y cumplir cargas tributarias formales.",
        titulo: "Deberes y obligaciones formales",
        vigente: true,
        palabrasClave: ["deberes formales", "declaraciones"],
      },
      {
        numero: "580",
        epigrafe: "Declaraciones que se tienen por no presentadas",
        resumen:
          "Resume eventos en que la declaracion carece de efectos juridicos por omisiones relevantes.",
        titulo: "Declaraciones tributarias",
        vigente: true,
        palabrasClave: ["no presentada", "declaracion"],
      },
      {
        numero: "641",
        epigrafe: "Extemporaneidad",
        resumen:
          "Expone la sancion por presentar declaraciones despues del plazo legal.",
        titulo: "Sanciones",
        vigente: true,
        palabrasClave: ["extemporaneidad", "sancion"],
      },
    ],
  },
};
