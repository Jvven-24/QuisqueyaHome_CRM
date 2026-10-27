# Revisión crítica del CRM: módulos `src/app/(crm)` y `src/app/api`

Solo leí código, no modifiqué nada. Cada endpoint de la API exige sesión y un permiso por recurso, salvo `leads/externo`, que usa un token compartido a propósito. Lo que más se repite es otra cosa: muchas pantallas son vistas previas con datos de ejemplo.

**Inicio**: el botón «Revisar aprobaciones» lleva a una pantalla de ejemplo (`inicio/vista.tsx:109`). Los demás accesos respetan los permisos.

**Leads**: en la nota de voz, el texto arranca con un ejemplo ya escrito (`leads/nota-de-voz-modal.tsx:66`). Además fuerza `crear_igual: true`, lo que salta siempre la detección de duplicados (`:130`), y pone el presupuesto mínimo igual al máximo (`:126`). Si falla la creación de la tarea, el error se ignora en silencio (`:142-153`). Las pantallas de duplicados e importaciones son solo de ejemplo.

**Negocios**: no hay forma de borrar un negocio por API, solo de editarlo (`api/pipeline/[id]`). Las propuestas, la aprobación de descuentos y la reapertura no hacen nada real (`negocios/comercial-preview.tsx:26`). El tablero de arrastrar y soltar sí funciona con teclado.

**Contactos**: crear, editar, borrar y exportar funcionan. Empresas, demandas, relaciones y preferencias de privacidad son de ejemplo (`contactos/[id]/privacidad/vista.tsx:40`). Es un riesgo legal: el consentimiento del contacto no se guarda.

**Propiedades**: proyectos y unidades se pueden crear, editar y borrar de verdad. Algunas zonas usan datos de ejemplo (`propiedades/_componentes/preview-workspace.tsx`). Los slugs se generan con `LIKE` sin escapar `_` (`infrastructure/db/repos/proyectos.ts:31`).

**Agenda**: una visita marcada como «No asistió» vuelve al estado `pending` (`agenda/vista.tsx:1771`), así que reaparece como pendiente. El resultado de la visita se guarda pegado dentro de la descripción, sin campos propios, por lo que no se puede usar en reportes. Viajes y visitas son de ejemplo.

**Tareas**: `vista.tsx` es un solo archivo de 3.479 líneas, con los playbooks y los colores escritos a mano. El «pack» de tareas encadena varios POST sin transacción. Si falla uno, avisa de éxito con las tareas que sí se crearon, y reintentar las duplica (`tareas/vista.tsx:2936-2971`). La zona horaria `-04:00` está fija en el código. Recurrencias es de ejemplo.

**Comunicaciones**: los webhooks solo van a destinos autorizados (bien). Pero `despachar` no limita la longitud del cuerpo ni del destinatario. Las plantillas no se pueden borrar. Bandeja y campañas son de ejemplo.

**Brokers**: solo el listado y la asignación de proyectos son reales. Alcance, cooperación, protección, onboarding, salida y mi espacio usan todas la misma vista de ejemplo (`brokers/_ui/red-previa.tsx`).

**Comisiones**: la pantalla envía `Idempotency-Key` (`comisiones/vista.tsx:146`), pero `api/comisiones/[id]` lo ignora, así que no protege contra doble envío. Liquidaciones y reglas son de ejemplo. La dirección `/comisiones/liquidaciones/ejemplo` sirve datos falsos también en producción (`liquidaciones/[id]/page.tsx:9`).

**Metas**: el mismo `Idempotency-Key` se envía y se ignora (`metas/vista.tsx:37`). El comentario dice «solo Administrador», pero el código solo exige el permiso `goals:edit` (`api/metas/route.ts:44-49`). El DELETE lleva el cuerpo en JSON, algo que algunos proxies descartan.

**Reportes**: el CSV neutraliza fórmulas (bien). Los informes programados y el constructor de informes no están hechos (`reportes/operaciones.tsx:36`).

**Reservas**: la página exige ver negocios (`deals:view`) en lugar de ver reservas (`reservas/page.tsx`). Cartera, conciliación, facturación, excepciones, documentos y plan de pagos son de ejemplo. El formulario de operaciones sí aplica bien la protección contra doble envío.

**Portal**: todo es de ejemplo (`ExpedientesPrevia`). Se protege con el permiso de configuración (`settings:view`), que no tiene relación con el portal.

**Comunidad**: es la misma vista de ejemplo de Brokers. Demandas, eventos y moderación están vacíos.

**Aprobaciones**: es de ejemplo y basta el permiso de ver el inicio (`dashboard:view`). Muestra al usuario final un selector «Estado de demostración» (`aprobaciones/vista.tsx`).

**Automatizaciones**: el «borrador» solo se guarda en memoria de la pestaña. No hay motor que ejecute los flujos (`automatizaciones/vista.tsx:28`).

**Academy**: cualquier usuario que solo puede *ver* Academy puede marcar por API cualquier contenido como completado al 100 %, y lo mismo con la checklist (`api/academy/[id]/progreso/route.ts:22-41`, `api/academy/checklist/[id]/route.ts`). Es decir, cada uno puede autocertificarse. Las vistas tienen 1.100 y 1.277 líneas.

**Documentos**: firmas y KYC son de ejemplo, aunque Tareas promete un «enlace seguro» para la Ley 155-17 (`tareas/vista.tsx:148`). Se protege con el permiso de ver negocios (`deals:view`).

**Posventa**: todo es de ejemplo (`posventa/vista.tsx`).

**Configuración**: el editor de permisos no impide la escalada. Un rol no protegido con permiso de editar configuración (`settings:edit`, alcance total) puede ampliar los permisos de su propio rol. Tampoco rechaza celdas duplicadas (`application/roles/casos-de-uso.ts:10-33`). La papelera exige ese mismo permiso para restaurar las seis entidades. Sí impide borrar al último administrador (bien). La sección avanzada es de ejemplo.

**API (transversal)**:
- `leads/externo` no limita la longitud de los textos ni el número de peticiones (`api/leads/externo/route.ts:35-56`).
- `recuperar` arma el enlace del correo a partir del Host de la petición (`api/auth/recuperar/route.ts:19`), así que depende de la lista de URLs permitidas en Supabase.
- `login` no frena intentos repetidos desde la aplicación.
- `audio-transcribe` lee un JSON de hasta 14 MB en base64 antes de validar el tamaño, y nada limita las llamadas a un servicio de IA que cuesta dinero.
- La búsqueda global no escapa `%` ni `_` (`infrastructure/db/repos/busqueda.ts:32`).

## Top 5 riesgos

1. **Pantallas de ejemplo accesibles en producción.** Afecta a finanzas de reservas, liquidaciones, aprobaciones, KYC, portal y posventa, y el propio Inicio enlaza a ellas. Alguien puede decidir con datos falsos o dar por cumplidos requisitos legales (KYC, consentimiento) que no se guardan.
2. **Escalada de privilegios desde el editor de roles.** Nada impide que un rol con permiso de editar configuración se amplíe sus propios permisos.
3. **Integridad de datos en flujos de varios pasos sin transacción.** Afecta a la nota de voz, los packs de tareas y las visitas. A eso se suman duplicados forzados (`crear_igual`) y la protección contra doble envío ignorada en comisiones y metas.
4. **Autocertificación en Academy.** Cualquier usuario con permiso de lectura puede marcar contenidos como completados.
5. **Endpoints públicos o costosos sin límite de peticiones ni de tamaño.** Afecta a `leads/externo`, `audio-transcribe`, `login` y `recuperar`, con riesgo de abuso, coste de IA y spam de leads.
