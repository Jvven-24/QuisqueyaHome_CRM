No pude crear el archivo de plan: la herramienta `Write` está deshabilitada en esta sesión (y no tengo `ExitPlanMode` disponible). Como la tarea es de solo lectura y el entregable pedido es el informe en sí, lo entrego directamente aquí como texto — no he tocado `CORE-0.md`, código ni estado de ningún archivo.

---

# D14 · Revisión de testabilidad — CORE-0 (Retirar la autocertificación derivada) · 2026-10-04

**Entrada:** `specs/002-m13-certificacion-local/CORE-0.md`, `estado: DRAFT`, `contract_id: C1:M10`. **Alcance de esta revisión:** únicamente el subcontrato CORE-0 (tareas CORE-0A/B/C). No evalúo CORE-1..5 ni M13-CORE completo — ese dictamen ya existe en `.viltrum/reviews/D14-revision-M13-CORE-READY-2026-10-04.md` y sigue vigente (FAIL para el núcleo completo; PASS de dirección para separar CORE-0).

**DRAFT vs implementación:** `CORE-0.md` es un documento de especificación, no código. No se ha escrito ni una línea de la corrección; esta revisión evalúa si el contrato, tal como está redactado hoy, es apto para que D00 lo registre `READY` y lo despache — no certifica ningún build, prueba corrida ni captura, porque no existen todavía. No edité la ficha ni el código, no cambié `estado:`, no aprobé ningún gate.

## Veredicto

**RECHAZADO para promover CORE-0 a `READY` con su redacción actual.**

La dirección de ingeniería es correcta y el acotamiento por tarea es sólido: archivos pequeños, un corte conjunto A+B+C, prohibición explícita de "reemplazar `true` por `false` manteniendo el campo", y una cláusula de reserva ya correcta para el caso en que el harness HTTP no alcance. El rechazo no es sobre el enfoque: es sobre **dos huecos de oráculo** que impiden escribir pruebas deterministas hoy, y que el propio manual de D14 obliga a escalar en vez de inventar (`SOUL.md`: *"No diseño el caso de prueba sin conocer el criterio de aceptación... escalo la pregunta en vez de inventar el criterio"*). Ambos huecos se cierran con ediciones pequeñas a `CORE-0.md` — no requieren rediseñar el contrato ni tocar más archivos.

## Verificación independiente del radio de impacto

Repetí el inventario de `isCertified` en todo `src/` (no solo confié en la ficha ni en el grafo GitNexus, como pide `CORE-0.md:21`). Coincide exactamente con lo declarado:

| Archivo:línea | Uso |
|---|---|
| `src/application/academy/puertos.ts:34` | Define `isCertified: boolean` en `ResumenProgresoAcademy` |
| `src/application/academy/en-memoria.ts:193` | Rama `totalItems===0` devuelve `isCertified: false` |
| `src/application/academy/en-memoria.ts:202,208` | Calcula `isCertified = percent === 100` y lo incluye en el resultado |
| `src/infrastructure/db/repos/academy.ts:288,294` | Calcula `isCertified = totalItems > 0 && completedItems >= totalItems` desde conteos DB |
| `src/app/(crm)/academy/vista.tsx:46,97,499,507,514,521,524` | Tipo `ResumenAcademyVista`, recálculo local tras interacción, y renderizado de la insignia «Broker Certificado» / «Acreditado oficialmente» |
| `src/application/academy/casos-de-uso.test.ts:25,56,95` | Tres aserciones: dos esperan `false`, una espera `true` a 100% |

No encontré consumidores adicionales. `src/application/academy/consultas.ts:8,15` usa el tipo `ResumenProgresoAcademy` solo como anotación de retorno (no destructura `isCertified`) — no necesita cambios y no está en ninguna lista de archivos permitidos, correctamente. `src/app/api/academy/route.ts:19-25` reenvía el objeto `resumen` completo tal cual lo devuelve el repositorio, sin nombrar el campo — confirma la afirmación de CORE-0C de que la ruta no necesita tocarse si el repositorio ya no emite el campo.

## Evaluación por subtarea

### CORE-0A · `src/app/(crm)/academy/vista.tsx` — PARCIAL

Acotamiento ≤45 min: correcto, un solo archivo, cambio pequeño y localizado (tipo, `recalcularResumen` en `vista.tsx:89-99`, bloque de insignia en `vista.tsx:483-527`).

**Hallazgo H1 (oráculo incompleto, bloquea prueba determinista de copy).** `CORE-0.md:19` autoriza como ejemplo el texto «Certificación pendiente de revisión», aclarando que es «únicamente información de proceso, sin prometer que se haya creado una solicitud». Pero el oráculo negativo #5 (`CORE-0.md:41`) solo prohíbe buscar literalmente `isCertified`, «Broker Certificado» y «Acreditado oficialmente» — no incluye «pendiente de revisión» ni ninguna variante en la lista de frases vigiladas, pese a introducirla como texto permitido. En este corte no existe ningún mecanismo de solicitud o decisión (CORE-1..5 siguen `DRAFT`), así que mostrar «pendiente de revisión» puede leerse como "ya hay una revisión en curso", exactamente la confusión progreso-vs-decisión-Admin que se me pidió vigilar. No puedo escribir una prueba que distinga una redacción conforme de una que no lo es, porque la ficha no fija ni el texto exacto ni una lista cerrada de frases prohibidas para el estado 100%.

*Cierre propuesto (edición de `CORE-0.md`, no de código):* o bien prohibir explícitamente «pendiente de revisión» y cualquier variante que sugiera proceso activo en este lote, o fijar un texto exacto y único para el estado 100% (p. ej. «Contenido completado») y añadirlo a la lista de frases vigiladas del oráculo #5.

### CORE-0B · `puertos.ts`, `en-memoria.ts`, `academy.ts` (repo DB), `casos-de-uso.test.ts` — PARCIAL

Acotamiento ≤45 min: correcto. Cuatro archivos, cada cambio es de pocas líneas (quitar un campo del tipo, quitar dos sitios de cálculo por archivo, invertir una aserción).

**Hallazgo H2 (oráculo incompleto, bloquea el caso "catálogo vacío" en la prueba unitaria).** `CORE-0.md:37,39,41` exige que la prueba de 0%, 100% y vacío compruebe **ausencia de la clave**, no solo un valor falso — una mejora real sobre la prueba actual, que solo verifica `=== false` (`casos-de-uso.test.ts:25,56`, insuficiente porque pasaría igual si el campo quedara con valor `false`). Pero `RepositorioAcademyEnMemoria` no tiene constructor (`en-memoria.ts:8-9`): `this.items` es un arreglo fijo de 4 elementos. No hay forma de instanciar el doble con catálogo vacío (`totalItems=0`, rama `en-memoria.ts:193`) sin una decisión de diseño que la ficha no deja escrita: inyectar `items` por constructor, o usar en el test un doble mínimo ad-hoc que no sea la clase real. Ambas rutas son válidas y caben en los archivos permitidos, pero sin que D03 elija una, dos productores distintos escribirían pruebas distintas y D14 no tiene un criterio único contra el cual verificar.

*Cierre propuesto (edición de `CORE-0.md`):* indicar explícitamente que `RepositorioAcademyEnMemoria` puede aceptar una lista de ítems inyectada por constructor (opcional, por defecto el catálogo actual) para permitir el caso vacío en la prueba unitaria; o, si se prefiere no tocar la clase productiva, indicar que el caso "vacío" de CORE-0B se prueba con un doble literal que implemente `RepositorioAcademy.obtenerResumenProgreso` directamente.

**Verificación positiva:** la rama DB (`academy.ts:287-288`) ya calcula `totalItems`/`percent` desde un conteo real, así que el caso vacío ahí es natural (cero filas activas) y no tiene este problema — solo requiere `test:db`, correctamente condicionado aparte.

### CORE-0C · `src/app/api/academy/route.ts` + prueba condicional — PARCIAL, con hallazgo ya anticipado por la ficha

Acotamiento ≤45 min: correcto. `route.ts` no necesita cambios de código (ver verificación de impacto arriba); el trabajo real es la evidencia.

**Hallazgo H3 (confirmación, no contradice la ficha).** Verifiqué que la condición "solo si el harness local permite actor/repositorio de prueba sin cambiar archivos fuera de esta lista" **falla hoy**: `package.json:15` corre `node --test "src/**/*.test.ts"` sin resolución de alias TS, y `route.ts` importa todo por `@/...`. El precedente `src/app/api/metas/route.test.ts:8-9` documenta por escrito que por esta razón nunca importa `route.ts` en pruebas. CORE-0.md ya anticipa esto correctamente con su cláusula de reserva ("sin eso, prueba de integración HTTP autenticada como evidencia externa a código"). No es un defecto de la ficha — es una confirmación de que D14 debe entrar a ejecutar esperando usar evidencia HTTP manual (servidor local + Supabase local, captura de `GET /api/academy` a 0% y 100%), no intentar un `route.test.ts` que el harness actual no puede correr. Señalo esto para que el productor no gaste parte del presupuesto de 45 min probando esa vía antes de descartarla.

## Oráculos transversales — ¿se resuelve la autocertificación sin confundir progreso con decisión Admin?

Sí, en lo estructural: el contrato prohíbe explícitamente devolver `false`, `null` o un sustituto de certificación (`CORE-0.md:17`), prohíbe mostrar «Broker Certificado» o «Acreditado oficialmente», y prohíbe tratar 100% como aprobación. El único punto donde la línea entre "progreso" y "decisión Admin" queda floja es el texto opcional de H1 — ya cubierto arriba.

## Pruebas exigidas antes de aceptar CORE-0 como implementado (no como ficha)

1. `casos-de-uso.test.ts`: invertir la aserción de `casos-de-uso.test.ts:95` verificando **ausencia de clave** (`!('isCertified' in resumen)` o equivalente), no solo valor falso; aplicar el mismo criterio de ausencia a los casos de 0% (`:25`) y agregar un caso nuevo de catálogo vacío una vez resuelto H2.
2. `vista.tsx`: captura o inspección en navegador local a 0%, 100%, catálogo vacío y tras recarga — confirmar que no aparece ninguna de las frases prohibidas (lista cerrada tras resolver H1) en ningún estado.
3. API: `GET /api/academy` autenticado, inspección manual del JSON de `resumen` a 0% y 100% — confirmar ausencia de la clave `isCertified` en ambos. No depender de un `route.test.ts` (hallazgo H3).
4. Búsqueda literal repetida de `isCertified`, «Broker Certificado» y «Acreditado oficialmente» en `src/` tras el cambio, antes de cerrar (`CORE-0.md:41`).
5. `npm run typecheck`, `npm run lint`, `npm test` en verde; `npm run test:db` solo si se agrega la prueba DB opcional de catálogo vacío.

## Límites de esta revisión

- Es revisión de un documento `DRAFT` de especificación, no de código: no hay build, prueba corrida ni captura que yo pueda observar hoy — todo lo de "pruebas exigidas" es la condición para un futuro `READY`/cierre, no una evidencia ya producida.
- No decido si los hallazgos H1/H2 son aceptables como riesgo conocido — corresponde a D00 o al dueño de producto, con firma.
- No corrijo `CORE-0.md` ni el código — reporto para que D03 (dueño) cierre los dos huecos de oráculo.
- No evalúo aquí CORE-1..5 ni el resto de M13-CORE; ese dictamen ya existe y sigue vigente.
- `npm run spec:check` no se ejecutó en esta revisión (acción de solo lectura declarada); la revisión D14 previa ya registró que su fallo global es ajeno a M13-CORE (`.viltrum/reviews/D14-revision-M13-CORE-READY-2026-10-04.md:28`).

## Ruta a READY

D03 cierra H1 (fijar texto/lista prohibida exacta para el estado 100%) y H2 (fijar mecanismo de seed vacío para `RepositorioAcademyEnMemoria`) en `CORE-0.md`. Con eso, el subcontrato queda testable de punta a punta y puede pasar a `READY` tras registro D00, sin esperar a D11/CORE-1..5. D12 revisa en paralelo que ningún texto permitido infiera certificación.
