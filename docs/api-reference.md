# API Reference

Las rutas API viven en `app/api/` y se conectan a modelos de MongoDB, IA, notificaciones, checkout y herramientas juridicas.

## Autenticacion y cuenta

- `GET/POST /api/auth/[...nextauth]`: sesiones y credenciales.
- `POST /api/auth/register`: registro de usuario.
- `POST /api/auth/forgot-password`: solicita recuperacion.
- `POST /api/auth/reset-password`: aplica el cambio de contrasena.
- `POST /api/auth/setup-admin`: bootstrap administrativo.
- `GET /api/users/me`: perfil del usuario actual.
- `PUT /api/users/me`: actualiza perfil, firma, especialidades y seguridad.

## CRM y operacion diaria

- `GET/POST /api/clients`: listar y crear clientes.
- `GET/PUT/DELETE /api/clients/[id]`: consultar, editar y borrar cliente.
- `GET/POST /api/cases`: listar y crear casos.
- `GET/PUT/DELETE /api/cases/[id]`: detalle y mantenimiento de caso.
- `GET/POST /api/appointments`: listar y crear citas.
- `GET/PUT/DELETE /api/appointments/[id]`: actualizar y eliminar citas.
- `GET/POST /api/documents`: listar y crear documentos.
- `POST /api/documents/upload`: carga de archivos.
- `PUT /api/documents/[id]`: edicion de documento.
- `POST /api/documents/[id]/approval`: aprobacion o firma.
- `GET/POST /api/invoices`: facturas.
- `GET/PUT/DELETE /api/invoices/[id]`: detalle y estado de factura.
- `GET/POST /api/communications`: bitacora de comunicaciones.

## Notificaciones

- `GET /api/notifications`: lista notificaciones.
- `POST /api/notifications`: crea notificaciones.
- `PUT /api/notifications`: actualiza estado de lectura.
- `GET /api/notifications/stream`: SSE en tiempo real.
- `POST /api/notifications/sync`: sincroniza alertas automaticas.

## Legal intelligence

- `GET /api/legal-codes`: catalogo de codigos.
- `POST /api/legal-codes/seed`: carga un subconjunto.
- `POST /api/legal-codes/seed-all`: carga completa del catalogo disponible.
- `GET /api/legal-codes/[codigo]`: detalle de un codigo.
- `GET /api/legal-codes/[codigo]/jurisprudencia`: jurisprudencia relacionada.
- `GET /api/leyes`: catalogo de leyes.
- `GET /api/leyes/[id]`: detalle de ley.
- `GET /api/normas`: catalogo de normas.
- `GET /api/fuentes`: fuentes oficiales.
- `GET /api/busqueda`: busqueda legal transversal.
- `POST /api/consulta-ia`: consulta asistida por IA.
- `POST /api/ia`: endpoint de IA general.
- `GET /api/legal-updates`: novedades normativas y jurisprudenciales.

## Herramientas

- `GET/POST /api/processes`: consulta interna de procesos y historial.
- `GET/POST /api/verificaciones`: verificacion de documentos y referencias.
- `POST /api/intake/analyze`: analisis de intake con IA.
- `GET /api/dashboard`: resumen ejecutivo.
- `GET /api/cron`: ejecucion o gatillo de tareas automaticas.
- `GET /api/health`: healthcheck.
- `GET/POST /api/chat`: chat legal.
- `GET/POST /api/chats`: historial o gestion de chats.
- `GET/POST /api/cargar`: carga auxiliar de contenido.

## Administracion

- `GET/POST /api/admin/users`: gestion de usuarios.
- `GET/PUT/DELETE /api/admin/users/[id]`: mantenimiento administrativo.

## Checkout y suscripcion

La experiencia de pago se resuelve con acciones de servidor en `app/actions/stripe.ts`:

- `createCheckoutSession(planId)`: crea la sesion de Stripe.
- `getCheckoutSession(sessionId)`: consulta el resultado de la sesion.

## Patrones comunes

- Las rutas validan session antes de operar.
- La mayoria de operaciones escriben en MongoDB.
- Las rutas de notificacion emiten eventos SSE despues de persistir.
- Las rutas de IA usan OpenAI si esta disponible y caen a respaldos locales si falla.
- Los endpoints de legalidad priorizan fuentes oficiales y contenido local curado.

## Errores tipicos

- `401`: sesion ausente o invalida.
- `403`: limite de plan o permiso insuficiente.
- `400`: datos requeridos faltantes.
- `500`: error interno, normalmente de DB, IA o proveedor externo.
