# Data Models

Los modelos viven en `lib/models/` y representan el estado persistente de TOCHI en MongoDB.

## Resumen general

| Modelo | Proposito | Relaciones / notas |
| --- | --- | --- |
| `User` | Identidad, roles, perfil, seguridad, acceso | Usa `rol`, `securityPreferences`, tokens de recuperacion, firma y datos del abogado |
| `Client` | CRM de clientes persona natural o juridica | Se conecta con casos, citas, documentos, facturas y comunicaciones |
| `Case` | Expediente legal completo | Vincula cliente, tipo de asunto, estado, estrategia, plazos y notas |
| `Appointment` | Agenda, audiencias, reuniones y seguimientos | Relaciona cliente y caso, soporta virtualidad y recurrencia |
| `Document` | Documentos, plantillas y aprobaciones | Puede venir de formularios, uploads o generacion IA |
| `Invoice` | Facturacion, items, pagos y saldos | Relaciona cliente y caso, maneja estados y pagos parciales |
| `Communication` | Historial de contacto y seguimiento | Canal, mensaje, estado y referencias a cliente/caso |
| `Notification` | Alertas persistidas y real time | Tiene lectura, prioridad y referencias a caso/cita/documento |
| `LegalCode`, `Ley`, `Norma`, `Articulo` | Catalogo legal y corpus juridico | Base para busqueda, visor y vector search |
| `ProcessSearch` | Historial de consultas de procesos | Guarda quien busco, que busco y que devolvio |
| `Verification` | Historial de verificacion de documentos y referencias | Registra resultado, tipo y detalle |
| `Subscription` | Plan, trial y limites de uso | Se conecta con Stripe y con aplicacion de cuotas |

## User

Campos clave:

- nombre y apellido,
- email,
- password,
- rol,
- avatar,
- tarjeta profesional,
- telefono,
- firma,
- especialidades,
- securityPreferences,
- tokens de recuperacion,
- estado activo.

## Client

Campos clave:

- tipo de cliente,
- cedula o NIT,
- nombre o razon social,
- correos y telefonos,
- direccion y ciudad,
- notas internas,
- tags,
- asignacion de usuario o despacho.

## Case

Campos tipicos:

- numero interno,
- numero de proceso o radicado,
- cliente,
- tipo y estado,
- juzgado y ciudad,
- contraparte,
- abogado responsable,
- descripcion,
- pretensiones,
- estrategia,
- fechas y alertas,
- normas clave,
- hitos.

## Appointment

Campos clave:

- titulo,
- tipo,
- estado,
- fechaInicio y fechaFin,
- ubicacion o link virtual,
- cliente,
- caso,
- descripcion y notas,
- recordatorioFecha,
- recurrencia.

## Document

Campos clave:

- nombre,
- tipo,
- estado,
- plantillaId,
- caso y cliente,
- contenido o archivo,
- aprobacion del cliente,
- versionado basico,
- origen portal o interno.

## Invoice

Campos clave:

- numero,
- cliente,
- caso,
- concepto,
- items,
- subtotal,
- impuestos,
- descuento,
- total,
- pagos,
- montoPagado,
- saldoPendiente,
- estado,
- fechas.

## Communication

Campos clave:

- canal,
- cliente,
- caso opcional,
- mensaje,
- estado,
- fecha,
- seguimiento.

## Notification

Campos clave:

- userId,
- tipo,
- prioridad,
- titulo,
- mensaje,
- enlace,
- leida,
- fechaLeida,
- casoId,
- citaId,
- documentoId,
- flags de envio.

## Legal data

El catalogo juridico se alimenta de:

- archivos TypeScript en `lib/data/codigos/`,
- JSONs y PDFs en `lib/data/`,
- modelos para normas, articulos y leyes,
- busqueda vectorial y ranking de relevancia.

## ProcessSearch y Verification

Estos modelos hacen que las herramientas no sean solo decorativas:

- guardan historial,
- permiten auditoria,
- muestran consultas recientes,
- evitan perder trazabilidad del trabajo del abogado.

## Subscription

Se usa para:

- trial,
- limites por plan,
- aplicacion de uso,
- control de features por plan,
- integracion con Stripe.

## Regla importante

La aplicacion ya no debe depender de datos demo para estas entidades. Los flujos de creacion y edicion estan pensados para persistir en MongoDB.
