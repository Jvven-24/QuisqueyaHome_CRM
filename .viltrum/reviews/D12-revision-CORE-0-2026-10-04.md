# D12 · Revisión independiente — CORE-0 "Retirar la autocertificación derivada" (M13-academy, C1:M10)

**Fecha:** 2026-10-04. **Perfil:** D12, revisión documental sin herramientas ni ejecución de pruebas. **Entrada:** contrato `M13-CORE-0` (DRAFT, owner D03) y revisión previa D12 sobre M13 completo (hallazgo M13-S5, entre otros). Objeto de este veredicto: el texto del subcontrato, no código ni resultado de ejecución.

## Dictamen: **APROBADO** (contrato documental), con reservas no bloqueantes a verificar en ejecución

El subcontrato cierra correctamente la parte de M13-S5 que le corresponde: elimina el booleano derivado en vez de sustituirlo por `false`/`null`, no reintroduce una certificación implícita, conserva el progreso existente, no toca autenticación/permisos y no abre decisión, constancia, curso ni migración. El alcance está acotado a tres tareas ≤45 min con archivos exactos, corte conjunto y doble revisión independiente (D12/D14) antes de que D00 pueda promoverlo. No encuentro en el texto ninguna vía por la que este lote certifique, decida o deje una huella de aprobación que no exista hoy.

## Hallazgos no bloqueantes (verificar al cerrar, no invalidan el contrato)

| # | Severidad | Observación | Qué pedir al cierre |
|---|---|---|---|
| 1 | P2 | El "radio de impacto" solo busca `isCertified` **en `src/`**. El contrato ya avisa de repetir el inventario y no confiar en cobertura total del índice GitNexus — correcto —, pero no contempla snapshots persistidos fuera de código (outbox, logs, cachés, exports) que puedan haber guardado `isCertified:true` históricamente. | Antes de cerrar CORE-0C, confirmar explícitamente que ningún payload ya persistido queda con un campo huérfano o inconsistente con el nuevo contrato de salida. |
| 2 | P2 | El texto permitido "Certificación pendiente de revisión" evita prometer una solicitud creada, pero la frase por sí sola puede sugerirle a un broker que existe un trámite en curso, cuando la decisión Admin (CORE-1..5) todavía no existe. | D14 debe validar que la frase no se lee como confirmación de un proceso abierto; si hay ambigüedad, usar una redacción sin connotación de trámite ("Contenido completado — certificación no disponible aún"). |
| 3 | P3 | CORE-0C permite degradar la prueba HTTP automatizada a "evidencia externa a código" si el harness no soporta actor/repositorio de prueba sin ampliar archivos. Razonable para no exceder el alcance de archivos permitidos, pero deja un camino de verificación más débil que una prueba repetible. | Exigir que esa evidencia manual quede registrada de forma auditable (respuesta HTTP capturada), no como una afirmación sin soporte. |
| 4 | P3 | Se afirma "no cambia autenticación ni permisos" pero no hay un oráculo dedicado a 401/403 tras el cambio; el oráculo 4 cubre solo el caso de error en UI. | Añadir, aunque sea como check manual, una verificación explícita de que el comportamiento de autenticación de `GET /api/academy` es idéntico antes/después. |

## Fortalezas confirmadas

- Elimina el campo en vez de sustituirlo por `false`/`null`/sustituto, evitando exactamente la ambigüedad booleana que motivó el hallazgo original (un `false` podría confundirse con una decisión negativa de Admin que aún no existe).
- El propio `npm run typecheck` actúa como verificador exhaustivo de consumidores restantes del tipo, mitigando el límite de un inventario manual por búsqueda de texto.
- Preserva los registros de progreso existentes; no migra, no reescribe ni toca almacenamiento de progreso.
- No introduce campo sustituto, insignia, constancia, curso ni decisión Admin — consistente con que CORE-1..5 y el modelo D11 siguen en `DRAFT`.
- El oráculo 5 cierra explícitamente el atajo de "invertir el valor a `false` manteniendo el campo", que habría repetido el defecto original con otra forma.
- Tareas acotadas a archivos exactos, con corte conjunto obligatorio (prohíbe desplegar la compuerta visual sin el backend corregido, o viceversa).
- Exige revisión independiente D12 (seguridad) y D14 (oráculos API/UI) antes de que D00 registre y promueva CORE-0 por separado del resto del núcleo.

## Límites de esta revisión

- Revisión puramente documental: no se ejecutó `typecheck`, `lint`, pruebas, ni se consultó el índice GitNexus; no valida que el inventario de archivos sea completo ni que la implementación resultante cumpla los oráculos.
- No emite juicio sobre CORE-1..5 ni sobre el modelo de decisión Admin de D11; ambos permanecen `DRAFT` y fuera de este veredicto.
- No se marca `READY`, no se aprueba ningún gate ni código. El veredicto cubre solo la solidez del contrato CORE-0 como instrucción de trabajo para D03, pendiente de verificación D14 y registro D00.
