# D22 · Operaciones de Conocimiento y Espejo Obsidian · QuisqueyaHome CRM

**Fecha:** 2026-10-03  
**Perfil:** D22 Knowledge Ops  
**Revisor Independiente:** D00 Control Plane  
**Estado:** Activo y Sincronizado

---

## 1. Misión de Knowledge Ops
Garantizar que todo el conocimiento arquitectónico, decisiones técnicas (ADRs), especificaciones de diseño, hallazgos de auditoría y benchmarks competitivos se reflejen de forma automática e idempotente en la bóveda de Obsidian del usuario en:
`C:\Users\wilbe\OneDrive\Obsidian\Projects\QuisqueyaHome CRM\Viltrum\`

## 2. Pipeline de Sincronización (`tools/obsidian_sync.py`)
- **Extracción:** Lee los entregables ubicados en `.viltrum/sweep-*/**/*.md`, `.viltrum/findings.md`, `project.md` y `status.md`.
- **Sanitización:** Reemplaza automáticamente cualquier credencial, clave de API o secreto potencial por marcas seguras antes de escribir en OneDrive.
- **Indexación y Dataview:** Inyecta metadatos YAML compatibles con el plugin Dataview de Obsidian (`department`, `status`, `severity_counts`, `source_hash`).
- **Generación de MOC (`00-MOC.md`):** Crea el Mapa de Contenido central con tabla dinámica de departamentos y checklist de hallazgos abiertos.
