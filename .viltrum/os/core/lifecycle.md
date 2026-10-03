# Lifecycle y puertas de calidad

> Una fase no se cierra porque "se ve bien" o "funciona en mi computadora".
> Se cierra con evidencia enlazada. Sin evidencia, la fase sigue abierta.

## Las nueve fases

```
F0 Intake ─ F1 Requisitos ─ F2 Arquitectura ─ F3 Diseño ─ F4 Construcción
   └─ F5 Verificación ─ F6 Pre-release ─ F7 Producción ─ F8 Mejora ─┐
                                                                    │
                            └───────────────────────────────────────┘
```

---

### F0 — Intake y descubrimiento
**Dueño:** D01 · **Revisor:** D02

Salida mínima: problema real, público, objetivo medible, restricciones, evidencia de que
el problema existe, preguntas abiertas listadas.

**Gate G0 — Baseline**
- [ ] El problema está enunciado sin mencionar la solución
- [ ] Existe al menos una evidencia de que el problema es real
- [ ] Las restricciones bloqueantes están identificadas (presupuesto, plazo, marca, legal)
- [ ] Las preguntas abiertas están listadas y asignadas
- [ ] Riesgo R0–R4 clasificado

---

### F1 — Requisitos y alcance
**Dueño:** D01 + D02 · **Revisor:** cruzado

Salida mínima: requisitos funcionales y no funcionales, roles y permisos, reglas de
negocio, exclusiones explícitas, criterios de aceptación, métricas de éxito.

**Gate G1 — Requisitos**
- [ ] Cada requisito tiene criterio de aceptación verificable
- [ ] Las exclusiones están escritas (qué NO se hace)
- [ ] Roles y permisos definidos como catálogo, no como prosa
- [ ] Reglas de negocio con sus excepciones y casos límite
- [ ] Métricas de éxito con valor objetivo
- [ ] Sin requisito ambiguo ni contradictorio pendiente

---

### C1 — Aceptación comercial antes de construir

**Dueño:** D02 · **Revisor:** humano con autoridad comercial · **Custodio:** D00

Este punto separa la preparación de una propuesta del trabajo de construcción. Antes de
la aceptación se permiten descubrimiento, alcance, investigación acotada, estimación y
conceptos de diseño necesarios para decidir. D09, D10, D11 y D16 no comienzan trabajo
de producto ni despliegue por una propuesta todavía no aceptada.

Registro mínimo en `.viltrum/commercial.md`: versión de propuesta, alcance y exclusiones
aceptados, rango/condiciones de precio y plazo, nombre del aprobador, fecha y enlace a
la aceptación. Si cambia el alcance después, D02 abre un `DEC-nnn` y determina si C1
necesita nueva aceptación. El estado `aceptada` sin esos datos no abre el gate.

---

### F2 — Arquitectura, datos e investigación
**Dueño:** D03 + D11 · **Consultado:** D21 · **Revisor:** humano

Salida mínima: módulos y límites, contratos entre módulos, modelo de datos, integraciones,
modelo de amenazas, decisiones registradas (ADR), plan de despliegue, expediente de
investigación construir/comprar/integrar.

**Gate G2 — Arquitectura**
- [ ] Expediente de D21 cerrado: se documentó qué existe y por qué se eligió esta vía
- [ ] Módulos con responsabilidad única y contrato explícito
- [ ] Toda pieza reemplazable está detrás de un adaptador
- [ ] Modelo de datos en 3FN o desnormalización justificada por escrito
- [ ] Catálogos identificados (roles, estados, categorías, tipos) — ninguno hardcodeado
- [ ] Modelo de amenazas para R2 o superior
- [ ] ADR escrito para cada decisión irreversible
- [ ] Estrategia de migración y de reversión definida

---

### F3 — UX, contenido y prototipo
**Dueño:** D04 + D05 · **Revisor:** D14 (D07 aporta la auditoría de accesibilidad como evidencia; no revisa una etapa en la que produce)

Salida mínima: sitemap, recorridos, wireframes, diseño visual sobre tokens, matriz de
estados, comportamiento responsive, accesibilidad, prototipo aprobado.

**Gate G3 — Diseño**
- [ ] Sitemap y recorridos críticos definidos antes del pixel
- [ ] Tokens y componentes antes que pantallas
- [ ] **Matriz pantalla × estado completa** (los seis estados obligatorios)
- [ ] Presupuesto de campos respetado en cada formulario — ninguno monolítico
- [ ] Máscaras, validaciones y formatos definidos por campo
- [ ] Responsive verificado en 390 / 430 / 768 / 1024 / 1440
- [ ] Contraste y navegación por teclado verificados
- [ ] Prototipo aprobado por el cliente o el dueño de producto

---

### F4 — Construcción modular
**Dueño:** D09 + D10 + D11 · **Revisor:** D14 + D13

Salida mínima: código por módulos, convenciones aplicadas, migraciones versionadas,
pruebas unitarias, documentación de módulo, PR revisados.

**Gate G4 — Construcción**
- [ ] Cada módulo respeta el contrato definido en G2
- [ ] Cero valores hardcodeados (categorías, roles, textos, umbrales, endpoints)
- [ ] Validación en las tres capas
- [ ] Migraciones versionadas y reversibles
- [ ] Pruebas unitarias de la lógica de negocio
- [ ] Todo cambio pasó por PR con revisión independiente
- [ ] Sin secretos en el repositorio

---

### F5 — Verificación integral
**Dueño:** D14 · **Apoyo:** D06, D07, D12, D15

Salida mínima: pruebas funcionales, integración, E2E, accesibilidad, seguridad,
rendimiento, defectos clasificados y corregidos.

**Gate G5 — Verificación**
- [ ] Recorridos críticos cubiertos por E2E
- [ ] Los seis estados verificados en ejecución, no solo en diseño
- [ ] Accesibilidad: automática + manual con teclado y lector
- [ ] Seguridad: dependencias, secretos, permisos, cabeceras
- [ ] Rendimiento dentro del presupuesto declarado
- [ ] Cero P0 abiertos · P1 con plan, dueño y aceptación explícita

---

### F6 — Preparación de lanzamiento
**Dueño:** D16 · **Revisor:** D12

**Gate G6 — Release**
- [ ] Respaldo probado con restauración real, no solo configurada
- [ ] Reversión ensayada
- [ ] Migración probada sobre copia de producción
- [ ] Observabilidad activa antes de publicar
- [ ] Secretos, dominio y certificado verificados
- [ ] Documentación mínima entregada, con notas de versión y guía de migración (D20)
- [ ] Registro go/no-go con aprobadores humanos nombrados: criterio técnico (D16) y de negocio (D02)
- [ ] **Aprobación humana explícita registrada**

---

### F7 — Producción y operación
**Dueño:** D17

**Gate G7 — Estabilidad**
- [ ] Monitoreo de disponibilidad y errores activo
- [ ] Alertas accionables sobre recorridos críticos
- [ ] Runbook y base de conocimiento disponibles para el equipo de soporte, probados por un lector en frío (D20)
- [ ] Primer periodo de observación cerrado sin P0

---

### F8 — Mejora continua
**Dueño:** D00 · **Apoyo:** D22

**Gate G8 — Aprendizaje**
- [ ] Deuda técnica inventariada y priorizada
- [ ] Analítica revisada contra las métricas de éxito de G1 (revisión de resultados 30/60/90 días: la produce D08 con datos de D17; la revisa D02; la aprueba un humano)
- [ ] Lecciones escritas en el `MEMORY.md` del departamento correspondiente
- [ ] Toda incidencia recurrente generó skill, SOP, prueba o deprecación

---

## Regla de puerta

Una puerta tiene tres resultados posibles, nunca dos:

| Resultado | Significado |
|---|---|
| **APROBADO** | Toda la checklist con evidencia enlazada. Avanza. |
| **CONDICIONAL** | Avanza con excepciones escritas, con dueño y fecha. Nunca con P0. |
| **RECHAZADO** | Vuelve al departamento dueño con hallazgos clasificados. |

Quien declara el resultado de la puerta **no puede ser** quien produjo el trabajo.
