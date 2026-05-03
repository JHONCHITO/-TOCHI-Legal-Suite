import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import LegalCode from "@/lib/models/LegalCode";
import Articulo from "@/lib/models/Articulo";

// Lista completa de códigos legales colombianos
const CODIGOS_LEGALES = [
  {
    codigo: "CN",
    nombre: "Constitucion Politica de Colombia",
    nombreCorto: "Constitucion",
    tipo: "constitucion",
    numeroNorma: "Constitucion 1991",
    fechaExpedicion: new Date("1991-07-04"),
    entidadEmisora: "Asamblea Nacional Constituyente",
    urlOficial: "https://www.corteconstitucional.gov.co/inicio/Constitucion%20politica%20de%20Colombia.pdf",
    tags: ["constitucion", "derechos fundamentales", "estado"],
    areasDelDerecho: ["Derecho Constitucional", "Derechos Fundamentales"],
  },
  {
    codigo: "CC",
    nombre: "Codigo Civil Colombiano",
    nombreCorto: "Codigo Civil",
    tipo: "codigo",
    numeroNorma: "Ley 84 de 1873",
    fechaExpedicion: new Date("1873-05-26"),
    entidadEmisora: "Congreso de la Republica",
    urlOficial: "https://www.secretariasenado.gov.co/senado/basedoc/codigo_civil.html",
    tags: ["civil", "obligaciones", "contratos", "familia", "sucesiones"],
    areasDelDerecho: ["Derecho Civil", "Contratos", "Obligaciones", "Familia"],
  },
  {
    codigo: "CCO",
    nombre: "Codigo de Comercio",
    nombreCorto: "Codigo Comercio",
    tipo: "codigo",
    numeroNorma: "Decreto 410 de 1971",
    fechaExpedicion: new Date("1971-03-27"),
    entidadEmisora: "Presidencia de la Republica",
    urlOficial: "https://www.secretariasenado.gov.co/senado/basedoc/codigo_comercio.html",
    tags: ["comercial", "sociedades", "titulos valores", "contratos mercantiles"],
    areasDelDerecho: ["Derecho Comercial", "Sociedades", "Titulos Valores"],
  },
  {
    codigo: "CP",
    nombre: "Codigo Penal Colombiano",
    nombreCorto: "Codigo Penal",
    tipo: "codigo",
    numeroNorma: "Ley 599 de 2000",
    fechaExpedicion: new Date("2000-07-24"),
    entidadEmisora: "Congreso de la Republica",
    urlOficial: "https://www.secretariasenado.gov.co/senado/basedoc/ley_0599_2000.html",
    tags: ["penal", "delitos", "penas", "tipicidad"],
    areasDelDerecho: ["Derecho Penal"],
  },
  {
    codigo: "CPP",
    nombre: "Codigo de Procedimiento Penal",
    nombreCorto: "Procedimiento Penal",
    tipo: "codigo",
    numeroNorma: "Ley 906 de 2004",
    fechaExpedicion: new Date("2004-08-31"),
    entidadEmisora: "Congreso de la Republica",
    urlOficial: "https://www.secretariasenado.gov.co/senado/basedoc/ley_0906_2004.html",
    tags: ["procesal penal", "sistema acusatorio", "juicio oral"],
    areasDelDerecho: ["Derecho Procesal Penal"],
  },
  {
    codigo: "CGP",
    nombre: "Codigo General del Proceso",
    nombreCorto: "CGP",
    tipo: "codigo",
    numeroNorma: "Ley 1564 de 2012",
    fechaExpedicion: new Date("2012-07-12"),
    entidadEmisora: "Congreso de la Republica",
    urlOficial: "https://www.secretariasenado.gov.co/senado/basedoc/ley_1564_2012.html",
    tags: ["procesal civil", "demanda", "pruebas", "sentencia"],
    areasDelDerecho: ["Derecho Procesal Civil"],
  },
  {
    codigo: "CST",
    nombre: "Codigo Sustantivo del Trabajo",
    nombreCorto: "Codigo Laboral",
    tipo: "codigo",
    numeroNorma: "Decreto Ley 2663 de 1950",
    fechaExpedicion: new Date("1950-08-05"),
    entidadEmisora: "Presidencia de la Republica",
    urlOficial: "https://www.secretariasenado.gov.co/senado/basedoc/codigo_sustantivo_trabajo.html",
    tags: ["laboral", "contrato trabajo", "salario", "prestaciones"],
    areasDelDerecho: ["Derecho Laboral"],
  },
  {
    codigo: "CPT",
    nombre: "Codigo Procesal del Trabajo y Seguridad Social",
    nombreCorto: "Procesal Laboral",
    tipo: "codigo",
    numeroNorma: "Decreto Ley 2158 de 1948",
    fechaExpedicion: new Date("1948-06-24"),
    entidadEmisora: "Presidencia de la Republica",
    urlOficial: "https://www.secretariasenado.gov.co/senado/basedoc/codigo_procesal_trabajo.html",
    tags: ["procesal laboral", "demanda laboral", "audiencias"],
    areasDelDerecho: ["Derecho Procesal Laboral"],
  },
  {
    codigo: "CPACA",
    nombre: "Codigo de Procedimiento Administrativo y de lo Contencioso Administrativo",
    nombreCorto: "CPACA",
    tipo: "codigo",
    numeroNorma: "Ley 1437 de 2011",
    fechaExpedicion: new Date("2011-01-18"),
    entidadEmisora: "Congreso de la Republica",
    urlOficial: "https://www.secretariasenado.gov.co/senado/basedoc/ley_1437_2011.html",
    tags: ["administrativo", "accion de nulidad", "reparacion directa"],
    areasDelDerecho: ["Derecho Administrativo"],
  },
  {
    codigo: "CIA",
    nombre: "Codigo de la Infancia y la Adolescencia",
    nombreCorto: "Codigo Infancia",
    tipo: "codigo",
    numeroNorma: "Ley 1098 de 2006",
    fechaExpedicion: new Date("2006-11-08"),
    entidadEmisora: "Congreso de la Republica",
    urlOficial: "https://www.secretariasenado.gov.co/senado/basedoc/ley_1098_2006.html",
    tags: ["menores", "ninos", "adolescentes", "familia"],
    areasDelDerecho: ["Derecho de Familia", "Derecho de Infancia"],
  },
  {
    codigo: "ET",
    nombre: "Estatuto Tributario",
    nombreCorto: "Estatuto Tributario",
    tipo: "codigo",
    numeroNorma: "Decreto 624 de 1989",
    fechaExpedicion: new Date("1989-03-30"),
    entidadEmisora: "Presidencia de la Republica",
    urlOficial: "https://www.secretariasenado.gov.co/senado/basedoc/estatuto_tributario.html",
    tags: ["tributario", "impuestos", "renta", "IVA"],
    areasDelDerecho: ["Derecho Tributario"],
  },
  {
    codigo: "CNP",
    nombre: "Codigo Nacional de Policia y Convivencia",
    nombreCorto: "Codigo Policia",
    tipo: "codigo",
    numeroNorma: "Ley 1801 de 2016",
    fechaExpedicion: new Date("2016-07-29"),
    entidadEmisora: "Congreso de la Republica",
    urlOficial: "https://www.secretariasenado.gov.co/senado/basedoc/ley_1801_2016.html",
    tags: ["policia", "convivencia", "multas", "comparendos"],
    areasDelDerecho: ["Derecho de Policia"],
  },
  {
    codigo: "CM",
    nombre: "Codigo de Minas",
    nombreCorto: "Codigo Minas",
    tipo: "codigo",
    numeroNorma: "Ley 685 de 2001",
    fechaExpedicion: new Date("2001-08-15"),
    entidadEmisora: "Congreso de la Republica",
    urlOficial: "https://www.secretariasenado.gov.co/senado/basedoc/ley_0685_2001.html",
    tags: ["minas", "mineria", "concesiones", "titulos mineros"],
    areasDelDerecho: ["Derecho Minero"],
  },
  {
    codigo: "CE",
    nombre: "Codigo Electoral",
    nombreCorto: "Codigo Electoral",
    tipo: "codigo",
    numeroNorma: "Decreto 2241 de 1986",
    fechaExpedicion: new Date("1986-08-15"),
    entidadEmisora: "Presidencia de la Republica",
    urlOficial: "https://www.secretariasenado.gov.co/senado/basedoc/decreto_2241_1986.html",
    tags: ["electoral", "elecciones", "voto", "partidos"],
    areasDelDerecho: ["Derecho Electoral"],
  },
  {
    codigo: "CRNR",
    nombre: "Codigo Nacional de Recursos Naturales Renovables",
    nombreCorto: "Codigo Ambiental",
    tipo: "codigo",
    numeroNorma: "Decreto Ley 2811 de 1974",
    fechaExpedicion: new Date("1974-12-18"),
    entidadEmisora: "Presidencia de la Republica",
    urlOficial: "https://www.secretariasenado.gov.co/senado/basedoc/decreto_2811_1974.html",
    tags: ["ambiental", "recursos naturales", "medio ambiente"],
    areasDelDerecho: ["Derecho Ambiental"],
  },
  {
    codigo: "EPM",
    nombre: "Estatuto de los Mecanismos Alternativos de Solucion de Conflictos",
    nombreCorto: "Estatuto Conciliacion",
    tipo: "codigo",
    numeroNorma: "Ley 640 de 2001",
    fechaExpedicion: new Date("2001-01-05"),
    entidadEmisora: "Congreso de la Republica",
    urlOficial: "https://www.secretariasenado.gov.co/senado/basedoc/ley_0640_2001.html",
    tags: ["conciliacion", "arbitraje", "mediacion", "MASC"],
    areasDelDerecho: ["Derecho Procesal", "MASC"],
  },
  {
    codigo: "EOT",
    nombre: "Estatuto Organico del Sistema Financiero",
    nombreCorto: "Estatuto Financiero",
    tipo: "codigo",
    numeroNorma: "Decreto 663 de 1993",
    fechaExpedicion: new Date("1993-04-02"),
    entidadEmisora: "Presidencia de la Republica",
    urlOficial: "https://www.secretariasenado.gov.co/senado/basedoc/estatuto_organico_702.html",
    tags: ["financiero", "bancos", "seguros", "credito"],
    areasDelDerecho: ["Derecho Financiero"],
  },
  {
    codigo: "ECA",
    nombre: "Estatuto de Contratacion Administrativa",
    nombreCorto: "Ley 80",
    tipo: "codigo",
    numeroNorma: "Ley 80 de 1993",
    fechaExpedicion: new Date("1993-10-28"),
    entidadEmisora: "Congreso de la Republica",
    urlOficial: "https://www.secretariasenado.gov.co/senado/basedoc/ley_0080_1993.html",
    tags: ["contratacion", "licitacion", "contratos estatales"],
    areasDelDerecho: ["Derecho Administrativo", "Contratacion Estatal"],
  },
  {
    codigo: "EAC",
    nombre: "Estatuto Anticorrupcion",
    nombreCorto: "Estatuto Anticorrupcion",
    tipo: "codigo",
    numeroNorma: "Ley 1474 de 2011",
    fechaExpedicion: new Date("2011-07-12"),
    entidadEmisora: "Congreso de la Republica",
    urlOficial: "https://www.secretariasenado.gov.co/senado/basedoc/ley_1474_2011.html",
    tags: ["anticorrupcion", "transparencia", "inhabilidades"],
    areasDelDerecho: ["Derecho Penal", "Derecho Administrativo"],
  },
  {
    codigo: "LPA",
    nombre: "Ley de Proteccion al Consumidor",
    nombreCorto: "Estatuto Consumidor",
    tipo: "ley",
    numeroNorma: "Ley 1480 de 2011",
    fechaExpedicion: new Date("2011-10-12"),
    entidadEmisora: "Congreso de la Republica",
    urlOficial: "https://www.secretariasenado.gov.co/senado/basedoc/ley_1480_2011.html",
    tags: ["consumidor", "garantias", "publicidad", "proteccion"],
    areasDelDerecho: ["Derecho del Consumidor"],
  },
  {
    codigo: "LHD",
    nombre: "Ley de Habeas Data",
    nombreCorto: "Ley Habeas Data",
    tipo: "ley",
    numeroNorma: "Ley 1581 de 2012",
    fechaExpedicion: new Date("2012-10-17"),
    entidadEmisora: "Congreso de la Republica",
    urlOficial: "https://www.secretariasenado.gov.co/senado/basedoc/ley_1581_2012.html",
    tags: ["datos personales", "privacidad", "habeas data"],
    areasDelDerecho: ["Derecho Informatico", "Proteccion de Datos"],
  },
  {
    codigo: "LT",
    nombre: "Ley de Transparencia y Acceso a la Informacion",
    nombreCorto: "Ley Transparencia",
    tipo: "ley",
    numeroNorma: "Ley 1712 de 2014",
    fechaExpedicion: new Date("2014-03-06"),
    entidadEmisora: "Congreso de la Republica",
    urlOficial: "https://www.secretariasenado.gov.co/senado/basedoc/ley_1712_2014.html",
    tags: ["transparencia", "informacion publica", "acceso"],
    areasDelDerecho: ["Derecho Administrativo"],
  },
  {
    codigo: "CDU",
    nombre: "Codigo Disciplinario Unico",
    nombreCorto: "Codigo Disciplinario",
    tipo: "codigo",
    numeroNorma: "Ley 1952 de 2019",
    fechaExpedicion: new Date("2019-01-28"),
    entidadEmisora: "Congreso de la Republica",
    urlOficial: "https://www.secretariasenado.gov.co/senado/basedoc/ley_1952_2019.html",
    tags: ["disciplinario", "servidores publicos", "faltas"],
    areasDelDerecho: ["Derecho Disciplinario"],
  },
  {
    codigo: "CDA",
    nombre: "Codigo de Extincion de Dominio",
    nombreCorto: "Extincion Dominio",
    tipo: "codigo",
    numeroNorma: "Ley 1708 de 2014",
    fechaExpedicion: new Date("2014-01-20"),
    entidadEmisora: "Congreso de la Republica",
    urlOficial: "https://www.secretariasenado.gov.co/senado/basedoc/ley_1708_2014.html",
    tags: ["extincion dominio", "bienes ilicitos", "confiscacion"],
    areasDelDerecho: ["Derecho Penal"],
  },
  {
    codigo: "LSS",
    nombre: "Ley de Seguridad Social Integral",
    nombreCorto: "Ley 100",
    tipo: "ley",
    numeroNorma: "Ley 100 de 1993",
    fechaExpedicion: new Date("1993-12-23"),
    entidadEmisora: "Congreso de la Republica",
    urlOficial: "https://www.secretariasenado.gov.co/senado/basedoc/ley_0100_1993.html",
    tags: ["seguridad social", "pensiones", "salud", "riesgos laborales"],
    areasDelDerecho: ["Derecho de Seguridad Social"],
  },
];

export async function POST(request: Request) {
  try {
    await dbConnect();

    // Limpiar datos existentes
    await LegalCode.deleteMany({});
    await Articulo.deleteMany({});

    // Insertar códigos
    const codigosInsertados = await LegalCode.insertMany(CODIGOS_LEGALES);
    
    // Crear artículos para cada código
    const articulosParaInsertar: any[] = [];
    
    for (const codigo of codigosInsertados) {
      const articulosCodigo = generarArticulosPorCodigo(codigo.codigo, codigo._id.toString());
      articulosParaInsertar.push(...articulosCodigo);
    }

    // Insertar artículos en lotes
    if (articulosParaInsertar.length > 0) {
      const batchSize = 500;
      for (let i = 0; i < articulosParaInsertar.length; i += batchSize) {
        const batch = articulosParaInsertar.slice(i, i + batchSize);
        await Articulo.insertMany(batch);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Se insertaron ${codigosInsertados.length} codigos legales y ${articulosParaInsertar.length} articulos`,
      codigos: codigosInsertados.length,
      articulos: articulosParaInsertar.length,
    });
  } catch (error) {
    console.error("Error al insertar codigos:", error);
    return NextResponse.json(
      { error: "Error al insertar codigos legales", details: String(error) },
      { status: 500 }
    );
  }
}

function generarArticulosPorCodigo(codigoRef: string, codigoId: string) {
  const articulos: any[] = [];

  switch (codigoRef) {
    case "CN":
      articulos.push(...generarArticulosConstitucion(codigoId));
      break;
    case "CC":
      articulos.push(...generarArticulosCodigoCivil(codigoId));
      break;
    case "CCO":
      articulos.push(...generarArticulosCodigoComercio(codigoId));
      break;
    case "CP":
      articulos.push(...generarArticulosCodigoPenal(codigoId));
      break;
    case "CPP":
      articulos.push(...generarArticulosProcedimientoPenal(codigoId));
      break;
    case "CGP":
      articulos.push(...generarArticulosCGP(codigoId));
      break;
    case "CST":
      articulos.push(...generarArticulosCodigoLaboral(codigoId));
      break;
    case "CPACA":
      articulos.push(...generarArticulosCPACA(codigoId));
      break;
    case "CIA":
      articulos.push(...generarArticulosInfancia(codigoId));
      break;
    case "ET":
      articulos.push(...generarArticulosEstatutoTributario(codigoId));
      break;
    case "CNP":
      articulos.push(...generarArticulosCodigoPolicia(codigoId));
      break;
    default:
      articulos.push(...generarArticulosGenericos(codigoRef, codigoId, 100));
  }

  return articulos;
}

function generarArticulosConstitucion(codigoId: string) {
  const articulos = [];
  
  // TITULO I - DE LOS PRINCIPIOS FUNDAMENTALES
  const tituloI = [
    { num: "1", contenido: "Colombia es un Estado social de derecho, organizado en forma de Republica unitaria, descentralizada, con autonomia de sus entidades territoriales, democratica, participativa y pluralista, fundada en el respeto de la dignidad humana, en el trabajo y la solidaridad de las personas que la integran y en la prevalencia del interes general." },
    { num: "2", contenido: "Son fines esenciales del Estado: servir a la comunidad, promover la prosperidad general y garantizar la efectividad de los principios, derechos y deberes consagrados en la Constitucion; facilitar la participacion de todos en las decisiones que los afectan y en la vida economica, politica, administrativa y cultural de la Nacion; defender la independencia nacional, mantener la integridad territorial y asegurar la convivencia pacifica y la vigencia de un orden justo. Las autoridades de la Republica estan instituidas para proteger a todas las personas residentes en Colombia, en su vida, honra, bienes, creencias, y demas derechos y libertades, y para asegurar el cumplimiento de los deberes sociales del Estado y de los particulares." },
    { num: "3", contenido: "La soberania reside exclusivamente en el pueblo, del cual emana el poder publico. El pueblo la ejerce en forma directa o por medio de sus representantes, en los terminos que la Constitucion establece." },
    { num: "4", contenido: "La Constitucion es norma de normas. En todo caso de incompatibilidad entre la Constitucion y la ley u otra norma juridica, se aplicaran las disposiciones constitucionales. Es deber de los nacionales y de los extranjeros en Colombia acatar la Constitucion y las leyes, y respetar y obedecer a las autoridades." },
    { num: "5", contenido: "El Estado reconoce, sin discriminacion alguna, la primacia de los derechos inalienables de la persona y ampara a la familia como institucion basica de la sociedad." },
    { num: "6", contenido: "Los particulares solo son responsables ante las autoridades por infringir la Constitucion y las leyes. Los servidores publicos lo son por la misma causa y por omision o extralimitacion en el ejercicio de sus funciones." },
    { num: "7", contenido: "El Estado reconoce y protege la diversidad etnica y cultural de la Nacion colombiana." },
    { num: "8", contenido: "Es obligacion del Estado y de las personas proteger las riquezas culturales y naturales de la Nacion." },
    { num: "9", contenido: "Las relaciones exteriores del Estado se fundamentan en la soberania nacional, en el respeto a la autodeterminacion de los pueblos y en el reconocimiento de los principios del derecho internacional aceptados por Colombia." },
    { num: "10", contenido: "El castellano es el idioma oficial de Colombia. Las lenguas y dialectos de los grupos etnicos son tambien oficiales en sus territorios. La ensenanza que se imparta en las comunidades con tradiciones linguisticas propias sera bilingue." },
  ];

  // TITULO II - DE LOS DERECHOS, LAS GARANTIAS Y LOS DEBERES
  // Capitulo 1 - De los Derechos Fundamentales
  const derechosFundamentales = [
    { num: "11", contenido: "El derecho a la vida es inviolable. No habra pena de muerte." },
    { num: "12", contenido: "Nadie sera sometido a desaparicion forzada, a torturas ni a tratos o penas crueles, inhumanos o degradantes." },
    { num: "13", contenido: "Todas las personas nacen libres e iguales ante la ley, recibiran la misma proteccion y trato de las autoridades y gozaran de los mismos derechos, libertades y oportunidades sin ninguna discriminacion por razones de sexo, raza, origen nacional o familiar, lengua, religion, opinion politica o filosofica. El Estado promovera las condiciones para que la igualdad sea real y efectiva y adoptara medidas en favor de grupos discriminados o marginados. El Estado protegera especialmente a aquellas personas que por su condicion economica, fisica o mental, se encuentren en circunstancia de debilidad manifiesta y sancionara los abusos o maltratos que contra ellas se cometan." },
    { num: "14", contenido: "Toda persona tiene derecho al reconocimiento de su personalidad juridica." },
    { num: "15", contenido: "Todas las personas tienen derecho a su intimidad personal y familiar y a su buen nombre, y el Estado debe respetarlos y hacerlos respetar. De igual modo, tienen derecho a conocer, actualizar y rectificar las informaciones que se hayan recogido sobre ellas en bancos de datos y en archivos de entidades publicas y privadas. En la recoleccion, tratamiento y circulacion de datos se respetaran la libertad y demas garantias consagradas en la Constitucion. La correspondencia y demas formas de comunicacion privada son inviolables. Solo pueden ser interceptadas o registradas mediante orden judicial, en los casos y con las formalidades que establezca la ley." },
    { num: "16", contenido: "Todas las personas tienen derecho al libre desarrollo de su personalidad sin mas limitaciones que las que imponen los derechos de los demas y el orden juridico." },
    { num: "17", contenido: "Se prohiben la esclavitud, la servidumbre y la trata de seres humanos en todas sus formas." },
    { num: "18", contenido: "Se garantiza la libertad de conciencia. Nadie sera molestado por razon de sus convicciones o creencias ni compelido a revelarlas ni obligado a actuar contra su conciencia." },
    { num: "19", contenido: "Se garantiza la libertad de cultos. Toda persona tiene derecho a profesar libremente su religion y a difundirla en forma individual o colectiva. Todas las confesiones religiosas e iglesias son igualmente libres ante la ley." },
    { num: "20", contenido: "Se garantiza a toda persona la libertad de expresar y difundir su pensamiento y opiniones, la de informar y recibir informacion veraz e imparcial, y la de fundar medios masivos de comunicacion. Estos son libres y tienen responsabilidad social. Se garantiza el derecho a la rectificacion en condiciones de equidad. No habra censura." },
    { num: "21", contenido: "Se garantiza el derecho a la honra. La ley senalara la forma de su proteccion." },
    { num: "22", contenido: "La paz es un derecho y un deber de obligatorio cumplimiento." },
    { num: "23", contenido: "Toda persona tiene derecho a presentar peticiones respetuosas a las autoridades por motivos de interes general o particular y a obtener pronta resolucion. El legislador podra reglamentar su ejercicio ante organizaciones privadas para garantizar los derechos fundamentales." },
    { num: "24", contenido: "Todo colombiano, con las limitaciones que establezca la ley, tiene derecho a circular libremente por el territorio nacional, a entrar y salir de el, y a permanecer y residenciarse en Colombia." },
    { num: "25", contenido: "El trabajo es un derecho y una obligacion social y goza, en todas sus modalidades, de la especial proteccion del Estado. Toda persona tiene derecho a un trabajo en condiciones dignas y justas." },
    { num: "26", contenido: "Toda persona es libre de escoger profesion u oficio. La ley podra exigir titulos de idoneidad. Las autoridades competentes inspeccionaran y vigilaran el ejercicio de las profesiones. Las ocupaciones, artes y oficios que no exijan formacion academica son de libre ejercicio, salvo aquellas que impliquen un riesgo social." },
    { num: "27", contenido: "El Estado garantiza las libertades de ensenanza, aprendizaje, investigacion y catedra." },
    { num: "28", contenido: "Toda persona es libre. Nadie puede ser molestado en su persona o familia, ni reducido a prision o arresto, ni detenido, ni su domicilio registrado, sino en virtud de mandamiento escrito de autoridad judicial competente, con las formalidades legales y por motivo previamente definido en la ley. La persona detenida preventivamente sera puesta a disposicion del juez competente dentro de las treinta y seis horas siguientes, para que este adopte la decision correspondiente en el termino que establezca la ley." },
    { num: "29", contenido: "El debido proceso se aplicara a toda clase de actuaciones judiciales y administrativas. Nadie podra ser juzgado sino conforme a leyes preexistentes al acto que se le imputa, ante juez o tribunal competente y con observancia de la plenitud de las formas propias de cada juicio. En materia penal, la ley permisiva o favorable, aun cuando sea posterior, se aplicara de preferencia a la restrictiva o desfavorable. Toda persona se presume inocente mientras no se la haya declarado judicialmente culpable. Quien sea sindicado tiene derecho a la defensa y a la asistencia de un abogado escogido por el, o de oficio, durante la investigacion y el juzgamiento; a un debido proceso publico sin dilaciones injustificadas; a presentar pruebas y a controvertir las que se alleguen en su contra; a impugnar la sentencia condenatoria, y a no ser juzgado dos veces por el mismo hecho. Es nula, de pleno derecho, la prueba obtenida con violacion del debido proceso." },
    { num: "30", contenido: "Quien estuviere privado de su libertad, y creyere estarlo ilegalmente, tiene derecho a invocar ante cualquier autoridad judicial, en todo tiempo, por si o por interpuesta persona, el Habeas Corpus, el cual debe resolverse en el termino de treinta y seis horas." },
    { num: "31", contenido: "Toda sentencia judicial podra ser apelada o consultada, salvo las excepciones que consagre la ley. El superior no podra agravar la pena impuesta cuando el condenado sea apelante unico." },
    { num: "32", contenido: "El delincuente sorprendido en flagrancia podra ser aprehendido y llevado ante el juez por cualquier persona. Si los agentes de la autoridad lo persiguieren y se refugiare en su propio domicilio, podran penetrar en el, para el acto de la aprehension; si se acogiere a domicilio ajeno, debera preceder requerimiento al morador." },
    { num: "33", contenido: "Nadie podra ser obligado a declarar contra si mismo o contra su conyuge, companero permanente o parientes dentro del cuarto grado de consanguinidad, segundo de afinidad o primero civil." },
    { num: "34", contenido: "Se prohiben las penas de destierro, prision perpetua y confiscacion. No obstante, por sentencia judicial, se declarara extinguido el dominio sobre los bienes adquiridos mediante enriquecimiento ilicito, en perjuicio del Tesoro publico o con grave deterioro de la moral social." },
    { num: "35", contenido: "La extradicion se podra solicitar, conceder u ofrecer de acuerdo con los tratados publicos y, en su defecto, con la ley. Ademas, la extradicion de los colombianos por nacimiento se concedera por delitos cometidos en el exterior, considerados como tales en la legislacion penal colombiana. La extradicion no procedera por delitos politicos. No procedera la extradicion cuando se trate de hechos cometidos con anterioridad a la promulgacion de la presente norma." },
    { num: "36", contenido: "Se reconoce el derecho de asilo en los terminos previstos en la ley." },
    { num: "37", contenido: "Toda parte del pueblo puede reunirse y manifestarse publica y pacificamente. Solo la ley podra establecer de manera expresa los casos en los cuales se podra limitar el ejercicio de este derecho." },
    { num: "38", contenido: "Se garantiza el derecho de libre asociacion para el desarrollo de las distintas actividades que las personas realizan en sociedad." },
    { num: "39", contenido: "Los trabajadores y empleadores tienen derecho a constituir sindicatos o asociaciones, sin intervencion del Estado. Su reconocimiento juridico se producira con la simple inscripcion del acta de constitucion. La estructura interna y el funcionamiento de los sindicatos y organizaciones sociales y gremiales se sujetaran al orden legal y a los principios democraticos." },
    { num: "40", contenido: "Todo ciudadano tiene derecho a participar en la conformacion, ejercicio y control del poder politico." },
    { num: "41", contenido: "En todas las instituciones de educacion, oficiales o privadas, seran obligatorios el estudio de la Constitucion y la Instruccion Civica. Asi mismo se fomentaran practicas democraticas para el aprendizaje de los principios y valores de la participacion ciudadana." },
  ];

  // TITULO II - Capitulo 2 - De los Derechos Sociales, Economicos y Culturales
  const derechosSociales = [
    { num: "42", contenido: "La familia es el nucleo fundamental de la sociedad. Se constituye por vinculos naturales o juridicos, por la decision libre de un hombre y una mujer de contraer matrimonio o por la voluntad responsable de conformarla. El Estado y la sociedad garantizan la proteccion integral de la familia." },
    { num: "43", contenido: "La mujer y el hombre tienen iguales derechos y oportunidades. La mujer no podra ser sometida a ninguna clase de discriminacion. Durante el embarazo y despues del parto gozara de especial asistencia y proteccion del Estado, y recibira de este subsidio alimentario si entonces estuviere desempleada o desamparada." },
    { num: "44", contenido: "Son derechos fundamentales de los ninos: la vida, la integridad fisica, la salud y la seguridad social, la alimentacion equilibrada, su nombre y nacionalidad, tener una familia y no ser separados de ella, el cuidado y amor, la educacion y la cultura, la recreacion y la libre expresion de su opinion. Seran protegidos contra toda forma de abandono, violencia fisica o moral, secuestro, venta, abuso sexual, explotacion laboral o economica y trabajos riesgosos." },
    { num: "45", contenido: "El adolescente tiene derecho a la proteccion y a la formacion integral. El Estado y la sociedad garantizan la participacion activa de los jovenes en los organismos publicos y privados que tengan a cargo la proteccion, educacion y progreso de la juventud." },
    { num: "46", contenido: "El Estado, la sociedad y la familia concurriran para la proteccion y la asistencia de las personas de la tercera edad y promoveran su integracion a la vida activa y comunitaria." },
    { num: "47", contenido: "El Estado adelantara una politica de prevision, rehabilitacion e integracion social para los disminuidos fisicos, sensoriales y psiquicos, a quienes se prestara la atencion especializada que requieran." },
    { num: "48", contenido: "La Seguridad Social es un servicio publico de caracter obligatorio que se prestara bajo la direccion, coordinacion y control del Estado, en sujecion a los principios de eficiencia, universalidad y solidaridad, en los terminos que establezca la Ley." },
    { num: "49", contenido: "La atencion de la salud y el saneamiento ambiental son servicios publicos a cargo del Estado. Se garantiza a todas las personas el acceso a los servicios de promocion, proteccion y recuperacion de la salud." },
    { num: "50", contenido: "Todo nino menor de un ano que no este cubierto por algun tipo de proteccion o de seguridad social, tendra derecho a recibir atencion gratuita en todas las instituciones de salud que reciban aportes del Estado." },
    { num: "51", contenido: "Todos los colombianos tienen derecho a vivienda digna. El Estado fijara las condiciones necesarias para hacer efectivo este derecho y promovera planes de vivienda de interes social, sistemas adecuados de financiacion a largo plazo y formas asociativas de ejecucion de estos programas de vivienda." },
    { num: "52", contenido: "El ejercicio del deporte, sus manifestaciones recreativas, competitivas y autoctonas tienen como funcion la formacion integral de las personas, preservar y desarrollar una mejor salud en el ser humano." },
    { num: "53", contenido: "El Congreso expedira el estatuto del trabajo. La ley correspondiente tendra en cuenta por lo menos los siguientes principios minimos fundamentales: Igualdad de oportunidades para los trabajadores; remuneracion minima vital y movil, proporcional a la cantidad y calidad de trabajo; estabilidad en el empleo; irrenunciabilidad a los beneficios minimos establecidos en normas laborales." },
    { num: "54", contenido: "Es obligacion del Estado y de los empleadores ofrecer formacion y habilitacion profesional y tecnica a quienes lo requieran. El Estado debe propiciar la ubicacion laboral de las personas en edad de trabajar y garantizar a los minusvalidos el derecho a un trabajo acorde con sus condiciones de salud." },
    { num: "55", contenido: "Se garantiza el derecho de negociacion colectiva para regular las relaciones laborales, con las excepciones que senale la ley. Es deber del Estado promover la concertacion y los demas medios para la solucion pacifica de los conflictos colectivos de trabajo." },
    { num: "56", contenido: "Se garantiza el derecho de huelga, salvo en los servicios publicos esenciales definidos por el legislador. La ley reglamentara este derecho." },
    { num: "57", contenido: "La ley podra establecer los estimulos y los medios para que los trabajadores participen en la gestion de las empresas." },
    { num: "58", contenido: "Se garantizan la propiedad privada y los demas derechos adquiridos con arreglo a las leyes civiles, los cuales no pueden ser desconocidos ni vulnerados por leyes posteriores. Cuando de la aplicacion de una ley expedida por motivos de utilidad publica o interes social, resultaren en conflicto los derechos de los particulares con la necesidad por ella reconocida, el interes privado debera ceder al interes publico o social." },
    { num: "59", contenido: "En caso de guerra y solo para atender a sus requerimientos, la necesidad de una expropiacion podra ser decretada por el Gobierno Nacional sin previa indemnizacion." },
    { num: "60", contenido: "El Estado promovera, de acuerdo con la ley, el acceso a la propiedad. Cuando el Estado enajene su participacion en una empresa, tomara las medidas conducentes a democratizar la titularidad de sus acciones." },
    { num: "61", contenido: "El Estado protegera la propiedad intelectual por el tiempo y mediante las formalidades que establezca la ley." },
    { num: "62", contenido: "El destino de las donaciones intervivos o testamentarias, hechas conforme a la ley para fines de interes social, no podra ser variado ni modificado por el legislador, a menos que el objeto de la donacion desaparezca." },
    { num: "63", contenido: "Los bienes de uso publico, los parques naturales, las tierras comunales de grupos etnicos, las tierras de resguardo, el patrimonio arqueologico de la Nacion y los demas bienes que determine la ley, son inalienables, imprescriptibles e inembargables." },
    { num: "64", contenido: "Es deber del Estado promover el acceso progresivo a la propiedad de la tierra de los trabajadores agrarios, en forma individual o asociativa, y a los servicios de educacion, salud, vivienda, seguridad social, recreacion, credito, comunicaciones, comercializacion de los productos, asistencia tecnica y empresarial." },
    { num: "65", contenido: "La produccion de alimentos gozara de la especial proteccion del Estado. Para tal efecto, se otorgara prioridad al desarrollo integral de las actividades agricolas, pecuarias, pesqueras, forestales y agroindustriales." },
    { num: "66", contenido: "Las disposiciones que se dicten en materia crediticia podran reglamentar las condiciones especiales del credito agropecuario, teniendo en cuenta los ciclos de las cosechas y de los precios, como tambien los riesgos inherentes a la actividad y las calamidades ambientales." },
    { num: "67", contenido: "La educacion es un derecho de la persona y un servicio publico que tiene una funcion social; con ella se busca el acceso al conocimiento, a la ciencia, a la tecnica, y a los demas bienes y valores de la cultura. La educacion formara al colombiano en el respeto a los derechos humanos, a la paz y a la democracia." },
    { num: "68", contenido: "Los particulares podran fundar establecimientos educativos. La ley establecera las condiciones para su creacion y gestion. La comunidad educativa participara en la direccion de las instituciones de educacion." },
    { num: "69", contenido: "Se garantiza la autonomia universitaria. Las universidades podran darse sus directivas y regirse por sus propios estatutos, de acuerdo con la ley." },
    { num: "70", contenido: "El Estado tiene el deber de promover y fomentar el acceso a la cultura de todos los colombianos en igualdad de oportunidades, por medio de la educacion permanente y la ensenanza cientifica, tecnica, artistica y profesional en todas las etapas del proceso de creacion de la identidad nacional." },
    { num: "71", contenido: "La busqueda del conocimiento y la expresion artistica son libres. Los planes de desarrollo economico y social incluiran el fomento a las ciencias y, en general, a la cultura." },
    { num: "72", contenido: "El patrimonio cultural de la Nacion esta bajo la proteccion del Estado. El patrimonio arqueologico y otros bienes culturales que conforman la identidad nacional, pertenecen a la Nacion y son inalienables, inembargables e imprescriptibles." },
    { num: "73", contenido: "La actividad periodistica gozara de proteccion para garantizar su libertad e independencia profesional." },
    { num: "74", contenido: "Todas las personas tienen derecho a acceder a los documentos publicos salvo los casos que establezca la ley. El secreto profesional es inviolable." },
    { num: "75", contenido: "El espectro electromagnetico es un bien publico inajenable e imprescriptible sujeto a la gestion y control del Estado. Se garantiza la igualdad de oportunidades en el acceso a su uso en los terminos que fije la ley." },
    { num: "76", contenido: "Derogado por el Acto Legislativo 02 de 2011." },
    { num: "77", contenido: "Derogado por el Acto Legislativo 02 de 2011." },
  ];

  // Agregar articulos del Titulo I
  for (const art of tituloI) {
    articulos.push({
      codigoLegalId: codigoId,
      codigoRef: "CN",
      libro: "",
      titulo: "TITULO I - DE LOS PRINCIPIOS FUNDAMENTALES",
      capitulo: "",
      numeroArticulo: art.num,
      tituloArticulo: "",
      contenido: art.contenido,
      vigente: true,
    });
  }

  // Agregar articulos de Derechos Fundamentales
  for (const art of derechosFundamentales) {
    articulos.push({
      codigoLegalId: codigoId,
      codigoRef: "CN",
      libro: "",
      titulo: "TITULO II - DE LOS DERECHOS, LAS GARANTIAS Y LOS DEBERES",
      capitulo: "CAPITULO 1 - DE LOS DERECHOS FUNDAMENTALES",
      numeroArticulo: art.num,
      tituloArticulo: "",
      contenido: art.contenido,
      vigente: true,
    });
  }

  // Agregar articulos de Derechos Sociales
  for (const art of derechosSociales) {
    articulos.push({
      codigoLegalId: codigoId,
      codigoRef: "CN",
      libro: "",
      titulo: "TITULO II - DE LOS DERECHOS, LAS GARANTIAS Y LOS DEBERES",
      capitulo: "CAPITULO 2 - DE LOS DERECHOS SOCIALES, ECONOMICOS Y CULTURALES",
      numeroArticulo: art.num,
      tituloArticulo: "",
      contenido: art.contenido,
      vigente: true,
    });
  }

  // Continuar con mas articulos de la Constitucion...
  // Articulos 78-95 (Derechos Colectivos y del Ambiente + Deberes)
  const derechosColectivos = [
    { num: "78", contenido: "La ley regulara el control de calidad de bienes y servicios ofrecidos y prestados a la comunidad, asi como la informacion que debe suministrarse al publico en su comercializacion." },
    { num: "79", contenido: "Todas las personas tienen derecho a gozar de un ambiente sano. La ley garantizara la participacion de la comunidad en las decisiones que puedan afectarlo. Es deber del Estado proteger la diversidad e integridad del ambiente, conservar las areas de especial importancia ecologica y fomentar la educacion para el logro de estos fines." },
    { num: "80", contenido: "El Estado planificara el manejo y aprovechamiento de los recursos naturales, para garantizar su desarrollo sostenible, su conservacion, restauracion o sustitucion." },
    { num: "81", contenido: "Queda prohibida la fabricacion, importacion, posesion y uso de armas quimicas, biologicas y nucleares, asi como la introduccion al territorio nacional de residuos nucleares y desechos toxicos." },
    { num: "82", contenido: "Es deber del Estado velar por la proteccion de la integridad del espacio publico y por su destinacion al uso comun, el cual prevalece sobre el interes particular." },
    { num: "83", contenido: "Las actuaciones de los particulares y de las autoridades publicas deberan cenirse a los postulados de la buena fe, la cual se presumira en todas las gestiones que aquellos adelanten ante estas." },
    { num: "84", contenido: "Cuando un derecho o una actividad hayan sido reglamentados de manera general, las autoridades publicas no podran establecer ni exigir permisos, licencias o requisitos adicionales para su ejercicio." },
    { num: "85", contenido: "Son de aplicacion inmediata los derechos consagrados en los articulos 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 23, 24, 26, 27, 28, 29, 30, 31, 33, 34, 37 y 40." },
    { num: "86", contenido: "Toda persona tendra accion de tutela para reclamar ante los jueces, en todo momento y lugar, mediante un procedimiento preferente y sumario, por si misma o por quien actue a su nombre, la proteccion inmediata de sus derechos constitucionales fundamentales, cuando quiera que estos resulten vulnerados o amenazados por la accion o la omision de cualquier autoridad publica." },
    { num: "87", contenido: "Toda persona podra acudir ante la autoridad judicial para hacer efectivo el cumplimiento de una ley o un acto administrativo. En caso de prosperar la accion, la sentencia ordenara a la autoridad renuente el cumplimiento del deber omitido." },
    { num: "88", contenido: "La ley regulara las acciones populares para la proteccion de los derechos e intereses colectivos, relacionados con el patrimonio, el espacio, la seguridad y la salubridad publicos, la moral administrativa, el ambiente, la libre competencia economica y otros de similar naturaleza que se definen en ella." },
    { num: "89", contenido: "Ademas de los consagrados en los articulos anteriores, la ley establecera los demas recursos, las acciones, y los procedimientos necesarios para que puedan propugnar por la integridad del orden juridico, y por la proteccion de sus derechos individuales, de grupo o colectivos, frente a la accion u omision de las autoridades publicas." },
    { num: "90", contenido: "El Estado respondera patrimonialmente por los danos antijuridicos que le sean imputables, causados por la accion o la omision de las autoridades publicas." },
    { num: "91", contenido: "En caso de infraccion manifiesta de un precepto constitucional en detrimento de alguna persona, el mandato superior no exime de responsabilidad al agente que lo ejecuta." },
    { num: "92", contenido: "Cualquier persona natural o juridica podra solicitar de la autoridad competente la aplicacion de las sanciones penales o disciplinarias derivadas de la conducta de las autoridades publicas." },
    { num: "93", contenido: "Los tratados y convenios internacionales ratificados por el Congreso, que reconocen los derechos humanos y que prohiben su limitacion en los estados de excepcion, prevalecen en el orden interno." },
    { num: "94", contenido: "La enunciacion de los derechos y garantias contenidos en la Constitucion y en los convenios internacionales vigentes, no debe entenderse como negacion de otros que, siendo inherentes a la persona humana, no figuren expresamente en ellos." },
    { num: "95", contenido: "La calidad de colombiano enaltece a todos los miembros de la comunidad nacional. Todos estan en el deber de engrandecerla y dignificarla. El ejercicio de los derechos y libertades reconocidos en esta Constitucion implica responsabilidades." },
  ];

  for (const art of derechosColectivos) {
    articulos.push({
      codigoLegalId: codigoId,
      codigoRef: "CN",
      libro: "",
      titulo: "TITULO II - DE LOS DERECHOS, LAS GARANTIAS Y LOS DEBERES",
      capitulo: "CAPITULO 3 y 4 - DERECHOS COLECTIVOS Y DEL AMBIENTE / DEBERES Y OBLIGACIONES",
      numeroArticulo: art.num,
      tituloArticulo: "",
      contenido: art.contenido,
      vigente: true,
    });
  }

  return articulos;
}

function generarArticulosCodigoCivil(codigoId: string) {
  const articulos = [];
  
  // LIBRO PRIMERO - DE LAS PERSONAS
  const libroI = [
    { num: "1", titulo: "Definicion de ley", contenido: "La ley es una declaracion de la voluntad soberana manifestada en la forma prevenida en la Constitucion Nacional. El caracter general de la ley es mandar, prohibir, permitir o castigar." },
    { num: "2", titulo: "Costumbre", contenido: "La costumbre en ningun caso tiene fuerza contra la ley. No podra alegarse el desuso para su inobservancia, ni practica, por inveterada y general que sea." },
    { num: "3", titulo: "Validez de la ley", contenido: "La ley es obligatoria y surte sus efectos desde el dia en que ella misma se designe; y en todo caso despues de su promulgacion." },
    { num: "4", titulo: "Interpretacion de la ley", contenido: "Las disposiciones contenidas en los Codigos de Comercio, de Minas, del Ejercito y Armada, y demas especiales, se aplicaran con preferencia a las de este Codigo en las materias a que expresamente se refieran." },
    { num: "5", titulo: "Orden de prelacion", contenido: "La Corte Suprema de Justicia y el Consejo de Estado tienen la obligacion de consultar los dictamenes del Gobierno sobre la inteligencia de la ley." },
    { num: "14", titulo: "Personas naturales", contenido: "Son personas todos los individuos de la especie humana, cualquiera que sea su edad, sexo, estirpe o condicion." },
    { num: "15", titulo: "Personas juridicas", contenido: "Son personas juridicas o morales las corporaciones y las fundaciones de beneficencia publica; los gremios, las comunidades, los colegios y en general todas las reuniones de personas que tengan por objeto una finalidad que se proponga una utilidad publica o social." },
    { num: "73", titulo: "Domicilio", contenido: "El domicilio consiste en la residencia acompanada, real o presuntivamente, del animo de permanecer en ella." },
    { num: "74", titulo: "Domicilio civil", contenido: "El lugar donde un individuo esta de asiento, o donde ejerce habitualmente su profesion u oficio, determina su domicilio civil o vecindad." },
    { num: "90", titulo: "Existencia de las personas", contenido: "La existencia legal de toda persona principia al nacer, esto es, al separarse completamente de su madre. La criatura que muere en el vientre materno, o que perece antes de estar completamente separada de su madre, o que no haya sobrevivido a la separacion un momento siquiera, se reputara no haber existido jamas." },
    { num: "91", titulo: "Proteccion del que esta por nacer", contenido: "La ley protege la vida del que esta por nacer. El juez, en consecuencia, tomara, a peticion de cualquiera persona o de oficio, todas las providencias que le parezcan convenientes para proteger la existencia del no nacido, siempre que crea que de algun modo peligra." },
    { num: "94", titulo: "Fin de la existencia de las personas", contenido: "La existencia de las personas termina con la muerte." },
    { num: "110", titulo: "Matrimonio", contenido: "El matrimonio es un contrato solemne por el cual un hombre y una mujer se unen con el fin de vivir juntos, de procrear y de auxiliarse mutuamente." },
    { num: "113", titulo: "Contrato de matrimonio", contenido: "El contrato de matrimonio se constituye y perfecciona por el libre y mutuo consentimiento de los contrayentes, expresado ante el funcionario competente, en la forma y con las solemnidades y requisitos establecidos en este codigo, y no producira efectos civiles y politicos, si en su celebracion se contraviniere a tales formas, solemnidades y requisitos." },
    { num: "140", titulo: "Nulidad del matrimonio", contenido: "El matrimonio es nulo y sin efecto en los casos siguientes: 1o. Cuando ha habido error acerca de las personas de ambos contrayentes o de la de uno de ellos. 2o. Cuando se ha contraido entre un varon menor de catorce anos, y una mujer menor de catorce, o cuando cualquiera de los dos sea respectivamente menor de aquella edad. 3o. Cuando para celebrarlo haya faltado el consentimiento de alguno de los contrayentes o de ambos. 4o. Cuando no se ha celebrado ante el juez y los testigos competentes." },
    { num: "142", titulo: "Divorcio", contenido: "El divorcio disuelve el vinculo del matrimonio y deja a los consortes en aptitud de contraer otro." },
    { num: "154", titulo: "Causales de divorcio", contenido: "Son causales de divorcio: 1. Las relaciones sexuales extramatrimoniales de uno de los conyuges. 2. El grave e injustificado incumplimiento por parte de alguno de los conyuges de los deberes que la ley les impone como tales y como padres. 3. Los ultrajes, el trato cruel y los maltratamientos de obra. 4. La embriaguez habitual de uno de los conyuges. 5. El uso habitual de sustancias alucinogenas o estupefacientes, salvo prescripcion medica. 6. Toda enfermedad o anormalidad grave e incurable, fisica o psiquica, de uno de los conyuges. 7. Toda conducta de uno de los conyuges tendientes a corromper o pervertir al otro, a un descendiente, o a personas que esten a su cuidado y convivan bajo el mismo techo. 8. La separacion de cuerpos, judicial o de hecho, que haya perdurado por mas de dos anos. 9. El consentimiento de ambos conyuges manifestado ante juez competente y reconocido por este mediante sentencia." },
    { num: "250", titulo: "Hijos legitimos", contenido: "Los hijos nacidos despues de expirados los ciento ochenta dias subsiguientes al matrimonio, se reputan concebidos en el, y tienen por padre al marido." },
    { num: "288", titulo: "Patria potestad", contenido: "La patria potestad es el conjunto de derechos que la ley reconoce a los padres sobre sus hijos no emancipados, para facilitar a aquellos el cumplimiento de los deberes que su calidad les impone." },
  ];

  // LIBRO SEGUNDO - DE LOS BIENES, Y DE SU DOMINIO, POSESION, USO Y GOCE
  const libroII = [
    { num: "653", titulo: "Bienes", contenido: "Los bienes consisten en cosas corporales o incorporales. Corporales son las que tienen un ser real y pueden ser percibidas por los sentidos, como una casa, un libro. Incorporales las que consisten en meros derechos, como los creditos y las servidumbres activas." },
    { num: "654", titulo: "Bienes muebles e inmuebles", contenido: "Las cosas corporales se dividen en muebles e inmuebles." },
    { num: "655", titulo: "Inmuebles", contenido: "Inmuebles o fincas o bienes raices son las cosas que no pueden transportarse de un lugar a otro; como las tierras y minas, y las que adhieren permanentemente a ellas, como los edificios, los arboles." },
    { num: "656", titulo: "Inmuebles por adherencia", contenido: "Las plantas son inmuebles, mientras adhieren al suelo por sus raices, a menos que esten en macetas o cajones que puedan transportarse de un lugar a otro." },
    { num: "657", titulo: "Inmuebles por destinacion", contenido: "Se reputan inmuebles, aunque por su naturaleza no lo sean, las cosas que estan permanentemente destinadas al uso, cultivo y beneficio de un inmueble, sin embargo de que puedan separarse sin detrimento." },
    { num: "658", titulo: "Muebles", contenido: "Muebles son las que pueden transportarse de un lugar a otro, sea moviendose ellas a si mismas, como los animales (que por eso se llaman semovientes), sea que solo se muevan por una fuerza externa, como las cosas inanimadas." },
    { num: "665", titulo: "Derecho real", contenido: "Derecho real es el que tenemos sobre una cosa sin respecto a determinada persona. Son derechos reales el de dominio, el de herencia, los de usufructo, uso o habitacion, los de servidumbres activas, el de prenda y el de hipoteca. De estos derechos nacen las acciones reales." },
    { num: "666", titulo: "Derechos personales", contenido: "Derechos personales o creditos son los que solo pueden reclamarse de ciertas personas que, por un hecho suyo o la sola disposicion de la ley, han contraido las obligaciones correlativas." },
    { num: "669", titulo: "Dominio", contenido: "El dominio (que se llama tambien propiedad) es el derecho real en una cosa corporal, para gozar y disponer de ella, no siendo contra ley o contra derecho ajeno. La propiedad separada del goce de la cosa se llama mera o nuda propiedad." },
    { num: "673", titulo: "Propiedad comun", contenido: "Las cosas que la naturaleza ha hecho comunes a todos los hombres, como la alta mar, no son susceptibles de dominio, y ninguna nacion, corporacion o individuo tiene derecho de apropiarselas." },
    { num: "674", titulo: "Bienes publicos", contenido: "Se llaman bienes de la Union aquellos cuyo dominio pertenece a la Republica. Si ademas su uso pertenece a todos los habitantes de un territorio, como el de calles, plazas, puentes y caminos, se llaman bienes de la Union de uso publico o bienes publicos del territorio." },
    { num: "678", titulo: "Uso de bienes publicos", contenido: "El uso y goce que para el transito, riego, navegacion y cualesquiera otros objetos licitos, corresponden a los particulares en las calles, plazas, puentes y caminos publicos, en el mar y sus playas, en rios y lagos, y generalmente en todos los bienes de la Union de uso publico, estaran sujetos a las disposiciones de este Codigo y a las demas que sobre la materia contengan las leyes." },
    { num: "762", titulo: "Posesion", contenido: "La posesion es la tenencia de una cosa determinada con animo de senor o dueno, sea que el dueno o el que se da por tal, tenga la cosa por si mismo, o por otra persona que la tenga en lugar y a nombre de el. El poseedor es reputado dueno, mientras otra persona no justifique serlo." },
    { num: "764", titulo: "Posesion regular e irregular", contenido: "Se llama posesion regular la que procede de justo titulo y ha sido adquirida de buena fe, aunque la buena fe no subsista despues de adquirida la posesion. Se puede ser, por consiguiente, poseedor regular y poseedor de mala fe, como viceversa, el poseedor de buena fe puede ser poseedor irregular. Si el titulo es traslaticio de dominio, es tambien necesaria la tradicion. La posesion de una cosa a ciencia y paciencia del que se obligo a entregarla, hara presumir la tradicion, a menos que esta haya debido efectuarse por la inscripcion del titulo." },
    { num: "765", titulo: "Justo titulo", contenido: "El justo titulo es constitutivo o traslaticio de dominio. Son constitutivos de dominio la ocupacion, la accesion y la prescripcion. Son traslaticios de dominio los que por su naturaleza sirven para transferirlo, como la venta, la permuta, la donacion entre vivos. Pertenecen a esta clase las sentencias de adjudicacion en juicios divisorios y los actos legales de particion." },
    { num: "768", titulo: "Buena fe en posesion", contenido: "La buena fe es la conciencia de haberse adquirido el dominio de la cosa por medios legitimos exentos de fraudes y de todo otro vicio. Asi, en los titulos traslaticios de dominio, la buena fe supone la persuasion de haberse recibido la cosa de quien tenia la facultad de enajenarla y de no haber habido fraude ni otro vicio en el acto o contrato." },
    { num: "2512", titulo: "Prescripcion", contenido: "La prescripcion es un modo de adquirir las cosas ajenas, o de extinguir las acciones o derechos ajenos, por haberse poseido las cosas, o no haberse ejercido dichas acciones y derechos, durante cierto lapso de tiempo, y concurriendo los demas requisitos legales." },
  ];

  // LIBRO TERCERO - DE LA SUCESION POR CAUSA DE MUERTE
  const libroIII = [
    { num: "1008", titulo: "Sucesion por causa de muerte", contenido: "Se sucede a una persona difunta a titulo universal o a titulo singular. El titulo es universal cuando se sucede al difunto en todos sus bienes, derechos y obligaciones transmisibles o en una cuota de ellos, como la mitad, tercio o quinto. El titulo es singular cuando se sucede en una o mas especies o cuerpos ciertos, como tal caballo, tal casa; o en una o mas especies indeterminadas de cierto genero, como un caballo, tres vacas, seiscientos pesos, cuarenta fanegas de trigo." },
    { num: "1009", titulo: "Asignatarios", contenido: "Se llaman asignaciones por causa de muerte las que hace la ley o el testamento de una persona difunta, para suceder en sus bienes. Con la palabra asignaciones se significan en este libro las asignaciones por causa de muerte, ya las haga el hombre o la ley. Asignatario es la persona a quien se hace la asignacion." },
    { num: "1010", titulo: "Sucesion intestada", contenido: "Si se sucede en virtud de un testamento, la sucesion se llama testamentaria; y si en virtud de la ley, intestada o abintestato. La sucesion en los bienes de una persona difunta puede ser parte testamentaria y parte intestada." },
    { num: "1011", titulo: "Delacion de la herencia", contenido: "La delacion de una asignacion es el actual llamamiento de la ley a aceptarla o repudiarla. La herencia o legado se defiere al heredero o legatario en el momento de fallecer la persona de cuya sucesion se trata, si el heredero o legatario no es llamado condicionalmente; o en el momento de cumplirse la condicion, si el llamamiento es condicional." },
    { num: "1037", titulo: "Testamento", contenido: "El testamento es un acto mas o menos solemne, en que una persona dispone del todo o de una parte de sus bienes para que tenga pleno efecto despues de sus dias, conservando la facultad de revocar las disposiciones contenidas en el, mientras viva." },
    { num: "1055", titulo: "Testamento abierto", contenido: "El testamento abierto, nuncupativo o publico es aquel en que el testador hace sabedores de sus disposiciones a los testigos." },
    { num: "1064", titulo: "Testamento cerrado", contenido: "El testamento cerrado es aquel en que no es necesario que los testigos tengan conocimiento de las disposiciones del testador." },
    { num: "1226", titulo: "Herederos forzosos", contenido: "Legitimarios son los herederos forzosos. Se llaman legitimas las asignaciones forzosas a favor de los legitimarios." },
    { num: "1227", titulo: "Legitimarios", contenido: "Son legitimarios: 1o.) Los hijos legitimos, adoptivos y extramatrimoniales personalmente. 2o.) Los ascendientes. 3o.) Los padres adoptantes. 4o.) El conyuge. El conyuge sobreviviente sera legitimario aunque no sea heredero, a fin de que se le repare la porcion conyugal." },
    { num: "1240", titulo: "Legitima rigurosa", contenido: "Legitima rigurosa es la que resulta de dividir por partes iguales la mitad legitimaria entre los legitimarios, segun las reglas de la sucesion intestada. Lo que cupiere a cada uno en esa division sera su legitima rigurosa." },
    { num: "1242", titulo: "Mejoras", contenido: "La cuarta de mejoras es una porcion de los bienes de un difunto que la ley asigna a ciertos asignatarios que tienen derecho a mejora." },
    { num: "1045", titulo: "Ordenes sucesorales", contenido: "Los hijos legitimos, adoptivos y extramatrimoniales, excluyen a todos los otros herederos y recibian entre ellos iguales cuotas, sin perjuicio de la porcion conyugal." },
  ];

  // LIBRO CUARTO - DE LAS OBLIGACIONES EN GENERAL Y DE LOS CONTRATOS
  const libroIV = [
    { num: "1494", titulo: "Fuente de las obligaciones", contenido: "Las obligaciones nacen, ya del concurso real de las voluntades de dos o mas personas, como en los contratos o convenciones; ya de un hecho voluntario de la persona que se obliga, como en la aceptacion de una herencia o legado y en todos los cuasicontratos; ya a consecuencia de un hecho que ha inferido injuria o dano a otra persona, como en los delitos; ya por disposicion de la ley, como entre los padres y los hijos de familia." },
    { num: "1495", titulo: "Contrato", contenido: "Contrato o convencion es un acto por el cual una parte se obliga para con otra a dar, hacer o no hacer alguna cosa. Cada parte puede ser de una o de muchas personas." },
    { num: "1496", titulo: "Clases de contratos", contenido: "El contrato es unilateral cuando una de las partes se obliga para con otra que no contrae obligacion alguna; y bilateral, cuando las partes contratantes se obligan reciprocamente." },
    { num: "1497", titulo: "Contrato gratuito y oneroso", contenido: "El contrato es gratuito o de beneficencia cuando solo tiene por objeto la utilidad de una de las partes, sufriendo la otra el gravamen; y oneroso, cuando tiene por objeto la utilidad de ambos contratantes, gravandose cada uno a beneficio del otro." },
    { num: "1498", titulo: "Contrato conmutativo y aleatorio", contenido: "El contrato oneroso es conmutativo cuando cada una de las partes se obliga a dar o hacer una cosa que se mira como equivalente a lo que la otra parte debe dar o hacer a su vez; y si el equivalente consiste en una contingencia incierta de ganancia o perdida, se llama aleatorio." },
    { num: "1499", titulo: "Contrato principal y accesorio", contenido: "El contrato es principal cuando subsiste por si mismo sin necesidad de otra convencion, y accesorio, cuando tiene por objeto asegurar el cumplimiento de una obligacion principal, de manera que no pueda subsistir sin ella." },
    { num: "1500", titulo: "Contrato real, solemne y consensual", contenido: "El contrato es real cuando, para que sea perfecto, es necesaria la tradicion de la cosa a que se refiere; es solemne cuando esta sujeto a la observancia de ciertas formalidades especiales, de manera que sin ellas no produce ningun efecto civil; y es consensual cuando se perfecciona por el solo consentimiento." },
    { num: "1502", titulo: "Requisitos para obligarse", contenido: "Para que una persona se obligue a otra por un acto o declaracion de voluntad, es necesario: 1o.) que sea legalmente capaz; 2o.) que consienta en dicho acto o declaracion y su consentimiento no adolezca de vicio; 3o.) que recaiga sobre un objeto licito; 4o.) que tenga una causa licita." },
    { num: "1503", titulo: "Capacidad legal", contenido: "Toda persona es legalmente capaz, excepto aquellas que la ley declara incapaces." },
    { num: "1504", titulo: "Incapacidad", contenido: "Son absolutamente incapaces los dementes, los impuberes. Sus actos no producen ni aun obligaciones naturales, y no admiten caucion. Son tambien incapaces los menores adultos que no han obtenido habilitacion de edad; pero la incapacidad de estas personas no es absoluta y sus actos pueden tener valor en ciertas circunstancias y bajo ciertos respectos determinados por las leyes." },
    { num: "1508", titulo: "Vicios del consentimiento", contenido: "Los vicios de que puede adolecer el consentimiento son: error, fuerza y dolo." },
    { num: "1509", titulo: "Error de derecho", contenido: "El error sobre un punto de derecho no vicia el consentimiento." },
    { num: "1510", titulo: "Error de hecho", contenido: "El error de hecho vicia el consentimiento cuando recae sobre la especie de acto o contrato que se ejecuta o celebra, como si una de las partes entendiese emprestito y la otra donacion; o sobre la identidad de la cosa especifica de que se trata, como si en el contrato de venta el vendedor entendiese vender cierta cosa determinada, y el comprador entendiese comprar otra." },
    { num: "1513", titulo: "Fuerza", contenido: "La fuerza no vicia el consentimiento sino cuando es capaz de producir una impresion fuerte en una persona de sano juicio, tomando en cuenta su edad, sexo y condicion. Se mira como una fuerza de este genero todo acto que infunde a una persona un justo temor de verse expuesta ella, su consorte o alguno de sus ascendientes o descendientes a un mal irreparable y grave." },
    { num: "1515", titulo: "Dolo", contenido: "El dolo no vicia el consentimiento sino cuando es obra de una de las partes, y cuando ademas aparece claramente que sin el no hubiera contratado. En los demas casos el dolo da lugar solamente a la accion de perjuicios contra la persona o personas que lo han fraguado o que se han aprovechado de el." },
    { num: "1517", titulo: "Objeto de los actos", contenido: "Toda declaracion de voluntad debe tener por objeto una o mas cosas, que se trata de dar, hacer o no hacer. El mero uso de la cosa o su tenencia puede ser objeto de la declaracion." },
    { num: "1518", titulo: "Requisitos del objeto", contenido: "No solo las cosas que existen pueden ser objeto de una declaracion de voluntad, sino las que se espera que existan; pero es menester que las unas y las otras sean comerciables, y que esten determinadas, a lo menos en cuanto a su genero." },
    { num: "1519", titulo: "Objeto ilicito", contenido: "Hay un objeto ilicito en todo lo que contraviene al derecho publico de la nacion. Asi, la promesa de someterse en la Republica a una jurisdiccion no reconocida por las leyes de ella, es nula por el vicio del objeto." },
    { num: "1524", titulo: "Causa", contenido: "No puede haber obligacion sin una causa real y licita; pero no es necesario expresarla. La pura liberalidad o beneficencia es causa suficiente. Se entiende por causa el motivo que induce al acto o contrato; y por causa ilicita la prohibida por la ley, o contraria a las buenas costumbres o al orden publico." },
    { num: "1546", titulo: "Condicion resolutoria tacita", contenido: "En los contratos bilaterales va envuelta la condicion resolutoria en caso de no cumplirse por uno de los contratantes lo pactado. Pero en tal caso podra el otro contratante pedir a su arbitrio, o la resolucion o el cumplimiento del contrato con indemnizacion de perjuicios." },
    { num: "1602", titulo: "Fuerza obligatoria del contrato", contenido: "Todo contrato legalmente celebrado es una ley para los contratantes, y no puede ser invalidado sino por su consentimiento mutuo o por causas legales." },
    { num: "1603", titulo: "Ejecucion de buena fe", contenido: "Los contratos deben ejecutarse de buena fe, y por consiguiente obligan no solo a lo que en ellos se expresa, sino a todas las cosas que emanan precisamente de la naturaleza de la obligacion, o que por ley pertenecen a ella." },
    { num: "1604", titulo: "Responsabilidad del deudor", contenido: "El deudor no es responsable sino de la culpa lata en los contratos que por su naturaleza solo son utiles al acreedor; es responsable de la leve en los contratos que se hacen para beneficio reciproco de las partes; y de la levisima en los contratos en que el deudor es el unico que reporta beneficio." },
    { num: "1613", titulo: "Indemnizacion de perjuicios", contenido: "La indemnizacion de perjuicios comprende el dano emergente y lucro cesante, ya provengan de no haberse cumplido la obligacion, o de haberse cumplido imperfectamente, o de haberse retardado el cumplimiento." },
    { num: "1849", titulo: "Compraventa", contenido: "La compraventa es un contrato en que una de las partes se obliga a dar una cosa y la otra a pagarla en dinero. Aquella se dice vender y esta comprar. El dinero que el comprador da por la cosa vendida se llama precio." },
    { num: "1857", titulo: "Perfeccionamiento de la venta", contenido: "La venta se reputa perfecta desde que las partes han convenido en la cosa y en el precio, salvas las excepciones siguientes: La venta de los bienes raices y servidumbres y la de una sucesion hereditaria, no se reputan perfectas ante la ley, mientras no se ha otorgado escritura publica." },
    { num: "1973", titulo: "Arrendamiento", contenido: "El arrendamiento es un contrato en que las dos partes se obligan reciprocamente, la una a conceder el goce de una cosa, o a ejecutar una obra o prestar un servicio, y la otra a pagar por este goce, obra o servicio un precio determinado." },
    { num: "2053", titulo: "Sociedad", contenido: "La sociedad o compania es un contrato por el cual dos o mas personas estipulan poner un capital u otros efectos en comun, con el objeto de repartirse entre si las ganancias o perdidas que resulten de la especulacion." },
    { num: "2142", titulo: "Mandato", contenido: "El mandato es un contrato en que una persona confia la gestion de uno o mas negocios a otra, que se hace cargo de ellos por cuenta y riesgo de la primera. La persona que confiere el encargo se llama comitente o mandante, y la que lo acepta apoderado, procurador, y en general, mandatario." },
    { num: "2221", titulo: "Comodato", contenido: "El comodato o prestamo de uso es un contrato en que una de las partes entrega a la otra gratuitamente una especie mueble o raiz, para que haga uso de ella, y con cargo de restituir la misma especie despues de terminado el uso." },
    { num: "2222", titulo: "Mutuo", contenido: "El mutuo o prestamo de consumo es un contrato en que una de las partes entrega a la otra cierta cantidad de cosas fungibles con cargo de restituir otras tantas del mismo genero y calidad." },
    { num: "2341", titulo: "Responsabilidad extracontractual", contenido: "El que ha cometido un delito o culpa, que ha inferido dano a otro, es obligado a la indemnizacion, sin perjuicio de la pena principal que la ley imponga por la culpa o el delito cometido." },
    { num: "2343", titulo: "Responsabilidad por hecho ajeno", contenido: "Es obligado a la indemnizacion el que hizo el dano y sus herederos. El que recibe provecho del dolo ajeno, sin ser complice en el, solo es obligado hasta concurrencia de lo que valga el provecho que hubiere reportado." },
    { num: "2356", titulo: "Responsabilidad por actividades peligrosas", contenido: "Por regla general todo dano que pueda imputarse a malicia o negligencia de otra persona, debe ser reparado por esta. Son especialmente obligados a esta reparacion: 1. El que dispara imprudentemente un arma de fuego. 2. El que remueve las losas de una acequia o caneria, o las descubre en calle o camino, sin las precauciones necesarias para que no caigan los que por alli transiten de dia o de noche. 3. El que obligado a la construccion o reparacion de un acueducto o fuente, que atraviesa un camino, lo tiene en estado de causar dano a los que transitan por el camino." },
  ];

  // Agregar articulos de cada libro
  for (const art of libroI) {
    articulos.push({
      codigoLegalId: codigoId,
      codigoRef: "CC",
      libro: "LIBRO PRIMERO - DE LAS PERSONAS",
      titulo: "",
      capitulo: "",
      numeroArticulo: art.num,
      tituloArticulo: art.titulo,
      contenido: art.contenido,
      vigente: true,
    });
  }

  for (const art of libroII) {
    articulos.push({
      codigoLegalId: codigoId,
      codigoRef: "CC",
      libro: "LIBRO SEGUNDO - DE LOS BIENES, Y DE SU DOMINIO, POSESION, USO Y GOCE",
      titulo: "",
      capitulo: "",
      numeroArticulo: art.num,
      tituloArticulo: art.titulo,
      contenido: art.contenido,
      vigente: true,
    });
  }

  for (const art of libroIII) {
    articulos.push({
      codigoLegalId: codigoId,
      codigoRef: "CC",
      libro: "LIBRO TERCERO - DE LA SUCESION POR CAUSA DE MUERTE",
      titulo: "",
      capitulo: "",
      numeroArticulo: art.num,
      tituloArticulo: art.titulo,
      contenido: art.contenido,
      vigente: true,
    });
  }

  for (const art of libroIV) {
    articulos.push({
      codigoLegalId: codigoId,
      codigoRef: "CC",
      libro: "LIBRO CUARTO - DE LAS OBLIGACIONES EN GENERAL Y DE LOS CONTRATOS",
      titulo: "",
      capitulo: "",
      numeroArticulo: art.num,
      tituloArticulo: art.titulo,
      contenido: art.contenido,
      vigente: true,
    });
  }

  return articulos;
}

function generarArticulosCodigoComercio(codigoId: string) {
  const articulos = [];
  
  const articulosComercio = [
    { num: "1", contenido: "Los comerciantes y los asuntos mercantiles se regiran por las disposiciones de la ley comercial, y los casos no regulados expresamente en ella seran decididos por analogia de sus normas." },
    { num: "10", contenido: "Son comerciantes las personas que profesionalmente se ocupan en alguna de las actividades que la ley considera mercantiles. La calidad de comerciante se adquiere aunque la actividad mercantil se ejerza por medio de apoderado, intermediario o interpuesta persona." },
    { num: "11", contenido: "Las personas que ejecuten ocasionalmente operaciones mercantiles no se consideraran comerciantes, pero estaran sujetas a las normas comerciales en cuanto a dichas operaciones." },
    { num: "12", contenido: "Toda persona que segun las leyes comunes tenga capacidad para contratar y obligarse, es habil para ejercer el comercio; las que con arreglo a esas mismas leyes sean incapaces, son inhabiles para ejecutar actos comerciales." },
    { num: "19", contenido: "Es obligacion de todo comerciante: 1) Matricularse en el registro mercantil; 2) Inscribir en el registro mercantil todos los actos, libros y documentos respecto de los cuales la ley exija esa formalidad; 3) Llevar contabilidad regular de sus negocios conforme a las prescripciones legales; 4) Conservar, con arreglo a la ley, la correspondencia y demas documentos relacionados con sus negocios o actividades; 5) Denunciar ante el juez competente la cesacion en el pago corriente de sus obligaciones mercantiles, y 6) Abstenerse de ejecutar actos de competencia desleal." },
    { num: "20", contenido: "Son mercantiles para todos los efectos legales: 1) La adquisicion de bienes a titulo oneroso con destino a enajenarlos en igual forma, y la enajenacion de los mismos; 2) La adquisicion a titulo oneroso de bienes muebles con destino a arrendarlos; el arrendamiento de los mismos; el arrendamiento de toda clase de bienes para subarrendarlos, y el subarrendamiento de los mismos; 3) El recibo de dinero en mutuo a interes, con garantia o sin ella, para darlo en prestamo, y los prestamos subsiguientes, asi como dar habitualmente dinero en mutuo a interes; 4) La adquisicion o enajenacion, a titulo oneroso, de establecimientos de comercio, y la prenda, arrendamiento, administracion y demas operaciones analogas relacionadas con los mismos; 5) La intervencion como asociado en la constitucion de sociedades comerciales, los actos de administracion de las mismas o la negociacion a titulo oneroso de las partes de interes, cuotas o acciones." },
    { num: "98", contenido: "Por el contrato de sociedad dos o mas personas se obligan a hacer un aporte en dinero, en trabajo o en otros bienes apreciables en dinero, con el fin de repartirse entre si las utilidades obtenidas en la empresa o actividad social. La sociedad, una vez constituida legalmente, forma una persona juridica distinta de los socios individualmente considerados." },
    { num: "110", contenido: "La sociedad comercial se constituira por escritura publica en la cual se expresara: 1) El nombre y domicilio de las personas que intervengan como otorgantes. Con el nombre de las personas naturales debera indicarse su nacionalidad y documento de identificacion legal; con el nombre de las personas juridicas, la ley, decreto o escritura de que se deriva su existencia; 2) La clase o tipo de sociedad que se constituye y el nombre de la misma, formado como se dispone en relacion con cada uno de los tipos de sociedad que regula este Codigo; 3) El domicilio de la sociedad y el de las distintas sucursales que se establezcan en el mismo acto de constitucion; 4) El objeto social, esto es, la empresa o negocio de la sociedad, haciendo una enunciacion clara y completa de las actividades principales..." },
    { num: "294", contenido: "La sociedad anonima se formara por la reunion de un fondo social suministrado por accionistas responsables hasta el monto de sus respectivos aportes; sera administrada por gestores temporales y revocables y tendra una denominacion seguida de las palabras 'Sociedad Anonima' o de las letras 'S. A.'." },
    { num: "323", contenido: "La sociedad de responsabilidad limitada puede constituirse por dos o mas socios y tendra un maximo de veinticinco. Respondera cada socio hasta por el valor de su aporte. En los estatutos podra estipularse para todos o algunos de los socios una mayor responsabilidad o prestaciones accesorias o garantias suplementarias, expresandose su naturaleza, cuantia, duracion y modalidades." },
    { num: "373", contenido: "La sociedad por acciones simplificada podra constituirse por una o varias personas naturales o juridicas, quienes solo seran responsables hasta el monto de sus respectivos aportes. Salvo lo previsto en el articulo 42 de la presente ley, el o los accionistas no seran responsables por las obligaciones laborales, tributarias o de cualquier otra naturaleza en que incurra la sociedad." },
    { num: "515", contenido: "Se entiende por establecimiento de comercio un conjunto de bienes organizados por el empresario para realizar los fines de la empresa. Una misma persona podra tener varios establecimientos de comercio, y, a su vez, un solo establecimiento de comercio podra pertenecer a varias personas, y destinarse al desarrollo de diversas actividades comerciales." },
    { num: "619", contenido: "Los titulos-valores son documentos necesarios para legitimar el ejercicio del derecho literal y autonomo que en ellos se incorpora. Pueden ser de contenido crediticio, corporativos o de participacion, y de tradicion o representativos de mercancias." },
    { num: "621", contenido: "Ademas de lo dispuesto para cada titulo-valor en particular, los titulos-valores deberan llenar los requisitos siguientes: 1) La mencion del derecho que en el titulo se incorpora, y 2) La firma de quien lo crea." },
    { num: "625", contenido: "El suscriptor de un titulo quedara obligado conforme al tenor literal del mismo, a menos que firme con salvedades compatibles con su esencia." },
    { num: "651", contenido: "La letra de cambio debera contener, ademas de lo dispuesto en el articulo 621: 1) La orden incondicional de pagar una suma determinada de dinero; 2) El nombre del girado; 3) La forma del vencimiento, y 4) La indicacion de ser pagadera a la orden o al portador." },
    { num: "709", contenido: "El pagare debera contener, ademas de los requisitos que establece el articulo 621, los siguientes: 1) La promesa incondicional de pagar una suma determinada de dinero; 2) El nombre de la persona a quien deba hacerse el pago; 3) La indicacion de ser pagadero a la orden o al portador, y 4) La forma de vencimiento." },
    { num: "712", contenido: "El cheque solo puede ser expedido en formularios impresos de cheques o cheque, a cargo de un banco autorizado. El titulo que en forma de cheques se expida en contravencion a este articulo no producira efectos de titulo-valor." },
    { num: "864", contenido: "El contrato es un acuerdo de dos o mas partes para constituir, regular o extinguir entre ellas una relacion juridica patrimonial, y, salvo estipulacion en contrario, se entendera celebrado en el lugar de residencia del proponente y en el momento en que este reciba la aceptacion de la propuesta." },
    { num: "871", contenido: "Los contratos deberan celebrarse y ejecutarse de buena fe y, en consecuencia, obligaran no solo a lo pactado expresamente en ellos, sino a todo lo que corresponda a la naturaleza de los mismos, segun la ley, la costumbre o la equidad natural." },
    { num: "897", contenido: "Cuando en este Codigo se exprese que un acto no produce efectos, se entendera que es ineficaz de pleno derecho, sin necesidad de declaracion judicial." },
    { num: "905", contenido: "La compraventa es un contrato en que una de las partes se obliga a trasmitir la propiedad de una cosa y la otra a pagarla en dinero. El dinero que el comprador da por la cosa vendida se llama precio." },
    { num: "1036", contenido: "El seguro es un contrato consensual, bilateral, oneroso, aleatorio y de ejecucion sucesiva. El seguro de danos puede ser tambien de ejecucion instantanea." },
    { num: "1045", contenido: "El contrato de seguro es solemne. La solemnidad consiste en que debe constar por escrito. Ningun otro medio de prueba, fuera de la poliza, es admisible para probar su existencia." },
    { num: "1262", contenido: "El transporte es un contrato por medio del cual una de las partes se obliga para con la otra, a cambio de un precio, a conducir de un lugar a otro, por determinado medio y en el plazo fijado, personas o cosas y a entregar estas al destinatario." },
  ];

  for (const art of articulosComercio) {
    articulos.push({
      codigoLegalId: codigoId,
      codigoRef: "CCO",
      libro: "",
      titulo: "",
      capitulo: "",
      numeroArticulo: art.num,
      tituloArticulo: "",
      contenido: art.contenido,
      vigente: true,
    });
  }

  return articulos;
}

function generarArticulosCodigoPenal(codigoId: string) {
  const articulos = [];
  
  const articulosPenal = [
    { num: "1", titulo: "Dignidad humana", contenido: "El derecho penal tendra como fundamento el respeto a la dignidad humana." },
    { num: "2", titulo: "Integracion", contenido: "Las normas y postulados que sobre derechos humanos se encuentren consignados en la Constitucion Politica, en los tratados y convenios internacionales ratificados por Colombia, haran parte integral de este codigo." },
    { num: "3", titulo: "Principios de las sanciones penales", contenido: "La imposicion de la pena o de la medida de seguridad respondera a los principios de necesidad, proporcionalidad y razonabilidad. El principio de necesidad se entendera en el marco de la prevencion y conforme a las instituciones que la desarrollan." },
    { num: "4", titulo: "Funciones de la pena", contenido: "La pena cumplira las funciones de prevencion general, retribucion justa, prevencion especial, reinsercion social y proteccion al condenado. La prevencion especial y la reinsercion social operan en el momento de la ejecucion de la pena de prision." },
    { num: "5", titulo: "Funciones de la medida de seguridad", contenido: "En el momento de la ejecucion de la medida de seguridad operan las funciones de proteccion, curacion, tutela y rehabilitacion." },
    { num: "6", titulo: "Legalidad", contenido: "Nadie podra ser juzgado sino conforme a las leyes preexistentes al acto que se le imputa, ante el juez o tribunal competente y con la observancia de la plenitud de las formas propias de cada juicio. La preexistencia de la norma tambien se aplica para el reenvio en materia de tipos penales en blanco." },
    { num: "7", titulo: "Igualdad", contenido: "La ley penal se aplicara a las personas sin tener en cuenta consideraciones diferentes a las establecidas en ella. El funcionario judicial tendra especial consideracion cuando se trate de valorar el injusto, la culpabilidad y las consecuencias juridicas del delito, en relacion con las personas que se encuentren en las situaciones descritas en el inciso final del articulo 13 de la Constitucion Politica." },
    { num: "8", titulo: "Prohibicion de doble incriminacion", contenido: "A nadie se le podra imputar mas de una vez la misma conducta punible, cualquiera sea la denominacion juridica que se le de o haya dado, salvo lo establecido en los instrumentos internacionales." },
    { num: "9", titulo: "Conducta punible", contenido: "Para que la conducta sea punible se requiere que sea tipica, antijuridica y culpable. La causalidad por si sola no basta para la imputacion juridica del resultado. Para que la conducta del inimputable sea punible se requiere que sea tipica, antijuridica y se constate la inexistencia de causales de ausencia de responsabilidad." },
    { num: "10", titulo: "Tipicidad", contenido: "La ley penal definira de manera inequivoca, expresa y clara las caracteristicas basicas estructurales del tipo penal. En los tipos de omision tambien el deber tendra que estar consagrado y delimitado claramente en la Constitucion Politica o en la ley." },
    { num: "11", titulo: "Antijuridicidad", contenido: "Para que una conducta tipica sea punible se requiere que lesione o ponga efectivamente en peligro, sin justa causa, el bien juridicamente tutelado por la ley penal." },
    { num: "12", titulo: "Culpabilidad", contenido: "Solo se podra imponer penas por conductas realizadas con culpabilidad. Queda erradicada toda forma de responsabilidad objetiva." },
    { num: "21", titulo: "Modalidades de la conducta punible", contenido: "La conducta es dolosa, culposa o preterintencional. La culpa y la preterintencion solo son punibles en los casos expresamente senalados por la ley." },
    { num: "22", titulo: "Dolo", contenido: "La conducta es dolosa cuando el agente conoce los hechos constitutivos de la infraccion penal y quiere su realizacion. Tambien sera dolosa la conducta cuando la realizacion de la infraccion penal ha sido prevista como probable y su no produccion se deja librada al azar." },
    { num: "23", titulo: "Culpa", contenido: "La conducta es culposa cuando el resultado tipico es producto de la infraccion al deber objetivo de cuidado y el agente debio haberlo previsto por ser previsible, o habiendolo previsto, confio en poder evitarlo." },
    { num: "24", titulo: "Preterintencion", contenido: "La conducta es preterintencional cuando su resultado, siendo previsible, excede la intencion del agente." },
    { num: "25", titulo: "Accion y omision", contenido: "La conducta punible puede ser realizada por accion o por omision. Quien tuviere el deber juridico de impedir un resultado perteneciente a una descripcion tipica y no lo llevare a cabo, estando en posibilidad de hacerlo, quedara sujeto a la pena contemplada en la respectiva norma penal." },
    { num: "27", titulo: "Tentativa", contenido: "El que iniciare la ejecucion de una conducta punible mediante actos idoneos e inequivocamente dirigidos a su consumacion, y esta no se produjere por circunstancias ajenas a su voluntad, incurrira en pena no menor de la mitad del minimo ni mayor de las tres cuartas partes del maximo de la senalada para la conducta punible consumada." },
    { num: "28", titulo: "Concurso de personas en la conducta punible", contenido: "Concurren en la realizacion de la conducta punible los autores y los participes." },
    { num: "29", titulo: "Autores", contenido: "Es autor quien realice la conducta punible por si mismo o utilizando a otro como instrumento. Son coautores los que, mediando un acuerdo comun, actuan con division del trabajo criminal atendiendo la importancia del aporte. Tambien es autor quien actua como miembro u organo de representacion autorizado o de hecho de una persona juridica, de un ente colectivo sin tal atributo, o de una persona natural cuya representacion voluntaria se detente." },
    { num: "30", titulo: "Participes", contenido: "Son participes el determinador y el complice. Quien determine a otro a realizar la conducta antijuridica incurrira en la pena prevista para la infraccion. Quien contribuya a la realizacion de la conducta antijuridica o preste una ayuda posterior, por concierto previo o concomitante a la misma, incurrira en la pena prevista para la correspondiente infraccion disminuida de una sexta parte a la mitad." },
    { num: "31", titulo: "Concurso de conductas punibles", contenido: "El que con una sola accion u omision o con varias acciones u omisiones infrinja varias disposiciones de la ley penal o varias veces la misma disposicion, quedara sometido a la que establezca la pena mas grave segun su naturaleza, aumentada hasta en otro tanto, sin que fuere superior a la suma aritmetica de las que correspondan a las respectivas conductas punibles debidamente dosificadas cada una de ellas." },
    { num: "32", titulo: "Ausencia de responsabilidad", contenido: "No habra lugar a responsabilidad penal cuando: 1. En los eventos de caso fortuito y fuerza mayor. 2. Se actue con el consentimiento validamente emitido por parte del titular del bien juridico, en los casos en que se puede disponer del mismo. 3. Se obre en estricto cumplimiento de un deber legal. 4. Se obre en cumplimiento de orden legitima de autoridad competente emitida con las formalidades legales. 5. Se obre en legitimo ejercicio de un derecho, de una actividad licita o de un cargo publico. 6. Se obre por la necesidad de defender un derecho propio o ajeno contra injusta agresion actual o inminente, siempre que la defensa sea proporcionada a la agresion. 7. Se obre por la necesidad de proteger un derecho propio o ajeno de un peligro actual o inminente, inevitable de otra manera, que el agente no haya causado intencionalmente o por imprudencia y que no tenga el deber juridico de afrontar." },
    { num: "34", titulo: "Punibilidad del interviniente", contenido: "El servidor publico que en ejercicio de sus funciones sea determinador o complice de la conducta punible tendra pena aumentada de una sexta parte a la mitad. Incurrira en la misma pena el particular que ejerciendo funciones publicas, actue como determinador o complice." },
    { num: "35", titulo: "Clases de penas principales", contenido: "Son penas principales: La privativa de la libertad de prision y arresto. La pecuniaria de multa. Las demas privativas de otros derechos que como tal se consagren en la parte especial." },
    { num: "103", titulo: "Homicidio", contenido: "El que matare a otro, incurrira en prision de doscientos ocho (208) a cuatrocientos cincuenta (450) meses." },
    { num: "104", titulo: "Circunstancias de agravacion", contenido: "La pena sera de cuatrocientos (400) a seiscientos (600) meses de prision, si la conducta descrita en el articulo anterior se cometiere: 1. En la persona del ascendiente o descendiente, conyuge, companero o companera permanente, hermano, adoptante o adoptivo, o pariente hasta el segundo grado de afinidad. 2. Para preparar, facilitar o consumar otra conducta punible; para ocultarla, asegurar su producto o la impunidad, para si o para los copartícipes. 3. Por medio de cualquiera de las conductas previstas en el Capitulo II del Titulo XII y en el Capitulo I del Titulo XIII, del libro segundo de este codigo. 4. Por precio, promesa remuneratoria, animo de lucro o por otro motivo abyecto o futil. 5. Valiendose de la actividad de inimputable. 6. Con sevicia. 7. Colocando a la victima en situacion de indefension o inferioridad o aprovechandose de esta situacion. 8. Con fines terroristas o en desarrollo de actividades terroristas. 9. En persona internacionalmente protegida diferente a las contempladas en el Titulo II de este Libro y agentes diplomaticos, de conformidad con los Tratados y Convenios Internacionales ratificados por Colombia. 10. Si se cometiere contra un miembro de una organizacion sindical legalmente reconocida. 11. Si se cometiere contra un periodista, defensor de Derechos Humanos u operador de justicia." },
    { num: "105", titulo: "Homicidio preterintencional", contenido: "El que preterintencionalmente matare a otro, incurrira en la pena imponible de acuerdo con los dos articulos anteriores disminuida de una tercera parte a la mitad." },
    { num: "106", titulo: "Homicidio por piedad", contenido: "El que matare a otro por piedad, para poner fin a intensos sufrimientos provenientes de lesion corporal o enfermedad grave e incurable, incurrira en prision de dieciseis (16) a cincuenta y cuatro (54) meses." },
    { num: "107", titulo: "Induccion o ayuda al suicidio", contenido: "El que eficazmente induzca a otro al suicidio, o le preste una ayuda efectiva para su realizacion, incurrira en prision de treinta y dos (32) a ciento ocho (108) meses. Cuando la induccion o ayuda este dirigida a poner fin a intensos sufrimientos provenientes de lesion corporal o enfermedad grave e incurable, se incurrira en prision de dieciseis (16) a treinta y seis (36) meses." },
    { num: "108", titulo: "Muerte de hijo fruto de acceso carnal violento", contenido: "La madre que durante el nacimiento o dentro de los ocho (8) dias siguientes matare a su hijo, fruto de acceso carnal o acto sexual sin consentimiento, o abusivo, o de inseminacion artificial o transferencia de ovulo fecundado no consentidas, incurrira en prision de sesenta y cuatro (64) a ciento ocho (108) meses." },
    { num: "109", titulo: "Homicidio culposo", contenido: "El que por culpa matare a otro, incurrira en prision de treinta y dos (32) a ciento ocho (108) meses y multa de veinte punto sesenta y seis (26.66) a ciento cincuenta (150) salarios minimos legales mensuales vigentes." },
    { num: "111", titulo: "Lesiones", contenido: "El que cause a otro dano en el cuerpo o en la salud, incurrira en las sanciones establecidas en los articulos siguientes." },
    { num: "205", titulo: "Acceso carnal violento", contenido: "El que realice acceso carnal con otra persona mediante violencia, incurrira en prision de doce (12) a veinte (20) anos." },
    { num: "206", titulo: "Acto sexual violento", contenido: "El que realice en otra persona acto sexual diverso al acceso carnal mediante violencia, incurrira en prision de ocho (8) a dieciseis (16) anos." },
    { num: "208", titulo: "Acceso carnal abusivo con menor de catorce anos", contenido: "El que acceda carnalmente a persona menor de catorce (14) anos, incurrira en prision de doce (12) a veinte (20) anos." },
    { num: "239", titulo: "Hurto", contenido: "El que se apodere de una cosa mueble ajena, con el proposito de obtener provecho para si o para otro, incurrira en prision de treinta y dos (32) a ciento ocho (108) meses." },
    { num: "240", titulo: "Hurto calificado", contenido: "La pena sera de prision de setenta y dos (72) a ciento noventa y dos (192) meses, cuando el hurto se cometiere: 1. Con violencia sobre las cosas. 2. Colocando a la victima en condiciones de indefension o inferioridad o aprovechandose de tales condiciones. 3. Mediante penetracion o permanencia arbitraria, enganosa o clandestina en lugar habitado o en sus dependencias inmediatas, aunque alli no se encuentren sus moradores. 4. Con escalonamiento, o con llave sustraida o falsa, ganziua o cualquier otro instrumento similar, o violando o superando seguridades electronicas u otras semejantes." },
    { num: "244", titulo: "Extorsion", contenido: "El que constrina a otro a hacer, tolerar u omitir alguna cosa, con el proposito de obtener provecho ilicito o cualquier utilidad ilicita o beneficio ilicito, para si o para un tercero, incurrira en prision de ciento noventa y dos (192) a doscientos ochenta y ocho (288) meses y multa de ochocientos (800) a mil ochocientos (1800) salarios minimos legales mensuales vigentes." },
    { num: "245", titulo: "Estafa", contenido: "El que obtenga provecho ilicito para si o para un tercero, con perjuicio ajeno, induciendo o manteniendo a otro en error por medio de artificios o enganos, incurrira en prision de treinta y dos (32) a ciento cuarenta y cuatro (144) meses y multa de sesenta y seis punto sesenta y seis (66.66) a mil quinientos (1.500) salarios minimos legales mensuales vigentes." },
    { num: "246", titulo: "Abuso de confianza", contenido: "El que se apropie en provecho suyo o de un tercero, de cosa mueble ajena, que se le haya confiado o entregado por un titulo no traslativo de dominio, incurrira en prision de dieciseis (16) a setenta y dos (72) meses y multa de trece punto treinta y tres (13.33) a trescientos (300) salarios minimos legales mensuales vigentes." },
    { num: "376", titulo: "Trafico, fabricacion o porte de estupefacientes", contenido: "El que sin permiso de autoridad competente, salvo lo dispuesto sobre dosis para uso personal, introduzca al pais, asi sea en transito o saque de el, transporte, lleve consigo, almacene, conserve, elabore, venda, ofrezca, adquiera, financie o suministre a cualquier titulo sustancia estupefaciente, sicotropica o drogas sinteticas que se encuentren contempladas en los cuadros uno, dos, tres y cuatro del Convenio de las Naciones Unidas sobre Sustancias Sicotropicas, incurrira en prision de ciento veintiocho (128) a trescientos sesenta (360) meses y multa de mil trescientos treinta y cuatro (1.334) a cincuenta mil (50.000) salarios minimos legales mensuales vigentes." },
    { num: "397", titulo: "Peculado por apropiacion", contenido: "El servidor publico que se apropie en provecho suyo o de un tercero de bienes del Estado o de empresas o instituciones en que este tenga parte o de bienes o fondos parafiscales, o de bienes de particulares cuya administracion, tenencia o custodia se le haya confiado por razon o con ocasion de sus funciones, incurrira en prision de noventa y seis (96) a doscientos setenta (270) meses, multa equivalente al valor de lo apropiado sin que supere el equivalente a cincuenta mil (50.000) salarios minimos legales mensuales vigentes, e inhabilitacion para el ejercicio de derechos y funciones publicas por el mismo termino de la pena principal." },
    { num: "404", titulo: "Concusion", contenido: "El servidor publico que abusando de su cargo o de sus funciones constrina o induzca a alguien a dar o prometer al mismo servidor o a un tercero, dinero o cualquier otra utilidad indebidos, o los solicite, incurrira en prision de noventa y seis (96) a ciento ochenta (180) meses, multa de sesenta y seis punto sesenta y seis (66.66) a ciento cincuenta (150) salarios minimos legales mensuales vigentes, e inhabilitacion para el ejercicio de derechos y funciones publicas de ochenta (80) a ciento cuarenta y cuatro (144) meses." },
    { num: "405", titulo: "Cohecho propio", contenido: "El servidor publico que reciba para si o para otro, dinero u otra utilidad, o acepte promesa remuneratoria, directa o indirectamente, para retardar u omitir un acto propio de su cargo, o para ejecutar uno contrario a sus deberes oficiales, incurrira en prision de ochenta (80) a ciento cuarenta y cuatro (144) meses, multa de sesenta y seis punto sesenta y seis (66.66) a ciento cincuenta (150) salarios minimos legales mensuales vigentes, e inhabilitacion para el ejercicio de derechos y funciones publicas de ochenta (80) a ciento cuarenta y cuatro (144) meses." },
    { num: "406", titulo: "Cohecho impropio", contenido: "El servidor publico que acepte para si o para otro, dinero u otra utilidad o promesa remuneratoria, directa o indirecta, por acto que deba ejecutar en el desempeno de sus funciones, incurrira en prision de sesenta y cuatro (64) a ciento veintiséis (126) meses, multa de sesenta y seis punto sesenta y seis (66.66) a ciento cincuenta (150) salarios minimos legales mensuales vigentes, e inhabilitacion para el ejercicio de derechos y funciones publicas de ochenta (80) a ciento cuarenta y cuatro (144) meses." },
    { num: "413", titulo: "Prevaricato por accion", contenido: "El servidor publico que profiera resolucion, dictamen o concepto manifiestamente contrario a la ley, incurrira en prision de cuarenta y ocho (48) a ciento cuarenta y cuatro (144) meses, multa de sesenta y seis punto sesenta y seis (66.66) a trescientos (300) salarios minimos legales mensuales vigentes, e inhabilitacion para el ejercicio de derechos y funciones publicas de ochenta (80) a ciento cuarenta y cuatro (144) meses." },
    { num: "442", titulo: "Falsedad ideologica en documento publico", contenido: "El servidor publico que en ejercicio de sus funciones, al extender documento publico que pueda servir de prueba, consigne una falsedad o calle total o parcialmente la verdad, incurrira en prision de sesenta y cuatro (64) a ciento cuarenta y cuatro (144) meses e inhabilitacion para el ejercicio de derechos y funciones publicas de ochenta (80) a ciento cuarenta y cuatro (144) meses." },
    { num: "453", titulo: "Fraude procesal", contenido: "El que por cualquier medio fraudulento induzca en error a un servidor publico para obtener sentencia, resolucion o acto administrativo contrario a la ley, incurrira en prision de noventa y seis (96) a ciento ochenta (180) meses y multa de ciento treinta y tres punto treinta y tres (133.33) a mil quinientos (1.500) salarios minimos legales mensuales vigentes." },
  ];

  for (const art of articulosPenal) {
    articulos.push({
      codigoLegalId: codigoId,
      codigoRef: "CP",
      libro: "",
      titulo: "",
      capitulo: "",
      numeroArticulo: art.num,
      tituloArticulo: art.titulo || "",
      contenido: art.contenido,
      vigente: true,
    });
  }

  return articulos;
}

function generarArticulosProcedimientoPenal(codigoId: string) {
  return generarArticulosGenericos("CPP", codigoId, 50);
}

function generarArticulosCGP(codigoId: string) {
  return generarArticulosGenericos("CGP", codigoId, 50);
}

function generarArticulosCodigoLaboral(codigoId: string) {
  const articulos = [];
  
  const articulosLaboral = [
    { num: "1", titulo: "Objeto", contenido: "La finalidad primordial de este Codigo es la de lograr la justicia en las relaciones que surgen entre empleadores y trabajadores, dentro de un espiritu de coordinacion economica y equilibrio social." },
    { num: "5", titulo: "Definicion de trabajo", contenido: "El trabajo que regula este Codigo es toda actividad humana libre, ya sea material o intelectual, permanente o transitoria, que una persona natural ejecuta conscientemente al servicio de otra, y cualquiera que sea su finalidad, siempre que se efectue en ejecucion de un contrato de trabajo." },
    { num: "22", titulo: "Definicion de contrato de trabajo", contenido: "1. Contrato de trabajo es aquel por el cual una persona natural se obliga a prestar un servicio personal a otra persona, natural o juridica, bajo la continuada dependencia o subordinacion de la segunda y mediante remuneracion. 2. Quien presta el servicio se denomina trabajador, quien lo recibe y remunera, empleador, y la remuneracion, cualquiera que sea su forma, salario." },
    { num: "23", titulo: "Elementos esenciales", contenido: "1. Para que haya contrato de trabajo se requiere que concurran estos tres elementos esenciales: a) La actividad personal del trabajador, es decir, realizada por si mismo; b) La continuada subordinacion o dependencia del trabajador respecto del empleador, que faculta a este para exigirle el cumplimiento de ordenes, en cualquier momento, en cuanto al modo, tiempo o cantidad de trabajo, e imponerle reglamentos, la cual debe mantenerse por todo el tiempo de duracion del contrato. Todo ello sin que afecte el honor, la dignidad y los derechos minimos del trabajador en concordancia con los tratados o convenios internacionales que sobre derechos humanos relativos a la materia obliguen al pais; y c) Un salario como retribucion del servicio." },
    { num: "24", titulo: "Presuncion", contenido: "Se presume que toda relacion de trabajo personal esta regida por un contrato de trabajo." },
    { num: "25", titulo: "Concurrencia de contratos", contenido: "Aunque el contrato de trabajo se presente involucrado o en concurrencia con otro, u otros, no pierde su naturaleza, y le son aplicables, por tanto, las normas de este Codigo." },
    { num: "37", titulo: "Forma", contenido: "El contrato de trabajo puede ser verbal o escrito; para su validez no requiere forma especial alguna, salvo disposicion expresa en contrario." },
    { num: "38", titulo: "Contrato verbal", contenido: "Cuando el contrato sea verbal, el empleador y el trabajador deben ponerse de acuerdo, al menos acerca de los siguientes puntos: 1. La indole del trabajo y el sitio en donde ha de realizarse; 2. La cuantia y forma de la remuneracion, ya sea por unidad de tiempo, por obra ejecutada, por tarea, a destajo u otra cualquiera, y los periodos que regulen su pago; 3. La duracion del contrato." },
    { num: "45", titulo: "Duracion", contenido: "El contrato de trabajo puede celebrarse por tiempo determinado, por el tiempo que dure la realizacion de una obra o labor determinada, por tiempo indefinido o para ejecutar un trabajo ocasional, accidental o transitorio." },
    { num: "46", titulo: "Contrato a termino fijo", contenido: "El contrato de trabajo a termino fijo debe constar siempre por escrito y su duracion no puede ser superior a tres anos, pero es renovable indefinidamente. 1. Si antes de la fecha del vencimiento del termino estipulado, ninguna de las partes avisare por escrito a la otra su determinacion de no prorrogar el contrato, con una antelacion no inferior a treinta (30) dias, este se entendera renovado por un periodo igual al inicialmente pactado, y asi sucesivamente." },
    { num: "47", titulo: "Duracion indefinida", contenido: "1o) El contrato de trabajo no estipulado a termino fijo, o cuya duracion no este determinada por la de la obra, o la naturaleza de la labor contratada, o no se refiera a un trabajo ocasional o transitorio, sera contrato a termino indefinido." },
    { num: "57", titulo: "Obligaciones especiales del empleador", contenido: "Son obligaciones especiales del empleador: 1. Poner a disposicion de los trabajadores, salvo estipulacion en contrario, los instrumentos adecuados y las materias primas necesarias para la realizacion de las labores. 2. Procurar a los trabajadores locales apropiados y elementos adecuados de proteccion contra los accidentes y enfermedades profesionales en forma que se garanticen razonablemente la seguridad y la salud. 3. Prestar inmediatamente los primeros auxilios en caso de accidente o de enfermedad. A este efecto en todo establecimiento, taller o fabrica que ocupe habitualmente mas de diez (10) trabajadores, debera mantenerse lo necesario, segun reglamentacion de las autoridades sanitarias. 4. Pagar la remuneracion pactada en las condiciones, periodos y lugares convenidos. 5. Guardar absoluto respeto a la dignidad personal del trabajador, a sus creencias y sentimientos." },
    { num: "58", titulo: "Obligaciones especiales del trabajador", contenido: "Son obligaciones especiales del trabajador: 1a. Realizar personalmente la labor, en los terminos estipulados; observar los preceptos del reglamento y acatar y cumplir las ordenes e instrucciones que de modo particular la impartan el empleador o sus representantes, segun el orden jerarquico establecido. 2a. No comunicar con terceros, salvo la autorizacion expresa, las informaciones que tenga sobre su trabajo, especialmente sobre las cosas que sean de naturaleza reservada o cuya divulgacion pueda ocasionar perjuicios al empleador, lo que no obsta para denunciar delitos comunes o violaciones del contrato o de las normas legales del trabajo ante las autoridades competentes. 3a. Conservar y restituir un buen estado, salvo el deterioro natural, los instrumentos y utiles que le hayan sido facilitados y las materias primas sobrantes." },
    { num: "61", titulo: "Terminacion del contrato", contenido: "1. El contrato de trabajo termina: a) Por muerte del trabajador; b) Por mutuo consentimiento; c) Por expiracion del plazo fijo pactado; d) Por terminacion de la obra o labor contratada; e) Por liquidacion o clausura definitiva de la empresa o establecimiento; f) Por suspension de actividades por parte del empleador durante mas de ciento veinte (120) dias; g) Por sentencia ejecutoriada; h) Por decision unilateral en los casos de los articulos 7o., del Decreto Ley 2351 de 1965, y 6o. de esta ley." },
    { num: "62", titulo: "Terminacion del contrato por justa causa", contenido: "Son justas causas para dar por terminado unilateralmente el contrato de trabajo: A). Por parte del empleador: 1. El haber sufrido engano por parte del trabajador, mediante la presentacion de certificados falsos para su admision o tendientes a obtener un provecho indebido. 2. Todo acto de violencia, injuria, malos tratamientos o grave indisciplina en que incurra el trabajador en sus labores, contra el empleador, los miembros de su familia, el personal directivo o los companeros de trabajo. 3. Todo acto grave de violencia, injuria o malos tratamientos en que incurra el trabajador fuera del servicio, en contra del empleador, de los miembros de su familia o de sus representantes y socios, jefes de taller, vigilantes o celadores." },
    { num: "64", titulo: "Terminacion unilateral del contrato de trabajo sin justa causa", contenido: "En todo contrato de trabajo va envuelta la condicion resolutoria por incumplimiento de lo pactado, con indemnizacion de perjuicios a cargo de la parte responsable. Esta indemnizacion comprende el lucro cesante y el dano emergente." },
    { num: "127", titulo: "Elementos integrantes", contenido: "Constituye salario no solo la remuneracion ordinaria, fija o variable, sino todo lo que recibe el trabajador en dinero o en especie como contraprestacion directa del servicio, sea cualquiera la forma o denominacion que se adopte, como primas, sobresueldos, bonificaciones habituales, valor del trabajo suplementario o de las horas extras, valor del trabajo en dias de descanso obligatorio, porcentajes sobre ventas y comisiones." },
    { num: "132", titulo: "Formas y libertad de estipulacion", contenido: "1. El empleador y el trabajador pueden convenir libremente el salario en sus diversas modalidades como por unidad de tiempo, por obra, o a destajo y por tarea, etc., pero siempre respetando el salario minimo legal o el fijado en los pactos, convenciones colectivas y fallos arbitrales." },
    { num: "145", titulo: "Definicion del salario minimo", contenido: "Salario minimo es el que todo trabajador tiene derecho a percibir para subvenir a sus necesidades normales y a las de su familia, en el orden material, moral y cultural." },
    { num: "158", titulo: "Jornada ordinaria", contenido: "La duracion maxima de la jornada ordinaria de trabajo es de ocho (8) horas al dia y cuarenta y ocho (48) a la semana." },
    { num: "159", titulo: "Trabajo suplementario", contenido: "Trabajo suplementario o de horas extras es el que excede de la jornada ordinaria, y en todo caso el que excede de la maxima legal." },
    { num: "161", titulo: "Excepciones en determinadas actividades", contenido: "Quedan excluidos de la regulacion sobre la jornada maxima legal de trabajo los siguientes trabajadores: a) Los que desempenan cargos de direccion, de confianza o de manejo; b) Los del servicio domestico, ya se trate de labores en los centros urbanos o en el campo; c) Los que ejerciten actividades discontinuas o intermitentes y los de simple vigilancia, cuando residan en el lugar o sitio de trabajo." },
    { num: "172", titulo: "Norma general", contenido: "Salvo la excepcion consagrada en el literal c) del articulo 20 de esta ley el empleador esta obligado a dar descanso dominical remunerado a todos sus trabajadores. Este descanso tiene una duracion minima de veinticuatro (24) horas." },
    { num: "186", titulo: "Duracion de las vacaciones", contenido: "1. Los trabajadores que hubieren prestado sus servicios durante un ano tienen derecho a quince (15) dias habiles consecutivos de vacaciones remuneradas. 2. Los profesionales y ayudantes que trabajan en establecimientos privados dedicados a la lucha contra la tuberculosis, y los ocupados en la aplicacion de rayos X, tienen derecho a gozar de quince (15) dias de vacaciones remuneradas por cada seis (6) meses de servicios prestados." },
    { num: "230", titulo: "Prima de servicios", contenido: "1. Toda empresa de caracter permanente esta obligada a pagar a cada uno de sus trabajadores, excepto a los ocasionales o transitorios, como prestacion especial, una prima de servicios. 2. Esta prima de servicios reemplaza la participacion de utilidades y la prima de beneficios que establecio la legislacion anterior." },
    { num: "249", titulo: "Regla general de la cesantia", contenido: "Todo empleador esta obligado a pagar a sus trabajadores, y a las demas personas que se indican en este Capitulo, al terminar el contrato de trabajo, como auxilio de cesantia, un mes de salario por cada ano de servicios y proporcionalmente por fraccion de ano." },
    { num: "259", titulo: "Proteccion a la maternidad", contenido: "1. Toda trabajadora en estado de embarazo tiene derecho a una licencia de dieciocho (18) semanas en la epoca de parto, remunerada con el salario que devengue al entrar a disfrutar del descanso. 2. Si se tratare de un salario que no sea fijo, como en el caso de trabajo a destajo o por tarea, se tomara en cuenta el salario promedio devengado por la trabajadora en el ultimo ano de servicios, o en todo el tiempo si fuere menor. 3. Para los efectos de la licencia de que trata este articulo, la trabajadora debe presentar al empleador un certificado medico, en el cual debe constar: a) El estado de embarazo de la trabajadora; b) La indicacion del dia probable del parto, y c) La indicacion del dia desde el cual debe empezar la licencia, teniendo en cuenta que, por lo menos, ha de iniciarse dos semanas antes del parto." },
    { num: "353", titulo: "Derecho de asociacion", contenido: "1. De acuerdo con el articulo 39 de la Constitucion Politica los empleadores y los trabajadores tienen el derecho de asociarse libremente en defensa de sus intereses, formando asociaciones profesionales o sindicatos; estos poseen el derecho de unirse o federarse entre si. 2. Las asociaciones profesionales o sindicatos deben ajustarse en el ejercicio de sus derechos y cumplimiento de sus deberes, a las normas de este titulo y estan sometidos a la inspeccion y vigilancia del Gobierno, en cuanto concierne al orden publico." },
    { num: "429", titulo: "Definicion de huelga", contenido: "Se entiende por huelga la suspension colectiva temporal y pacifica del trabajo, efectuada por los trabajadores de un establecimiento o empresa con fines economicos y profesionales propuestos a sus empleadores y previos los tramites establecidos en el presente titulo." },
  ];

  for (const art of articulosLaboral) {
    articulos.push({
      codigoLegalId: codigoId,
      codigoRef: "CST",
      libro: "",
      titulo: "",
      capitulo: "",
      numeroArticulo: art.num,
      tituloArticulo: art.titulo,
      contenido: art.contenido,
      vigente: true,
    });
  }

  return articulos;
}

function generarArticulosCPACA(codigoId: string) {
  return generarArticulosGenericos("CPACA", codigoId, 50);
}

function generarArticulosInfancia(codigoId: string) {
  return generarArticulosGenericos("CIA", codigoId, 50);
}

function generarArticulosEstatutoTributario(codigoId: string) {
  return generarArticulosGenericos("ET", codigoId, 100);
}

function generarArticulosCodigoPolicia(codigoId: string) {
  return generarArticulosGenericos("CNP", codigoId, 50);
}

function generarArticulosGenericos(codigoRef: string, codigoId: string, cantidad: number) {
  const articulos = [];
  
  for (let i = 1; i <= cantidad; i++) {
    articulos.push({
      codigoLegalId: codigoId,
      codigoRef: codigoRef,
      libro: "",
      titulo: "",
      capitulo: "",
      numeroArticulo: String(i),
      tituloArticulo: `Articulo ${i}`,
      contenido: `Contenido del articulo ${i} del codigo ${codigoRef}. Este articulo sera actualizado con el contenido oficial correspondiente.`,
      vigente: true,
    });
  }

  return articulos;
}

export async function GET() {
  return NextResponse.json({ 
    message: "Usa POST para insertar los codigos legales",
    codigosDisponibles: CODIGOS_LEGALES.map(c => ({ codigo: c.codigo, nombre: c.nombre }))
  });
}
