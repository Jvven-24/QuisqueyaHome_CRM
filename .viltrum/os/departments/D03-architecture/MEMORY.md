# D03 — Memoria

> Lo que se aprende y no se escribe, se vuelve a pagar.
> Entradas nuevas arriba. Cada una lleva fecha, qué pasó y qué cambió.

## Formato

```
### YYYY-MM-DD — Título corto
**Qué pasó:** hecho observado
**Por qué:** causa real, no síntoma
**Qué cambió:** skill nueva / SOP / checklist / práctica deprecada
**Evidencia:** enlace
```

---

### 2026-09-30 — Split-Brain por Mapeos Manuales en Frontend Desacoplados de la Base de Datos
**Qué pasó:** En proyectos como Andris Portafolio, el comparador de proyectos y fichas técnicas mapeaban objetos literales en TypeScript en vez de consumir la tabla relacional de amenidades, dejando al CMS desincronizado.
**Por qué:** Para resolver rápido el renderizado, el agente duplicó datos del negocio en la interfaz en vez de enlazar contratos de datos y proyecciones de backend.
**Qué cambió:** Regla arquitectónica mandatoria: Prohibido diccionarios estáticos con datos del negocio en el cliente. Toda taxonomía y metadato editorial debe residir exclusivamente en la base de datos relacional y exponerse mediante adaptadores y esquemas Zod compartidos.
**Evidencia:** `Docs/audits/andris-vs-quisqueya-audit-2026-09-29.md`.

### 2026-09-20 — Dato de contacto del negocio duplicado detrás de un respaldo silencioso
**Qué pasó:** En Quisqueya Home el número de WhatsApp estaba escrito a mano en cinco
archivos como `settings.whatsapp_number || '1809...'`. El respaldo nunca fallaba en voz
alta, así que cambiar el número dejaba pantallas apuntando al viejo.
**Por qué:** El inventario de catálogos solo buscaba enumerados del dominio; los datos de
contacto del negocio no se consideraban catálogo.
**Qué cambió:** `checklists/architecture-review.md` sección D exige fuente única para datos
de contacto y prohíbe respaldos silenciosos sobre datos críticos.
**Evidencia:** `projects/quisqueya-home/audit-2026-09-20.md` H1
