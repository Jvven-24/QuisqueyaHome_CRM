# Stack de desarrollo aislado en la VPS (`qh-dev`)

Decisión de Wilber (18-oct-2026): Docker, Moodle y lo pesado corren en la VPS de Hostinger para no cargar la máquina de
desarrollo; se modifica en local y se sube. Aislado de todo lo que ya corre allí (bot, runtime, Portales, Supabase de
producción y el staging antiguo `quisqueya-crm-staging`): proyecto Compose, red y volúmenes propios (`qh-dev`), puertos solo
en `127.0.0.1` de la VPS y límites de CPU/RAM por servicio.

| Servicio | Imagen | Acceso (por túnel) |
|---|---|---|
| CRM (producción, `next start`) | node:22-alpine + compilación en `/opt/qh-dev/app` | http://localhost:3201 |
| Auth compatible con Supabase | supabase/gotrue v2.189.0 detrás de Caddy (`/auth/v1`) | http://localhost:54331 |
| Moodle 4.5.15 LTS | erseco/alpine-moodle:v4.5.15 | http://localhost:9330 |
| Postgres 15 | bases `crm`, `auth`, `moodle` | solo red interna |

## Uso diario (desde la raíz del repo, en local)

```bash
npm run vps -- tunel
```
Deja el túnel abierto (CRM, auth y Moodle en `localhost`). El CRM de desarrollo local (`npm run dev`, puerto 9301) usa el
Moodle de la VPS por ese mismo túnel (`MOODLE_URL=http://127.0.0.1:9330` en `.env.local`).

```bash
npm run vps -- subir
```
Empaqueta el árbol real (incluidos cambios sin commit; nunca `.env*` ni `.viltrum/`), lo sube, compila en la VPS con 1 CPU
y reinicia solo la app.

```bash
npm run vps -- datos
```
Reemplaza la base `crm` de la VPS con la base local. Después: `ssh hostinger "cd /opt/qh-dev && sh remoto.sh usuarios"`.

```bash
npm run vps -- estado
```

## Secretos
Se generan en la VPS (`/opt/qh-dev/.env`, `app.env`, `moodle.token`, chmod 600) y no viajan al repositorio. El token de Moodle
está restringido a la red interna del stack. Las contraseñas de los usuarios de prueba (`admin.prueba@`, `broker.prueba@`)
están en `/opt/qh-dev/.env` (`QH_TEST_*`).

## Moodle
Instalado con los mismos scripts del Moodle local (`moodle-local/scripts/01..03`), ejecutados dentro del contenedor con el
usuario `nobody`: servicios web del CRM, curso sintético y curso «Inducción Quisqueya Home — Asesor inmobiliario en Punta
Cana» (QHA-IND-PC, 4 secciones, cuestionario de 10 preguntas al 80 %).

## Apagar o borrar
`ssh hostinger "cd /opt/qh-dev && docker compose -p qh-dev down"` lo detiene sin tocar nada más; `down -v` borra también sus
volúmenes (datos de la base y de Moodle del stack).
