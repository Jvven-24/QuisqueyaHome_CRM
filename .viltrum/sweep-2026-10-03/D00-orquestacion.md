# D00 · Orquestación y Gobernanza Agéntica · QuisqueyaHome CRM

**Fecha:** 2026-10-03  
**Etapa Vigente:** F3 (Diseño & Refactorización de Arquitectura Visual) / G3  
**Control Plane:** Antigravity / Claude  
**Revisor Independiente:** Regla P4 (Ningún perfil aprueba su propia entrega)

---

## 1. Clasificación y Enrutamiento del Proyecto
- **Tipo de Proyecto:** CRM Inmobiliario Turístico & Inversión de Lujo (RD: Punta Cana, Cap Cana, Bávaro, Santo Domingo, Las Terrenas).
- **Riesgo:** **R3** (Datos personales sensibles de inversionistas extranjeros y locales, cálculos contractuales de comisiones y exenciones impositivas Confotur).
- **Entorno de Ejecución:** **100% Local-First**. No se autoriza `git push` a `origin/develop` ni despliegue automático a VPS sin autorización expresa de Wilber De La Rosa.

## 2. Matriz de Responsabilidades por Departamento (RACI)

| Departamento | Responsable (Rol) | Tarea Clave en Fase F3 | Revisor Independiente (P4) |
| :--- | :--- | :--- | :--- |
| **D00** | Orquestador / Lead | Planificación, control de gates y sincronización inter-agente. | Wilber De La Rosa |
| **D01** | Arquitecto de Software | Blindaje de Clean Architecture (`domain/` aislado). | D10 |
| **D02** | Product Manager | PRD y especificación funcional de los 15 módulos (M01-M15). | D04 |
| **D03** | Director de Arte | Identidad visual corporativa, paleta Navy/Gold, isotipo real. | D05 |
| **D04** | UX Researcher | Flujos de trabajo y ergonomía para Brokers y Asistentes en RD. | D02 |
| **D05** | Diseñador UI (PXIL) | Selección de componentes en Viltrum Design Studio & PortalWeb. | D03 / D09 |
| **D06** | Contrato de Experiencia | Cumplimiento estricto de los 6 estados de UX en cada vista. | D14 |
| **D09** | Ingeniero Frontend | Implementación de componentes React 19, Tailwind v4, Lucide. | D14 / D15 |
| **D10** | Ingeniero Backend | Puertos y adaptadores, Drizzle ORM, resiliencia y fallbacks. | D01 |
| **D11** | Arquitecto de Datos | Modelado PostgreSQL, índices de búsqueda y RLS. | D12 |
| **D12** | Oficial de Seguridad | Verificación de RBAC (Admin, Broker, Asistente) y `audit_log`. | D10 |
| **D14** | QA Lead | Batería de 358+ pruebas unitarias, lint y typecheck sin fallos. | D09 / D10 |
| **D15** | Ingeniero de Performance | Latencia de carga, Core Web Vitals, SSR streaming y bundles. | D09 |
| **D16** | DevOps & Entorno | Asignación y aislamiento del rango de puertos dedicado 9300-9399. | D00 |
| **D18** | Especialista IA | Extracción de leads y notas de voz con interfaz HITL 1-clic. | D02 |
| **D19** | Especialista Integraciones | Webhook con Quisqueya PortalWeb y Telegram Bot API nativa. | D10 |
| **D21** | Research & Benchmarking | Brechas competitivas frente a Follow Up Boss, kvCORE y HubSpot. | D01 |
| **D22** | Knowledge Ops | Sincronización continua hacia la bóveda Obsidian del usuario. | D00 |

## 3. Criterios de Aceptación del Gate G3
1. Cero dependencias en `domain/` (Clean Architecture validada por `arquitectura.test.ts`).
2. Identidad corporativa de Quisqueya Home plenamente integrada en el shell con isotipo SVG oficial (cero texto plano improvisado).
3. Componentes enriquecidos con el estándar de Quisqueya Studio (`PortalWeb`) y `Viltrum Design Studio`.
4. Rango de puertos `9300-9399` configurado sin colisiones con puertos comunes de desarrollo.
5. Espejo documental 100% sincronizado en Obsidian con `tools/obsidian_sync.py`.
