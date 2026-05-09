# Functional Modules

Esta guia recorre las pantallas y capacidades que forman el producto visible para el usuario.

## 1. Autenticacion y cuenta

- `/login`: acceso con credenciales.
- `/register`: registro de nuevos usuarios.
- `/forgot-password`: solicitud de recuperacion.
- `/reset-password`: restablecimiento real con token.
- `/setup-admin`: bootstrap del superadmin.

Responsabilidades:

- autenticacion con NextAuth,
- roles en session,
- recuperacion de contrasena con token hash,
- apoyo a usuario administrador inicial.

## 2. Dashboard operativo

- `/dashboard`: resumen ejecutivo.
- `/dashboard/casos`: listado y filtros de expedientes.
- `/dashboard/casos/nuevo`: creacion de caso.
- `/dashboard/casos/[id]`: detalle 360 del expediente.
- `/dashboard/casos/[id]/editar`: edicion.
- `/dashboard/clientes`: CRM de clientes.
- `/dashboard/clientes/nuevo`: alta de cliente.
- `/dashboard/clientes/[id]`: ficha de cliente.
- `/dashboard/clientes/[id]/editar`: edicion de cliente.
- `/dashboard/citas`: agenda inteligente.
- `/dashboard/documentos`: gestion documental.
- `/dashboard/facturacion`: facturas, estados y cobros.
- `/dashboard/comunicacion`: seguimiento y bitacora de contacto.
- `/dashboard/notificaciones`: alertas y seguimiento en tiempo real.
- `/dashboard/configuracion`: perfil, firma, especialidades y preferencias.
- `/dashboard/seguridad`: controles de seguridad por rol y persistencia.
- `/dashboard/reportes`: indicadores y analitica.

## 3. Legal workspace

- `/dashboard/leyes`: biblioteca legal y acceso por codigo.
- `/dashboard/leyes/[codigo]`: visor de articulos, secciones, fuentes y jurisprudencia.
- `/dashboard/herramientas/biblioteca`: catalogo legal y carga de codigos.
- `/dashboard/herramientas/consulta-procesos`: consulta de procesos con historial.
- `/dashboard/herramientas/verificador`: verificador de documentos y referencias.
- `/dashboard/herramientas/generador`: generacion de documentos.
- `/dashboard/herramientas/liquidador`: liquidacion y calculos.
- `/dashboard/herramientas/calculadora`: calculadora juridica.
- `/dashboard/herramientas/cronometro`: control de tiempos.
- `/dashboard/herramientas/calendario-judicial`: apoyo a terminos.

Objetivo:

- convertir el texto legal en una herramienta util para litigio,
- cruzar articulos, fuentes oficiales y jurisprudencia,
- apoyar redaccion y consulta de abogados.

## 4. IA y busqueda

- `/ia`: asistente legal conversacional.
- `/chat`: chat legal general.
- `/buscar`: busqueda transversal.
- `/dashboard/asistente`: consulta legal y novedades por area.

Funciones:

- consulta de articulos y conceptos,
- respuesta con fallback local si no hay OpenAI,
- apoyo a redaccion de documentos,
- busqueda semantica y por palabras clave,
- preguntas sobre procesos y normas.

## 5. Portal del cliente

- `/dashboard/portal`: portal seguro para clientes.

Capacidades:

- ver documentos compartidos,
- ver citas y seguimiento,
- revisar facturas,
- cargar archivos,
- aprobar o revisar documentos.

## 6. Checkout y planes

- `/precios`: planes de suscripcion.
- `/checkout/[planId]`: proceso de pago.
- `/checkout/success`: confirmacion.

Planes:

- Esencial,
- Profesional,
- Firma.

## 7. Administracion

- `/dashboard/admin/usuarios`: gestion de usuarios.
- `/dashboard/seguridad`: politicas de acceso y proteccion.
- `app/api/admin/users` y `app/api/admin/users/[id]`: control administrativo.

## 8. Actualizaciones y monitoreo legal

- `/dashboard/actualizaciones`: novedades legales.
- `app/api/legal-updates`: resumen de cambios normativos y jurisprudenciales.
- `app/api/cron/legal-refresh`: sincronizacion automatica diaria del catalogo legal y embeddings.

## Flujo recomendado de uso

1. Entra con tu usuario.
2. Carga o revisa clientes y casos.
3. Programa citas y comunicaciones.
4. Genera o sube documentos.
5. Consulta leyes, articulos y jurisprudencia.
6. Activa notificaciones y portal para el cliente.
7. Usa facturacion y suscripciones segun el plan.

## Nota importante

El modo demo visible fue retirado del acceso principal. El flujo actual espera datos reales y guardado en MongoDB.
