# Checklist & Matriz de Decisión — Topologías Arquitectónicas (Gate G2)

> La firma quien revisa (D00 / Arquitecto Principal / Humano), nunca quien diseñó (D03).
> Basado en la literatura canónica de ingeniería: Martin Fowler, Eric Evans, Robert C. Martin, Alex Xu y Martin Kleppmann.

---

## 1. Matriz de Selección de Topología

| Estilo Arquitectónico | Cuándo Elegir (Justificación Técnica) | Cuándo Rechazar (Anti-Patrón) | Cita Canónica |
| :--- | :--- | :--- | :--- |
| **Monolito Modular** | Proyectos con equipo < 15 ingenieros, dominio cohesivo, despliegues rápidos en un solo VPS / contenedor. Los límites son módulos lógicos de código con interfaces estrictas. | Si equipos independientes necesitan desplegar a ritmos radicalmente distintos o bases de datos con tecnologías divergentes. | *Martin Fowler — "MonolithFirst" (2015)* |
| **Hexagonal (Ports & Adapters)** | El núcleo del dominio de negocio debe permanecer 100% puro, aislado de la base de datos (PostgreSQL/Supabase), frameworks (Next.js/Express) y APIs externas (Stripe, Twilio, OpenAI). | En CRUDs anémicos de una sola tabla donde el dominio no tiene reglas complejas (sobre-ingeniería innecesaria). | *Alistair Cockburn (2005) & Robert C. Martin — "Clean Architecture" (2017)* |
| **Backend-for-Frontend (BFF)** | Clientes divergentes (ej. App Móvil con ancho de banda reducido y payloads ultraligeros vs Panel de Administración Web con tablas enriquecidas de 50 columnas). | Un solo frontend idéntico para web y móvil; añadir un BFF sólo añade latencia y un salto de red extra. | *Sam Newman — "Building Microservices" (2015)* |
| **Event-Driven (EDA)** | Flujos asíncronos desacoplados en el tiempo (ej. tras publicar una propiedad: generar thumbnails WebP, invalidar caché, notificar a suscriptores, indexar en motor de búsqueda). | Flujos transaccionales síncronos donde el usuario espera respuesta inmediata en pantalla (ej. validar contraseña o reservar cupo exclusivo). | *Martin Kleppmann — "Designing Data-Intensive Applications" (2017)* |
| **Microfrontends** | Múltiples equipos autónomos desplegando partes gigantescas de un portal de forma desacoplada en tiempo real. | Un solo equipo o repositorios pequeños; agrega overhead masivo de CSS, estados compartidos y runtime duplicado de React. | *Martin Fowler — "Micro Frontends" (2019)* |

---

## 2. Criterios de Aceptación del Gate G2

- [ ] **Topología Documentada con ADR:** La elección del estilo está fundamentada en un Architecture Decision Record explicando las ventajas, desventajas y el plan de salida.
- [ ] **Aislamiento de Infraestructura (Regla P1):** El código de negocio (`core/` o `domain/`) no importa drivers de PostgreSQL (`pg`), clientes HTTP (`axios`, `fetch`) ni SDKs de terceros.
- [ ] **Contratos de Datos e Idempotencia:**
  - Todo endpoint con mutación (`POST`, `PUT`, `PATCH`) en operaciones críticas (pagos, reservas, creación de activos) exige cabecera `Idempotency-Key` o UUID idempotente en la base de datos.
- [ ] **Estrategia de Caché de Tres Niveles:**
  - Capa 1 (Reverse Proxy / CDN): Cabeceras `Cache-Control: public, max-age=..., stale-while-revalidate=...`.
  - Capa 2 (Servidor Node.js): Serialización en memoria / Redis con ETags SHA-256 (`304 Not Modified`).
  - Capa 3 (Cliente React): TanStack Query / SWR con invalidación explícita mediante triggers del backend.
- [ ] **Mitigación de Split-Brain y Concurrencia:**
  - Control de concurrencia optimista (`version` o `updated_at` en SQL) para evitar sobreescritura ciega entre administradores simultáneos.
