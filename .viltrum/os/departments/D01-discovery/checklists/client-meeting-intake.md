# Protocolo & Checklist — Ingesta de Reunión con el Cliente y Detección de Faltantes (Gate G1)

> **Misión (D01 Discovery & D02 Scope):** Convertir la información fragmentada de una reunión (minuta, notas en bruto, audio transcrito o datos mínimos) en un modelo de requisitos verificable, identificando de inmediato **qué datos faltan por confirmar** y calculando el porcentaje real de avance antes de comprometer cotizaciones o escribir código.

---

## 1. Matriz de Extracción Semántica (Triple Columna)

Cada requerimiento extraído de la reunión se clasifica en una de tres categorías estrictas:

| Categoría | Definición | Regla de Traspaso |
| :--- | :--- | :--- |
| **[AFIRMADO]** | Expresado de forma explícita y directa por el cliente. | Se documenta como criterio de aceptación verificable (Given-When-Then). |
| **[INFERIDO]** | Supuesto técnico deducido por la IA para que el sistema funcione. | **Requiere validación explícita del cliente**; no puede darse por cerrado. |
| **[FALTANTE]** | Dato indispensable para la arquitectura, legal o despliegue omitido en la reunión. | Entra al **Cuestionario de Despeje Crítico** con bloqueo de Gate G1. |

---

## 2. Checklist de Detección de Faltantes Críticos (Critical Gap Checklist)

Ningún proyecto avanza de Fase F1 a F2 si quedan casillas desmarcadas sin plan de contingencia registrado:

### A. Infraestructura, Alojamiento y Despliegue (D16 DevOps / D03 Arquitectura)
- [ ] **Proveedor de Alojamiento:** ¿Dónde se desplegará el sistema? (VPS Hostinger, AWS, DigitalOcean, Supabase Cloud, Servidor Local).
- [ ] **Acceso y Credenciales:** ¿Quién proporcionará acceso SSH, DNS, paneles de control o API keys necesarias?
- [ ] **Dominio y Certificados:** ¿El cliente ya posee dominio registrado o requiere aprovisionamiento?
- [ ] **Presupuesto Mensual de Infraestructura:** Rango máximo tolerado por el cliente para servidores, base de datos y consumo de IA.

### B. Público Objetivo, Dispositivos y Experiencia de Usuario (D04 UX / D09 Frontend)
- [ ] **Perfil del Usuario Final:** ¿Quién usará la plataforma a diario? (Clientes externos, agentes inmobiliarios, analistas de crédito, administradores).
- [ ] **Dispositivo Predominante:** ¿El tráfico será >70% móvil (teléfonos) o principalmente escritorio de oficina?
- [ ] **Requisitos de Conectividad:** ¿Debe operar con redes móviles lentas (3G/4G) mediante caché agresiva y compresión WebP/AVIF?
- [ ] **Ergonomía Móvil:** ¿Se requiere experiencia nativa con gestos táctiles, Bottom Sheets y modo oscuro?

### C. Parámetros de Negocio, Cobro y Moneda (D02 Scope / D10 Backend / D11 Data)
- [ ] **Moneda Base y Multidivisa:** ¿Operará en DOP (Pesos Dominicanos), USD o EUR? ¿Cómo se manejan los tipos de cambio?
- [ ] **Reglas de Negocio Críticas:** Reglas que, si se deciden mal, cuestan dinero o confianza, con sus excepciones.
- [ ] **Cobro y Entrega Actuales:** ¿Cómo se cobra y se entrega hoy, y qué debe cambiar?
- [ ] **Objetivo Medible:** Qué resultado debe mejorar el sistema y con qué métrica se comprobará.

### E. Paquete de Dominio (solo el que aplique)
Las preguntas propias de un tipo de negocio viven en `../domain-packs/` y se activan por
reglas explícitas: `ecommerce.md`, `saas.md`, `reservas.md`, `financiero.md`. Un e-commerce
sin crédito no recibe preguntas de amortización ni garantías. El paquete no activado se
registra como **excluido**, no se omite en silencio.

### D. Documentos Legales, Firmas y Acuerdos Comerciales (D02 Scope / Legal)
- [ ] **Contrato Marco de Prestación de Servicios (C4):** Alcance, plazos de entrega, responsabilidades y soporte post-lanzamiento.
- [ ] **Términos Comerciales y Aceptación Formal (C1):** Hitos de pago (ej. 30% anticipo, 40% entregable funcional en sandbox, 30% puesta en producción).
- [ ] **Documentos Legales Generados por el Sistema:**
  - ¿El software debe emitir contratos imprimibles en PDF con valor legal?
  - ¿Requiere pagaré notarial, recibos de pago con hash de seguridad o acuerdos de confidencialidad (NDA)?
- [ ] **Gobernanza de Datos y Privacidad:** Tratamiento de cédulas, números de tarjeta o teléfonos de clientes bajo regulaciones locales de privacidad.

---

## 3. Cobertura de temas y Gate G1 (dos cosas distintas)

La **cobertura** mide qué temas del núcleo y de los paquetes activos aparecen en la reunión:

$$\text{Cobertura (\%)} = \frac{\sum W_i \times \text{peso}_i}{\sum \text{peso}_i}$$

donde cada $W$ cuenta un punto por tema afirmado y medio por tema inferido. Sirve para
saber cuánto falta preguntar; **no aprueba nada**. Lo calcula `viltrum meeting-intake`
(`viltrum_sdk/intake.py`), que admite `--pack` y `--blocker`.

| Resultado de la ingesta | Condición | Qué autoriza |
| :--- | :--- | :--- |
| **ROJO · BLOCKED_G1** | Cobertura < 70 % **o cualquier bloqueo crítico**, sea cual sea la cobertura | Cuestionario de Despeje. Ningún perfil de ingeniería (D09/D10/D11) |
| **ÁMBAR · CONDITIONAL_G1** | Queda algún tema faltante o inferido | Análisis conceptual de D21 y ADR preliminares de D03 |
| **VERDE · READY_FOR_G1_REVIEW** | Todos los temas afirmados y sin bloqueos | Pedir la evaluación de G1 con `/gate` |

**G1** solo se aprueba con la checklist de `core/lifecycle.md` (criterios verificables,
exclusiones, roles, reglas con excepciones, métricas, sin ambigüedad pendiente) y revisor
independiente. **C1** es una aceptación humana separada de la versión exacta de la propuesta
(`core/doctrine/human-approvals.md`, H1). Una cobertura del 99 % con un bloqueo crítico
sigue bloqueada; prueba: `tests/test_sdk_enhancements.py`.

## 4. Estado de cada requisito

| Estado | Significado | Puede entrar al alcance aceptado |
| :--- | :--- | :--- |
| **confirmado** | Lo dijo o aprobó el cliente, con fuente y fecha | Sí |
| **inferido** | Supuesto deducido para que el sistema funcione | Solo tras confirmarlo |
| **propuesto** | Capacidad sugerida por ingeniería o por la IA | Solo con decisión de D02 y aceptación del cliente |
| **pendiente** | Falta el dato o la decisión | No; bloquea el hito que dependa de él |
| **excluido** | Fuera de alcance por escrito | No; se lista en exclusiones |

Una dependencia técnica mínima puede proponerse, pero nunca introduce funcionalidad
comercial en silencio.
