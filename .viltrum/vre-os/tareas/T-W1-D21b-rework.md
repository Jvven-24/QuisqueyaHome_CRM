# T-W1-D21b-R1 · Corrección del barrido de cobertura y del registro OSS

Perfil: **D21 Research**. Modo: analysis. Revisor: D03. Entrega anterior: `.viltrum/vre-os/D21-cobertura-modulos.md`
y `.viltrum/vre-os/oss-registry.json` (run `20261004T170128Z`). Verificación del orquestador contra la API de GitHub:
`.viltrum/vre-os/oss-registry-verificacion.json`.

## Defectos verificados (corrige todos)
1. `open-property`: repo inexistente (`OpenProperty/open-property` → error API). El correcto es
   **`clawnify/OpenProperty`, licencia MIT** (API GitHub `spdx_id: MIT`, verificado 4-oct). Modo **PORT**, módulo Rentas.
2. **Rentas**: decisión vigente de Wilber (decisión #43, 4-oct): **entra y se porta OpenProperty** en W4b. La fila
   "Rentas · Ninguno directo · Construir P2 W5" contradice la decisión: corrige a `Portar OpenProperty (P1, W4b)`.
3. `prolink` y `reality-crm`: pon las URLs reales `https://github.com/prolinkinfo/RealEstateCRM` y
   `https://github.com/mallyav/CRM`, `license_spdx: NONE`, `status: REFERENCE_ONLY`.
4. Módulos marcados "Ausente" que **sí existen** (verifícalo leyendo el código antes de escribir):
   - Auditoría: tabla `audit_log` y puerto `src/application/compartido/auditoria.ts`.
   - Notificaciones: tabla `notifications` en `src/infrastructure/db/schema.ts`.
   - PWA/Offline: dock móvil y manifiesto en `public/` (revisa qué hay realmente).
   - Importación/Exportación: exportación CSV en comisiones/reportes.
   Corrige "Estado hoy" a lo que hay de verdad y ajusta "Qué falta".
5. `NOASSERTION` **no** es una licencia libre: significa licencia propia o mixta (núcleo + carpeta enterprise). Para
   cada entrada `NOASSERTION` lee el archivo LICENSE real y añade `license_detail` (p. ej. "MIT salvo /ee",
   "Sustainable Use License: no es OSI") y `license_review: HUMAN_REQUIRED` si afecta a uso comercial.
   **n8n no es open source OSI**: márcalo como tal.
6. Brokers, Academy y Comisiones: añade lo específico que pidió Wilber: seguimiento y certificación de brokers
   (Academy), portal del broker y co-broking, splits y retenciones RD. Para cada uno, qué se construye y qué se integra.

## Reglas
Solo modifica los dos archivos de salida (y nada en la raíz del repo: **borra tu `gh_licenses.json` de la raíz** si es
tuyo, o muévelo a `.viltrum/vre-os/`). Licencias solo desde la API/LICENSE real.

## Entregable
Los dos archivos corregidos, con una sección `## Cambios respecto a la versión anterior` y `## Fuentes`.
