# D09 · Afinado de Inicio · fase 1

Fecha: 2026-10-03. Dispatch: `20261003T223136Z-D09-codex`.
Clasificación: BUG/CAMBIO_UI · CRM/ERP · R3 · construcción acotada D09.
Revisores: D14 (QA) y D07 (accesibilidad).

**Resultado:** ajustes de KPI y fecha implementados y comprobados en render aislado. Se retiró la identidad nominal ficticia del saludo. El nombre autenticado sigue pendiente de contrato D03/D10. TypeScript y 448 pruebas pasan; lint termina con una advertencia preexistente. **Build fallido por bloqueo de red al descargar fuentes. No se declara entrega aceptada ni todos los checks en verde.**

## Cambios

### Alcance y fuentes

Se leyeron completos el `PERFIL.md`, la skill `skills/patron-consola/SKILL.md` y `TAREA.md` del dispatch. También se consultaron `docs/R_RELEVO.md`, el contexto del proyecto, `docs/DESIGN.md`, routing, C1 y los insumos D05/D03/D06.

`.viltrum/commercial.md` registra C1 activo, actualizado el 2026-10-03. La tarea específica de este dispatch autoriza vistas/CSS y build local; se aplicó sobre el reparto anterior de Codex como probador exclusivo. No se ejecutaron git/gh, dev, despliegues, migraciones ni mutaciones de datos. No se abrieron subagentes ni se emitió aprobación independiente.

`d05f4ff` es el commit de referencia indicado por la tarea. **NV:** correspondencia del worktree con ese commit, publicación, CI remota y ascendencia; no se usó git para certificarlas.

Archivos de producto editados, todos dentro de vistas/CSS:

| Archivo | Cambio |
|---|---|
| `src/app/(crm)/inicio/vista.tsx:23` | Saludo neutral `Hola`, previsto por D03; ya no renderiza `metricas.saludoNombre`. |
| `src/app/(crm)/inicio/vista.tsx:30` | Clase específica `inicio-header-actions` para fecha y acción. |
| `src/app/(crm)/inicio/vista.tsx:38` | Clase específica `inicio-metrics` en el resumen KPI. |
| `src/app/(crm)/inicio/page.tsx:24` | Se retiran los nombres fijos por rol; se pasa cadena vacía al argumento existente `actorName`. |
| `src/app/tokens.css:177` | Recetas responsive de Inicio dentro de la capa `utilities`. |

El único archivo adicional editado es este entregable. Los artefactos normales de los verificadores y logs temporales no son cambios de producto.

### KPI 2×2 legibles

Se reutiliza `Metric`, sin instalar dependencias ni duplicar la primitiva. P0: adaptar el componente local existente satisface este ajuste; no se requiere un componente externo.

En Inicio, a **≤720 px**, la cuadrícula usa `repeat(2, minmax(0, 1fr))`. Incluye el requisito ≤480 px y evita volver a una columna a 481 px. La receta se acota a `.inicio-metrics`; las demás pantallas conservan sus recetas.

Las tarjetas permiten wrapping, tienen `min-width: 0`, padding de 16 px y alineación superior. Etiqueta y nota usan 13/18 px, sin mayúsculas forzadas; cifra usa 26/32 px. Se quitan los pseudo-divisores heredados de la composición en una columna, conservando los bordes de las tarjetas. No se oculta ni trunca el contenido para hacerlo caber.

La receta vive en la misma capa `utilities` con selectores específicos: el padding/tamaño del `Metric` utiliza clases Tailwind que ganarían a una corrección puesta solamente en `globals.css` dentro de `legado`. **No se reordenaron capas/imports ni se activó preflight.** Colores, fuentes, radios y superficies siguen usando los tokens existentes.

### Fecha compacta

La fecha conserva íntegro `fechaTexto` y usa `white-space: nowrap`. En móvil ocupa su propia línea encima del botón, alineada al inicio, con 14 px y padding 8/12 px. El botón conserva su texto/destino y tiene mínimo 48 px de alto. En escritorio se conserva la agrupación horizontal con posibilidad de envolver elementos completos.

No se parsea el texto de fecha, no se crea una segunda fecha ni se afirma que represente sincronización. Zona horaria y procedencia siguen siendo las del contrato existente.

### Nombre autenticado: límite verificado y mitigación

**Verificado en fuente:**

- `src/domain/rbac.ts:37–39`: Actor contiene `userId`, `roleSlug` y `permissions`; no contiene nombre.
- `src/infrastructure/auth/actor.ts:61–93`: la selección y retorno del actor tampoco exponen nombre.
- `src/application/dashboard/puertos.ts:38`: el puerto recibe `actorName` desde el llamador; no resuelve por sí mismo identidad autenticada.
- `src/infrastructure/db/repos/dashboard.ts:75`: `saludoNombre` toma el primer fragmento de ese argumento o el fallback genérico `Asesor`.

Antes, `inicio/page.tsx` suministraba nombres fijos por rol. Ahora no suministra ninguno y la vista no consume ese campo como identidad. Un DTO de prueba cuyo `saludoNombre` contiene una identidad ficticia produce `h1 = Hola` en las tres variantes.

**Pendiente D03/D10:** exponer un nombre de presentación autorizado y ligado al usuario autenticado por un contrato de lectura apropiado, con su comportamiento cuando falte. El campo actual no acredita esa identidad. Después, D09 podrá consumirlo con el copy aprobado. No se añadió una consulta de usuarios a la página, una llamada nueva de Auth ni un SDK a la vista; no se tocaron domain/application/infrastructure.

El sistema i18n oficial no se localizó, coincidiendo con el insumo D05/D03/D06. `Hola` reutiliza el texto neutral especificado allí. La consolidación del catálogo continúa pendiente de D03/D08; este ajuste no crea un diccionario paralelo ni pretende resolver la deuda de textos del proyecto.

### Seguridad de los cambios

Se recorrió §6 de `docs/contexto/flujo-de-trabajo.md` y se revisaron los cambios propios:

- Correcto: `inicio/page.tsx:17–18` mantiene `requireActor` y `requireScopeInPage` antes de la lectura.
- Correcto: no se añaden tablas, vistas SQL, API, JSON, redirecciones, uploads, CSV, variables de entorno, almacenamiento cliente ni HTML crudo.
- Correcto: los cambios son presentación y eliminación de nombres de muestra; no añaden permisos ni reglas comerciales.
- Las guardas de arquitectura, RLS y permisos de API pasan dentro de la corrida propia de `npm test`.
- No se leyeron archivos de secretos, se listó el entorno ni se ejecutó `docker inspect`. No se escribieron credenciales en producto, informe o harness. No se identificó un secreto en las salidas observadas.

**Riesgo heredado, fuera de este ajuste:** `inicio/page.tsx:28` sigue serializando el DTO completo al cliente tras comprobar únicamente Dashboard; el insumo D03 documenta agregados globales y datos de muestra en el adaptador. Escenario para D12/D14: sesión Broker/Asistente con permisos reducidos y revisión del payload para comprobar si contiene agregados ajenos a su alcance. **Exposición efectiva NV**; no se declara incidente confirmado ni corrección de ese contrato.

### Identificación del resultado sin git

SHA256 observado tras los cambios:

| Archivo | SHA256 |
|---|---|
| `src/app/(crm)/inicio/vista.tsx` | `C78114E1383BB1BF4C4217DADCC02D7E484969E2C2212E85D230AB30C7BDDDBF` |
| `src/app/(crm)/inicio/page.tsx` | `46D484CC1F271D0535A4C84A1EA665E12F7BCB0C6FDF8AA38E00F2235DFE82E9` |
| `src/app/tokens.css` | `D302DF8AC7704E120398559EE784B81FBC41F9F1E21B32F4787990FC3C9E846B` |

## Pruebas

### Verificadores ejecutados

| Comando | Resultado observado |
|---|---|
| `npx.cmd tsc --noEmit` | Exit 0, sin diagnósticos. Repetido tras retirar los nombres en la página. |
| `npm.cmd test` | Exit 0; 448/448 pasan, 0 fallos, 0 omitidas. Corrida final sobre los cambios finales. |
| `npm.cmd run lint` | Exit 0; 0 errores, 1 advertencia preexistente en `src/app/login/page.tsx:17` por `<img>`. |
| `npm.cmd run build` | **Exit 1**: `next/font` no pudo descargar Atkinson Hyperlegible Next ni Hanken Grotesk; conexión HTTPS bloqueada con `EACCES`. |

Build observado con Next.js **15.5.24**. La corrida falló antes de la última retirada del argumento nominal en `page.tsx`; no se repitió una descarga bloqueada después de ese cambio. TypeScript/tests/lint sí se repitieron sobre los archivos finales. **No hay build final en verde.** No se cambiaron configuración de fuentes, layout ni restricciones del entorno para producir un falso verde.

Las salidas completas de los comandos se incluyen abajo. `tsc` no emitió texto; su éxito se acredita con el exit observado.

### Navegador: entorno y alcance real

Se intentó conectar el navegador integrado, pero su puente no estaba disponible. Se utilizó Edge mediante la herramienta de navegador alternativa y su control documentado de viewport.

El verificador temporal escuchó únicamente en **127.0.0.1:9309**. Renderizó **el componente `InicioVista` real y sus primitivas reales** con `react-dom/server`, transpilation temporal de TypeScript y CSS compilado desde `src/app/tokens.css` mediante el PostCSS/Tailwind instalado. No se ejecutó Next dev/start ni se llamó a la base de datos.

Fixtures: las tres variantes `admin`, `broker`, `assistant`; métricas sintéticas expresas; leads vacíos; fecha larga `30 septiembre 2026`; `saludoNombre` deliberadamente ficticio. No representan una sesión autenticada ni validan la procedencia de las métricas existentes.

**Limitaciones:** fuentes Arial de respaldo porque las corporativas no pudieron descargarse; sin shell/layout completo, hidratación de Next ni backend. Las cifras comerciales, agenda y ranking existentes en la vista no se acreditan como reales. La comparación con staging, el login y cambio de usuario vivo son NV. Las capturas se inspeccionaron en la herramienta; no se guardaron archivos de captura adicionales, al estar acotados los archivos editables al producto asignado y este informe.

### Medidas observadas

27 combinaciones de rol/ancho: tres variantes × nueve anchos. Las medidas de columnas coinciden en las tres variantes; 375 px de Admin se comprobó inicialmente y los otros ocho anchos en la ronda posterior.

| Viewport CSS px | Columnas KPI (px) | Fecha (alto px) | Botón (alto px) | Overflow horizontal del documento |
|---:|---|---:|---:|---|
| 320 | 137.667 + 137.667 | 34 | 48 | No |
| 375 | 165.333 + 165.333 | 34 | 48 | No |
| 390 | 172.667 + 172.667 | 34 | 48 | No |
| 430 | 192.667 + 192.667 | 34 | 48 | No |
| 480 | 217.667 + 217.667 | 34 | 48 | No |
| 720 | 337.667 + 337.667 | 34 | 48 | No |
| 768 | 355.667 + 355.667 | 42 | 44 | No |
| 1024 | 4 × 235.833 | 42 | 44 | No |
| 1440 | 4 × 339.833 | 42 | 44 | No |

Edge reservó 15 px para la barra vertical: `clientWidth = viewport - 15`; en cada medida `scrollWidth = clientWidth`. No se confundió esa reserva con overflow.

A 375 px, Admin colocó las dos primeras tarjetas en y=288.833 y las dos siguientes en y=406.167, con ancho 165.333 px: geometría 2×2. Fecha `nowrap`, una línea, y=141.5, alto 34 px; botón y=183.5, alto 48 px, ancho 332 px. Etiquetas/notas: 13 px.

Asistente y Broker no mostraron texto KPI con `scrollWidth > clientWidth` en los nueve anchos. Se inspeccionaron capturas a 375 px para las tres variantes; wrapping visible de etiquetas/notas y cifras completas. En Broker, Tab enfocó el enlace `+ Registrar Lead`, con outline sólido de 2.667 px. Se comprobó el render estable después del cambio de viewport.

### Trazabilidad y estados

| Requisito | Evidencia | Estado |
|---|---|---|
| KPI 2×2 a ≤480 px | Medidas DOM y capturas de la vista real aislada, variantes y etiquetas largas | Verificado en fixture; pendiente D14 en app autenticada |
| Fecha compacta | Texto completo, nowrap, alto 34 px, acción en línea separada | Verificado en fixture; pendiente fuentes/shell reales |
| Nombre del usuario autenticado | Actor/puerto carecen del dato; retirados nombres por rol; fixture nominal ignorado | Mitigación verificada; implementación nominal bloqueada por contrato D03/D10 |
| Teclado de la acción | Tab y outline observados en Broker a 375 px | Verificación puntual; no auditoría completa |
| Fuente de métricas y permisos vivos | No se consultó ni alteró backend | NV |
| Carga/vacío/error/offline/éxito/permiso | Este ajuste no crea operaciones ni modifica la recuperación existente | Cobertura de la pantalla completa NV |
| Zoom real, lector de pantalla, contraste, sesión revocada, nombres autenticados largos | No ejecutados | NV; D07/D14 |

No se añadieron pruebas unitarias de clases CSS que reproduzcan la implementación. La evidencia de maquetación procede del navegador. La corrida unitaria prueba las garantías existentes; no sustituye la verificación de UX. No se declara conformidad WCAG 2.2 AA.

### Salida completa: TypeScript

```text
Comando: npx.cmd tsc --noEmit
(sin salida)
TYPECHECK_EXIT_CODE=0
```

### Salida completa: pruebas finales

```text

> quisqueya-home-crm@0.1.0 test
> node --test "src/**/*.test.ts"

✔ upsert de meta de broker: el set solo toca target_* y updated_by, nunca achieved_* (4.7814ms)
✔ upsert de meta de la compañía: mismo set, conflicto por el índice parcial de broker_id nulo (0.8745ms)
✔ upsert de meta de broker: el set sí escribe target_deals, target_amount_cents y updated_by (0.5965ms)
✔ upsert de meta de la compañía: el set sí escribe target_* y updated_by (0.524ms)
✔ adaptador real de metas: ningún achieved_* en el código, dos upserts y el targetWhere de la compañía (1.3301ms)
✔ adaptador real de metas: lo que escribe en el conflicto es target_* y updated_by (0.8549ms)
✔ adaptador real de pipeline (la otra mitad): el set de incrementarMetaAlcanzada solo escribe achieved_* y updated_by, nunca target_* (1.072ms)
✔ Academy: listar contenidos devuelve los módulos iniciales con 0% de progreso (3.4026ms)
✔ Academy: filtrar contenidos por categoría (0.5225ms)
✔ Academy: completar un video actualiza el estado y la fecha de finalización (2.0031ms)
✔ Academy: marcar pasos de un checklist recalcula el porcentaje del módulo (1.1317ms)
✔ Academy: al completar todos los contenidos se otorga la certificación del broker (0.7308ms)
✔ crear: inserta, audita y actualiza la próxima acción del negocio (4.4623ms)
✔ crear: una actividad completada no reemplaza la próxima acción (0.5576ms)
✔ crear: un broker no puede sobrescribir la próxima acción de un negocio fuera de alcance (1.1786ms)
✔ editar: null borra un campo y ausencia lo conserva (1.3654ms)
✔ editar: completar fija completedAt y reabrir la limpia (0.8851ms)
✔ exportar ICS: respeta alcance y rango de lunes a sábado exclusivo (5.7292ms)
✔ borrar: marca la fila y audita; fuera de alcance devuelve NotFoundError (0.7709ms)
✔ procesarNotaDeVozLead: procesa texto directo y propone HITL (4.4625ms)
✔ procesarNotaDeVozLead: delega audio al proveedor de transcripción (1.7836ms)
✔ asignar proyectos libres: se asignan y cada uno se audita con 'asignar' (6.2945ms)
✔ desasignar: lo que ya era del broker y no se pide, se suelta (0.7244ms)
✔ asignar y soltar a la vez: primero las asignadas, luego las soltadas (0.6783ms)
✔ sin cambios reales: no escribe ni audita nada y responde lista vacía (0.4632ms)
✔ lista vacía suelta todo lo que tenía el broker (0.7532ms)
✔ reasignar un proyecto de otro broker lo toma (alcance all) (0.4409ms)
✔ un proyecto inactivo asignado hoy NO se desasigna solo (universo activo) (0.62ms)
✔ alcance distinto de all: 403 con el mensaje literal y nada escrito (1.6578ms)
✔ broker inexistente, inactivo o borrado: NotFoundError con el mensaje literal (1.1961ms)
✔ un proyecto que no existe, está borrado o inactivo: NotFoundError y no se asigna ninguno (1.3983ms)
✔ un fallo dentro de la transacción deshace las asignaciones y la auditoría (0.8037ms)
✔ alta en motivos-perdida: slug a partir del nombre, posición 0 y auditoría de loss_reason (5.3729ms)
✔ edición en motivos-perdida: solo las claves presentes, con antes/después y auditoría de loss_reason (1.5349ms)
✔ edición en motivos-perdida: una entrada inexistente da NotFoundError y no audita (1.7326ms)
✔ alta en canales: slug a partir del nombre, posición 0 y auditoría de lead_source (0.3832ms)
✔ edición en canales: solo las claves presentes, con antes/después y auditoría de lead_source (0.4658ms)
✔ edición en canales: una entrada inexistente da NotFoundError y no audita (0.3173ms)
✔ el id de un tipo no se encuentra en el otro (0.7411ms)
✔ slug repetido: se añade el sufijo con el número de coincidencias + 1 (0.5694ms)
✔ alta con nombre sin letras ni dígitos usa el slug 'elemento'; con posición la respeta (0.4813ms)
✔ un fallo dentro de la transacción no deja fila ni auditoría (1.1829ms)
✔ esTipoCatalogo: solo las dos claves; un tipo desconocido (o heredado de Object) no pasa (0.5553ms)
✔ aprobar una pendiente: estado, aprobador y fecha, con su auditoría (5.1917ms)
✔ pagar una aprobada: estado y fecha de pago, sin tocar el aprobador (0.5777ms)
✔ anular una pendiente y una aprobada (0.6464ms)
✔ cambiar el reparto de una pendiente recalcula montos y deja el total (0.5943ms)
✔ transición inválida pending → paid: 409 con el mensaje del dominio y nada escrito (1.6588ms)
✔ transición inválida approved → approved: 409 con el mensaje del dominio y nada escrito (0.5058ms)
✔ transición inválida paid → void: 409 con el mensaje del dominio y nada escrito (0.4531ms)
✔ transición inválida paid → approved: 409 con el mensaje del dominio y nada escrito (0.4598ms)
✔ transición inválida void → approved: 409 con el mensaje del dominio y nada escrito (0.4979ms)
✔ transición inválida void → paid: 409 con el mensaje del dominio y nada escrito (0.7721ms)
✔ el reparto de una comisión no pendiente se rechaza con el mensaje literal (0.6346ms)
✔ una comisión inexistente es NotFoundError (0.3921ms)
✔ la comisión de un negocio borrado responde NotFoundError y no se escribe nada (0.482ms)
✔ una comisión ajena con alcance own es NotFoundError; la propia se edita (0.6301ms)
✔ una comisión sin broker solo la alcanza `all` (0.4196ms)
✔ si al bloquear el estado ya cambió (otra petición ganó), la transición se decide con el estado REAL (0.549ms)
✔ el reparto también se decide con el estado real tras el bloqueo (0.4357ms)
✔ un fallo del repositorio al escribir no deja ni cambio ni auditoría (0.5774ms)
✔ el CSV lleva el encabezado y el orden de columnas exactos (1.06ms)
✔ sin proyecto, broker ni fecha: vacío, 'Sin asignar' y vacío (0.3805ms)
✔ el CSV de cero filas es solo el encabezado con BOM (0.4542ms)
✔ el nombre de archivo lleva el periodo (AAAA-MM) cuando hay filtro (0.4454ms)
✔ el alcance filtra: un broker solo exporta lo suyo; all exporta todo (0.6121ms)
✔ el caso de uso pasa actor, alcance y filtros a la consulta tal cual (0.3639ms)
✔ un nombre que empieza como fórmula sale neutralizado (domain/csv.ts) (0.4629ms)
✔ el adaptador real bloquea SOLO la fila de commissions: .for("update", { of: commissions }) (1.9998ms)
✔ auditoría en memoria: registrar deja rastro del actor, la acción y la entidad (4.0118ms)
✔ auditoría en memoria: acepta un registro sin antes ni despues (0.4518ms)
✔ auditoría en memoria: los registros múltiples conservan el orden (0.3691ms)
✔ almacenamiento en memoria: urlsFirmadas devuelve una url por ruta, en el mismo orden (1.2271ms)
✔ almacenamiento en memoria: una ruta desconocida da null (0.5124ms)
✔ almacenamiento en memoria: subir sobre una ruta ocupada lanza ConflictError con el nombre visible (1.3756ms)
✔ almacenamiento en memoria: borrar quita el objeto y no lanza con rutas inexistentes (0.5538ms)
✔ almacenamiento en memoria: urlsFirmadas([]) devuelve [] (0.3626ms)
✔ admin de Auth en memoria: invitar devuelve un id no vacío o null (1.0299ms)
✔ admin de Auth en memoria: el correo invitado queda registrado (0.9436ms)
✔ unidad de trabajo en memoria: el callback recibe la misma identidad de repos (1.6663ms)
✔ unidad de trabajo en memoria: el valor devuelto por fn llega al llamante (0.3166ms)
✔ unidad de trabajo en memoria: si fn lanza, el error se propaga tal cual y no queda nada escrito (2.3813ms)
✔ almacenamiento en memoria: fallarAlSubirCon fuerza el motivo en el mensaje (0.7669ms)
✔ almacenamiento en memoria: ruta ocupada usa el motivo `El objeto ya existe.` (0.6991ms)
✔ almacenamiento en memoria: urlsFirmadas lleva la ruta y la vida en la url (0.3647ms)
✔ almacenamiento en memoria: fallarAlFirmarCon lanza ConflictError (0.3332ms)
✔ admin de Auth en memoria: numera los ids de usuario (0.1654ms)
✔ admin de Auth en memoria: fallarCon lanza ConflictError y no registra el correo (0.2601ms)
✔ admin de Auth en memoria: sinIdDeUsuario devuelve null pero registra el correo (0.2311ms)
✔ auditoría en memoria: guarda actor, antes y después (0.3065ms)
✔ unidad de trabajo en memoria: cuenta confirmadas y revertidas (0.4155ms)
✔ unidad de trabajo en memoria: restaura todos los reversibles si fn lanza (0.6593ms)
✔ crearPlantillaMensaje: extrae variables automáticamente y guarda (4.8355ms)
✔ crearPlantillaMensaje: rechaza nombre o cuerpo vacío (2.1235ms)
✔ prepararYDespacharMensaje: interpola variables y despacha por el canal (1.0597ms)
✔ actualizarPlantillaMensaje: actualiza y recalcula variables al cambiar el cuerpo (0.6066ms)
✔ crear: asigna responsable y autoría al actor y audita con la fila completa (8.3369ms)
✔ crear con teléfono duplicado sin crearIgual: ConflictError con candidatos, sin crear ni auditar (2.0022ms)
✔ F04 contactos: advertencia global y candidatos visibles con own, teléfono (1.0377ms)
✔ F04 contactos: advertencia global y candidatos visibles con own, correo (0.6385ms)
✔ F04 contactos: advertencia global y candidatos visibles con team, teléfono (0.977ms)
✔ F04 contactos: advertencia global y candidatos visibles con team, correo (0.505ms)
✔ F04 contactos: advertencia global y candidatos visibles con none, teléfono (1.6388ms)
✔ F04 contactos: advertencia global y candidatos visibles con none, correo (0.3348ms)
✔ F04 contactos: advertencia global y candidatos visibles con all, teléfono (0.4712ms)
✔ F04 contactos: advertencia global y candidatos visibles con all, correo (0.6402ms)
✔ F04 contactos: candidato exclusivamente ajeno mantiene advertencia sin PII y permite crearIgual (0.7896ms)
✔ F04 contactos: la consulta identificable de duplicados aplica visibleRows en SQL (2.4802ms)
✔ crear con correo duplicado sin crearIgual: ConflictError, sin crear ni auditar (0.5843ms)
✔ crear con duplicado y crearIgual: crea (0.2711ms)
✔ crear sin teléfono ni correo: no consulta duplicados y crea (0.3072ms)
✔ crear normaliza el teléfono a E.164 y conserva lo que escribió el usuario (0.2851ms)
✔ editar: cambia solo los campos presentes y audita antes y después (1.2306ms)
✔ editar con phone null borra phone y phoneDisplay; sin la clave los deja igual (0.4611ms)
✔ editar con brokerId y alcance own: ForbiddenError y no escribe nada (0.6894ms)
✔ editar con brokerId y alcance all: reasigna (0.332ms)
✔ editar un contacto fuera del alcance: NotFoundError y no escribe (0.4442ms)
✔ borrar: escribe deletedAt, conserva la fila, audita eliminar y deja de verse (0.5936ms)
✔ borrar un id inexistente o fuera de alcance: NotFoundError (0.6811ms)
✔ un fallo dentro de la transacción no deja fila ni auditoría (0.6353ms)
✔ renombrar: cambia el nombre, deja lo demás y audita con antes/después (2.996ms)
✔ defaultProbability: null la borra; ausente la deja (2.5199ms)
✔ posición y activa se editan (0.548ms)
✔ una etapa inexistente da NotFoundError y no audita (1.7278ms)
✔ kind y slug en la entrada NO cambian la fila guardada (0.6973ms)
✔ el tipo CambiosEtapa no admite kind ni slug (ni a mano) (0.4994ms)
✔ el adaptador real arma el set de la etapa sin nombrar kind ni slug (2.2337ms)
✔ alta: crea contacto y lead, sugiere el broker de sugerirBroker y audita las dos filas con actor (9.1221ms)
✔ alta con contactId existente: no crea contacto y solo audita el lead (0.9764ms)
✔ alta con contactId que no existe o está borrado: NotFoundError y nada escrito (1.6623ms)
✔ alta con teléfono duplicado: ConflictError con candidatos; con crearIgual crea (1.0371ms)
✔ F04 leads: candidatos de contacto respetan contacts:view own, teléfono (0.8823ms)
✔ F04 leads: candidatos de contacto respetan contacts:view own, correo (4.61ms)
✔ F04 leads: candidatos de contacto respetan contacts:view team, teléfono (1.2195ms)
✔ F04 leads: candidatos de contacto respetan contacts:view team, correo (1.648ms)
✔ F04 leads: candidatos de contacto respetan contacts:view none, teléfono (0.5711ms)
✔ F04 leads: candidatos de contacto respetan contacts:view none, correo (0.6899ms)
✔ F04 leads: candidatos de contacto respetan contacts:view all, teléfono (0.5868ms)
✔ F04 leads: candidatos de contacto respetan contacts:view all, correo (0.5139ms)
✔ F04 leads: sin contacts:view, duplicado ajeno solo avisa y crearIgual conserva alta (0.7078ms)
✔ F04 leads: la consulta identificable de duplicados aplica visibleRows en SQL (1.5918ms)
✔ alta sin contactId ni nombre: ValidationError (protege al caso de uso de una entrada sin Zod) (0.7136ms)
✔ alta: un fallo dentro de la transacción no deja contacto, lead ni auditoría (0.7991ms)
✔ asignar: escribe brokerId y audita asignar con antes y después (3.1009ms)
✔ asignar a quien no es un broker activo: ValidationError literal y nada escrito (0.9024ms)
✔ asignar: el broker inválido gana al lead inexistente (se valida antes de leer el lead) (0.8177ms)
✔ asignar un lead fuera del alcance (o borrado): NotFoundError (0.7171ms)
✔ asignar un lead PROPIO con alcance own funciona (H16: deliberado, comportamiento actual) (0.4351ms)
✔ descartar: marca discarded con el motivo y audita descartar (1.1347ms)
✔ descartar: guardas de estado con sus mensajes literales (0.9497ms)
✔ descartar un lead inexistente, borrado o fuera del alcance: NotFoundError (0.807ms)
✔ F05: repetir sin teléfono ni correo no duplica contactos ni auditoría (2.2459ms)
✔ F05: entregas concurrentes de la misma clave ejecutan todos los efectos una vez (4.0455ms)
✔ F05: la reserva SQL y su recibo usan el mismo ejecutor transaccional (1.2854ms)
✔ F05: misma clave con payload diferente devuelve conflicto sin efectos (2.3058ms)
✔ F05: el respaldo del upsert excluye filas borradas (0.8602ms)
✔ webhook: la primera entrega crea contacto y lead, con dos filas de auditoría SIN actor, y responde creado (0.8235ms)
✔ webhook repetido con el mismo externalId: no duplica, devuelve el existente con creado false y NO audita (0.7059ms)
✔ F05: clave histórica sin recibo requiere reconciliación incluso tras borrado (0.4736ms)
✔ F05: el recibo conserva respuesta y clave tras editar o borrar el lead (0.837ms)
✔ F05: rollback después de escribir el recibo permite reintento completo (0.8163ms)
✔ webhook con teléfono o correo de un contacto existente: lo reutiliza y no crea otro (0.6258ms)
✔ webhook sin teléfono ni correo: crea un contacto nuevo (0.4735ms)
✔ webhook: un fallo a mitad (al auditar el lead) no deja contacto, lead ni auditoría (0.5817ms)
✔ la idempotencia del webhook sigue siendo un upsert atómico, con el predicado del índice parcial (1.1776ms)
✔ F06: dos conversiones intercaladas producen un negocio y un conflicto (5.4135ms)
✔ F06: el adaptador bloquea la fila antes de decidir la conversión (4.6801ms)
✔ convertir: crea el negocio en la primera etapa abierta, marca el lead convertido y audita (2.3173ms)
✔ convertir un lead sin responsable ni tipo de operación: el negocio queda con quien convierte y en venta (0.4796ms)
✔ convertir: guardas de estado con sus mensajes literales (4.1568ms)
✔ convertir sin etapa inicial en el embudo: ConflictError y nada escrito (0.8071ms)
✔ convertir un lead inexistente, borrado o fuera del alcance: NotFoundError (1.3235ms)
✔ convertir un lead propio con alcance own funciona (1.1816ms)
✔ un fallo a mitad de la conversión no deja negocio, lead convertido ni auditoría (0.8726ms)
✔ fijar la meta de un broker crea la fila y la audita como 'crear' (3.5348ms)
✔ fijar la meta de la compañía (brokerId nulo) no pide perfil de broker (0.4641ms)
✔ fijar la meta NO toca achieved_*: si ya había valores, siguen igual (0.7973ms)
✔ fijar dos veces el mismo periodo actualiza en vez de duplicar, y la segunda se audita como 'editar' (0.9836ms)
✔ la meta del broker y la de la compañía del mismo periodo son filas distintas (0.996ms)
✔ sin targetAmountCents en la edición, el monto que ya había se conserva (0.4671ms)
✔ un broker sin perfil: NotFoundError con el mensaje literal y nada escrito (1.5237ms)
✔ alcance own: la propia meta sí; la de otro broker y la de la compañía, 403 con el mensaje literal (1.0121ms)
✔ un fallo dentro de la transacción no deja meta ni auditoría (1.3019ms)
✔ restaurar contact: quita deletedAt, audita con la entidad correcta y solo escribe deletedAt (7.8502ms)
✔ restaurar lead: quita deletedAt, audita con la entidad correcta y solo escribe deletedAt (0.4907ms)
✔ restaurar deal: quita deletedAt, audita con la entidad correcta y solo escribe deletedAt (0.3963ms)
✔ restaurar project: quita deletedAt, audita con la entidad correcta y solo escribe deletedAt (0.3761ms)
✔ restaurar unit: quita deletedAt, audita con la entidad correcta y solo escribe deletedAt (0.5263ms)
✔ restaurar user: quita deletedAt, audita con la entidad correcta y solo escribe deletedAt (0.416ms)
✔ restaurar algo que no está borrado da NotFoundError y no audita (1.2812ms)
✔ restaurar algo inexistente da NotFoundError (0.4548ms)
✔ una fila sin columna deletedAt da NotFoundError (0.5726ms)
✔ el mismo id en otra entidad no cuenta (0.9858ms)
✔ un fallo dentro de la transacción deja la fila borrada y sin auditoría (0.899ms)
✔ cambio simple: escribe el historial y audita cambiar_etapa con antes y despues (13.9838ms)
✔ cambio a una etapa con requisito sin cumplir: ConflictError de transicion-etapa y nada escrito (1.8727ms)
✔ presentación exige una próxima acción vigente: pendiente, con responsable y fecha (6.0167ms)
✔ un negocio ya cerrado no cambia de etapa (0.9398ms)
✔ pérdida con motivo: audita marcar_perdido y guarda lossReasonId y lossComment (2.1627ms)
✔ pérdida sin comentario guarda lossComment en null (2.0958ms)
✔ pérdida sin motivo: el ConflictError de transicion-etapa y nada escrito (0.9539ms)
✔ negocio de otro broker con alcance own: NotFoundError, igual que uno inexistente (0.873ms)
✔ con alcance all un administrador mueve el negocio de otro broker (0.8591ms)
✔ negocio en la papelera: NotFoundError (1.012ms)
✔ etapa destino inexistente o inactiva: NotFoundError con su mensaje (1.0062ms)
✔ etapa actual que ya no existe en el embudo: ConflictError (0.4618ms)
✔ editar: null borra el campo, ausente lo deja, y audita editar con antes y despues (0.9709ms)
✔ editar un negocio cerrado: ConflictError y nada escrito (0.5987ms)
✔ editar un negocio ajeno, borrado o inexistente: NotFoundError (0.5909ms)
✔ asociar: crea la propiedad, desmarca la principal anterior y audita crear deal_property (1.0389ms)
✔ asociar sin isPrimary no toca la principal existente (0.5359ms)
✔ asociar un proyecto fuera del alcance sobre projects: NotFoundError con su mensaje (0.5566ms)
✔ asociar una unidad de otro proyecto: NotFoundError con su mensaje y nada escrito (0.5277ms)
✔ asociar a un negocio cerrado: ConflictError (0.5351ms)
✔ marcar principal: desmarca las demás y audita editar con antes y despues (0.8445ms)
✔ marcar o quitar una propiedad de otro negocio: NotFoundError (0.9381ms)
✔ quitar: borra la propiedad y audita eliminar solo con antes (0.4609ms)
✔ quitar en un negocio cerrado: ConflictError y la propiedad sigue (0.3156ms)
✔ cierre completo: ocurren los ocho pasos, en una sola unidad de trabajo (67.6319ms)
✔ cierre sin monto en el body usa el monto que ya tenía el negocio (1.5938ms)
✔ cierre de un alquiler deja la unidad reservada, no vendida (1.6141ms)
✔ cierre sin unidad principal resuelta: ConflictError de transicion-etapa y nada escrito (1.8481ms)
✔ dos cierres del mismo periodo SUMAN en la misma fila de meta, no crean otra (3.9256ms)
✔ una meta que ya existe para el periodo se suma, sin tocar su target (1.7947ms)
✔ el perfil se RECALCULA con el total ganado del año, no se incrementa (2.1373ms)
✔ cierre de un negocio cuyo broker no tiene perfil: no falla y no recalcula nada (1.14ms)
✔ cierre de un negocio sin responsable: solo incrementa la meta de la compañía (1.181ms)
✔ cierre sin commissionBasisPoints: ConflictError con el mensaje exacto y nada escrito (1.1023ms)
✔ defensa 2: si el bloqueo revela que la etapa ya no es open, ConflictError del doble cierre y nada escrito (0.8873ms)
✔ defensa 2 también frente a una pérdida que ganó la carrera (0.7122ms)
✔ cerrarNegocioGanado directo: un negocio que no existe detrás del bloqueo es NotFoundError (0.4152ms)
✔ un fallo a mitad del cierre no deja nada escrito (1.5343ms)
✔ el adaptador real bloquea la fila del negocio: bloquearNegocio usa .for("update") (2.1855ms)
✔ el upsert de la meta de compañía conserva el targetWhere de su índice parcial (1.0702ms)
✔ el recálculo anual conserva la zona horaria de Santo Domingo (0.9138ms)
✔ proyectos y unidades: alta, edición, borrado y auditoría (6.7944ms)
✔ fases: recalcula avance al crear, editar y borrar (2.8274ms)
✔ fotos: compensa exactamente las subidas y conserva el error del INSERT (9.7486ms)
✔ fotos: el nombre visible nunca decide la ruta del bucket (1.5653ms)
✔ alcance own: proyecto ajeno no escribe ni audita fases, fotos ni unidades (3.7012ms)
✔ los permisos del rol administrador no son editables (5.9485ms)
✔ la matriz normal reemplaza celdas ausentes y audita (0.8327ms)
✔ el ultimo administrador no se puede editar ni borrar, y no escribe ni audita (13.2851ms)
✔ alcance own no puede editar ni borrar, ni su propia fila (0.8172ms)
✔ alta usa AdminAuth, conserva el orden y registra auditoria (3.6675ms)
✔ edicion y borrado normales auditan, y el reenvio llama al puerto (2.2492ms)
✔ coincide por especialidad contra el proyecto o la zona de interés (5.2071ms)
✔ coincide por handlesRentals cuando la operación es de alquiler, aunque la especialidad no calce (0.3595ms)
✔ sin ningún candidato que coincida, devuelve null (0.2933ms)
✔ sin candidatos, devuelve null sin lanzar (0.7664ms)
✔ con varios candidatos que coinciden, desempata por menor annualSalesCents (reparte carga) (0.3742ms)
✔ empate exacto en annualSalesCents conserva el primero del orden recibido (0.3252ms)
✔ operationType null u operación de venta no activa la coincidencia por handlesRentals (0.4566ms)
✔ diffAsignacion no toca lo que ya estaba igual (3.499ms)
✔ diffAsignacion detecta lo nuevo y lo soltado (0.3213ms)
✔ diffAsignacion vacío a vacío no hace nada (0.3122ms)
✔ diffAsignacion desasigna todo cuando no se elige ninguno (0.3603ms)
✔ AudioLeadExtractor: extrae prospecto de compra en Bávaro (4.5767ms)
✔ AudioLeadExtractor: extrae alquiler en Santo Domingo Piantini (2.0419ms)
✔ AudioLeadExtractor: extrae rango de lujo en Cap Cana con teléfono dominicano (0.7158ms)
✔ AudioLeadExtractor: texto vacío no revienta y devuelve confianza 0 (0.2693ms)
✔ promedioAvance sin fases es 0, no NaN (2.3753ms)
✔ promedioAvance redondea al entero más cercano (0.4863ms)
✔ promedioAvance con una sola fase es su propio porcentaje (0.2938ms)
✔ FASES_ESTANDAR trae exactamente las 8 fases del prototipo (0.2025ms)
✔ validarFoto rechaza un mime type que no es imagen (0.5351ms)
✔ validarFoto rechaza SVG aunque su mime empiece con image/ (0.2875ms)
✔ validarFoto rechaza una imagen de más de 10 MB (0.2342ms)
✔ validarFoto acepta cada formato ráster permitido dentro del límite (0.2025ms)
✔ validarFoto acepta exactamente el límite de 10 MB (0.5279ms)
✔ calcularComision: reparto 50/50 sobre un monto y comisión sin decimales exactos (1.8604ms)
✔ calcularComision: la suma broker + agencia siempre cuadra con el total, incluso cuando el reparto no divide exacto (0.5016ms)
✔ calcularComision: sin reparto explícito usa el 50/50 por defecto del esquema (0.3071ms)
✔ evaluarNivelBroker: por debajo del primer corte es junior (0.3642ms)
✔ evaluarNivelBroker: exactamente en el corte confirmado por el prototipo sube a senior (0.2721ms)
✔ evaluarNivelBroker: sube de nivel en cada corte sucesivo (0.2972ms)
✔ evaluarNivelBroker: un valor muy por encima del último corte se queda en el nivel máximo (0.2545ms)
✔ pending → approved es válida (2.5206ms)
✔ approved → paid es válida (0.5109ms)
✔ pending → void es válida (0.3531ms)
✔ approved → void es válida (0.4293ms)
✔ pending → paid lanza: no se puede saltar la aprobación (0.954ms)
✔ paid → pending lanza: una comisión pagada no retrocede (0.2746ms)
✔ paid → cualquier otro estado lanza (2.9931ms)
✔ void → cualquier otro estado lanza (0.3492ms)
✔ quedarse en el mismo estado siempre lanza (0.6868ms)
✔ el reparto se puede editar mientras la comisión está pendiente (0.7579ms)
✔ editar el reparto de una comisión aprobada lanza (0.3505ms)
✔ editar el reparto de una comisión pagada o anulada lanza (0.284ms)
✔ renderizarPlantilla: reemplaza variables encontradas y deja intactas las ausentes (1.8984ms)
✔ extraerVariablesDePlantilla: encuentra todas las variables únicas (1.7256ms)
✔ generarEnlaceTelegram: genera enlace universal t.me sin costo (0.4297ms)
✔ generarEnlaceWhatsApp: normaliza teléfono y arma enlace wa.me (0.2952ms)
✔ validarTokenTelegram: detecta tokens oficiales válidos e inválidos (0.4546ms)
✔ validarConfiguracionCanal: valida configuraciones por canal (0.3559ms)
✔ Confotur: cálculo estándar de US$150,000 con 24 meses de construcción (2.4062ms)
✔ Confotur: propiedad de lujo de US$500,000 (0.4107ms)
✔ Confotur: rechaza si la suma de porcentajes no da 100% (0.8929ms)
✔ un campo sin coma, comilla ni salto de línea se deja tal cual (2.2382ms)
✔ un campo con coma va entre comillas (0.4113ms)
✔ un campo con comillas dobles las duplica y va entre comillas (0.2774ms)
✔ un campo con salto de línea va entre comillas (0.3001ms)
✔ filaCsv escapa cada campo y los une con comas (0.3694ms)
✔ un campo que empieza con = lleva un ' de escape antes (0.2409ms)
✔ un campo que empieza con +, -, @ o tab también lleva el ' (0.3042ms)
✔ un campo que empieza con retorno de carro lleva el ' y además va entre comillas (\r también es un separador RFC 4180) (0.3233ms)
✔ una fórmula que además trae coma queda escapada Y entre comillas (0.4577ms)
✔ filaCsv no aplica el escape de fórmula a números: un negativo se serializa tal cual (0.5403ms)
✔ generarCsv arma encabezado + filas con BOM y \r\n (2.223ms)
✔ el UID es estable: exportar dos veces el mismo evento da el mismo UID (5.43ms)
✔ sin endsAt, asume una hora de duración (0.4306ms)
✔ escapa comas y punto y coma del título (0.3557ms)
✔ sin ubicación, no escribe LOCATION (0.3746ms)
✔ una agenda vacía sigue siendo un .ics válido (0.4361ms)
✔ parsearPeriodo con ?periodo= válido usa ese año y mes (3.3487ms)
✔ parsearPeriodo sin parámetro cae al mes actual en Santo Domingo (42.6887ms)
✔ parsearPeriodo ignora un valor con formato inválido y usa el mes actual (0.718ms)
✔ parsearPeriodo rechaza un mes fuera de 1-12 y usa el mes actual (0.6131ms)
✔ formatoPeriodo rellena el mes con cero a la izquierda (0.4631ms)
✔ cumplimientoPorcentaje con meta en 0 no divide entre cero: sin meta fijada (0.2751ms)
✔ cumplimientoPorcentaje redondea al entero más cercano (0.3995ms)
✔ esMetaCumplida es falso sin meta fijada, aunque haya negocios logrados (0.2541ms)
✔ esMetaCumplida es verdadero al alcanzar o superar la meta (0.4195ms)
✔ nombreMes no retrocede un mes en husos al oeste de UTC (2.6652ms)
✔ sin fila de permiso el alcance es none: un recurso nuevo nace cerrado (2.3326ms)
✔ el permiso es por acción, no por recurso (0.3072ms)
✔ requireScope lanza 403 cuando no hay permiso, y devuelve el alcance cuando lo hay (0.9454ms)
✔ requireFullScope exige alcance all: own sobre users no basta para gestionar usuarios (0.6149ms)
✔ con alcance own solo se alcanzan los registros propios (0.3514ms)
✔ con alcance all se alcanza cualquier registro, incluso sin responsable (0.2582ms)
✔ team se comporta como own mientras no exista modelo de equipos (2.1033ms)
✔ con alcance none no se alcanza nada, ni el registro propio (0.3349ms)
✔ el precio real se borra en servidor si falta el permiso unit_real_price (0.4658ms)
✔ minúsculas y espacios a guiones (2.1947ms)
✔ quita acentos (0.3891ms)
✔ colapsa símbolos y recorta guiones en los extremos (0.2577ms)
✔ un número de RD con guiones y espacios se normaliza a E.164 (3.1352ms)
✔ un número que ya viene en E.164 se conserva (0.3186ms)
✔ un número que no es de RD no se normaliza, pero se conserva el texto (0.2892ms)
✔ un número con menos o más dígitos de los que hacen falta no se normaliza (0.3489ms)
✔ vacío, solo espacios o undefined no rompen y devuelven null en los dos campos (0.3734ms)
✔ una transición sin requisito propio en §10.1 (la primera del embudo) no lanza nada (2.3239ms)
✔ → Contactado: pasa con actividad de contacto registrada (0.3936ms)
✔ → Contactado: lanza sin ninguna actividad de contacto (0.9819ms)
✔ → Presentación: pasa con próxima acción con responsable y fecha (0.3651ms)
✔ → Presentación: lanza sin próxima acción (0.3856ms)
✔ → Preselección: pasa con al menos una fila en deal_properties (0.6417ms)
✔ → Preselección: lanza sin ninguna propiedad de interés (0.3382ms)
✔ → Negociación: pasa con monto, probabilidad, comisión y fecha estimada (0.3034ms)
✔ → Negociación: lanza si falta el monto (0.5343ms)
✔ → Negociación: lanza si falta la probabilidad, aunque el resto esté completo (0.7779ms)
✔ → Negociación: lanza si falta el porcentaje de comisión (0.4079ms)
✔ → Negociación: lanza si falta la fecha estimada de cierre (0.3213ms)
✔ → Cierre (won): pasa con monto final y unidad principal definida (0.25ms)
✔ → Cierre (won): lanza sin monto final, aunque haya unidad principal (0.3569ms)
✔ → Cierre (won): lanza sin unidad principal aunque haya monto — son requisitos independientes (0.2997ms)
✔ → Perdido (lost): pasa con motivo del catálogo loss_reasons (0.3561ms)
✔ → Perdido (lost): lanza sin motivo (0.3065ms)
✔ un negocio ya ganado no puede volver a transicionar (0.3495ms)
✔ un negocio ya perdido no puede volver a transicionar (0.2567ms)
✔ las 21:00 del 31 de enero en Santo Domingo dan 2026-01-31, no 2026-02-01 (45.8835ms)
✔ una hora que ya cae del lado de Santo Domingo no cambia de día (0.7498ms)
✔ medianoche UTC del día 1 todavía es el día anterior en Santo Domingo (0.5372ms)
✔ horaSantoDomingo: las 13:00 UTC son las 9:00 locales (1.8053ms)
✔ medianocheSantoDomingo: la medianoche local del 24 de julio es las 4:00 UTC (0.524ms)
✔ lunesDeLaSemana: un viernes retrocede al lunes de esa misma semana (0.2998ms)
✔ lunesDeLaSemana: un lunes se devuelve a sí mismo (0.1896ms)
✔ lunesDeLaSemana: un domingo pertenece a la semana que empezó el lunes anterior (0.1775ms)
✔ sumarDias: cruza el fin de mes (0.3576ms)
✔ los archivos de src/ se encuentran (la prueba no se queda vacía sin avisar) (1.6194ms)
✔ domain/ no depende de nada fuera de domain/ (20.473ms)
✔ application/ no conoce la infraestructura ni el framework (34.7468ms)
✔ infrastructure/ no importa src/app/ (20.3605ms)
✔ un módulo migrado ya no toca la base desde src/app/ (52.962ms)
✔ serializa antes/después a JSON y escribe en la tabla audit_log (1.4253ms)
✔ deja previousValue y newValue en null cuando antes/después no vienen (0.333ms)
✔ registra el autor, la acción y la entidad tal como se le pasan (0.2404ms)
✔ usa la transacción que recibe, no una conexión propia (0.3093ms)
✔ si la transacción falla (como en un rollback), auditar no absorbe el error (0.6271ms)
✔ evaluación denegada en middleware, actor y demo: producción con flag y antiguo demo activos (215.7371ms)
✔ evaluación denegada en middleware, actor y demo: test con flag activo (54.6131ms)
✔ evaluación denegada en middleware, actor y demo: sin NODE_ENV (41.7603ms)
✔ evaluación denegada en middleware, actor y demo: sin flag explícito (32.6719ms)
✔ evaluación denegada en middleware, actor y demo: flag desactivado (35.0016ms)
✔ evaluación denegada en middleware, actor y demo: flag true en lugar de 1 (41.604ms)
✔ evaluación denegada en middleware, actor y demo: host remoto (33.5926ms)
✔ evaluación denegada en middleware, actor y demo: IP no local (37.0753ms)
✔ evaluación denegada en middleware, actor y demo: subdominio engañoso (36.3973ms)
✔ evaluación denegada en middleware, actor y demo: lista de hosts (26.5322ms)
✔ evaluación denegada en middleware, actor y demo: URL en host (24.3486ms)
✔ evaluación denegada en middleware, actor y demo: sin host (26.482ms)
✔ evaluación habilitada explícitamente en localhost (32.447ms)
✔ evaluación habilitada explícitamente en localhost:9300 (29.0001ms)
✔ evaluación habilitada explícitamente en 127.0.0.1 (26.0427ms)
✔ evaluación habilitada explícitamente en 127.0.0.1:9300 (32.383ms)
✔ broker conserva permisos del catálogo, identidad real y aislamiento own (22.0617ms)
✔ assistant no obtiene administración, borrado ni precios internos (23.8863ms)
✔ cookie/rol unknown no se convierte en administrador (22.1618ms)
✔ cookie/rol inactive no se convierte en administrador (23.7654ms)
✔ cookie/rol deleted no se convierte en administrador (34.3166ms)
✔ cookie/rol vacío no se convierte en administrador (32.2041ms)
✔ catálogo sin permisos deniega y cambios de permisos se reflejan (41.5147ms)
✔ JSON inválido, ausente o con campos extra no crea cookie (22.3098ms)
✔ fallo DB devuelve mensaje genérico sin detalles internos (23.0615ms)
✔ sesión Supabase válida sigue funcionando en producción sin aceptar rol de cookie (20.7888ms)
✔ F01: sin destinos registrados no hay solicitud saliente (4.6581ms)
✔ F01: rechaza URL libre, protocolo, puerto y credenciales antes de conectar (1.4893ms)
✔ F01: bloquea IP internas, reservadas y DNS mixto incluso registrados (14.3094ms)
✔ F01: IP literal interna y loopback ofuscado no alcanzan el transporte (1.5227ms)
✔ F01: fija DNS público en transporte, conserva TLS y no sigue redirects (6.6042ms)
✔ F01: timeout y errores de red no reflejan detalles externos (1.1932ms)
✔ F01: aborta DNS pendiente dentro del límite sin abrir socket (0.9056ms)
✔ F01: el timeout del transporte cancela la solicitud; error externo sanitizado (1.1274ms)
✔ F01: registro inválido mantiene el webhook cerrado (0.7912ms)
✔ F02: script sin contraseñas literales ni salida de credenciales (2.6362ms)
✔ F02: credencial obligatoria del rol desde entorno, sin fallback (2.9017ms)
✔ F03 projects: edición vacía, sin ver ni editar precio (70.9851ms)
✔ F03 projects: edición inocua, sin ver ni editar precio (32.3789ms)
✔ F03 projects: edición precio, sin ver ni editar precio (20.1399ms)
✔ F03 projects: edición vacía, editar precio sin verlo (18.4253ms)
✔ F03 projects: edición inocua, editar precio sin verlo (18.9751ms)
✔ F03 projects: edición precio, editar precio sin verlo (13.6742ms)
✔ F03 projects: edición vacía, ver precio sin editarlo (14.4412ms)
✔ F03 projects: edición inocua, ver precio sin editarlo (14.2214ms)
✔ F03 projects: edición precio, ver precio sin editarlo (18.4123ms)
✔ F03 projects: edición vacía, ver y editar precio (14.3801ms)
✔ F03 projects: edición inocua, ver y editar precio (14.705ms)
✔ F03 projects: edición precio, ver y editar precio (19.3905ms)
✔ F03 units: edición vacía, sin ver ni editar precio (16.9715ms)
✔ F03 units: edición inocua, sin ver ni editar precio (16.6582ms)
✔ F03 units: edición precio, sin ver ni editar precio (11.4887ms)
✔ F03 units: edición vacía, editar precio sin verlo (13.0862ms)
✔ F03 units: edición inocua, editar precio sin verlo (12.1556ms)
✔ F03 units: edición precio, editar precio sin verlo (12.4409ms)
✔ F03 units: edición vacía, ver precio sin editarlo (16.8558ms)
✔ F03 units: edición inocua, ver precio sin editarlo (11.0399ms)
✔ F03 units: edición precio, ver precio sin editarlo (11.1836ms)
✔ F03 units: edición vacía, ver y editar precio (10.5696ms)
✔ F03 units: edición inocua, ver y editar precio (11.3945ms)
✔ F03 units: edición precio, ver y editar precio (9.7633ms)
✔ alcance own filtra por el responsable, con el id del actor como parámetro (4.4452ms)
✔ alcance all no añade condición: no hay nada que restringir (0.2525ms)
✔ team filtra igual que own mientras no exista modelo de equipos (0.6598ms)
✔ alcance none no devuelve nada, aunque alguien se salte requireScope (0.273ms)
✔ visibleRows descarta siempre la papelera además de aplicar el alcance (0.7873ms)
✔ visibleRows con alcance all sigue descartando la papelera (0.3588ms)
✔ toda tabla creada en una migración tiene RLS activado (5.6984ms)
✔ toda ruta de la API comprueba permisos en servidor, salvo las públicas declaradas (74.5376ms)
ℹ tests 448
ℹ suites 0
ℹ pass 448
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 2962.4964
TEST_EXIT_CODE=0
```

### Salida completa: lint final

```text

> quisqueya-home-crm@0.1.0 lint
> eslint .


C:\Users\wilbe\Documents\.viltrum-worktrees\QuisqueyaHome_CRM\20261003T223136Z-D09-codex\src\app\login\page.tsx
  17:11  warning  Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element

✖ 1 problem (0 errors, 1 warning)
LINT_EXIT_CODE=0
```

### Salida completa: build intentado

```text

> quisqueya-home-crm@0.1.0 build
> next build

   ▲ Next.js 15.5.24
   - Experiments (use with caution):
     ✓ authInterrupts

   Creating an optimized production build ...
npm.cmd : connect EACCES 64.233.176.95:443
En línea: 2 Carácter: 90
+ ... h-d09-build-20261003.log'; npm.cmd run build *> $buildLogPath; $build ...
+                                ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : NotSpecified: (connect EACCES 64.233.176.95:443:String) [], RemoteException
    + FullyQualifiedErrorId : NativeCommandError
 

Retrying 1/3...
connect EACCES 64.233.176.95:443

Retrying 1/3...
connect EACCES 64.233.176.95:443

Retrying 2/3...
connect EACCES 64.233.176.95:443

Retrying 2/3...
connect EACCES 64.233.176.95:443

Retrying 3/3...
connect EACCES 64.233.176.95:443

Retrying 3/3...
Error: connect EACCES 64.233.176.95:443
    at <unknown> (Error: connect EACCES 64.233.176.95:443) {
  errno: -4092,
  code: 'EACCES',
  syscall: 'connect',
  address: '64.233.176.95',
  port: 443
}
Error: connect EACCES 64.233.176.95:443
    at <unknown> (Error: connect EACCES 64.233.176.95:443) {
  errno: -4092,
  code: 'EACCES',
  syscall: 'connect',
  address: '64.233.176.95',
  port: 443
}
Failed to compile.

src\app\layout.tsx
`next/font` error:
Failed to fetch `Atkinson Hyperlegible Next` from Google Fonts.

src\app\layout.tsx
`next/font` error:
Failed to fetch `Hanken Grotesk` from Google Fonts.


> Build failed because of webpack errors
BUILD_EXIT_CODE=1
```

## Handoff

**Destinatarios: D14 y D07. Estado: cambios preparados para revisión, aceptación pendiente.** D09 no aprueba su trabajo, no cierra issues ni gates y no declara build en verde.

1. **D14:** integrar/verificar el snapshot por hashes mediante el responsable autorizado de git. Ejecutar el build final en un entorno con acceso a Google Fonts y registrar su salida. El bloqueo actual es de conectividad del sandbox; no se acreditó un defecto de código de fuentes.
2. **D14:** abrir `/inicio` en la aplicación con sesiones reales Admin, Broker y Asistente. Revisar 320/375/390/430/480/720/768/1024/1440 px, especialmente la composición del shell que el fixture no incluyó. Confirmar 2×2 hasta 480, fecha completa en una línea y acción alcanzable sin scroll global.
3. **D07:** repetir con fuentes corporativas, zoom 200 %/reflow, teclado, lector de pantalla y contenido largo. Comprobar foco, contraste y targets; el Tab puntual no equivale a conformidad.
4. **D03/D10:** proporcionar identidad nominal autenticada por contrato. Hasta entonces mantener `Hola`; no reintroducir nombres por rol ni recuperar nombres de metadatos editables como autoridad. **Este requisito sigue pendiente.**
5. **D12/D14:** reproducir el escenario heredado de payload de Dashboard con permisos reducidos. El ajuste visual no resuelve disponibilidad, procedencia, periodos ni autorización regional de los insumos anteriores.
6. **D03/D08:** concretar el catálogo único de copy en el despacho correspondiente; deuda i18n aún pendiente.

El servidor temporal de fixture se detiene y el viewport del navegador se restablece al terminar. No queda un servicio de prueba como dependencia del producto. Producción, publicación y cierre de milestone quedan a cargo de los responsables y revisores autorizados.
