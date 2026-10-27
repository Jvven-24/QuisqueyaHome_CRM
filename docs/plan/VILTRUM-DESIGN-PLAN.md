# Plan de rediseño del CRM Quisqueya Home con Viltrum Design v2.1

Rama: `codex/wilber-crm-20261026` · Sin despliegue al VPS hasta aprobación de Wilber.

## 0. Lo que ya está hecho (fase 0)
- Paquete vendorizado en `design/viltrum/` (tokens, preset Tailwind, design-tokens.json, baselines WCAG/OWASP, recetas `enterprise-crm-hub` y `ai-crm-dashboard`, contratos y checklists D05/D06/D07).
- `src/app/viltrum-tokens.css` importado en `layout.tsx`: **sólo añade** 20 tokens que faltaban (sombras 2xs–luxury, radios xs/xl/full, fondos `*-soft`, `--ink-secondary`, duraciones, easing, `--focus-ring`). Cero cambio visual. Test que impide pisar tokens existentes.
- `.cursor/rules/viltrum-design.mdc` y sección "Viltrum Design" en `AGENTS.md`.

## 1. Decisión sobre tokens en conflicto (22 nombres compartidos)
El CRM ya usa la misma familia (navy + oro "Private Desk"), pero con valores propios. **No se reemplazan a ciegas:**
- Semáforos Viltrum (`--success #10B981`, `--warning #F59E0B`, `--danger #EF4444`, `--info #0284C7`) no pasan AA como texto sobre blanco; los del CRM (`#16734a`, `#8a5300`, `#a13f43`, `#315f8c`) sí. → Mantener los del CRM para texto; usar los Viltrum sólo como relleno de badges/íconos con `*-soft` de fondo.
- `--canvas` (#f3f5f8 vs marfil #FAF9F6), `--ink`, `--navy-*`, radios (4/7/10 vs 6/10/14): cambio de marca visible → decidir con Wilber con una captura antes/después de Inicio y Leads.
- Tailwind v4 sin config: el preset v3 no se carga; si se adopta, se traduce a `@theme` en CSS.

## 2. Pantallas por prioridad
| Prio | Pantalla | Receta / foco | Departamentos |
|---|---|---|---|
| P0 | Shell global (sidebar + topbar, `layout.tsx`, `nav-link`) | sidebar colapsable compacta de `enterprise-crm-hub`; normaliza pestañas inconsistentes | D05, D07 (foco, teclado) |
| P0 | Inicio / dashboard | franja KPI densa (Ingresos, Negocios activos, Tasa de cierre, Ciclo medio) + timeline lateral | D05, D06 |
| P0 | Leads (lista + ficha) | tabla pro (orden, filtro, paginación, densidad compacta) + ficha con timeline, notas e historial WhatsApp | D05, D06, D07 |
| P1 | Negocios (pipeline kanban por etapas configurables) | tarjetas con `--shadow-sm`, estados de etapa con `*-soft` | D05, D06 |
| P1 | Contactos, Tareas, Agenda | patrón tabla + panel; estados vacíos/carga/error/sin permiso | D06 |
| P1 | Configuración (usuarios, roles, permisos, cuentas Google) | formularios densos; vista sólo lectura clara por rol | D05, D07 |
| P2 | Propiedades, Reservas, Comisiones, Metas, Reportes | `ai-crm-dashboard` (KPI + data-display) | D05 |
| P2 | Comunicaciones, Automatizaciones, Aprobaciones, Documentos | consistencia de pestañas y tablas | D06 |
| P3 | Academy, Comunidad, Posventa, Portal, Avances | alineación de tokens únicamente | D05 |

## 3. Reglas para el equipo
- Componentes: `viltrum-design search <una palabra>` → `get` → `export <ID> --to src/components/ui`, adaptarlos a los tokens del CRM (nada de colores hardcodeados).
- Cada vista entrega los 5 estados D06 (carga, vacío, error, sin permiso, éxito) y pasa checklist D07 (contraste AA, foco visible con `--focus-ring`, navegación por teclado, labels).
- Gates G0–G8 de las recetas: build + 1128 tests verdes, typecheck, revisión visual con captura antes/después.
- Una PR por pantalla; deploy sólo con `./remoto.sh desplegar` tras OK de Wilber.

## 4. Próximos pasos
1. Mockup P0 (shell + Inicio) con ambas paletas para que Wilber elija canvas/radios.
2. Implementar P0 detrás de los tokens; luego P1.
