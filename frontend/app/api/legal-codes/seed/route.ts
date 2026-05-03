import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import mongoose from "mongoose"

// Lista completa de códigos legales colombianos
const legalCodes = [
  // CONSTITUCIÓN
  {
    code: "CN",
    name: "Constitucion Politica de Colombia",
    description: "Constitucion de 1991 - Norma suprema del ordenamiento juridico colombiano",
    category: "Derecho Constitucional",
    tags: ["Derecho Constitucional", "Derechos Fundamentales"],
    year: 1991,
    articles: [
      { number: "1", title: "Principios fundamentales", content: "Colombia es un Estado social de derecho, organizado en forma de República unitaria, descentralizada, con autonomía de sus entidades territoriales, democrática, participativa y pluralista, fundada en el respeto de la dignidad humana, en el trabajo y la solidaridad de las personas que la integran y en la prevalencia del interés general." },
      { number: "2", title: "Fines del Estado", content: "Son fines esenciales del Estado: servir a la comunidad, promover la prosperidad general y garantizar la efectividad de los principios, derechos y deberes consagrados en la Constitución..." },
      { number: "4", title: "Supremacia constitucional", content: "La Constitución es norma de normas. En todo caso de incompatibilidad entre la Constitución y la ley u otra norma jurídica, se aplicarán las disposiciones constitucionales." },
      { number: "11", title: "Derecho a la vida", content: "El derecho a la vida es inviolable. No habrá pena de muerte." },
      { number: "12", title: "Prohibicion tortura", content: "Nadie será sometido a desaparición forzada, a torturas ni a tratos o penas crueles, inhumanos o degradantes." },
      { number: "13", title: "Igualdad", content: "Todas las personas nacen libres e iguales ante la ley, recibirán la misma protección y trato de las autoridades y gozarán de los mismos derechos, libertades y oportunidades sin ninguna discriminación..." },
      { number: "14", title: "Personalidad juridica", content: "Toda persona tiene derecho al reconocimiento de su personalidad jurídica." },
      { number: "15", title: "Intimidad", content: "Todas las personas tienen derecho a su intimidad personal y familiar y a su buen nombre, y el Estado debe respetarlos y hacerlos respetar." },
      { number: "16", title: "Libre desarrollo personalidad", content: "Todas las personas tienen derecho al libre desarrollo de su personalidad sin más limitaciones que las que imponen los derechos de los demás y el orden jurídico." },
      { number: "17", title: "Prohibicion esclavitud", content: "Se prohíben la esclavitud, la servidumbre y la trata de seres humanos en todas sus formas." },
      { number: "18", title: "Libertad de conciencia", content: "Se garantiza la libertad de conciencia. Nadie será molestado por razón de sus convicciones o creencias ni compelido a revelarlas ni obligado a actuar contra su conciencia." },
      { number: "23", title: "Derecho de peticion", content: "Toda persona tiene derecho a presentar peticiones respetuosas a las autoridades por motivos de interés general o particular y a obtener pronta resolución. El legislador podrá reglamentar su ejercicio ante organizaciones privadas para garantizar los derechos fundamentales." },
      { number: "29", title: "Debido proceso", content: "El debido proceso se aplicará a toda clase de actuaciones judiciales y administrativas. Nadie podrá ser juzgado sino conforme a leyes preexistentes al acto que se le imputa..." },
      { number: "86", title: "Accion de tutela", content: "Toda persona tendrá acción de tutela para reclamar ante los jueces, en todo momento y lugar, mediante un procedimiento preferente y sumario, por sí misma o por quien actúe a su nombre, la protección inmediata de sus derechos constitucionales fundamentales..." },
      { number: "87", title: "Accion de cumplimiento", content: "Toda persona podrá acudir ante la autoridad judicial para hacer efectivo el cumplimiento de una ley o un acto administrativo." },
      { number: "88", title: "Acciones populares", content: "La ley regulará las acciones populares para la protección de los derechos e intereses colectivos, relacionados con el patrimonio, el espacio, la seguridad y la salubridad públicos..." },
      { number: "228", title: "Administracion de justicia", content: "La Administración de Justicia es función pública. Sus decisiones son independientes. Las actuaciones serán públicas y permanentes con las excepciones que establezca la ley..." },
      { number: "229", title: "Acceso a la justicia", content: "Se garantiza el derecho de toda persona para acceder a la administración de justicia. La ley indicará en qué casos podrá hacerlo sin la representación de abogado." },
    ]
  },
  // CÓDIGO CIVIL
  {
    code: "CC",
    name: "Codigo Civil Colombiano",
    description: "Ley 84 de 1873 - Regula las relaciones civiles de los particulares",
    category: "Derecho Civil",
    tags: ["Derecho Civil", "Contratos", "Obligaciones"],
    year: 1873,
    articles: [
      { number: "1494", title: "Fuentes de las obligaciones", content: "Las obligaciones nacen, ya del concurso real de las voluntades de dos o más personas, como en los contratos o convenciones; ya de un hecho voluntario de la persona que se obliga, como en la aceptación de una herencia o legado y en todos los cuasicontratos; ya a consecuencia de un hecho que ha inferido injuria o daño a otra persona, como en los delitos; ya por disposición de la ley, como entre los padres y los hijos de familia." },
      { number: "1495", title: "Definicion de contrato", content: "Contrato o convención es un acto por el cual una parte se obliga para con otra a dar, hacer o no hacer alguna cosa. Cada parte puede ser de una o de muchas personas." },
      { number: "1496", title: "Contrato unilateral y bilateral", content: "El contrato es unilateral cuando una de las partes se obliga para con otra que no contrae obligación alguna; y bilateral, cuando las partes contratantes se obligan recíprocamente." },
      { number: "1502", title: "Requisitos validez obligaciones", content: "Para que una persona se obligue a otra por un acto o declaración de voluntad, es necesario: 1. que sea legalmente capaz; 2. que consienta en dicho acto o declaración y su consentimiento no adolezca de vicio; 3. que recaiga sobre un objeto lícito; 4. que tenga una causa lícita." },
      { number: "1503", title: "Capacidad legal", content: "Toda persona es legalmente capaz, excepto aquellas que la ley declara incapaces." },
      { number: "1508", title: "Vicios del consentimiento", content: "Los vicios de que puede adolecer el consentimiento son: error, fuerza y dolo." },
      { number: "1546", title: "Condicion resolutoria tacita", content: "En los contratos bilaterales va envuelta la condición resolutoria en caso de no cumplirse por uno de los contratantes lo pactado. Pero en tal caso podrá el otro contratante pedir a su arbitrio, o la resolución o el cumplimiento del contrato con indemnización de perjuicios." },
      { number: "1602", title: "Los contratos son ley", content: "Todo contrato legalmente celebrado es una ley para los contratantes, y no puede ser invalidado sino por su consentimiento mutuo o por causas legales." },
      { number: "1603", title: "Buena fe contractual", content: "Los contratos deben ejecutarse de buena fe, y por consiguiente obligan no solo a lo que en ellos se expresa, sino a todas las cosas que emanan precisamente de la naturaleza de la obligación, o que por ley pertenecen a ella." },
      { number: "1604", title: "Responsabilidad del deudor", content: "El deudor no es responsable sino de la culpa lata en los contratos que por su naturaleza solo son útiles al acreedor; es responsable de la leve en los contratos que se hacen para beneficio recíproco de las partes; y de la levísima en los contratos en que el deudor es el único que reporta beneficio." },
      { number: "1613", title: "Indemnizacion de perjuicios", content: "La indemnización de perjuicios comprende el daño emergente y lucro cesante, ya provenga de no haberse cumplido la obligación, o de haberse cumplido imperfectamente, o de haberse retardado el cumplimiento." },
      { number: "1618", title: "Interpretacion de contratos", content: "Conocida claramente la intención de los contratantes, debe estarse a ella más que a lo literal de las palabras." },
      { number: "2341", title: "Responsabilidad extracontractual", content: "El que ha cometido un delito o culpa, que ha inferido daño a otro, es obligado a la indemnización, sin perjuicio de la pena principal que la ley imponga por la culpa o el delito cometido." },
      { number: "2342", title: "Legitimacion para demandar", content: "Puede pedir esta indemnización no sólo el que es dueño o poseedor de la cosa sobre la cual ha recaído el daño o su heredero, sino el usufructuario, el habitador, o el usuario, si el daño irroga perjuicio a su derecho de usufructo, habitación o uso." },
      { number: "2356", title: "Responsabilidad por actividades peligrosas", content: "Por regla general todo daño que pueda imputarse a malicia o negligencia de otra persona, debe ser reparado por ésta." },
    ]
  },
  // CÓDIGO DE COMERCIO
  {
    code: "CCo",
    name: "Codigo de Comercio",
    description: "Decreto 410 de 1971 - Regula las relaciones mercantiles",
    category: "Derecho Comercial",
    tags: ["Derecho Comercial", "Sociedades", "Titulos Valores"],
    year: 1971,
    articles: [
      { number: "1", title: "Aplicabilidad", content: "Los comerciantes y los asuntos mercantiles se regirán por las disposiciones de la ley comercial, y los casos no regulados expresamente en ella serán decididos por analogía de sus normas." },
      { number: "10", title: "Comerciantes", content: "Son comerciantes las personas que profesionalmente se ocupan en alguna de las actividades que la ley considera mercantiles." },
      { number: "20", title: "Actos mercantiles", content: "Son mercantiles para todos los efectos legales: 1. La adquisición de bienes a título oneroso con destino a enajenarlos en igual forma..." },
      { number: "98", title: "Contrato de sociedad", content: "Por el contrato de sociedad dos o más personas se obligan a hacer un aporte en dinero, en trabajo o en otros bienes apreciables en dinero, con el fin de repartirse entre sí las utilidades obtenidas en la empresa o actividad social." },
      { number: "110", title: "Requisitos escritura sociedad", content: "La sociedad comercial se constituirá por escritura pública en la cual se expresará: 1. El nombre y domicilio de las personas que intervengan como otorgantes..." },
      { number: "619", title: "Titulos valores", content: "Los títulos valores son documentos necesarios para legitimar el ejercicio del derecho literal y autónomo que en ellos se incorpora." },
      { number: "621", title: "Requisitos titulos valores", content: "Además de lo dispuesto para cada título-valor en particular, los títulos-valores deberán llenar los requisitos siguientes: 1. La mención del derecho que en el título se incorpora; 2. La firma de quien lo crea." },
      { number: "625", title: "Letra de cambio", content: "La letra de cambio debe contener además de los requisitos establecidos en el artículo 621, los siguientes: 1. La orden incondicional de pagar una suma determinada de dinero..." },
      { number: "713", title: "Cheque", content: "El cheque solo puede ser expedido en formularios impresos de cheques o chequeras, y a cargo de un banco." },
      { number: "774", title: "Pagare", content: "El pagaré debe contener además de los requisitos establecidos en el artículo 621, los siguientes: 1. La promesa incondicional de pagar una suma determinada de dinero..." },
      { number: "822", title: "Principios contratos", content: "Los principios que gobiernan la formación de los actos y contratos y las obligaciones de derecho civil, sus efectos, interpretación, modo de extinguirse, anularse o rescindirse, serán aplicables a las obligaciones y negocios jurídicos mercantiles..." },
      { number: "864", title: "Oferta comercial", content: "La oferta o propuesta, esto es, el proyecto de negocio jurídico que una persona formule a otra, deberá contener los elementos esenciales del negocio y ser comunicada al destinatario." },
      { number: "871", title: "Buena fe mercantil", content: "Los contratos deberán celebrarse y ejecutarse de buena fe y, en consecuencia, obligarán no sólo a lo pactado expresamente en ellos, sino a todo lo que corresponda a la naturaleza de los mismos, según la ley, la costumbre o la equidad natural." },
    ]
  },
  // CÓDIGO PENAL
  {
    code: "CP",
    name: "Codigo Penal",
    description: "Ley 599 de 2000 - Define los delitos y las penas",
    category: "Derecho Penal",
    tags: ["Derecho Penal", "Delitos", "Penas"],
    year: 2000,
    articles: [
      { number: "1", title: "Dignidad humana", content: "El derecho penal tendrá como fundamento el respeto a la dignidad humana." },
      { number: "3", title: "Principios de las sanciones penales", content: "La imposición de la pena o de la medida de seguridad responderá a los principios de necesidad, proporcionalidad y razonabilidad." },
      { number: "6", title: "Legalidad", content: "Nadie podrá ser juzgado sino conforme a las leyes preexistentes al acto que se le imputa, ante el juez o tribunal competente y con la observancia de la plenitud de las formas propias de cada juicio." },
      { number: "7", title: "Igualdad", content: "La ley penal se aplicará a las personas sin tener en cuenta consideraciones diferentes a las establecidas en ella." },
      { number: "9", title: "Conducta punible", content: "Para que la conducta sea punible se requiere que sea típica, antijurídica y culpable. La causalidad por sí sola no basta para la imputación jurídica del resultado." },
      { number: "11", title: "Antijuridicidad", content: "Para que una conducta típica sea punible se requiere que lesione o ponga efectivamente en peligro, sin justa causa, el bien jurídicamente tutelado por la ley penal." },
      { number: "21", title: "Modalidades de la conducta", content: "La conducta es dolosa, culposa o preterintencional. La culpa y la preterintención sólo son punibles en los casos expresamente señalados por la ley." },
      { number: "22", title: "Dolo", content: "La conducta es dolosa cuando el agente conoce los hechos constitutivos de la infracción penal y quiere su realización." },
      { number: "23", title: "Culpa", content: "La conducta es culposa cuando el resultado típico es producto de la infracción al deber objetivo de cuidado y el agente debió haberlo previsto por ser previsible, o habiéndolo previsto, confió en poder evitarlo." },
      { number: "103", title: "Homicidio", content: "El que matare a otro, incurrirá en prisión de doscientos ocho (208) a cuatrocientos cincuenta (450) meses." },
      { number: "111", title: "Lesiones personales", content: "El que cause a otro daño en el cuerpo o en la salud, incurrirá en las sanciones establecidas en los artículos siguientes." },
      { number: "239", title: "Hurto", content: "El que se apodere de una cosa mueble ajena, con el propósito de obtener provecho para sí o para otro, incurrirá en prisión de treinta y dos (32) a ciento ocho (108) meses." },
      { number: "246", title: "Estafa", content: "El que obtenga provecho ilícito para sí o para un tercero, con perjuicio ajeno, induciendo o manteniendo a otro en error por medio de artificios o engaños, incurrirá en prisión de treinta y dos (32) a ciento cuarenta y cuatro (144) meses..." },
    ]
  },
  // CÓDIGO DE PROCEDIMIENTO PENAL
  {
    code: "CPP",
    name: "Codigo de Procedimiento Penal",
    description: "Ley 906 de 2004 - Sistema penal acusatorio",
    category: "Procedimiento Penal",
    tags: ["Procedimiento Penal", "Sistema Acusatorio"],
    year: 2004,
    articles: [
      { number: "1", title: "Dignidad humana", content: "Los intervinientes en el proceso penal serán tratados con el respeto debido a la dignidad humana." },
      { number: "2", title: "Libertad", content: "Toda persona tiene derecho a que se respete su libertad. Nadie podrá ser molestado en su persona ni privado de su libertad sino en virtud de mandamiento escrito de autoridad judicial competente..." },
      { number: "7", title: "Presuncion de inocencia", content: "Toda persona se presume inocente y debe ser tratada como tal, mientras no quede en firme decisión judicial definitiva sobre su responsabilidad penal." },
      { number: "8", title: "Defensa", content: "En desarrollo de la actuación, una vez adquirida la condición de imputado, este tendrá derecho, en plena igualdad respecto del órgano de persecución penal..." },
      { number: "66", title: "Fiscalia General", content: "La Fiscalía General de la Nación está obligada a adelantar el ejercicio de la acción penal y realizar la investigación de los hechos que revistan las características de un delito..." },
      { number: "287", title: "Imputacion", content: "El fiscal hará la imputación fáctica cuando de los elementos materiales probatorios, evidencia física o de la información legalmente obtenida, se pueda inferir razonablemente que el imputado es autor o partícipe del delito que se investiga." },
      { number: "308", title: "Requisitos medida de aseguramiento", content: "El juez de control de garantías, a petición del Fiscal General de la Nación o de su delegado, decretará la medida de aseguramiento cuando de los elementos materiales probatorios y evidencia física recogidos y asegurados o de la información obtenidos legalmente, se pueda inferir razonablemente que el imputado puede ser autor o partícipe de la conducta delictiva que se investiga..." },
      { number: "336", title: "Presentacion escrito de acusacion", content: "El fiscal presentará el escrito de acusación ante el juez competente para adelantar el juicio cuando de los elementos materiales probatorios, evidencia física o información legalmente obtenida, se pueda afirmar, con probabilidad de verdad, que la conducta delictiva existió y que el imputado es su autor o partícipe." },
      { number: "381", title: "Conocimiento para condenar", content: "Para condenar se requiere el conocimiento más allá de toda duda, acerca del delito y de la responsabilidad penal del acusado, fundado en las pruebas debatidas en el juicio." },
    ]
  },
  // CÓDIGO SUSTANTIVO DEL TRABAJO
  {
    code: "CST",
    name: "Codigo Sustantivo del Trabajo",
    description: "Decreto 2663 de 1950 - Regula las relaciones laborales",
    category: "Derecho Laboral",
    tags: ["Derecho Laboral", "Contratos de Trabajo"],
    year: 1950,
    articles: [
      { number: "1", title: "Objeto", content: "La finalidad primordial de este Código es la de lograr la justicia en las relaciones que surgen entre empleadores y trabajadores, dentro de un espíritu de coordinación económica y equilibrio social." },
      { number: "5", title: "Definicion de trabajo", content: "El trabajo que regula este Código es toda actividad humana libre, ya sea material o intelectual, permanente o transitoria, que una persona natural ejecuta conscientemente al servicio de otra, y cualquiera que sea su finalidad, siempre que se efectúe en ejecución de un contrato de trabajo." },
      { number: "22", title: "Contrato de trabajo definicion", content: "Contrato de trabajo es aquel por el cual una persona natural se obliga a prestar un servicio personal a otra persona, natural o jurídica, bajo la continuada dependencia o subordinación de la segunda y mediante remuneración." },
      { number: "23", title: "Elementos esenciales", content: "Para que haya contrato de trabajo se requiere que concurran estos tres elementos esenciales: a) La actividad personal del trabajador; b) La continuada subordinación o dependencia del trabajador respecto del empleador; c) Un salario como retribución del servicio." },
      { number: "24", title: "Presuncion", content: "Se presume que toda relación de trabajo personal está regida por un contrato de trabajo." },
      { number: "47", title: "Duracion", content: "El contrato de trabajo puede celebrarse por tiempo determinado, por el tiempo que dure la realización de una obra o labor determinada, por tiempo indefinido o para ejecutar un trabajo ocasional, accidental o transitorio." },
      { number: "57", title: "Obligaciones del empleador", content: "Son obligaciones especiales del empleador: 1. Poner a disposición de los trabajadores los instrumentos adecuados y las materias primas necesarias para la realización de las labores. 2. Procurar a los trabajadores locales apropiados y elementos adecuados de protección..." },
      { number: "62", title: "Terminacion con justa causa", content: "Son justas causas para dar por terminado unilateralmente el contrato de trabajo..." },
      { number: "64", title: "Terminacion sin justa causa", content: "En todo contrato de trabajo va envuelta la condición resolutoria por incumplimiento de lo pactado, con indemnización de perjuicios a cargo de la parte responsable." },
      { number: "127", title: "Elementos integrantes salario", content: "Constituye salario no sólo la remuneración ordinaria, fija o variable, sino todo lo que recibe el trabajador en dinero o en especie como contraprestación directa del servicio, sea cualquiera la forma o denominación que se adopte..." },
      { number: "186", title: "Vacaciones", content: "Los trabajadores que hubieren prestado sus servicios durante un año tienen derecho a quince (15) días hábiles consecutivos de vacaciones remuneradas." },
      { number: "249", title: "Auxilio de cesantia", content: "Todo empleador está obligado a pagar a sus trabajadores, y a las demás personas que se indican en este Capítulo, al terminar el contrato de trabajo, como auxilio de cesantía, un mes de salario por cada año de servicios y proporcionalmente por fracción de año." },
    ]
  },
  // CÓDIGO GENERAL DEL PROCESO
  {
    code: "CGP",
    name: "Codigo General del Proceso",
    description: "Ley 1564 de 2012 - Regula los procedimientos civiles y de familia",
    category: "Derecho Procesal",
    tags: ["Derecho Procesal", "Procedimiento Civil"],
    year: 2012,
    articles: [
      { number: "1", title: "Objeto", content: "Este código regula la actividad procesal en los asuntos civiles, comerciales, de familia y agrarios. Se aplica, además, a todos los asuntos de cualquier jurisdicción o especialidad y a las actuaciones de particulares y autoridades administrativas, cuando ejerzan funciones jurisdiccionales, en cuanto no estén regulados expresamente en otras leyes." },
      { number: "2", title: "Acceso a la justicia", content: "Toda persona o grupo de personas tiene derecho a la tutela jurisdiccional efectiva para el ejercicio de sus derechos y la defensa de sus intereses, con sujeción a un debido proceso de duración razonable." },
      { number: "3", title: "Proceso oral y por audiencias", content: "Las actuaciones se cumplirán en forma oral, pública y en audiencias, salvo las que expresamente se autorice realizar por escrito o estén amparadas por reserva." },
      { number: "7", title: "Igualdad de las partes", content: "El juez debe hacer uso de los poderes que este código le otorga para lograr la igualdad real de las partes." },
      { number: "11", title: "Interpretacion de las normas procesales", content: "Al interpretar la ley procesal el juez deberá tener en cuenta que el objeto de los procedimientos es la efectividad de los derechos reconocidos por la ley sustancial." },
      { number: "82", title: "Demanda", content: "Salvo disposición en contrario, el proceso comenzará por demanda del interesado o de su apoderado o representante, en la que expresará sus pretensiones y sus fundamentos de hecho y de derecho." },
      { number: "90", title: "Requisitos de la demanda", content: "La demanda con que se promueva todo proceso deberá contener: 1. La designación del juez a quien se dirija. 2. El nombre y domicilio de las partes y, si no pueden comparecer por sí mismas, los de sus representantes legales..." },
      { number: "96", title: "Contestacion de la demanda", content: "La contestación de la demanda contendrá: 1. El nombre del demandado, su domicilio y los de su representante y apoderado. 2. Un pronunciamiento expreso y concreto sobre las pretensiones y sobre los hechos de la demanda..." },
      { number: "165", title: "Medios de prueba", content: "Son medios de prueba la declaración de parte, la confesión, el juramento, el testimonio de terceros, el dictamen pericial, la inspección judicial, los documentos, los indicios, los informes y cualesquiera otros medios que sean útiles para la formación del convencimiento del juez." },
      { number: "167", title: "Carga de la prueba", content: "Incumbe a las partes probar el supuesto de hecho de las normas que consagran el efecto jurídico que ellas persiguen." },
      { number: "372", title: "Proceso verbal", content: "Se sujetará al trámite establecido en este Capítulo todo asunto contencioso que no esté sometido a un trámite especial." },
      { number: "390", title: "Proceso verbal sumario", content: "Se tramitarán por el procedimiento verbal sumario los asuntos contenciosos de mínima cuantía, y los siguientes asuntos en consideración a su naturaleza..." },
    ]
  },
  // CPACA
  {
    code: "CPACA",
    name: "Codigo de Procedimiento Administrativo y de lo Contencioso Administrativo",
    description: "Ley 1437 de 2011 - Regula procedimientos administrativos",
    category: "Derecho Administrativo",
    tags: ["Derecho Administrativo", "Procedimiento Administrativo"],
    year: 2011,
    articles: [
      { number: "1", title: "Finalidad", content: "Las normas de esta Parte Primera tienen como finalidad proteger y garantizar los derechos y libertades de las personas, la primacía de los intereses generales, la sujeción de las autoridades a la Constitución y demás preceptos del ordenamiento jurídico, el cumplimiento de los fines estatales, el funcionamiento eficiente y democrático de la administración, y la observancia de los deberes del Estado y de los particulares." },
      { number: "3", title: "Principios", content: "Todas las autoridades deberán interpretar y aplicar las disposiciones que regulan las actuaciones y procedimientos administrativos a la luz de los principios consagrados en la Constitución Política, en la Parte Primera de este Código y en las leyes especiales." },
      { number: "13", title: "Derecho de peticion ante autoridades", content: "Toda persona tiene derecho a presentar peticiones respetuosas a las autoridades, en los términos señalados en este Código, por motivos de interés general o particular, y a obtener pronta resolución completa y de fondo sobre la misma." },
      { number: "14", title: "Terminos para resolver peticiones", content: "Salvo norma legal especial y so pena de sanción disciplinaria, toda petición deberá resolverse dentro de los quince (15) días siguientes a su recepción." },
      { number: "74", title: "Recursos contra actos administrativos", content: "Por regla general, contra los actos definitivos procederán los siguientes recursos: 1. El de reposición, ante quien expidió la decisión para que la aclare, modifique, adicione o revoque. 2. El de apelación, para ante el inmediato superior administrativo o funcional con el mismo propósito." },
      { number: "137", title: "Nulidad", content: "Toda persona podrá solicitar por sí, o por medio de representante, que se declare la nulidad de los actos administrativos de carácter general." },
      { number: "138", title: "Nulidad y restablecimiento del derecho", content: "Toda persona que se crea lesionada en un derecho subjetivo amparado en una norma jurídica, podrá pedir que se declare la nulidad del acto administrativo particular, expreso o presunto, y se le restablezca el derecho..." },
      { number: "140", title: "Reparacion directa", content: "En los términos del artículo 90 de la Constitución Política, la persona interesada podrá demandar directamente la reparación del daño antijurídico producido por la acción u omisión de los agentes del Estado." },
      { number: "161", title: "Requisitos previos para demandar", content: "La presentación de la demanda se someterá al cumplimiento de requisitos previos en los siguientes casos: 1. Cuando se trate de asuntos en los que haya lugar a la conciliación, la petición de conciliación prejudicial..." },
    ]
  },
  // LEY DE PROCEDIMIENTO LABORAL
  {
    code: "CPL",
    name: "Codigo Procesal del Trabajo",
    description: "Decreto 2158 de 1948 - Procedimientos laborales",
    category: "Derecho Laboral",
    tags: ["Derecho Laboral", "Procedimiento Laboral"],
    year: 1948,
    articles: [
      { number: "1", title: "Aplicacion", content: "Los conflictos jurídicos que se originen directa o indirectamente en el contrato de trabajo serán de la competencia de los jueces del trabajo, con arreglo a la presente Ley." },
      { number: "2", title: "Jurisdiccion laboral", content: "La administración de justicia en asuntos laborales será gratuita." },
      { number: "25", title: "Demanda", content: "La demanda deberá contener: 1. La designación del juez a quien se dirige. 2. El nombre de las partes y su domicilio. 3. El nombre y domicilio del apoderado judicial del demandante, si fuere el caso. 4. Lo que se pretenda, expresado con precisión y claridad. 5. Los hechos y omisiones que sirvan de fundamento a las pretensiones..." },
      { number: "66", title: "Principio de oralidad", content: "Las actuaciones y diligencias judiciales, la práctica de pruebas y la sustanciación se efectuarán oralmente en audiencia pública, so pena de nulidad, salvo los casos exceptuados en este Código." },
      { number: "145", title: "Analogia con CGP", content: "A falta de disposiciones especiales en el procedimiento del trabajo, se aplicarán las normas análogas del Código General del Proceso." },
    ]
  },
  // LEY DE FAMILIA
  {
    code: "LEY1098",
    name: "Codigo de la Infancia y la Adolescencia",
    description: "Ley 1098 de 2006 - Proteccion integral de ninos y adolescentes",
    category: "Familia",
    tags: ["Familia", "Menores", "Derechos"],
    year: 2006,
    articles: [
      { number: "1", title: "Finalidad", content: "Este Código tiene por finalidad garantizar a los niños, a las niñas y a los adolescentes su pleno y armonioso desarrollo para que crezcan en el seno de la familia y de la comunidad, en un ambiente de felicidad, amor y comprensión." },
      { number: "2", title: "Objeto", content: "El presente Código tiene por objeto establecer normas sustantivas y procesales para la protección integral de los niños, las niñas y los adolescentes, garantizar el ejercicio de sus derechos y libertades consagrados en los instrumentos internacionales de Derechos Humanos, en la Constitución Política y en las leyes, así como su restablecimiento." },
      { number: "7", title: "Proteccion integral", content: "Se entiende por protección integral de los niños, niñas y adolescentes el reconocimiento como sujetos de derechos, la garantía y cumplimiento de los mismos, la prevención de su amenaza o vulneración y la seguridad de su restablecimiento inmediato en desarrollo del principio del interés superior." },
      { number: "8", title: "Interes superior", content: "Se entiende por interés superior del niño, niña y adolescente, el imperativo que obliga a todas las personas a garantizar la satisfacción integral y simultánea de todos sus Derechos Humanos, que son universales, prevalentes e interdependientes." },
      { number: "17", title: "Derecho a la vida", content: "Los niños, las niñas y los adolescentes tienen derecho a la vida, a una buena calidad de vida y a un ambiente sano en condiciones de dignidad y goce de todos sus derechos en forma prevalente." },
      { number: "22", title: "Derecho a tener una familia", content: "Los niños, las niñas y los adolescentes tienen derecho a tener y crecer en el seno de la familia, a ser acogidos y no ser expulsados de ella." },
      { number: "82", title: "Funciones del defensor de familia", content: "Corresponde al Defensor de Familia: 1. Adelantar de oficio, las actuaciones necesarias para prevenir, proteger, garantizar y restablecer los derechos de los niños, las niñas, los adolescentes y las adolescentes cuando tenga información sobre su vulneración o amenaza..." },
    ]
  },
]

export async function POST() {
  try {
    await dbConnect()
    const db = mongoose.connection.db

    if (!db) {
      throw new Error("No se pudo obtener la base de datos activa")
    }
    
    // Limpiar colección existente
    await db.collection("legalcodes").deleteMany({})
    
    // Insertar todos los códigos
    const result = await db.collection("legalcodes").insertMany(
      legalCodes.map(code => ({
        ...code,
        createdAt: new Date(),
        updatedAt: new Date()
      }))
    )
    
    return NextResponse.json({
      success: true,
      message: `${result.insertedCount} códigos legales insertados correctamente`,
      count: result.insertedCount
    })
  } catch (error) {
    console.error("Error seeding legal codes:", error)
    return NextResponse.json(
      { error: "Error al insertar códigos legales" },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: "Use POST para insertar los códigos legales en la base de datos" 
  })
}
