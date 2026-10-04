# T-W3-D05-A · UX visual por módulo con la librería Viltrum Design — módulos comerciales

Perfil: **D05 UI / Design System** (con criterio D04 de recorridos). Modo: analysis. Revisor: D07 (otro proveedor).
Módulos: **Leads · Pipeline · Contactos · Brokers · Comisiones · Metas** (Inicio y Reportes ya los está haciendo D09).
Base: `docs/DESIGN.md` (tokens y reglas), `.viltrum/vre-os/D05-graficas-movil.md` (ChartCard, patrón móvil),
componentes ya instalados `src/components/ui/{chart,drawer,card,tabs}.tsx`, `src/app/(crm)/_ui/`.
Librería Viltrum Design: `E:\VILTRUM\VILTRUM DESING\pxil-ecosystem\private-library\` (`catalog-index.json`,
`screenshots/`, `CATALOGO_VISUAL.md`) y la CLI `viltrum design search|acquire|capture` en este proyecto.

## Paso 1 · Mira el sistema real (evidencia visual)
El CRM corre en `http://localhost:9301` (no lo levantes ni lo reinicies). Captura cada módulo a **390 y 1440 px**
con Playwright (`C:/Users/wilbe/node_modules/playwright`; entra con el botón "Admin" de "Acceso rápido de
evaluación" en `/login`). Guarda en `.viltrum/vre-os/capturas/A/<modulo>-<ancho>.png`.

## Paso 2 · Mira la librería (evidencia visual)
Para cada módulo busca 3–5 candidatos (`viltrum design search --query "<patrón>" --limit 8`; patrones: data table
con filtros y vistas guardadas, kanban de oportunidades, ficha 360 con timeline, leaderboard, tarjeta de comisión con
splits, metas con progreso) y **mira sus capturas** en `screenshots/`. Elige 1–2 por patrón con **id real**.

## Paso 3 · Especificación por módulo
Para cada módulo: problemas de UX vistos en la captura (con referencia a la imagen), estructura propuesta con
**tabs** (qué va en cada tab), qué pasa en móvil (lista de tarjetas, hoja inferior, acciones), componentes elegidos por
id y qué normalizar a los tokens, las gráficas/indicadores que aporta (con la consulta que necesitaría), los seis
estados, y capacidades estilo Twenty que conviene reproducir aquí (vistas guardadas, agrupar/ordenar/filtrar, kanban,
timeline). Wireframe ASCII a 390 y 1440 de las 2 vistas principales del módulo.

## Reglas
No modifiques código. Solo escribe el entregable, las capturas en `.viltrum/vre-os/capturas/A/` y lo que la CLI
`viltrum design acquire` guarde en `.viltrum/design/`. Cita ids y rutas reales; lo no verificado = `UNKNOWN`.

## Entregable
`.viltrum/vre-os/D05-ux-modulos-A.md`, con una sección por módulo y `## Fuentes`.
