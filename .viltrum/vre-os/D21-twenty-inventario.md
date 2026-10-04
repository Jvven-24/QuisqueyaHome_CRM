# T-TW-D21 · Twenty detrás: inventario de capacidades y requisitos de despliegue

## 1. Inventario de capacidades

Comparación de capacidades de Twenty CRM contra los módulos identificados en `src/application/*` y requerimientos de la interfaz.

| Capacidad | Estado | Motivo |
| :--- | :--- | :--- |
| **Objetos estándar** (people, companies, opportunities, tasks, notes) | **NECESITAMOS** | Cubre directamente las entidades de nuestro CRM local (`contactos`, `leads`, `pipeline`, `actividades`). |
| **Objetos/campos personalizados** | **DESPUÉS** | Por ahora el esquema base en `src/application/` es fijo. |
| **Vistas guardadas** | **NO** | La gestión de UI y vistas pertenece al frontend Next.js (`src/app/(crm)/*`). |
| **Filtros/orden/agrupación** | **NECESITAMOS** | Requerido por el frontend para consultar a Twenty vía API y popular tablas/dashboards. |
| **Kanban** | **NO** | Renderizado nativamente por el CRM en frontend. |
| **Timeline de actividad** | **NECESITAMOS** | Fuente de verdad para el historial, a renderizar en Next.js. |
| **Workflows** (disparadores/acciones) | **DESPUÉS** | Podría delegarse, pero la lógica de negocio debe permanecer en nuestros casos de uso (`src/application/`). |
| **Importación/exportación CSV** | **NO** | Si se requiere, se implementará desde la interfaz del CRM o directo a la BD local. |
| **Permisos/roles** | **NECESITAMOS** | Twenty soporta roles y RLS. Sirve para acotar el scope de la API (aunque nuestro backend en Next.js ya tiene `roles` y `usuarios`). |
| **API REST/GraphQL** | **NECESITAMOS** | Método exclusivo de conexión del frontend al motor de Twenty. |
| **Webhooks** | **NECESITAMOS** | Crucial para mantener la base local sincronizada si Twenty realiza cambios. |
| **Agentes IA** | **NO** | Ya existe el módulo `src/application/ai/` en el proyecto. |
| **Búsqueda** | **NECESITAMOS** | Requerido para listados de entidades (GraphQL/REST batch operations). |
| **Email/calendario** | **DESPUÉS** | Ya se visualiza un módulo `comunicaciones/`. Integrar el de Twenty será una fase 2. |

## 2. API que usaríamos

*   **Endpoints y consultas:** 
    *   **Core API** (`/rest/` o `/graphql/`) para CRUD dinámico sobre personas, compañías, oportunidades y notas.
    *   Soporta operaciones en batch (crear, actualizar, borrar) y GraphQL permite batch upserts.
*   **Autenticación:** Mediante API Keys en cabecera HTTP: `Authorization: Bearer YOUR_API_KEY`.
*   **Webhooks:** Configurables vía UI (`Settings → Webhooks`) o API. Soportan eventos como `person.updated`, `opportunity.created` enviados con payload JSON al endpoint de nuestro CRM. Firma: Se debe verificar HMAC (procedimiento estándar, documentado en Twenty).
*   **Límites de tasa (Rate Limits):** `UNKNOWN`. (No se han encontrado límites duros explícitos en la documentación para self-hosting; depende de la infraestructura proxy/Nginx).
*   **Versión de la API:** Dinámica y autogenerada (Metadata API). Se actualiza en tiempo real al mutar el esquema.

## 3. Despliegue

*   **Requisitos mínimos:** 2GB de RAM recomendados (sin contar los requisitos del OS), Docker, Docker Compose, PostgreSQL (v15+), y Redis.
*   **Self-hosting con Docker Compose:** Soportado oficialmente. Twenty provee un `docker-compose.yml` que arranca la aplicación, workers, y dependencias (Redis/Postgres). Requiere configurar `SERVER_URL` y variables de base de datos.
*   **Alternativa sin Docker:** `UNKNOWN`. (La documentación y métodos oficiales apuntan a Docker/Docker Compose o cloud; desplegar en crudo en un VPS requiere instalar y orquestar Node.js, Postgres y Redis manualmente, lo cual no es soportado oficialmente).
*   **Estimación para VPS staging:** Al menos 2-4 vCPU y 4GB de RAM (para alojar Twenty + PostgreSQL + Redis de forma holgada).
*   **Restricción local detectada:** Al no arrancar Docker Desktop y haber solo ~2-3 GB libres, instalar Twenty localmente saturará la máquina o directamente fallará por falta de Docker. Se recomienda usar la base local o mockear la API para desarrollo local.

## 4. Licencia

*   **Twenty Application Exception:** Twenty se licencia bajo AGPLv3, que obligaría a abrir el código fuente de cualquier software que lo modifique e interactúe íntimamente. Sin embargo, Twenty incluye una **"Application Exception"** (Sección 7 AGPLv3).
*   **Alcance:** Permite construir, transmitir y disponibilizar aplicaciones que interactúen con Twenty **vía API y webhooks** sin que nuestro CRM herede la licencia AGPLv3. Nuestro adaptador y frontend pueden mantenerse privativos/comerciales.
*   **Implicación de modificar core:** Si modificamos el código fuente de Twenty, perderíamos la excepción y deberíamos abrir nuestro software bajo AGPLv3. Al consumirlo 100% headless (solo API), el riesgo legal es cero.

## 5. Riesgos y fallos

*   **Cambios de esquema:** Twenty regenera dinámicamente la API/esquema en base de datos. Desde v1.22 tiene soporte *version-aware* para saltos directos de versión. Requiere hacer backups de PostgreSQL antes de actualizar.
*   **Migraciones:** En self-hosting, se debe gestionar cautelosamente. Si se actualiza, es crítico pasar por staging y respaldar.
*   **Disponibilidad (Si Twenty cae):** Como el CRM usa Twenty como motor, si cae y no hay caché en Next.js, la aplicación dejará de funcionar. 
*   **Requisito del mandato:** El CRM debe seguir operando con su base local. **Riesgo crítico:** Para lograr esto, se debe diseñar un adaptador en `src/infrastructure/` que implemente patrón Circuit Breaker y sincronización bidireccional (Eventual Consistency). Si Twenty cae, se escribe en la BD local, encolando eventos para mandarlos a Twenty cuando regrese.

## 6. Fuentes

*   Capacidades y AI: `https://twenty.com/` y su repo Github `https://github.com/twentyhq/twenty`
*   API & Webhooks: `https://twenty.com/developers/`
*   Requisitos de Despliegue (Docker): Github Repository de Twenty
*   Twenty Application Exception: `https://github.com/twentyhq/twenty/blob/main/LICENSE` y documentación legal de AGPLv3 Exception.
*   Schema changes: Documentación oficial de arquitectura *metadata-driven* en `twenty.com/developers/`.

---

## Handoff para D03
Inventario completado. Validamos que Twenty cumple de sobra los requerimientos de back-office headless para el CRM gracias a su API dinámica y la *Application Exception* (que nos blinda legalmente). 

**Puntos de atención para la integración:**
1. **Límites locales:** No hay RAM para correr Twenty localmente de forma fiable sin Docker, y el usuario reporta que Docker Desktop no arranca. Deberemos desarrollar contra un staging remoto o mocks estrictos.
2. **Resiliencia (Punto 5):** Requerimos definir la política de sincronización. Si el CRM debe operar con base local cuando Twenty cae, Twenty pasará a ser un esclavo de lectura/escritura asíncrona, no la base de datos transaccional primaria. Favor de validar contrato de sincronización en infraestructura.
