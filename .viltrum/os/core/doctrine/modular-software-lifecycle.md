# Doctrina de Desarrollo Modular en 3 Planos (Macro, Particular, Atómico)

> **Misión:** Eliminar el código monolítico desorganizado y la improvisación de los agentes de IA mediante una descomposición jerárquica estricta en tres niveles de resolución antes de tocar una sola línea de código.

---

## 1. Nivel 1: Plano General (Macro-Arquitectura)

El **Plano General** es responsabilidad de **D00 (Orquestación)** y **D03 (Arquitectura de Solución)** en coordinación con **D02 (Alcance)** y **D21 (Investigación)**.

### Objetivos del Plano General:
1. **Definir la Topología del Sistema:**
   - Selección fundamentada (ADR) según la matriz canónica: Monolito Modular, Hexagonal (Ports & Adapters), BFF, Event-Driven o Microfrontends.
2. **Mapa de Dominios y Bounded Contexts:**
   - Diagramación de módulos sin dependencias circulares. Cada módulo se define sin usar la conjunción "y" (Single Responsibility).
3. **Contratos Maestros de Integración:**
   - OpenAPI 3.1 para servicios HTTP/REST.
   - Definición de esquemas de datos globales y protocolos de idempotencia (`Idempotency-Key`).
4. **Infraestructura y Presupuesto de Recursos:**
   - Límites de memoria, conexiones máximas al pool de base de datos (`max: 8-10`), estrategia de caché en 3 niveles (CDN/Proxy -> Servidor -> Cliente).
5. **Gates de Aceptación (G0 a G8):**
   - Transiciones vigiladas por D00. Ningún módulo entra a construcción (F4) sin C1 aceptada y G2 (arquitectura) validado.

---

## 2. Nivel 2: Plano Particular (Por Módulo / Sección)

El **Plano Particular** es diseñado por los líderes técnicos de cada disciplina: **D04/D05 (Diseño y UX)**, **D09 (Frontend)**, **D10 (Backend)**, **D11 (Datos)** y **D12 (Seguridad)** para cada sección funcional del software.

### Objetivos del Plano Particular:
1. **Aislamiento del Bounded Context:**
   - Cada sección posee su propio directorio, contratos tipados y almacenamiento aislado.
   - Si una sección es eliminada o reescrita, el resto de los módulos no se rompe (Bajo Acoplamiento - Principio P1).
2. **Definición de Adaptadores de Entrada y Salida:**
   - Capa de dominio pura sin imports de SDKs externos. Los proveedores externos (OpenAI, Stripe, Resend, Supabase) viven exclusivamente en `adapters/`.
3. **Gobierno de la Base de Datos:**
   - Migraciones SQL idempotentes (`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`).
   - Vistas dedicadas para la API pública con `security_invoker = true` para evitar fugas de columnas sensibles a través de `anon`.
4. **Estrategia de Sección Móvil vs Escritorio:**
   - Mapeo de flujos: cómo se comporta la sección en pantalla completa de escritorio vs cómo se proyecta en móviles (conversión de modales a Bottom Sheets, tab bar ergonómica, acciones fijas en el tercio inferior).

---

## 3. Nivel 3: Ejecución Atómica (Micro-Nivel)

La **Ejecución Atómica** es la implementación concreta realizada por las sub-especialidades de cada departamento (`D09-A`, `D09-B`, `D10-A`, `D10-B`, `D12-A`, `D15-A`, etc.) mediante commits pequeños y verificables.

### Objetivos de la Ejecución Atómica:
1. **Componentes UI y Hooks de Precisión:**
   - Uso de `100dvh` y `env(safe-area-inset-*)`.
   - Física de resorte cúbico y drag gestures con `overscroll-behavior-y: contain`.
   - Retroalimentación háptica (`useHaptics`) y adaptación dinámica ante teclados virtuales (`useVisualViewport`).
   - Los seis estados obligatorios en cada pantalla: Vacío, Cargando, Parcial, Completo, Error, Reintento.
2. **Validación en los Bordes:**
   - Todo payload entrante a la API o formulario se valida de forma estricta con esquemas Zod compartidos (`Fail Fast`).
   - Sanitización contra XSS (`textContent` sobre `innerHTML`).
3. **Manejo de Concurrencia y Transacciones:**
   - Transacciones explícitas `BEGIN ... COMMIT` en mutaciones multi-tabla.
   - Bloqueos optimistas (`version` / `updated_at`) para prevenir sobreescrituras en caliente.
4. **Evidencia y Hand-off a QA (D14):**
   - Ejecución de la suite local (`Invoke-ViltrumAudit.ps1` / Playwright / Autocannon).
   - Generación de hashes SHA256 de los entregables y traspaso formal para revisión independiente. Ningún perfil aprueba su propio trabajo (Principio P4).
