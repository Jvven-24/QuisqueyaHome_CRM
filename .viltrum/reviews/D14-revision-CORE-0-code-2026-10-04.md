# Dictamen D14 — Revisión independiente CORE-0

**APROBADO CONDICIONAL**

Los cambios de código (CORE-0A y CORE-0B) son correctos y están cubiertos por prueba. CORE-0C y los requisitos de verificación/evidencia que exige el contrato no están completos. El contrato prohíbe publicar un corte parcial ("los tres cambios se entregan juntos"), así que no cierro CORE-0 hasta resolver los hallazgos de severidad Alta.

## Hallazgos

**1. [Alta] Verificación de autorización incompleta — oráculo 6**
Archivo: `src/app/api/academy/route.ts` (sin diff) / evidencia del host.
El contrato exige comprobar 401 sin sesión **y** 403 sin `academy:view`, antes y después del cambio. La evidencia reportada solo cubre 401 anónimo y 200 para tres perfiles demo. No hay constancia de la prueba 403 (actor autenticado sin el scope `academy:view`). Falta cerrar este oráculo antes de aprobar.

**2. [Alta] Falta la captura HTTP auditable formal de CORE-0C**
El contrato exige, a falta de prueba automatizada (`route.test.ts` no se tocó), conservar una captura con fecha, comando/solicitud reproducible, estado, cuerpo redactado y resultado esperado/observado para los casos 0%, 100%, 401 y 403. Lo recibido es un resumen verbal ("GET /api/academy anónimo=401 y tres perfiles demo=200 con resumen sin isCertified"), sin registro del caso 100% explícito ni del 403, y sin el formato auditable pedido. Esto no cumple la cláusula "sin eso, captura HTTP auditable" de la tabla de tareas.

**3. [Alta] Verificación visual en UI no realizada**
El propio host indica "No se ha probado visualmente aún". El contrato exige evidencia de navegador para 0%, 100%, vacío y tras recarga (sección "Verificación y límites"). Sin esto no puede cerrarse el corte, ya que es la única vía de confirmar en runtime que no aparece insignia ni texto de certificación tras interacción real (checklist marcado, filtros, etc.), más allá de lo que muestra el diff estático.

**4. [Media] Inspección de retransmisión de payloads no documentada**
El contrato pide, en modo lectura, revisar si outbox, logs, caché o exportaciones persisten/retransmiten `isCertified`, y registrar ruta/productor-consumidor antes del corte. No hay evidencia de que esta inspección se haya hecho ni de su resultado. Si existe un productor activo fuera de los archivos permitidos, el contrato obliga a detener el despacho — no se puede asumir que no existe sin la inspección.

**5. [Media] `npm run test:db` no ejecutado**
Archivo: `src/infrastructure/db/repos/academy.ts`.
Se modificó la ruta de producción respaldada por base de datos (se quitó el cálculo de `isCertified` del repo real). El contrato pide correr `test:db` cuando se incorpora prueba DB; aunque aquí no se añadió una prueba DB nueva, el cambio toca directamente ese repositorio y no hay evidencia de que el camino DB-backed se haya verificado en ejecución (solo el build/typecheck estático). Recomiendo correrlo antes de cerrar, dado que es el único repo que sirve `GET /api/academy` en producción.

**6. [Media] Barrido literal de cadenas prohibidas no confirmado fuera del diff**
El oráculo 5 exige buscar literalmente `isCertified`, «Broker Certificado» y «Acreditado oficialmente» en código de Academy antes de cerrar. El diff muestra que se quitaron del bloque de insignia en `vista.tsx`, pero no tengo visibilidad de si quedan referencias en partes no tocadas del mismo archivo, en `route.ts`, en otros consumidores (exportaciones, emails, otras vistas) o en documentación/specs de Academy. El propio contrato advierte: "no inferir cobertura total del índice GitNexus" — pido que el host confirme el grep completo (incluyendo `route.ts`, que no aparece en el diff) y adjunte el resultado.

**7. [Baja] Estilo de la prueba nueva**
Archivo: `src/application/academy/casos-de-uso.test.ts`, test "catálogo vacío".
Usa `Reflect.set(repo, "items", [])` para forzar el estado vacío, saltando la API pública del repo en memoria. Funciona y cubre el oráculo 3, pero es un acoplamiento a un detalle interno (`items`) que podría romperse silenciosamente si se renombra el campo privado. No bloquea, pero sugiero exponer un constructor/factory para catálogo vacío si se reutiliza este patrón en CORE-1..5.

## Lo que sí está verificado y correcto

- `ResumenProgresoAcademy` (puertos.ts), `en-memoria.ts` y `db/repos/academy.ts` quitan `isCertified` sin sustituto (`false`/`null`), tal como exige el contrato — cumple la decisión de contrato y evita el riesgo de significado silencioso que el contrato señala.
- Las pruebas en `casos-de-uso.test.ts` invierten correctamente la aserción `isCertified=true` a 100% (oráculo 5), y verifican ausencia de la clave (no solo valor falso) en 0%, 25%, 100% y catálogo vacío (oráculos 1–3) con `Object.hasOwn` y `deepEqual` exacto sobre el objeto — exactamente lo que pide CORE-0B.
- `vista.tsx` retira la insignia de certificación, el ícono `Award`, y los textos "Broker Certificado" / "Acreditado oficialmente", sustituyéndolos por "Contenido completado" en 100% y un mensaje neutral en progreso — cumple el oráculo 5 en el fragmento visible.
- 513 tests en verde, typecheck y build en 0, lint sin regresiones nuevas (13 advertencias previas sin cambio reportado) — evidencia estática sólida.

## Condición para APROBADO sin reservas

Cerrar los hallazgos 1–3 (Alta) como mínimo: prueba 403, captura auditable completa de CORE-0C, y verificación visual en navegador. Hallazgos 4–6 deben documentarse aunque el resultado sea "no se encontró nada" — el contrato pide registrar la inspección, no solo asumir que pasó.
