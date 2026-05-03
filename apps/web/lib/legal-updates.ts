export type LegalAreaKey =
  | "todas"
  | "penal"
  | "civil"
  | "familia"
  | "disciplinario"
  | "administrativo"
  | "laboral";

export interface LegalAreaDefinition {
  key: LegalAreaKey;
  label: string;
  description: string;
  keywords: string[];
}

export interface OfficialMonitoringSource {
  id: string;
  name: string;
  type: "normativa" | "jurisprudencia";
  url: string;
  domains: string[];
  areas: LegalAreaKey[];
}

export interface LegalUpdateItem {
  title: string;
  type: "norma" | "jurisprudencia";
  source: string;
  date: string;
  summary: string;
  url: string;
  impact: string;
}

export interface LegalUpdatesPayload {
  area: LegalAreaKey;
  generatedAt: string;
  summary: string;
  legalUpdates: LegalUpdateItem[];
  jurisprudenceUpdates: LegalUpdateItem[];
  monitoringLinks: OfficialMonitoringSource[];
  usedFallback: boolean;
}

export const LEGAL_AREAS: LegalAreaDefinition[] = [
  {
    key: "todas",
    label: "Todas",
    description: "Vista transversal de la firma",
    keywords: ["normativa", "jurisprudencia", "actualizacion"],
  },
  {
    key: "penal",
    label: "Penal",
    description: "Delitos, proceso penal, casacion penal y tutela penal",
    keywords: ["penal", "procedimiento penal", "fiscalia", "casacion penal", "homicidio"],
  },
  {
    key: "civil",
    label: "Civil",
    description: "Obligaciones, contratos, responsabilidad y proceso civil",
    keywords: ["civil", "obligaciones", "contratos", "cgp", "ejecutivo"],
  },
  {
    key: "familia",
    label: "Familia",
    description: "Infancia, sucesiones, alimentos, custodia y familia",
    keywords: ["familia", "infancia", "adolescencia", "sucesion", "alimentos"],
  },
  {
    key: "disciplinario",
    label: "Disciplinario",
    description: "Control disciplinario de funcionarios y abogados",
    keywords: ["disciplinario", "abogado", "comision nacional de disciplina", "faltas"],
  },
  {
    key: "administrativo",
    label: "Administrativo",
    description: "Actos administrativos, CPACA, Consejo de Estado y funcion publica",
    keywords: ["administrativo", "cpaca", "contencioso", "consejo de estado"],
  },
  {
    key: "laboral",
    label: "Laboral",
    description: "Contrato de trabajo, seguridad social y casacion laboral",
    keywords: ["laboral", "cst", "seguridad social", "despido", "casacion laboral"],
  },
];

export const OFFICIAL_MONITORING_SOURCES: OfficialMonitoringSource[] = [
  {
    id: "suin",
    name: "SUIN-Juriscol",
    type: "normativa",
    url: "https://www.suin-juriscol.gov.co/",
    domains: ["suin-juriscol.gov.co"],
    areas: ["todas", "penal", "civil", "familia", "disciplinario", "administrativo", "laboral"],
  },
  {
    id: "senado",
    name: "Secretaria del Senado",
    type: "normativa",
    url: "http://www.secretariasenado.gov.co/senado/basedoc/",
    domains: ["secretariasenado.gov.co"],
    areas: ["todas", "penal", "civil", "familia", "disciplinario", "administrativo", "laboral"],
  },
  {
    id: "cc",
    name: "Relatoria Corte Constitucional",
    type: "jurisprudencia",
    url: "https://jurisprudencia.ramajudicial.gov.co/WebRelatoria/cc/index.xhtml",
    domains: ["jurisprudencia.ramajudicial.gov.co", "corteconstitucional.gov.co"],
    areas: ["todas", "penal", "civil", "familia", "disciplinario", "administrativo", "laboral"],
  },
  {
    id: "csj",
    name: "Relatoria Corte Suprema de Justicia",
    type: "jurisprudencia",
    url: "https://jurisprudencia.ramajudicial.gov.co/WebRelatoria/csj/index.html",
    domains: ["jurisprudencia.ramajudicial.gov.co"],
    areas: ["todas", "penal", "civil", "familia", "laboral"],
  },
  {
    id: "ce",
    name: "Relatoria Consejo de Estado",
    type: "jurisprudencia",
    url: "https://jurisprudencia.ramajudicial.gov.co/WebRelatoria/ce/index.xhtml",
    domains: ["jurisprudencia.ramajudicial.gov.co"],
    areas: ["todas", "administrativo", "disciplinario"],
  },
  {
    id: "cndj",
    name: "Comision Nacional de Disciplina Judicial",
    type: "jurisprudencia",
    url: "https://jurisprudencia.ramajudicial.gov.co/WebRelatoria/cndj/index.xhtml",
    domains: ["jurisprudencia.ramajudicial.gov.co"],
    areas: ["todas", "disciplinario"],
  },
];

const FALLBACK_UPDATES: Record<LegalAreaKey, Omit<LegalUpdatesPayload, "generatedAt" | "area" | "monitoringLinks" | "usedFallback">> = {
  todas: {
    summary:
      "Monitoreo transversal de normativa y jurisprudencia colombiana por fuentes oficiales.",
    legalUpdates: [
      {
        title: "Revisar resumen normativo SUIN del mes en curso",
        type: "norma",
        source: "SUIN-Juriscol",
        date: "2026-04-25",
        summary:
          "Usa el resumen normativo mensual de SUIN para identificar leyes, decretos y resoluciones recientes con impacto para la firma.",
        url: "https://www.suin-juriscol.gov.co/legislacion/historialboletines.html",
        impact: "Sirve como tablero diario de cambios normativos oficiales.",
      },
    ],
    jurisprudenceUpdates: [
      {
        title: "Consulta simultanea en Altas Cortes",
        type: "jurisprudencia",
        source: "Rama Judicial",
        date: "2026-04-25",
        summary:
          "La consulta tematica simultanea permite revisar novedades y criterios por corporacion desde un mismo portal oficial.",
        url: "https://jurisprudencia.ramajudicial.gov.co/WebRelatoria/consulta/index.xhtml",
        impact: "Ayuda a seguir lineas jurisprudenciales activas por tema.",
      },
    ],
  },
  penal: {
    summary:
      "Seguimiento de reformas penales, procedimiento penal y decisiones relevantes de salas penales.",
    legalUpdates: [
      {
        title: "Monitorear reformas al Codigo Penal y al CPP",
        type: "norma",
        source: "SUIN-Juriscol / Senado",
        date: "2026-04-25",
        summary:
          "Mantener vigilancia sobre leyes que modifiquen tipos penales, beneficios, principio de oportunidad y reparacion integral.",
        url: "http://www.secretariasenado.gov.co/senado/basedoc/ley_0599_2000.html",
        impact: "Impacta estrategia defensiva, imputacion y dosificacion punitiva.",
      },
    ],
    jurisprudenceUpdates: [
      {
        title: "Revisar relatoria penal de la Corte Suprema",
        type: "jurisprudencia",
        source: "Rama Judicial",
        date: "2026-04-25",
        summary:
          "Consultar providencias y criterios de casacion penal para actualizacion diaria del litigio penal.",
        url: "https://jurisprudencia.ramajudicial.gov.co/WebRelatoria/csj/index.html",
        impact: "Util para nulidades, tecnica de casacion y responsabilidad penal.",
      },
    ],
  },
  civil: {
    summary:
      "Monitoreo de contratos, obligaciones, proceso civil y decisiones de casacion civil.",
    legalUpdates: [
      {
        title: "Vigilancia sobre reformas civiles y procesales",
        type: "norma",
        source: "SUIN-Juriscol",
        date: "2026-04-25",
        summary:
          "Prioriza cambios en contratos, responsabilidad civil, titulos valores y tramites del CGP.",
        url: "https://www.suin-juriscol.gov.co/",
        impact: "Afecta demandas, contestaciones y medidas cautelares.",
      },
    ],
    jurisprudenceUpdates: [
      {
        title: "Relatoria civil y comercial de la Corte Suprema",
        type: "jurisprudencia",
        source: "Rama Judicial",
        date: "2026-04-25",
        summary:
          "Consultar lineas sobre incumplimiento contractual, pruebas, revision y recursos extraordinarios.",
        url: "https://jurisprudencia.ramajudicial.gov.co/WebRelatoria/csj/index.html",
        impact: "Clave para litigio ejecutivo, declarativo y contractual.",
      },
    ],
  },
  familia: {
    summary:
      "Seguimiento de infancia, adolescencia, sucesiones, alimentos y derechos fundamentales familiares.",
    legalUpdates: [
      {
        title: "Cambios en infancia, familia y proteccion integral",
        type: "norma",
        source: "SUIN-Juriscol",
        date: "2026-04-25",
        summary:
          "Revisar actos normativos con impacto en custodia, alimentos, adopcion y restablecimiento de derechos.",
        url: "https://www.suin-juriscol.gov.co/",
        impact: "Importa para procesos de familia y proteccion de menores.",
      },
    ],
    jurisprudenceUpdates: [
      {
        title: "Tutelas y decisiones de familia con enfoque constitucional",
        type: "jurisprudencia",
        source: "Corte Constitucional / Corte Suprema",
        date: "2026-04-25",
        summary:
          "Vigilar sentencias de tutela y casacion sobre interes superior del menor y derechos de familia.",
        url: "https://jurisprudencia.ramajudicial.gov.co/WebRelatoria/cc/index.xhtml",
        impact: "Refuerza argumentos sobre alimentos, custodia y salud.",
      },
    ],
  },
  disciplinario: {
    summary:
      "Novedades en control disciplinario de servidores y abogados, con seguimiento a CNDJ y Consejo de Estado.",
    legalUpdates: [
      {
        title: "Reformas al Codigo General Disciplinario y estatuto del abogado",
        type: "norma",
        source: "SUIN-Juriscol / Senado",
        date: "2026-04-25",
        summary:
          "Monitorear modificaciones que afecten faltas, sanciones, procedimientos y etica profesional.",
        url: "http://www.secretariasenado.gov.co/senado/basedoc/ley_1952_2019.html",
        impact: "Incide en defensa disciplinaria y cumplimiento profesional.",
      },
    ],
    jurisprudenceUpdates: [
      {
        title: "Consulta diaria de la Comision Nacional de Disciplina Judicial",
        type: "jurisprudencia",
        source: "Rama Judicial",
        date: "2026-04-25",
        summary:
          "Revisar sentencias disciplinarias y criterios sobre ejercicio profesional y faltas funcionales.",
        url: "https://jurisprudencia.ramajudicial.gov.co/WebRelatoria/cndj/index.xhtml",
        impact: "Clave para procesos de responsabilidad disciplinaria.",
      },
    ],
  },
  administrativo: {
    summary:
      "Seguimiento de CPACA, funcion administrativa, actos administrativos y jurisprudencia contenciosa.",
    legalUpdates: [
      {
        title: "Cambios en CPACA y reglamentacion administrativa",
        type: "norma",
        source: "SUIN-Juriscol",
        date: "2026-04-25",
        summary:
          "Monitorear decretos, resoluciones y reformas procedimentales con impacto en peticiones, recursos y medios de control.",
        url: "https://www.suin-juriscol.gov.co/",
        impact: "Afecta nulidad, restablecimiento, reparacion directa y cumplimiento.",
      },
    ],
    jurisprudenceUpdates: [
      {
        title: "Consejo de Estado: seguimiento contencioso",
        type: "jurisprudencia",
        source: "Rama Judicial",
        date: "2026-04-25",
        summary:
          "Consultar jurisprudencia reciente del Consejo de Estado para actos administrativos, responsabilidad estatal y asuntos electorales.",
        url: "https://jurisprudencia.ramajudicial.gov.co/WebRelatoria/ce/index.xhtml",
        impact: "Util para litigio contra entidades y control judicial de la administracion.",
      },
    ],
  },
  laboral: {
    summary:
      "Monitoreo de contrato de trabajo, seguridad social y decisiones recientes de la Sala Laboral.",
    legalUpdates: [
      {
        title: "Cambios normativos en el sector trabajo",
        type: "norma",
        source: "SUIN-Juriscol",
        date: "2026-04-25",
        summary:
          "Vigilar normas sobre salud mental en el trabajo, seguridad social, terminacion del contrato e indemnizaciones.",
        url: "https://www.suin-juriscol.gov.co/",
        impact: "Incide en demandas, defensas patronales y conciliaciones laborales.",
      },
    ],
    jurisprudenceUpdates: [
      {
        title: "Sala Laboral de la Corte Suprema",
        type: "jurisprudencia",
        source: "Rama Judicial",
        date: "2026-04-25",
        summary:
          "Consultar jurisprudencia y criterios sobre despido, prestaciones, pension, estabilidad reforzada y tecnica de casacion laboral.",
        url: "https://jurisprudencia.ramajudicial.gov.co/WebRelatoria/csj/index.html",
        impact: "Sirve para estrategia probatoria y lineas de casacion laboral.",
      },
    ],
  },
};

export function getAreaDefinition(area: string | null | undefined) {
  return LEGAL_AREAS.find((item) => item.key === area) ?? LEGAL_AREAS[0];
}

export function getMonitoringSourcesForArea(area: LegalAreaKey) {
  return OFFICIAL_MONITORING_SOURCES.filter(
    (item) => item.areas.includes("todas") || item.areas.includes(area)
  );
}

export function getFallbackLegalUpdates(area: LegalAreaKey): LegalUpdatesPayload {
  const base = FALLBACK_UPDATES[area] ?? FALLBACK_UPDATES.todas;
  return {
    area,
    generatedAt: new Date().toISOString(),
    summary: base.summary,
    legalUpdates: base.legalUpdates,
    jurisprudenceUpdates: base.jurisprudenceUpdates,
    monitoringLinks: getMonitoringSourcesForArea(area),
    usedFallback: true,
  };
}
