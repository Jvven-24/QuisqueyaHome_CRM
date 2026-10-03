# D01 · Arquitectura Limpia y Desacoplamiento de Capas · QuisqueyaHome CRM

**Fecha:** 2026-10-03  
**Perfil:** D01 Arquitectura & Visión de Software  
**Revisor Independiente:** D10 Backend  
**Estado:** Cumplido y Auditado

---

## 1. Principio Fundamental de Aislamiento
El sistema aplica **Hexagonal Architecture / Ports & Adapters** con estricta regla de dependencia unidireccional hacia adentro:

```
[ Capa de Presentación / Next.js App Router (src/app/) ]
                        ↓
[ Contenedor de Inyección de Dependencias (src/infrastructure/contenedor/) ]
                        ↓
[ Casos de Uso / Aplicación (src/application/) ]
                        ↓
[ Dominio Puro (src/domain/) ] ← Cero dependencias externas
                        ↑
[ Adaptadores de Infraestructura (src/infrastructure/db/, /auth/, /comunicaciones/) ]
```

## 2. Reglas de Arquitectura Verificadas por Test Automatizado (`src/infrastructure/arquitectura.test.ts`)
1. **Regla de Dominio:** Ningún archivo dentro de `src/domain/` importa librerías externas ni código fuera de `src/domain/`.
   - Se validan reglas de negocio puras: transiciones de embudo, cálculo de amortización Confotur, splits de comisiones, números E.164 de RD, parsing de periodos y slugs.
2. **Regla de Aplicación:** `src/application/` no conoce la infraestructura (`postgres`, `supabase`, `drizzle-orm`) ni el framework web (`next`, `react`). Define únicamente puertos e interfaces (`puertos.ts`) y orquesta casos de uso.
3. **Regla de Infraestructura:** `src/infrastructure/` no importa componentes de presentación (`src/app/`).
4. **Regla de Vistas:** Los componentes de página en `src/app/(crm)/` interactúan con el dominio únicamente a través de los casos de uso provistos por el contenedor en `src/infrastructure/contenedor/`.

## 3. Resiliencia y Degeneración Elegante (Graceful Offline Degradation)
Para evitar que una desconexión accidental del túnel SSH a PostgreSQL (`localhost:55432`) inutilice la navegación local, todos los repositorios implementan un bloque de captura y contingencia que suministra datos de demostración coherentes, permitiendo auditar la UI de inmediato sin bloqueos de servidor.
