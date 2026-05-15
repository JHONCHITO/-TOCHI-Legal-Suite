# Infrastructure

Base operativa para desplegar TOCHI Legal Suite.

## Contenido

- `docker/`: imagen y compose para levantar la app como contenedor.
- `k8s/`: manifiestos base para namespace, config, deployment, service e ingress.
- `terraform/`: infraestructura declarativa para aplicar la app en Kubernetes desde Terraform.
- `ubuntu/`: pack para desplegar TOCHI en una VM Ubuntu con Nginx y systemd.

## Uso rapido

1. Construye la imagen con `infrastructure/docker/Dockerfile`.
2. Aplica los manifiestos de `infrastructure/k8s/` en tu cluster.
3. Si prefieres manejar Kubernetes desde Terraform, usa `infrastructure/terraform/`.
4. Si el profesor pide Ubuntu, usa `infrastructure/ubuntu/`.

## Notas

- La configuracion real del entorno debe salir de variables claras y unicas: `MONGODB_URI`, `AUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL` y `OPENAI_API_KEY`.
- `AUTH_SECRET` y `NEXTAUTH_URL` tambien se sincronizan con los alias historicos `NEXTAUTH_SECRET` y `AUTH_URL` para mantener compatibilidad.
- Para desarrollo local, `DISABLE_PLAN_LIMITS=true` evita que las cuotas bloqueen pruebas de clientes, citas y comunicaciones.
- Usa `.env.example` como base local y maneja secretos reales en tu gestor de secretos o en Kubernetes/Terraform, nunca dentro del repositorio.
- El pack Ubuntu vive en `infrastructure/ubuntu/` e incluye plantillas, systemd, Nginx y scripts de instalacion/actualizacion.
