// CODIGO CIVIL COLOMBIANO - Ley 84 de 1873
// Agrega los articulos en el array "articulos"

export const codigoCivil = {
  id: "codigo-civil",
  nombre: "Codigo Civil Colombiano",
  abreviatura: "CC",
  tipo: "codigo",
  fechaExpedicion: "1873-05-26",
  descripcion: "Regula relaciones civiles entre personas - 2684 articulos",
  
  articulos: [
    // TITULO PRELIMINAR - Articulos 1-72
    { numero: "1", libro: "Titulo Preliminar", titulo: "De la ley", contenido: "La ley es una declaracion de la voluntad soberana manifestada en la forma prevenida en la Constitucion Nacional. El caracter general de la ley es mandar, prohibir, permitir o castigar." },
    { numero: "2", libro: "Titulo Preliminar", titulo: "De la ley", contenido: "La costumbre en ningun caso tiene fuerza contra la ley. No podra alegarse el desuso para su inobservancia, ni practica, por inveterada y general que sea." },
    { numero: "3", libro: "Titulo Preliminar", titulo: "De la ley", contenido: "La ley es obligatoria y surte sus efectos desde el dia en que ella misma designe; y en todo caso despues de su promulgacion." },
    // ... AGREGA ARTICULOS 4-72 AQUI
    
    // LIBRO PRIMERO: DE LAS PERSONAS - Articulos 73-652
    // Titulo I - Principio y fin de las personas
    { numero: "73", libro: "Libro I", titulo: "De las personas", contenido: "Las personas son naturales o juridicas." },
    { numero: "74", libro: "Libro I", titulo: "De las personas", contenido: "Son personas todos los individuos de la especie humana, cualquiera que sea su edad, sexo, estirpe o condicion." },
    { numero: "90", libro: "Libro I", titulo: "Del principio de la existencia", contenido: "La existencia legal de toda persona principia al nacer, esto es, al separarse completamente de su madre. La criatura que muere en el vientre materno, o que perece antes de estar completamente separada de su madre, se reputara no haber existido jamas." },
    { numero: "91", libro: "Libro I", titulo: "Del principio de la existencia", contenido: "La ley protege la vida del que esta por nacer. El juez, en consecuencia, tomara, a peticion de cualquiera persona, o de oficio, las providencias que le parezcan convenientes para proteger la existencia del no nacido, siempre que crea que de algun modo peligra." },
    // ... AGREGA MAS ARTICULOS DE PERSONAS
    
    // Titulo III - Del matrimonio
    { numero: "113", libro: "Libro I", titulo: "Del matrimonio", contenido: "El matrimonio es un contrato solemne por el cual un hombre y una mujer se unen con el fin de vivir juntos, de procrear y de auxiliarse mutuamente." },
    { numero: "115", libro: "Libro I", titulo: "Del matrimonio", contenido: "El contrato de matrimonio se constituye y perfecciona por el libre y mutuo consentimiento de los contrayentes, expresado ante el funcionario competente, en la forma y con las solemnidades y requisitos establecidos en este codigo." },
    // ... AGREGA MAS ARTICULOS DE MATRIMONIO
    
    // Titulo IV - De la sociedad conyugal
    { numero: "180", libro: "Libro I", titulo: "De la sociedad conyugal", contenido: "Por el hecho del matrimonio se contrae sociedad de bienes entre los conyuges, segun las reglas del titulo 22, libro 4o. del Codigo Civil." },
    // ... AGREGA MAS ARTICULOS
    
    // LIBRO SEGUNDO: DE LOS BIENES - Articulos 653-952
    { numero: "653", libro: "Libro II", titulo: "De los bienes", contenido: "Los bienes consisten en cosas corporales o incorporales. Corporales son las que tienen un ser real y pueden ser percibidas por los sentidos, como una casa, un libro. Incorporales las que consisten en meros derechos, como los creditos y las servidumbres activas." },
    { numero: "654", libro: "Libro II", titulo: "De los bienes", contenido: "Las cosas corporales se dividen en muebles e inmuebles." },
    { numero: "655", libro: "Libro II", titulo: "De los bienes", contenido: "Muebles son las que pueden transportarse de un lugar a otro, sea moviendose ellas a si mismas como los animales (que por eso se llaman semovientes), sea que solo se muevan por una fuerza externa, como las cosas inanimadas." },
    { numero: "656", libro: "Libro II", titulo: "De los bienes", contenido: "Inmuebles o fincas o bienes raices son las cosas que no pueden transportarse de un lugar a otro; como las tierras y minas, y las que adhieren permanentemente a ellas, como los edificios, los arboles." },
    { numero: "669", libro: "Libro II", titulo: "Del dominio", contenido: "El dominio (que se llama tambien propiedad) es el derecho real en una cosa corporal, para gozar y disponer de ella, no siendo contra ley o contra derecho ajeno." },
    { numero: "670", libro: "Libro II", titulo: "Del dominio", contenido: "Sobre las cosas incorporales hay tambien una especie de propiedad. Asi, el usufructuario tiene la propiedad de su derecho de usufructo." },
    { numero: "673", libro: "Libro II", titulo: "Del dominio", contenido: "Los modos de adquirir el dominio son la ocupacion, la accesion, la tradicion, la sucesion por causa de muerte y la prescripcion." },
    { numero: "740", libro: "Libro II", titulo: "De la tradicion", contenido: "La tradicion es un modo de adquirir el dominio de las cosas, y consiste en la entrega que el dueno hace de ellas a otro, habiendo por una parte la facultad e intencion de transferir el dominio, y por otra la capacidad e intencion de adquirirlo." },
    { numero: "762", libro: "Libro II", titulo: "De la posesion", contenido: "La posesion es la tenencia de una cosa determinada con animo de senor o dueno, sea que el dueno o el que se da por tal, tenga la cosa por si mismo, o por otra persona que la tenga en lugar y a nombre de el." },
    { numero: "765", libro: "Libro II", titulo: "De la posesion", contenido: "El poseedor es reputado dueno, mientras otra persona no justifica serlo." },
    // ... AGREGA MAS ARTICULOS DE BIENES
    
    // LIBRO TERCERO: SUCESIONES - Articulos 1008-1442
    { numero: "1008", libro: "Libro III", titulo: "De la sucesion", contenido: "Se sucede a una persona difunta a titulo universal o a titulo singular. El titulo es universal cuando se sucede al difunto en todos sus bienes, derechos y obligaciones transmisibles o en una cuota de ellos, como la mitad, tercio o quinto." },
    { numero: "1009", libro: "Libro III", titulo: "De la sucesion", contenido: "El titulo es singular cuando se sucede en una o mas especies o cuerpos ciertos, como tal caballo, tal casa; o en una o mas especies indeterminadas de cierto genero, como un caballo, tres vacas." },
    { numero: "1037", libro: "Libro III", titulo: "De la sucesion intestada", contenido: "Las leyes reglan la sucesion en los bienes de que el difunto no ha dispuesto, o si dispuso, no lo hizo conforme a derecho, o no han tenido efecto sus disposiciones." },
    { numero: "1040", libro: "Libro III", titulo: "Ordenes hereditarios", contenido: "Son llamados a la sucesion intestada: los descendientes; los hijos adoptivos; los ascendientes; los padres adoptantes; los hermanos; los hijos de estos; el conyuge superstite; el Instituto Colombiano de Bienestar Familiar." },
    { numero: "1045", libro: "Libro III", titulo: "Primer orden", contenido: "Los hijos legitimos, adoptivos y extramatrimoniales, excluyen a todos los otros herederos y recibiran entre ellos iguales cuotas, sin perjuicio de la porcion conyugal." },
    { numero: "1055", libro: "Libro III", titulo: "Del testamento", contenido: "El testamento es un acto mas o menos solemne, en que una persona dispone del todo o de una parte de sus bienes para que tenga pleno efecto despues de sus dias, conservando la facultad de revocar las disposiciones contenidas en el, mientras viva." },
    { numero: "1226", libro: "Libro III", titulo: "Asignaciones forzosas", contenido: "Asignaciones forzosas son las que el testador es obligado a hacer, y que se suplen cuando no las ha hecho, aun con perjuicio de sus disposiciones testamentarias expresas. Asignaciones forzosas son: Los alimentos que se deben por ley a ciertas personas; La porcion conyugal; Las legitimas; La cuarta de mejoras en la sucesion de los descendientes." },
    // ... AGREGA MAS ARTICULOS DE SUCESIONES
    
    // LIBRO CUARTO: OBLIGACIONES Y CONTRATOS - Articulos 1494-2684
    { numero: "1494", libro: "Libro IV", titulo: "De las obligaciones", contenido: "Las obligaciones nacen, ya del concurso real de las voluntades de dos o mas personas, como en los contratos o convenciones; ya de un hecho voluntario de la persona que se obliga, como en la aceptacion de una herencia o legado y en todos los cuasicontratos; ya a consecuencia de un hecho que ha inferido injuria o dano a otra persona, como en los delitos; ya por disposicion de la ley, como entre los padres y los hijos de familia." },
    { numero: "1495", libro: "Libro IV", titulo: "De las obligaciones", contenido: "Contrato o convencion es un acto por el cual una parte se obliga para con otra a dar, hacer o no hacer alguna cosa. Cada parte puede ser de una o de muchas personas." },
    { numero: "1496", libro: "Libro IV", titulo: "Clasificacion de contratos", contenido: "El contrato es unilateral cuando una de las partes se obliga para con otra que no contrae obligacion alguna; y bilateral, cuando las partes contratantes se obligan reciprocamente." },
    { numero: "1497", libro: "Libro IV", titulo: "Clasificacion de contratos", contenido: "El contrato es gratuito o de beneficencia cuando solo tiene por objeto la utilidad de una de las partes, sufriendo la otra el gravamen; y oneroso, cuando tiene por objeto la utilidad de ambos contratantes, gravandose cada uno a beneficio del otro." },
    { numero: "1498", libro: "Libro IV", titulo: "Clasificacion de contratos", contenido: "El contrato oneroso es conmutativo, cuando cada una de las partes se obliga a dar o hacer una cosa que se mira como equivalente a lo que la otra parte debe dar o hacer a su vez." },
    { numero: "1499", libro: "Libro IV", titulo: "Clasificacion de contratos", contenido: "El contrato es principal cuando subsiste por si mismo sin necesidad de otra convencion; y accesorio, cuando tiene por objeto asegurar el cumplimiento de una obligacion principal, de manera que no pueda subsistir sin ella." },
    { numero: "1500", libro: "Libro IV", titulo: "Clasificacion de contratos", contenido: "El contrato es real cuando, para que sea perfecto, es necesaria la tradicion de la cosa a que se refiere; es solemne cuando esta sujeto a la observancia de ciertas formalidades especiales, de manera que sin ellas no produce ningun efecto civil; y es consensual cuando se perfecciona por el solo consentimiento." },
    { numero: "1502", libro: "Libro IV", titulo: "Requisitos de validez", contenido: "Para que una persona se obligue a otra por un acto o declaracion de voluntad, es necesario: 1. que sea legalmente capaz; 2. que consienta en dicho acto o declaracion y su consentimiento no adolezca de vicio; 3. que recaiga sobre un objeto licito; 4. que tenga una causa licita." },
    { numero: "1503", libro: "Libro IV", titulo: "Capacidad", contenido: "Toda persona es legalmente capaz, excepto aquellas que la ley declara incapaces." },
    { numero: "1504", libro: "Libro IV", titulo: "Incapacidad", contenido: "Son absolutamente incapaces los dementes, los impuberes y sordomudos, que no pueden darse a entender. Sus actos no producen ni aun obligaciones naturales, y no admiten caucion. Son tambien incapaces los menores adultos que no han obtenido habilitacion de edad y los disipadores que se hallen bajo interdiccion. Pero la incapacidad de estas personas no es absoluta y sus actos pueden tener valor en ciertas circunstancias y bajo ciertos respectos determinados por las leyes." },
    { numero: "1508", libro: "Libro IV", titulo: "Vicios del consentimiento", contenido: "Los vicios de que puede adolecer el consentimiento, son error, fuerza y dolo." },
    { numero: "1509", libro: "Libro IV", titulo: "Error", contenido: "El error sobre un punto de derecho no vicia el consentimiento." },
    { numero: "1510", libro: "Libro IV", titulo: "Error", contenido: "El error de hecho vicia el consentimiento cuando recae sobre la especie de acto o contrato que se ejecuta o celebra." },
    { numero: "1511", libro: "Libro IV", titulo: "Error", contenido: "El error de hecho vicia asimismo el consentimiento cuando la sustancia o calidad esencial del objeto sobre que versa el acto o contrato, es diversa de lo que se cree." },
    { numero: "1513", libro: "Libro IV", titulo: "Fuerza", contenido: "La fuerza no vicia el consentimiento sino cuando es capaz de producir una impresion fuerte en una persona de sano juicio, tomando en cuenta su edad, sexo y condicion." },
    { numero: "1515", libro: "Libro IV", titulo: "Dolo", contenido: "El dolo no vicia el consentimiento sino cuando es obra de una de las partes, y cuando ademas aparece claramente que sin el no hubiera contratado." },
    { numero: "1517", libro: "Libro IV", titulo: "Objeto licito", contenido: "No solo las cosas que existen pueden ser objeto de una declaracion de voluntad, sino las que se espera que existan; pero es menester que las unas y las otras sean comerciables, y que esten determinadas, a lo menos en cuanto a su genero." },
    { numero: "1518", libro: "Libro IV", titulo: "Objeto licito", contenido: "No puede ser objeto de un contrato las cosas que estan fuera del comercio o que no puedan reducirse a un valor exigible." },
    { numero: "1519", libro: "Libro IV", titulo: "Objeto ilicito", contenido: "Hay un objeto ilicito en todo lo que contraviene al derecho publico de la nacion." },
    { numero: "1524", libro: "Libro IV", titulo: "Causa", contenido: "No puede haber obligacion sin una causa real y licita; pero no es necesario expresarla. La pura liberalidad o beneficencia es causa suficiente. Se entiende por causa el motivo que induce al acto o contrato." },
    { numero: "1546", libro: "Libro IV", titulo: "Condicion resolutoria", contenido: "En los contratos bilaterales va envuelta la condicion resolutoria en caso de no cumplirse por uno de los contratantes lo pactado. Pero en tal caso podra el otro contratante pedir a su arbitrio, o la resolucion o el cumplimiento del contrato con indemnizacion de perjuicios." },
    { numero: "1602", libro: "Libro IV", titulo: "Efecto de los contratos", contenido: "Todo contrato legalmente celebrado es una ley para los contratantes, y no puede ser invalidado sino por su consentimiento mutuo o por causas legales." },
    { numero: "1603", libro: "Libro IV", titulo: "Ejecucion de buena fe", contenido: "Los contratos deben ejecutarse de buena fe, y por consiguiente obligan no solo a lo que en ellos se expresa, sino a todas las cosas que emanan precisamente de la naturaleza de la obligacion, o que por ley pertenecen a ella." },
    { numero: "1604", libro: "Libro IV", titulo: "Responsabilidad del deudor", contenido: "El deudor no es responsable sino de la culpa lata en los contratos que por su naturaleza solo son utiles al acreedor; es responsable de la leve en los contratos que se hacen para beneficio reciproco de las partes; y de la levisima en los contratos en que el deudor es el unico que reporta beneficio." },
    { numero: "1613", libro: "Libro IV", titulo: "Indemnizacion de perjuicios", contenido: "La indemnizacion de perjuicios comprende el dano emergente y lucro cesante, ya provengan de no haberse cumplido la obligacion, o de haberse cumplido imperfectamente, o de haberse retardado el cumplimiento." },
    { numero: "1614", libro: "Libro IV", titulo: "Dano emergente y lucro cesante", contenido: "Entiendese por dano emergente el perjuicio o la perdida que proviene de no haberse cumplido la obligacion o de haberse cumplido imperfectamente, o de haberse retardado su cumplimiento; y por lucro cesante, la ganancia o provecho que deja de reportarse a consecuencia de no haberse cumplido la obligacion, o cumplido imperfectamente, o retardado su cumplimiento." },
    { numero: "1625", libro: "Libro IV", titulo: "Modos de extinguir obligaciones", contenido: "Toda obligacion puede extinguirse por una convencion en que las partes interesadas, siendo capaces de disponer libremente de lo suyo, consientan en darla por nula. Las obligaciones se extinguen ademas en todo o parte: 1. Por la solucion o pago efectivo; 2. Por la novacion; 3. Por la transaccion; 4. Por la remision; 5. Por la compensacion; 6. Por la confusion; 7. Por la perdida de la cosa que se debe; 8. Por la declaracion de nulidad o por la rescision; 9. Por el evento de la condicion resolutoria; 10. Por la prescripcion." },
    { numero: "1626", libro: "Libro IV", titulo: "Pago", contenido: "El pago efectivo es la prestacion de lo que se debe." },
    { numero: "1634", libro: "Libro IV", titulo: "Pago", contenido: "El acreedor no podra ser obligado a recibir otra cosa que lo que se le deba, ni aun a pretexto de ser de igual o mayor valor la ofrecida." },
    { numero: "1849", libro: "Libro IV", titulo: "De la compraventa", contenido: "La compraventa es un contrato en que una de las partes se obliga a dar una cosa y la otra a pagarla en dinero. Aquella se dice vender y esta comprar. El dinero que el comprador da por la cosa vendida se llama precio." },
    { numero: "1857", libro: "Libro IV", titulo: "De la compraventa", contenido: "La venta se reputa perfecta desde que las partes han convenido en la cosa y en el precio, salvas las excepciones siguientes." },
    { numero: "1858", libro: "Libro IV", titulo: "De la compraventa", contenido: "No hay venta de bienes raices sino mediante escritura publica, la cual debera inscribirse en el registro correspondiente." },
    { numero: "1880", libro: "Libro IV", titulo: "Obligaciones del vendedor", contenido: "Las obligaciones del vendedor se reducen en general a dos: la entrega o tradicion, y el saneamiento de la cosa vendida." },
    { numero: "1893", libro: "Libro IV", titulo: "Saneamiento", contenido: "El vendedor es obligado a sanear al comprador todas las evicciones que tengan una causa anterior a la venta." },
    { numero: "1914", libro: "Libro IV", titulo: "Vicios redhibitorios", contenido: "Se llaman vicios redhibitorios los que reuniendo las calidades siguientes dan derecho al comprador para exigir la resolucion de la venta, o la rebaja del precio." },
    { numero: "1973", libro: "Libro IV", titulo: "Del arrendamiento", contenido: "El arrendamiento es un contrato en que las dos partes se obligan reciprocamente, la una a conceder el goce de una cosa, o a ejecutar una obra o prestar un servicio, y la otra a pagar por este goce, obra o servicio un precio determinado." },
    { numero: "2142", libro: "Libro IV", titulo: "Del mandato", contenido: "El mandato es un contrato en que una persona confia la gestion de uno o mas negocios a otra, que se hace cargo de ellos por cuenta y riesgo de la primera." },
    { numero: "2341", libro: "Libro IV", titulo: "Responsabilidad extracontractual", contenido: "El que ha cometido un delito o culpa, que ha inferido dano a otro, es obligado a la indemnizacion, sin perjuicio de la pena principal que la ley imponga por la culpa o el delito cometido." },
    { numero: "2342", libro: "Libro IV", titulo: "Responsabilidad extracontractual", contenido: "Puede pedir esta indemnizacion no solo el que es dueno o poseedor de la cosa sobre la cual ha recaido el dano o su heredero, sino el usufructuario, el habitador, o el usuario, si el dano irroga perjuicio a su derecho de usufructo, habitacion o uso." },
    { numero: "2343", libro: "Libro IV", titulo: "Responsabilidad extracontractual", contenido: "Es obligado a la indemnizacion el que hizo el dano y sus herederos." },
    { numero: "2347", libro: "Libro IV", titulo: "Responsabilidad por hecho ajeno", contenido: "Toda persona es responsable, no solo de sus propias acciones para el efecto de indemnizar el dano, sino del hecho de aquellos que estuvieren a su cuidado." },
    { numero: "2356", libro: "Libro IV", titulo: "Responsabilidad por actividades peligrosas", contenido: "Por regla general todo dano que pueda imputarse a malicia o negligencia de otra persona, debe ser reparado por esta." },
    { numero: "2512", libro: "Libro IV", titulo: "De la prescripcion", contenido: "La prescripcion es un modo de adquirir las cosas ajenas, o de extinguir las acciones o derechos ajenos, por haberse poseido las cosas y no haberse ejercido dichas acciones y derechos durante cierto lapso de tiempo, y concurriendo los demas requisitos legales." },
    { numero: "2513", libro: "Libro IV", titulo: "De la prescripcion", contenido: "El que quiera aprovecharse de la prescripcion debe alegarla; el juez no puede declararla de oficio." },
    { numero: "2518", libro: "Libro IV", titulo: "De la prescripcion", contenido: "La prescripcion ordinaria puede suspenderse sin extinguirse; en ese caso, cesando la causa de la suspension, se le cuenta al poseedor el tiempo anterior a ella, si alguno hubo." },
    { numero: "2531", libro: "Libro IV", titulo: "Prescripcion adquisitiva", contenido: "El dominio de cosas comerciales que no ha sido adquirido por la prescripcion ordinaria, puede serlo por la extraordinaria, bajo las reglas que van a expresarse." },
    { numero: "2532", libro: "Libro IV", titulo: "Prescripcion adquisitiva", contenido: "El lapso de tiempo necesario para adquirir por esta especie de prescripcion, es de diez anos contra toda persona y no se suspende a favor de las enumeradas en el articulo 2530." },
    { numero: "2535", libro: "Libro IV", titulo: "Prescripcion extintiva", contenido: "La prescripcion que extingue las acciones y derechos ajenos, exige solamente cierto lapso de tiempo durante el cual no se hayan ejercido dichas acciones." },
    { numero: "2536", libro: "Libro IV", titulo: "Prescripcion extintiva", contenido: "La accion ejecutiva se prescribe por cinco anos. Y la ordinaria por diez. La accion ejecutiva se convierte en ordinaria por el lapso de cinco anos, y convertida en ordinaria durara solamente otros cinco." },
    // AGREGA MAS ARTICULOS AQUI...
  ]
};
