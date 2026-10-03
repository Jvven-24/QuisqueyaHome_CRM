## Cambios

- Se transfirió el código actual a `/opt/quisqueya-crm-staging` en la VPS de hostinger.
- Se configuró el CRM local dentro de la VPS usando `docker build` (imagen `node:22-alpine` para coincidir con producción).
- Se creó un `.env` propio para el CRM (con `chmod 600`) que apunta `DATABASE_URL` al contenedor de la base de datos `quisqueya-staging-db` y usa la URL `http://quisqueya-crm-staging-auth-proxy-1` para Auth a través de la red interna de Docker (`quisqueya_staging`). Se omitieron valores de secretos en el repositorio, obteniéndose en tiempo real.
- No se expusieron puertos públicamente. El contenedor escucha solo en `127.0.0.1:3101`.
- Se documentó el flujo en `docs/ops/crm-local-staging.md`.

## Pruebas

El túnel inverso a 3101 permitió probar directamente:
- Login fue exitoso con credenciales administrativas (`admin.prueba@quisqueyahome.do`).
- Las páginas /inicio, /leads, /pipeline, /contactos y /reportes devolvieron HTTP 200 en menos de 3 s usando los recursos de la red interna.

## Handoff

D12: He preparado el entorno de CRM staging local en la VPS para mitigar los errores `ECONNRESET`. Por favor, valida la seguridad de los secretos en `/opt/quisqueya-crm-staging/.env` (no fueron versionados y quedaron con los permisos apropiados) y el aislamiento de puertos (el puerto 3101 está restringido a 127.0.0.1). El entorno no toca a producción.
