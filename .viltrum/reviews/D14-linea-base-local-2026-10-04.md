# D14 · Línea base QA local del CRM · 2026-10-04

**Alcance:** revisión independiente previa a nuevas integraciones, limitada al C1 activo de `.viltrum/commercial.md` (M01–M15), en `C:\Users\wilbe\Documents\QuisqueyaHome_CRM`. No certifica los 167 elementos exploratorios ni el funcionamiento E2E de proveedores OSS. Clasificación: INTEGRACION, CRM/ERP, R3. Revisor de D14: D00; este documento no cierra ninguna puerta por sí mismo.

**Versión examinada:** rama `develop`, HEAD `cdb5f14` (2026-10-04 20:06:24 -04:00), 76 commits por delante de `origin/develop`. Árbol de trabajo sucio con cambios concurrentes. No se hizo commit, push ni despliegue. No se ejecutó `npm run build` ni `npm run dev` en el checkout principal por la prohibición de `AGENTS.md`.

## Comandos ejecutados

| Comando | Resultado observado | Alcance real |
|---|---|---|
| `npm run typecheck` | exit 0, `tsc --noEmit` sin errores | Tipos del checkout actual. |
| `npm test` | exit 0; **512/512** aprobadas, 0 fallidas | Suite `src/**/*.test.ts`; incluye guardas de permisos, RLS, outbox y algunos estados UX. No equivale a E2E. |
| `npm run test:db` | exit 0; **130/130** aprobadas; migración y semilla en `quisqueyahome_crm_test_1d8580eacc31e911a8cc`; limpieza temporal aprobada; conteos de todas las tablas de desarrollo idénticos antes/después | PostgreSQL local `127.0.0.1:5432`. Prueba de repositorios/datos, no de UI ni proveedor externo. |
| `npm run lint` | exit 1; 18 hallazgos: **2 errores y 16 avisos** | Los dos errores son imports `require()` en `capture_b.cjs:1,2`, archivo no seguido por Git y ajeno a las integraciones. Entre avisos existentes hay `react-hooks/exhaustive-deps` en `src/app/(crm)/comisiones/vista.tsx:300`. |
| `npm run spec:check` | exit 1; 4 fichas, 0 READY, **11 bloqueos** sobre `spec/integraciones/CAPACIDADES.md`; tareas heredadas sin `Ficha:` | No hay ficha de integración lista para implementar. La falla se reproduce ejecutando el comando desde la raíz. |

El proceso de `test:db` informó `DEV COUNTS PASS`; la base de desarrollo conservó, entre otras tablas, 648 leads, 184 negocios, 458 contactos y 404 unidades. La prueba usó una base temporal propia y la eliminó.

## UI local existente

Prueba HTTP de solo lectura sobre el servidor que ya escuchaba en `http://127.0.0.1:9301`:

- `GET /login` → 200, título `Acceder · CRM Quisqueya Home`; respuesta con opciones Admin, Broker y Asistente.
- `GET /leads`, `/negocios`, `/propiedades`, `/academy` sin sesión → 307 hacia `/login?destino=...`.
- Puerto 3001 sin servidor; no se levantó uno. Los puertos 3000 y 3006 respondieron, pero no se atribuyeron a este checkout ni se usaron.

Esto verifica vida de login y redirección de rutas protegidas, **no** un recorrido autenticado ni seis estados de cada pantalla. Quedan pendientes pruebas por rol, permisos de API directos, formularios, persistencia de UI, responsive y una integración real de proveedor. No se afirma que la aplicación completa esté funcional.

## Hallazgos y siguiente flujo

1. **P1 · Gate de integración no preparado.** `npm run spec:check` falla, y el índice de fichas informa 0 READY. Reproducción: desde raíz ejecutar `npm run spec:check`; observar 11 bloqueos de `CAPACIDADES.md` (cabecera YAML, campos, nombre y secciones) y tareas heredadas sin referencia a ficha. Esperado: ficha de la primera integración en READY y checker verde antes de programarla. Responsable: D02/D03; revisión independiente posterior.
2. **P2 · Lint global rojo por archivo auxiliar no seguido.** Reproducción: `npm run lint`; dos errores `@typescript-eslint/no-require-imports` en `capture_b.cjs:1,2`. Esperado: salida 0 para cumplir el gate de implementación. El archivo pertenece al checkout sucio actual; no se editó ni borró en esta revisión. Responsable: dueño de ese archivo/orquestador.
3. **UNKNOWN · UI C1 sin E2E comprobado.** Las 512 pruebas unitarias y 130 de DB respaldan capas internas, pero no prueban el trayecto usuario → UI → API → base → proveedor. El primer flujo vertical debe seleccionar una ficha C1 READY, establecer fixture local y probar autorización por rol, idempotencia, fallo/reintento y estado visible tras recargar. D14 revalidará sin escribir el código que examine.

**Prácticas sólidas observadas:** typecheck verde; guardas automatizadas de RLS/permisos entre las 512 pruebas; `test:db` aísla su base y verifica que no altera la de desarrollo; rutas protegidas redirigen a login sin sesión.

**Limitaciones:** checkout concurrente y sucio; los resultados describen el estado al ejecutar cada comando. Sin navegador autenticado ni proveedor OSS local acreditado, la aceptación E2E sigue `UNKNOWN`. D00 debe revisar este informe; D14 no se autoaprueba.
