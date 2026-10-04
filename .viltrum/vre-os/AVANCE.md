# Avance · VRE-OS · Quisqueya Home CRM

Actualizado: 2026-10-04 · **Global: 19.9 %** ████░░░░░░░░░░░░░░░░

| Fase | Avance | Hechas | En curso | Pendientes | Bloqueadas |
|---|---|---|---|---|---|
| F0 Base y cimientos | ████████████ 100 % | 6 | 0 | 0 | 0 |
| F1 Datos e higiene visual | ████████████ 100 % | 4 | 0 | 0 | 0 |
| F2 Reportes reales e integración base | ███████░░░░░ 60 % | 2 | 2 | 1 | 0 |
| E1 E1 · Cinco entregas completas (plan de alto impacto) | ░░░░░░░░░░░░ 1 % | 0 | 1 | 20 | 0 |
| F3 Especificación (pasadas P0–P6) | ████░░░░░░░░ 31 % | 3 | 2 | 5 | 0 |
| F4 Rediseño de pantallas existentes | █░░░░░░░░░░░ 6 % | 0 | 1 | 8 | 0 |
| F5 Módulos nuevos del Blueprint | ░░░░░░░░░░░░ 0 % | 0 | 0 | 16 | 0 |
| F6 Integraciones con sistemas open source | ░░░░░░░░░░░░ 0 % | 0 | 0 | 4 | 1 |
| F7 Cierre y salida a staging | ░░░░░░░░░░░░ 0 % | 0 | 0 | 3 | 1 |

## Siguiente (dependencias cumplidas, se puede empezar ya)
- **F2.1** Reportes e Inicio desde la base, sin cifras fijas (falta: guarda automática anti-hardcode y test:db) _(en curso)_ — D10
- **F2.4** Pruebas de integración contra PostgreSQL real (test:db) _(en curso)_ — D14
- **E1.0** «Pipeline» → «Negocios» en toda la interfaz + guarda de vocabulario (decisión firmada D-04) _(en curso)_ — D09 (Codex)
- **E1.1a** Negocios (kanban real, reglas de etapa, evento al outbox) · ficha READY — D01+D03 (Codex)
- **E1.2a** Leads (tabla, inspector, línea de tiempo, eventos) · ficha READY — D01+D03 (Codex)
- **E1.3a** Propiedades (inventario, matriz torre/piso) · ficha READY — D01+D03 (Codex)
- **E1.4a** Brokers (ranking y perfil con rendimiento) · ficha READY — D01+D03 (Codex)
- **E1.5a** Integraciones (salud de puertos, cola de salida, reintentar/descartar) · ficha READY — D01+D03 (Codex)
- **F3.3** P0 Inventario del CMS reutilizable _(en curso)_ — D22
- **F3.6** P3 UX integraciones y open source (B) _(en curso)_ — D05

## Bloqueado (necesita una decisión o acceso)
- **F6.1** Twenty detrás de CrmPort (TwentyAdapter) — D19
- **F7.4** Migraciones y despliegue a staging en la VPS (requiere autorización de Wilber) — D16

## Esperando dependencias (52)
- F2.5 Leads, pipeline y actividades emiten eventos al outbox (se cubre en E1.1b y E1.2b) ← E1.1b, E1.2b
- E1.1b Negocios (kanban real, reglas de etapa, evento al outbox) · backend y consultas con test:db ← E1.1a, F2.4, E1.0
- E1.1c Negocios (kanban real, reglas de etapa, evento al outbox) · interfaz completa (6 estados, móvil, gráficas) ← E1.1b
- E1.1d Negocios (kanban real, reglas de etapa, evento al outbox) · QA independiente con capturas y cierre (10 condiciones) ← E1.1c
- E1.2b Leads (tabla, inspector, línea de tiempo, eventos) · backend y consultas con test:db ← E1.2a, F2.4
- E1.2c Leads (tabla, inspector, línea de tiempo, eventos) · interfaz completa (6 estados, móvil, gráficas) ← E1.2b
- E1.2d Leads (tabla, inspector, línea de tiempo, eventos) · QA independiente con capturas y cierre (10 condiciones) ← E1.2c
- E1.3b Propiedades (inventario, matriz torre/piso) · backend y consultas con test:db ← E1.3a, F2.4
- E1.3c Propiedades (inventario, matriz torre/piso) · interfaz completa (6 estados, móvil, gráficas) ← E1.3b
- E1.3d Propiedades (inventario, matriz torre/piso) · QA independiente con capturas y cierre (10 condiciones) ← E1.3c
- E1.4b Brokers (ranking y perfil con rendimiento) · backend y consultas con test:db ← E1.4a, F2.4
- E1.4c Brokers (ranking y perfil con rendimiento) · interfaz completa (6 estados, móvil, gráficas) ← E1.4b
- … y 40 más

## Validación: sin errores
