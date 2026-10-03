# D15 — Método operativo

## Contrato de entrada

De D01/D02: perfil de tráfico esperado (usuarios concurrentes, picos previsibles,
geografía, dispositivos predominantes). **Sin esto no diseño la prueba de carga** — probar
sin saber el escenario real es inventar el resultado.

De D03: topología del sistema, qué componente depende de cuál, dónde están los límites
conocidos.

De D11: consultas críticas y su plan de ejecución actual.

De D16: infraestructura real (CPU, memoria, red) donde corre o correrá el sistema.

---

## Procedimiento

### 1. Declarar el presupuesto antes de construir

Junto con D03, en fase de arquitectura (Gate G2) o antes de la primera medición si el
proyecto ya existe:

- [ ] LCP, INP, CLS con umbral numérico (Core Web Vitals — ver tabla en `SOUL.md`)
- [ ] Tiempo de respuesta objetivo por endpoint crítico (p50, p95)
- [ ] Tamaño máximo de JS crítico y de payload de página inicial
- [ ] Usuarios concurrentes esperados y pico esperado, con margen

El presupuesto se escribe antes de medir. Medir sin presupuesto solo produce un número sin
criterio de aprobado o rechazado.

### 2. Medir el estado actual — nunca optimizar a ciegas

- [ ] Lighthouse CI corrido sobre las páginas críticas, en condiciones simuladas de red y dispositivo reales del perfil de usuario
- [ ] Web Vitals medidos con datos de campo (RUM) si el proyecto ya está en producción — de laboratorio no basta por sí solo
- [ ] Consulta crítica: plan de ejecución capturado **antes** de cualquier cambio
- [ ] Perfil de CPU/memoria del proceso bajo la carga actual, capturado

### 3. Presupuesto de rendimiento en CI

Aplico `checklists/performance-budget.md`:

- [ ] Lighthouse CI configurado con umbrales del presupuesto como *check* obligatorio
- [ ] Build falla si el tamaño de JS crítico supera el límite declarado
- [ ] Regresión de rendimiento se detecta en el PR, no después del release

### 4. Pruebas de carga — k6

Aplico `checklists/load-testing.md`. Cuatro tipos, cada uno revela un límite distinto:

| Tipo | Qué revela |
|---|---|
| **Carga sostenida** (*load*) | Comportamiento con el tráfico esperado normal, sostenido en el tiempo |
| **Estrés** (*stress*) | Punto donde el sistema empieza a degradarse por encima de lo normal |
| **Picos** (*spike*) | Comportamiento ante un aumento súbito y masivo de tráfico |
| **Resistencia** (*soak*) | Si el sistema se degrada con carga normal sostenida por horas (fugas de memoria, conexiones no liberadas) |

- [ ] Los cuatro tipos corridos al menos una vez antes de un release que cambie capacidad esperada
- [ ] Resultado de cada uno con métricas: latencia p95/p99, tasa de error, throughput
- [ ] Punto de quiebre (*breakpoint*) identificado — dónde falla, no solo si falla

### 5. Perfilado de base de datos

Coordinado con D11, nunca reemplazando su checklist de índices:

- [ ] Consultas lentas identificadas con el plan de ejecución real, no con intuición
- [ ] N+1 detectado y corregido o justificado
- [ ] Conexiones de base de datos con *pool* dimensionado — no ilimitado, no insuficiente para la carga esperada
- [ ] Medición de antes y después de cada cambio, registrada

### 6. Caché — con estrategia de invalidación explícita

- [ ] Qué se cachea, dónde (cliente, CDN, aplicación, base de datos) y por cuánto tiempo, documentado
- [ ] Estrategia de invalidación explícita — nunca "expira solo y ya"
- [ ] Dato que cambia con frecuencia no se cachea con TTL largo sin mecanismo de invalidación activa
- [ ] Caché verificado bajo el escenario de "dato recién cambiado" — no debe servir lo viejo más allá de lo declarado

### 7. Degradación elegante

- [ ] Cada dependencia externa (pago, mapa, IA, tercero) identificada con su plan de fallo
- [ ] Timeout definido para cada llamada externa — nunca espera indefinida
- [ ] La caída de una dependencia no auxiliar no tumba el recorrido completo
- [ ] Mensaje al usuario cuando una parte no esencial falla, sin bloquear lo esencial

### 8. Verificación con evidencia

- [ ] Medición de "antes" y "después" del mismo cambio, en las mismas condiciones
- [ ] Reporte de Lighthouse CI adjunto, con fecha
- [ ] Reporte de k6 adjunto por cada tipo de prueba corrida, con fecha
- [ ] Si el presupuesto se cruza, el hallazgo se clasifica por severidad y bloquea el Gate según corresponda

---

## Herramientas y skills

| Situación | Herramienta |
|---|---|
| Auditoría de rendimiento web (LCP/INP/CLS, tamaño de recursos) | Lighthouse CI |
| Datos de campo de Core Web Vitals | Chrome UX Report / RUM del proyecto |
| Pruebas de carga, estrés, picos, resistencia | k6 |
| Perfilado de Postgres/Supabase | `supabase-postgres-best-practices` |
| Verificación visual y de red en navegador | `browser-automation` |

**No hay skill instalada dedicada a Lighthouse CI ni a k6.** Se ejecutan por CLI/CI directo
hasta que exista una skill propia — se anota en `known_limits`.

---

## Contrato de salida

- [ ] Presupuesto de rendimiento declarado y documentado
- [ ] Medición de línea base antes de cualquier optimización
- [ ] Lighthouse CI integrado como check con umbrales del presupuesto
- [ ] Las cuatro pruebas de carga corridas (sostenida, estrés, picos, resistencia) con reporte
- [ ] Consultas críticas perfiladas con plan de ejecución, antes y después
- [ ] Estrategia de caché con invalidación explícita documentada
- [ ] Plan de degradación elegante para cada dependencia externa
- [ ] Medición de "después" que confirma la mejora del cambio aplicado
- [ ] Hallazgos clasificados por severidad, con presupuesto cruzado marcado como bloqueante
- [ ] Handoff a D03 (si el límite es arquitectónico) y a D16 (capacidad de infraestructura)

---

## Antipatrones propios

| Fallo | Corrección |
|---|---|
| Optimizar "porque se siente lento" sin medir | Medición de línea base obligatoria antes de cualquier cambio |
| Agregar índice o caché por intuición | Plan de ejecución o perfil real antes del remedio |
| Probar carga sin perfil de tráfico real | Se pide el escenario a D01/D02 antes de diseñar la prueba |
| Un solo tipo de prueba de carga ("ya probé con k6") | Los cuatro tipos — sostenida, estrés, picos, resistencia |
| Caché sin invalidación clara | Estrategia de invalidación explícita, documentada antes de activar el caché |
| Medir solo en laboratorio, nunca con datos de campo | RUM complementa Lighthouse cuando el proyecto ya está en producción |
| Presupuesto de rendimiento como aspiración, no como bloqueo | Check obligatorio en CI; cruzarlo bloquea el Gate igual que un bug |
| Dependencia externa sin timeout | Timeout definido y degradación elegante para cada una |
| Reportar "mejoró" sin número de antes y después | Ambas mediciones, mismas condiciones, en el mismo reporte |
| D15 decide sola cambiar la arquitectura para resolver un límite | Se documenta el límite medido y se escala la decisión a D03 |
