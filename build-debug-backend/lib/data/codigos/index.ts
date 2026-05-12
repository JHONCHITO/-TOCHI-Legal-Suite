// INDICE DE TODOS LOS CODIGOS LEGALES COLOMBIANOS
// Importa todos los codigos y exportalos

import { constitucionPolitica as constitucionPoliticaCompleta } from "./constitucion";
import { codigoCivil as codigoCivilResumen } from "./codigo-civil";
import { codigoCivilParte1 } from "./codigo-civil-1";
import { codigoCivilParte2 } from "./codigo-civil-2";
import { codigoLaboral as codigoSustantivoTrabajoCompleto } from "./codigo-laboral";

function mergeArticles(...sources: Array<{ articulos?: Array<{ numero: string; [key: string]: unknown }> }>) {
  const merged = new Map<string, { numero: string; [key: string]: unknown }>();

  for (const source of sources) {
    for (const article of source.articulos || []) {
      const current = merged.get(article.numero);
      const currentLength = String((current as any)?.contenido || "").length;
      const nextLength = String((article as any).contenido || "").length;

      if (!current || nextLength >= currentLength) {
        merged.set(article.numero, article);
      }
    }
  }

  return [...merged.values()].sort((a, b) => a.numero.localeCompare(b.numero, "es", { numeric: true }));
}

export const constitucionPolitica = constitucionPoliticaCompleta;
export const codigoCivil = {
  ...codigoCivilResumen,
  ...codigoCivilParte1,
  ...codigoCivilParte2,
  articulos: mergeArticles(codigoCivilResumen, codigoCivilParte1, codigoCivilParte2),
};
export const codigoSustantivoTrabajo = codigoSustantivoTrabajoCompleto;
export { codigoPenal } from "./codigo-penal"
export { codigoProcedimientoPenal } from "./codigo-procedimiento-penal"
export { codigoComercio } from "./codigo-comercio"
export { codigoProcesalTrabajo } from "./codigo-procesal-trabajo"
export { codigoGeneralProceso } from "./codigo-general-proceso"
export { cpaca } from "./cpaca"
export { codigoInfanciaAdolescencia } from "./codigo-infancia-adolescencia"
export { estatutoTributario } from "./estatuto-tributario"
export { codigoPolicia } from "./codigo-policia"
export { codigoTransito } from "./codigo-transito"
export { estatutoConsumidor } from "./estatuto-consumidor"
export { codigoMinas } from "./codigo-minas"
export { codigoRecursosNaturales } from "./codigo-recursos-naturales"
export { codigoElectoral } from "./codigo-electoral"
export { codigoDisciplinario } from "./codigo-disciplinario"
export { ley100SeguridadSocial } from "./ley-100-seguridad-social"
export { estatutoArbitraje } from "./estatuto-arbitraje"
export { ley1564Insolvencia } from "./ley-1564-insolvencia"
export { ley1116InsolvenciaEmpresarial } from "./ley-1116-insolvencia-empresarial"
export { ley906SistemaAcusatorio } from "./ley-906-sistema-acusatorio"
export { codigoPenitenciario } from "./codigo-penitenciario"
export { ley1448Victimas } from "./ley-1448-victimas"
export { ley1581ProteccionDatos } from "./ley-1581-proteccion-datos"
export { codigoAduanero } from "./codigo-aduanero"
export { ley23DerechosAutor } from "./ley-23-derechos-autor"

// Lista de todos los codigos
export const todosLosCodigos = [
  "constitucionPolitica",
  "codigoCivil",
  "codigoPenal",
  "codigoProcedimientoPenal",
  "codigoComercio",
  "codigoSustantivoTrabajo",
  "codigoProcesalTrabajo",
  "codigoGeneralProceso",
  "cpaca",
  "codigoInfanciaAdolescencia",
  "estatutoTributario",
  "codigoPolicia",
  "codigoTransito",
  "estatutoConsumidor",
  "codigoMinas",
  "codigoRecursosNaturales",
  "codigoElectoral",
  "codigoDisciplinario",
  "ley100SeguridadSocial",
  "estatutoArbitraje",
  "ley1564Insolvencia",
  "ley1116InsolvenciaEmpresarial",
  "ley906SistemaAcusatorio",
  "codigoPenitenciario",
  "ley1448Victimas",
  "ley1581ProteccionDatos",
  "codigoAduanero",
  "ley23DerechosAutor"
]
