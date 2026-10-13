# Revisión D12 — Seguridad y calidad — M13-CORE-0

## Veredicto: **CONDICIONAL**

CORE-0A y CORE-0B están bien resueltos. CORE-0C no está cubierto por el diff ni por la evidencia entregada con el rigor que exige el propio contrato, y eso es lo que bloquea el cierre.

---

### Hallazgos que bloquean (ALTA)

**1. CORE-0C ausente del corte — contrato §"Tareas cerradas" y oráculo #6**
- Ubicación: `src/app/api/academy/route.ts`, `src/app/api/academy/route.test.ts` (ninguno aparece en el diff).
- El contrato es explícito: *"ninguna subtarea aislada se despliega"* — los tres cambios deben entregarse juntos. El diff solo trae CORE-0A y CORE-0B.
- Si no se añade `route.test.ts`, el contrato exige como alternativa una *"captura HTTP auditable... con fecha, comando o solicitud reproducible, estado, cuerpo relevante redactado y resultado esperado/observado para 0%, 100%, 401 y 403"*. La evidencia del host ("API anon 401, demo admin/asistente/broker 200 sin isCertified") es un resumen de una línea, no esa captura. No hay fecha, no hay comando/solicitud, no hay cuerpo (ni redactado), y no distingue el caso 0% del caso 100%.
- **No se reporta ningún caso 403.** El oráculo #6 exige verificar explícitamente 403 para un actor sin `academy:view`, no solo los 401/200 reportados. Sin esa prueba, no puedo confirmar que `resumen` no se filtre en una respuesta de autorización denegada, que es justo el riesgo que D12 debe vigilar.
- **Acción requerida:** o se agrega `route.test.ts` cubriendo 401/403/0%/100%, o se entrega la captura auditable completa en el formato exacto del contrato, incluyendo el caso 403.

**2. Inventario de persistencia/retransmisión no evidenciado — preámbulo del contrato**
- El contrato exige, antes del corte: *"inspeccionar en modo lectura si outbox, logs, caché o exportaciones persisten o retransmiten payloads con `isCertified`"* y registrar ruta/productor/consumidor.
- No hay evidencia de que este paso se haya hecho. Es responsabilidad de seguridad confirmar que no queda un productor activo fuera de los archivos tocados (por ejemplo, un log estructurado o una exportación que serialice el `resumen` completo). Sin este registro, no puedo descartar una fuga residual.

### Hallazgos menores (MEDIA)

**3. Barrido literal de texto no confirmado — oráculo #5**
- El contrato pide buscar literalmente `isCertified`, «Broker Certificado» y «Acreditado oficialmente» en todo el código de Academy antes de cerrar, no solo en los archivos permitidos. El diff deja esos archivos limpios, pero no hay confirmación de que no exista otro consumidor fuera del inventario original (el propio contrato admite que ese inventario puede estar incompleto: *"no inferir cobertura total del índice GitNexus"*).

**4. Ruta DB sin cobertura automatizada (BAJA)**
- `src/infrastructure/db/repos/academy.ts` pierde el cálculo de `isCertified` correctamente, pero no hay prueba unitaria/`test:db` que lo ejerza; solo queda validado por el camino en memoria (`casos-de-uso.test.ts`) y por la comprobación manual de demo mencionada en la evidencia del host. Es aceptable porque el contrato no obliga a `test:db` si no se incorpora una prueba DB nueva, pero lo señalo como riesgo residual: la verificación real de esa ruta depende enteramente de la captura HTTP pendiente del punto 1.

---

### Lo que sí cumple (sin objeción)

- **Tipo y productores** (`puertos.ts`, `en-memoria.ts`, `db/repos/academy.ts`): el campo se **elimina**, no se sustituye por `false`/`null`. Esto es exactamente lo que pide el contrato y evita la ambigüedad señalada en la justificación del corte.
- **Pruebas invertidas correctamente**: `casos-de-uso.test.ts` ya no acepta `isCertified === false` como aprobación; usa `Object.hasOwn(...) === false` y `assert.deepEqual` con la forma completa del objeto, lo cual cumple el oráculo #5 ("no aceptar reemplazar `true` por `false` manteniendo el campo").
- **Oráculo #3 (catálogo vacío) añadido explícitamente** con su propia prueba — va más allá del mínimo exigido.
- **UI (`vista.tsx`)**: se retira la insignia, el texto "Broker Certificado"/"Acreditado oficialmente"/"Certificación en Curso", el eyebrow y subtítulo que prometían certificación. El texto a 100% ("Contenido completado...") es neutral y no promete constancia ni revisión, cumpliendo también la prohibición de "Certificación pendiente de revisión".
- **Sin cambios de autorización**: el diff no toca `requireScope`/`requireFullScope` ni lógica de permisos — no hay bypass introducido.

---

### Para pasar a APROBADO necesito

1. `route.test.ts` (o captura auditable completa en el formato del contrato) cubriendo explícitamente: `resumen` sin `isCertified` a 0% y 100%, 401 anónimo sin `resumen` en el cuerpo, y **403 sin `academy:view`** sin `resumen` en el cuerpo.
2. Registro del inventario de outbox/logs/caché/exportaciones exigido en el preámbulo del contrato (aunque sea "no se encontró ningún productor activo").
3. Confirmación de un barrido literal (`isCertified`, «Broker Certificado», «Acreditado oficialmente») fuera de los archivos del diff.

No reviso esto como D14 (oráculos de API/UI en sesión independiente); mi alcance aquí es seguridad y exposición de datos, y ahí es donde está el vacío.
