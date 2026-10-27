# Portal

## Propósito
Dar a Quisqueya Home un lugar desde el que gestionar lo que se publica hacia fuera: el editor de marca y contenido del portal, la publicación de catálogo por canal, la captación de interesados y dos vistas externas (comprador y promotor) para seguimiento de expedientes. Hoy el módulo es una **vista previa editorial**: no publica, no guarda y no conecta con el sitio público ni con ningún usuario externo.

Referencia del compendio: RF-01 a RF-03 (landing, catálogo y detalle), RF-08 (CMS interno para crear, editar, publicar y archivar), RF-10 (usuarios y favoritos en fase posterior), RF-11 (roles), RF-12 (captura de leads con origen). Fases 2 a 4 del mismo documento: CMS, login y área privada, CRM ampliado.

Código de referencia: `app/(crm)/portal/` (5 páginas, `_ejemplo.ts`) y `app/(crm)/documentos/_ui/expedientes-previa.tsx`, que renderiza las vistas. No hay rutas en `app/api/` propias de este módulo.

Buenas prácticas de industria (referencia, validar con el equipo):
- Preventa: el comprador ve plan de pagos, hitos de obra con fecha y evidencia, y sus documentos contractuales. El promotor ve solo sus proyectos. Ambos son vistas autenticadas, separadas del sitio público.
- Precio y disponibilidad: mostrar "desde" o "por confirmar", con fecha de vigencia y aviso de que la disponibilidad no está garantizada hasta reservar. Una sola fuente de verdad para el inventario, para evitar sobreventa entre sitio, CRM y brokers.
- Captación: aviso de privacidad y consentimiento registrado con fecha y origen (Ley 172-13 de protección de datos personales en RD). Atribución UTM y origen por lead.
- Protección de cliente: el lead que entra por el portal se registra con vigencia de protección para el broker que lo presentó primero.
- SEO y marca: metadatos, Open Graph, `sitemap.xml` y datos estructurados `RealEstateListing`; ES/EN desde el inicio (compendio, sección 4).
- Documentos: enlaces firmados con expiración, sin descarga pública de planos o contratos.

## Roles y permisos
Recurso RBAC actual: `settings` con `view` (lectura del portal) y `edit` (no se usa en las vistas actuales). La semilla (`db/seed.sql`) otorga `settings` solo al rol admin, con alcance `all`.

| Rol | Alcance actual | Puede hoy |
|---|---|---|
| admin (`admin`) | all | Abrir las 5 vistas previas y revisar acciones sin ejecutar |
| gerente (`manager`) | sin acceso | Ninguno (sin fila `settings` en la semilla) |
| broker (`broker`) | sin acceso | Ninguno |
| asistente (`assistant`) | sin acceso | Ninguno (la semilla excluye `settings`) |

Guardas: cada página llama `requireScopeInPage(actor, "settings", "view")`. Lo verifica `reglas-expediente.test.ts` mediante lectura estática del código, no con una prueba de comportamiento.

Propuesta para la fase real (no implementada):
- Recursos separados: `portal_contenido` (editar y publicar), `portal_publicacion` (aprobar por canal), `portal_captacion` (ver formularios y consentimientos).
- Gerente: `portal_publicacion` con alcance `team` (aprueba publicación de los proyectos de su equipo); sin editar contenido.
- Broker y asistente: `view` sobre fichas publicadas de su cartera; sin publicar.
- Comprador y promotor no son roles internos. Requieren identidad externa propia (Supabase Auth) con alcance `own`: el comprador ve solo su expediente; el promotor, solo los proyectos asignados.

## Flujos principales
1. **Editar la portada (admin).** Abre `/portal`, elige bloque (portada, catálogo, contacto), cambia título y descripción. La vista previa se actualiza en pantalla. Hoy no se guarda: se pierde al salir.
2. **Revisar una versión editorial.** Pulsa "Revisar versión sin publicar"; el modal exige asunto y motivo, y confirma que es un ejemplo. Muestra el mensaje "Revisión local preparada. No se guardó, firmó, publicó ni envió nada".
3. **Preparar publicación por canal (admin).** En `/portal/publicacion` elige canal (portal propio, canal asociado, catálogo social) y revisa material, estado y derechos de cada proyecto. Solo muestra la ficha; no sincroniza ningún canal.
4. **Revisar catálogo y captación.** En `/portal/catalogo` revisa fichas publicables y el recorrido visita → interés → consentimiento → registro → asignación. Los campos del formulario son ilustrativos.
5. **Consultar la vista del comprador.** En `/portal/comprador` ve los 4 pasos del expediente de ejemplo y su detalle. Sin sesión de comprador ni datos reales.
6. **Consultar la vista del promotor.** En `/portal/promotor` ve los pasos de inventario, avance, estado de cuenta y liquidación, todos pendientes. "Revisar solicitud de acceso" abre el modal de revisión; no crea cuenta ni token.
7. **Captación real desde el sitio público.** Fuera de este módulo: el sitio envía el lead a `POST /api/leads/externo` con `x-webhook-token`, `externalId` idempotente y UTM. El lead aparece en Leads (ver `leads.md`).

## Datos
Existentes:
- No hay tablas propias del portal. Las vistas usan datos de ejemplo en `app/(crm)/portal/_ejemplo.ts` y `documentos/_ejemplo`.
- `leads` (origen, UTM, `externalId`, proyecto de interés): llegan por el webhook.
- `contacts`: columnas `consent_at` y `consent_source` existen en `infrastructure/db/schema.ts` (líneas 594-596). El webhook no exige consentimiento (no encontrado en `app/api/leads/externo/route.ts`).
- `projects` y `units` (precio, estado): base para el catálogo; `unit_real_price` es un recurso de permisos distinto.
- `construction_phases`: base para el avance que vería el comprador.

Propuestas a crear (no existen):
- `portal_pages`: bloque, título, descripción, versión, estado (borrador, revisión, publicado, archivado), autor, aprobador.
- `portal_publicaciones`: proyecto, canal, estado de sincronización, material aprobado, vigencia.
- `portal_seo`: título, descripción, URL canónica, og:image, idioma.
- `portal_accesos`: usuario externo, rol (comprador, promotor), alcance (`own` por expediente o proyecto), vencimiento, auditoría.


## Estados de UI
Hay un selector de estados simulados en `expedientes-previa.tsx` que cubre cuatro de los seis obligatorios:
- **Vacío**: "Sin expedientes de ejemplo" (simulado). Real: la vista del catálogo muestra "Sin proyectos de ejemplo para el filtro" cuando el filtro no devuelve filas.
- **Cargando**: "Cargando ejemplo…" con `aria-busy` (simulado). No hay `loading.tsx` propio en `portal/`; hereda el de `(crm)`.
- **Error**: "No se pudo cargar este ejemplo" (simulado). No hay `error.tsx` propio; hereda el de `(crm)`.
- **Sin permiso**: "Sin permiso sobre este expediente" (simulado). El control real es la guarda de servidor: un usuario sin `settings:view` no llega a la página.
- **Sin conexión**: "Sin conexión; no hay operaciones pendientes de sincronizar" (simulado).
- **Éxito**: mensaje `role="status"` tras revisar, que aclara que nada se guardó ni publicó.
- **Parcial**: no existe. Ejemplo que faltaría: canal publicado pero con sincronización fallida.

## Estado actual vs PRD
Qué existe:
- 5 páginas y navegación lateral `NavegacionExpedientes` con `aria-current` y `aria-label="Gestión del portal"`.
- Guarda de servidor `settings:view` en las 5 páginas, con prueba estática en `reglas-expediente.test.ts`.
- Modal de revisión con validación de asunto, motivo y confirmación, que no llama a red (prueba estática: sin `fetch`, `localStorage` ni `dangerouslySetInnerHTML`).
- Entrada en la navegación: `M20 /portal` en `modulos.ts` y dentro de "Configuración" en el pie.
- Enlace "Portal Público" a `https://quisqueyahome.com` en la cabecera (externo, sin integración).
- Pestaña "SEO del portal" en `configuracion/avanzada.tsx`: vista previa de título, descripción, URL canónica y tarjeta social. No persiste ni publica.
- Captación real: `POST /api/leads/externo`, con token, validación Zod, idempotencia por `externalId`, límite de tasa y de tamaño de cuerpo.

Qué es demo:
- Todo el contenido de las vistas: `contenidoPortalEjemplo`, `catalogoPortalEjemplo` (proyectos "de demostración A y B"), los pasos de comprador y promotor.
- Los estados de UI y el cambio de canal o de bloque: solo cambian estado de React.

Qué falta (según PRD):
- Persistencia y versionado del CMS (RF-08); hoy nada se guarda.
- Publicación real a quisqueyahome.com y adaptador de publicación (RF-01, RF-02, RF-03).
- Catálogo público con filtros por zona, precio, etapa y atributos (RF-02). El sitio público no está en este repositorio; no pude verificarlo.
- Consentimiento de captación exigido en el webhook y guardado (ver Datos).
- Identidad externa, login y área privada de comprador y promotor (Fase 3 del compendio; RF-10).
- Permisos RBAC propios para el portal (hoy todo cuelga de `settings`).
- Estados parcial y éxito reales.

Nota: `leads.md` afirma que el webhook "no tiene límite de tasa ni de tamaño". El código actual sí lo tiene (`limiteLeadsExterno`, `leerJsonLimitado`). Ese párrafo de `leads.md` debe revisarse; este archivo no lo modifica.

## Checklist de aceptación
- [x] Cinco vistas con navegación y enlace activo
- [x] Guarda `settings:view` en las cinco páginas
- [x] Solo admin accede; gerente, broker y asistente no
- [x] Modal de revisión valida asunto, motivo y confirmación
- [x] Vista previa sin red ni guardado de datos
- [x] Captación del sitio por webhook con token e idempotencia
- [ ] Editor persiste versiones y estados del CMS
- [ ] Publicación de catálogo sincronizada con el sitio
- [ ] Catálogo público con filtros por zona y precio
- [ ] Consentimiento obligatorio y guardado en la captación
- [ ] Acceso externo de comprador con alcance por expediente
- [ ] Acceso externo de promotor con alcance por proyecto
- [ ] Permisos RBAC propios para el portal
- [ ] Estados de UI parcial y éxito reales

## Dependencias
Módulos internos:
- `documentos`: origen del componente `ExpedientesPrevia` y de los documentos del expediente.
- `propiedades` (proyectos, unidades, precios, avance de obra): fuente del catálogo y del estado comercial.
- `avances`: hitos y fotos para el comprador.
- `leads` y `contactos`: destino de la captación, consentimiento y protección de cliente.
- `negocios` y `reservas`: plan de pagos, separación y estado de cuenta del comprador.
- `brokers`: protección de cliente y canal asociado.
- `configuracion`: pestaña "SEO del portal" y permisos.
- `comunicaciones`: confirmación al interesado por WhatsApp o correo.

Integraciones:
- Sitio público quisqueyahome.com (externo; contrato de publicación pendiente) y webhook `POST /api/leads/externo`.
- Supabase (Auth para externos, Storage para planos y documentos), Hostinger VPS para la capa web y workers (compendio, sección 6).
- YCloud para WhatsApp (`AUDITORIA-MODULOS.md`).
- Ley 172-13 (datos personales, RD): el texto de consentimiento requiere revisión legal.
