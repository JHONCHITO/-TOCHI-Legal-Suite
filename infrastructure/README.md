# Infrastructure

Base operativa para desplegar TOCHI Legal Suite.

## Contenido

- `docker/`: imagen y compose para levantar la app como contenedor.
- `k8s/`: manifiestos base para namespace, config, deployment, service e ingress.
- `terraform/`: infraestructura declarativa para aplicar la app en Kubernetes desde Terraform.

## Uso rapido

1. Construye la imagen con `infrastructure/docker/Dockerfile`.
2. Aplica los manifiestos de `infrastructure/k8s/` en tu cluster.
3. Si prefieres manejar Kubernetes desde Terraform, usa `infrastructure/terraform/`.

## Notas

- Los directorios `hooks/hooks`, `components/components` y `lib/lib` en la raiz son espejos heredados de estructura; se conservan para compatibilidad, pero la logica real vive en `hooks/`, `components/` y `lib/`.
