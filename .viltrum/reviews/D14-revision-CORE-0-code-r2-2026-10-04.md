# Dictamen D14 — Segundo pase CORE-0

**APROBADO**

Los tres hallazgos de severidad Alta y los dos de severidad Media pendientes del dictamen anterior quedan cerrados con evidencia concreta que satisface los oráculos del contrato. CORE-0 puede publicarse como un solo corte (0A+0B+0C).

## Resolución de hallazgos previos

**1. [Alta → Cerrado] Verificación de autorización incompleta**
`src/app/api/academy/route.test.ts` transpila y ejecuta `route.ts` real en un contexto VM, inyectando solo los módulos externos (`casos-de-uso`, `rbac.requireScope` real, `requireActor`, repositorio y `errorResponse`). El `require` shim lanza si `route.ts` importa algo no listado, lo que de paso confirma que el handler no ganó dependencias ocultas. Resultado: 401 (actor nulo) y 403 (actor con permisos vacíos) verificados contra el handler real, cuerpo sin `resumen` en ambos. El diff no toca `route.ts`, así que "antes y después del cambio" es el mismo comportamiento — oráculo 6 satisfecho.

**2. [Alta → Cerrado] Falta captura HTTP auditable de CORE-0C**
Ya no aplica la premisa "a falta de prueba automatizada": `route.test.ts` existe y cubre 401/403/200(0%)/200(100%) con cuerpos exactos (`deepEqual`). La tabla en la evidencia integra fecha, comando (`node --test ...`), estado y cuerpo por caso. Se complementa con observación en servidor Next local (401 anónimo, 200 para tres perfiles demo con forma exacta `totalItems/completedItems/percent`). Cumple la cláusula de captura auditable.

**3. [Alta → Cerrado] Verificación visual en UI no realizada**
Playwright contra `localhost:9311/academy` en sesión real de Broker: catálogo vacío → `0%`, "0 de 0 contenidos", mensaje neutral, sin insignia ni certificación (0% y vacío son el mismo estado observado, legítimo dado que no hay contenidos locales). Para 100% se insertó un contenido temporal y su progreso, se recargó dos veces, se confirmó texto "Contenido completado" sin coincidencias de "Certificado"/"Acreditado", y se eliminó el dato con verificación de cascada FK y `test:db` en 0 filas antes/después. Es un sustituto razonable de interacción real de checklist, dado que no existe catálogo local con el que interactuar — límite de entorno, no incumplimiento de contrato.

**4. [Media → Cerrado] Inspección de retransmisión de payloads**
Documentada: `rg` sobre `isCertified`/textos de certificación en `src scripts db`, y revisión de `outbox`, `outbox_dead`, `external_refs` (0 filas). Productor único identificado (`obtenerResumenProgreso`), consumidores acotados a la página y la ruta API. Alcance declarado explícitamente (código y DB local, no otros entornos).

**5. [Media → Cerrado] `test:db` no ejecutado**
Ejecutado con `--env-file` explícito: 130/130 en verde. La corrida fallida inicial (sin el flag) se descarta correctamente y no se cuenta como verde, conforme al candado 1 de `AGENTS.md`.

**6. [Media → Cerrado] Barrido literal fuera del diff**
`rg -n -i 'isCertified|Broker Certificado|Acreditado oficialmente'` sobre `src scripts db`: únicas coincidencias son las aserciones negativas en los dos archivos de test. Cubre `route.ts`, que no aparecía en el diff original.

**7. [Baja → Abierto, no bloqueante]** El uso de `Reflect.set(repo, "items", [])` sigue sin cambiar. Se mantiene como recomendación para CORE-1..5, no bloquea este cierre.

## Límites residuales (no bloqueos de contrato)

- El 403 se probó con un actor sintético aislado, no con una cuenta demo real sin `academy:view` en el servidor Next — no existe tal cuenta en el entorno local, y el contrato no exige crearla; el handler ejecutado es el real.
- El caso 100% (API y UI) requirió datos temporales porque el catálogo local está vacío; se limpiaron con verificación de conteo antes/después en las cuatro tablas de Academy.
- El `.env` usado en `test:db` apunta al checkout principal, no a un entorno de pruebas dedicado. No es un hallazgo bloqueante dado el cleanup verificado, pero para futuros cortes que requieran manipular datos sería preferible una base de pruebas aislada en vez del entorno de desarrollo compartido.

## Confirmación de código

El diff no cambió respecto al revisado en el primer pase (`vista.tsx`, `puertos.ts`, `en-memoria.ts`, `db/repos/academy.ts`, `casos-de-uso.test.ts`), ya validado como correcto. Lo único nuevo es `route.test.ts`, que es aditivo y no modifica rutas de producción.

**Veredicto: CORE-0 queda cerrado. Autorizado a integrar.**
