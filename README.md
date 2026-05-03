# TOCHI Legal Suite

Monorepo de la plataforma legal asistida por IA.

- `apps/web`: Next.js para clientes, abogados y administración
- `apps/api-gateway`: punto de entrada futuro para auth, rate limit y orquestación
- `apps/services/*`: servicios especializados por dominio
- `packages/db`: modelos, acceso a MongoDB y utilidades de dominio
- `packages/shared`: tipos y helpers compartidos
- `packages/config`: configuración centralizada
- `scripts`: carga, limpieza, scraping y embeddings offline

## Desarrollo

```bash
npm install
npm run dev
```

## Despliegue

- Vercel: usar `apps/web` como workspace de frontend
- Render: usar `apps/api-gateway` o un servicio dedicado cuando el backend HTTP esté listo
