# D12 · Corrección acotada de ORQ-01

Fecha: 2026-10-03. Productor: Codex, perfil D12.
Estado: implementado y verificado con pruebas locales; pendiente de revisión humana independiente.

## Cambios

Mandato: corregir el acceso por cookie `qh_dev_role` de ORQ-01 dentro del despacho `20261003T192628Z-D12-codex`. Clasificación según router: BUG de seguridad en CRM/ERP, proyecto R3, severidad P1 heredada del hallazgo. Se leyó el perfil completo, la tarea, el relevo, el contexto del repositorio, el router y el manifest D12. Se aplicó la skill `viltrum-security` incluida en PERFIL.md. La autorización específica de construcción acotada de este despacho sustituye para esta tarea la restricción anterior de Codex a pruebas de interfaz. No se abrió ningún subagente.

Archivos editados:

- `src/infrastructure/env.ts:47`: control compartido `evaluationLoginAllowed`. Solo permite evaluación cuando coinciden `NODE_ENV === "development"`, `CRM_EVAL_LOGIN === "1"` y cabecera Host con `localhost` o `127.0.0.1`, opcionalmente con puerto. Rechaza host ausente, remoto, subdominios engañosos, URLs y listas de hosts. No lee archivos de configuración ni requiere la variable para iniciar la aplicación: ausente significa desactivado.
- `src/middleware.ts:60`: la cookie solo participa como sesión de evaluación si supera ese control. Las lecturas de configuración de Supabase del middleware pasan por env.ts.
- `src/infrastructure/auth/actor.ts:45`: evaluación consulta el catálogo real de roles y un usuario activo, no borrado, asociado al rol solicitado. Elige el de menor ID y usa su ID real para que `own` conserve el aislamiento. Los permisos provienen de `permissions` mediante la misma consulta y transformación de la sesión normal, en `actorFor` (`:59`). Se eliminó el producto cartesiano de permisos y el fallback a admin. Un rol desconocido o sin usuario activo no produce actor; un rol sin permisos conserva cero permisos. La sesión Supabase verificada sigue teniendo prioridad sobre la cookie.
- `src/app/api/auth/demo/route.ts:16` y `:45`: POST y DELETE responden 404 antes de procesar JSON o cookies fuera de las condiciones autorizadas. POST valida con Zod un único campo role y comprueba disponibilidad en el catálogo; errores de cuerpo o rol dan 400. Cookie HttpOnly y SameSite=Lax. Fallos internos dan mensaje genérico.
- `src/infrastructure/auth/evaluation-login.test.ts`: 26 pruebas nuevas, ejecutando las fuentes reales transpiladas con TypeScript y dependencias aisladas de Next/Auth/DB. No hay conexión a servicios ni datos reales. La lógica del control y los handlers se ejecutan desde los archivos productivos; el doble DB evalúa filtros y simula filas de catálogo.
- Este entregable, autorizado por el mensaje humano.

Se conservan los permisos por recurso/acción/alcance: no se introduce una segunda matriz de roles. La matriz efectiva sigue siendo la base de datos (`roles`, `permissions`, `users`), inicializada por `db/seed.sql`.

### Entradas, fronteras y amenazas del cambio

| Entrada | Actor/datos | Destino | Amenaza principal | Control y evidencia |
|---|---|---|---|---|
| Middleware de rutas privadas | Anónimo con cookie de rol y Host | Guardia de sesión | Suplantación mediante cookie y despliegue con flag antiguo | Triple condición; pruebas de API 401, página 307 y login público 200 en escenarios denegados |
| getActor / getEvaluationActor | Cookie de rol; sesión Supabase si existe | users → roles → permissions → actor RBAC | Elevación de privilegios, exposición de cartera ajena, identidad ficticia | Permisos del catálogo, usuario activo/no borrado, ID real; pruebas de denegación de administración/precios y cruce own |
| POST /api/auth/demo | JSON role, Host, anónimo | Catálogo → emisión de cookie | Rol inválido convertido a admin; sesión emitida fuera de evaluación; fuga de errores | 404 previo, Zod estricto, catálogo, HttpOnly, mensaje genérico; pruebas negativas y positivas |
| DELETE /api/auth/demo | Host, anónimo | Borrado de cookie | Superficie demo expuesta fuera de evaluación | Mismo control y 404; ninguna escritura de cookies en escenarios denegados |

Repudiación y trazabilidad de identidad: la evaluación actúa como un usuario real del catálogo; esta sesión no demuestra que dicho usuario humano realizó la acción. Responsable: D00/humano. Usarla únicamente para evaluación con datos de desarrollo; no se aprueba como mecanismo de autenticación real.

Integridad y confidencialidad: se mantienen las comprobaciones RBAC existentes; los tests nuevos intentan permisos administrativos y acceso a propietario ajeno y verifican denegación. DoS/rate limiting y auditoría de sesión quedan fuera de este fix y no se verificaron.

### Revisión de seguridad del cambio

- RLS/esquema: no se crearon ni modificaron tablas ni migraciones; el candado existente de RLS pasó.
- API: demo es una ruta pública declarada previamente; ahora su protección específica es el triple control. El candado global de permisos en rutas pasó. No se relajó ninguna otra guarda.
- Cuerpo: Zod estricto; sin asignación masiva ni fallback a admin.
- Variables: nueva lectura únicamente en env.ts; ninguna lectura directa de process.env queda en los otros tres archivos productivos intervenidos (verificado con rg).
- Autorización: filtros de usuario activo/no borrado aplicados tanto al candidato de evaluación como a la carga final; permisos nulos se descartan; ausencia de permiso sigue denegando.
- Errores: endpoint ya no serializa la excepción al cliente.
- Secretos: no se abrieron archivos .env, no se listó el entorno, no se inspeccionaron contenedores ni se conectó a DB. No se identificaron secretos reales en las salidas revisadas. Esto no equivale a un escaneo de secretos del repositorio/historial.
- La revisión anterior es una comprobación del productor, no la aprobación independiente del cambio.

## Pruebas

Entorno local: Windows/PowerShell, Node v24.18.0. Las pruebas usan dobles sintéticos; no se accedió a producción ni a bases reales. Commit y estado remoto: no verificados; no se usó git/gh. La evidencia identifica el contenido de archivos por SHA-256 más abajo.

Primera invocación de `npm run typecheck`: bloqueada porque PowerShell rechazó npm.ps1 sin firma (PSSecurityException). Se empleó `npm.cmd`, sin modificar la política del equipo.

Primera corrida de typecheck por npm.cmd: falló con TS7053 en el doble DB de la prueba nueva. Se corrigió anotando el catálogo de prueba como `CatalogRow[]`. La primera suite completa había pasado 382 pruebas; se añadieron después los casos de NODE_ENV y flag ausentes. La corrida final, presenciada en esta sesión, pasa 384/384, sin omisiones.

Comando final de tipos: `npm.cmd run typecheck -- --incremental false`, equivalente al script solicitado con caché incremental desactivada para no escribir tsbuildinfo fuera del alcance. Salida completa, exit code 0:

```text
> quisqueya-home-crm@0.1.0 typecheck
> tsc --noEmit --incremental false
```

Comando final de pruebas: `npm.cmd test`. Salida completa, exit code 0:

```text
> quisqueya-home-crm@0.1.0 test
> node --test "src/**/*.test.ts"

✔ upsert de meta de broker: el set solo toca target_* y updated_by, nunca achieved_* (4.6663ms)
✔ upsert de meta de la compañía: mismo set, conflicto por el índice parcial de broker_id nulo (0.9719ms)
✔ upsert de meta de broker: el set sí escribe target_deals, target_amount_cents y updated_by (0.6191ms)
✔ upsert de meta de la compañía: el set sí escribe target_* y updated_by (0.6528ms)
✔ adaptador real de metas: ningún achieved_* en el código, dos upserts y el targetWhere de la compañía (1.436ms)
✔ adaptador real de metas: lo que escribe en el conflicto es target_* y updated_by (1.017ms)
✔ adaptador real de pipeline (la otra mitad): el set de incrementarMetaAlcanzada solo escribe achieved_* y updated_by, nunca target_* (1.2674ms)
✔ Academy: listar contenidos devuelve los módulos iniciales con 0% de progreso (2.0223ms)
✔ Academy: filtrar contenidos por categoría (0.4999ms)
✔ Academy: completar un video actualiza el estado y la fecha de finalización (1.0301ms)
✔ Academy: marcar pasos de un checklist recalcula el porcentaje del módulo (0.9146ms)
✔ Academy: al completar todos los contenidos se otorga la certificación del broker (0.5649ms)
✔ crear: inserta, audita y actualiza la próxima acción del negocio (3.8075ms)
✔ crear: una actividad completada no reemplaza la próxima acción (0.5539ms)
✔ crear: un broker no puede sobrescribir la próxima acción de un negocio fuera de alcance (1.0106ms)
✔ editar: null borra un campo y ausencia lo conserva (0.9901ms)
✔ editar: completar fija completedAt y reabrir la limpia (0.8118ms)
✔ exportar ICS: respeta alcance y rango de lunes a sábado exclusivo (4.3942ms)
✔ borrar: marca la fila y audita; fuera de alcance devuelve NotFoundError (0.5659ms)
✔ procesarNotaDeVozLead: procesa texto directo y propone HITL (5.0678ms)
✔ procesarNotaDeVozLead: delega audio al proveedor de transcripción (5.437ms)
✔ asignar proyectos libres: se asignan y cada uno se audita con 'asignar' (8.3022ms)
✔ desasignar: lo que ya era del broker y no se pide, se suelta (1.4387ms)
✔ asignar y soltar a la vez: primero las asignadas, luego las soltadas (1.1231ms)
✔ sin cambios reales: no escribe ni audita nada y responde lista vacía (1.6754ms)
✔ lista vacía suelta todo lo que tenía el broker (0.948ms)
✔ reasignar un proyecto de otro broker lo toma (alcance all) (0.5448ms)
✔ un proyecto inactivo asignado hoy NO se desasigna solo (universo activo) (0.864ms)
✔ alcance distinto de all: 403 con el mensaje literal y nada escrito (2.8367ms)
✔ broker inexistente, inactivo o borrado: NotFoundError con el mensaje literal (1.2544ms)
✔ un proyecto que no existe, está borrado o inactivo: NotFoundError y no se asigna ninguno (1.2205ms)
✔ un fallo dentro de la transacción deshace las asignaciones y la auditoría (0.8875ms)
✔ alta en motivos-perdida: slug a partir del nombre, posición 0 y auditoría de loss_reason (5.6539ms)
✔ edición en motivos-perdida: solo las claves presentes, con antes/después y auditoría de loss_reason (0.8765ms)
✔ edición en motivos-perdida: una entrada inexistente da NotFoundError y no audita (1.2399ms)
✔ alta en canales: slug a partir del nombre, posición 0 y auditoría de lead_source (0.3382ms)
✔ edición en canales: solo las claves presentes, con antes/después y auditoría de lead_source (0.3564ms)
✔ edición en canales: una entrada inexistente da NotFoundError y no audita (0.295ms)
✔ el id de un tipo no se encuentra en el otro (0.3829ms)
✔ slug repetido: se añade el sufijo con el número de coincidencias + 1 (0.6413ms)
✔ alta con nombre sin letras ni dígitos usa el slug 'elemento'; con posición la respeta (0.4233ms)
✔ un fallo dentro de la transacción no deja fila ni auditoría (0.9562ms)
✔ esTipoCatalogo: solo las dos claves; un tipo desconocido (o heredado de Object) no pasa (0.4346ms)
✔ aprobar una pendiente: estado, aprobador y fecha, con su auditoría (5.3756ms)
✔ pagar una aprobada: estado y fecha de pago, sin tocar el aprobador (0.5226ms)
✔ anular una pendiente y una aprobada (0.6194ms)
✔ cambiar el reparto de una pendiente recalcula montos y deja el total (0.6366ms)
✔ transición inválida pending → paid: 409 con el mensaje del dominio y nada escrito (1.5266ms)
✔ transición inválida approved → approved: 409 con el mensaje del dominio y nada escrito (0.4301ms)
✔ transición inválida paid → void: 409 con el mensaje del dominio y nada escrito (0.3731ms)
✔ transición inválida paid → approved: 409 con el mensaje del dominio y nada escrito (0.5068ms)
✔ transición inválida void → approved: 409 con el mensaje del dominio y nada escrito (0.5481ms)
✔ transición inválida void → paid: 409 con el mensaje del dominio y nada escrito (0.6373ms)
✔ el reparto de una comisión no pendiente se rechaza con el mensaje literal (0.6437ms)
✔ una comisión inexistente es NotFoundError (0.3376ms)
✔ la comisión de un negocio borrado responde NotFoundError y no se escribe nada (0.3526ms)
✔ una comisión ajena con alcance own es NotFoundError; la propia se edita (0.4396ms)
✔ una comisión sin broker solo la alcanza `all` (0.3285ms)
✔ si al bloquear el estado ya cambió (otra petición ganó), la transición se decide con el estado REAL (0.4094ms)
✔ el reparto también se decide con el estado real tras el bloqueo (0.3409ms)
✔ un fallo del repositorio al escribir no deja ni cambio ni auditoría (0.3973ms)
✔ el CSV lleva el encabezado y el orden de columnas exactos (0.9058ms)
✔ sin proyecto, broker ni fecha: vacío, 'Sin asignar' y vacío (0.2619ms)
✔ el CSV de cero filas es solo el encabezado con BOM (0.2177ms)
✔ el nombre de archivo lleva el periodo (AAAA-MM) cuando hay filtro (0.29ms)
✔ el alcance filtra: un broker solo exporta lo suyo; all exporta todo (0.3811ms)
✔ el caso de uso pasa actor, alcance y filtros a la consulta tal cual (0.2555ms)
✔ un nombre que empieza como fórmula sale neutralizado (domain/csv.ts) (0.5546ms)
✔ el adaptador real bloquea SOLO la fila de commissions: .for("update", { of: commissions }) (2.2101ms)
✔ auditoría en memoria: registrar deja rastro del actor, la acción y la entidad (4.3441ms)
✔ auditoría en memoria: acepta un registro sin antes ni despues (0.3196ms)
✔ auditoría en memoria: los registros múltiples conservan el orden (0.2931ms)
✔ almacenamiento en memoria: urlsFirmadas devuelve una url por ruta, en el mismo orden (0.9037ms)
✔ almacenamiento en memoria: una ruta desconocida da null (0.3566ms)
✔ almacenamiento en memoria: subir sobre una ruta ocupada lanza ConflictError con el nombre visible (0.9317ms)
✔ almacenamiento en memoria: borrar quita el objeto y no lanza con rutas inexistentes (0.3925ms)
✔ almacenamiento en memoria: urlsFirmadas([]) devuelve [] (0.2388ms)
✔ admin de Auth en memoria: invitar devuelve un id no vacío o null (0.3811ms)
✔ admin de Auth en memoria: el correo invitado queda registrado (0.4109ms)
✔ unidad de trabajo en memoria: el callback recibe la misma identidad de repos (0.6427ms)
✔ unidad de trabajo en memoria: el valor devuelto por fn llega al llamante (0.2678ms)
✔ unidad de trabajo en memoria: si fn lanza, el error se propaga tal cual y no queda nada escrito (0.3776ms)
✔ almacenamiento en memoria: fallarAlSubirCon fuerza el motivo en el mensaje (0.6417ms)
✔ almacenamiento en memoria: ruta ocupada usa el motivo `El objeto ya existe.` (0.5425ms)
✔ almacenamiento en memoria: urlsFirmadas lleva la ruta y la vida en la url (0.3567ms)
✔ almacenamiento en memoria: fallarAlFirmarCon lanza ConflictError (0.4149ms)
✔ admin de Auth en memoria: numera los ids de usuario (0.2399ms)
✔ admin de Auth en memoria: fallarCon lanza ConflictError y no registra el correo (0.3389ms)
✔ admin de Auth en memoria: sinIdDeUsuario devuelve null pero registra el correo (0.2693ms)
✔ auditoría en memoria: guarda actor, antes y después (0.3125ms)
✔ unidad de trabajo en memoria: cuenta confirmadas y revertidas (0.4022ms)
✔ unidad de trabajo en memoria: restaura todos los reversibles si fn lanza (0.6876ms)
✔ crearPlantillaMensaje: extrae variables automáticamente y guarda (3.7527ms)
✔ crearPlantillaMensaje: rechaza nombre o cuerpo vacío (1.5264ms)
✔ prepararYDespacharMensaje: interpola variables y despacha por el canal (0.6803ms)
✔ actualizarPlantillaMensaje: actualiza y recalcula variables al cambiar el cuerpo (0.6605ms)
✔ crear: asigna responsable y autoría al actor y audita con la fila completa (4.4986ms)
✔ crear con teléfono duplicado sin crearIgual: ConflictError con candidatos, sin crear ni auditar (1.5315ms)
✔ crear con correo duplicado sin crearIgual: ConflictError, sin crear ni auditar (0.4671ms)
✔ crear con duplicado y crearIgual: crea (0.4326ms)
✔ crear sin teléfono ni correo: no consulta duplicados y crea (0.5538ms)
✔ crear normaliza el teléfono a E.164 y conserva lo que escribió el usuario (0.4141ms)
✔ editar: cambia solo los campos presentes y audita antes y después (1.1382ms)
✔ editar con phone null borra phone y phoneDisplay; sin la clave los deja igual (0.5732ms)
✔ editar con brokerId y alcance own: ForbiddenError y no escribe nada (0.7666ms)
✔ editar con brokerId y alcance all: reasigna (0.672ms)
✔ editar un contacto fuera del alcance: NotFoundError y no escribe (0.7007ms)
✔ borrar: escribe deletedAt, conserva la fila, audita eliminar y deja de verse (0.6204ms)
✔ borrar un id inexistente o fuera de alcance: NotFoundError (0.4063ms)
✔ un fallo dentro de la transacción no deja fila ni auditoría (0.6784ms)
✔ renombrar: cambia el nombre, deja lo demás y audita con antes/después (3.0822ms)
✔ defaultProbability: null la borra; ausente la deja (0.579ms)
✔ posición y activa se editan (0.4628ms)
✔ una etapa inexistente da NotFoundError y no audita (2.5591ms)
✔ kind y slug en la entrada NO cambian la fila guardada (0.8969ms)
✔ el tipo CambiosEtapa no admite kind ni slug (ni a mano) (0.426ms)
✔ el adaptador real arma el set de la etapa sin nombrar kind ni slug (2.0152ms)
✔ alta: crea contacto y lead, sugiere el broker de sugerirBroker y audita las dos filas con actor (7.9206ms)
✔ alta con contactId existente: no crea contacto y solo audita el lead (0.7629ms)
✔ alta con contactId que no existe o está borrado: NotFoundError y nada escrito (2.0342ms)
✔ alta con teléfono duplicado: ConflictError con candidatos; con crearIgual crea (1.0229ms)
✔ alta sin contactId ni nombre: ValidationError (protege al caso de uso de una entrada sin Zod) (0.7635ms)
✔ alta: un fallo dentro de la transacción no deja contacto, lead ni auditoría (1.3478ms)
✔ asignar: escribe brokerId y audita asignar con antes y después (1.2114ms)
✔ asignar a quien no es un broker activo: ValidationError literal y nada escrito (0.9457ms)
✔ asignar: el broker inválido gana al lead inexistente (se valida antes de leer el lead) (1.3063ms)
✔ asignar un lead fuera del alcance (o borrado): NotFoundError (1.181ms)
✔ asignar un lead PROPIO con alcance own funciona (H16: deliberado, comportamiento actual) (0.5488ms)
✔ descartar: marca discarded con el motivo y audita descartar (0.6957ms)
✔ descartar: guardas de estado con sus mensajes literales (0.6161ms)
✔ descartar un lead inexistente, borrado o fuera del alcance: NotFoundError (0.5741ms)
✔ webhook: la primera entrega crea contacto y lead, con dos filas de auditoría SIN actor, y responde creado (1.8014ms)
✔ webhook repetido con el mismo externalId: no duplica, devuelve el existente con creado false y NO audita (0.7939ms)
✔ webhook: un lead borrado con ese externalId no cuenta (el índice único es parcial) (1.2539ms)
✔ webhook con teléfono o correo de un contacto existente: lo reutiliza y no crea otro (1.7224ms)
✔ webhook sin teléfono ni correo: crea un contacto nuevo (0.5394ms)
✔ webhook: un fallo a mitad (al auditar el lead) no deja contacto, lead ni auditoría (0.811ms)
✔ la idempotencia del webhook sigue siendo un upsert atómico, con el predicado del índice parcial (1.6547ms)
✔ convertir: crea el negocio en la primera etapa abierta, marca el lead convertido y audita (6.9135ms)
✔ convertir un lead sin responsable ni tipo de operación: el negocio queda con quien convierte y en venta (0.6339ms)
✔ convertir: guardas de estado con sus mensajes literales (1.542ms)
✔ convertir sin etapa inicial en el embudo: ConflictError y nada escrito (0.6067ms)
✔ convertir un lead inexistente, borrado o fuera del alcance: NotFoundError (0.8303ms)
✔ convertir un lead propio con alcance own funciona (0.5313ms)
✔ un fallo a mitad de la conversión no deja negocio, lead convertido ni auditoría (0.9383ms)
✔ fijar la meta de un broker crea la fila y la audita como 'crear' (5.2995ms)
✔ fijar la meta de la compañía (brokerId nulo) no pide perfil de broker (0.4571ms)
✔ fijar la meta NO toca achieved_*: si ya había valores, siguen igual (1.2252ms)
✔ fijar dos veces el mismo periodo actualiza en vez de duplicar, y la segunda se audita como 'editar' (0.6384ms)
✔ la meta del broker y la de la compañía del mismo periodo son filas distintas (0.7645ms)
✔ sin targetAmountCents en la edición, el monto que ya había se conserva (0.4605ms)
✔ un broker sin perfil: NotFoundError con el mensaje literal y nada escrito (1.5051ms)
✔ alcance own: la propia meta sí; la de otro broker y la de la compañía, 403 con el mensaje literal (0.896ms)
✔ un fallo dentro de la transacción no deja meta ni auditoría (0.7507ms)
✔ restaurar contact: quita deletedAt, audita con la entidad correcta y solo escribe deletedAt (4.3348ms)
✔ restaurar lead: quita deletedAt, audita con la entidad correcta y solo escribe deletedAt (0.4427ms)
✔ restaurar deal: quita deletedAt, audita con la entidad correcta y solo escribe deletedAt (2.4738ms)
✔ restaurar project: quita deletedAt, audita con la entidad correcta y solo escribe deletedAt (0.308ms)
✔ restaurar unit: quita deletedAt, audita con la entidad correcta y solo escribe deletedAt (0.3709ms)
✔ restaurar user: quita deletedAt, audita con la entidad correcta y solo escribe deletedAt (0.3334ms)
✔ restaurar algo que no está borrado da NotFoundError y no audita (1.1638ms)
✔ restaurar algo inexistente da NotFoundError (0.3805ms)
✔ una fila sin columna deletedAt da NotFoundError (0.4914ms)
✔ el mismo id en otra entidad no cuenta (0.7653ms)
✔ un fallo dentro de la transacción deja la fila borrada y sin auditoría (0.877ms)
✔ cambio simple: escribe el historial y audita cambiar_etapa con antes y despues (7.0989ms)
✔ cambio a una etapa con requisito sin cumplir: ConflictError de transicion-etapa y nada escrito (1.7304ms)
✔ presentación exige una próxima acción vigente: pendiente, con responsable y fecha (5.7103ms)
✔ un negocio ya cerrado no cambia de etapa (0.8947ms)
✔ pérdida con motivo: audita marcar_perdido y guarda lossReasonId y lossComment (0.8423ms)
✔ pérdida sin comentario guarda lossComment en null (0.6341ms)
✔ pérdida sin motivo: el ConflictError de transicion-etapa y nada escrito (0.7946ms)
✔ negocio de otro broker con alcance own: NotFoundError, igual que uno inexistente (1.7872ms)
✔ con alcance all un administrador mueve el negocio de otro broker (0.7717ms)
✔ negocio en la papelera: NotFoundError (0.7782ms)
✔ etapa destino inexistente o inactiva: NotFoundError con su mensaje (0.6604ms)
✔ etapa actual que ya no existe en el embudo: ConflictError (0.5359ms)
✔ editar: null borra el campo, ausente lo deja, y audita editar con antes y despues (1.522ms)
✔ editar un negocio cerrado: ConflictError y nada escrito (0.4418ms)
✔ editar un negocio ajeno, borrado o inexistente: NotFoundError (1.23ms)
✔ asociar: crea la propiedad, desmarca la principal anterior y audita crear deal_property (0.9246ms)
✔ asociar sin isPrimary no toca la principal existente (0.5715ms)
✔ asociar un proyecto fuera del alcance sobre projects: NotFoundError con su mensaje (0.6696ms)
✔ asociar una unidad de otro proyecto: NotFoundError con su mensaje y nada escrito (0.5325ms)
✔ asociar a un negocio cerrado: ConflictError (0.5366ms)
✔ marcar principal: desmarca las demás y audita editar con antes y despues (0.7817ms)
✔ marcar o quitar una propiedad de otro negocio: NotFoundError (0.8004ms)
✔ quitar: borra la propiedad y audita eliminar solo con antes (0.3699ms)
✔ quitar en un negocio cerrado: ConflictError y la propiedad sigue (0.283ms)
✔ cierre completo: ocurren los ocho pasos, en una sola unidad de trabajo (77.977ms)
✔ cierre sin monto en el body usa el monto que ya tenía el negocio (2.4653ms)
✔ cierre de un alquiler deja la unidad reservada, no vendida (1.7515ms)
✔ cierre sin unidad principal resuelta: ConflictError de transicion-etapa y nada escrito (2.5337ms)
✔ dos cierres del mismo periodo SUMAN en la misma fila de meta, no crean otra (4.0774ms)
✔ una meta que ya existe para el periodo se suma, sin tocar su target (1.8502ms)
✔ el perfil se RECALCULA con el total ganado del año, no se incrementa (2.3005ms)
✔ cierre de un negocio cuyo broker no tiene perfil: no falla y no recalcula nada (1.1965ms)
✔ cierre de un negocio sin responsable: solo incrementa la meta de la compañía (1.4054ms)
✔ cierre sin commissionBasisPoints: ConflictError con el mensaje exacto y nada escrito (2.1791ms)
✔ defensa 2: si el bloqueo revela que la etapa ya no es open, ConflictError del doble cierre y nada escrito (1.2966ms)
✔ defensa 2 también frente a una pérdida que ganó la carrera (0.8692ms)
✔ cerrarNegocioGanado directo: un negocio que no existe detrás del bloqueo es NotFoundError (0.5664ms)
✔ un fallo a mitad del cierre no deja nada escrito (2.8491ms)
✔ el adaptador real bloquea la fila del negocio: bloquearNegocio usa .for("update") (1.8774ms)
✔ el upsert de la meta de compañía conserva el targetWhere de su índice parcial (1.0732ms)
✔ el recálculo anual conserva la zona horaria de Santo Domingo (1.0758ms)
✔ proyectos y unidades: alta, edición, borrado y auditoría (5.5435ms)
✔ fases: recalcula avance al crear, editar y borrar (2.2298ms)
✔ fotos: compensa exactamente las subidas y conserva el error del INSERT (12.5275ms)
✔ fotos: el nombre visible nunca decide la ruta del bucket (1.2627ms)
✔ alcance own: proyecto ajeno no escribe ni audita fases, fotos ni unidades (1.9908ms)
✔ los permisos del rol administrador no son editables (5.0918ms)
✔ la matriz normal reemplaza celdas ausentes y audita (0.884ms)
✔ el ultimo administrador no se puede editar ni borrar, y no escribe ni audita (5.5548ms)
✔ alcance own no puede editar ni borrar, ni su propia fila (1.048ms)
✔ alta usa AdminAuth, conserva el orden y registra auditoria (2.785ms)
✔ edicion y borrado normales auditan, y el reenvio llama al puerto (1.0691ms)
✔ coincide por especialidad contra el proyecto o la zona de interés (4.7364ms)
✔ coincide por handlesRentals cuando la operación es de alquiler, aunque la especialidad no calce (0.4382ms)
✔ sin ningún candidato que coincida, devuelve null (0.3258ms)
✔ sin candidatos, devuelve null sin lanzar (0.2581ms)
✔ con varios candidatos que coinciden, desempata por menor annualSalesCents (reparte carga) (0.5385ms)
✔ empate exacto en annualSalesCents conserva el primero del orden recibido (0.3367ms)
✔ operationType null u operación de venta no activa la coincidencia por handlesRentals (0.2406ms)
✔ diffAsignacion no toca lo que ya estaba igual (6.3388ms)
✔ diffAsignacion detecta lo nuevo y lo soltado (0.3539ms)
✔ diffAsignacion vacío a vacío no hace nada (0.2496ms)
✔ diffAsignacion desasigna todo cuando no se elige ninguno (0.9376ms)
✔ AudioLeadExtractor: extrae prospecto de compra en Bávaro (4.2644ms)
✔ AudioLeadExtractor: extrae alquiler en Santo Domingo Piantini (1.9031ms)
✔ AudioLeadExtractor: extrae rango de lujo en Cap Cana con teléfono dominicano (0.7661ms)
✔ AudioLeadExtractor: texto vacío no revienta y devuelve confianza 0 (0.3544ms)
✔ promedioAvance sin fases es 0, no NaN (2.345ms)
✔ promedioAvance redondea al entero más cercano (0.3596ms)
✔ promedioAvance con una sola fase es su propio porcentaje (0.2541ms)
✔ FASES_ESTANDAR trae exactamente las 8 fases del prototipo (0.2115ms)
✔ validarFoto rechaza un mime type que no es imagen (0.4828ms)
✔ validarFoto rechaza SVG aunque su mime empiece con image/ (0.2506ms)
✔ validarFoto rechaza una imagen de más de 10 MB (0.3074ms)
✔ validarFoto acepta cada formato ráster permitido dentro del límite (0.3875ms)
✔ validarFoto acepta exactamente el límite de 10 MB (0.3114ms)
✔ calcularComision: reparto 50/50 sobre un monto y comisión sin decimales exactos (1.8665ms)
✔ calcularComision: la suma broker + agencia siempre cuadra con el total, incluso cuando el reparto no divide exacto (0.3656ms)
✔ calcularComision: sin reparto explícito usa el 50/50 por defecto del esquema (0.3286ms)
✔ evaluarNivelBroker: por debajo del primer corte es junior (0.4716ms)
✔ evaluarNivelBroker: exactamente en el corte confirmado por el prototipo sube a senior (0.3783ms)
✔ evaluarNivelBroker: sube de nivel en cada corte sucesivo (0.3915ms)
✔ evaluarNivelBroker: un valor muy por encima del último corte se queda en el nivel máximo (0.3296ms)
✔ pending → approved es válida (1.947ms)
✔ approved → paid es válida (0.2813ms)
✔ pending → void es válida (0.2473ms)
✔ approved → void es válida (0.2438ms)
✔ pending → paid lanza: no se puede saltar la aprobación (0.8672ms)
✔ paid → pending lanza: una comisión pagada no retrocede (0.2631ms)
✔ paid → cualquier otro estado lanza (0.2746ms)
✔ void → cualquier otro estado lanza (1.8405ms)
✔ quedarse en el mismo estado siempre lanza (0.543ms)
✔ el reparto se puede editar mientras la comisión está pendiente (0.4734ms)
✔ editar el reparto de una comisión aprobada lanza (0.2844ms)
✔ editar el reparto de una comisión pagada o anulada lanza (0.4517ms)
✔ renderizarPlantilla: reemplaza variables encontradas y deja intactas las ausentes (2.5237ms)
✔ extraerVariablesDePlantilla: encuentra todas las variables únicas (2.4129ms)
✔ generarEnlaceTelegram: genera enlace universal t.me sin costo (0.5288ms)
✔ generarEnlaceWhatsApp: normaliza teléfono y arma enlace wa.me (0.4448ms)
✔ validarTokenTelegram: detecta tokens oficiales válidos e inválidos (0.5821ms)
✔ validarConfiguracionCanal: valida configuraciones por canal (0.4777ms)
✔ Confotur: cálculo estándar de US$150,000 con 24 meses de construcción (3.0007ms)
✔ Confotur: propiedad de lujo de US$500,000 (0.5516ms)
✔ Confotur: rechaza si la suma de porcentajes no da 100% (1.0183ms)
✔ un campo sin coma, comilla ni salto de línea se deja tal cual (2.2275ms)
✔ un campo con coma va entre comillas (0.393ms)
✔ un campo con comillas dobles las duplica y va entre comillas (0.2663ms)
✔ un campo con salto de línea va entre comillas (0.2615ms)
✔ filaCsv escapa cada campo y los une con comas (0.3453ms)
✔ un campo que empieza con = lleva un ' de escape antes (0.2317ms)
✔ un campo que empieza con +, -, @ o tab también lleva el ' (0.2683ms)
✔ un campo que empieza con retorno de carro lleva el ' y además va entre comillas (\r también es un separador RFC 4180) (0.2373ms)
✔ una fórmula que además trae coma queda escapada Y entre comillas (0.3218ms)
✔ filaCsv no aplica el escape de fórmula a números: un negativo se serializa tal cual (0.5283ms)
✔ generarCsv arma encabezado + filas con BOM y \r\n (2.1529ms)
✔ el UID es estable: exportar dos veces el mismo evento da el mismo UID (6.2054ms)
✔ sin endsAt, asume una hora de duración (0.3976ms)
✔ escapa comas y punto y coma del título (0.3749ms)
✔ sin ubicación, no escribe LOCATION (0.5248ms)
✔ una agenda vacía sigue siendo un .ics válido (0.3783ms)
✔ parsearPeriodo con ?periodo= válido usa ese año y mes (3.9799ms)
✔ parsearPeriodo sin parámetro cae al mes actual en Santo Domingo (44.1106ms)
✔ parsearPeriodo ignora un valor con formato inválido y usa el mes actual (0.7833ms)
✔ parsearPeriodo rechaza un mes fuera de 1-12 y usa el mes actual (0.6878ms)
✔ formatoPeriodo rellena el mes con cero a la izquierda (0.4982ms)
✔ cumplimientoPorcentaje con meta en 0 no divide entre cero: sin meta fijada (0.3435ms)
✔ cumplimientoPorcentaje redondea al entero más cercano (0.3236ms)
✔ esMetaCumplida es falso sin meta fijada, aunque haya negocios logrados (0.306ms)
✔ esMetaCumplida es verdadero al alcanzar o superar la meta (0.47ms)
✔ nombreMes no retrocede un mes en husos al oeste de UTC (2.7288ms)
✔ sin fila de permiso el alcance es none: un recurso nuevo nace cerrado (2.2089ms)
✔ el permiso es por acción, no por recurso (0.3226ms)
✔ requireScope lanza 403 cuando no hay permiso, y devuelve el alcance cuando lo hay (1.1004ms)
✔ requireFullScope exige alcance all: own sobre users no basta para gestionar usuarios (0.6243ms)
✔ con alcance own solo se alcanzan los registros propios (0.364ms)
✔ con alcance all se alcanza cualquier registro, incluso sin responsable (0.2828ms)
✔ team se comporta como own mientras no exista modelo de equipos (0.4034ms)
✔ con alcance none no se alcanza nada, ni el registro propio (0.221ms)
✔ el precio real se borra en servidor si falta el permiso unit_real_price (2.1692ms)
✔ minúsculas y espacios a guiones (1.987ms)
✔ quita acentos (0.4466ms)
✔ colapsa símbolos y recorta guiones en los extremos (0.3217ms)
✔ un número de RD con guiones y espacios se normaliza a E.164 (4.0145ms)
✔ un número que ya viene en E.164 se conserva (0.9785ms)
✔ un número que no es de RD no se normaliza, pero se conserva el texto (0.2995ms)
✔ un número con menos o más dígitos de los que hacen falta no se normaliza (0.3363ms)
✔ vacío, solo espacios o undefined no rompen y devuelven null en los dos campos (0.4419ms)
✔ una transición sin requisito propio en §10.1 (la primera del embudo) no lanza nada (3.9304ms)
✔ → Contactado: pasa con actividad de contacto registrada (0.2598ms)
✔ → Contactado: lanza sin ninguna actividad de contacto (0.7201ms)
✔ → Presentación: pasa con próxima acción con responsable y fecha (0.2239ms)
✔ → Presentación: lanza sin próxima acción (0.2255ms)
✔ → Preselección: pasa con al menos una fila en deal_properties (0.2424ms)
✔ → Preselección: lanza sin ninguna propiedad de interés (0.2692ms)
✔ → Negociación: pasa con monto, probabilidad, comisión y fecha estimada (0.3361ms)
✔ → Negociación: lanza si falta el monto (0.8731ms)
✔ → Negociación: lanza si falta la probabilidad, aunque el resto esté completo (0.5548ms)
✔ → Negociación: lanza si falta el porcentaje de comisión (0.4312ms)
✔ → Negociación: lanza si falta la fecha estimada de cierre (0.301ms)
✔ → Cierre (won): pasa con monto final y unidad principal definida (0.2076ms)
✔ → Cierre (won): lanza sin monto final, aunque haya unidad principal (0.2492ms)
✔ → Cierre (won): lanza sin unidad principal aunque haya monto — son requisitos independientes (0.4013ms)
✔ → Perdido (lost): pasa con motivo del catálogo loss_reasons (0.303ms)
✔ → Perdido (lost): lanza sin motivo (0.292ms)
✔ un negocio ya ganado no puede volver a transicionar (0.2296ms)
✔ un negocio ya perdido no puede volver a transicionar (0.2022ms)
✔ las 21:00 del 31 de enero en Santo Domingo dan 2026-01-31, no 2026-02-01 (44.8323ms)
✔ una hora que ya cae del lado de Santo Domingo no cambia de día (0.5213ms)
✔ medianoche UTC del día 1 todavía es el día anterior en Santo Domingo (0.478ms)
✔ horaSantoDomingo: las 13:00 UTC son las 9:00 locales (2.085ms)
✔ medianocheSantoDomingo: la medianoche local del 24 de julio es las 4:00 UTC (0.6464ms)
✔ lunesDeLaSemana: un viernes retrocede al lunes de esa misma semana (0.3203ms)
✔ lunesDeLaSemana: un lunes se devuelve a sí mismo (0.2148ms)
✔ lunesDeLaSemana: un domingo pertenece a la semana que empezó el lunes anterior (0.2306ms)
✔ sumarDias: cruza el fin de mes (0.3938ms)
✔ los archivos de src/ se encuentran (la prueba no se queda vacía sin avisar) (1.3406ms)
✔ domain/ no depende de nada fuera de domain/ (15.2302ms)
✔ application/ no conoce la infraestructura ni el framework (34.7192ms)
✔ infrastructure/ no importa src/app/ (19.7484ms)
✔ un módulo migrado ya no toca la base desde src/app/ (54.1697ms)
✔ serializa antes/después a JSON y escribe en la tabla audit_log (1.492ms)
✔ deja previousValue y newValue en null cuando antes/después no vienen (0.3223ms)
✔ registra el autor, la acción y la entidad tal como se le pasan (0.2361ms)
✔ usa la transacción que recibe, no una conexión propia (0.2906ms)
✔ si la transacción falla (como en un rollback), auditar no absorbe el error (0.6165ms)
✔ evaluación denegada en middleware, actor y demo: producción con flag y antiguo demo activos (217.1059ms)
✔ evaluación denegada en middleware, actor y demo: test con flag activo (63.3472ms)
✔ evaluación denegada en middleware, actor y demo: sin NODE_ENV (45.2458ms)
✔ evaluación denegada en middleware, actor y demo: sin flag explícito (31.7079ms)
✔ evaluación denegada en middleware, actor y demo: flag desactivado (33.3321ms)
✔ evaluación denegada en middleware, actor y demo: flag true en lugar de 1 (30.7517ms)
✔ evaluación denegada en middleware, actor y demo: host remoto (36.7195ms)
✔ evaluación denegada en middleware, actor y demo: IP no local (30.9854ms)
✔ evaluación denegada en middleware, actor y demo: subdominio engañoso (37.3291ms)
✔ evaluación denegada en middleware, actor y demo: lista de hosts (27.6409ms)
✔ evaluación denegada en middleware, actor y demo: URL en host (23.4363ms)
✔ evaluación denegada en middleware, actor y demo: sin host (23.1614ms)
✔ evaluación habilitada explícitamente en localhost (33.4137ms)
✔ evaluación habilitada explícitamente en localhost:9300 (26.5513ms)
✔ evaluación habilitada explícitamente en 127.0.0.1 (25.1617ms)
✔ evaluación habilitada explícitamente en 127.0.0.1:9300 (26.2144ms)
✔ broker conserva permisos del catálogo, identidad real y aislamiento own (39.475ms)
✔ assistant no obtiene administración, borrado ni precios internos (23.8044ms)
✔ cookie/rol unknown no se convierte en administrador (25.8603ms)
✔ cookie/rol inactive no se convierte en administrador (24.1507ms)
✔ cookie/rol deleted no se convierte en administrador (25.6433ms)
✔ cookie/rol vacío no se convierte en administrador (38.8778ms)
✔ catálogo sin permisos deniega y cambios de permisos se reflejan (57.273ms)
✔ JSON inválido, ausente o con campos extra no crea cookie (23.1423ms)
✔ fallo DB devuelve mensaje genérico sin detalles internos (22.8045ms)
✔ sesión Supabase válida sigue funcionando en producción sin aceptar rol de cookie (21.1997ms)
✔ alcance own filtra por el responsable, con el id del actor como parámetro (3.6521ms)
✔ alcance all no añade condición: no hay nada que restringir (0.2493ms)
✔ team filtra igual que own mientras no exista modelo de equipos (0.3925ms)
✔ alcance none no devuelve nada, aunque alguien se salte requireScope (0.2355ms)
✔ visibleRows descarta siempre la papelera además de aplicar el alcance (0.7422ms)
✔ visibleRows con alcance all sigue descartando la papelera (0.4019ms)
✔ toda tabla creada en una migración tiene RLS activado (5.2068ms)
✔ toda ruta de la API comprueba permisos en servidor, salvo las públicas declaradas (81.3ms)
ℹ tests 384
ℹ suites 0
ℹ pass 384
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 3220.1024
```

### Contenido verificado

| Archivo | SHA-256 |
|---|---|
| src/middleware.ts | D2F02F8524613F75A15C069CB83DDB927B25DE66FDB0D04C7F581ED31A5B11A5 |
| src/infrastructure/auth/actor.ts | 6AD72915AF1BC7DA2E6258E881325BD9414EA0836FD929A39FE6D63BB3F94038 |
| src/infrastructure/env.ts | 1FA88D852631016A4C1A75BE4BFC139B6E7B565C08659C8A503ACFAD8DB760FF |
| src/app/api/auth/demo/route.ts | CC1ECC0080382C94B38FD4D8E30828A84847F00667D401BE56B0D7D7A0837BA1 |
| src/infrastructure/auth/evaluation-login.test.ts | 7CEACDB487CF7164B4B3092FA5CE3C34F7E99BA049EEAC0547D97DD139DCD278 |

### No verificado / riesgos residuales

- **Host no demuestra origen loopback** (`src/infrastructure/env.ts:47` y consumidores): la cabecera puede ser manipulada. En desarrollo con opt-in, un servidor expuesto a la red o proxy que acepte Host local podría permitir evaluación desde una conexión remota. La protección de producción sí se prueba independientemente del Host. D16/humano debe verificar binding a loopback y política del proxy; el fix cumple la condición de host solicitada, sin afirmar aislamiento de red.
- **Identidad de evaluación real** (`src/infrastructure/auth/actor.ts:49`): requiere un usuario activo del rol y catálogo DB disponible. Elige el menor ID activo de ese rol; sus acciones alcanzan datos propios según ese ID. No se verificó que la configuración DB local apunte exclusivamente a datos de prueba. D00/D16/humano deben confirmar ese entorno antes de usarlo.
- **Middleware solo comprueba existencia de cookie bajo el triple control** (`src/middleware.ts:60`): validez del rol/usuario se resuelve después en actor y endpoint. Una cookie de rol desconocido en evaluación local puede atravesar la guarda de sesión, pero no obtiene actor ni permisos; probado en actor. La experiencia visual de ese caso no se verificó.
- **E2E/DB/proxy:** no se ejecutaron navegador, peticiones a servidor vivo, integración SQL contra DB, TLS, ni análisis de binding. El doble DB no demuestra comportamiento del proveedor ni políticas RLS en ejecución.
- **Scanners:** Gitleaks, Trivy/SBOM, CodeQL y ZAP no ejecutados; historial, dependencias y hardening general no verificados. No se afirma conformidad ASVS ni certificación; no se verificaron fuentes/versiones externas en esta tarea.
- **Otros checks:** lint no ejecutado en este despacho acotado; build/dev no ejecutados por la restricción del repositorio. No hay despliegue, migración, commit, push, cierre de issue ni aprobación de gate/C1.
- ORQ-02 y los demás hallazgos no se modificaron ni se dieron por resueltos.

## Handoff

**Revisor canónico: humano (Wilber), independiente del productor D12.** D00 coordina; D14 puede repetir la regresión; D16 verifica la frontera de red y el entorno de datos. D12 no aprueba este cambio ni acepta los riesgos residuales.

Paquete de entrada: `.viltrum/dispatch/20261003T192628Z-D12-codex/PERFIL.md`, `TAREA.md`, `.viltrum/crm-ux/HALLAZGOS-orquestador-2026-10-03.md` (ORQ-01), `docs/R_RELEVO.md`, `docs/contexto/`, router/manifest D12 y fuentes del mecanismo de autenticación.

Paquete de salida: los cinco archivos productivos/prueba enumerados, hashes, revisión acotada y salidas completas de typecheck/test en este informe. Estado final local: tipos en verde y 384 pruebas en verde; ORQ-01 pendiente de revisión independiente, sin cierre ni autorización de producción.

Siguiente acción del revisor:

1. Revisar los cambios contra la tarea y los hashes; repetir typecheck y npm test sobre el contenido recibido.
2. Confirmar con D16 un servidor de evaluación ligado a loopback y DB de desarrollo, sin exponer configuración secreta.
3. Ejecutar E2E con roles reales de prueba: producción/host remoto → demo 404 y cookie sin acceso; desarrollo local sin opt-in → denegado; con opt-in → permisos del catálogo, assistant sin administración/precios, broker sin cartera ajena.
4. Registrar su decisión independiente sobre ORQ-01. Los procesos de commit/push/relevo y cierre quedan al responsable autorizado; este entregable no los sustituye.

