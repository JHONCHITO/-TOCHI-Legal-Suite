import { addDays, addMonths, addYears, differenceInCalendarDays, format, isWeekend, isSameDay } from "date-fns";
import { es } from "date-fns/locale";

// Festivos colombianos 2026 (Ley 51 de 1983)
const festivosColombia2026 = [
  new Date(2026, 0, 1),   // Ano Nuevo
  new Date(2026, 0, 12),  // Dia de los Reyes Magos (trasladado)
  new Date(2026, 2, 23),  // San Jose (trasladado)
  new Date(2026, 3, 2),   // Jueves Santo
  new Date(2026, 3, 3),   // Viernes Santo
  new Date(2026, 4, 1),   // Dia del Trabajo
  new Date(2026, 4, 18),  // Ascension del Senor (trasladado)
  new Date(2026, 5, 8),   // Corpus Christi (trasladado)
  new Date(2026, 5, 15),  // Sagrado Corazon (trasladado)
  new Date(2026, 5, 29),  // San Pedro y San Pablo (trasladado)
  new Date(2026, 6, 20),  // Dia de la Independencia
  new Date(2026, 7, 7),   // Batalla de Boyaca
  new Date(2026, 7, 17),  // Asuncion de la Virgen (trasladado)
  new Date(2026, 9, 12),  // Dia de la Raza (trasladado)
  new Date(2026, 10, 2),  // Todos los Santos (trasladado)
  new Date(2026, 10, 16), // Independencia de Cartagena (trasladado)
  new Date(2026, 11, 8),  // Inmaculada Concepcion
  new Date(2026, 11, 25), // Navidad
];

// Verificar si es festivo
export function esFestivo(fecha: Date): boolean {
  return festivosColombia2026.some(festivo => isSameDay(festivo, fecha));
}

// Verificar si es dia habil
export function esDiaHabil(fecha: Date): boolean {
  return !isWeekend(fecha) && !esFestivo(fecha);
}

// Calcular dias habiles desde una fecha
export function agregarDiasHabiles(fechaInicio: Date, diasHabiles: number): Date {
  let fecha = new Date(fechaInicio);
  let diasContados = 0;
  
  while (diasContados < diasHabiles) {
    fecha = addDays(fecha, 1);
    if (esDiaHabil(fecha)) {
      diasContados++;
    }
  }
  
  return fecha;
}

// Calcular dias calendario
export function agregarDiasCalendario(fechaInicio: Date, dias: number): Date {
  return addDays(fechaInicio, dias);
}

// Calcular meses
export function agregarMeses(fechaInicio: Date, meses: number): Date {
  return addMonths(fechaInicio, meses);
}

// Calcular anos
export function agregarAnos(fechaInicio: Date, anos: number): Date {
  return addYears(fechaInicio, anos);
}

// Contar dias habiles entre dos fechas
export function contarDiasHabiles(fechaInicio: Date, fechaFin: Date): number {
  let diasHabiles = 0;
  let fecha = new Date(fechaInicio);
  
  while (fecha < fechaFin) {
    fecha = addDays(fecha, 1);
    if (esDiaHabil(fecha)) {
      diasHabiles++;
    }
  }
  
  return diasHabiles;
}

// Contar dias calendario entre dos fechas
export function contarDiasCalendario(fechaInicio: Date, fechaFin: Date): number {
  return differenceInCalendarDays(fechaFin, fechaInicio);
}

// Formatear fecha para mostrar
export function formatearFecha(fecha: Date): string {
  return format(fecha, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
}

// Terminos legales comunes en Colombia
export const terminosLegales = [
  // Terminos procesales CGP
  { nombre: "Contestacion demanda ordinaria", dias: 20, tipo: "habil", norma: "Art. 96 CGP" },
  { nombre: "Contestacion demanda verbal", dias: 10, tipo: "habil", norma: "Art. 392 CGP" },
  { nombre: "Recurso de reposicion", dias: 3, tipo: "habil", norma: "Art. 318 CGP" },
  { nombre: "Recurso de apelacion", dias: 3, tipo: "habil", norma: "Art. 322 CGP" },
  { nombre: "Recurso de queja", dias: 5, tipo: "habil", norma: "Art. 352 CGP" },
  { nombre: "Recurso de suplica", dias: 3, tipo: "habil", norma: "Art. 331 CGP" },
  { nombre: "Recurso extraordinario de casacion", dias: 20, tipo: "habil", norma: "Art. 336 CGP" },
  { nombre: "Recurso extraordinario de revision", dias: 2, tipo: "anio", norma: "Art. 354 CGP" },
  { nombre: "Traslado para alegatos", dias: 5, tipo: "habil", norma: "Art. 372 CGP" },
  { nombre: "Ejecutoria providencia", dias: 3, tipo: "habil", norma: "Art. 302 CGP" },
  
  // Terminos constitucionales
  { nombre: "Tutela (fallo primera instancia)", dias: 10, tipo: "habil", norma: "Art. 29 Decreto 2591" },
  { nombre: "Tutela (impugnacion)", dias: 3, tipo: "habil", norma: "Art. 31 Decreto 2591" },
  { nombre: "Derecho de peticion (general)", dias: 15, tipo: "habil", norma: "Art. 14 CPACA" },
  { nombre: "Derecho de peticion (informacion)", dias: 10, tipo: "habil", norma: "Art. 14 CPACA" },
  { nombre: "Derecho de peticion (documentos)", dias: 10, tipo: "habil", norma: "Art. 14 CPACA" },
  { nombre: "Derecho de peticion (consulta)", dias: 30, tipo: "habil", norma: "Art. 14 CPACA" },
  
  // Terminos laborales
  { nombre: "Contestacion demanda laboral", dias: 10, tipo: "habil", norma: "Art. 31 CPL" },
  { nombre: "Apelacion sentencia laboral", dias: 5, tipo: "habil", norma: "Art. 66 CPL" },
  { nombre: "Prescripcion acciones laborales", dias: 3, tipo: "anio", norma: "Art. 488 CST" },
  
  // Terminos contenciosos
  { nombre: "Demanda nulidad acto administrativo", dias: 4, tipo: "mes", norma: "Art. 164 CPACA" },
  { nombre: "Demanda reparacion directa", dias: 2, tipo: "anio", norma: "Art. 164 CPACA" },
  { nombre: "Demanda controversias contractuales", dias: 2, tipo: "anio", norma: "Art. 164 CPACA" },
  
  // Terminos penales
  { nombre: "Formulacion de imputacion (captura)", dias: 36, tipo: "hora", norma: "Art. 126 CPP" },
  { nombre: "Audiencia de legalizacion", dias: 36, tipo: "hora", norma: "Art. 302 CPP" },
  { nombre: "Prescripcion accion penal (delitos)", dias: 20, tipo: "anio", norma: "Art. 83 CP" },
];
