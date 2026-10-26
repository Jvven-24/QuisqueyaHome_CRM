---
id: M47
nombre: "Inventario P0: catálogo, estructura, disponibilidad, unidad, precios, materiales y calidad"
estado: READY
riesgo: R3
owner: D10
productor: D03
revisores: [D12, D14, Wilber]
fuente_de_verdad: PostgreSQL del CRM
depende_de: [M40, M43, I00]
actualizado: 2026-10-18
tarea: T-CICLO-M47-fix-R1
---

> **Compuerta D00 (2026-10-18).** Revisión independiente (`reviews/M47-revision-R1.md`, Antigravity) tras el
> recorte a alcance mínimo de una empresa (decisión #51): APROBADO CON CONDICIONES. Las condiciones se resuelven dentro de
> las rebanadas que las tocan. Las rebanadas con esquema se ejecutan en serie con las de M40 (un solo escritor de migraciones).


# M47 · Inventario para una empresa

Mandato del despacho: Quisqueya Home, mínimo completo **UI-019–025 P0**. Decisión #51 (docs/contexto/decisiones.md:348–356). Sustituye diseño anterior; R1 responde a M47-revision-R3.md.

**L1 / REVIEW**, propuesta sin implementación/autoaprobación. §9.2 conserva pendientes reales. Arquitectura R3 requiere Wilber y revisión de otro proveedor.

## 1. Propósito y usuarios

Localizar, estructurar, verificar, solicitar, aprobar y compartir. Inventario mantiene; Comercial/brokers solicitan; Marketing prepara; Legal/publicador revisan; Administración configura. Trabajos, no roles nuevos.

### 1.1 Invariantes

- Una empresa sin tenant_id/sucursales. own/all; team sigue equivalente a own.
- Autorizar antes de filtros/agregados/mapa/«desde»; excluir ocultas. Concesión vigente explícita; lectura no concede hold.
- Precio interno exige unit_real_price:view:all (editar: edit:all). DTO comercial, nunca fila completa.
- Expediente solo por designación positiva Inventario privado/Legal + permiso/alcance. Ser admin o projects:edit no basta. seller, agent, external_broker y roles nuevos sin designación reciben DTO sin propietario/título/catastro/geometría exacta/margen/comprador ajeno.
- Estado administrativo + verificación + bloqueo + venta + compromiso determinan disponibilidad. PATCH/feed no libera ventas ni compromisos.
- Reventa sin proyecto: captador obligatorio, sin torre/etapa/tipo de proyecto ni compromiso M40; hold/reserva 422, negociación M03.
- Dinero BIGINT centavos, JSON cadena entera, moneda explícita, sin float/conversión tácita; preservar snapshots M40.
- CONFOTUR exige evidencia vigente del proyecto/texto/alcance; no inferencia geográfica ni certificación jurídica del CRM.
- Versiones aprobadas conservan historia/condiciones pactadas. Archivar no borra contratos.
- Originales privados; retiro bloquea futuras descargas, no recupera copias recibidas (maestra:1467–1473).

### 1.2 Matriz única de autorización

Recursos/acciones existentes: src/domain/catalogs.ts:19–58. No se inventa compliance_claims:create.

| Acción | Permiso y restricción adicional |
|---|---|
| Catálogo/proyecto, vista personal, comparar/reportar | projects:view + alcance/concesión; unidad exige también units:view |
| Crear/editar/importar estructura | projects:create/edit/import, units:create/edit/import según objeto y alcance; asignar terceros exige all |
| Ver expediente privado | Lectura anterior + faculty inventory_private o legal_review explícita sobre el padre |
| Revisar claim / bloquear comercialización | projects:edit:all + legal_review; bloqueo administrativo también inventory_private; motivo obligatorio |
| Solicitar publicación | projects:edit o units:edit sobre objeto visible; no publica |
| Publicar/retirar ficha o aprobar material | projects:edit:all + publish; reventa también units:edit:all; persona distinta del solicitante/autor |
| Lista de precios / aprobar | projects:edit:all + price_approve/cuatro ojos en versión tipada; bandeja M43 (§6.2) |
| Compartir/exportar | projects:export + lectura; broker exige concesión export explícita |
| Hold/reserva | Permiso canónico de M40 cuando esté integrado + lectura/concesión hold; no se supone existente en el catálogo actual |

project_faculties restringe adicionalmente RBAC por objeto/usuario. Configurar exige settings:edit:all/auditoría; sin autoasignación aprobadora. Wilber acepta responsables/facultades antes del piloto; vacío deniega.

## 2. Estado actual (AS-IS)

Lectura estática local; sin remoto, BD ni configuración secreta:

| Evidencia | Hecho / consecuencia |
|---|---|
| src/infrastructure/db/schema.ts:429–537 | projects/units; project_id NOT NULL hoy. Reventa nullable propuesta. |
| src/app/api/proyectos/[id]/unidades/[unitId]/route.ts:24,41,65 | PATCH asigna status con units:edit: falta barrera M40. |
| src/domain/rbac.ts:124–129,142–150 | team=own; can permite precio own/team. Fuga pendiente de corregir en código. |
| drizzle/0007_m40_compromisos_reservas.sql:52–78,193–197,239–241 | Compromisos serial/project_id obligatorio/dueños tipados/active-resolved/FKs/índices/RLS. No recrear. |
| src/infrastructure/db/schema.ts:1384–1517 | Hold: activo/convertido/cancelado/expirado; resolver compromiso requiere fecha/motivo. |
| drizzle/0008_m40_planes_pagos_aplicaciones.sql:99–122; drizzle/0009_m40_comisiones_liquidaciones.sql:1 | Planes/pagos/comisiones ya tienen DDL; reutilizar payment_plan_templates. BD viva NO VERIFICADA. |
| M40-transaccion.md:949–975 | b1i protege, b2a hold, b2b reserva; src/application/compromisos/puertos.ts ausente del árbol leído. |
| M43-inicio-acceso.md:125–128,180–188,240–243,312 | Contrato actualizado: ApprovalInboxPort compone fuentes; precio exige FK real y comando de dominio, no solicitud commercial. |
| auditoria-2026-10-18/D21-ensamblaje-oss.md:37,231 | MapLibre candidato; teselas/escáner/storage requieren evidencia propia. |

QA/matriz-G2 son históricos; §8 exige regresión, sin afirmar su resultado actual.

## 3. Pantallas

Fuente: fuentes/backlog-Pantallas.csv:23–29; fuentes/especificacion-maestra-v1.txt:1373–1495 (desde .viltrum/vre-os/). Inventario → catálogo → proyecto con Estructura/Disponibilidad/Precios/Materiales/Calidad. /propiedades/[slug] conserva compatibilidad; unidad tiene página/hoja enlazable.

### 3.1 UI-019 · /propiedades

Lista/tarjetas/mapa: proyecto/unidad/ubicación pública/operación/precio-moneda/superficies interior-terraza-total/estado/entrega/verificación. Filtros servidor: zona/subzona/polígono/tipo/precio-moneda/habitaciones/baños/m²/piso/vista/amueblado/mascotas/entrega/disponibilidad/fuente. Consulta/URL únicas, «desde» excluye ocultas; disponible≠por confirmar.

Cambiar vista, guardar filtros personales, comparar por moneda, compartir ficha y reportar dato. Receptor de vista interna reautoriza, sin heredar concesiones. Mapa solo geometría pública; sin teselas autorizadas/fallo conserva lista/filtros con explicación, sin CDN por defecto.

### 3.2 UI-020 · /proyectos/[id]

Promotor/código/nombre/zona/etapas/torres opcionales/tipos/amenidades/entrega prevista/responsable-fuente/calidad/bloqueo. Crear/editar, duplicar sin precios/documentos/concesiones, importar preview/errores por fila, asignar responsable. Código normalizado único por proyecto, otro permite repetición; casas/solares «Sin torre». Filtros etapa/torre/entrega/calidad documental. Archivar suspende nuevas ventas/publicaciones (§6.1), conserva contratos. Avance desde obra; entrega prevista no es certificada.

### 3.3 UI-021 · /proyectos/[id]/inventario

Matriz torre/piso/unidad con texto/iconos, precio/versión, hold/caducidad permitidos y última actualización/verificación; sin comprador/titular ajeno. Filtros torre/piso/tipo/estado/precio-moneda/entrega/vista/concesión. Abrir, refrescar, solicitar hold/confirmación externa, exportar snapshot con fecha/moneda/versión y domain/csv.ts. Solo commit confirma; 409 conserva borrador/alternativas autorizadas. Pendiente externo no ocupa; dependencia/política ausente explica impedimento.

### 3.4 UI-022 · /unidades/[id]

Físico/comercial/materiales/historial y expediente separado: código/proyecto opcional/captador/superficies/anexos/precio/gastos (importe-moneda-fecha-fuente)/exclusividad con vigencia-evidencia. Editar borrador, solicitar publicación, revisar por publicador distinto, verificar, asociar parqueo/locker, registrar exclusividad. Gastos parciales rechazados en crear/editar, desconocidos no inventados. Historial filtra precio/disponibilidad/contenido/permisos/verificación. Anexo mismo proyecto sin venta/compromiso/otro paquete; reventa sin vínculos estructurales. Publicar ficha no publica título.

### 3.5 UI-023 · /proyectos/[id]/precios

Lista/moneda oficial/periodo/segmento/unidad/importe/inclusiones/plan M40 aprobado/revisión. Crear/importar, comparar impacto/propuestas, solicitar/aprobar/rechazar, programar. Filtros activa-futura/torre/tipo/variación/excepciones. Masivos/descuentos fuera de umbral: cuatro ojos §6.2. Vigencia derivada sin active_version_id/job ni solapamientos. Reserva previa intacta; migrar propuesta exige consentimiento/versión nueva. Cambio informativo no altera moneda.

### 3.6 UI-024 · /proyectos/[id]/materiales

Fotos/renders etiquetados/planos/video/tour, idioma/licencia/derechos/versión/revisión/resolución/vencimiento/visibilidad. Subir, ordenar, portada/alt, ficha con marca permitida, paquete autorizado, retirar. Filtros tipo/idioma/proyecto/revisión/resolución/licencia. Cuarentena privada, validar MIME-tamaño-contenido, escanear/sanear antes de rendición; clean/derechos/aprobación independientes. Kit aprobado conserva autoría/advertencias; sin kit identidad de empresa. Directo=creado; envío/entrega con evidencias separadas. Retiro revoca/avisa preservando historia.

### 3.7 UI-025 · /proyectos/[id]/calidad

Checklist/documentos/responsable/resolución/texto/alcance/fechas y confirmado-no confirmado-vencido. Filtros faltantes/vencidos/inventario antiguo/contradicciones/pendientes. Revisar, pedir corrección-tarea, aprobar afirmación, bloquear publicación, registrar vigencia. Legal designado, agente solo resultado/texto permitido. Sin resolución no badge/beneficio; cambio de alcance/texto/evidencia invalida; vencimiento por lectura, sin depender de job.

### 3.8 UX común

Seis estados por pantalla: carga finita; vacío con motivo/acción; error español/reintento/campo; sin conexión con antigüedad/sin mutación confirmada; éxito persistido/versionado; permiso insuficiente con retorno (403 acción/404 fila). Conflicto 409 conserva borrador; token conocido revocado/vencido 410; inexistente 404 sin skeleton infinito. aria-invalid/descripción/foco al primer error; teclado y motivo de impedimento.

320/390: encabezado/búsqueda/filtros en hoja/tarjetas/acción visible; matriz con lista equivalente, precios resumidos/detalle en hoja. 768/1440: filtros/tabla-matriz-galería/detalle. Reusar _ui/components/ui y docs/DESIGN.md. IDs de galería/wireframes aprobados NO VERIFICADOS; D05/D07 validan siete pantallas/cuatro anchos antes de L4.

## 4. Funciones (casos de uso)

Zod estricto cliente/servidor sobre campos de §3/§5; IDs enteros positivos, públicos UUID (requestId externo string UUID); dinero cadena entera/moneda tipada; UTC/presentación Santo Domingo. Rechazar extras/HTML en nombres, asignación por campo. Escritura con versión/clave idempotente: mismo actor-operación-hash repite resultado; misma key/cuerpo distinto 409. M40 usa transaction_commands; dedupe local espera §9.2. Auditoría/outbox en TX, red fuera.

Común: permiso §1.2 antes de datos; errores 403 acción/404 fila/409 versión-conflicto/422 validación, 429 cupo. Salidas DTO seguras; eventos siguientes son contratos a registrar I00/M40 b1f, no insertables por presunción.

| Función | Entrada/regla específica → salida; evento |
|---|---|
| consultarCatalogo/Proyecto/Unidad | Filtros/ID → página/detalle autorizado; sin evento |
| guardarVista/comparar | Nombre-filtros/IDs reautorizados → vista/comparación; VistaInventarioGuardada |
| crearEditarEstructura/duplicar/importar | §3.2/padres/captador; preview sin escritura, duplicado aborta lote → informe/estructura; InventarioEstructuraCambiada |
| editarUnidad/registrarExclusividad | §3.4/gastos {amountCents,currency,estimatedOn,source}, no status libre → versión; UnidadEditada/ExclusividadRegistrada |
| asociarAnexo | Principal/anexo/proyecto bloqueados → paquete; PaqueteInventarioCambiado |
| verificarDisponibilidad | Unidad/fuente/consulta/responsable, no libera venta → verificación; DisponibilidadVerificada |
| solicitarHold/confirmarSolicitudExterna | Negocio/paquete/precio/motivo/UUID → hold M40 o pendiente; HoldCreado o SolicitudHoldRegistrada |
| bloquear/archivarProyecto | Proyecto/versión/motivo, guardia común → bloqueo y retiro; ComercializacionBloqueada |
| solicitar/resolverPublicacion | Objeto/revisión/hash, cuatro ojos/revalidación → solicitud/estado; PublicacionSolicitada/Resuelta |
| crearVersion/solicitar/resolver/programarPrecio | Lista/moneda/periodo/filas/plan/hash → diff/aprobación/programación; ListaPrecioSolicitada/Resuelta/Publicada |
| subir/editar/retirarMaterial | Binario/metadatos/hash → cuarentena/rendición/retiro; MaterialRegistrado/Retirado/AvisoNuevaVersion |
| compartirFicha/Material | Objeto/versión/canal/destinatario → enlace, sin URL storage; EnlaceCreado |
| descargarCompartido | Token solo petición, §6.4 → ficha/bytes/404/410; DescargaAutorizada |
| reportarDato/pedirCorreccion | Objeto/campo/motivo/responsable servidor → reporte+tarea; DatoInventarioReportado |
| registrarRevisionLegal | Proyecto/versión/tipo/texto/alcance/fechas → claim; AfirmacionComercialRevisada |

aggregateId entero del padre/activo; UUID de solicitud en payload. Reporte crea activities task mediante flujo fijo, sin activities:create general ni responsable arbitrario del cliente.

## 5. Datos

Propuesta, no DDL aplicada. PK serial excepto hold_requests.id UUID; public_id UUID para exposición. Tablas nuevas con RLS Drizzle/migración, FKs RESTRICT, índices de padres/filtros, autor/UTC/versión. Catálogos tipados únicos; administrables archivables sin perder referencias. Acceso servidor por padre/concesión, sin políticas abiertas de Data API. Evidencia sin CASCADE.

### 5.1 Estructura

- projects conserva PK id; añadir code normalizado único activo, responsable/fuente, commercial_block_status unblocked/blocked, motivo/autor/fecha. project_faculties: exactamente proyecto o unidad de reventa, usuario/faculty/vigencia/revocación; único objeto/usuario/facultad activa.
- project_phases/buildings/unit_types: id/project_id NOT NULL/código/nombre/orden/entrega; UNIQUE(id,project_id), edificio→etapa mediante FK compuesta. No duplicar construction_phases de obra.
- units: project_id nullable con broker_id obligatorio para reventa; building_id/phase_id/unit_type_id opcionales con FK compuesta al mismo proyecto; UNIQUE(id,project_id). CHECK(project_id IS NOT NULL OR (broker_id IS NOT NULL AND building_id IS NULL AND phase_id IS NULL AND unit_type_id IS NULL)). Código normalizado único activo por proyecto, preservar identidad M40. interior_m2 nullable/terraza/total derivado si conocidos; NULL≠0. Atributos y catálogos de filtros §3.1.
- Gastos: estimated_expense_cents BIGINT/expense_currency/expense_estimated_on date/expense_source; cuatro nulos o completos, importe >=0. Estimación, no cobro.
- unit_components: principal/anexo/project_id NOT NULL, ambos FK a units(id,project_id), principal≠anexo, un paquete activo por anexo. Trigger/locks impiden ciclos y cambios comprometidos; historia preservada.
- unit_private_records: unidad única/propietario FK contacts/catastro/title_file_id privado. exclusivity_agreements: versiones/vigencia/evidencia, un acuerdo activo, fechas coherentes.
- inventory_verifications: unidad/fuente/checked_at/valid_until/resultado/responsable; freshness derivada sin reabrir venta. Geometría privada/pública separadas, aproximación aprobada persistida: no enviar exacta al navegador.
- broker_project_grants: proyecto/usuario/vigencia/revocación, view/hold/export explícitos; lectura por defecto sin hold.
- hold_requests: id UUID/proyecto/unidad/negocio/solicitante/motivo/versión de precio/created_at, pending_external_confirmation/confirmed/rejected/cancelled y resolución/evidencia/actor/fecha. Confirmed exige hold_id FK M40 y confirmación atribuible; pending no tiene compromiso. Confirmación revalida paquete/concesión/bloqueo/cupo, no cambia estado aisladamente.

### 5.2 Precios

price_lists: id/project_id/código/currency oficial/segmento/is_default, UNIQUE(id,project_id), un default por proyecto activo. Alternativa explícita y autorizada por segmento, sin mezcla de monedas.

price_list_versions: id/public_id/lista/proyecto/version/contenido/hash/effective_from/effective_to nullable; draft/pending/approved/rejected/published/withdrawn, solicitud/decisión §6.2 y publicación. UNIQUE(price_list_id,version), UNIQUE(id,price_list_id), UNIQUE(id,project_id), FK(price_list_id,project_id) → price_lists(id,project_id). **Sin active_version_id/FK inválida**: vigente única published con from<=horaBD<to (o to nulo); periodo no vacío. Contenido aprobado inmutable, editar crea versión.

unit_prices: versión/unidad/project_id/importe_cents/inclusiones/payment_plan_template_id; FK compuestas a versión/unidad del mismo proyecto; UNIQUE(versión,unidad). Moneda heredada de lista, no por fila divergente; snapshot copia moneda. Plantilla M40 aprobada del proyecto o global, sin redefinir tabla.

Trigger de cada cambio de periodo/estado bloquea lista por ID y rechaza solapamientos publicados, incluido SQL autorizado. Serializa programaciones concurrentes. Recortar periodo anterior exige operación aprobada/diff/auditoría, sin cambiar precios/snapshots. Activación futura derivada sin worker; publicación espera M43.

### 5.3 Documentos y claims

documents: id/project_id NOT NULL/tipo, UNIQUE(id,project_id). Títulos de reventa siguen privados en unidad. document_versions: id/document_id/project_id/file_id INTEGER FK files/version/hash/scan_status/autor/fecha; FK(document_id,project_id) → documents(id,project_id), UNIQUE(id,project_id), UNIQUE(document_id,version).

Trigger al enlazar exige files.entity_type=project y entity_id=project_id, privado/no retirado; protege cambios del dueño lógico en files referenciado. Versión/file_id aprobados inmutables. No basta validar IDs independientes.

project_claims: proyecto/document_version_id/tipo/texto/alcance/hash/valid_from/valid_to/review_status/revisor/fecha. FK(document_version_id,project_id) → document_versions(id,project_id). **Sin evidence_file_id independiente**: archivo solo desde versión. Verified exige versión/texto/alcance/revisor/fechas y valid_to>valid_from; comando comprueba clean/resolución pertinente.

Efectivo=verified+evidencia válida+alcance coincidente+valid_from<=horaBD<valid_to. Después DTO expired/vencido aunque revisión histórica siga verified. Badge/cotizador/publicación/share usan la consulta única; no review_status solo. Retiro/cambio de alcance invalida proyección en misma TX; reinicio sin job no prolonga vigencia. compliance_checks: requisito de catálogo/resultado/responsable/corrección-tarea.

### 5.4 Medios, enlaces y envíos

media_assets: id/proyecto o unidad exclusivo/tipo/autoría/licencia/internal por defecto/estado-revocación. media_versions: id/asset_id/version/private_object_key/hash/MIME/bytes/resolución, **language/alt_text/display_order/is_cover**, scan_status/derechos/aprobación con autores/fechas, retiro/vencimiento. UNIQUE(id,asset_id), UNIQUE(asset_id,version). Imagen publicable con alt, render etiquetado; binario nuevo invalida escaneo/derechos/aprobación. Metadatos aprobados se cambian con nueva versión; portada única vigente bajo lock padre.

share_links: id/token_hash único/origin_kind ficha-media/objetivo exclusivo proyecto-unidad o media_version_id+asset_id/emisor/canal/destinatario opcional/creación/expiración/revocación-motivo. FK compuesta versión/activo y pertenencia al padre comprobada. Sin token persistido en claro; duración CFG-088 no equivale a URL de storage.

share_deliveries: link/destinatario/canal/pending-sent-delivered-unknown-failed/referencia/fechas/evidencia. Email exige destinatario; direct_link solo creado, sent_at/delivered_at nulos. Acuse de envío≠entrega. FKs RESTRICT e historia anexada: purgar binario no borra versiones/envíos/destinatarios. Retiro revoca links y emite AvisoNuevaVersion deduplicado por versión/destinatario, sin afirmar recepción.

### 5.5 Publicación y colaboración

listings: objetivo proyecto o unidad con FK exclusiva, revisión/hash/solicitante-fecha/publicador-fecha-motivo, draft/pending/approved/published/rejected/withdrawn e historia. Solicitud congela revisión; resolver exige persona distinta de autor/solicitante. Cambio material invalida pendiente→draft; snapshot público anterior persiste hasta retiro/bloqueo/evidencia inválida. Publicar exige datos mínimos/verificación/precio y evidencia de cada afirmación incluida, no CONFOTUR para una ficha sin badge.

Lista blanca: ID público/código/nombre/descripción aprobada/ubicación pública/superficies-atributos/disponibilidad segura/moneda-precio aprobado/entrega prevista/rendición/texto legal vigentes/contacto único de empresa. Fuera: propietario/KYC/catastro/título/comprador/geometría exacta/notas/costes/comisiones/originales. Borrador solo enlace interno autenticado; token público exige listing y concesión del emisor vigentes.

saved_views de M43: propietario/filtros validados. inventory_reports: objeto/padre FK/campo/motivo/reportante-fecha/responsable/activity_id FK/estado-resolución. Reporte+tarea+auditoría+outbox en misma TX, dedupe evita dos tareas. Responsable del padre (captador en reventa) resuelto por servidor; ausencia bloquea sin fingir guardado.

### 5.6 Migración y seguridad

Expandir tras 0009, no reescribir 0007–0009. D11 exclusivo por turno; D00 nombra migración/snapshot/journal generados. Code técnico por ID estable/prefijo separado: comprobar colisiones antes de UNIQUE, sin inventar código comercial.

interior_m2 **nullable SQL/Drizzle**, sin SET NOT NULL en este lote. Copiar built_area_m2 solo tras confirmar misma semántica/procedencia; desconocidos quarantine no publicables, preservando venta. Salida exige metraje/fuente/responsable; trigger de publicación comprueba mínimos, sin nulos contradictorios.

Ensayar BD vacía/copia poblada desechable: huellas/conteos M40 intactos, FK/RLS/nulos/unicidad/triggers de identidad/reventas. Origen intacto. Rollback de app desactiva entradas y conserva historia; sin DROP tras escrituras sin ensayo/aceptación humana.

API requireActor+requireScope/requireFullScope antes de datos, visibleRows/reaches padre/concesión, Zod/campo por campo. Vistas security_invoker; nombres generados y storage privado. Configuración solo infrastructure/env.ts; sin secretos/URLs privilegiadas en DTO/logs. Checklist docs/contexto/flujo-de-trabajo.md §6, guardas intactas.

## 6. Integraciones y puertos

### 6.1 M40 y bloqueo común

**Enmienda pendiente de aceptar en M40:** orden global dedupe → advisory cupo → proyectos ID ASC FOR UPDATE → concesiones/política → negocios ASC → unión unidades/anexos ASC → compromisos → reserva/plan. Descubrir padres antes, releer bajo lock; si cambiaron, abortar/reintentar, nunca adquirir proyecto tardíamente.

Bloquear/archivar/revocar concesión toma esa guardia al principio. Bloqueo retira listings/shares en TX. Hold/confirmación externa/preparar-confirmar-cambiar reserva/cierre M40 releen bloqueo/concesión tras adquirirla, hasta commit. Bloqueo primero: adquisición 409; adquisición primero conserva obligación previa y detiene siguientes, sin cancelación retroactiva.

CompromisosPort M40 único dueño: holds/hold_units o reservations/reservation_units y commitments completos en TX, triggers 0007 intactos; no commitment aislado. Serial/unit_sale_id UUID preservados. Expirar: hold.status=expirado, commitment.status=resolved + resolved_at/resolution_reason/version/source; clock_timestamp() separado después de locks. Adquisición resuelve caducidad aunque job caiga.

Solicitud externa UUID pendiente no ocupa; confirmar autorizado crea mediante M40 y actualiza solicitud al commit, con negocio/precio/concesión/cupo/política válidos. Espera b1f/b1i/b1j/b2a/b2b revisados: DDL no acredita comandos.

### 6.2 M43 actualizado: fuente de dominio, no motor genérico

M43:125–128,188,312 reemplazó el contrato citado por R3-02: su comando commercial rechaza precios. Se consume ApprovalInboxPort con source=m47; no escribir object_type/diff_payload/metadata en approval_requests commercial ni duplicar motor.

Decisión nativa en price_list_versions: requested_by FK users/requested_at/requested_hash, decided_by FK users/decided_at/reason. Hash canónico fija proyecto/lista/moneda/filas/inclusiones/plan/periodo-diff. CHECK/trigger: pending exige solicitante/hash; aprobar/rechazar exige decisor distinto del solicitante y autor, fecha/motivo; una decisión inmutable por versión. Cambio de contenido invalida pendiente y crea versión nueva, sin borrar auditoría.

Comando M47 bajo locks lista→versión, expectedVersion/expectedHash/decision/reason/key; revalida al decidir/publicar. Bandeja recibe DTO M43 con publicId/type/status/requester/canDecide y delega al comando M47, siempre con FK real a versión y permiso propio. D00/M43 deben aceptar/probar ese adaptador antes de p2/p3: integración pendiente, no aprobación simulada ni motor paralelo.

### 6.3 Puertos segregados

| Puerto propio | Responsabilidad |
|---|---|
| RepositorioInventarioLectura | DTO/consultas autorizadas |
| Repositorios Estructura/Precios/Documentos/Medios/Publicacion | Persistencia por capacidad, unidad transaccional/auditoría/outbox |
| CompromisosPort / ApprovalInboxPort / VistasGuardadasPort | M40/M43 integrados, comando pertenece al dominio |
| AlmacenamientoObjetosPort | Subir/leer stream privado/borrar; sin escanear/sanear |
| SaneamientoMediosPort | Quitar metadatos sensibles/derivar |
| EscaneoArchivosPort | Hash/veredicto clean-infected-unknown-error/motor-fecha |
| EntregaMaterialPort | Acuse envío/evidencia entrega separados, dedupe |
| MapasPort / GeneradorFichaPort | Cartografía / ficha-paquete sobre DTO seguro |

Dominio/application sin proveedor; selección/adaptación en infraestructura/contenedor/env.ts. Contratos con falsos; cambiar storage no cambia consumidores de saneamiento/escaneo. Original privado escaneado antes de derivar; hash final también clean. Caída/timeout conserva error-pendiente, reintento durable por hash/versión sin publicación parcial.

D21 no seleccionó storage/escáner/saneador/generador/teselas: NO VERIFICADO. Evaluar reutilización del adaptador actual; sin elección «Supabase/S3» implícita. Cada expediente exige artefacto/licencia/operación/salida; bloquea adaptador dependiente, jamás habilita publicación sin clean. Salida: claves privadas lógicas/hashes/metadatos exportables, sin URLs de proveedor en dominio.

### 6.4 Descarga revocable

Proxy de aplicación revalida cada GET/HEAD/Range/condicional: token por hash, expiración/revocación, versión/derechos/claim/listing/concesión del emisor. Éxito/error con Cache-Control: private, no-store, max-age=0. Sin CDN público/service worker almacenando, redirect/URL firmada de storage al cliente ni token en logs.

Tras commit de retiro, repetir URL/ETag/Range da 410, no 304 previo a autorización. Transferencia ya autorizada puede seguir en curso; bytes recibidos no recuperables. Purga espera política humana sin cascada de historia.

## 7. Métricas y requisitos no funcionales

Métricas autorizadas: disponibles/por confirmar/comprometidas, absorción 0–100, frescura/vencimientos, conflictos/latencia hold, descargas revocadas/tareas. Monedas separadas, sin ocultas/identidades; avance desde obra.

Maestra:6291–6319 propone, sin medir/SLA: **50 sesiones**, p95 lecturas <700 ms/búsqueda <1 s/hold <1.5 s, disponibilidad inicial **99.5%** por ratificar. Referencia 25.000 unidades; volumen real/hardware/red/mezcla/medios NO VERIFICADOS. Sin 20 tenants/150 concurrentes/99.9%.

SQL paginado/indexado, agregados autorizados, binarios fuera de TX/escaneo limitado, sin caché pública. D15 mide percentiles/errores/esperas. Conservar evidencia P0 sin plazo/purga inventados; RPO/RTO solo con runbook D16 probado.

## 8. Criterios de aceptación (verificables)

Son **pruebas por construir/ejecutar**, ninguna superada por este documento. Abreviaturas con expansión literal: A=src/application/inventario; D=src/domain; R=src/infrastructure/db/repos; C=src/infrastructure/contenedor; H=src/app/api; V=src/app/(crm); B=scripts/test-db. No autorizan carpetas.

### 8.1 Criterio → archivo de prueba → slice

| CA | Resultado exigido | Prueba / slice |
|---|---|---|
| 01 | Filtros/compare/desde excluyen ocultas; vista reautoriza receptor | A/catalogo.test.ts; k1/k2 |
| 02 | Duplicación sin sensibles, import repetido normalizado falla en proyecto, otro admite; casa sin torre | B/inventario-estructura.mjs; e1/e2 |
| 03 | seller/agent/external_broker/rol nuevo sin designación reciben JSON sin privados; precio own/team denegado; Legal solo su padre | H/unidades/[id]/route.test.ts y D/rbac.test.ts; s0/u2 |
| 04 | Reventa sin captador o con torre/etapa/tipo falla incluso SQL; metraje NULL queda en cuarentena sin reabrir venta | B/inventario-migracion.mjs; e3 |
| 05 | Anexo comprometido/vendido/ajeno no se asocia; dos paquetes compiten sin ciclo/efecto parcial | B/inventario-paquetes.mjs; u3 |
| 06 | Dos holds misma unidad: uno y un 409; vencer durante espera resuelve hold/compromiso, motivo y paquete completos | B/inventario-compromisos.mjs; h1 |
| 07 | UUID externo pendiente no ocupa; confirmar/reintentar no duplica; reventa 422; concesión/cupo/frescura obligatorios | A/holds.test.ts y B/inventario-compromisos.mjs; h1/h2 |
| 08 | Bloqueo rechaza hold/preparar-confirmar reserva/confirmar externo/publicación; carreras en ambos órdenes sin deadlock | B/inventario-bloqueo.mjs; h3 |
| 09 | Migración precios/FKs válidas, sin puntero activo inválido; versión/unidad ajena falla | B/inventario-precios.mjs; p1 |
| 10 | Moneda única, fechas ordenadas/no solapadas; dos publicaciones dejan una; futuro funciona tras caída sin job | B/inventario-precios.mjs y A/precios.test.ts; p1/p2/p3 |
| 11 | Inbox source=m47 delega a versión tipada; commercial rechaza precio; cuatro ojos/hash; reserva previa intacta | A/aprobaciones-precios.test.ts y B/inventario-precios.mjs; p2/p3 |
| 12 | Gastos completos en crear/editar; pending durable; autoaprobación/hash cambiado fallan; publicar no revela título | H/unidades/[id]/route.test.ts y A/publicacion.test.ts; u2/l2 |
| 13 | Versión/archivo ajeno no verifica claim, también SQL; vínculo referenciado no cambia dueño | B/inventario-documentos.mjs; d1 |
| 14 | Sin resolución no badge; alcance retira texto; valid_to vence en lectura/share/cotizador tras reinicio sin job | A/claims.test.ts; d2/d3 |
| 15 | Idioma/alt/orden/portada persisten; sin derechos/clean/aprobación no descarga; caída/reintento no publica | A/medios.test.ts y B/inventario-medios.mjs; m1/m2/m3 |
| 16 | Misma URL/ETag/Range tras retiro 410, sin 304/redirect/storage; no-store y excluido de service worker | H/materiales/compartidos/[token]/route.test.ts; m5 |
| 17 | Directo solo creado, email exige destinatario, sent≠delivered; retiro/aviso/reintento conservan historia tras purga binaria | A/envios.test.ts y B/inventario-medios.mjs; m1/m4 |
| 18 | Ficha respeta lista blanca; reporte+tarea con autor/responsable; dedupe; sin responsable no confirma guardado | A/colaboracion.test.ts y H/inventario/reportes/route.test.ts; k3/k4 |
| 19 | 404 fila/403 acción, no ampliar concesión por filtro/descarga; guardas RLS/autorización intactas | A/seguridad.test.ts y guardas existentes; s1/k1/u2/m5 |
| 20 | Siete UI/seis estados, español/campo/teclado, 320/390/768/1440, sin skeleton infinito/desborde; avance/absorción únicos | V/propiedades/regresiones.test.ts y capturas D14; v1–v7 |

### 8.2 Despachos de hasta 45 minutos

Plan sin permiso de código. D00 expande archivos y divide antes de despachar si excede 45 min. P(n)=A/n.ts + R/inventario-n.ts + C/inventario-n.ts. Tnn=pruebas CA-nn de §8.1, asignadas a esa fila. Llaves enumeran archivos finitos. D(n)=src/infrastructure/db/schema.ts + migración/snapshot/journal generados y nombrados por D00; sin nombres no hay despacho. Un D11 por turno; IDs múltiples son tareas separadas secuenciales.

| Slice / depende de | Resultado / archivos además de Tnn |
|---|---|
| s0 / READY | Precio all: D/rbac.ts; T03 (solo D/rbac.test.ts) |
| s1 / s0 | DTO: A/{puertos,proyecciones}.ts; T19 |
| e1 / s1 | Estructura proyecto/etapa/torre/tipo: D(e1); T02 |
| e2a,e2b,e2c / e1 | Crear-editar, duplicar, importar (turnos separados): P(estructura), A/estructura.test.ts; T02 |
| e3 / e1 | Físicos/reventa/gastos/backfill: D(e3); T04 |
| s2 / e1 | Facultades/concesiones: D(s2), B/inventario-acceso.mjs |
| u1a,u1b / e3,s2 | Edición, luego exclusividad: P(unidades), A/unidades.test.ts |
| u2 / u1b | HTTP detalle/edición: H/unidades/[id]/route.ts; T03/T12 (solo ruta de unidad) |
| u3a / e3 | Relación anexos: D(u3a); T05 |
| u3 / u3a,M40 | Asociación: P(paquetes); T05 |
| h0a,h0b / e3 | Verificaciones, luego solicitudes UUID: D(h0a), D(h0b) respectivamente; B/inventario-verificaciones.mjs |
| h1 / h0b,M40 b2a | Fachada hold/matriz: P(holds); T06/T07 |
| h2 / h1 | Endpoints: H/inventario/holds/route.ts, H/inventario/holds/[requestId]/confirmacion/route.ts; T07 |
| h3a / e1 | Columnas bloqueo: D(h3a); T08 |
| h3 / h3a,h1,M40 enmendado b1i/b2b | P(bloqueo); T08 contra comandos reales, no cierre sin adopción M40 |
| p1 / e3 | Listas/versiones/filas/periodos: D(p1); T09 |
| p2 / p1,M43 enmendado | Borrador/diff/hash: P(precios); T10/T11 |
| p3 / p2 | Decisión/programación/snapshot: A/precios.ts, R/inventario-precios.ts; T10/T11 |
| d1 / e1 | Documentos/versiones/pertenencia: D(d1); T13 |
| d2 / d1 | Claims/checklist: D(d2); T13/T14 |
| d3 / d2,D21 | Revisión/vigencia: P(claims); T14 |
| m1a / e1 | Activos/versiones: D(m1a); T15 (solo BD) |
| m1 / m1a | Links/envíos: D(m1); T17 (solo BD) |
| m2 / m1a,D21 | Puertos/doble/procesamiento: A/{medios-puertos,medios}.ts; T15 |
| m3a,m3b / m2,adaptadores probados | Carga, luego retiro: R/inventario-medios.ts, C/inventario-medios.ts, H/inventario/materiales/route.ts; T15 |
| m4 / m1,m3b,I00/entrega | Enlaces/envíos/avisos: P(envios); T17 |
| m5 / m4,l2 | Proxy: H/materiales/compartidos/[token]/route.ts; T16 |
| l1 / e3 | Listings/revisión: D(l1), B/inventario-publicacion.mjs |
| l2 / l1,p3,d3 | Solicitud/lista blanca: P(publicacion); T12 (solo aplicación) |
| k0 / s2 | Reporte/tarea FK: D(k0), B/inventario-reportes.mjs |
| k1 / s1,e3,s2,h0b | Consulta/facetas: P(catalogo); T01/T19 |
| k2 / k1,M43 vistas | Guardar/comparar: A/catalogo.ts, H/inventario/vistas/route.ts; T01 |
| k3 / k0,l2,m4 | Ficha/reporte TX: P(colaboracion); T18 |
| k4 / k3 | H/inventario/{fichas,reportes}/route.ts; T18 |

Vistas (turnos separados, T20 en cada uno): v1 tras k1–k4/mapa, V/propiedades/{page,vista}.tsx; v2 tras e2c, V/proyectos/[id]/page.tsx; v3 tras h2/h3, V/proyectos/[id]/inventario/page.tsx; v4 tras u2/u3/l2, V/unidades/[id]/page.tsx; v5 tras p3, V/proyectos/[id]/precios/page.tsx; v6 tras m5/generador, V/proyectos/[id]/materiales/page.tsx; v7 tras d3/h3, V/proyectos/[id]/calidad/page.tsx. Componente extra requiere nombre en despacho.

Adaptadores (uno por herramienta), rutas de estructura/aprobación y contratos de cotizador/PWA se concretan por sus dueños con ruta/prueba exactas antes de liberar dependencias. CA-14 exige cotizador real; CA-16 exclusión real de caché PWA. No se cierran con dobles solamente. M40/M43/I00/D21 se entregan aparte.
### 8.3 Evidencia de salida

D14 de otro proveedor: unitarias/contratos, PostgreSQL desechable para locks/triggers/migración, HTTP sobre JSON serializado y UI/capturas. Quien cierre ve typecheck/lint/npm test verdes; build/servidor solo host autorizado. spec:check valida estructura documental, no cierra issue/gate ni demuestra funcionalidad.

## 9. Fuera de alcance y preguntas abiertas

### 9.1 Evolución excluida

Multiempresa/G12/tenant_id, sucursales/equipos, MFA/AAL2, invitaciones complejas, delegaciones/multinivel, firmas avanzadas, cachés públicas/CDN y **P1 completo**, excluidos por orden del 18-oct, sin bloquear P0. También PMS, geocodificador propio, edición de obra, feeds nuevos, finanzas/contratos M40, editor de marcas y amortizador nuevos. Revisión P0: un paso/persona distinta.

### 9.2 Pendientes reales

| ID / dueño | Condición previa |
|---|---|
| Q47-M40 / D00+D10+D11; D12/D14 | Aceptar guardia §6.1, integrar b1f/b1i/b1j/b2a/b2b y CA-06–08 antes de habilitar; DDL no acredita comandos. |
| Q47-M43 / dueño M43 + otro proveedor | REVIEW; source=m47 futuro: aceptar/probar §6.2 y vistas mínimas; p2/p3/k2 esperan, sin sucursales/MFA. |
| Q47-D21 / D21+D16+D12 | Streaming/escáner/saneador/generador/teselas: artefacto/licencia/operación NO VERIFICADOS; cada adaptador espera, sin quitar escaneo al P0. |
| Q47-EVT / D00+I00/M40 | I00 DRAFT; integrar tipos/dedupe/consumidores mínimos §4 antes de emitir. |
| Q47-POL / Wilber+D01 | Aceptar responsables/facultades/holds/cupo/autoridad/umbrales. CFG-037/039/040/053–056/086/088 «Por validar»; sin aceptación, bloqueo explicado sin fallback. |
| Q47-NFR / Wilber+D15+D16 | Confirmar entorno/volumen/objetivos y conservación, sin plazo ficticio. |
| Q47-P3 / D05/D07/D14 | Componentes/wireframes/capturas NO VERIFICADOS; CA-20 antes de L4. |
| Q47-D00 / orquestador | Índice M47 REVIEW/despachos exactos pendientes. EN-CURSO/índice/snapshot fuera del alcance autorizado. |

Estados de publicación: propuesta mínima de «solicitar publicación»/CFG-086 editor-aprobador, pendiente aceptación D01/Wilber; silencio no aprueba.

## Respuesta a la revisión R1

Contra M47-revision-R3.md; contrato corregido ≠ prueba ejecutada. Bloqueantes primero. Dependencias externas señaladas mantienen REVIEW, sin cierre propio.

| R3 | Respuesta | Prueba |
|---|---|---|
| R3-01 | §5.2 sin puntero/FK inválida, claves candidatas | CA-09 |
| R3-02 | §6.2 reconcilia M43 actualizado: dominio tipado + Inbox; adaptador pendiente | CA-11 |
| R3-03 | §1 lista positiva, seller incluido en denegación por defecto | CA-03 HTTP |
| R3-04 | §5.3 versión-proyecto-files vinculados en BD | CA-13 |
| R3-05 | §6.1 reserva/externo/guardia común; adopción M40 pendiente | CA-08 |
| R3-06 | §6.1 hold expirado, commitment resolved con motivo | CA-06 |
| R3-10 | §6.4 proxy/no-store/revalidación, sin caché pública | CA-16 |
| R3-07 | §4/§6.1 requestId UUID string | CA-07 |
| R3-08 | §5.6 nullable/cuarentena, sin NOT NULL contradictorio | CA-04 |
| R3-09 | §5.1 CHECK reventa sin torre/etapa/tipo | CA-04 |
| R3-11 | §5.4 creado/enviado/entregado; historia RESTRICT | CA-17 |
| R3-12 | §1.2 permiso canónico, Q47-05 obsoleto retirado | CA-19 |
| R3-13 | §4/§5.5 ficha y reporte/tarea durables | CA-01/18 |
| R3-14 | §3.4/§5 gastos/publicación; D01 acepta política | CA-12 |
| R3-15 | §5.4 idioma/alt/orden/portada persistidos | CA-15 |
| R3-16 | §5.3 vencimiento en cada lectura sin job | CA-14 |
| R3-17 | §5.2 moneda/periodo/futuro/snapshots | CA-10/11 |
| R3-18 | §8 pruebas asignadas; test HTTP de unidad | Estática + CA |
| R3-19 | §8 DDL por capacidad, turnos separados ≤45 min | D00 concreta D(n) |
| R3-20 | §7 línea base inicial, no SLA/medición | D15/Wilber |
| R3-21 | §6.3 puertos segregados; D21 pendiente, sin clean no publica | CA-15 |

## Handoff

D03/Codex produce; D01 valida políticas/D11 implementa después. D12/D14 de otro proveedor + Wilber revisan R3/P0 monoempresa; sin autoaprobación.

Antes de READY: mínimos M40/M43/D21, despachos/índice D00 y políticas aceptadas. Código/BD/concurrencia/storage/UI **NO VERIFICADOS**. Evidencia del turno: reviews/M47-respuesta-R1.md; sin cierre de issue/gate.
