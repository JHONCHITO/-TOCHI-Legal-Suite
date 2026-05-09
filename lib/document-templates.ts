import type { CaseType } from "@/lib/models/Case";

export type LegalTemplateId =
  | "demanda-civil"
  | "demanda-laboral"
  | "tutela"
  | "derecho-peticion"
  | "poder"
  | "memorial"
  | "contestacion";

export type LegalTemplateDefinition = {
  value: LegalTemplateId;
  label: string;
  description: string;
  documentType: string;
};

export const LEGAL_TEMPLATES: LegalTemplateDefinition[] = [
  {
    value: "demanda-civil",
    label: "Demanda civil",
    description: "Borrador para litigios civiles y comerciales.",
    documentType: "demanda",
  },
  {
    value: "demanda-laboral",
    label: "Demanda laboral",
    description: "Escrito inicial para procesos laborales.",
    documentType: "demanda",
  },
  {
    value: "tutela",
    label: "Accion de tutela",
    description: "Proteccion urgente de derechos fundamentales.",
    documentType: "tutela",
  },
  {
    value: "derecho-peticion",
    label: "Derecho de peticion",
    description: "Solicitud formal ante entidad o particular.",
    documentType: "derecho_peticion",
  },
  {
    value: "poder",
    label: "Poder especial",
    description: "Otorgamiento de poder para el expediente.",
    documentType: "poder",
  },
  {
    value: "contestacion",
    label: "Contestacion",
    description: "Respuesta tecnica a una demanda o requerimiento.",
    documentType: "contestacion",
  },
  {
    value: "memorial",
    label: "Memorial",
    description: "Escrito procesal generico para impulso o soporte.",
    documentType: "memorial",
  },
];

const TEMPLATE_BY_CASE_TYPE: Record<CaseType, LegalTemplateId> = {
  civil: "demanda-civil",
  comercial: "demanda-civil",
  laboral: "demanda-laboral",
  constitucional: "tutela",
  administrativo: "derecho-peticion",
  familia: "memorial",
  penal: "memorial",
  tributario: "memorial",
  otro: "memorial",
};

const TEMPLATES_BY_CASE_TYPE: Record<CaseType, LegalTemplateId[]> = {
  civil: ["demanda-civil", "contestacion", "poder", "memorial"],
  comercial: ["demanda-civil", "contestacion", "poder", "memorial"],
  laboral: ["demanda-laboral", "memorial", "poder"],
  constitucional: ["tutela", "derecho-peticion", "memorial"],
  administrativo: ["derecho-peticion", "memorial", "poder"],
  familia: ["memorial", "poder", "demanda-civil"],
  penal: ["memorial", "poder", "contestacion"],
  tributario: ["memorial", "derecho-peticion", "poder"],
  otro: ["memorial", "poder", "derecho-peticion"],
};

export function getDefaultTemplateForCaseType(caseType?: string) {
  const typedCaseType = caseType && caseType in TEMPLATE_BY_CASE_TYPE
    ? (caseType as CaseType)
    : "otro";
  return TEMPLATE_BY_CASE_TYPE[typedCaseType];
}

export function getTemplatesForCaseType(caseType?: string) {
  const typedCaseType = caseType && caseType in TEMPLATES_BY_CASE_TYPE
    ? (caseType as CaseType)
    : "otro";

  return TEMPLATES_BY_CASE_TYPE[typedCaseType]
    .map((templateId) => LEGAL_TEMPLATES.find((item) => item.value === templateId))
    .filter((item): item is LegalTemplateDefinition => Boolean(item));
}

export function getDocumentTypeForTemplate(templateId: LegalTemplateId) {
  return LEGAL_TEMPLATES.find((item) => item.value === templateId)?.documentType || "otro";
}
