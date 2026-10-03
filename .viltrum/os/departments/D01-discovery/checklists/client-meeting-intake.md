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

### C. Parámetros de Negocio, Finanzas y Moneda (D02 Scope / D10 Backend / D11 Data)
*(Inspirado en la doctrina técnica de Viltrum Finance)*
- [ ] **Moneda Base y Multidivisa:** ¿Operará en DOP (Pesos Dominicanos), USD o EUR? ¿Cómo se manejan los tipos de cambio?
- [ ] **Reglas de Amortización / Cálculo Financiero:**
  - En préstamos/pagos diferidos: ¿Interés fijo (*flat rate*), saldo decreciente (*declining balance*) o interés compuesto?
  - Frecuencias de pago toleradas: ¿Diario, semanal, quincenal o mensual?
  - Reglas de mora y penalidades: ¿Porcentaje fijo, interés moratorio diario o cargo administrativo?
- [ ] **Garantías y Codeudores:** ¿Se requieren garantías físicas (vehículos, inmuebles con tasación) o garantes solidarios con cédula verificada?

### D. Documentos Legales, Firmas y Acuerdos Comerciales (D02 Scope / Legal)
- [ ] **Contrato Marco de Prestación de Servicios (C4):** Alcance, plazos de entrega, responsabilidades y soporte post-lanzamiento.
- [ ] **Términos Comerciales y Aceptación Formal (C1):** Hitos de pago (ej. 30% anticipo, 40% entregable funcional en sandbox, 30% puesta en producción).
- [ ] **Documentos Legales Generados por el Sistema:**
  - ¿El software debe emitir contratos imprimibles en PDF con valor legal?
  - ¿Requiere pagaré notarial, recibos de pago con hash de seguridad o acuerdos de confidencialidad (NDA)?
- [ ] **Gobernanza de Datos y Privacidad:** Tratamiento de cédulas, números de tarjeta o teléfonos de clientes bajo regulaciones locales de privacidad.

---

## 3. Algoritmo de Cálculo Porcentual de la Etapa de Descubrimiento

El porcentaje de completitud de la **Fase F1 (Requisitos & Alcance)** no es una estimación subjetiva, sino un cómputo determinista:

$$\text{Completitud F1 (\%)} = (W_{\text{infra}} \times 0.20) + (W_{\text{publico}} \times 0.20) + (W_{\text{negocio}} \times 0.30) + (W_{\text{legal}} \times 0.30)$$

Donde cada $W$ es el porcentaje de preguntas resueltas sin ambigüedad en su bloque respectivo.

* **< 70%:** **ESTADO ROJO (Bloqueo Total).** Se emite de inmediato el *Cuestionario de Despeje* al cliente. Ningún perfil de ingeniería (D09/D10/D11) puede ser activado.
* **70% - 94%:** **ESTADO ÁMBAR (Autorización Condicional).** Se autorizan análisis conceptuales y exploraciones de D21 (investigación) o D03 (ADR preliminares).
* **$\ge$ 95% + C1 Firmada:** **ESTADO VERDE (Gate G1 Superado).** Handoff formal hacia Arquitectura (F2) y Construcción (F4).
