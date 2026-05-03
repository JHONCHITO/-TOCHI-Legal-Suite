export type DemoCaseStatus =
  | "consulta"
  | "activo"
  | "en_tramite"
  | "audiencia_pendiente"
  | "sentencia"
  | "cerrado";

export type DemoCaseType =
  | "civil"
  | "laboral"
  | "constitucional"
  | "comercial"
  | "familia"
  | "administrativo";

export interface DemoClient {
  id: string;
  tipo: "persona_natural" | "persona_juridica";
  nombre?: string;
  apellido?: string;
  razonSocial?: string;
  documento?: string;
  nit?: string;
  email: string;
  telefono: string;
  ciudad: string;
  direccion: string;
  activo: boolean;
  tags: string[];
}

export interface DemoCase {
  id: string;
  numeroInterno: string;
  numeroProceso?: string;
  titulo: string;
  clienteId: string;
  tipo: DemoCaseType;
  estado: DemoCaseStatus;
  juzgado: string;
  responsable: string;
  fechaInicio: string;
  fechaProximaActuacion?: string;
  cuantia?: number;
  estrategia: string;
  hitos: string[];
  normasClave: string[];
}

export interface DemoAppointment {
  id: string;
  titulo: string;
  tipo: "audiencia" | "reunion" | "consulta" | "seguimiento" | "conciliacion";
  estado: "programada" | "confirmada" | "cancelada";
  clienteId: string;
  casoId?: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  ubicacion: string;
  esVirtual: boolean;
}

export interface DemoTemplate {
  id: string;
  nombre: string;
  categoria: string;
  descripcion: string;
  campos: string[];
}

export interface DemoDocument {
  id: string;
  nombre: string;
  tipo: string;
  estado: "borrador" | "revision" | "finalizado";
  clienteId: string;
  casoId?: string;
  plantillaId?: string;
  fecha: string;
}

export interface DemoNotification {
  id: string;
  tipo: "cita" | "caso" | "ley" | "vencimiento" | "sistema";
  titulo: string;
  mensaje: string;
  fecha: string;
  leida: boolean;
  prioridad: "alta" | "media" | "baja";
  enlace?: string;
}

export interface DemoInvoice {
  id: string;
  clienteId: string;
  concepto: string;
  valor: number;
  fecha: string;
  estado: "Pagada" | "Pendiente" | "Vencida";
}

export interface DemoCommunication {
  id: string;
  canal: "WhatsApp" | "Correo" | "Llamada";
  clienteId: string;
  mensaje: string;
  fecha: string;
  estado: "Pendiente" | "Respondido" | "Hoy";
}

export const demoClients: DemoClient[] = [
  {
    id: "cli-1",
    tipo: "persona_natural",
    nombre: "Juan",
    apellido: "Perez",
    documento: "1020304050",
    email: "juan.perez@email.com",
    telefono: "3001234567",
    ciudad: "Bogota",
    direccion: "Cra 10 # 20-30",
    activo: true,
    tags: ["Laboral", "Audiencia"],
  },
  {
    id: "cli-2",
    tipo: "persona_natural",
    nombre: "Rosa",
    apellido: "Martinez",
    documento: "51889922",
    email: "rosa.martinez@email.com",
    telefono: "3102223344",
    ciudad: "Bogota",
    direccion: "Calle 72 # 12-44",
    activo: true,
    tags: ["Tutela", "Salud"],
  },
  {
    id: "cli-3",
    tipo: "persona_juridica",
    razonSocial: "Empresa ABC S.A.S.",
    nit: "900123456-7",
    email: "legal@empresaabc.com",
    telefono: "6014567890",
    ciudad: "Bogota",
    direccion: "Zona Industrial 45",
    activo: true,
    tags: ["Comercial", "Cobro ejecutivo"],
  },
  {
    id: "cli-4",
    tipo: "persona_natural",
    nombre: "Maria",
    apellido: "Garcia",
    documento: "1030445566",
    email: "maria.garcia@email.com",
    telefono: "3007654321",
    ciudad: "Medellin",
    direccion: "Transversal 80 # 50-11",
    activo: true,
    tags: ["Familia", "Sucesion"],
  },
];

export const demoCases: DemoCase[] = [
  {
    id: "case-1",
    numeroInterno: "TOCHI-2026-00021",
    numeroProceso: "11001-31-05-005-2026-00021-00",
    titulo: "Demanda laboral por despido injustificado",
    clienteId: "cli-1",
    tipo: "laboral",
    estado: "activo",
    juzgado: "Juzgado 5 Laboral del Circuito",
    responsable: "Dr. Jhon Rique Chito Ruiz",
    fechaInicio: "2026-04-01",
    fechaProximaActuacion: "2026-04-24",
    cuantia: 18500000,
    estrategia:
      "Consolidar prueba documental, cuantificar acreencias, preparar interrogatorio y reforzar despido sin justa causa con CST arts. 62 y 64.",
    hitos: [
      "Recepcion de contrato y desprendibles",
      "Liquidacion inicial de acreencias",
      "Audiencia inicial programada",
    ],
    normasClave: ["CODIGO_SUSTANTIVO_TRABAJO", "CONSTITUCION_1991"],
  },
  {
    id: "case-2",
    numeroInterno: "TOCHI-2026-00019",
    numeroProceso: "11001-31-03-008-2026-00019-00",
    titulo: "Cobro ejecutivo comercial",
    clienteId: "cli-3",
    tipo: "comercial",
    estado: "audiencia_pendiente",
    juzgado: "Juzgado 8 Civil Municipal",
    responsable: "Dr. Jhon Rique Chito Ruiz",
    fechaInicio: "2026-03-25",
    fechaProximaActuacion: "2026-04-26",
    cuantia: 92000000,
    estrategia:
      "Impulsar medidas cautelares y verificar notificacion al ejecutado con soporte del CGP y el Codigo de Comercio.",
    hitos: [
      "Presentacion de demanda ejecutiva",
      "Auto librando mandamiento de pago",
      "Seguimiento de embargo",
    ],
    normasClave: ["CODIGO_GENERAL_PROCESO", "CODIGO_COMERCIO"],
  },
  {
    id: "case-3",
    numeroInterno: "TOCHI-2026-00012",
    numeroProceso: "11001-40-88-001-2026-00012-00",
    titulo: "Tutela por derecho a la salud",
    clienteId: "cli-2",
    tipo: "constitucional",
    estado: "en_tramite",
    juzgado: "Juzgado Primero Penal Municipal",
    responsable: "Dr. Jhon Rique Chito Ruiz",
    fechaInicio: "2026-04-08",
    fechaProximaActuacion: "2026-04-23",
    estrategia:
      "Radicar soporte medico actualizado, reforzar perjuicio irremediable y medidas de proteccion inmediata con apoyo del art. 86 CP.",
    hitos: [
      "Radicacion de tutela",
      "Traslado a la EPS",
      "Solicitud de medida provisional",
    ],
    normasClave: ["CONSTITUCION_1991"],
  },
  {
    id: "case-4",
    numeroInterno: "TOCHI-2026-00008",
    numeroProceso: "05001-31-10-001-2026-00008-00",
    titulo: "Sucesion intestada",
    clienteId: "cli-4",
    tipo: "familia",
    estado: "consulta",
    juzgado: "Juzgado de Familia de Medellin",
    responsable: "Dr. Jhon Rique Chito Ruiz",
    fechaInicio: "2026-04-10",
    fechaProximaActuacion: "2026-04-30",
    estrategia:
      "Recolectar registro civil, inventario y reglas de vocacion hereditaria para estructurar el tramite.",
    hitos: [
      "Consulta inicial con cliente",
      "Solicitud de documentos de parentesco",
      "Inventario preliminar de bienes",
    ],
    normasClave: ["CODIGO_CIVIL"],
  },
];

export const demoAppointments: DemoAppointment[] = [
  {
    id: "apt-1",
    titulo: "Audiencia inicial",
    tipo: "audiencia",
    estado: "programada",
    clienteId: "cli-1",
    casoId: "case-1",
    fecha: "2026-04-24",
    horaInicio: "10:00",
    horaFin: "12:00",
    ubicacion: "Juzgado 5 Laboral del Circuito",
    esVirtual: false,
  },
  {
    id: "apt-2",
    titulo: "Reunion con cliente corporativo",
    tipo: "seguimiento",
    estado: "confirmada",
    clienteId: "cli-3",
    casoId: "case-2",
    fecha: "2026-04-23",
    horaInicio: "15:00",
    horaFin: "16:00",
    ubicacion: "WhatsApp / llamada",
    esVirtual: true,
  },
  {
    id: "apt-3",
    titulo: "Revision de tutela",
    tipo: "consulta",
    estado: "confirmada",
    clienteId: "cli-2",
    casoId: "case-3",
    fecha: "2026-04-24",
    horaInicio: "08:30",
    horaFin: "09:00",
    ubicacion: "Oficina",
    esVirtual: false,
  },
  {
    id: "apt-4",
    titulo: "Conciliacion prejudicial",
    tipo: "conciliacion",
    estado: "programada",
    clienteId: "cli-4",
    casoId: "case-4",
    fecha: "2026-04-30",
    horaInicio: "11:00",
    horaFin: "12:00",
    ubicacion: "Centro de Conciliacion",
    esVirtual: false,
  },
];

export const demoTemplates: DemoTemplate[] = [
  {
    id: "tpl-1",
    nombre: "Demanda laboral",
    categoria: "Laboral",
    descripcion: "Plantilla para demanda ordinaria laboral con pretensiones y liquidacion inicial.",
    campos: ["trabajador", "empleador", "hechos", "pretensiones", "pruebas"],
  },
  {
    id: "tpl-2",
    nombre: "Accion de tutela",
    categoria: "Constitucional",
    descripcion: "Modelo base para tutela por vulneracion de derechos fundamentales.",
    campos: ["accionante", "accionado", "hechos", "derechos_vulnerados", "pretensiones"],
  },
  {
    id: "tpl-3",
    nombre: "Cobro ejecutivo",
    categoria: "Civil",
    descripcion: "Escrito base para mandamiento de pago con titulo ejecutivo.",
    campos: ["demandante", "demandado", "titulo_valor", "cuantia", "medidas_cautelares"],
  },
  {
    id: "tpl-4",
    nombre: "Derecho de peticion",
    categoria: "Administrativo",
    descripcion: "Plantilla para peticiones ante autoridades o particulares.",
    campos: ["peticionario", "entidad", "solicitud", "fundamentos"],
  },
];

export const demoDocuments: DemoDocument[] = [
  {
    id: "doc-1",
    nombre: "Demanda_laboral_Juan_Perez.docx",
    tipo: "Demanda",
    estado: "revision",
    clienteId: "cli-1",
    casoId: "case-1",
    plantillaId: "tpl-1",
    fecha: "2026-04-20",
  },
  {
    id: "doc-2",
    nombre: "Tutela_salud_Rosa_Martinez.docx",
    tipo: "Tutela",
    estado: "finalizado",
    clienteId: "cli-2",
    casoId: "case-3",
    plantillaId: "tpl-2",
    fecha: "2026-04-18",
  },
  {
    id: "doc-3",
    nombre: "Mandamiento_ejecutivo_ABC.pdf",
    tipo: "Cobro Ejecutivo",
    estado: "borrador",
    clienteId: "cli-3",
    casoId: "case-2",
    plantillaId: "tpl-3",
    fecha: "2026-04-21",
  },
];

export const demoNotifications: DemoNotification[] = [
  {
    id: "not-1",
    tipo: "ley",
    titulo: "Revision clave en el CST",
    mensaje: "Verifica el articulo 62 del Codigo Sustantivo del Trabajo para el caso laboral activo.",
    fecha: "2026-04-23T08:00:00.000Z",
    leida: false,
    prioridad: "alta",
    enlace: "/dashboard/leyes/codigo_sustantivo_trabajo",
  },
  {
    id: "not-2",
    tipo: "cita",
    titulo: "Audiencia manana",
    mensaje: "La audiencia inicial del caso laboral esta programada para el 24 de abril de 2026 a las 10:00 AM.",
    fecha: "2026-04-23T09:30:00.000Z",
    leida: false,
    prioridad: "alta",
    enlace: "/dashboard/citas",
  },
  {
    id: "not-3",
    tipo: "vencimiento",
    titulo: "Termino proximo",
    mensaje: "La tutela requiere soporte medico adicional antes del 24 de abril de 2026.",
    fecha: "2026-04-22T19:00:00.000Z",
    leida: false,
    prioridad: "media",
    enlace: "/dashboard/casos/case-3",
  },
  {
    id: "not-4",
    tipo: "caso",
    titulo: "Documento agregado al expediente",
    mensaje: "Se subio una nueva version de la demanda laboral al caso TOCHI-2026-00021.",
    fecha: "2026-04-21T15:45:00.000Z",
    leida: true,
    prioridad: "media",
    enlace: "/dashboard/documentos",
  },
];

export const demoInvoices: DemoInvoice[] = [
  {
    id: "FAC-1021",
    clienteId: "cli-1",
    concepto: "Cuota inicial demanda laboral",
    valor: 2400000,
    fecha: "2026-04-10",
    estado: "Pagada",
  },
  {
    id: "FAC-1022",
    clienteId: "cli-3",
    concepto: "Cobro ejecutivo comercial",
    valor: 5800000,
    fecha: "2026-04-14",
    estado: "Pendiente",
  },
  {
    id: "FAC-1023",
    clienteId: "cli-4",
    concepto: "Consulta y estructuracion sucesion",
    valor: 1250000,
    fecha: "2026-04-05",
    estado: "Vencida",
  },
];

export const demoCommunications: DemoCommunication[] = [
  {
    id: "com-1",
    canal: "WhatsApp",
    clienteId: "cli-1",
    mensaje: "Cliente confirma envio de desprendibles y carta de despido.",
    fecha: "2026-04-23 11:20",
    estado: "Pendiente",
  },
  {
    id: "com-2",
    canal: "Correo",
    clienteId: "cli-4",
    mensaje: "Se envio lista de documentos para sucesion intestada.",
    fecha: "2026-04-22 16:40",
    estado: "Respondido",
  },
  {
    id: "com-3",
    canal: "Llamada",
    clienteId: "cli-3",
    mensaje: "Comite juridico para revisar estrategia de cobro.",
    fecha: "2026-04-23 14:00",
    estado: "Hoy",
  },
];

export function getClientDisplayName(client: DemoClient) {
  if (client.tipo === "persona_juridica") {
    return client.razonSocial || "Empresa";
  }

  return [client.nombre, client.apellido].filter(Boolean).join(" ");
}

export function getClientById(clientId: string) {
  return demoClients.find((client) => client.id === clientId);
}

export function getCaseById(caseId: string) {
  return demoCases.find((item) => item.id === caseId);
}

export function formatCurrencyCop(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}
