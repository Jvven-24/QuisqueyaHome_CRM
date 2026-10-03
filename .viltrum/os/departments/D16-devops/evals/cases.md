# D16 — Casos de evaluación

> Casos donde una IA genérica falla porque optimiza por "que despliegue" en vez de
> "que despliegue de forma reversible y auditable".

## Caso 1 — Migración que agrega columna `NOT NULL` sin default

**Escenario:** el equipo pide desplegar una migración que agrega `email_verificado
BOOLEAN NOT NULL` a una tabla con 50,000 filas existentes, junto con el código que la
usa, en un solo release directo a producción.

**Qué debe detectar/producir D16:**
- Señalar que la migración tal como está planteada rompe: las filas existentes no
  tienen valor para una columna `NOT NULL` sin default, y desplegar código y esquema
  juntos no permite revertir el código sin revertir también el esquema.
- Reescribir el plan en expand/contract: (1) agregar la columna con default o nullable,
  (2) backfill, (3) desplegar código que la usa, (4) solo después, en un release
  separado, aplicar `NOT NULL` si hace falta.
- Exigir que D11 confirme la migración probada sobre copia de producción antes de
  ejecutarla.

**Criterio de aprobado:** el runbook de release resultante separa expand de contract en
releases distintos, cada uno reversible por sí solo, y no exige downtime.

Una IA genérica típicamente genera el `ALTER TABLE` directo y lo empaqueta junto con el
código nuevo en un único despliegue, porque "funciona en un `docker compose up`" — sin
considerar que producción ya tiene datos.

---

## Caso 2 — Workflow de GitHub Actions con Action de terceros sin fijar

**Escenario:** un workflow de despliegue usa `uses: some-org/deploy-action@v3` y
`permissions: write-all` a nivel de workflow, con un secreto de producción inyectado
directo en un paso `run: echo $PROD_TOKEN`.

**Qué debe detectar/producir D16:**
- Tres hallazgos distintos, no uno genérico: (1) tag mutable en vez de SHA completo —
  el mantenedor de la Action puede cambiar el código sin que el pin lo refleje; (2)
  permisos de escritura total al `GITHUB_TOKEN` cuando el job solo necesita leer y
  desplegar; (3) el `echo` del secreto lo deja visible en el log de ejecución de GitHub,
  accesible a cualquiera con lectura del repositorio.
- Corrección concreta para cada uno: fijar por SHA completo, declarar `permissions:`
  mínimos en el job, y usar el secreto como variable de entorno del paso sin
  imprimirlo.

**Criterio de aprobado:** los tres hallazgos aparecen clasificados por severidad (el
secreto en log es P0 si ya se ejecutó; P1 si se corrige antes de correr), con la
corrección aplicada al workflow, no solo señalada en prosa.

Una IA genérica suele aprobar el workflow porque "compila y el despliegue funciona",
sin auditar permisos ni el destino del log.

---

## Caso 3 — Cliente pide "solo reinicia el contenedor" para un release con cambio de esquema

**Escenario:** hay un incidente leve en staging; alguien propone "para no complicarnos,
bajamos el contenedor viejo, subimos el nuevo con la migración, y ya" como plan de
release para producción esa misma tarde, sin ensayo de rollback ni de restauración.

**Qué debe detectar/producir D16:**
- Rechazar el plan tal como está: no hay ventana sin caída (down-then-up corta el
  servicio), no hay rollback ensayado, y no hay evidencia de restauración reciente del
  respaldo si la migración sale mal.
- Proponer alternativa mínima viable dentro del mismo día: health check antes de
  enrutar tráfico al contenedor nuevo, rollback ensayado en staging primero (aunque sea
  en 20 minutos, no cero), y confirmación de que existe un respaldo restaurable con
  fecha reciente — si no existe, se ejecuta el respaldo antes del release, no después.
- Si el negocio insiste en saltarse el ensayo por presión de tiempo, el hallazgo se
  registra como riesgo aceptado con firma explícita de quién lo acepta — nunca se
  omite en silencio.

**Criterio de aprobado:** el release final, aunque se ejecute el mismo día, pasa por
health check y tiene un camino de reversión verificado — no solo "asumido porque
Docker es reversible en teoría". Si se acepta el riesgo sin ensayo, queda escrito con
dueño y fecha en `decisions.md`, nunca implícito.

Una IA genérica tiende a aceptar el atajo porque el pedido suena razonable y urgente,
sin exigir la evidencia mínima que este departamento nunca negocia: restauración y
reversión demostradas, no supuestas.
