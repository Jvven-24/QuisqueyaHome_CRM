# Revisión D12 — Segundo pase — M13-CORE-0

## Veredicto: **APROBADO**

Los tres hallazgos que bloqueaban el cierre en el dictamen previo están resueltos con evidencia concreta y verificable. CORE-0A, CORE-0B y CORE-0C ahora se entregan juntos, como exige el contrato.

---

### Verificación de los tres puntos pendientes

**1. Captura HTTP 401/403/0%/100% — resuelto**

`route.test.ts` ejecuta el **handler real** (`route.ts` se lee del disco y se transpila sin reescritura manual de su lógica). Lo aislado son solo las fronteras de E/S que no se pueden probar sin infraestructura: extracción de sesión (`requireActor`) y persistencia (`academyRepositorio`). El guardián de autorización que D12 debe vigilar — `requireScope`, de `@/domain/rbac` — **no está mockeado**; es el código de producción el que decide 401/403.

Confirmo:
- El `require` del sandbox lanza `assert.ok` si `route.ts` importa algo no listado en `dependencies`. Esto hace el aislamiento auto-verificable: si el handler real tuviera alguna dependencia adicional no contemplada, el test fallaría en vez de ejecutar una ruta parcial silenciosamente.
- Caso 401 (sin actor) y 403 (actor autenticado sin `academy:view`, `permissions: []`) ambos verifican `Object.hasOwn(body, "resumen") === false`. Esto es exactamente el oráculo #6: el 403 aislado por actor/repositorio pero con la guarda real ejecutada.
- Caso 0% y 100% verifican `resumen` con forma exacta (`totalItems/completedItems/percent`) y `Object.hasOwn(body.resumen, "isCertified") === false`.

Esto cumple el formato que pedí: no es un resumen de una línea, es una prueba automatizada reproducible (`node --test`) con los cuatro casos exigidos.

**2. Inventario de outbox/logs/caché/exportaciones — resuelto**

La evidencia documenta comando (`rg` sobre `outbox`, `db/repos`, rutas de exportación), resultado ("no se encontró ruta que persista o retransmita ese resumen") y verificación cruzada en base local (`outbox`, `outbox_dead`, `external_refs` en 0 filas). El alcance se declara explícitamente limitado a código y base local, sin extrapolar a otros entornos — eso es honestidad de alcance, no un hueco.

**3. Barrido literal — resuelto**

`rg -n -i 'isCertified|Broker Certificado|Acreditado oficialmente' src scripts db` confirma que `isCertified` solo sobrevive en aserciones negativas de las dos suites de prueba, y las dos cadenas de texto no aparecen en ningún archivo. Esto cierra el oráculo #5 fuera de los archivos tocados por el diff.

---

### Punto BAJA del dictamen previo (no bloqueante, ahora mitigado)

El repo de DB (`db/repos/academy.ts`) seguía sin prueba automatizada dedicada. Sigue sin tenerla, pero ya no depende únicamente de eso:
- El cambio en sí es mecánico y simétrico al de `en-memoria.ts` (misma eliminación de dos líneas), verificable por lectura directa del diff.
- La evidencia de servidor Next real (no mockeado) con cuentas demo Admin/Broker/Asistente muestra `resumen` exacto sin `isCertified` a 0% con la ruta de DB real.
- El caso 100% en DB real se verificó solo por UI (dato temporal insertado y eliminado, confirmado `removed=1, remaining=0` y conteos de tabla iguales antes/después), no por inspección del cuerpo JSON crudo.

Esto es un **límite residual, no un bloqueo de contrato**: el contrato no exige `test:db` nueva para este corte, el cambio es trivial y de bajo riesgo, y la combinación lectura-de-diff + verificación end-to-end a 0% + verificación visual a 100% es suficiente para una eliminación de campo de esta naturaleza. Lo señalo para que quede registrado, no para condicionar el cierre.

---

### Lo que ya estaba bien y se mantiene

CORE-0A (tipos y productores) y CORE-0B (UI) no cambiaron respecto del primer pase y siguen sin objeción. El diff no toca `requireScope`/`requireFullScope` ni introduce ningún bypass de autorización.

---

### Conclusión

No quedan hallazgos ALTA ni MEDIA abiertos. El único punto BAJA restante es un límite de cobertura reconocido y de bajo riesgo, no una brecha de seguridad. **CORE-0 queda aprobado desde seguridad y exposición de datos.**
