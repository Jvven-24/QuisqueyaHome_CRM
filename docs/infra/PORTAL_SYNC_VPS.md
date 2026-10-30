# Guía de instalación en la VPS: sincronización CRM → portal

> **Esta guía NO se ha ejecutado.** Nada de esto se instaló ni se tocó en la VPS. Antes de empezar: OK explícito de Wilber, `pg_dump` si hay migraciones, y despliegue solo con `/opt/qh-dev/remoto.sh` (ver `docs/DESPLIEGUE.md`).
> La sincronización no requiere migración de base de datos.

## 0. Prerrequisitos

1. El portal (repo PortalWeb) ya implementa y desplegó los endpoints de `docs/PORTAL_CMS_CRM.md` («Contrato»), primero en **`quisqueya-portal-staging`**.
2. El CRM con esta rama está desplegado (flujo normal) y `PORTAL_SYNC_ENABLED=false`.

## 1. Secreto compartido

Generar un secreto de 32 bytes: `openssl rand -hex 32`. Se guarda **solo** en los `.env` de producción del CRM y del portal (nunca en el repo, ni en chat, ni en tickets). Rotación: cambiar en ambos y reiniciar los dos.

## 2. Variables

CRM (`.env` del contenedor `qh-dev-app` / producción):

```
PORTAL_SYNC_ENABLED=true
PORTAL_SYNC_URL=https://<host-interno-o-publico-del-portal>   # staging primero
PORTAL_SYNC_SECRET=<secreto del paso 1>
```

Portal: `CRM_SYNC_SECRET=<mismo secreto>` (nombre propuesto; lo define el repo del portal).

Si el CRM y el portal están en la misma red de Docker, usar la URL interna (`http://quisqueya-portal:8787` solo se permite en localhost; para URL interna de Docker usar https detrás del proxy o ampliar `baseUrlValida` con una lista de hosts permitidos: cambio pequeño y revisado).

## 3. Prueba en staging

1. Con la bandera encendida solo en staging, llamar como admin a `GET /api/portal-sync/reconciliar` (simulacro) y revisar `acciones`.
2. `POST /api/portal-sync/reconciliar` y comprobar en el portal de staging los proyectos creados.
3. Repetir el `POST`: debe devolver `sinCambios = N` y 0 llamadas de escritura.
4. Despublicar un proyecto en el CRM, ejecutar de nuevo: el portal lo retira. El contenido propio del portal (`origen ≠ crm`) no se toca.

## 4. Temporizador (cada 10 min)

`/etc/systemd/system/qh-portal-sync.service`:

```
[Service]
Type=oneshot
EnvironmentFile=/opt/qh-dev/portal-sync.env      # solo contiene PORTAL_SYNC_SECRET, permisos 600
ExecStart=/opt/qh-dev/portal-sync-llamar.sh
```

`/opt/qh-dev/portal-sync-llamar.sh` (755):

```
#!/bin/sh
set -eu
RUTA=/api/portal-sync/cron
TS=$(date +%s)
FIRMA=$(printf '%s.POST.%s.' "$TS" "$RUTA" | openssl dgst -sha256 -hmac "$PORTAL_SYNC_SECRET" -hex | awk '{print $NF}')
curl -fsS --max-time 60 -X POST -H "x-qh-timestamp: $TS" -H "x-qh-signature: $FIRMA" "https://crm.quisqueyahome.com$RUTA" >/dev/null
```

`/etc/systemd/system/qh-portal-sync.timer`:

```
[Timer]
OnBootSec=2min
OnUnitActiveSec=10min
[Install]
WantedBy=timers.target
```

Activar: `systemctl daemon-reload && systemctl enable --now qh-portal-sync.timer`. Logs: `journalctl -u qh-portal-sync`.

## 5. Producción

Repetir los pasos 2–3 apuntando al portal de producción, en horario de baja actividad, con la bandera encendida primero solo para el simulacro.

## 6. Reversa

`PORTAL_SYNC_ENABLED=false` y reinicio del CRM (las rutas responden 409; el temporizador falla sin efecto), `systemctl disable --now qh-portal-sync.timer`. Lo ya publicado en el portal queda como está; para retirarlo, despublicar en el CRM antes de apagar la bandera y correr una reconciliación.
