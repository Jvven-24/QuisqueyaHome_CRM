# D12 — Casos de evaluación

> Casos donde una IA genérica de seguridad falla: aprueba por apariencia, no por evidencia.
> Cada caso: escenario → qué debe detectar/producir D12 → criterio de aprobado.

## Caso 1 — RLS activado pero mal alcanzado (aislamiento falso)

**Escenario:** Un sistema multi-tenant tiene RLS activo en todas las tablas. La política
usa `USING (true)` en la tabla `documentos` porque "se agregará la condición después". El
resto del sistema parece correcto: cabeceras completas, TLS, sin secretos expuestos.

**Qué debe detectar D12:** Que "RLS activo" no es lo mismo que "RLS efectivo". Debe
ejecutar (o exigir) una prueba que se autentique como el tenant A e intente leer un
documento del tenant B directamente contra la base — y debe fallar esa lectura para pasar.
Una IA genérica se conforma con ver `ENABLE ROW LEVEL SECURITY` en el esquema y lo marca
como resuelto sin mirar la condición de la política.

**Criterio de aprobado:** El hallazgo se clasifica P0 (acceso indebido a dato de otro
tenant), no P2. El reporte incluye la política real (`USING (true)`) como evidencia y
exige la prueba de cruce como parte del cierre, no solo la corrección del `USING`.

---

## Caso 2 — Cabecera de seguridad "configurada" que no llega al cliente

**Escenario:** El código del backend incluye `helmet()` (o middleware equivalente) con
`Strict-Transport-Security` y CSP configurados. El proxy inverso (Nginx) delante de la
aplicación reescribe la respuesta y no reenvía esas cabeceras porque no está configurado
para pasarlas.

**Qué debe detectar D12:** Que la evidencia válida es la respuesta HTTP real del sistema
desplegado, no la lectura del código fuente ni de la configuración del framework. Una IA
genérica lee `helmet()` en el código, concluye "cabeceras completas: aprobado" y no hace
una petición real contra el dominio.

**Criterio de aprobado:** D12 exige (o ejecuta) una petición real al dominio en staging o
producción y compara las cabeceras recibidas contra `checklists/hardening.md` sección E.
Si `Strict-Transport-Security` no aparece en la respuesta real, el hallazgo queda abierto
aunque el código lo declare.

---

## Caso 3 — Dato personal sin base legal, disfrazado de "campo de contacto"

**Escenario:** Un formulario de agendamiento pide cédula y fecha de nacimiento "para
verificar identidad", sin que exista ningún flujo posterior que use ese dato ni
consentimiento explícito recolectado. El equipo de producto dice que "siempre se pide eso
en formularios dominicanos".

**Qué debe detectar D12:** Que recolectar un dato personal (documento de identidad)
sin finalidad específica ni base legal documentada exige justificar necesidad y
proporcionalidad y escalar dudas a asesoría legal, incluso si el dato se guarda cifrado
y con RLS correcto. No clasifica automáticamente el documento como categoría legal
sensible ni declara una conclusión jurídica por inferencia. Una IA genérica
sin este mapa se enfoca solo en si el dato está "protegido técnicamente" y no cuestiona si
debía recolectarse.

**Criterio de aprobado:** El hallazgo señala la ausencia de base legal y finalidad, no solo
el estado técnico del dato. Se registra como pregunta abierta hacia el cliente
(`questions.md`) si el equipo no puede justificar la finalidad, y el hallazgo no se cierra
"porque el dato está cifrado" — proporcionalidad y protección técnica son verificaciones
distintas.

---

## Caso 4 — Rate limiting que solo protege un proceso, no el sistema

**Escenario:** El backend implementa rate limiting con un contador en memoria del proceso
Node.js. El sistema corre con dos réplicas detrás de un balanceador de carga.

**Qué debe detectar D12:** Que el control es efectivo solo contra un tipo de atacante (el
que siempre cae en la misma réplica) y no contra un atacante distribuido o simplemente
contra el balanceo normal de tráfico, que ya divide el límite real entre réplicas sin que
nadie lo note. Una IA genérica ve "rate limiting: sí" en el código y lo aprueba sin
preguntar cuántas instancias corren.

**Criterio de aprobado:** El hallazgo identifica la topología (más de una réplica) como la
causa de que el control sea inefectivo, y exige almacén compartido (Redis o equivalente)
como corrección, no un ajuste del número del límite.

---

## Caso 5 — Migración de datos ejecutada como parte de un "hotfix" sin aprobación

**Escenario:** Un desarrollador corrige un bug de producción cambiando directamente datos
en la base de producción con una consulta manual, sin pasar por migración versionada ni
aprobación. El bug queda corregido y nadie lo cuestiona porque "funcionó".

**Qué debe detectar D12:** Que el problema no es si el dato quedó correcto, sino que se
saltó todo el proceso trazable (P4 — nadie aprueba su propio trabajo; auditoría; migración
reversible). Una IA genérica centrada solo en "vulnerabilidades técnicas" no marca esto
como hallazgo de seguridad porque no hay una CVE asociada.

**Criterio de aprobado:** El hallazgo se clasifica como P1 (proceso, no técnico): cambio de
producción sin trazabilidad ni aprobación es en sí mismo un riesgo de integridad y de
repudio (categoría *Repudiation* de STRIDE). Se exige que el cambio se reproduzca como
migración versionada y se documente en `decisions.md` con quién lo autorizó.
