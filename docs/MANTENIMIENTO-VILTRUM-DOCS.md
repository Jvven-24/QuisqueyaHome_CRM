# Mantenimiento del centro de información — instrucciones para Viltrum Docs

Objetivo: que `docs/INDICE.md` (repo) y la carpeta de Drive **Quisqueya Home CRM — Central** (cuenta viltrumtek, privada) reflejen siempre el estado real del proyecto.

## 1. Automático (no tocar a mano)
- `/workspace/crm-plan/central/sync.sh` corre cada 30 min (bucle `setsid`, log en `central/sync.log`).
- Regenera desde las fuentes: `docs/INDICE.md`, `docs/modulos/*.md`, `docs/revisiones/<rama>.md`, `docs/estado/login-google-correo.md`, `docs/infra/inventario-docker.md`, `docs/plan/*.md`, y la exportación estática del tablero (`central/export/`).
- Oculta líneas con posibles secretos (`[línea omitida: posible secreto]`).
- Commitea **solo `docs/`** en `codex/wilber-crm-20261026` y hace push sin force. Nunca `main`.
- Deja en `central/drive-pendiente.txt` los archivos que cambiaron y hay que resubir a Drive.

## 2. Lo que hace Viltrum Docs en cada pasada
1. Leer `central/drive-pendiente.txt`. Por cada archivo, actualizar su copia en Drive (conector `user-Google-drive--viltrumtek-gmail-com`, `update_file_content` si ya existe, `create_file` en la subcarpeta correcta si no). Los IDs están en `central/drive-ids.json`. Vaciar la cola al terminar.
2. Reemplazar el Google Doc **INDICE — Quisqueya Home CRM** (00-Indice) con el contenido de `docs/INDICE.md`.
3. Si aparece un PDF nuevo (VT-…), subirlo a la subcarpeta que le toca y añadir su enlace a `central/drive-ids.json`. **Los PDF y binarios no entran al repo.**
4. Editar a mano solo `central/estado-login-notas.md` (resumen de Login/Google/Correo) cuando cambie algo verificado.
5. No compartir nada públicamente ni con terceros sin OK de Wilber.

## 3. Fuentes a leer (solo lectura)
| Fuente | Qué alimenta |
|---|---|
| `/workspace/crm-plan/tablero/estado.json`, `historia.json`, `index.html` | Tablero, avance por módulo, estado de ramas |
| `/workspace/crm-plan/tablero/revisiones/<rama>.jsonl` | Resúmenes de hallazgos por rama (los `.log` no se copian) |
| `/workspace/crm-plan/reasignaciones.log` | Últimas reasignaciones de ramas |
| `/workspace/crm-plan/modulos/*.md` | Specs de los 22 módulos |
| `/workspace/crm-plan/ref/` y `tablero/ref/` | Compendio y plan comercial (PDF en Drive 03) |
| `/workspace/crm-plan/inventario/` | Inventario Docker (PDF en Drive 04) |
| `/workspace/crm-plan/guia-google/` | Guía y capturas OAuth (Drive 06) |
| Repo: `git log`, `DESIGN.md`, `design/viltrum/`, `AGENTS.md` | Estado de auth/correo y diseño |

El tablero y las ramas `orq/*` los mantiene otro proceso: **no modificarlos**.

## 4. Estructura en Drive
`00-Indice` · `01-Tablero` · `02-Modulos` · `03-Compendio` · `04-Infraestructura` · `05-Revisiones` · `06-Estado-Integraciones` · `07-Diseño`

## 5. Convención de nombres Viltrum (documentos formales)
`VT-<ÁREA>-<TIPO><NN>_<Titulo-con-guiones>_v<M.m>_<AAAA-MM-DD>.<ext>`
- ÁREA: `INF` infraestructura, `CRM` producto, `DSN` diseño, `SEG` seguridad, `OPS` operación, `COM` comercial.
- TIPO: `R` reporte, `G` guía, `P` plan, `E` especificación, `A` acta/decisión.
- Ejemplo: `VT-INF-R01_Inventario-Docker-VPS_v1.0_2026-10-27.pdf`.
- Nueva versión = nuevo archivo con `v` subida; la anterior se mueve a una subcarpeta `_historico`.
- Fechas y horas siempre en hora RD (UTC-4).

## 6. Reglas
- Nunca escribir secretos, claves ni client secrets en docs ni en Drive.
- No tocar el deploy (`remoto.sh`), ni `main`, ni force-push.
- Viltrum Code ayuda a mantener esta documentación (prueba 2026-10-27).
