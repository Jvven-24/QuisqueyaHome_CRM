# D10 · T-E1-1b1 · Consultas reales de Negocios

Productor: Codex / D10. Fecha: 2026-10-13. Ficha: `.viltrum/vre-os/spec/modulos/M03-negocios.md`, READY; §5, CA-02/04/05/11/13/28. Decisión #47. Clasificación: fix CRM/ERP, R3. Nivel: implementación local L3, pendiente de revisión independiente; no promoción de ficha, cierre de issue ni aprobación de gates.

Se entregan las cinco consultas de lectura, su puerto/adaptador y la migración de página/vista/inspector. Los cinco comandos obligatorios terminaron con exit 0. `npm test`: 523/523; `test:db`: 135/135. Mutación EXISTS→JOIN: exit 1 esperado, 134 pasan y el caso de N:M falla por discrepancia de conteos/importes contra control independiente. Revisor asignado por la tarea: Antigravity, seguido por el orquestador; handoff de seguridad D12 y validación D14/D13 pendientes. El productor no aprueba la entrega.

## Archivos tocados

- `src/application/pipeline/puertos.ts`
- `src/application/pipeline/consultas.ts`
- `src/application/pipeline/lectura-en-memoria.ts`
- `src/application/pipeline/consultas.test.ts`
- `src/infrastructure/db/repos/pipeline-lectura.ts`
- `src/infrastructure/contenedor/pipeline.ts`
- `src/app/(crm)/negocios/page.tsx`
- `src/app/(crm)/negocios/vista.tsx`
- `src/app/(crm)/negocios/inspector.tsx`
- `src/infrastructure/db/negocios.db.test.ts`
- `scripts/test-db/negocios.ts`
- `scripts/test-db/run.mjs`
- `scripts/test-db/loader.mjs`
- `scripts/test-db/fixture.ts`
- `scripts/test-db/shapes.ts`
- `scripts/test-db/guards.mjs`

Se añaden también este informe y los siete logs `D10-b1-*.log` en esta carpeta. No se modificaron esquema, migraciones, seed comercial, autenticación, rutas de escritura, constitución, ficha/índice/roadmap ni doctrina instalada. No git, commit, push, dev, build ni VPS. Sin inspección directa de `.env*`: el comando solicitado `test:db` utiliza el cargador de configuración existente del harness, sin imprimir credenciales. Commit y aislamiento de checkout: no certificados por esta sesión sin git; se trabajó en la ruta indicada por el mandato humano.

## Contratos y decisiones de implementación

- `consultarTableroNegocios`, `consultarListaNegocios`, `consultarCatalogosNegocios`, `consultarFichaNegocio` y `resumirNegocios` reciben el puerto de lectura y actor. Aplicación no importa Next, Drizzle ni Supabase. El SQL vive en `pipeline-lectura.ts`, expuesto por `pipelineParaLectura()`.
- Alcance efectivo siempre desde `scopeFor(actor, "deals", "view")`; `visibleRows` incluye borrado lógico y pertenencia. `none` no llama al puerto; ficha ajena/inexistente produce el mismo `NotFoundError`, convertido a `notFound()` en página.
- Lista: filtros proyecto/broker/etapa/resultado/moneda/monto/fecha. Monto en centavos enteros seguros, identificadores positivos dentro de int PostgreSQL, rangos ordenados, fechas reales y forma estricta con Zod. Asistente no puede filtrar/ordenar por importes para evitar inferencia financiera.
- Convención técnica provisional para S-305/S-309: fecha por defecto = creación, con selección explícita de cierre real o cierre esperado. Días inclusivos en America/Santo_Domingo. No se usa creación como si fuera cierre. Estos valores son configuración de aplicación, no aceptación comercial nueva.
- Orden permitido: creación, monto o ID, ascendente/descendente; ID desempata en la misma dirección. Nulos de monto se ordenan con -1 y el cursor conserva ese marcador. La ordenación de timestamp trunca a milisegundos para concordar con Date/DTO y evitar saltos por microsegundos de PostgreSQL. Cursor tipado/validado y ligado al orden, sin autorización implícita. Cada página vuelve a autorizar; no es un token de acceso.
- Límites técnicos centralizados: lista 50 por defecto, máximo 200; tablero máximo 200 con cursor visible. Totales calculados sobre el conjunto filtrado completo, sin el cursor. No caché compartida ni proveedor externo.
- Proyecto usa EXISTS correlacionado; no multiplica la relación N:M ni ignora proyectos alternativos. Asociaciones se leen únicamente para IDs seleccionados y con alcance de proyecto. Primaria se resuelve de forma determinista por ID de asociación. Disponible para asociar sigue el alcance de proyectos.
- DTO por rol antes del SELECT y whitelist adicional en aplicación: broker conserva monto comercial; no selecciona ni recibe precio real, tasa/comisión de terceros o reparto. Asistente no selecciona ni recibe importes. Admin obtiene precio real/comisión con sus permisos efectivos; precio real respeta el alcance sobre la unidad. No se duplican precios en deals. Los proyectos disponibles tienen solamente ID/nombre/código de unidad.
- Resumen por etapa Y divisa; jamás se agregan USD y DOP. Importes fuera del rango seguro se rechazan. Vista usa estos totales, filtros por ID en URL/servidor y catálogos reales. Se conserva el diseño existente, con control de siguiente página. Formulario broker no incluye campo ni payload de comisión.
- Motivos activos más motivos históricos referenciados por negocios visibles. El selector de nueva pérdida solo ofrece activos; la ficha puede explicar el motivo histórico. Catálogo de etapas conserva nombre/posición/kind/probabilidad de la BD.
- El historial de auditoría preexistente puede contener filas financieras completas: no se envía al broker/asistente desde esta página. Una futura lectura de seguimiento saneada corresponde a otra tarea; no se afirma CA-14 completo.

## Evidencia de aceptación

| Criterio | Evidencia |
|---|---|
| CA-02 / catálogos reales | `pipeline-lectura.ts:137`, tests de catálogo en `scripts/test-db/negocios.ts`; catálogo no fijo |
| CA-04 / capas | `page.tsx:1`, `consultas.ts:1`, fábrica de contenedor; guardas de arquitectura en los 523 tests |
| CA-05 / filtros, own/all/none, N:M y divisas | siete tests unitarios y cinco casos DB nuevos; consulta SQL de control usa IN, no reutiliza predicados del adaptador |
| CA-11 / proyección de lectura | `consultas.ts:31`, whitelist, `pipeline-lectura.ts:30`; log SQL sin parámetros verifica ausencia de columnas/tablas restringidas del broker y de importes del asistente; centinelas en memoria y persistidos con rollback |
| CA-13 / actor autenticado | página requiere actor/permiso antes de datos; no se crea ruta pública ni rol cliente |
| CA-28 / consultas | Zod estricto, rangos/fechas/moneda/IDs/cursor; ID ajeno 404 y none sin consultas. No se acredita el cumplimiento de escrituras preexistentes |

El seed canónico del harness es de **176** negocios (`scripts/seed/catalog.ts:5`), mientras desarrollo tiene **184** según los conteos read-only del runner. Se conserva el generador. El test añade **8** negocios sintéticos únicamente dentro de una transacción temporal con rollback y comprueba exactamente **184**; dos intereses por proyecto/unidades hacen observable la multiplicación N:M. Se comparan todos los montos/conteos del resumen y de todas las páginas de lista con SQL de control independiente, por etapa/divisa, sobre seed y sobre ese conjunto de 184.

El runner acreditó loopback:5432, base temporal, migraciones/seed aislados, eliminación del destino temporal y los mismos conteos en todas las tablas public de desarrollo antes/después, tanto en corrida normal como mutación.

## Mutación requerida

Comando: `npm run test:db -- --mutation=negocios-join` (PowerShell: `npm.cmd`). El loader cambia en memoria el sitio único `PROJECT_FILTER_MODE` de EXISTS a JOIN para listado/resumen. No reescribe el adaptador en disco. Guarda adicional: `npm run test:db:guards`, 4/4, verifica sitio único y conservación de visibleRows.

Resultado observado: falla **solo** `DB negocios 184 negocios (176 seed + 8 sintéticos rollback): N:M, USD/DOP y bordes inclusivos`, con `resumen por etapa/divisa coincide con control independiente`. Los grupos inflados muestran, entre otros, conteo 8 en vez de 4 y 9 en vez de 5, con montos también inflados. Exit 1 deliberado; no es un fallo de la versión entregada. Salida completa: `D10-b1-mutation.log`.

## Revisión interna de seguridad y límites

Controles correctos: permiso de página previo a lectura (`page.tsx:19`), visibleRows en listado/resumen/ficha/intereses, ID directo con LIMIT 1 (`pipeline-lectura.ts:125`), campos sensibles fuera de SELECT no autorizado (`pipeline-lectura.ts:30`), whitelist por rol (`consultas.ts:40`), ningún SELECT global de asociaciones para filtrar en cliente. Consultas parametrizadas, sin SQL dinámico desde texto de usuario. Sin esquema/rutas nuevas que requieran RLS o requireScope adicionales, sin credenciales ni service_role en cliente, sin cambios de entorno. Guardas existentes permanecen intactas y verdes.

**Hallazgo residual preexistente, fuera de los archivos de escritura permitidos:** `src/app/api/pipeline/[id]/route.ts:56` devuelve `Response.json({ ok: true, negocio })` con el objeto persistido completo; su schema admite `commissionBasisPoints` (`:24`, asignación `:51`). Escenario: broker autorizado edita el monto propio y la respuesta puede incluir configuración de comisión; además puede intentar enviar una tasa directamente. Esta tarea sanea SELECT/DTO/RSC de las nuevas lecturas y retira ese input de su formulario, pero **no certifica CA-11 para PATCH** ni sustituye autorización de campo en servidor. D12/D00 deben despachar la corrección de escritura. No se amplió el alcance hacia rutas/casos de uso de mutación.

Sin verificar: recorrido visual/red/RSC real y capturas responsive. El puente del navegador integrado no estaba disponible; la alternativa Edge abrió la URL autorizada pero `http://localhost:9301/negocios` devolvió `net::ERR_CONNECTION_REFUSED`. No se inició servidor por la prohibición explícita. Tampoco build, producción, SLA/p95 con presupuesto aceptado, aceptación comercial de límites, revisión Antigravity/D12/D14/D13 ni integración/commit. C1/gates se conservan bajo sus dueños; no se autoaprueban.

Lección interdepartamental nueva: no aplica modificación del registry global en este tramo acotado. El defecto de composición del predicado opcional `all` detectado durante implementación se corrigió antes del handoff y queda cubierto por el caso DB admin; N:M queda cubierto por control independiente y mutación. Son garantías del módulo entregadas a D11/D12/D14 mediante este informe, no una aprobación de política global.

Referencias reutilizadas: README de aplicación y lectura dashboard; skill local viltrum-backend y controles de Supabase. Documentación oficial consultada: https://orm.drizzle.team/docs/operators . El índice markdown de changelog de Supabase no pudo recuperarse por el navegador web (content-type); no se añadió ni actualizó ninguna integración, paquete o feature de Supabase.

## Salidas reales de los cinco comandos

Se pega la salida completa de las corridas finales. Los logs adyacentes conservan la misma salida, sin datos secretos.

### `npm run typecheck` — exit 0

```text

> quisqueya-home-crm@0.1.0 typecheck
> tsc --noEmit
```

### `npm run lint` — exit 0

```text

> quisqueya-home-crm@0.1.0 lint
> eslint .
```

### `npm test` — exit 0

```text

> quisqueya-home-crm@0.1.0 test
> node --test "src/**/*.test.ts"

✔ Inicio y Reportes: guarda anti-hardcode lee las dos vistas y los dos repositorios (60.9329ms)
✔ guarda anti-hardcode: mutación de cada fuente rechazada, incluidos ceros y arrays primitivos (130.3822ms)
✔ formato USD: utiliza centavos y distingue un cero real (2.7242ms)
✔ ChartCard aislado: estado loading (15.279ms)
✔ ChartCard aislado: estado empty (1.5146ms)
✔ ChartCard aislado: estado error (1.1361ms)
✔ ChartCard aislado: estado offline (2.0853ms)
✔ ChartCard aislado: estado success (1.2003ms)
✔ ChartCard aislado: estado permission (1.0047ms)
✔ GET Academy: 401 anónimo y 403 sin academy:view no filtran resumen (237.0609ms)
✔ GET Academy: 0% y 100% solo publican conteos y porcentaje (36.2068ms)
✔ upsert de meta de broker: el set solo toca target_* y updated_by, nunca achieved_* (10.8169ms)
✔ upsert de meta de la compañía: mismo set, conflicto por el índice parcial de broker_id nulo (5.0044ms)
✔ upsert de meta de broker: el set sí escribe target_deals, target_amount_cents y updated_by (6.8394ms)
✔ upsert de meta de la compañía: el set sí escribe target_* y updated_by (0.942ms)
✔ adaptador real de metas: ningún achieved_* en el código, dos upserts y el targetWhere de la compañía (5.5571ms)
✔ adaptador real de metas: lo que escribe en el conflicto es target_* y updated_by (1.1514ms)
✔ adaptador real de pipeline (la otra mitad): el set de incrementarMetaAlcanzada solo escribe achieved_* y updated_by, nunca target_* (1.5201ms)
✔ Academy: listar contenidos devuelve los módulos iniciales con 0% de progreso (5.7502ms)
✔ Academy: filtrar contenidos por categoría (0.406ms)
✔ Academy: completar un video actualiza el estado y la fecha de finalización (0.9708ms)
✔ Academy: marcar pasos de un checklist recalcula el porcentaje del módulo (1.0106ms)
✔ Academy: completar todos los contenidos solo indica progreso educativo (0.5829ms)
✔ Academy: un catálogo vacío tiene 0% y no expone certificación (2.1893ms)
✔ crear: inserta, audita y actualiza la próxima acción del negocio (5.7085ms)
✔ crear: una actividad completada no reemplaza la próxima acción (0.5313ms)
✔ crear: un broker no puede sobrescribir la próxima acción de un negocio fuera de alcance (1.1718ms)
✔ editar: null borra un campo y ausencia lo conserva (1.2727ms)
✔ editar: completar fija completedAt y reabrir la limpia (0.7652ms)
✔ exportar ICS: respeta alcance y rango de lunes a sábado exclusivo (13.3784ms)
✔ borrar: marca la fila y audita; fuera de alcance devuelve NotFoundError (0.8567ms)
✔ procesarNotaDeVozLead: procesa texto directo y propone HITL (13.5401ms)
✔ procesarNotaDeVozLead: delega audio al proveedor de transcripción (1.9278ms)
✔ asignar proyectos libres: se asignan y cada uno se audita con 'asignar' (9.8436ms)
✔ desasignar: lo que ya era del broker y no se pide, se suelta (0.762ms)
✔ asignar y soltar a la vez: primero las asignadas, luego las soltadas (0.6431ms)
✔ sin cambios reales: no escribe ni audita nada y responde lista vacía (0.4304ms)
✔ lista vacía suelta todo lo que tenía el broker (0.6421ms)
✔ reasignar un proyecto de otro broker lo toma (alcance all) (0.4242ms)
✔ un proyecto inactivo asignado hoy NO se desasigna solo (universo activo) (0.557ms)
✔ alcance distinto de all: 403 con el mensaje literal y nada escrito (1.6014ms)
✔ broker inexistente, inactivo o borrado: NotFoundError con el mensaje literal (1.0947ms)
✔ un proyecto que no existe, está borrado o inactivo: NotFoundError y no se asigna ninguno (1.4041ms)
✔ un fallo dentro de la transacción deshace las asignaciones y la auditoría (0.7498ms)
✔ alta en motivos-perdida: slug a partir del nombre, posición 0 y auditoría de loss_reason (5.1717ms)
✔ edición en motivos-perdida: solo las claves presentes, con antes/después y auditoría de loss_reason (1.0586ms)
✔ edición en motivos-perdida: una entrada inexistente da NotFoundError y no audita (1.3675ms)
✔ alta en canales: slug a partir del nombre, posición 0 y auditoría de lead_source (0.351ms)
✔ edición en canales: solo las claves presentes, con antes/después y auditoría de lead_source (0.3557ms)
✔ edición en canales: una entrada inexistente da NotFoundError y no audita (0.3462ms)
✔ el id de un tipo no se encuentra en el otro (0.4948ms)
✔ slug repetido: se añade el sufijo con el número de coincidencias + 1 (0.5426ms)
✔ alta con nombre sin letras ni dígitos usa el slug 'elemento'; con posición la respeta (0.5092ms)
✔ un fallo dentro de la transacción no deja fila ni auditoría (1.025ms)
✔ esTipoCatalogo: solo las dos claves; un tipo desconocido (o heredado de Object) no pasa (0.3547ms)
✔ aprobar una pendiente: estado, aprobador y fecha, con su auditoría (8.0874ms)
✔ pagar una aprobada: estado y fecha de pago, sin tocar el aprobador (1.7895ms)
✔ anular una pendiente y una aprobada (1.1122ms)
✔ cambiar el reparto de una pendiente recalcula montos y deja el total (0.9624ms)
✔ transición inválida pending → paid: 409 con el mensaje del dominio y nada escrito (12.1932ms)
✔ transición inválida approved → approved: 409 con el mensaje del dominio y nada escrito (0.5897ms)
✔ transición inválida paid → void: 409 con el mensaje del dominio y nada escrito (0.3281ms)
✔ transición inválida paid → approved: 409 con el mensaje del dominio y nada escrito (2.0596ms)
✔ transición inválida void → approved: 409 con el mensaje del dominio y nada escrito (0.5336ms)
✔ transición inválida void → paid: 409 con el mensaje del dominio y nada escrito (0.6404ms)
✔ el reparto de una comisión no pendiente se rechaza con el mensaje literal (0.6655ms)
✔ una comisión inexistente es NotFoundError (0.5225ms)
✔ la comisión de un negocio borrado responde NotFoundError y no se escribe nada (0.4148ms)
✔ una comisión ajena con alcance own es NotFoundError; la propia se edita (0.6655ms)
✔ una comisión sin broker solo la alcanza `all` (0.36ms)
✔ si al bloquear el estado ya cambió (otra petición ganó), la transición se decide con el estado REAL (0.5184ms)
✔ el reparto también se decide con el estado real tras el bloqueo (0.387ms)
✔ un fallo del repositorio al escribir no deja ni cambio ni auditoría (0.4538ms)
✔ el CSV lleva el encabezado y el orden de columnas exactos (1.076ms)
✔ sin proyecto, broker ni fecha: vacío, 'Sin asignar' y vacío (0.3273ms)
✔ el CSV de cero filas es solo el encabezado con BOM (0.2291ms)
✔ el nombre de archivo lleva el periodo (AAAA-MM) cuando hay filtro (0.3505ms)
✔ el alcance filtra: un broker solo exporta lo suyo; all exporta todo (0.4565ms)
✔ el caso de uso pasa actor, alcance y filtros a la consulta tal cual (0.3282ms)
✔ un nombre que empieza como fórmula sale neutralizado (domain/csv.ts) (0.3774ms)
✔ el adaptador real bloquea SOLO la fila de commissions: .for("update", { of: commissions }) (1.4816ms)
✔ auditoría en memoria: registrar deja rastro del actor, la acción y la entidad (3.8864ms)
✔ auditoría en memoria: acepta un registro sin antes ni despues (0.406ms)
✔ auditoría en memoria: los registros múltiples conservan el orden (0.4127ms)
✔ almacenamiento en memoria: urlsFirmadas devuelve una url por ruta, en el mismo orden (1.1278ms)
✔ almacenamiento en memoria: una ruta desconocida da null (0.4476ms)
✔ almacenamiento en memoria: subir sobre una ruta ocupada lanza ConflictError con el nombre visible (1.2167ms)
✔ almacenamiento en memoria: borrar quita el objeto y no lanza con rutas inexistentes (0.4787ms)
✔ almacenamiento en memoria: urlsFirmadas([]) devuelve [] (0.3033ms)
✔ admin de Auth en memoria: invitar devuelve un id no vacío o null (0.5617ms)
✔ admin de Auth en memoria: el correo invitado queda registrado (0.6686ms)
✔ unidad de trabajo en memoria: el callback recibe la misma identidad de repos (0.6475ms)
✔ unidad de trabajo en memoria: el valor devuelto por fn llega al llamante (0.4146ms)
✔ unidad de trabajo en memoria: si fn lanza, el error se propaga tal cual y no queda nada escrito (0.5235ms)
✔ almacenamiento en memoria: fallarAlSubirCon fuerza el motivo en el mensaje (0.5218ms)
✔ almacenamiento en memoria: ruta ocupada usa el motivo `El objeto ya existe.` (0.6499ms)
✔ almacenamiento en memoria: urlsFirmadas lleva la ruta y la vida en la url (0.3383ms)
✔ almacenamiento en memoria: fallarAlFirmarCon lanza ConflictError (0.3089ms)
✔ admin de Auth en memoria: numera los ids de usuario (0.1781ms)
✔ admin de Auth en memoria: fallarCon lanza ConflictError y no registra el correo (0.3156ms)
✔ admin de Auth en memoria: sinIdDeUsuario devuelve null pero registra el correo (0.4072ms)
✔ auditoría en memoria: guarda actor, antes y después (0.3595ms)
✔ unidad de trabajo en memoria: cuenta confirmadas y revertidas (0.4365ms)
✔ unidad de trabajo en memoria: restaura todos los reversibles si fn lanza (0.7463ms)
✔ crearPlantillaMensaje: extrae variables automáticamente y guarda (4.6361ms)
✔ crearPlantillaMensaje: rechaza nombre o cuerpo vacío (1.3163ms)
✔ prepararYDespacharMensaje: interpola variables y despacha por el canal (1.4807ms)
✔ actualizarPlantillaMensaje: actualiza y recalcula variables al cambiar el cuerpo (0.7521ms)
✔ crear: asigna responsable y autoría al actor y audita con la fila completa (4.3888ms)
✔ crear con teléfono duplicado sin crearIgual: ConflictError con candidatos, sin crear ni auditar (2.0843ms)
✔ F04 contactos: advertencia global y candidatos visibles con own, teléfono (0.7254ms)
✔ F04 contactos: advertencia global y candidatos visibles con own, correo (0.3429ms)
✔ F04 contactos: advertencia global y candidatos visibles con team, teléfono (0.3937ms)
✔ F04 contactos: advertencia global y candidatos visibles con team, correo (0.342ms)
✔ F04 contactos: advertencia global y candidatos visibles con none, teléfono (0.3422ms)
✔ F04 contactos: advertencia global y candidatos visibles con none, correo (0.4434ms)
✔ F04 contactos: advertencia global y candidatos visibles con all, teléfono (0.5566ms)
✔ F04 contactos: advertencia global y candidatos visibles con all, correo (0.6608ms)
✔ F04 contactos: candidato exclusivamente ajeno mantiene advertencia sin PII y permite crearIgual (0.7606ms)
✔ F04 contactos: la consulta identificable de duplicados aplica visibleRows en SQL (1.4117ms)
✔ crear con correo duplicado sin crearIgual: ConflictError, sin crear ni auditar (0.4551ms)
✔ crear con duplicado y crearIgual: crea (0.3808ms)
✔ crear sin teléfono ni correo: no consulta duplicados y crea (0.4286ms)
✔ crear normaliza el teléfono a E.164 y conserva lo que escribió el usuario (0.3826ms)
✔ editar: cambia solo los campos presentes y audita antes y después (0.9926ms)
✔ editar con phone null borra phone y phoneDisplay; sin la clave los deja igual (0.4768ms)
✔ editar con brokerId y alcance own: ForbiddenError y no escribe nada (0.6725ms)
✔ editar con brokerId y alcance all: reasigna (0.3084ms)
✔ editar un contacto fuera del alcance: NotFoundError y no escribe (0.4043ms)
✔ borrar: escribe deletedAt, conserva la fila, audita eliminar y deja de verse (0.5583ms)
✔ borrar un id inexistente o fuera de alcance: NotFoundError (0.3762ms)
✔ un fallo dentro de la transacción no deja fila ni auditoría (0.6251ms)
✔ Inicio: ceros, agenda vacía y ausencia de meta/nivel no generan muestras (77.4655ms)
✔ Inicio: permisos por recurso y alcance intersectan incluso si el rol se llama admin (2.7476ms)
✔ Inicio: no oculta el fallo de base de datos (1.736ms)
✔ Inicio: nombre, agenda y progreso viajan desde el puerto sin cambiar cifras (1.5272ms)
✔ Inicio: límites del mes, día y semana son locales, independientes de TZ del proceso (0.752ms)
✔ renombrar: cambia el nombre, deja lo demás y audita con antes/después (3.869ms)
✔ defaultProbability: null la borra; ausente la deja (2.2374ms)
✔ posición y activa se editan (0.4576ms)
✔ una etapa inexistente da NotFoundError y no audita (1.1729ms)
✔ kind y slug en la entrada NO cambian la fila guardada (0.8612ms)
✔ el tipo CambiosEtapa no admite kind ni slug (ni a mano) (0.4823ms)
✔ el adaptador real arma el set de la etapa sin nombrar kind ni slug (1.5824ms)
✔ alta: crea contacto y lead, sugiere el broker de sugerirBroker y audita las dos filas con actor (7.1112ms)
✔ alta con contactId existente: no crea contacto y solo audita el lead (0.6772ms)
✔ alta con contactId que no existe o está borrado: NotFoundError y nada escrito (1.4736ms)
✔ alta con teléfono duplicado: ConflictError con candidatos; con crearIgual crea (1.0681ms)
✔ F04 leads: candidatos de contacto respetan contacts:view own, teléfono (0.729ms)
✔ F04 leads: candidatos de contacto respetan contacts:view own, correo (0.3638ms)
✔ F04 leads: candidatos de contacto respetan contacts:view team, teléfono (0.3439ms)
✔ F04 leads: candidatos de contacto respetan contacts:view team, correo (0.4367ms)
✔ F04 leads: candidatos de contacto respetan contacts:view none, teléfono (0.4292ms)
✔ F04 leads: candidatos de contacto respetan contacts:view none, correo (0.5531ms)
✔ F04 leads: candidatos de contacto respetan contacts:view all, teléfono (0.3304ms)
✔ F04 leads: candidatos de contacto respetan contacts:view all, correo (0.3897ms)
✔ F04 leads: sin contacts:view, duplicado ajeno solo avisa y crearIgual conserva alta (0.7269ms)
✔ F04 leads: la consulta identificable de duplicados aplica visibleRows en SQL (1.422ms)
✔ alta sin contactId ni nombre: ValidationError (protege al caso de uso de una entrada sin Zod) (0.6477ms)
✔ alta: un fallo dentro de la transacción no deja contacto, lead ni auditoría (0.7714ms)
✔ asignar: escribe brokerId y audita asignar con antes y después (1.2424ms)
✔ asignar a quien no es un broker activo: ValidationError literal y nada escrito (0.4933ms)
✔ asignar: el broker inválido gana al lead inexistente (se valida antes de leer el lead) (0.3855ms)
✔ asignar un lead fuera del alcance (o borrado): NotFoundError (0.5742ms)
✔ asignar un lead PROPIO con alcance own funciona (H16: deliberado, comportamiento actual) (0.4049ms)
✔ descartar: marca discarded con el motivo y audita descartar (0.8543ms)
✔ descartar: guardas de estado con sus mensajes literales (0.5654ms)
✔ descartar un lead inexistente, borrado o fuera del alcance: NotFoundError (0.605ms)
✔ F05: repetir sin teléfono ni correo no duplica contactos ni auditoría (2.366ms)
✔ F05: entregas concurrentes de la misma clave ejecutan todos los efectos una vez (1.4795ms)
✔ F05: la reserva SQL y su recibo usan el mismo ejecutor transaccional (1.1438ms)
✔ F05: misma clave con payload diferente devuelve conflicto sin efectos (2.4926ms)
✔ F05: el respaldo del upsert excluye filas borradas (0.7014ms)
✔ webhook: la primera entrega crea contacto y lead, con dos filas de auditoría SIN actor, y responde creado (0.7574ms)
✔ webhook repetido con el mismo externalId: no duplica, devuelve el existente con creado false y NO audita (0.6634ms)
✔ F05: clave histórica sin recibo requiere reconciliación incluso tras borrado (0.6107ms)
✔ F05: el recibo conserva respuesta y clave tras editar o borrar el lead (0.8004ms)
✔ F05: rollback después de escribir el recibo permite reintento completo (0.9113ms)
✔ webhook con teléfono o correo de un contacto existente: lo reutiliza y no crea otro (0.567ms)
✔ webhook sin teléfono ni correo: crea un contacto nuevo (0.3953ms)
✔ webhook: un fallo a mitad (al auditar el lead) no deja contacto, lead ni auditoría (0.8882ms)
✔ la idempotencia del webhook sigue siendo un upsert atómico, con el predicado del índice parcial (1.1313ms)
✔ F06: dos conversiones intercaladas producen un negocio y un conflicto (4.5138ms)
✔ F06: el adaptador bloquea la fila antes de decidir la conversión (1.5526ms)
✔ convertir: crea el negocio en la primera etapa abierta, marca el lead convertido y audita (3.7571ms)
✔ convertir un lead sin responsable ni tipo de operación: el negocio queda con quien convierte y en venta (0.6029ms)
✔ convertir: guardas de estado con sus mensajes literales (1.5793ms)
✔ convertir sin etapa inicial en el embudo: ConflictError y nada escrito (0.6301ms)
✔ convertir un lead inexistente, borrado o fuera del alcance: NotFoundError (0.8163ms)
✔ convertir un lead propio con alcance own funciona (0.5344ms)
✔ un fallo a mitad de la conversión no deja negocio, lead convertido ni auditoría (4.0906ms)
✔ fijar la meta de un broker crea la fila y la audita como 'crear' (4.9333ms)
✔ fijar la meta de la compañía (brokerId nulo) no pide perfil de broker (0.4943ms)
✔ fijar la meta NO toca achieved_*: si ya había valores, siguen igual (0.7344ms)
✔ fijar dos veces el mismo periodo actualiza en vez de duplicar, y la segunda se audita como 'editar' (0.4834ms)
✔ la meta del broker y la de la compañía del mismo periodo son filas distintas (0.5957ms)
✔ sin targetAmountCents en la edición, el monto que ya había se conserva (0.3863ms)
✔ un broker sin perfil: NotFoundError con el mensaje literal y nada escrito (1.2322ms)
✔ alcance own: la propia meta sí; la de otro broker y la de la compañía, 403 con el mensaje literal (0.8797ms)
✔ un fallo dentro de la transacción no deja meta ni auditoría (0.9391ms)
✔ restaurar contact: quita deletedAt, audita con la entidad correcta y solo escribe deletedAt (5.6061ms)
✔ restaurar lead: quita deletedAt, audita con la entidad correcta y solo escribe deletedAt (0.5044ms)
✔ restaurar deal: quita deletedAt, audita con la entidad correcta y solo escribe deletedAt (1.9375ms)
✔ restaurar project: quita deletedAt, audita con la entidad correcta y solo escribe deletedAt (0.3681ms)
✔ restaurar unit: quita deletedAt, audita con la entidad correcta y solo escribe deletedAt (0.49ms)
✔ restaurar user: quita deletedAt, audita con la entidad correcta y solo escribe deletedAt (0.3629ms)
✔ restaurar algo que no está borrado da NotFoundError y no audita (1.5719ms)
✔ restaurar algo inexistente da NotFoundError (0.5806ms)
✔ una fila sin columna deletedAt da NotFoundError (0.5712ms)
✔ el mismo id en otra entidad no cuenta (0.6686ms)
✔ un fallo dentro de la transacción deja la fila borrada y sin auditoría (0.8272ms)
✔ cambio simple: escribe el historial y audita cambiar_etapa con antes y despues (6.465ms)
✔ cambio a una etapa con requisito sin cumplir: ConflictError de transicion-etapa y nada escrito (1.5711ms)
✔ presentación exige una próxima acción vigente: pendiente, con responsable y fecha (4.1402ms)
✔ un negocio ya cerrado no cambia de etapa (0.9172ms)
✔ pérdida con motivo: audita marcar_perdido y guarda lossReasonId y lossComment (0.9106ms)
✔ pérdida sin comentario guarda lossComment en null (2.081ms)
✔ pérdida sin motivo: el ConflictError de transicion-etapa y nada escrito (0.7689ms)
✔ negocio de otro broker con alcance own: NotFoundError, igual que uno inexistente (1.0607ms)
✔ con alcance all un administrador mueve el negocio de otro broker (0.7442ms)
✔ negocio en la papelera: NotFoundError (0.6643ms)
✔ etapa destino inexistente o inactiva: NotFoundError con su mensaje (0.7722ms)
✔ etapa actual que ya no existe en el embudo: ConflictError (0.4918ms)
✔ editar: null borra el campo, ausente lo deja, y audita editar con antes y despues (1.2443ms)
✔ editar un negocio cerrado: ConflictError y nada escrito (0.5001ms)
✔ editar un negocio ajeno, borrado o inexistente: NotFoundError (0.6532ms)
✔ asociar: crea la propiedad, desmarca la principal anterior y audita crear deal_property (1.8561ms)
✔ asociar sin isPrimary no toca la principal existente (0.4904ms)
✔ asociar un proyecto fuera del alcance sobre projects: NotFoundError con su mensaje (0.567ms)
✔ asociar una unidad de otro proyecto: NotFoundError con su mensaje y nada escrito (0.4384ms)
✔ asociar a un negocio cerrado: ConflictError (0.5292ms)
✔ marcar principal: desmarca las demás y audita editar con antes y despues (0.746ms)
✔ marcar o quitar una propiedad de otro negocio: NotFoundError (0.8071ms)
✔ quitar: borra la propiedad y audita eliminar solo con antes (0.47ms)
✔ quitar en un negocio cerrado: ConflictError y la propiedad sigue (0.3188ms)
✔ cierre completo: ocurren los ocho pasos, en una sola unidad de trabajo (76.3722ms)
✔ cierre sin monto en el body usa el monto que ya tenía el negocio (1.4336ms)
✔ cierre de un alquiler deja la unidad reservada, no vendida (1.4747ms)
✔ cierre sin unidad principal resuelta: ConflictError de transicion-etapa y nada escrito (1.9473ms)
✔ dos cierres del mismo periodo SUMAN en la misma fila de meta, no crean otra (3.2047ms)
✔ una meta que ya existe para el periodo se suma, sin tocar su target (1.9858ms)
✔ el perfil se RECALCULA con el total ganado del año, no se incrementa (3.853ms)
✔ cierre de un negocio cuyo broker no tiene perfil: no falla y no recalcula nada (14.5463ms)
✔ cierre de un negocio sin responsable: solo incrementa la meta de la compañía (1.3988ms)
✔ cierre sin commissionBasisPoints: ConflictError con el mensaje exacto y nada escrito (1.0794ms)
✔ defensa 2: si el bloqueo revela que la etapa ya no es open, ConflictError del doble cierre y nada escrito (0.8116ms)
✔ defensa 2 también frente a una pérdida que ganó la carrera (1.4207ms)
✔ cerrarNegocioGanado directo: un negocio que no existe detrás del bloqueo es NotFoundError (0.5298ms)
✔ un fallo a mitad del cierre no deja nada escrito (2.7324ms)
✔ el adaptador real bloquea la fila del negocio: bloquearNegocio usa .for("update") (1.5097ms)
✔ el upsert de la meta de compañía conserva el targetWhere de su índice parcial (0.9413ms)
✔ el recálculo anual conserva la zona horaria de Santo Domingo (0.7187ms)
✔ negocios: own/all/team/none y papelera; ID ajeno y none son 404 (105.3327ms)
✔ negocios: none no llama al puerto ni lee catálogos (2.9064ms)
✔ negocios: filtros combinados, proyecto alternativo y N:M no inflan ni mezclan divisas (4.829ms)
✔ negocios: fechas inclusivas y zona Santo Domingo, fecha estimada y cerrado nulo (4.5656ms)
✔ negocios: whitelist del broker elimina centinelas, conserva monto propio; asistente sin importes (22.4571ms)
✔ negocios: cursor estable con empate/importe nulo, asc/desc y resumen completo (102.7147ms)
✔ negocios: rechaza fechas imposibles, rangos invertidos, coerción, dinero inseguro y cursor incompatible (5.637ms)
✔ proyectos y unidades: alta, edición, borrado y auditoría (4.8745ms)
✔ fases: recalcula avance al crear, editar y borrar (1.6894ms)
✔ fotos: compensa exactamente las subidas y conserva el error del INSERT (13.3161ms)
✔ fotos: el nombre visible nunca decide la ruta del bucket (1.4393ms)
✔ alcance own: proyecto ajeno no escribe ni audita fases, fotos ni unidades (10.897ms)
✔ reportes: cero y vacío no crean datos de demostración (89.751ms)
✔ reportes: identidad, team y todos los filtros llegan al puerto (1.4517ms)
✔ reportes: rechaza fechas imposibles, rangos invertidos e IDs inválidos antes del puerto (2.9557ms)
✔ reportes: alcance none o desconocido falla cerrado (0.4551ms)
✔ reportes: el fallo del puerto se propaga sin sustitución ni logs internos (12.6667ms)
✔ reportes: porcentajes, ROI y barras se derivan de agregados distintos a los antiguos (2.223ms)
✔ reportes: centavos fuera de precisión segura fallan explícitamente (0.8181ms)
✔ tendencia: el cambio de mes usa Santo Domingo y el hasta limita la ventana (0.7967ms)
✔ los permisos del rol administrador no son editables (4.5577ms)
✔ la matriz normal reemplaza celdas ausentes y audita (0.8441ms)
✔ el ultimo administrador no se puede editar ni borrar, y no escribe ni audita (4.8878ms)
✔ alcance own no puede editar ni borrar, ni su propia fila (0.8656ms)
✔ alta usa AdminAuth, conserva el orden y registra auditoria (2.7828ms)
✔ edicion y borrado normales auditan, y el reenvio llama al puerto (1.196ms)
✔ coincide por especialidad contra el proyecto o la zona de interés (4.8165ms)
✔ coincide por handlesRentals cuando la operación es de alquiler, aunque la especialidad no calce (0.364ms)
✔ sin ningún candidato que coincida, devuelve null (0.3391ms)
✔ sin candidatos, devuelve null sin lanzar (0.3327ms)
✔ con varios candidatos que coinciden, desempata por menor annualSalesCents (reparte carga) (0.4251ms)
✔ empate exacto en annualSalesCents conserva el primero del orden recibido (0.3292ms)
✔ operationType null u operación de venta no activa la coincidencia por handlesRentals (0.2532ms)
✔ diffAsignacion no toca lo que ya estaba igual (3.4942ms)
✔ diffAsignacion detecta lo nuevo y lo soltado (0.3714ms)
✔ diffAsignacion vacío a vacío no hace nada (0.349ms)
✔ diffAsignacion desasigna todo cuando no se elige ninguno (0.4074ms)
✔ AudioLeadExtractor: extrae prospecto de compra en Bávaro (5.5313ms)
✔ AudioLeadExtractor: extrae alquiler en Santo Domingo Piantini (2.5583ms)
✔ AudioLeadExtractor: extrae rango de lujo en Cap Cana con teléfono dominicano (0.7847ms)
✔ AudioLeadExtractor: texto vacío no revienta y devuelve confianza 0 (0.6037ms)
✔ promedioAvance sin fases es 0, no NaN (2.0931ms)
✔ promedioAvance redondea al entero más cercano (0.3457ms)
✔ promedioAvance con una sola fase es su propio porcentaje (0.245ms)
✔ FASES_ESTANDAR trae exactamente las 8 fases del prototipo (0.2556ms)
✔ validarFoto rechaza un mime type que no es imagen (0.5008ms)
✔ validarFoto rechaza SVG aunque su mime empiece con image/ (0.2362ms)
✔ validarFoto rechaza una imagen de más de 10 MB (0.241ms)
✔ validarFoto acepta cada formato ráster permitido dentro del límite (0.2709ms)
✔ validarFoto acepta exactamente el límite de 10 MB (0.3575ms)
✔ calcularComision: reparto 50/50 sobre un monto y comisión sin decimales exactos (1.8966ms)
✔ calcularComision: la suma broker + agencia siempre cuadra con el total, incluso cuando el reparto no divide exacto (0.3881ms)
✔ calcularComision: sin reparto explícito usa el 50/50 por defecto del esquema (0.383ms)
✔ evaluarNivelBroker: por debajo del primer corte es junior (0.3141ms)
✔ evaluarNivelBroker: exactamente en el corte confirmado por el prototipo sube a senior (0.2425ms)
✔ evaluarNivelBroker: sube de nivel en cada corte sucesivo (0.25ms)
✔ evaluarNivelBroker: un valor muy por encima del último corte se queda en el nivel máximo (0.238ms)
✔ pending → approved es válida (5.933ms)
✔ approved → paid es válida (0.5779ms)
✔ pending → void es válida (0.6986ms)
✔ approved → void es válida (2.166ms)
✔ pending → paid lanza: no se puede saltar la aprobación (4.2034ms)
✔ paid → pending lanza: una comisión pagada no retrocede (0.3547ms)
✔ paid → cualquier otro estado lanza (0.3808ms)
✔ void → cualquier otro estado lanza (0.4588ms)
✔ quedarse en el mismo estado siempre lanza (0.524ms)
✔ el reparto se puede editar mientras la comisión está pendiente (0.553ms)
✔ editar el reparto de una comisión aprobada lanza (0.3157ms)
✔ editar el reparto de una comisión pagada o anulada lanza (0.2988ms)
✔ renderizarPlantilla: reemplaza variables encontradas y deja intactas las ausentes (2.3302ms)
✔ extraerVariablesDePlantilla: encuentra todas las variables únicas (1.8308ms)
✔ generarEnlaceTelegram: genera enlace universal t.me sin costo (0.5191ms)
✔ generarEnlaceWhatsApp: normaliza teléfono y arma enlace wa.me (0.4564ms)
✔ validarTokenTelegram: detecta tokens oficiales válidos e inválidos (0.6321ms)
✔ validarConfiguracionCanal: valida configuraciones por canal (0.5369ms)
✔ Confotur: cálculo estándar de US$150,000 con 24 meses de construcción (2.6543ms)
✔ Confotur: propiedad de lujo de US$500,000 (0.4661ms)
✔ Confotur: rechaza si la suma de porcentajes no da 100% (1.0561ms)
✔ un campo sin coma, comilla ni salto de línea se deja tal cual (2.1232ms)
✔ un campo con coma va entre comillas (0.3822ms)
✔ un campo con comillas dobles las duplica y va entre comillas (0.3018ms)
✔ un campo con salto de línea va entre comillas (0.3002ms)
✔ filaCsv escapa cada campo y los une con comas (0.3632ms)
✔ un campo que empieza con = lleva un ' de escape antes (0.2596ms)
✔ un campo que empieza con +, -, @ o tab también lleva el ' (0.3143ms)
✔ un campo que empieza con retorno de carro lleva el ' y además va entre comillas (\r también es un separador RFC 4180) (0.2622ms)
✔ una fórmula que además trae coma queda escapada Y entre comillas (0.3609ms)
✔ filaCsv no aplica el escape de fórmula a números: un negativo se serializa tal cual (0.5626ms)
✔ generarCsv arma encabezado + filas con BOM y \r\n (1.8837ms)
✔ el UID es estable: exportar dos veces el mismo evento da el mismo UID (6.5362ms)
✔ sin endsAt, asume una hora de duración (0.3638ms)
✔ escapa comas y punto y coma del título (0.3431ms)
✔ sin ubicación, no escribe LOCATION (0.566ms)
✔ una agenda vacía sigue siendo un .ics válido (0.3171ms)
✔ parsearPeriodo con ?periodo= válido usa ese año y mes (9.3447ms)
✔ parsearPeriodo sin parámetro cae al mes actual en Santo Domingo (57.0893ms)
✔ parsearPeriodo ignora un valor con formato inválido y usa el mes actual (0.8169ms)
✔ parsearPeriodo rechaza un mes fuera de 1-12 y usa el mes actual (1.0721ms)
✔ formatoPeriodo rellena el mes con cero a la izquierda (0.3848ms)
✔ cumplimientoPorcentaje con meta en 0 no divide entre cero: sin meta fijada (0.4266ms)
✔ cumplimientoPorcentaje redondea al entero más cercano (0.8502ms)
✔ esMetaCumplida es falso sin meta fijada, aunque haya negocios logrados (0.3289ms)
✔ esMetaCumplida es verdadero al alcanzar o superar la meta (0.7403ms)
✔ nombreMes no retrocede un mes en husos al oeste de UTC (2.8537ms)
✔ sin fila de permiso el alcance es none: un recurso nuevo nace cerrado (2.3896ms)
✔ el permiso es por acción, no por recurso (1.0044ms)
✔ requireScope lanza 403 cuando no hay permiso, y devuelve el alcance cuando lo hay (1.2891ms)
✔ requireFullScope exige alcance all: own sobre users no basta para gestionar usuarios (0.688ms)
✔ con alcance own solo se alcanzan los registros propios (0.7654ms)
✔ con alcance all se alcanza cualquier registro, incluso sin responsable (0.6007ms)
✔ team se comporta como own mientras no exista modelo de equipos (0.7612ms)
✔ con alcance none no se alcanza nada, ni el registro propio (2.7198ms)
✔ el precio real se borra en servidor si falta el permiso unit_real_price (0.5195ms)
✔ minúsculas y espacios a guiones (1.997ms)
✔ quita acentos (0.4648ms)
✔ colapsa símbolos y recorta guiones en los extremos (0.323ms)
✔ un número de RD con guiones y espacios se normaliza a E.164 (3.2169ms)
✔ un número que ya viene en E.164 se conserva (0.3978ms)
✔ un número que no es de RD no se normaliza, pero se conserva el texto (0.3489ms)
✔ un número con menos o más dígitos de los que hacen falta no se normaliza (0.4384ms)
✔ vacío, solo espacios o undefined no rompen y devuelven null en los dos campos (0.379ms)
✔ una transición sin requisito propio en §10.1 (la primera del embudo) no lanza nada (3.6345ms)
✔ → Contactado: pasa con actividad de contacto registrada (0.3546ms)
✔ → Contactado: lanza sin ninguna actividad de contacto (0.9808ms)
✔ → Presentación: pasa con próxima acción con responsable y fecha (0.3533ms)
✔ → Presentación: lanza sin próxima acción (0.313ms)
✔ → Preselección: pasa con al menos una fila en deal_properties (0.2978ms)
✔ → Preselección: lanza sin ninguna propiedad de interés (0.3675ms)
✔ → Negociación: pasa con monto, probabilidad, comisión y fecha estimada (0.334ms)
✔ → Negociación: lanza si falta el monto (0.4291ms)
✔ → Negociación: lanza si falta la probabilidad, aunque el resto esté completo (0.589ms)
✔ → Negociación: lanza si falta el porcentaje de comisión (0.4032ms)
✔ → Negociación: lanza si falta la fecha estimada de cierre (0.3308ms)
✔ → Cierre (won): pasa con monto final y unidad principal definida (0.2872ms)
✔ → Cierre (won): lanza sin monto final, aunque haya unidad principal (0.2898ms)
✔ → Cierre (won): lanza sin unidad principal aunque haya monto — son requisitos independientes (0.4923ms)
✔ → Perdido (lost): pasa con motivo del catálogo loss_reasons (0.464ms)
✔ → Perdido (lost): lanza sin motivo (0.3057ms)
✔ un negocio ya ganado no puede volver a transicionar (0.3032ms)
✔ un negocio ya perdido no puede volver a transicionar (0.266ms)
✔ las 21:00 del 31 de enero en Santo Domingo dan 2026-01-31, no 2026-02-01 (57.5075ms)
✔ una hora que ya cae del lado de Santo Domingo no cambia de día (0.6391ms)
✔ medianoche UTC del día 1 todavía es el día anterior en Santo Domingo (0.5501ms)
✔ horaSantoDomingo: las 13:00 UTC son las 9:00 locales (1.9295ms)
✔ medianocheSantoDomingo: la medianoche local del 24 de julio es las 4:00 UTC (0.5702ms)
✔ lunesDeLaSemana: un viernes retrocede al lunes de esa misma semana (0.3973ms)
✔ lunesDeLaSemana: un lunes se devuelve a sí mismo (0.2438ms)
✔ lunesDeLaSemana: un domingo pertenece a la semana que empezó el lunes anterior (0.2188ms)
✔ sumarDias: cruza el fin de mes (0.5111ms)
✔ los archivos de src/ se encuentran (la prueba no se queda vacía sin avisar) (2.0565ms)
✔ domain/ no depende de nada fuera de domain/ (16.37ms)
✔ application/ no conoce la infraestructura ni el framework (50.073ms)
✔ infrastructure/ no importa src/app/ (36.375ms)
✔ un módulo migrado ya no toca la base desde src/app/ (65.2518ms)
✔ ARQ-1: app y application no importan adaptadores de integraciones (127.4517ms)
✔ ARQ-2: proveedor CRM confinado a su adaptador (89.2141ms)
✔ ARQ-5: CrmPort ejecuta la misma suite en memoria y adaptador local (1.3129ms)
✔ ARQ-SQL: no interpolar comparación JS como condición where/and/or/when (7.5335ms)
✔ serializa antes/después a JSON y escribe en la tabla audit_log (2.0071ms)
✔ deja previousValue y newValue en null cuando antes/después no vienen (0.4443ms)
✔ registra el autor, la acción y la entidad tal como se le pasan (0.3633ms)
✔ usa la transacción que recibe, no una conexión propia (0.4588ms)
✔ si la transacción falla (como en un rollback), auditar no absorbe el error (0.855ms)
✔ evaluación denegada en middleware, actor y demo: producción con flag y antiguo demo activos (333.7685ms)
✔ evaluación denegada en middleware, actor y demo: test con flag activo (85.9878ms)
✔ evaluación denegada en middleware, actor y demo: sin NODE_ENV (58.3179ms)
✔ evaluación denegada en middleware, actor y demo: sin flag explícito (50.9858ms)
✔ evaluación denegada en middleware, actor y demo: flag desactivado (49.7397ms)
✔ evaluación denegada en middleware, actor y demo: flag true en lugar de 1 (55.3676ms)
✔ evaluación denegada en middleware, actor y demo: host remoto (42.3274ms)
✔ evaluación denegada en middleware, actor y demo: IP no local (55.2005ms)
✔ evaluación denegada en middleware, actor y demo: subdominio engañoso (40.1421ms)
✔ evaluación denegada en middleware, actor y demo: lista de hosts (40.0644ms)
✔ evaluación denegada en middleware, actor y demo: URL en host (37.9965ms)
✔ evaluación denegada en middleware, actor y demo: sin host (36.1834ms)
✔ evaluación habilitada explícitamente en localhost (45.5466ms)
✔ evaluación habilitada explícitamente en localhost:9300 (35.1009ms)
✔ evaluación habilitada explícitamente en 127.0.0.1 (37.5373ms)
✔ evaluación habilitada explícitamente en 127.0.0.1:9300 (49.3236ms)
✔ broker conserva permisos del catálogo, identidad real y aislamiento own (26.6797ms)
✔ assistant no obtiene administración, borrado ni precios internos (25.2205ms)
✔ cookie/rol unknown no se convierte en administrador (27.4167ms)
✔ cookie/rol inactive no se convierte en administrador (26.918ms)
✔ cookie/rol deleted no se convierte en administrador (49.2045ms)
✔ cookie/rol vacío no se convierte en administrador (26.2585ms)
✔ catálogo sin permisos deniega y cambios de permisos se reflejan (48.9092ms)
✔ JSON inválido, ausente o con campos extra no crea cookie (28.346ms)
✔ fallo DB devuelve mensaje genérico sin detalles internos (38.5625ms)
✔ sesión Supabase válida sigue funcionando en producción sin aceptar rol de cookie (27.3273ms)
✔ F01: sin destinos registrados no hay solicitud saliente (5.122ms)
✔ F01: rechaza URL libre, protocolo, puerto y credenciales antes de conectar (1.9119ms)
✔ F01: bloquea IP internas, reservadas y DNS mixto incluso registrados (26.524ms)
✔ F01: IP literal interna y loopback ofuscado no alcanzan el transporte (1.6755ms)
✔ F01: fija DNS público en transporte, conserva TLS y no sigue redirects (35.1714ms)
✔ F01: timeout y errores de red no reflejan detalles externos (1.3825ms)
✔ F01: aborta DNS pendiente dentro del límite sin abrir socket (2.4085ms)
✔ F01: el timeout del transporte cancela la solicitud; error externo sanitizado (2.1171ms)
✔ F01: registro inválido mantiene el webhook cerrado (1.2076ms)
✔ F02: script sin contraseñas literales ni salida de credenciales (4.4096ms)
✔ F02: credencial obligatoria del rol desde entorno, sin fallback (4.957ms)
✔ src\infrastructure\db\lecturas.db.test.ts (375.1998ms)
✔ src\infrastructure\db\negocios.db.test.ts (375.7869ms)
✔ seed determinista: misma semilla produce todas las filas idénticas (257.756ms)
✔ reparto conserva cada fila incluso con residuos y pesos desiguales (11.0435ms)
✔ todos los volúmenes, fechas, precios, países, FK e invariantes cumplen el contrato (33.376ms)
✔ un lead con presupuesto invertido se rechaza (33.4196ms)
✔ un perdido sin motivo válido no puede falsear el reporte (49.1357ms)
✔ SOLD sin exactamente un ganado se rechaza (50.2379ms)
✔ dos ganados sobre la misma unidad se rechazan (49.9618ms)
✔ el embudo se calcula por historial, no solo etapa actual (41.9945ms)
✔ una actividad previa al lead se rechaza (regresión octubre parcial) (56.928ms)
✔ comisión y meta divergentes del cierre se rechazan (116.6735ms)
✔ el seed falla cerrado en destinos remotos, otra base, puerto u opciones (1.5661ms)
✔ el generador usa IDs y probabilidades canónicos sin insertar catálogos antiguos (1.4379ms)
✔ un catálogo canónico ausente o incompatible aborta sin inventar IDs (0.7779ms)
✔ guarda de INSERT rechaza slug o nombre visible repetido, incluso entre pendientes (0.699ms)
✔ los rangos de limpieza cubren exactamente la semilla y los catálogos v1 (1.299ms)
✔ crm memoria: salud disponible sin red (11.0246ms)
✔ crm memoria: cada capacidad devuelve una referencia propia (2.1894ms)
✔ crm memoria: duplicado concurrente conserva referencia y registra una vez (0.4503ms)
✔ crm memoria: clave reutilizada con otro contenido se rechaza (2.042ms)
✔ crm local: salud disponible sin red (2.5399ms)
✔ crm local: cada capacidad devuelve una referencia propia (4.2388ms)
✔ crm local: duplicado concurrente conserva referencia y registra una vez (0.485ms)
✔ crm local: clave reutilizada con otro contenido se rechaza (0.4887ms)
✔ outbox: backoff exponencial con full jitter y cap (3.1389ms)
✔ outbox: Retry-After impide adelantar el próximo intento (0.37ms)
✔ outbox: quinto intento agotado termina en DLQ (0.2952ms)
✔ outbox: errores permanentes, autorización y resultado desconocido no se reintentan (0.4054ms)
✔ worker: despacha las tres capacidades y marca enviado (13.4239ms)
✔ worker: payload inválido y versión desconocida no invocan el puerto (3.5954ms)
✔ worker: 429 simulado espera y reintenta con la misma clave (2.8961ms)
✔ worker: fallo total agota cinco intentos y deja DLQ (1.5797ms)
✔ worker: timeout desconocido queda para reconciliación humana (0.9473ms)
✔ worker: crash antes de confirmar persiste pendiente y conserva idempotencia (1.8685ms)
✔ F03 projects: edición vacía, sin ver ni editar precio (77.8743ms)
✔ F03 projects: edición inocua, sin ver ni editar precio (39.5616ms)
✔ F03 projects: edición precio, sin ver ni editar precio (31.6419ms)
✔ F03 projects: edición vacía, editar precio sin verlo (28.4088ms)
✔ F03 projects: edición inocua, editar precio sin verlo (26.766ms)
✔ F03 projects: edición precio, editar precio sin verlo (19.0664ms)
✔ F03 projects: edición vacía, ver precio sin editarlo (23.2127ms)
✔ F03 projects: edición inocua, ver precio sin editarlo (20.1857ms)
✔ F03 projects: edición precio, ver precio sin editarlo (21.9679ms)
✔ F03 projects: edición vacía, ver y editar precio (20.993ms)
✔ F03 projects: edición inocua, ver y editar precio (19.8856ms)
✔ F03 projects: edición precio, ver y editar precio (25.5984ms)
✔ F03 units: edición vacía, sin ver ni editar precio (20.4934ms)
✔ F03 units: edición inocua, sin ver ni editar precio (20.6549ms)
✔ F03 units: edición precio, sin ver ni editar precio (18.2172ms)
✔ F03 units: edición vacía, editar precio sin verlo (16.3536ms)
✔ F03 units: edición inocua, editar precio sin verlo (16.3876ms)
✔ F03 units: edición precio, editar precio sin verlo (13.8782ms)
✔ F03 units: edición vacía, ver precio sin editarlo (18.0867ms)
✔ F03 units: edición inocua, ver precio sin editarlo (10.9042ms)
✔ F03 units: edición precio, ver precio sin editarlo (10.8685ms)
✔ F03 units: edición vacía, ver y editar precio (10.958ms)
✔ F03 units: edición inocua, ver y editar precio (12.3317ms)
✔ F03 units: edición precio, ver y editar precio (10.1429ms)
✔ alcance own filtra por el responsable, con el id del actor como parámetro (5.053ms)
✔ alcance all no añade condición: no hay nada que restringir (0.2828ms)
✔ team filtra igual que own mientras no exista modelo de equipos (0.5196ms)
✔ alcance none no devuelve nada, aunque alguien se salte requireScope (0.4909ms)
✔ visibleRows descarta siempre la papelera además de aplicar el alcance (1.1562ms)
✔ visibleRows con alcance all sigue descartando la papelera (0.5626ms)
✔ toda tabla creada en una migración tiene RLS activado (6.0345ms)
✔ toda ruta de la API comprueba permisos en servidor, salvo las públicas declaradas (72.6442ms)
✔ ARQ-3: tablas de integración con RLS en esquema y migración (3.3189ms)
✔ ARQ-4: webhooks verifican firma antes de parsear el cuerpo (46.1164ms)
✔ D-04: ningún literal ni texto JSX muestra el vocabulario prohibido (668.5092ms)
✔ D-04: las excepciones técnicas no permiten etiquetas, errores ni enlaces antiguos (3.521ms)
ℹ tests 523
ℹ suites 0
ℹ pass 523
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 4118.0736
```

### `npm run test:db` — exit 0

```text

> quisqueya-home-crm@0.1.0 test:db
> node scripts/test-db/run.mjs

SERVER IDENTITY {"db":"quisqueyahome_crm","schema":"public","host":"127.0.0.1/32","port":5432}
DEV BEFORE {"academy_checklist_items":"0","academy_checklist_progress":"0","academy_items":"0","academy_progress":"0","activities":"1803","activity_sync":"0","agencies":"3","audit_log":"4","broker_profiles":"13","campaign_spend":"152","commissions":"17","construction_phases":"0","contacts":"459","deal_properties":"184","deal_stage_history":"592","deals":"184","external_refs":"0","files":"0","goals":"247","integration_accounts":"0","lead_sources":"8","leads":"649","loss_reasons":"7","marketing_campaigns":"8","message_templates":"4","notifications":"3","outbox":"0","outbox_dead":"0","payment_methods":"3","permissions":"183","pipeline_stages":"7","projects":"24","roles":"3","sessions":"0","unit_inventory_states":"5","units":"404","users":"15","webhook_inbox":"0","zones":"13"}
SERVER IDENTITY {"db":"quisqueyahome_crm_test_befa1df1e5d86458486f","schema":"public","host":"127.0.0.1/32","port":5432}
ISOLATION PASS: database quisqueyahome_crm_test_befa1df1e5d86458486f; loopback:5432.
MIGRATIONS PASS: drizzle/ aplicado solo al destino temporal.
SEED PASS: semilla 20261004; 640 leads, 176 negocios, 450 contactos, 400 unidades.
TAP version 13
# Subtest: DB dashboard.obtenerMetricasDashboard / admin (alias y alcance)
ok 1 - DB dashboard.obtenerMetricasDashboard / admin (alias y alcance)
  ---
  duration_ms: 284.835
  type: 'test'
  ...
# Subtest: DB reportes.obtenerMetricasBi / admin (condición spend SQL)
ok 2 - DB reportes.obtenerMetricasBi / admin (condición spend SQL)
  ---
  duration_ms: 118.5498
  type: 'test'
  ...
# Subtest: DB dashboard+reportes filtros projectId / admin
ok 3 - DB dashboard+reportes filtros projectId / admin
  ---
  duration_ms: 48.3689
  type: 'test'
  ...
# Subtest: DB dashboard+reportes filtros brokerId / admin
ok 4 - DB dashboard+reportes filtros brokerId / admin
  ---
  duration_ms: 28.9946
  type: 'test'
  ...
# Subtest: DB dashboard+reportes filtros desde+hasta / admin
ok 5 - DB dashboard+reportes filtros desde+hasta / admin
  ---
  duration_ms: 105.8628
  type: 'test'
  ...
# Subtest: DB dashboard+reportes filtros projectId / admin
ok 6 - DB dashboard+reportes filtros projectId / admin
  ---
  duration_ms: 28.7121
  type: 'test'
  ...
# Subtest: DB leads.candidatosDuplicados / admin
ok 7 - DB leads.candidatosDuplicados / admin
  ---
  duration_ms: 7.3759
  type: 'test'
  ...
# Subtest: DB contactos.candidatosDuplicados / admin
ok 8 - DB contactos.candidatosDuplicados / admin
  ---
  duration_ms: 4.3863
  type: 'test'
  ...
# Subtest: DB leads.contactoExiste / admin
ok 9 - DB leads.contactoExiste / admin
  ---
  duration_ms: 3.6537
  type: 'test'
  ...
# Subtest: DB leads.candidatosBroker / admin
ok 10 - DB leads.candidatosBroker / admin
  ---
  duration_ms: 2.7734
  type: 'test'
  ...
# Subtest: DB leads.buscarLead / admin
ok 11 - DB leads.buscarLead / admin
  ---
  duration_ms: 3.2219
  type: 'test'
  ...
# Subtest: DB leads.buscarLeadParaConversion / admin
ok 12 - DB leads.buscarLeadParaConversion / admin
  ---
  duration_ms: 5.3061
  type: 'test'
  ...
# Subtest: DB leads.bloquearCapturaExterna / admin
ok 13 - DB leads.bloquearCapturaExterna / admin
  ---
  duration_ms: 11.2271
  type: 'test'
  ...
# Subtest: DB leads.buscarContactoPorTelefonoOCorreo / admin
ok 14 - DB leads.buscarContactoPorTelefonoOCorreo / admin
  ---
  duration_ms: 1.7861
  type: 'test'
  ...
# Subtest: DB leads.primeraEtapaAbierta / admin
ok 15 - DB leads.primeraEtapaAbierta / admin
  ---
  duration_ms: 3.1993
  type: 'test'
  ...
# Subtest: DB contactos.buscarVisible / admin
ok 16 - DB contactos.buscarVisible / admin
  ---
  duration_ms: 3.6081
  type: 'test'
  ...
# Subtest: DB contactos.listado / admin
ok 17 - DB contactos.listado / admin
  ---
  duration_ms: 19.4932
  type: 'test'
  ...
# Subtest: DB pipeline.buscarNegocio / admin
ok 18 - DB pipeline.buscarNegocio / admin
  ---
  duration_ms: 3.4734
  type: 'test'
  ...
# Subtest: DB pipeline.buscarEtapa / admin
ok 19 - DB pipeline.buscarEtapa / admin
  ---
  duration_ms: 3.1453
  type: 'test'
  ...
# Subtest: DB pipeline.buscarEtapaActiva / admin
ok 20 - DB pipeline.buscarEtapaActiva / admin
  ---
  duration_ms: 4.3697
  type: 'test'
  ...
# Subtest: DB pipeline.tieneActividadDeContacto / admin
ok 21 - DB pipeline.tieneActividadDeContacto / admin
  ---
  duration_ms: 4.9348
  type: 'test'
  ...
# Subtest: DB pipeline.buscarProximaAccionVigente / admin
ok 22 - DB pipeline.buscarProximaAccionVigente / admin
  ---
  duration_ms: 5.3627
  type: 'test'
  ...
# Subtest: DB pipeline.propiedadesDelNegocio / admin
ok 23 - DB pipeline.propiedadesDelNegocio / admin
  ---
  duration_ms: 2.3846
  type: 'test'
  ...
# Subtest: DB pipeline.bloquearNegocio / admin
ok 24 - DB pipeline.bloquearNegocio / admin
  ---
  duration_ms: 3.2978
  type: 'test'
  ...
# Subtest: DB pipeline.buscarPerfilDeBroker / admin
ok 25 - DB pipeline.buscarPerfilDeBroker / admin
  ---
  duration_ms: 5.0148
  type: 'test'
  ...
# Subtest: DB pipeline.totalGanadoDelAnio / admin
ok 26 - DB pipeline.totalGanadoDelAnio / admin
  ---
  duration_ms: 5.3779
  type: 'test'
  ...
# Subtest: DB pipeline.buscarNegocioConEtapa / admin
ok 27 - DB pipeline.buscarNegocioConEtapa / admin
  ---
  duration_ms: 3.3835
  type: 'test'
  ...
# Subtest: DB pipeline.proyectoVisible / admin
ok 28 - DB pipeline.proyectoVisible / admin
  ---
  duration_ms: 3.899
  type: 'test'
  ...
# Subtest: DB pipeline.unidadDelProyecto / admin
ok 29 - DB pipeline.unidadDelProyecto / admin
  ---
  duration_ms: 3.7448
  type: 'test'
  ...
# Subtest: DB pipeline.buscarPropiedad / admin
ok 30 - DB pipeline.buscarPropiedad / admin
  ---
  duration_ms: 4.4682
  type: 'test'
  ...
# Subtest: DB proyectos.proyectoVisible / admin
ok 31 - DB proyectos.proyectoVisible / admin
  ---
  duration_ms: 5.9815
  type: 'test'
  ...
# Subtest: DB proyectos.unidadVisible / admin
ok 32 - DB proyectos.unidadVisible / admin
  ---
  duration_ms: 9.8578
  type: 'test'
  ...
# Subtest: DB proyectos.fasesDelProyecto / admin
ok 33 - DB proyectos.fasesDelProyecto / admin
  ---
  duration_ms: 5.0495
  type: 'test'
  ...
# Subtest: DB proyectos.faseVisible / admin
ok 34 - DB proyectos.faseVisible / admin
  ---
  duration_ms: 3.5439
  type: 'test'
  ...
# Subtest: DB proyectos.fotosDeFase / admin
ok 35 - DB proyectos.fotosDeFase / admin
  ---
  duration_ms: 5.1128
  type: 'test'
  ...
# Subtest: DB proyectos.fotoVisible / admin
ok 36 - DB proyectos.fotoVisible / admin
  ---
  duration_ms: 6.6136
  type: 'test'
  ...
# Subtest: DB comisiones.bloquearComision / admin
ok 37 - DB comisiones.bloquearComision / admin
  ---
  duration_ms: 3.347
  type: 'test'
  ...
# Subtest: DB metas.existePerfilDeBroker / admin
ok 38 - DB metas.existePerfilDeBroker / admin
  ---
  duration_ms: 3.57
  type: 'test'
  ...
# Subtest: DB metas.fijarMetaMensual lectura anterior broker / admin
ok 39 - DB metas.fijarMetaMensual lectura anterior broker / admin
  ---
  duration_ms: 6.0956
  type: 'test'
  ...
# Subtest: DB metas.fijarMetaMensual lectura anterior compañía / admin
ok 40 - DB metas.fijarMetaMensual lectura anterior compañía / admin
  ---
  duration_ms: 10.489
  type: 'test'
  ...
# Subtest: DB brokers.buscarBroker / admin
ok 41 - DB brokers.buscarBroker / admin
  ---
  duration_ms: 3.453
  type: 'test'
  ...
# Subtest: DB brokers.proyectosRelevantes sin ids / admin
ok 42 - DB brokers.proyectosRelevantes sin ids / admin
  ---
  duration_ms: 3.2008
  type: 'test'
  ...
# Subtest: DB brokers.proyectosRelevantes con ids / admin
ok 43 - DB brokers.proyectosRelevantes con ids / admin
  ---
  duration_ms: 3.6691
  type: 'test'
  ...
# Subtest: DB dashboard.obtenerMetricasDashboard / broker (alias y alcance)
ok 44 - DB dashboard.obtenerMetricasDashboard / broker (alias y alcance)
  ---
  duration_ms: 117.8606
  type: 'test'
  ...
# Subtest: DB reportes.obtenerMetricasBi / broker (condición spend SQL)
ok 45 - DB reportes.obtenerMetricasBi / broker (condición spend SQL)
  ---
  duration_ms: 58.6052
  type: 'test'
  ...
# Subtest: DB dashboard+reportes filtros projectId / broker
ok 46 - DB dashboard+reportes filtros projectId / broker
  ---
  duration_ms: 32.2571
  type: 'test'
  ...
# Subtest: DB dashboard+reportes filtros brokerId / broker
ok 47 - DB dashboard+reportes filtros brokerId / broker
  ---
  duration_ms: 50.4871
  type: 'test'
  ...
# Subtest: DB dashboard+reportes filtros desde+hasta / broker
ok 48 - DB dashboard+reportes filtros desde+hasta / broker
  ---
  duration_ms: 35.0118
  type: 'test'
  ...
# Subtest: DB dashboard+reportes filtros projectId / broker
ok 49 - DB dashboard+reportes filtros projectId / broker
  ---
  duration_ms: 27.4698
  type: 'test'
  ...
# Subtest: DB leads.candidatosDuplicados / broker
ok 50 - DB leads.candidatosDuplicados / broker
  ---
  duration_ms: 5.6901
  type: 'test'
  ...
# Subtest: DB contactos.candidatosDuplicados / broker
ok 51 - DB contactos.candidatosDuplicados / broker
  ---
  duration_ms: 4.4231
  type: 'test'
  ...
# Subtest: DB leads.contactoExiste / broker
ok 52 - DB leads.contactoExiste / broker
  ---
  duration_ms: 2.2133
  type: 'test'
  ...
# Subtest: DB leads.candidatosBroker / broker
ok 53 - DB leads.candidatosBroker / broker
  ---
  duration_ms: 1.7801
  type: 'test'
  ...
# Subtest: DB leads.buscarLead / broker
ok 54 - DB leads.buscarLead / broker
  ---
  duration_ms: 1.7823
  type: 'test'
  ...
# Subtest: DB leads.buscarLeadParaConversion / broker
ok 55 - DB leads.buscarLeadParaConversion / broker
  ---
  duration_ms: 3.5217
  type: 'test'
  ...
# Subtest: DB leads.bloquearCapturaExterna / broker
ok 56 - DB leads.bloquearCapturaExterna / broker
  ---
  duration_ms: 9.3128
  type: 'test'
  ...
# Subtest: DB leads.buscarContactoPorTelefonoOCorreo / broker
ok 57 - DB leads.buscarContactoPorTelefonoOCorreo / broker
  ---
  duration_ms: 1.3518
  type: 'test'
  ...
# Subtest: DB leads.primeraEtapaAbierta / broker
ok 58 - DB leads.primeraEtapaAbierta / broker
  ---
  duration_ms: 2.3637
  type: 'test'
  ...
# Subtest: DB contactos.buscarVisible / broker
ok 59 - DB contactos.buscarVisible / broker
  ---
  duration_ms: 2.5776
  type: 'test'
  ...
# Subtest: DB contactos.listado / broker
ok 60 - DB contactos.listado / broker
  ---
  duration_ms: 8.3317
  type: 'test'
  ...
# Subtest: DB pipeline.buscarNegocio / broker
ok 61 - DB pipeline.buscarNegocio / broker
  ---
  duration_ms: 2.2566
  type: 'test'
  ...
# Subtest: DB pipeline.buscarEtapa / broker
ok 62 - DB pipeline.buscarEtapa / broker
  ---
  duration_ms: 14.0681
  type: 'test'
  ...
# Subtest: DB pipeline.buscarEtapaActiva / broker
ok 63 - DB pipeline.buscarEtapaActiva / broker
  ---
  duration_ms: 3.7719
  type: 'test'
  ...
# Subtest: DB pipeline.tieneActividadDeContacto / broker
ok 64 - DB pipeline.tieneActividadDeContacto / broker
  ---
  duration_ms: 3.6432
  type: 'test'
  ...
# Subtest: DB pipeline.buscarProximaAccionVigente / broker
ok 65 - DB pipeline.buscarProximaAccionVigente / broker
  ---
  duration_ms: 4.5776
  type: 'test'
  ...
# Subtest: DB pipeline.propiedadesDelNegocio / broker
ok 66 - DB pipeline.propiedadesDelNegocio / broker
  ---
  duration_ms: 2.2085
  type: 'test'
  ...
# Subtest: DB pipeline.bloquearNegocio / broker
ok 67 - DB pipeline.bloquearNegocio / broker
  ---
  duration_ms: 2.3279
  type: 'test'
  ...
# Subtest: DB pipeline.buscarPerfilDeBroker / broker
ok 68 - DB pipeline.buscarPerfilDeBroker / broker
  ---
  duration_ms: 1.8353
  type: 'test'
  ...
# Subtest: DB pipeline.totalGanadoDelAnio / broker
ok 69 - DB pipeline.totalGanadoDelAnio / broker
  ---
  duration_ms: 3.9122
  type: 'test'
  ...
# Subtest: DB pipeline.buscarNegocioConEtapa / broker
ok 70 - DB pipeline.buscarNegocioConEtapa / broker
  ---
  duration_ms: 2.7409
  type: 'test'
  ...
# Subtest: DB pipeline.proyectoVisible / broker
ok 71 - DB pipeline.proyectoVisible / broker
  ---
  duration_ms: 3.4919
  type: 'test'
  ...
# Subtest: DB pipeline.unidadDelProyecto / broker
ok 72 - DB pipeline.unidadDelProyecto / broker
  ---
  duration_ms: 3.3476
  type: 'test'
  ...
# Subtest: DB pipeline.buscarPropiedad / broker
ok 73 - DB pipeline.buscarPropiedad / broker
  ---
  duration_ms: 4.6678
  type: 'test'
  ...
# Subtest: DB proyectos.proyectoVisible / broker
ok 74 - DB proyectos.proyectoVisible / broker
  ---
  duration_ms: 5.4321
  type: 'test'
  ...
# Subtest: DB proyectos.unidadVisible / broker
ok 75 - DB proyectos.unidadVisible / broker
  ---
  duration_ms: 3.866
  type: 'test'
  ...
# Subtest: DB proyectos.fasesDelProyecto / broker
ok 76 - DB proyectos.fasesDelProyecto / broker
  ---
  duration_ms: 5.2375
  type: 'test'
  ...
# Subtest: DB proyectos.faseVisible / broker
ok 77 - DB proyectos.faseVisible / broker
  ---
  duration_ms: 3.2683
  type: 'test'
  ...
# Subtest: DB proyectos.fotosDeFase / broker
ok 78 - DB proyectos.fotosDeFase / broker
  ---
  duration_ms: 1.6206
  type: 'test'
  ...
# Subtest: DB proyectos.fotoVisible / broker
ok 79 - DB proyectos.fotoVisible / broker
  ---
  duration_ms: 2.6884
  type: 'test'
  ...
# Subtest: DB comisiones.bloquearComision / broker
ok 80 - DB comisiones.bloquearComision / broker
  ---
  duration_ms: 3.6987
  type: 'test'
  ...
# Subtest: DB metas.existePerfilDeBroker / broker
ok 81 - DB metas.existePerfilDeBroker / broker
  ---
  duration_ms: 2.7646
  type: 'test'
  ...
# Subtest: DB metas.fijarMetaMensual lectura anterior broker / broker
ok 82 - DB metas.fijarMetaMensual lectura anterior broker / broker
  ---
  duration_ms: 4.7285
  type: 'test'
  ...
# Subtest: DB metas.fijarMetaMensual lectura anterior compañía / broker
ok 83 - DB metas.fijarMetaMensual lectura anterior compañía / broker
  ---
  duration_ms: 4.1484
  type: 'test'
  ...
# Subtest: DB brokers.buscarBroker / broker
ok 84 - DB brokers.buscarBroker / broker
  ---
  duration_ms: 2.1989
  type: 'test'
  ...
# Subtest: DB brokers.proyectosRelevantes sin ids / broker
ok 85 - DB brokers.proyectosRelevantes sin ids / broker
  ---
  duration_ms: 2.3234
  type: 'test'
  ...
# Subtest: DB brokers.proyectosRelevantes con ids / broker
ok 86 - DB brokers.proyectosRelevantes con ids / broker
  ---
  duration_ms: 2.4036
  type: 'test'
  ...
# Subtest: DB own rechaza IDs ajenos en contactos/leads/proyectos/pipeline / broker
ok 87 - DB own rechaza IDs ajenos en contactos/leads/proyectos/pipeline / broker
  ---
  duration_ms: 15.1945
  type: 'test'
  ...
# Subtest: DB dashboard.obtenerMetricasDashboard / assistant (alias y alcance)
ok 88 - DB dashboard.obtenerMetricasDashboard / assistant (alias y alcance)
  ---
  duration_ms: 158.7624
  type: 'test'
  ...
# Subtest: DB reportes.obtenerMetricasBi / assistant (condición spend SQL)
ok 89 - DB reportes.obtenerMetricasBi / assistant (condición spend SQL)
  ---
  duration_ms: 61.9564
  type: 'test'
  ...
# Subtest: DB dashboard+reportes filtros projectId / assistant
ok 90 - DB dashboard+reportes filtros projectId / assistant
  ---
  duration_ms: 29.2441
  type: 'test'
  ...
# Subtest: DB dashboard+reportes filtros brokerId / assistant
ok 91 - DB dashboard+reportes filtros brokerId / assistant
  ---
  duration_ms: 21.9637
  type: 'test'
  ...
# Subtest: DB dashboard+reportes filtros desde+hasta / assistant
ok 92 - DB dashboard+reportes filtros desde+hasta / assistant
  ---
  duration_ms: 82.4556
  type: 'test'
  ...
# Subtest: DB dashboard+reportes filtros projectId / assistant
ok 93 - DB dashboard+reportes filtros projectId / assistant
  ---
  duration_ms: 24.4627
  type: 'test'
  ...
# Subtest: DB leads.candidatosDuplicados / assistant
ok 94 - DB leads.candidatosDuplicados / assistant
  ---
  duration_ms: 3.9058
  type: 'test'
  ...
# Subtest: DB contactos.candidatosDuplicados / assistant
ok 95 - DB contactos.candidatosDuplicados / assistant
  ---
  duration_ms: 3.6145
  type: 'test'
  ...
# Subtest: DB leads.contactoExiste / assistant
ok 96 - DB leads.contactoExiste / assistant
  ---
  duration_ms: 3.0741
  type: 'test'
  ...
# Subtest: DB leads.candidatosBroker / assistant
ok 97 - DB leads.candidatosBroker / assistant
  ---
  duration_ms: 1.6866
  type: 'test'
  ...
# Subtest: DB leads.buscarLead / assistant
ok 98 - DB leads.buscarLead / assistant
  ---
  duration_ms: 1.7817
  type: 'test'
  ...
# Subtest: DB leads.buscarLeadParaConversion / assistant
ok 99 - DB leads.buscarLeadParaConversion / assistant
  ---
  duration_ms: 2.9372
  type: 'test'
  ...
# Subtest: DB leads.bloquearCapturaExterna / assistant
ok 100 - DB leads.bloquearCapturaExterna / assistant
  ---
  duration_ms: 3.6505
  type: 'test'
  ...
# Subtest: DB leads.buscarContactoPorTelefonoOCorreo / assistant
ok 101 - DB leads.buscarContactoPorTelefonoOCorreo / assistant
  ---
  duration_ms: 1.1985
  type: 'test'
  ...
# Subtest: DB leads.primeraEtapaAbierta / assistant
ok 102 - DB leads.primeraEtapaAbierta / assistant
  ---
  duration_ms: 2.1193
  type: 'test'
  ...
# Subtest: DB contactos.buscarVisible / assistant
ok 103 - DB contactos.buscarVisible / assistant
  ---
  duration_ms: 2.3005
  type: 'test'
  ...
# Subtest: DB contactos.listado / assistant
ok 104 - DB contactos.listado / assistant
  ---
  duration_ms: 15.9246
  type: 'test'
  ...
# Subtest: DB pipeline.buscarNegocio / assistant
ok 105 - DB pipeline.buscarNegocio / assistant
  ---
  duration_ms: 2.8845
  type: 'test'
  ...
# Subtest: DB pipeline.buscarEtapa / assistant
ok 106 - DB pipeline.buscarEtapa / assistant
  ---
  duration_ms: 2.5777
  type: 'test'
  ...
# Subtest: DB pipeline.buscarEtapaActiva / assistant
ok 107 - DB pipeline.buscarEtapaActiva / assistant
  ---
  duration_ms: 2.7521
  type: 'test'
  ...
# Subtest: DB pipeline.tieneActividadDeContacto / assistant
ok 108 - DB pipeline.tieneActividadDeContacto / assistant
  ---
  duration_ms: 3.7932
  type: 'test'
  ...
# Subtest: DB pipeline.buscarProximaAccionVigente / assistant
ok 109 - DB pipeline.buscarProximaAccionVigente / assistant
  ---
  duration_ms: 6.0608
  type: 'test'
  ...
# Subtest: DB pipeline.propiedadesDelNegocio / assistant
ok 110 - DB pipeline.propiedadesDelNegocio / assistant
  ---
  duration_ms: 2.0642
  type: 'test'
  ...
# Subtest: DB pipeline.bloquearNegocio / assistant
ok 111 - DB pipeline.bloquearNegocio / assistant
  ---
  duration_ms: 2.3662
  type: 'test'
  ...
# Subtest: DB pipeline.buscarPerfilDeBroker / assistant
ok 112 - DB pipeline.buscarPerfilDeBroker / assistant
  ---
  duration_ms: 2.0483
  type: 'test'
  ...
# Subtest: DB pipeline.totalGanadoDelAnio / assistant
ok 113 - DB pipeline.totalGanadoDelAnio / assistant
  ---
  duration_ms: 3.4817
  type: 'test'
  ...
# Subtest: DB pipeline.buscarNegocioConEtapa / assistant
ok 114 - DB pipeline.buscarNegocioConEtapa / assistant
  ---
  duration_ms: 2.4559
  type: 'test'
  ...
# Subtest: DB pipeline.proyectoVisible / assistant
ok 115 - DB pipeline.proyectoVisible / assistant
  ---
  duration_ms: 2.7688
  type: 'test'
  ...
# Subtest: DB pipeline.unidadDelProyecto / assistant
ok 116 - DB pipeline.unidadDelProyecto / assistant
  ---
  duration_ms: 3.5424
  type: 'test'
  ...
# Subtest: DB pipeline.buscarPropiedad / assistant
ok 117 - DB pipeline.buscarPropiedad / assistant
  ---
  duration_ms: 4.3128
  type: 'test'
  ...
# Subtest: DB proyectos.proyectoVisible / assistant
ok 118 - DB proyectos.proyectoVisible / assistant
  ---
  duration_ms: 5.2087
  type: 'test'
  ...
# Subtest: DB proyectos.unidadVisible / assistant
ok 119 - DB proyectos.unidadVisible / assistant
  ---
  duration_ms: 4.251
  type: 'test'
  ...
# Subtest: DB proyectos.fasesDelProyecto / assistant
ok 120 - DB proyectos.fasesDelProyecto / assistant
  ---
  duration_ms: 1.2852
  type: 'test'
  ...
# Subtest: DB proyectos.faseVisible / assistant
ok 121 - DB proyectos.faseVisible / assistant
  ---
  duration_ms: 3.0261
  type: 'test'
  ...
# Subtest: DB proyectos.fotosDeFase / assistant
ok 122 - DB proyectos.fotosDeFase / assistant
  ---
  duration_ms: 1.5667
  type: 'test'
  ...
# Subtest: DB proyectos.fotoVisible / assistant
ok 123 - DB proyectos.fotoVisible / assistant
  ---
  duration_ms: 2.6841
  type: 'test'
  ...
# Subtest: DB comisiones.bloquearComision / assistant
ok 124 - DB comisiones.bloquearComision / assistant
  ---
  duration_ms: 3.292
  type: 'test'
  ...
# Subtest: DB metas.existePerfilDeBroker / assistant
ok 125 - DB metas.existePerfilDeBroker / assistant
  ---
  duration_ms: 3.3956
  type: 'test'
  ...
# Subtest: DB metas.fijarMetaMensual lectura anterior broker / assistant
ok 126 - DB metas.fijarMetaMensual lectura anterior broker / assistant
  ---
  duration_ms: 4.2261
  type: 'test'
  ...
# Subtest: DB metas.fijarMetaMensual lectura anterior compañía / assistant
ok 127 - DB metas.fijarMetaMensual lectura anterior compañía / assistant
  ---
  duration_ms: 3.3858
  type: 'test'
  ...
# Subtest: DB brokers.buscarBroker / assistant
ok 128 - DB brokers.buscarBroker / assistant
  ---
  duration_ms: 2.5677
  type: 'test'
  ...
# Subtest: DB brokers.proyectosRelevantes sin ids / assistant
ok 129 - DB brokers.proyectosRelevantes sin ids / assistant
  ---
  duration_ms: 2.4451
  type: 'test'
  ...
# Subtest: DB brokers.proyectosRelevantes con ids / assistant
ok 130 - DB brokers.proyectosRelevantes con ids / assistant
  ---
  duration_ms: 2.4502
  type: 'test'
  ...
# Subtest: DB negocios control seed / admin
ok 131 - DB negocios control seed / admin
  ---
  duration_ms: 509.2079
  type: 'test'
  ...
# Subtest: DB negocios control seed / broker
ok 132 - DB negocios control seed / broker
  ---
  duration_ms: 166.7636
  type: 'test'
  ...
# Subtest: DB negocios 184 negocios (176 seed + 8 sintéticos rollback): N:M, USD/DOP y bordes inclusivos
ok 133 - DB negocios 184 negocios (176 seed + 8 sintéticos rollback): N:M, USD/DOP y bordes inclusivos
  ---
  duration_ms: 213.9022
  type: 'test'
  ...
# Subtest: DB negocios SELECT y DTO por rol: centinelas, own/none, ID ajeno, catálogos y orden
ok 134 - DB negocios SELECT y DTO por rol: centinelas, own/none, ID ajeno, catálogos y orden
  ---
  duration_ms: 147.8356
  type: 'test'
  ...
# Subtest: DB negocios centinelas persistidos: admin recibe precio/comisión y broker no los lee
ok 135 - DB negocios centinelas persistidos: admin recibe precio/comisión y broker no los lee
  ---
  duration_ms: 55.5812
  type: 'test'
  ...
1..135
# tests 135
# suites 0
# pass 135
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 3780.336
CLEANUP PASS: database temporal eliminado.
DEV AFTER {"academy_checklist_items":"0","academy_checklist_progress":"0","academy_items":"0","academy_progress":"0","activities":"1803","activity_sync":"0","agencies":"3","audit_log":"4","broker_profiles":"13","campaign_spend":"152","commissions":"17","construction_phases":"0","contacts":"459","deal_properties":"184","deal_stage_history":"592","deals":"184","external_refs":"0","files":"0","goals":"247","integration_accounts":"0","lead_sources":"8","leads":"649","loss_reasons":"7","marketing_campaigns":"8","message_templates":"4","notifications":"3","outbox":"0","outbox_dead":"0","payment_methods":"3","permissions":"183","pipeline_stages":"7","projects":"24","roles":"3","sessions":"0","unit_inventory_states":"5","units":"404","users":"15","webhook_inbox":"0","zones":"13"}
DEV COUNTS PASS: todas las tablas public idénticas antes/después.
```

### `npm run spec:check` — exit 0

```text

> quisqueya-home-crm@0.1.0 spec:check
> node scripts/spec/check.mjs

Spec Pack: 6 fichas; listas READY o superior: 17%
Estados: DRAFT 4 · REVIEW 1 · READY 1 · BUILT 0 · VERIFIED 0
Tipos: Módulo 3 · Global 0 · Integración 3
Bloqueos: 0
Aviso: .viltrum/vre-os/spec/integraciones/CAPACIDADES.md: catálogo histórico omitido; investigación no probatoria, no acredita APIs verificadas
- .viltrum/vre-os/tareas/T-DS-1-negocios-leads.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-DS-2-propiedades-brokers.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-DS-3-integraciones-shell.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-E1-0-renombrar-negocios.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-E1-1a-ficha-negocios.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-E1-1a-r1-ficha-negocios.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-E1-1a-rev-negocios.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-E1-1b1-consultas-negocios.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-E1-1b2-cierre-venta-unica.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-E1-2a-ficha-leads.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-E1-2a-r1-ficha-leads.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-E1-3a-ficha-propiedades.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-E1-4a-ficha-brokers.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-E1-5a-ficha-integraciones.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-I0-capacidades.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-P0-cms-reutilizable.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-P0-crm-inventario.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-P1-spec-check.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-QA-test-db.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-TW-D21-twenty-inventario.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-W1-D05-graficas-movil.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-W1-D09a-higiene-visual.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-W1-D11-datos-seed.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-W1-D11-rework-catalogos.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-W1-D21-cobertura-modulos.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-W1-D21-oss-intake.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-W1-D21b-rework.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-W2-D10-reportes-reales.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-W2-D19-base-integraciones.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-W3-D05-ux-visual-A.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-W3-D05-ux-visual-B.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-W3-D09-inicio-reportes.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-W4b-D10-rentas.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-W4b-D21-rentas-porte.md: legado (sin Ficha:)
Sin bloqueos.
```

## Handoff

Antigravity revisa la implementación; D12 revisa permisos/proyección y el hallazgo PATCH; D14 reproduce unitarias/DB/mutación y completa recorrido visual con servidor disponible; D13/orquestador decide integración. No hay firma independiente en esta sesión.

ESTADO: ENTREGADO
