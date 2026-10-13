# CORE-0 — verificación integrada local

Fecha local: 2026-10-04. Host: D00. Checkout de ejecución: `academy-core0-D09-codex-20261004` (worktree aislado). No hubo commit, push ni despliegue.

## API y autorización

`src/app/api/academy/route.test.ts` ejecuta el handler real con actor y repositorio en memoria aislados. Comando: `node --test src/app/api/academy/route.test.ts`. Resultado: 2/2 pruebas aprobadas. Casos observados:

| Solicitud | Esperado y observado | Cuerpo relevante |
|---|---|---|
| GET `/api/academy`, sin actor | 401 | `resumen` ausente |
| GET `/api/academy`, actor sin `academy:view` | 403 | `resumen` ausente |
| GET `/api/academy`, actor autorizado, progreso 0 % | 200 | `{"totalItems":4,"completedItems":0,"percent":0}` |
| GET `/api/academy`, actor autorizado, progreso 100 % | 200 | `{"totalItems":4,"completedItems":4,"percent":100}`; clave `isCertified` ausente |

El handler no cambió sus guardas respecto de HEAD. En el servidor Next local, `GET /api/academy` anónimo devolvió 401; Admin, Broker y Asistente de evaluación devolvieron 200 con resumen exactamente `totalItems`, `completedItems`, `percent` (catálogo vacío). La prueba 403 corresponde al handler aislado con un actor autenticado sin el scope, no a una cuenta demo del servidor.

## Navegador local

Playwright CLI contra `http://localhost:9311/academy`, sesión de evaluación Broker. Catálogo original: 0 filas. Snapshot: `0%`, `0 de 0 contenidos`, «Continúa con las sesiones y los checklists para avanzar en tu formación»; no hubo insignia ni afirmación de certificación.

Para observar el 100 % sin dejar datos de prueba, se insertó una sesión temporal y su progreso completo para el Broker de evaluación; se usó `playwright-cli reload` y `playwright-cli snapshot` dos veces. Ambas lecturas mostraron `100%`, `1 de 1 contenidos` y «Contenido completado. Has terminado los contenidos de formación disponibles». La búsqueda de `Certificado` y `Acreditado` en ambas capturas no devolvió líneas. En el bloque `finally` se eliminó por ID y título exactos el ítem temporal (su progreso salió por FK `ON DELETE CASCADE`): `removed=1`, `remaining=0`. El posterior `test:db` confirmó 0 filas en las cuatro tablas Academy antes y después de su base temporal.

No se ejerció una acción de checklist real en el navegador porque el catálogo local se encontraba vacío. Los casos de uso y la prueba del handler ejercen finalización y recarga semántica a 100 %; la prueba visual confirma la recarga con dato temporal.

## Barrido de datos y cadenas

Comandos: `rg -n -i 'isCertified|Broker Certificado|Acreditado oficialmente' src scripts db` y búsqueda de `academy|resumen` en `src/infrastructure/integraciones/outbox`, `src/infrastructure/db/repos` y rutas de exportación. Resultado: `isCertified` solo en aserciones negativas de `casos-de-uso.test.ts` y `route.test.ts`; los otros dos textos no aparecen en código. El productor de `resumen` es `repositorioAcademy.obtenerResumenProgreso`; lo consumen la página de servidor Academy y `GET /api/academy`. No se encontró ruta que persista o retransmita ese resumen a outbox, log, caché o exportación. `outbox`, `outbox_dead` y `external_refs` tenían 0 filas en el barrido DB local. Alcance: código y base local revisados, sin afirmar ausencia en otros entornos o registros históricos externos.

## Comprobaciones

- `npm run typecheck`: aprobado.
- `npm run lint`: 0 errores, 13 advertencias previas en otros archivos.
- `npm test`: 515/515 aprobadas.
- `node scripts/test-db/run.mjs --env-file=C:\Users\wilbe\Documents\QuisqueyaHome_CRM\.env`: 130/130 aprobadas; base temporal creada y eliminada, conteos de todas las tablas iguales antes/después.
- `npm run build`: aprobado después de añadir `route.test.ts`.
- `git diff --check`: aprobado (avisos de normalización LF/CRLF, sin errores de espacio).

La primera llamada `npm run test:db` sin el archivo de entorno falló por configuración; se repitió con `--env-file` explícito y pasó. No se contabiliza la primera como verde.
