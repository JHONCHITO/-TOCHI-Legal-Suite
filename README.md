# TOCHI Legal Suite

Plataforma legal colombiana con IA, biblioteca juridica, expediente 360, portal de clientes, notificaciones en tiempo real y facturacion con persistencia real en MongoDB.

## Documentacion

- [Manual ejecutivo](docs/executive-manual.md)
- [Documento principal](docs/README.md)
- [Arquitectura](docs/architecture.md)
- [Modulos funcionales](docs/modules.md)
- [Referencia de APIs](docs/api-reference.md)
- [Modelos de datos](docs/data-models.md)
- [Despliegue y operaciones](docs/deployment-ops.md)
- [TOCHI en Google Cloud](docs/google-cloud-architecture.md)

## Desarrollo rapido

```bash
npm install
npm run dev
```

## Validacion recomendada

```bash
npx tsc -p tsconfig.json --noEmit
npm run lint
npm run build
```

## Variables de entorno clave

- `MONGODB_URI`
- `AUTH_SECRET` o `NEXTAUTH_SECRET`
- `AUTH_URL` o `NEXTAUTH_URL`
- `AUTH_COOKIE_DOMAIN` si compartes login entre subdominios
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_API_URL` si el frontend consume un backend separado
- `OPENAI_API_KEY`
- `RESEND_API_KEY`
- `MAIL_FROM`
- `WOMPI_PUBLIC_KEY`
- `WOMPI_INTEGRITY_SECRET`
- `WOMPI_EVENT_SECRET`
- `STRIPE_SECRET_KEY`
- `DISABLE_PLAN_LIMITS`

## Estado actual

- La app principal vive en la raiz del repo, en `app/`, `components/` y `lib/`.
- Los flujos principales ya guardan datos reales: clientes, casos, citas, documentos, facturas, comunicaciones y notificaciones.
- La IA usa OpenAI cuando esta disponible y cae a respaldos locales cuando no lo esta.
- La demo visible fue removida del acceso principal para evitar confusion.
