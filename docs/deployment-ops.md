# Deployment and Operations

Esta guia explica como levantar TOCHI, que variables necesita y como mantener el catalogo legal, la IA y las notificaciones operando sin romper el flujo principal.

## Requisitos

- Node.js compatible con Next.js 16
- MongoDB
- Cuenta de OpenAI si quieres IA en linea
- Cuenta de Resend para correo transaccional
- Cuenta de Wompi para checkout con Nequi y tarjeta
- Cuenta de Stripe solo si quieres mantener el flujo legacy
- Un navegador moderno para SSE y notificaciones

## Variables de entorno

| Variable | Uso |
| --- | --- |
| `MONGODB_URI` | Conexion principal a MongoDB |
| `AUTH_SECRET` / `NEXTAUTH_SECRET` | Firma de NextAuth |
| `AUTH_URL` / `NEXTAUTH_URL` | URL base de autenticacion |
| `AUTH_COOKIE_DOMAIN` | Dominio compartido de cookies, por ejemplo `.tudominio.com` |
| `NEXT_PUBLIC_APP_URL` | URL publica para links de reset y retornos |
| `OPENAI_API_KEY` | IA, embeddings y borradores |
| `RESEND_API_KEY` | Correos de recuperacion y notificaciones por email |
| `MAIL_FROM` | Remitente para email transaccional |
| `CRON_SECRET` | Protege los endpoints de automatizacion programada |
| `WHATSAPP_CLOUD_API_TOKEN` | Token de Meta para enviar mensajes por Cloud API |
| `WHATSAPP_ACCESS_TOKEN` | Alias opcional del token de Meta |
| `WHATSAPP_PHONE_NUMBER_ID` | ID del numero de WhatsApp Business |
| `WHATSAPP_GRAPH_VERSION` | Version de Graph API usada para WhatsApp |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | Token de verificacion del webhook de Meta |
| `WHATSAPP_DEFAULT_COUNTRY_CODE` | Prefijo por defecto para normalizar telefonos |
| `WOMPI_PUBLIC_KEY` | Checkout de Wompi para tarjeta y Nequi |
| `WOMPI_INTEGRITY_SECRET` | Firma de integridad del checkout |
| `WOMPI_EVENT_SECRET` | Validacion de eventos webhook |
| `STRIPE_SECRET_KEY` | Checkout legacy de Stripe |
| `DISABLE_PLAN_LIMITS` | Desactiva limites en desarrollo |
| `DEFAULT_ADMIN_EMAIL` | Bootstrap del superadmin |
| `DEFAULT_ADMIN_PASSWORD` | Bootstrap del superadmin |
| `DEFAULT_ADMIN_NOMBRE` | Nombre inicial del superadmin |
| `DEFAULT_ADMIN_APELLIDO` | Apellido inicial del superadmin |

## Arranque local

```bash
npm install
npm run dev
```

Si quieres validar antes de usarlo:

```bash
npx tsc -p tsconfig.json --noEmit
npm run lint
npm run build
```

## Checklist de configuracion local

1. Copia `.env.example` a `.env` o `.env.local`.
2. Completa `MONGODB_URI`.
3. Configura `AUTH_SECRET` y `NEXTAUTH_URL`.
4. Si vas a separar frontend y backend por subdominios, agrega `AUTH_COOKIE_DOMAIN` con el dominio raiz compartido.
5. Agrega `OPENAI_API_KEY` si vas a usar IA en linea.
6. Agrega `RESEND_API_KEY` si vas a enviar correos reales.
7. Agrega `WOMPI_PUBLIC_KEY`, `WOMPI_INTEGRITY_SECRET` y `WOMPI_EVENT_SECRET` si vas a probar checkout con Nequi o tarjeta.
8. Agrega `STRIPE_SECRET_KEY` solo si vas a probar el checkout legacy de Stripe.
9. Deja `DISABLE_PLAN_LIMITS=true` solo para desarrollo.

## Carga del catalogo legal

Los codigos legales y normas se pueden alimentar con scripts del proyecto:

- `scripts/seed-legal-codes.js`
- `scripts/procesar_codigos.ts`
- `scripts/cargar-leyes.js`
- `scripts/cargarNormas.ts`
- `scripts/cargar_faltantes.js`
- `scripts/dividir_articulos.js`
- `scripts/dividir_todo.js`
- `scripts/limpiar_normas.js`

Cuando uses estos scripts, trata el resultado como datos reales de trabajo y valida el contenido antes de exponerlo en la interfaz.

## Embeddings y busqueda vectorial

Para que la busqueda semantica funcione bien:

- carga primero la base legal,
- luego genera embeddings con `scripts/generar_embeddings.ts` o `scripts/generar_embeddings.js`,
- despues vuelve a consultar la biblioteca y el asistente IA.

La aplicacion usa esos embeddings para:

- busqueda semantica,
- matching de articulos,
- respaldo de respuestas legales,
- ranking de relevancia.

## Refresco automatico legal

TOCHI incluye un cron programado para mantener el catalogo legal y la vectorizacion alineados con el contenido fuente.

- Ruta: `app/api/cron/legal-refresh/route.ts`
- Cron de despliegue: `vercel.json`
- Frecuencia por defecto: diaria

El cron:

- sincroniza el catalogo legal,
- actualiza el repertorio de leyes heredadas,
- reindexa embeddings solo cuando el contenido cambia,
- deja listo el asistente IA y la busqueda semantica con la misma fuente de verdad.

Si desplegas fuera de Vercel, puedes llamar manualmente esa ruta con `CRON_SECRET` en el header o como query string.

## Scrapers y extraccion

Hay scripts para extraer o sincronizar contenido legal:

- `scripts/scraper.ts`
- `scripts/scraper_civil.ts`
- `scripts/scraper_comercio.ts`
- `scripts/scraper_constitucion.ts`
- `scripts/scraper_cpaca.ts`
- `scripts/scraper_laboral.ts`
- `scripts/scraper_penal.ts`
- `scripts/scraper_cgp.ts`
- `scripts/procesar_pdfs.js`
- `scripts/extraer_pdf_general.js`
- `scripts/extraer_cpaca.ts`

## Diagnostico y mantenimiento

- `scripts/diagnostico-fix.ps1`: limpieza y diagnostico general.
- `npx tsc -p tsconfig.json --noEmit`: validacion de tipos.
- `npm run lint`: control de calidad.
- `npm run build`: revisa que la app compile para produccion.

## Docker

La base de contenedores esta en:

- `infrastructure/docker/Dockerfile`
- `infrastructure/docker/docker-compose.yml`

Uso general:

1. Construir la imagen.
2. Levantar el contenedor.
3. Probar salud, login y persistencia.

## Kubernetes

Los manifiestos estan en `infrastructure/k8s/`:

- `namespace.yaml`
- `configmap.yaml`
- `secret.example.yaml`
- `deployment.yaml`
- `service.yaml`
- `ingress.yaml`

Nota:

- `secret.example.yaml` es una plantilla, no un secreto real.
- `app/api/health/route.ts` sirve como healthcheck para probes.

## Terraform

La base declarativa esta en `infrastructure/terraform/`:

- `main.tf`
- `variables.tf`
- `outputs.tf`
- `terraform.tfvars.example`

## Operacion diaria

### Notificaciones

- Se guardan en MongoDB.
- Se emiten por SSE.
- Pueden saltar como notificacion nativa del navegador si el usuario la autoriza.

### IA

- Si OpenAI responde, se usa como capa principal.
- Si OpenAI falla, se activan fallbacks locales.
- Esto evita que el asistente se rompa en produccion.

### Legal

- La biblioteca legal mezcla contenido local, fuentes oficiales y apoyo vectorial.
- El visor de articulos debe contrastarse con fuentes oficiales cuando se requiera exactitud juridica extrema.

### WhatsApp

- TOCHI primero intenta leer la integracion desde MongoDB en `WhatsAppIntegration` o en colecciones comunes de configuracion.
- Si no encuentra una configuracion guardada, usa como respaldo las variables `WHATSAPP_CLOUD_API_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` y `WHATSAPP_WEBHOOK_VERIFY_TOKEN`.
- Si no hay configuracion oficial, TOCHI abre WhatsApp Web con el mensaje listo para enviar como respaldo inmediato.
- Los estados de entrega y las respuestas automáticas llegan por webhook en `app/api/whatsapp/webhook/route.ts` cuando el token de verificacion coincide.
- Desde `app/dashboard/configuracion` puedes revisar la integracion y, si tu rol lo permite, actualizarla sin tocar archivos de entorno.

### Billing

- Los planes viven en `lib/products.ts`.
- El checkout se inicia desde acciones de servidor.
- Los limites de plan se aplican por suscripcion, pero pueden desactivarse en desarrollo con `DISABLE_PLAN_LIMITS=true`.

## Recomendacion de despliegue

- Usa un entorno con MongoDB estable.
- Configura correo y OpenAI antes de abrir la aplicacion a usuarios.
- Genera embeddings despues de cargar el catalogo.
- Valida login, reset de contrasena, citas, clientes, documentos y notificaciones antes de publicar.

## Despliegue separado en Google Cloud

Si quieres separar frontend y backend en dos servicios Cloud Run, usa esta regla:

- `backend`: despliega la app principal del repo raiz con `infrastructure/docker/Dockerfile`.
- `frontend`: despliega la app de `frontend/` con `frontend/Dockerfile`.
- `NEXT_PUBLIC_API_URL`: apunta desde el frontend al URL publico del backend.
- `NEXT_PUBLIC_APP_URL`: apunta a la URL publica del frontend.
- `AUTH_COOKIE_DOMAIN`: usa el dominio raiz compartido, por ejemplo `.tudominio.com`.

Flujo recomendado:

1. Sube el backend primero y copia la URL que te entregue Cloud Run, por ejemplo `https://tochi-backend-xxxxx.run.app`.
2. Configura el frontend con `NEXT_PUBLIC_API_URL` igual a esa URL.
3. Sube el frontend y copia su URL publica, por ejemplo `https://tochi-frontend-xxxxx.run.app`.
4. Si vas a usar dominio propio, mapea:
   - `app.tudominio.com` al frontend,
   - `api.tudominio.com` al backend.

Con la configuracion actual, cualquier frontend que tenga `NEXT_PUBLIC_API_URL` definido reescribe automaticamente `/api/*` hacia el backend, asi que no necesitas tocar los formularios ni los hooks del cliente.
