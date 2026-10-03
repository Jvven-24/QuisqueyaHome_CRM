# D09 · Rediseño UX del CRM · Fase 1

Fecha: 2026-10-03. Dispatch: `20261003T202831Z-D09-codex`.
Clasificación: `CAMBIO_UI`, CRM/ERP, R3. Productor: D09. Revisor: D14, con D07 para accesibilidad.

**Resultado: implementación bloqueada por entradas incompatibles con los criterios solicitados.** Se entregan diagnóstico trazable y verificaciones del estado recibido. No se declara fase terminada, aprobación propia, cierre de hallazgo, gate ni conformidad WCAG.

## Cambios

### Alcance y trabajo ejecutado

Se leyó completo `PERFIL.md`, la skill asignada `skills/patron-consola/SKILL.md` y `TAREA.md`. Se contrastaron `docs/R_RELEVO.md`, la documentación de `docs/contexto/`, `docs/DESIGN.md`, la auditoría D04, su revisión independiente D05/D07, C1, routing, orchestration, el procedimiento PXIL y el código de shell/Inicio/Dashboard.

Mandato aplicado: implementar únicamente las vistas de shell e Inicio con contratos existentes y datos verificables, preservando autorización y sin modificar dominio, aplicación, infraestructura ni API. La tarea específica autoriza los comandos de compilación/verificación local y prevalece sobre la restricción histórica del relevo. No autoriza solucionar el contrato backend.

**Único archivo de entrega escrito por el agente:** este informe. No se modificaron fuentes, dependencias ni `docs/DESIGN.md`: no hay cambio visual implementado que incorporar como vigente. Los verificadores pueden generar cachés y artefactos de TypeScript/Next en el worktree; no son cambios de producto ni evidencia de aprobación.

No se usaron git/gh, no se crearon ramas ni subagentes, no se levantó servidor, no se desplegó ni se ejecutaron migraciones. Snapshot local inspeccionado; commit/publicación/ancestro **no verificados**.

### Regla que impide comenzar la construcción

Fuente: [PERFIL.md](../dispatch/20261003T202831Z-D09-codex/PERFIL.md), sección incorporada «D09 — Método operativo / Contrato de entrada»:

> Sin estos tres, no implemento.

La regla enumera matriz D05 de estados, contrato D03 de módulo y esquema/contrato de datos. Existe un tipo TypeScript y una aprobación de la auditoría general; eso no permite distinguir los estados que la fuente colapsa ni resuelve los mensajes pendientes. No se interpreta la aprobación D05/D07 como autorización para inventar procedencia, permisos, periodo, copy o capacidades.

C1 figura `activo` en `.viltrum/commercial.md`; no se pidió una nueva aceptación comercial. El bloqueo corresponde al contrato y a las entradas de implementación, no a una denegación de permisos de escritura. No hubo rechazo automático de una edición.

### Hallazgos comprobados en fuente

Los escenarios siguientes son deducciones directas del código. **No se ejercitaron contra una base de datos ni en navegador.** Severidad propuesta para revisión independiente.

| ID | Evidencia archivo:línea | Escenario y efecto | Dueño |
|---|---|---|---|
| D09-B01 · P1 · Datos reales/vacío indistinguibles | `src/infrastructure/db/repos/dashboard.ts:192-217`, `:221-245`; `src/application/dashboard/puertos.ts:10-35` | Un conteo real de cero se sustituye por 48 leads, 7 cierres, 5 leads propios u otras cantidades mediante `||`. Una colección vacía se sustituye por `BASE_LEADS`. Un error produce métricas demo con el mismo tipo de respuesta. La vista no recibe estado ni procedencia. No puede presentar con veracidad KPI, contador, vacío o error de servicio. | D10/D03; revisión D11/D12 |
| D09-B02 · P1 · Periodos/meta no acreditados | `src/infrastructure/db/repos/dashboard.ts:114-117`, `:133-137`, `:147-156`, `:179-190`; `src/app/(crm)/inicio/vista.tsx:40-55` | «Leads del mes» consulta todos los leads no borrados; «Cierres del mes» carece de rango de fecha; citas hoy/semana cuenta reuniones sin rango. La meta toma una fila con `limit(1)`, sin mes/orden, y si falta crea por defecto 2/4 y 50 %. No se puede afirmar periodo vigente ni distinguir ausencia de meta. | D10/D03 y D01/D02 |
| D09-B03 · P1 propuesto · Alcance del radar | `src/app/(crm)/inicio/page.tsx:18-25`; `src/application/dashboard/puertos.ts:38`; `src/infrastructure/db/repos/dashboard.ts:68-95` | La guardia comprueba acceso a Dashboard, pero el repositorio recibe ID, slug y nombre, sin alcance. Solo restringe la cola por responsable si el slug es broker. Un rol distinto con alcance propio o sin `leads:view` puede recibir leads globales por este camino. **Exposición efectiva y combinación de permisos vivos no verificadas.** Un enlace oculto en cliente no corrige datos ya serializados. | D10/D03, revisión D12/D14 |
| D09-B04 · P2 · Radar sin regla operativa | `src/infrastructure/db/repos/dashboard.ts:96-106`, `:215` | La cola es de cuatro leads recientes ordenados por creación; `next` se rellena con «Contactar hoy» para todos, no con una actividad o plazo acreditado. «Avances por revisar» es 1 literal. No respalda prioridad, SLA, vencimiento ni alertas. | D01/D02 para significado; D10 para contrato |
| D09-B05 · Entrada bloqueante · Estados/copy | `.viltrum/crm-ux/D04-crm-ux-audit.md` §6 y §14/Q12; `PERFIL.md`, contrato de entrada y §6 i18n | D04 registra las brechas actuales y propone un contrato general para D06/D08; no entrega mensajes concretos completos para cada región nueva de shell/Inicio. No se localizó un catálogo oficial de i18n bajo `src/` mediante inventario y búsqueda. La implementación no puede introducir un diccionario local ni textos nuevos incrustados conforme al perfil. | D05/D06/D08/D03 |
| D09-B06 · Entrada pendiente · Identidad de usuario | `src/app/(crm)/inicio/page.tsx:24`; `src/infrastructure/auth/actor.ts:61-66,91-93` | Inicio pasa nombres fijos por slug; Actor expone ID, slug y permisos, pero no nombre de usuario. No se puede construir una cabecera nominal auténtica usando esos valores fijos. Se puede conservar cabecera de rol/sesión, pendiente de especificación. | D03/D10 y D05 |

**B01 es determinante:** una interfaz no puede recuperar la procedencia perdida. Inferir demo por nombres, IDs, cantidad o porcentaje sería inventar y fallaría cuando un registro real coincidiera. Capturar un error en la página tampoco resuelve el error absorbido por el repositorio. Detectar `navigator.onLine` solo describe el navegador; no acredita disponibilidad de la base de datos.

**B03 no se presenta como un ataque confirmado.** Se señala el flujo de datos que D12/D14 debe reproducir con roles/alcances controlados. La guardia de Dashboard existe; lo pendiente es autorización del dato agregado y de la cola, no ausencia total de autenticación.

### Reutilización y componentes

Se inventariaron `components.json` y `src/components/ui/`. Ya existen Sidebar, Dialog, Sheet, Button, Input, Badge, Skeleton, Separator, Tooltip y Sonner. La prioridad aplicable es reutilizar esas primitivas shadcn antes de adquirir otras.

Command/cmdk no aparece en las primitivas ni dependencias inspeccionadas. La paleta puede buscar **destinos autorizados**, según D04 §7; la búsqueda de entidades no dispone de contrato en este alcance. No se creó un endpoint ni se prometió esa búsqueda.

No se ejecutó `npx shadcn@latest add`: incorporar Command modifica primitivas y posiblemente manifiesto/lockfile, archivos que no están expresamente asignados. Además, la construcción está detenida por las entradas anteriores. Esto queda como dependencia concreta del siguiente despacho, no como una instalación realizada o fallida.

Las fichas privadas K04/K08/K14 constan en la auditoría D04 como candidatas sin fuente. **No fueron adquiridas ni inspeccionadas nuevamente por D09; fuente/licencia/compatibilidad actuales no verificadas.** No se atribuye código a Viltrum Design ni se declara un componente adoptado. No se construyó una sustitución propia desde cero; no aplica una puntuación de compra/construcción consumada.

### Trazabilidad de criterios

| REQ → pantalla/región → contrato | Resultado actual | Evidencia / siguiente paso |
|---|---|---|
| REQ-UX-01 → shell → `MODULOS` + permisos | Shell existente sin grupos/migas/paleta nuevos | `layout.tsx`, `modulos.ts`, `nav-link.tsx`; D05/D03 deben concretar entradas y archivos auxiliares |
| REQ-UX-02 → Inicio → abrir lead concreto | Pendiente; enlace actual va a listado | `inicio/vista.tsx:70-71`; después de corregir fuente, consumir ID autorizado y destino existente |
| REQ-UX-03 → Inicio → seis estados | Bloqueado | D09-B01/B05; el contrato no distingue servicio fallido, demo y colección vacía |
| REQ-UX-04 → ambas pantallas → 320/390/768/1440 | No verificado en navegador | Sin capturas, resize, zoom/reflow o lector de pantalla; D14/D07 |
| REQ-UX-05 → radar/KPI/contadores → alcance | Pendiente de corrección/QA | D09-B03; no certificar por slug ni ocultación de enlace |
| REQ-UX-06 → tokens → DESIGN | Diseño existente leído; sin cambios | Primitivas shadcn presentes; no se aprobó contraste nuevo |
| REQ-UX-07 → vistas → frontera SOLID | Respetado por esta sesión | Ningún cambio a dominio/aplicación/infraestructura/API |
| REQ-UX-08 → biblioteca → procedencia | Sin adopción | Metadatos citados por D04, no fuente verificada por D09 |

### Matriz de estados: evidencia disponible y pendientes

| Estado | Shell/Inicio recibido | Lo que falta para comprobar el rediseño |
|---|---|---|
| Carga | `src/app/(crm)/loading.tsx` compartido | Skeleton regional, estabilidad y anuncio en la receta D05; navegador |
| Vacío | Backend reemplaza cola vacía por ejemplos | Preservar colección vacía y copy/action aprobados |
| Error | Boundary `src/app/(crm)/error.tsx` existente | El fallo de Dashboard debe ser observable; recuperación regional |
| Sin conexión | Catch backend retorna demo; sin procedencia | Estado explícito de servicio; no prometer cola/cache/sync inexistentes |
| Éxito | Render de un DTO sin procedencia | Confirmar origen real, alcance, periodo y antigüedad |
| Permiso | `requireScopeInPage` y `forbidden.tsx` existentes | Alcance por dato/acción y reproducción de revocación/403 sin divulgación |

No se marcaron escenarios como probados por existir JSX o documentación.

### Seguridad (§6 del flujo de trabajo)

No se creó tabla, vista SQL, función, ruta API, cuerpo JSON, variable de entorno, exportación ni upload. No se añadió HTML sin sanitizar ni acceso a almacenamiento del navegador. Las comprobaciones automáticas de RLS y permisos por ruta pasaron dentro de `npm test`; eso no acredita la configuración viva ni el alcance correcto de todas las consultas.

Hallazgo concreto de confidencialidad pendiente: D09-B03. No hubo diff de código propio para revisar ni corregir. No se leyeron archivos de secretos, no se listó configuración de entorno ni cadenas de conexión; no se ejecutaron `docker inspect` ni `printenv`. **No apareció un secreto identificado en las salidas observadas.**

### Identificación por SHA256 (sin git)

| Archivo | SHA256 |
|---|---|
| `src/app/(crm)/layout.tsx` | `E4E88078A5962723C8E6E8A3C50100BB0EE4A4B9347D220220D98387118C6504` |
| `src/app/(crm)/inicio/page.tsx` | `95B854B7A6236CEEFA37D39C0E8F01ABEAE699C2DF1DED6747EABA6ABE0DF3D0` |
| `src/app/(crm)/inicio/vista.tsx` | `FE535777A2F00B7C4BF3D60AB26C1A76AF66E380B62AB4A61B3B8726B62A28DC` |
| `docs/DESIGN.md` | `3F6DA9DD0360DECE295ADE609FB3319638BE48ADFC3272A22E473C0B14D160BD` |
| `src/application/dashboard/puertos.ts` | `CF4B2FB955384E46D7CCC07AE0020AB013EDF417CDEF0CE0FD4F466ABFA02B0A` |
| `src/infrastructure/db/repos/dashboard.ts` | `EF7BA5A89425F165202FF16E4EA32219810BEAB82CECA7CA877E1B11E9366699` |

## Pruebas

Verificaciones ejecutadas personalmente en el worktree asignado, sin cambios de producto. En PowerShell se usaron los ejecutables `.cmd` para evitar el wrapper `.ps1`; los scripts npm son los mismos solicitados.

| Comando real | Exit | Resultado |
|---|---:|---|
| `npx.cmd tsc --noEmit` | 0 | Sin diagnósticos |
| `npm.cmd test` | 0 | 439 pruebas, 439 pasan, 0 fallan, 0 omitidas |
| `npm.cmd run build` | 1 | Fallo webpack: EACCES/EPERM y descarga de fuentes; raíz inferida fuera del worktree |
| `npm.cmd run lint` | 0 | 0 errores; 3 warnings preexistentes |

**El build no está verde.** Next selecciona `C:\Users\wilbe` como raíz por la presencia de otro lockfile; registra fallos de fuente, `EACCES` y `EPERM readlink`. Se observó el fallo en el entorno restringido. No se demostró cuál de esos problemas persistiría fuera del sandbox. No se modificó configuración, no se borró el lockfile ajeno y no se intentó elevar permisos.

Las fuentes del layout raíz se consumen mediante `next/font/google` (`src/app/layout.tsx:2,13-22`). Ese archivo y `next.config.ts` están fuera de los archivos asignados. D16 debe verificar compilación en un entorno con raíz y permisos correctos. Un resultado de otro agente no se sustituye por esta corrida fallida.

No hubo prueba funcional ni captura del rediseño porque no se implementó. No se usó la vitrina histórica para atribuirle código de este worktree. Responsive, teclado, foco, contraste calculado, lector de pantalla, conectividad/403 reales y rendimiento **no verificados**.

### Salida de TypeScript

```text
$ npx.cmd tsc --noEmit
(sin salida)
exit_code: 0
```

### Salida completa de npm test

<details>
<summary>439 pruebas: salida íntegra observada</summary>

```text

> quisqueya-home-crm@0.1.0 test
> node --test "src/**/*.test.ts"

✔ upsert de meta de broker: el set solo toca target_* y updated_by, nunca achieved_* (6.5109ms)
✔ upsert de meta de la compañía: mismo set, conflicto por el índice parcial de broker_id nulo (1.2728ms)
✔ upsert de meta de broker: el set sí escribe target_deals, target_amount_cents y updated_by (0.7245ms)
✔ upsert de meta de la compañía: el set sí escribe target_* y updated_by (0.754ms)
✔ adaptador real de metas: ningún achieved_* en el código, dos upserts y el targetWhere de la compañía (1.8092ms)
✔ adaptador real de metas: lo que escribe en el conflicto es target_* y updated_by (1.1928ms)
✔ adaptador real de pipeline (la otra mitad): el set de incrementarMetaAlcanzada solo escribe achieved_* y updated_by, nunca target_* (7.7262ms)
✔ Academy: listar contenidos devuelve los módulos iniciales con 0% de progreso (7.5062ms)
✔ Academy: filtrar contenidos por categoría (0.4406ms)
✔ Academy: completar un video actualiza el estado y la fecha de finalización (0.7786ms)
✔ Academy: marcar pasos de un checklist recalcula el porcentaje del módulo (18.5601ms)
✔ Academy: al completar todos los contenidos se otorga la certificación del broker (0.9182ms)
✔ crear: inserta, audita y actualiza la próxima acción del negocio (9.6428ms)
✔ crear: una actividad completada no reemplaza la próxima acción (0.7056ms)
✔ crear: un broker no puede sobrescribir la próxima acción de un negocio fuera de alcance (1.3714ms)
✔ editar: null borra un campo y ausencia lo conserva (1.9034ms)
✔ editar: completar fija completedAt y reabrir la limpia (1.0848ms)
✔ exportar ICS: respeta alcance y rango de lunes a sábado exclusivo (22.6939ms)
✔ borrar: marca la fila y audita; fuera de alcance devuelve NotFoundError (0.8894ms)
✔ procesarNotaDeVozLead: procesa texto directo y propone HITL (5.2345ms)
✔ procesarNotaDeVozLead: delega audio al proveedor de transcripción (1.7474ms)
✔ asignar proyectos libres: se asignan y cada uno se audita con 'asignar' (8.6473ms)
✔ desasignar: lo que ya era del broker y no se pide, se suelta (1.0469ms)
✔ asignar y soltar a la vez: primero las asignadas, luego las soltadas (0.7007ms)
✔ sin cambios reales: no escribe ni audita nada y responde lista vacía (0.4839ms)
✔ lista vacía suelta todo lo que tenía el broker (0.7687ms)
✔ reasignar un proyecto de otro broker lo toma (alcance all) (0.9921ms)
✔ un proyecto inactivo asignado hoy NO se desasigna solo (universo activo) (0.6712ms)
✔ alcance distinto de all: 403 con el mensaje literal y nada escrito (1.7996ms)
✔ broker inexistente, inactivo o borrado: NotFoundError con el mensaje literal (1.553ms)
✔ un proyecto que no existe, está borrado o inactivo: NotFoundError y no se asigna ninguno (1.507ms)
✔ un fallo dentro de la transacción deshace las asignaciones y la auditoría (0.8549ms)
✔ alta en motivos-perdida: slug a partir del nombre, posición 0 y auditoría de loss_reason (38.7641ms)
✔ edición en motivos-perdida: solo las claves presentes, con antes/después y auditoría de loss_reason (0.9302ms)
✔ edición en motivos-perdida: una entrada inexistente da NotFoundError y no audita (59.4019ms)
✔ alta en canales: slug a partir del nombre, posición 0 y auditoría de lead_source (0.4189ms)
✔ edición en canales: solo las claves presentes, con antes/después y auditoría de lead_source (0.4301ms)
✔ edición en canales: una entrada inexistente da NotFoundError y no audita (0.2336ms)
✔ el id de un tipo no se encuentra en el otro (0.4776ms)
✔ slug repetido: se añade el sufijo con el número de coincidencias + 1 (0.4215ms)
✔ alta con nombre sin letras ni dígitos usa el slug 'elemento'; con posición la respeta (0.7521ms)
✔ un fallo dentro de la transacción no deja fila ni auditoría (1.6577ms)
✔ esTipoCatalogo: solo las dos claves; un tipo desconocido (o heredado de Object) no pasa (0.3779ms)
✔ aprobar una pendiente: estado, aprobador y fecha, con su auditoría (5.2451ms)
✔ pagar una aprobada: estado y fecha de pago, sin tocar el aprobador (0.5611ms)
✔ anular una pendiente y una aprobada (0.6062ms)
✔ cambiar el reparto de una pendiente recalcula montos y deja el total (0.5684ms)
✔ transición inválida pending → paid: 409 con el mensaje del dominio y nada escrito (1.3293ms)
✔ transición inválida approved → approved: 409 con el mensaje del dominio y nada escrito (0.4171ms)
✔ transición inválida paid → void: 409 con el mensaje del dominio y nada escrito (0.3449ms)
✔ transición inválida paid → approved: 409 con el mensaje del dominio y nada escrito (0.4964ms)
✔ transición inválida void → approved: 409 con el mensaje del dominio y nada escrito (0.484ms)
✔ transición inválida void → paid: 409 con el mensaje del dominio y nada escrito (0.5439ms)
✔ el reparto de una comisión no pendiente se rechaza con el mensaje literal (0.7709ms)
✔ una comisión inexistente es NotFoundError (1.4171ms)
✔ la comisión de un negocio borrado responde NotFoundError y no se escribe nada (0.471ms)
✔ una comisión ajena con alcance own es NotFoundError; la propia se edita (0.6103ms)
✔ una comisión sin broker solo la alcanza `all` (0.4542ms)
✔ si al bloquear el estado ya cambió (otra petición ganó), la transición se decide con el estado REAL (0.7752ms)
✔ el reparto también se decide con el estado real tras el bloqueo (1.4821ms)
✔ un fallo del repositorio al escribir no deja ni cambio ni auditoría (0.8106ms)
✔ el CSV lleva el encabezado y el orden de columnas exactos (2.8538ms)
✔ sin proyecto, broker ni fecha: vacío, 'Sin asignar' y vacío (0.3572ms)
✔ el CSV de cero filas es solo el encabezado con BOM (0.2983ms)
✔ el nombre de archivo lleva el periodo (AAAA-MM) cuando hay filtro (2.7901ms)
✔ el alcance filtra: un broker solo exporta lo suyo; all exporta todo (0.641ms)
✔ el caso de uso pasa actor, alcance y filtros a la consulta tal cual (0.9078ms)
✔ un nombre que empieza como fórmula sale neutralizado (domain/csv.ts) (1.1022ms)
✔ el adaptador real bloquea SOLO la fila de commissions: .for("update", { of: commissions }) (2.9522ms)
✔ auditoría en memoria: registrar deja rastro del actor, la acción y la entidad (4.0934ms)
✔ auditoría en memoria: acepta un registro sin antes ni despues (0.6805ms)
✔ auditoría en memoria: los registros múltiples conservan el orden (0.4892ms)
✔ almacenamiento en memoria: urlsFirmadas devuelve una url por ruta, en el mismo orden (13.9046ms)
✔ almacenamiento en memoria: una ruta desconocida da null (0.7973ms)
✔ almacenamiento en memoria: subir sobre una ruta ocupada lanza ConflictError con el nombre visible (1.6234ms)
✔ almacenamiento en memoria: borrar quita el objeto y no lanza con rutas inexistentes (0.6006ms)
✔ almacenamiento en memoria: urlsFirmadas([]) devuelve [] (0.3742ms)
✔ admin de Auth en memoria: invitar devuelve un id no vacío o null (0.5858ms)
✔ admin de Auth en memoria: el correo invitado queda registrado (0.7287ms)
✔ unidad de trabajo en memoria: el callback recibe la misma identidad de repos (0.6327ms)
✔ unidad de trabajo en memoria: el valor devuelto por fn llega al llamante (0.7496ms)
✔ unidad de trabajo en memoria: si fn lanza, el error se propaga tal cual y no queda nada escrito (0.8046ms)
✔ almacenamiento en memoria: fallarAlSubirCon fuerza el motivo en el mensaje (0.6302ms)
✔ almacenamiento en memoria: ruta ocupada usa el motivo `El objeto ya existe.` (0.824ms)
✔ almacenamiento en memoria: urlsFirmadas lleva la ruta y la vida en la url (0.5008ms)
✔ almacenamiento en memoria: fallarAlFirmarCon lanza ConflictError (0.5289ms)
✔ admin de Auth en memoria: numera los ids de usuario (0.1828ms)
✔ admin de Auth en memoria: fallarCon lanza ConflictError y no registra el correo (0.3033ms)
✔ admin de Auth en memoria: sinIdDeUsuario devuelve null pero registra el correo (0.2012ms)
✔ auditoría en memoria: guarda actor, antes y después (0.3024ms)
✔ unidad de trabajo en memoria: cuenta confirmadas y revertidas (0.3891ms)
✔ unidad de trabajo en memoria: restaura todos los reversibles si fn lanza (0.6773ms)
✔ crearPlantillaMensaje: extrae variables automáticamente y guarda (6.3078ms)
✔ crearPlantillaMensaje: rechaza nombre o cuerpo vacío (1.1703ms)
✔ prepararYDespacharMensaje: interpola variables y despacha por el canal (1.1481ms)
✔ actualizarPlantillaMensaje: actualiza y recalcula variables al cambiar el cuerpo (0.5852ms)
✔ crear: asigna responsable y autoría al actor y audita con la fila completa (5.2863ms)
✔ crear con teléfono duplicado sin crearIgual: ConflictError con candidatos, sin crear ni auditar (4.4532ms)
✔ F04 contactos: advertencia global y candidatos visibles con own, teléfono (2.3873ms)
✔ F04 contactos: advertencia global y candidatos visibles con own, correo (0.6693ms)
✔ F04 contactos: advertencia global y candidatos visibles con team, teléfono (0.6843ms)
✔ F04 contactos: advertencia global y candidatos visibles con team, correo (0.3987ms)
✔ F04 contactos: advertencia global y candidatos visibles con none, teléfono (0.4395ms)
✔ F04 contactos: advertencia global y candidatos visibles con none, correo (0.3685ms)
✔ F04 contactos: advertencia global y candidatos visibles con all, teléfono (2.0574ms)
✔ F04 contactos: advertencia global y candidatos visibles con all, correo (1.2492ms)
✔ F04 contactos: candidato exclusivamente ajeno mantiene advertencia sin PII y permite crearIgual (1.2772ms)
✔ F04 contactos: la consulta identificable de duplicados aplica visibleRows en SQL (22.1382ms)
✔ crear con correo duplicado sin crearIgual: ConflictError, sin crear ni auditar (0.5813ms)
✔ crear con duplicado y crearIgual: crea (0.3813ms)
✔ crear sin teléfono ni correo: no consulta duplicados y crea (0.3301ms)
✔ crear normaliza el teléfono a E.164 y conserva lo que escribió el usuario (0.33ms)
✔ editar: cambia solo los campos presentes y audita antes y después (0.8885ms)
✔ editar con phone null borra phone y phoneDisplay; sin la clave los deja igual (0.4489ms)
✔ editar con brokerId y alcance own: ForbiddenError y no escribe nada (0.5902ms)
✔ editar con brokerId y alcance all: reasigna (0.333ms)
✔ editar un contacto fuera del alcance: NotFoundError y no escribe (0.466ms)
✔ borrar: escribe deletedAt, conserva la fila, audita eliminar y deja de verse (0.5606ms)
✔ borrar un id inexistente o fuera de alcance: NotFoundError (0.3518ms)
✔ un fallo dentro de la transacción no deja fila ni auditoría (0.7987ms)
✔ renombrar: cambia el nombre, deja lo demás y audita con antes/después (9.7308ms)
✔ defaultProbability: null la borra; ausente la deja (3.0678ms)
✔ posición y activa se editan (1.3441ms)
✔ una etapa inexistente da NotFoundError y no audita (1.5063ms)
✔ kind y slug en la entrada NO cambian la fila guardada (0.6284ms)
✔ el tipo CambiosEtapa no admite kind ni slug (ni a mano) (0.4382ms)
✔ el adaptador real arma el set de la etapa sin nombrar kind ni slug (4.1609ms)
✔ alta: crea contacto y lead, sugiere el broker de sugerirBroker y audita las dos filas con actor (8.4909ms)
✔ alta con contactId existente: no crea contacto y solo audita el lead (0.8346ms)
✔ alta con contactId que no existe o está borrado: NotFoundError y nada escrito (1.5588ms)
✔ alta con teléfono duplicado: ConflictError con candidatos; con crearIgual crea (1.2349ms)
✔ F04 leads: candidatos de contacto respetan contacts:view own, teléfono (0.8618ms)
✔ F04 leads: candidatos de contacto respetan contacts:view own, correo (0.4288ms)
✔ F04 leads: candidatos de contacto respetan contacts:view team, teléfono (0.3949ms)
✔ F04 leads: candidatos de contacto respetan contacts:view team, correo (0.4197ms)
✔ F04 leads: candidatos de contacto respetan contacts:view none, teléfono (0.4885ms)
✔ F04 leads: candidatos de contacto respetan contacts:view none, correo (0.8875ms)
✔ F04 leads: candidatos de contacto respetan contacts:view all, teléfono (0.5157ms)
✔ F04 leads: candidatos de contacto respetan contacts:view all, correo (0.3858ms)
✔ F04 leads: sin contacts:view, duplicado ajeno solo avisa y crearIgual conserva alta (0.6517ms)
✔ F04 leads: la consulta identificable de duplicados aplica visibleRows en SQL (2.4523ms)
✔ alta sin contactId ni nombre: ValidationError (protege al caso de uso de una entrada sin Zod) (0.6449ms)
✔ alta: un fallo dentro de la transacción no deja contacto, lead ni auditoría (0.6198ms)
✔ asignar: escribe brokerId y audita asignar con antes y después (1.8942ms)
✔ asignar a quien no es un broker activo: ValidationError literal y nada escrito (0.6211ms)
✔ asignar: el broker inválido gana al lead inexistente (se valida antes de leer el lead) (0.3807ms)
✔ asignar un lead fuera del alcance (o borrado): NotFoundError (0.5124ms)
✔ asignar un lead PROPIO con alcance own funciona (H16: deliberado, comportamiento actual) (0.414ms)
✔ descartar: marca discarded con el motivo y audita descartar (0.7971ms)
✔ descartar: guardas de estado con sus mensajes literales (0.6784ms)
✔ descartar un lead inexistente, borrado o fuera del alcance: NotFoundError (0.4688ms)
✔ webhook: la primera entrega crea contacto y lead, con dos filas de auditoría SIN actor, y responde creado (1.3383ms)
✔ webhook repetido con el mismo externalId: no duplica, devuelve el existente con creado false y NO audita (7.0923ms)
✔ webhook: un lead borrado con ese externalId no cuenta (el índice único es parcial) (0.7098ms)
✔ webhook con teléfono o correo de un contacto existente: lo reutiliza y no crea otro (1.0503ms)
✔ webhook sin teléfono ni correo: crea un contacto nuevo (0.4751ms)
✔ webhook: un fallo a mitad (al auditar el lead) no deja contacto, lead ni auditoría (0.863ms)
✔ la idempotencia del webhook sigue siendo un upsert atómico, con el predicado del índice parcial (3.6446ms)
✔ convertir: crea el negocio en la primera etapa abierta, marca el lead convertido y audita (8.1896ms)
✔ convertir un lead sin responsable ni tipo de operación: el negocio queda con quien convierte y en venta (0.894ms)
✔ convertir: guardas de estado con sus mensajes literales (1.8177ms)
✔ convertir sin etapa inicial en el embudo: ConflictError y nada escrito (0.6317ms)
✔ convertir un lead inexistente, borrado o fuera del alcance: NotFoundError (0.9879ms)
✔ convertir un lead propio con alcance own funciona (0.6612ms)
✔ un fallo a mitad de la conversión no deja negocio, lead convertido ni auditoría (1.1491ms)
✔ fijar la meta de un broker crea la fila y la audita como 'crear' (3.7676ms)
✔ fijar la meta de la compañía (brokerId nulo) no pide perfil de broker (0.5257ms)
✔ fijar la meta NO toca achieved_*: si ya había valores, siguen igual (0.7942ms)
✔ fijar dos veces el mismo periodo actualiza en vez de duplicar, y la segunda se audita como 'editar' (0.6684ms)
✔ la meta del broker y la de la compañía del mismo periodo son filas distintas (1.2293ms)
✔ sin targetAmountCents en la edición, el monto que ya había se conserva (0.4334ms)
✔ un broker sin perfil: NotFoundError con el mensaje literal y nada escrito (1.2335ms)
✔ alcance own: la propia meta sí; la de otro broker y la de la compañía, 403 con el mensaje literal (0.8088ms)
✔ un fallo dentro de la transacción no deja meta ni auditoría (0.7873ms)
✔ restaurar contact: quita deletedAt, audita con la entidad correcta y solo escribe deletedAt (9.6272ms)
✔ restaurar lead: quita deletedAt, audita con la entidad correcta y solo escribe deletedAt (0.5451ms)
✔ restaurar deal: quita deletedAt, audita con la entidad correcta y solo escribe deletedAt (0.3469ms)
✔ restaurar project: quita deletedAt, audita con la entidad correcta y solo escribe deletedAt (0.2863ms)
✔ restaurar unit: quita deletedAt, audita con la entidad correcta y solo escribe deletedAt (0.3676ms)
✔ restaurar user: quita deletedAt, audita con la entidad correcta y solo escribe deletedAt (0.3361ms)
✔ restaurar algo que no está borrado da NotFoundError y no audita (1.6027ms)
✔ restaurar algo inexistente da NotFoundError (0.4511ms)
✔ una fila sin columna deletedAt da NotFoundError (3.36ms)
✔ el mismo id en otra entidad no cuenta (0.9789ms)
✔ un fallo dentro de la transacción deja la fila borrada y sin auditoría (4.1798ms)
✔ cambio simple: escribe el historial y audita cambiar_etapa con antes y despues (9.9655ms)
✔ cambio a una etapa con requisito sin cumplir: ConflictError de transicion-etapa y nada escrito (1.7987ms)
✔ presentación exige una próxima acción vigente: pendiente, con responsable y fecha (13.4277ms)
✔ un negocio ya cerrado no cambia de etapa (1.1883ms)
✔ pérdida con motivo: audita marcar_perdido y guarda lossReasonId y lossComment (0.8522ms)
✔ pérdida sin comentario guarda lossComment en null (0.5666ms)
✔ pérdida sin motivo: el ConflictError de transicion-etapa y nada escrito (0.5565ms)
✔ negocio de otro broker con alcance own: NotFoundError, igual que uno inexistente (0.9308ms)
✔ con alcance all un administrador mueve el negocio de otro broker (0.9117ms)
✔ negocio en la papelera: NotFoundError (0.6614ms)
✔ etapa destino inexistente o inactiva: NotFoundError con su mensaje (0.6495ms)
✔ etapa actual que ya no existe en el embudo: ConflictError (0.4848ms)
✔ editar: null borra el campo, ausente lo deja, y audita editar con antes y despues (0.8823ms)
✔ editar un negocio cerrado: ConflictError y nada escrito (0.4664ms)
✔ editar un negocio ajeno, borrado o inexistente: NotFoundError (0.517ms)
✔ asociar: crea la propiedad, desmarca la principal anterior y audita crear deal_property (1.9791ms)
✔ asociar sin isPrimary no toca la principal existente (0.8882ms)
✔ asociar un proyecto fuera del alcance sobre projects: NotFoundError con su mensaje (2.1733ms)
✔ asociar una unidad de otro proyecto: NotFoundError con su mensaje y nada escrito (0.6305ms)
✔ asociar a un negocio cerrado: ConflictError (0.6549ms)
✔ marcar principal: desmarca las demás y audita editar con antes y despues (0.875ms)
✔ marcar o quitar una propiedad de otro negocio: NotFoundError (0.9463ms)
✔ quitar: borra la propiedad y audita eliminar solo con antes (0.48ms)
✔ quitar en un negocio cerrado: ConflictError y la propiedad sigue (0.3787ms)
✔ cierre completo: ocurren los ocho pasos, en una sola unidad de trabajo (355.9275ms)
✔ cierre sin monto en el body usa el monto que ya tenía el negocio (1.5802ms)
✔ cierre de un alquiler deja la unidad reservada, no vendida (1.4257ms)
✔ cierre sin unidad principal resuelta: ConflictError de transicion-etapa y nada escrito (1.6654ms)
✔ dos cierres del mismo periodo SUMAN en la misma fila de meta, no crean otra (2.7048ms)
✔ una meta que ya existe para el periodo se suma, sin tocar su target (1.5562ms)
✔ el perfil se RECALCULA con el total ganado del año, no se incrementa (2.0155ms)
✔ cierre de un negocio cuyo broker no tiene perfil: no falla y no recalcula nada (1.0505ms)
✔ cierre de un negocio sin responsable: solo incrementa la meta de la compañía (1.0303ms)
✔ cierre sin commissionBasisPoints: ConflictError con el mensaje exacto y nada escrito (1.0538ms)
✔ defensa 2: si el bloqueo revela que la etapa ya no es open, ConflictError del doble cierre y nada escrito (1.1284ms)
✔ defensa 2 también frente a una pérdida que ganó la carrera (0.9612ms)
✔ cerrarNegocioGanado directo: un negocio que no existe detrás del bloqueo es NotFoundError (0.6346ms)
✔ un fallo a mitad del cierre no deja nada escrito (1.276ms)
✔ el adaptador real bloquea la fila del negocio: bloquearNegocio usa .for("update") (6.049ms)
✔ el upsert de la meta de compañía conserva el targetWhere de su índice parcial (0.9366ms)
✔ el recálculo anual conserva la zona horaria de Santo Domingo (0.7416ms)
✔ proyectos y unidades: alta, edición, borrado y auditoría (11.1509ms)
✔ fases: recalcula avance al crear, editar y borrar (7.7581ms)
✔ fotos: compensa exactamente las subidas y conserva el error del INSERT (12.7437ms)
✔ fotos: el nombre visible nunca decide la ruta del bucket (0.9842ms)
✔ alcance own: proyecto ajeno no escribe ni audita fases, fotos ni unidades (1.6625ms)
✔ los permisos del rol administrador no son editables (4.281ms)
✔ la matriz normal reemplaza celdas ausentes y audita (0.7692ms)
✔ el ultimo administrador no se puede editar ni borrar, y no escribe ni audita (5.3365ms)
✔ alcance own no puede editar ni borrar, ni su propia fila (0.6589ms)
✔ alta usa AdminAuth, conserva el orden y registra auditoria (4.4718ms)
✔ edicion y borrado normales auditan, y el reenvio llama al puerto (1.3487ms)
✔ coincide por especialidad contra el proyecto o la zona de interés (5.8907ms)
✔ coincide por handlesRentals cuando la operación es de alquiler, aunque la especialidad no calce (0.2989ms)
✔ sin ningún candidato que coincida, devuelve null (0.2646ms)
✔ sin candidatos, devuelve null sin lanzar (0.2405ms)
✔ con varios candidatos que coinciden, desempata por menor annualSalesCents (reparte carga) (0.425ms)
✔ empate exacto en annualSalesCents conserva el primero del orden recibido (0.3256ms)
✔ operationType null u operación de venta no activa la coincidencia por handlesRentals (0.2082ms)
✔ diffAsignacion no toca lo que ya estaba igual (2.9415ms)
✔ diffAsignacion detecta lo nuevo y lo soltado (0.3066ms)
✔ diffAsignacion vacío a vacío no hace nada (1.4316ms)
✔ diffAsignacion desasigna todo cuando no se elige ninguno (0.5543ms)
✔ AudioLeadExtractor: extrae prospecto de compra en Bávaro (3.5531ms)
✔ AudioLeadExtractor: extrae alquiler en Santo Domingo Piantini (1.9553ms)
✔ AudioLeadExtractor: extrae rango de lujo en Cap Cana con teléfono dominicano (0.6553ms)
✔ AudioLeadExtractor: texto vacío no revienta y devuelve confianza 0 (0.3397ms)
✔ promedioAvance sin fases es 0, no NaN (2.1117ms)
✔ promedioAvance redondea al entero más cercano (0.3755ms)
✔ promedioAvance con una sola fase es su propio porcentaje (0.3002ms)
✔ FASES_ESTANDAR trae exactamente las 8 fases del prototipo (0.2032ms)
✔ validarFoto rechaza un mime type que no es imagen (0.4172ms)
✔ validarFoto rechaza SVG aunque su mime empiece con image/ (0.2191ms)
✔ validarFoto rechaza una imagen de más de 10 MB (0.2123ms)
✔ validarFoto acepta cada formato ráster permitido dentro del límite (0.2148ms)
✔ validarFoto acepta exactamente el límite de 10 MB (0.2802ms)
✔ calcularComision: reparto 50/50 sobre un monto y comisión sin decimales exactos (1.7675ms)
✔ calcularComision: la suma broker + agencia siempre cuadra con el total, incluso cuando el reparto no divide exacto (0.3755ms)
✔ calcularComision: sin reparto explícito usa el 50/50 por defecto del esquema (0.3772ms)
✔ evaluarNivelBroker: por debajo del primer corte es junior (0.3476ms)
✔ evaluarNivelBroker: exactamente en el corte confirmado por el prototipo sube a senior (0.2654ms)
✔ evaluarNivelBroker: sube de nivel en cada corte sucesivo (0.2199ms)
✔ evaluarNivelBroker: un valor muy por encima del último corte se queda en el nivel máximo (0.1804ms)
✔ pending → approved es válida (1.9362ms)
✔ approved → paid es válida (0.233ms)
✔ pending → void es válida (0.2157ms)
✔ approved → void es válida (0.279ms)
✔ pending → paid lanza: no se puede saltar la aprobación (0.6818ms)
✔ paid → pending lanza: una comisión pagada no retrocede (1.4783ms)
✔ paid → cualquier otro estado lanza (0.3901ms)
✔ void → cualquier otro estado lanza (0.4543ms)
✔ quedarse en el mismo estado siempre lanza (0.5267ms)
✔ el reparto se puede editar mientras la comisión está pendiente (0.4975ms)
✔ editar el reparto de una comisión aprobada lanza (0.3523ms)
✔ editar el reparto de una comisión pagada o anulada lanza (0.2723ms)
✔ renderizarPlantilla: reemplaza variables encontradas y deja intactas las ausentes (1.9942ms)
✔ extraerVariablesDePlantilla: encuentra todas las variables únicas (3.8895ms)
✔ generarEnlaceTelegram: genera enlace universal t.me sin costo (1.081ms)
✔ generarEnlaceWhatsApp: normaliza teléfono y arma enlace wa.me (0.5294ms)
✔ validarTokenTelegram: detecta tokens oficiales válidos e inválidos (0.6738ms)
✔ validarConfiguracionCanal: valida configuraciones por canal (0.5934ms)
✔ Confotur: cálculo estándar de US$150,000 con 24 meses de construcción (1.6427ms)
✔ Confotur: propiedad de lujo de US$500,000 (0.4201ms)
✔ Confotur: rechaza si la suma de porcentajes no da 100% (0.7381ms)
✔ un campo sin coma, comilla ni salto de línea se deja tal cual (2.2483ms)
✔ un campo con coma va entre comillas (0.3624ms)
✔ un campo con comillas dobles las duplica y va entre comillas (0.2318ms)
✔ un campo con salto de línea va entre comillas (0.4678ms)
✔ filaCsv escapa cada campo y los une con comas (0.3999ms)
✔ un campo que empieza con = lleva un ' de escape antes (0.2198ms)
✔ un campo que empieza con +, -, @ o tab también lleva el ' (0.2751ms)
✔ un campo que empieza con retorno de carro lleva el ' y además va entre comillas (\r también es un separador RFC 4180) (0.2459ms)
✔ una fórmula que además trae coma queda escapada Y entre comillas (0.3079ms)
✔ filaCsv no aplica el escape de fórmula a números: un negativo se serializa tal cual (0.4398ms)
✔ generarCsv arma encabezado + filas con BOM y \r\n (0.3806ms)
✔ el UID es estable: exportar dos veces el mismo evento da el mismo UID (7.4739ms)
✔ sin endsAt, asume una hora de duración (0.3638ms)
✔ escapa comas y punto y coma del título (0.292ms)
✔ sin ubicación, no escribe LOCATION (0.3381ms)
✔ una agenda vacía sigue siendo un .ics válido (0.2464ms)
✔ parsearPeriodo con ?periodo= válido usa ese año y mes (178.1963ms)
✔ parsearPeriodo sin parámetro cae al mes actual en Santo Domingo (532.0684ms)
✔ parsearPeriodo ignora un valor con formato inválido y usa el mes actual (0.7671ms)
✔ parsearPeriodo rechaza un mes fuera de 1-12 y usa el mes actual (0.7327ms)
✔ formatoPeriodo rellena el mes con cero a la izquierda (0.4251ms)
✔ cumplimientoPorcentaje con meta en 0 no divide entre cero: sin meta fijada (0.2571ms)
✔ cumplimientoPorcentaje redondea al entero más cercano (0.2757ms)
✔ esMetaCumplida es falso sin meta fijada, aunque haya negocios logrados (1.8966ms)
✔ esMetaCumplida es verdadero al alcanzar o superar la meta (0.5518ms)
✔ nombreMes no retrocede un mes en husos al oeste de UTC (11.7256ms)
✔ sin fila de permiso el alcance es none: un recurso nuevo nace cerrado (2.2695ms)
✔ el permiso es por acción, no por recurso (0.3187ms)
✔ requireScope lanza 403 cuando no hay permiso, y devuelve el alcance cuando lo hay (1.0963ms)
✔ requireFullScope exige alcance all: own sobre users no basta para gestionar usuarios (0.5903ms)
✔ con alcance own solo se alcanzan los registros propios (0.3038ms)
✔ con alcance all se alcanza cualquier registro, incluso sin responsable (0.3053ms)
✔ team se comporta como own mientras no exista modelo de equipos (1.5781ms)
✔ con alcance none no se alcanza nada, ni el registro propio (0.185ms)
✔ el precio real se borra en servidor si falta el permiso unit_real_price (0.4147ms)
✔ minúsculas y espacios a guiones (2.062ms)
✔ quita acentos (8.4784ms)
✔ colapsa símbolos y recorta guiones en los extremos (0.3284ms)
✔ un número de RD con guiones y espacios se normaliza a E.164 (3.1798ms)
✔ un número que ya viene en E.164 se conserva (0.3481ms)
✔ un número que no es de RD no se normaliza, pero se conserva el texto (0.5688ms)
✔ un número con menos o más dígitos de los que hacen falta no se normaliza (0.3925ms)
✔ vacío, solo espacios o undefined no rompen y devuelven null en los dos campos (0.3133ms)
✔ una transición sin requisito propio en §10.1 (la primera del embudo) no lanza nada (8.5887ms)
✔ → Contactado: pasa con actividad de contacto registrada (0.3662ms)
✔ → Contactado: lanza sin ninguna actividad de contacto (0.9504ms)
✔ → Presentación: pasa con próxima acción con responsable y fecha (0.3929ms)
✔ → Presentación: lanza sin próxima acción (0.9646ms)
✔ → Preselección: pasa con al menos una fila en deal_properties (0.4921ms)
✔ → Preselección: lanza sin ninguna propiedad de interés (0.4099ms)
✔ → Negociación: pasa con monto, probabilidad, comisión y fecha estimada (0.5153ms)
✔ → Negociación: lanza si falta el monto (0.5876ms)
✔ → Negociación: lanza si falta la probabilidad, aunque el resto esté completo (0.578ms)
✔ → Negociación: lanza si falta el porcentaje de comisión (0.4463ms)
✔ → Negociación: lanza si falta la fecha estimada de cierre (0.3398ms)
✔ → Cierre (won): pasa con monto final y unidad principal definida (0.2418ms)
✔ → Cierre (won): lanza sin monto final, aunque haya unidad principal (0.5ms)
✔ → Cierre (won): lanza sin unidad principal aunque haya monto — son requisitos independientes (0.9393ms)
✔ → Perdido (lost): pasa con motivo del catálogo loss_reasons (0.3048ms)
✔ → Perdido (lost): lanza sin motivo (0.2908ms)
✔ un negocio ya ganado no puede volver a transicionar (0.2416ms)
✔ un negocio ya perdido no puede volver a transicionar (0.4326ms)
✔ las 21:00 del 31 de enero en Santo Domingo dan 2026-01-31, no 2026-02-01 (62.5368ms)
✔ una hora que ya cae del lado de Santo Domingo no cambia de día (0.8168ms)
✔ medianoche UTC del día 1 todavía es el día anterior en Santo Domingo (0.8358ms)
✔ horaSantoDomingo: las 13:00 UTC son las 9:00 locales (1.6766ms)
✔ medianocheSantoDomingo: la medianoche local del 24 de julio es las 4:00 UTC (2.2999ms)
✔ lunesDeLaSemana: un viernes retrocede al lunes de esa misma semana (0.6428ms)
✔ lunesDeLaSemana: un lunes se devuelve a sí mismo (0.8622ms)
✔ lunesDeLaSemana: un domingo pertenece a la semana que empezó el lunes anterior (0.4948ms)
✔ sumarDias: cruza el fin de mes (0.5835ms)
✔ los archivos de src/ se encuentran (la prueba no se queda vacía sin avisar) (1.2862ms)
✔ domain/ no depende de nada fuera de domain/ (128.0652ms)
✔ application/ no conoce la infraestructura ni el framework (142.7957ms)
✔ infrastructure/ no importa src/app/ (85.8108ms)
✔ un módulo migrado ya no toca la base desde src/app/ (84.7037ms)
✔ serializa antes/después a JSON y escribe en la tabla audit_log (2.0206ms)
✔ deja previousValue y newValue en null cuando antes/después no vienen (0.3793ms)
✔ registra el autor, la acción y la entidad tal como se le pasan (0.2379ms)
✔ usa la transacción que recibe, no una conexión propia (0.4465ms)
✔ si la transacción falla (como en un rollback), auditar no absorbe el error (0.648ms)
✔ evaluación denegada en middleware, actor y demo: producción con flag y antiguo demo activos (244.6696ms)
✔ evaluación denegada en middleware, actor y demo: test con flag activo (61.7502ms)
✔ evaluación denegada en middleware, actor y demo: sin NODE_ENV (56.2846ms)
✔ evaluación denegada en middleware, actor y demo: sin flag explícito (43.0673ms)
✔ evaluación denegada en middleware, actor y demo: flag desactivado (36.8292ms)
✔ evaluación denegada en middleware, actor y demo: flag true en lugar de 1 (50.095ms)
✔ evaluación denegada en middleware, actor y demo: host remoto (32.3372ms)
✔ evaluación denegada en middleware, actor y demo: IP no local (38.349ms)
✔ evaluación denegada en middleware, actor y demo: subdominio engañoso (42.8805ms)
✔ evaluación denegada en middleware, actor y demo: lista de hosts (31.8051ms)
✔ evaluación denegada en middleware, actor y demo: URL en host (32.1688ms)
✔ evaluación denegada en middleware, actor y demo: sin host (31.1365ms)
✔ evaluación habilitada explícitamente en localhost (35.7284ms)
✔ evaluación habilitada explícitamente en localhost:9300 (32.5928ms)
✔ evaluación habilitada explícitamente en 127.0.0.1 (28.9402ms)
✔ evaluación habilitada explícitamente en 127.0.0.1:9300 (49.7837ms)
✔ broker conserva permisos del catálogo, identidad real y aislamiento own (28.724ms)
✔ assistant no obtiene administración, borrado ni precios internos (31.7234ms)
✔ cookie/rol unknown no se convierte en administrador (30.8036ms)
✔ cookie/rol inactive no se convierte en administrador (25.3374ms)
✔ cookie/rol deleted no se convierte en administrador (42.6472ms)
✔ cookie/rol vacío no se convierte en administrador (31.399ms)
✔ catálogo sin permisos deniega y cambios de permisos se reflejan (68.1612ms)
✔ JSON inválido, ausente o con campos extra no crea cookie (32.9538ms)
✔ fallo DB devuelve mensaje genérico sin detalles internos (32.633ms)
✔ sesión Supabase válida sigue funcionando en producción sin aceptar rol de cookie (27.581ms)
✔ F01: sin destinos registrados no hay solicitud saliente (182.6346ms)
✔ F01: rechaza URL libre, protocolo, puerto y credenciales antes de conectar (4.8243ms)
✔ F01: bloquea IP internas, reservadas y DNS mixto incluso registrados (25.5346ms)
✔ F01: IP literal interna y loopback ofuscado no alcanzan el transporte (2.5624ms)
✔ F01: fija DNS público en transporte, conserva TLS y no sigue redirects (12.9389ms)
✔ F01: timeout y errores de red no reflejan detalles externos (1.9942ms)
✔ F01: aborta DNS pendiente dentro del límite sin abrir socket (1.5579ms)
✔ F01: el timeout del transporte cancela la solicitud; error externo sanitizado (2.9416ms)
✔ F01: registro inválido mantiene el webhook cerrado (3.1921ms)
✔ F02: script sin contraseñas literales ni salida de credenciales (3.5547ms)
✔ F02: credencial obligatoria del rol desde entorno, sin fallback (16.8082ms)
✔ F03 projects: edición vacía, sin ver ni editar precio (55.957ms)
✔ F03 projects: edición inocua, sin ver ni editar precio (32.3758ms)
✔ F03 projects: edición precio, sin ver ni editar precio (24.2102ms)
✔ F03 projects: edición vacía, editar precio sin verlo (19.8692ms)
✔ F03 projects: edición inocua, editar precio sin verlo (20.9777ms)
✔ F03 projects: edición precio, editar precio sin verlo (14.8545ms)
✔ F03 projects: edición vacía, ver precio sin editarlo (22.0579ms)
✔ F03 projects: edición inocua, ver precio sin editarlo (18.0805ms)
✔ F03 projects: edición precio, ver precio sin editarlo (20.1145ms)
✔ F03 projects: edición vacía, ver y editar precio (16.057ms)
✔ F03 projects: edición inocua, ver y editar precio (14.7345ms)
✔ F03 projects: edición precio, ver y editar precio (14.2518ms)
✔ F03 units: edición vacía, sin ver ni editar precio (20.6902ms)
✔ F03 units: edición inocua, sin ver ni editar precio (16.195ms)
✔ F03 units: edición precio, sin ver ni editar precio (14.5855ms)
✔ F03 units: edición vacía, editar precio sin verlo (15.6801ms)
✔ F03 units: edición inocua, editar precio sin verlo (14.6619ms)
✔ F03 units: edición precio, editar precio sin verlo (11.7185ms)
✔ F03 units: edición vacía, ver precio sin editarlo (14.8835ms)
✔ F03 units: edición inocua, ver precio sin editarlo (23.5ms)
✔ F03 units: edición precio, ver precio sin editarlo (14.2674ms)
✔ F03 units: edición vacía, ver y editar precio (11.4121ms)
✔ F03 units: edición inocua, ver y editar precio (11.9971ms)
✔ F03 units: edición precio, ver y editar precio (11.2811ms)
✔ alcance own filtra por el responsable, con el id del actor como parámetro (7.0435ms)
✔ alcance all no añade condición: no hay nada que restringir (0.2839ms)
✔ team filtra igual que own mientras no exista modelo de equipos (0.4208ms)
✔ alcance none no devuelve nada, aunque alguien se salte requireScope (0.2436ms)
✔ visibleRows descarta siempre la papelera además de aplicar el alcance (0.7782ms)
✔ visibleRows con alcance all sigue descartando la papelera (0.3463ms)
✔ toda tabla creada en una migración tiene RLS activado (124.7778ms)
✔ toda ruta de la API comprueba permisos en servidor, salvo las públicas declaradas (322.6213ms)
ℹ tests 439
ℹ suites 0
ℹ pass 439
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 4793.6033
exit_code: 0
```

</details>

### Salida completa del build

```text

> quisqueya-home-crm@0.1.0 build
> next build

 ⚠ Warning: Next.js inferred your workspace root, but it may not be correct.
 We detected multiple lockfiles and selected the directory of C:\Users\wilbe\package-lock.json as the root directory.
 To silence this warning, set `outputFileTracingRoot` in your Next.js config, or consider removing one of the lockfiles if it's not needed.
   See https://nextjs.org/docs/app/api-reference/config/next-config-js/output#caveats for more information.
 Detected additional lockfiles: 
   * C:\Users\wilbe\Documents\.viltrum-worktrees\QuisqueyaHome_CRM\20261003T202831Z-D09-codex\package-lock.json

   ▲ Next.js 15.5.24
   - Experiments (use with caution):
     ✓ authInterrupts

   Creating an optimized production build ...
 ⨯ Failed to find font override values for font `Atkinson Hyperlegible Next`


Retrying 1/3...


Retrying 1/3...


Retrying 2/3...


Retrying 2/3...


Retrying 3/3...


Retrying 3/3...
[AggregateError: ] { code: 'EACCES' }
[AggregateError: ] { code: 'EACCES' }
Failed to compile.

Error: EPERM: operation not permitted, readlink 'C:\Users\wilbe'


> Build failed because of webpack errors
exit_code: 1
```

### Salida de lint

```text
> quisqueya-home-crm@0.1.0 lint
> eslint .


C:\Users\wilbe\Documents\.viltrum-worktrees\QuisqueyaHome_CRM\20261003T202831Z-D09-codex\src\app\(crm)\layout.tsx
  67:13  warning  Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element

C:\Users\wilbe\Documents\.viltrum-worktrees\QuisqueyaHome_CRM\20261003T202831Z-D09-codex\src\app\(crm)\pipeline\vista.tsx
  7:18  warning  'Badge' is defined but never used  @typescript-eslint/no-unused-vars

C:\Users\wilbe\Documents\.viltrum-worktrees\QuisqueyaHome_CRM\20261003T202831Z-D09-codex\src\app\login\page.tsx
  17:11  warning  Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element

✖ 3 problems (0 errors, 3 warnings)
exit_code: 0
```

## Handoff

**A D14/D07:** este paquete es un diagnóstico con verificaciones de línea base, no una implementación para aceptar. Revisar independientemente B01–B06 y el alcance de sus conclusiones. No cerrar la fase ni declarar WCAG 2.2 AA por los tests verdes o la revisión documental previa.

**A D00 → D03/D10/D11/D12:** abrir una tarea backend separada que permita corregir el contrato de Dashboard. Debe preservar ceros y vacío, distinguir error/demostración de datos operativos, expresar periodo/meta ausente, autorizar los datos por recurso/alcance y conservar procedencia. D09 no lo corrigió ni propone suprimir las pruebas para habilitarlo.

**A D05/D06/D08:** entregar receta regional con mensajes, condiciones de estado y reglas de radar/KPI ratificadas; indicar catálogo i18n único y fuente de identidad autorizada. Un radar basado en recencia debe llamarse así; no debe presentar urgencia o SLA sin regla respaldada.

**A D00 para el próximo despacho D09:** enumerar archivos de cliente/UI/catálogo requeridos además de `layout.tsx`, vistas de Inicio y DESIGN, incluido manifiesto/lockfile si se autoriza instalar Command por CLI oficial. Mantener la búsqueda limitada a destinos autorizados hasta que exista un contrato de entidades. No ampliar de forma implícita los archivos editables.

**A D16:** reproducir el build en entorno aislado apropiado; verificar raíz de trazado y fuentes, sin tocar lockfiles ajenos ni exponer configuración. Adjuntar salida real de una corrida verde o un diagnóstico reproducible.

**Plan de comprobación independiente tras implementación:**

1. Dataset sintético: cero leads/negocios/meta ausente; confirmar cero/vacío/sin meta sin ejemplos.
2. Servicio fallido con navegador online y navegador offline; distinguir fallos sin mostrar KPI demo como operación.
3. Admin, Asistente, Broker y rol con `own` distinto de broker; comprobar datos, contadores, destinos, deep links y revocación de permisos.
4. Abrir desde Inicio el lead autorizado exacto; volver sin perder orientación.
5. Ctrl+K/⌘K, navegación por teclado, Escape, trap/retorno de foco, búsqueda sin coincidencias y lector de pantalla.
6. 320/390/768/1440 px, además de 430/1024 indicados por el perfil; nombres largos, zoom 200 %, targets y ausencia de overflow global.
7. Validar periodo/alcance/denominador/progreso con fixtures conocidos; una meta inexistente no equivale a 50 % ni a cero.
8. Observar TypeScript, lint, tests y build completos del snapshot final. Los 439 tests de este informe pertenecen al estado recibido.

**Estado final:** código de fase 1 no implementado; build fallido; D14/D07 pendientes. Ningún perfil ha aprobado su propio trabajo.

