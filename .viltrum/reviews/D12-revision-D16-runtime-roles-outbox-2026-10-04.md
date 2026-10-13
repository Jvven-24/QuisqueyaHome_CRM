# D12 · Revisión independiente de D16 — runtime y separación de roles del outbox (R3)

**Fecha:** 2026-10-04. **Revisor:** D12. **Objeto revisado:** informe D16 (auditoría local de runtime) y, por referencia cruzada obligatoria, D11 (auditoría local de roles/conciliación) en los puntos donde D16 se apoya en D11. No se ejecutó código, consulta ni prueba propia; esta es una revisión de texto.

## 1. Distinción observado / inferido

**Observado y bien delimitado por D16:**
- Puerto 9301 en LISTEN con PID 165748, proceso `node.exe`, correlación de ruta y de proceso padre (PID 37136) — medición directa, método declarado (`Get-NetTCPConnection`), sin exponer línea de comando.
- Ausencia de proceso identificable con módulo outbox del CRM, y ausencia de script/scheduler en `package.json`.
- Lectura de código: `client.ts:22`, `env.ts:20`, `runtime.ts:8` — citas con archivo:línea, verificables.
- Presencia de la clave `DATABASE_URL` en `.env`/`.env.example` sin lectura de valor.

**Inferido, y D16 lo marca correctamente como tal:**
- Que PID 165748 "pueda acreditarse" como la app Next.js: queda en nivel de indicio (puerto+ruta+proceso padre), no de prueba. D16 no afirma identidad confirmada; dice "proceso contiene la ruta" y "desciende de", lo cual es una inferencia razonable pero expresamente no es un health check. Correcto.
- Que el worker comparta `getDb()`/`DATABASE_URL` "si se invoca en el mismo proceso/configuración": D16 marca esto como condicional, no como hecho. Correcto.
- La tabla final del informe reitera "UNKNOWN" en cada fila donde falta medición directa desde el pool real. Esto es la práctica correcta: el informe no convierte indicio en conclusión.

**Observación de rigor (P2):** la fila "¿Corre worker outbox del CRM?" concluye "Estado efectivo de un worker: UNKNOWN / no acreditado" tras una búsqueda negativa (`rg`, revisión de `package.json`, revisión de otros procesos Node). Una ausencia de evidencia por búsqueda estática no es equivalente en fuerza a una medición directa de red/proceso como la hecha para el puerto 9301. El informe no iguala ambos niveles explícitamente, pero convendría que la siguiente versión declarara el método de búsqueda (patrones de `rg` usados, universo de procesos Node inspeccionados) para que un tercero pueda repetirla.

## 2. Identidad real de app/worker

No queda establecida, y D16 lo dice sin ambigüedad: ninguna consulta (`current_user`, `session_user`, `rolsuper`, `rolbypassrls`) se ejecutó desde el pool real de PID 165748 ni desde un worker, porque en el instante auditado no había conexión TCP visible entre ese PID y el puerto 5432. Esto es consistente con D11, que sí obtuvo esos metadatos pero **desde su propia conexión de auditoría** (superusuario `postgres`), no desde el runtime de la app. D16 cita correctamente esa limitación de D11 y no la presenta como si acreditara identidad runtime. Esta cadena de atribución es correcta y es el punto más fuerte del informe.

**Riesgo no resuelto (P1):** sin esta medición, no hay ninguna garantía actual de que la app en ejecución no esté usando ya el rol `postgres` con `rolbypassrls=true`. D16 lo señala como bloqueo, no lo oculta. Pero el informe tampoco propone un método de bajo riesgo para cerrar este UNKNOWN pronto (p. ej. consulta de solo lectura desde un endpoint temporal de diagnóstico, o correlación con `pg_stat_activity` por IP:puerto cliente en el instante en que se sabe que la app está activa). Queda como trabajo pendiente sin dueño ni fecha.

## 3. Plan de separación de roles/grants/RLS

La propuesta (migrador sin runtime; `crm_app` sin BYPASSRLS con permisos mínimos de comando/outbox; `crm_outbox_worker` sin BYPASSRLS con permisos acotados de claim/finalización; `ENABLE`+`FORCE RLS`+políticas `TO role`) es coherente con el hallazgo de D11 (hoy: 0 roles de servicio, 0 políticas, RLS habilitado sin forzar, propietario único `postgres` con grants completos). El plan de activación en cuatro pasos (expandir esquema → migrar app a `crm_app` → lanzar worker dedicado solo tras probar claim/lease fuera de transacción → mantener Twenty desactivado) respeta la secuencia de riesgo creciente y no salta a producción.

**Hallazgos:**
- **P1 — Grants no verificados, solo inferidos del esquema.** D16 advierte explícitamente "comprobar grants reales, no solo esquema Drizzle", lo cual es correcto, pero el plan en sí todavía no fija qué comando/vista se usará para esa verificación (D11 ya usó `information_schema.role_table_grants` y `pg_policies`; el plan de D16 no referencia reutilizar ese método exacto en el ensayo). Dejar esto explícito evita que el ensayo futuro reinvente el método de medición.
- **P1 — Variable de entorno del worker (`CRM_OUTBOX_DATABASE_URL`) se presenta como ejemplo, no como decisión cerrada**, y el propio informe dice correctamente "el nombre definitivo... quedan para D11/D12/D16 al cerrar contrato; no editar ahora". Esto es apropiado para R3, pero significa que el plan de separación aún no es ejecutable sin una decisión previa de nomenclatura — es una dependencia abierta, no un defecto del informe.
- **P2 — El migrador "no debe alimentar ni app ni worker" está declarado como regla, pero no hay mecanismo propuesto para impedir que alguien reutilice esa credencial por error** (p. ej. un lint/check de CI que falle si `DATABASE_URL` de migración aparece en el proceso del servidor). Sugerir esto como ítem de la matriz SQL de D03/D11.
- La exclusión expresa de `client.ts` y de scripts de lanzamiento de la lista de archivos editables en este informe, y la afirmación de que no se tocó ninguno, es correcta y verificable por lo declarado (no se puede confirmar sin diff, pero el informe no reivindica haber hecho cambios de código).

## 4. Rollback

El rollback propuesto es asimétrico y correcto en la dirección que importa: distingue el caso "sin efecto remoto posible" (revertir selección de credencial, mantener esquema y filas, revalidar) del caso "con efecto remoto posible" (no reactivar el worker antiguo que retiene lock durante HTTP; suspender envíos; conciliar con Admin). Prohíbe explícitamente `DROP` de roles/columnas y down migrations destructivas como vía de emergencia. Esto es consistente con el principio de outbox (no perder eventos, no duplicar efectos externos) y con la preocupación de D14 sobre locks durante I/O remoto citada indirectamente.

**Hallazgo (P2):** el rollback no dice explícitamente qué pasa con `crm_app`/`crm_outbox_worker` si la migración de roles a mitad de camino falla (p. ej. se crearon roles y políticas pero la app ya se reconfiguró a medias). El paso 4 ("activación reversible") implica orden seguro, pero no hay un rollback específico para un fallo *entre* pasos 2 y 3 del plan de activación (app ya movida a `crm_app`, worker aún no probado). Pedir que el contrato D03/D11 cierre esto antes de READY.

## 5. Seguridad de secretos

Cumple el estándar exigido: no se imprimieron valores de `DATABASE_URL`, cadenas de conexión, líneas de comando completas ni credenciales; solo se citaron claves de entorno y rutas de archivo:línea de código. D16 reitera correctamente que cualquier prueba futura debe reportar solo identidad/privilegios booleanos y resultados permitido/denegado con datos sintéticos, nunca el DSN. Esto es coherente con D11, que también evitó imprimir la URL y limitó su consulta a agregaciones y catálogos, no filas de negocio.

**Sin hallazgos de seguridad de secretos en este informe.**

## 6. Alcance y mandato

D16 declara correctamente los límites: no se ejecutaron migraciones, escrituras, arranques ni paradas; no se tocó producción/VPS; el informe no es aprobación de la ficha DRAFT ni permiso para activar Twenty. Esto es necesario y está presente. También señala correctamente que este informe no sustituye revisión de D03/D11 sobre la matriz SQL ni el despacho de D00.

---

## Dictamen: **CONDICIONAL**

El informe es internamente consistente, distingue con cuidado lo observado de lo inferido, no expone secretos, y el plan de separación de roles es la dirección correcta y compatible con los hallazgos de D11. No se encontró ningún hallazgo P0 (ninguna afirmación falsa, ningún secreto expuesto, ninguna acción irreversible ejecutada).

Se marca condicional, no aprobado sin reservas, por los hallazgos P1 abiertos:
- **P1-1:** identidad SQL runtime de app y worker sigue sin medición directa; el informe lo admite pero no fija método ni responsable para cerrarlo antes del ensayo en DB temporal.
- **P1-2:** el método de verificación de grants reales (no solo esquema Drizzle) no está especificado como procedimiento repetible, aunque D11 ya mostró el catálogo a usar.
- **P1-3:** la nomenclatura de la variable de entorno del worker es un ejemplo no cerrado; el plan de separación depende de esa decisión y no puede ejecutarse sin ella.

Hallazgos P2 (no bloqueantes, sí a incorporar en el contrato D03/D11/D16):
- Falta especificar el universo/método de búsqueda usado para descartar un worker activo.
- Falta control que impida que la credencial de migrador se reutilice en runtime.
- Falta rollback explícito para un fallo a mitad del plan de activación en cuatro pasos (entre mover app a `crm_app` y probar worker).

## Siguiente evidencia requerida

1. Medición de identidad SQL (`current_user`, `rolsuper`, `rolbypassrls`) obtenida **desde la conexión real** de la app en ejecución (y del worker si se identifica uno), no desde la conexión de auditoría — único paso que puede convertir el UNKNOWN central en observado.
2. Procedimiento escrito y repetible para verificar grants efectivos (`information_schema.role_table_grants`, `pg_policies`, `relforcerowsecurity`) contra los roles `crm_app`/`crm_outbox_worker` una vez creados en DB temporal, antes de aplicarlo a cualquier entorno compartido.
3. Decisión cerrada de nomenclatura y mecanismo de inyección de la variable de conexión del worker, documentada por D03/D11/D16 antes de que I01-A pueda pasar a READY.
4. Rollback explícito para los estados intermedios del plan de activación en cuatro pasos, no solo para los estados inicial y final.

No se declara READY, gate ni ejecución de código/test en esta revisión.
