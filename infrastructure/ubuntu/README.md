# TOCHI Ubuntu VM Pack

Este directorio contiene la version lista para levantar TOCHI en una VM Ubuntu de Google Compute Engine.

## Archivos

- `setup-ubuntu.sh`: instala dependencias, clona el repo, copia plantillas y levanta Nginx/systemd.
- `update-ubuntu.sh`: actualiza el codigo y reinicia frontend/backend.
- `env/backend.env.example`: plantilla de entorno para el backend.
- `env/frontend.env.example`: plantilla de entorno para el frontend.
- `systemd/tochi-backend.service`: unidad systemd del backend.
- `systemd/tochi-frontend.service`: unidad systemd del frontend.
- `nginx/tochi.conf`: configuracion base de Nginx como proxy reverso.

## Uso recomendado

1. Crea la VM Ubuntu con IP estatica.
2. Copia este repo en la VM.
3. Completa los archivos `.env` con tus secretos reales.
4. Ejecuta `setup-ubuntu.sh` como root.
5. Verifica Nginx y systemd.
6. Cuando hagas cambios de codigo, usa `update-ubuntu.sh`.

## Dominios esperados

- `www.tochilegalsuite.online` -> frontend
- `api.tochilegalsuite.online` -> backend
- `tochilegalsuite.online` -> opcionalmente puedes redirigirlo o servirlo como alias del frontend
