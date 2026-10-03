# D07 — Método operativo

## Contrato de entrada

De D05 recibo: pantallas compuestas con tokens, componentes con sus variantes y estados,
verificación básica de contraste y navegación por teclado ya intentada.

De D06 recibo: matriz pantalla × estado con mensajes reales, catálogo de errores.

De D04 recibo: recorridos críticos, para saber cuáles verifico primero y con qué prioridad.

**Si me llega una pantalla sin la matriz de estados de D06, no puedo verificar que los
errores se anuncien a tecnología asistiva — lo marco como bloqueado, no lo invento.**

---

## Procedimiento

### 1 — Marco normativo

Verifico contra **WCAG 2.2, nivel AA**, W3C Recommendation del 12 de diciembre de 2024.
WCAG 2.2 es retrocompatible con 2.1: todo lo que cumple 2.2 cumple 2.1. El criterio
**4.1.1 Parsing** fue retirado en 2.2 (obsoleto, ya no se evalúa).

Los nueve criterios **nuevos en 2.2** reciben atención explícita porque ninguna auditoría
heredada de 2.1 los cubre:

| Criterio | Nivel | Qué exige |
|---|---|---|
| **2.4.11** Focus Not Obscured (Minimum) | AA | El componente con foco no queda totalmente oculto por contenido creado por el autor (headers fijos, cookies, chat) |
| **2.4.12** Focus Not Obscured (Enhanced) | AAA | Igual que 2.4.11, pero sin ninguna parte oculta |
| **2.4.13** Focus Appearance | AAA | El indicador de foco tiene contraste y tamaño mínimos definidos |
| **2.5.7** Dragging Movements | AA | Toda acción de arrastrar puede operarse con un solo puntero sin arrastre, salvo excepciones del criterio; una alternativa de teclado por sí sola no prueba este requisito |
| **2.5.8** Target Size (Minimum) | AA | Objetivos táctiles ≥ 24×24 px CSS, salvo las cinco excepciones (espaciado suficiente, equivalente disponible, en línea de texto, tamaño fijado por el agente de usuario, o esencial) |
| **3.2.6** Consistent Help | A | Un mecanismo de ayuda (contacto, chat, FAQ) aparece en el mismo lugar relativo en todas las pantallas donde existe |
| **3.3.7** Redundant Entry | A | No se pide de nuevo un dato que el usuario ya dio en el mismo proceso, salvo excepción justificada (seguridad, dato esencial) |
| **3.3.8** Accessible Authentication (Minimum) | AA | El login no depende únicamente de una prueba cognitiva (resolver acertijo, transcribir de memoria) sin alternativa |
| **3.3.9** Accessible Authentication (Enhanced) | AAA | Igual que 3.3.8, sin excepción de reconocimiento de objetos o identificación personal |

### 2 — Verificación automática (primera pasada, nunca la última)

- Ejecutar escáner automático tipo axe sobre cada pantalla y cada estado de la matriz de D06
- Registrar cada hallazgo con: criterio WCAG citado por número, elemento afectado, severidad
- **Regla dura: cero hallazgos automáticos no significa "accesible".** Solo significa que
  la parte mecánicamente verificable no tiene errores conocidos. La cobertura automática
  depende del criterio, la herramienta y el contenido; no hay un porcentaje universal.

### 3 — Verificación manual con teclado

Por cada recorrido crítico de D04, navegar **sin mouse**:

- [ ] Todo control interactivo es alcanzable con Tab, en orden lógico (1.3.2, 2.4.3)
- [ ] Ningún control atrapa el foco (2.1.2 No Keyboard Trap)
- [ ] El foco visible existe en todo momento y **no está oculto** por headers fijos, modales
  o superposiciones (2.4.7, y el nuevo **2.4.11**)
- [ ] Los menús, modales y desplegables se abren, navegan y cierran completos con teclado (Esc cierra, foco regresa al disparador)
- [ ] Los atajos de un solo carácter, si existen, se pueden desactivar o remapear (2.1.4)
- [ ] El arrastre tiene alternativa de puntero sin arrastrar (**2.5.7**) y también operación de teclado donde corresponde (**2.1.1**)
- [ ] Ningún objetivo táctil menor a 24×24 px sin excepción válida (**2.5.8**)

### 4 — Verificación manual con lector de pantalla

En al menos un lector de referencia (NVDA, VoiceOver o equivalente según plataforma):

- [ ] El nombre accesible de cada control coincide con su propósito real (4.1.2 Name, Role, Value)
- [ ] Los encabezados forman una jerarquía real, no solo visual (1.3.1, 2.4.6)
- [ ] Los cambios dinámicos (errores, confirmaciones, contenido cargado) se anuncian con regiones vivas (`aria-live`) apropiadas — verificado escuchando, no solo leyendo el HTML
- [ ] Las imágenes informativas tienen texto alternativo que aporta la misma información; las decorativas están marcadas como tales (1.1.1)
- [ ] Las tablas de datos exponen su estructura (encabezados asociados a celdas)
- [ ] El orden de lectura coincide con el orden visual y con el orden lógico de la tarea

### 5 — Contraste, zoom y reflow

- [ ] Contraste de texto normal ≥ 4.5:1, texto grande (≥18pt o 14pt negrita) ≥ 3:1 (1.4.3)
- [ ] Contraste de componentes de interfaz y gráficos informativos ≥ 3:1 (1.4.11)
- [ ] Zoom del navegador hasta 200% sin pérdida de contenido ni funcionalidad (1.4.4)
- [ ] Reflow a 400% de zoom equivalente (ancho ~320px CSS) sin scroll horizontal en contenido de lectura (1.4.10)
- [ ] El texto no depende de imágenes cuando puede ser texto real (1.4.5)

### 6 — Movimiento reducido

- [ ] Toda animación disparada por interacción respeta `prefers-reduced-motion` como práctica del proyecto; **2.3.3 es AAA**, no requisito AA
- [ ] Ningún contenido parpadea más de 3 veces por segundo (2.3.1 — riesgo de convulsiones)
- [ ] Animación de scroll o parallax tiene variante estática cuando el usuario la prefiere

### 7 — Formularios accesibles

Verificación cruzada con `core/doctrine/ux-states.md` y con D06:

- [ ] Toda etiqueta está asociada programáticamente a su campo, no solo visualmente cercana (1.3.1, 3.3.2)
- [ ] Etiquetas e instrucciones de formato necesarias están disponibles antes del error (**3.3.2**); **3.3.5 Help es AAA**
- [ ] El error se identifica en texto, no solo con color o ícono (1.4.1, 3.3.1)
- [ ] El error se anuncia a tecnología asistiva en el momento en que ocurre
- [ ] **No se repite un dato ya ingresado en el mismo proceso** sin justificación (**3.3.7**)
- [ ] Confirmación antes de una acción legal, financiera o de datos irreversible, con oportunidad de revisar y corregir (3.3.4)

### 8 — Autenticación accesible

- [ ] El inicio de sesión no exige exclusivamente resolver un acertijo cognitivo o transcribir un código de memoria sin alternativa — copiar/pegar y administradores de contraseñas deben funcionar (**3.3.8**)
- [ ] Si existe CAPTCHA, tiene alternativa accesible (no solo visual/auditiva simultánea sin opción)
- [ ] Autocompletar de credenciales no está bloqueado sin razón de seguridad documentada

### 9 — Ayuda consistente

- [ ] Si existe mecanismo de ayuda o contacto, aparece en la misma ubicación relativa en todas las pantallas donde está presente (**3.2.6**)

### 10 — Reporte de hallazgos

Cada hallazgo se registra distinguiendo origen:

```
CRITERIO: <número WCAG 2.2 + nombre>
ORIGEN: automático | manual-teclado | manual-lector | ambos
UBICACIÓN: <pantalla, componente>
SEVERIDAD: P0-P3 (core/evidence-contract.md)
EVIDENCIA: <captura, grabación de navegación, reporte de escáner>
CORRECCIÓN PROPUESTA: <qué cambiar>
```

### 11 — Declaración de límites de la verificación

Todo informe de D07 declara explícitamente:
- Qué se verificó de forma automática y con qué herramienta
- Qué se verificó de forma manual, con qué lector y qué navegador
- Qué **no** se pudo verificar (acceso, ambiente, dispositivo) y queda como "no verificado"

**Nunca se declara conformidad total sin haber hecho ambas verificaciones.**

### 12 — Handoff

Entrego hallazgos a D05 (composición), D06 (estados) o D09 (implementación) según dónde
vive la corrección. Mi firma es condición de cierre en Gate G3 (diseño) y Gate G5
(verificación integral).

---

## Herramientas y skills

| Situación | Skill |
|---|---|
| Verificación en navegador real, teclado y recorrido completo | `browser-automation`, `playwright-cli` |
| Pruebas automatizadas de accesibilidad dentro de suites E2E | `playwright-best-practices` |
| Auditoría especializada WCAG/ARIA y guía de remediación | `accessibility` |
| Auditoría de UI ya construida | `21st-ui-review`, `web-design-guidelines`, `code-review` |

**Límite conocido:** la skill `accessibility` guía la auditoría y remediación, pero no
reemplaza instalar/ejecutar axe-core, Lighthouse ni la verificación manual con teclado y
lector de pantalla. Toda conformidad exige evidencia real de esas ejecuciones.

---

## Contrato de salida

- [ ] Verificación automática ejecutada y documentada, con herramienta y alcance
- [ ] Verificación manual con teclado completada en todos los recorridos críticos
- [ ] Verificación manual con lector de pantalla completada, con lector y navegador citados
- [ ] Contraste, zoom y reflow verificados con valores medidos, no estimados
- [ ] Los nueve criterios nuevos de WCAG 2.2 revisados explícitamente, uno por uno
- [ ] Movimiento reducido respetado donde hay animación
- [ ] Formularios verificados contra `core/doctrine/ux-states.md` y este procedimiento
- [ ] Autenticación verificada contra 3.3.8 / 3.3.9
- [ ] Cada hallazgo cita el criterio WCAG por número, con severidad y evidencia
- [ ] Declaración explícita de qué no se pudo verificar
- [ ] Handoff con hallazgos asignados al departamento dueño de la corrección

---

## Antipatrones propios

| Fallo | Corrección |
|---|---|
| Declarar "accesible" solo con escáner automático en verde | Verificación manual con teclado y lector siempre obligatoria |
| Hallazgo sin número de criterio WCAG | Todo hallazgo cita el criterio exacto |
| Verificar solo el estado feliz de la pantalla | Se verifica también la matriz de estados de D06 (error, carga, vacío) |
| Ignorar los criterios nuevos de 2.2 por revisar solo con checklist de 2.1 | Los nueve criterios nuevos se revisan uno por uno, con nombre |
| Foco visible que existe pero queda tapado por un header fijo | Se verifica 2.4.11 explícitamente, no solo "existe el foco" |
| Objetivo táctil pequeño aceptado "porque se ve bien" | Medición real contra 24×24 px y las cinco excepciones de 2.5.8 |
| CAPTCHA sin alternativa accesible | Se verifica 3.3.8/3.3.9 antes de aceptar el mecanismo |
| Declarar conformidad sin decir qué no se verificó | Declaración explícita de alcance en todo informe |
| Corregir en silencio sin dejar hallazgo trazable | Todo hallazgo queda registrado aunque se corrija de inmediato |


## Integración PXIL (2026-09-30)

Antes de diseño o revisión de experiencia, cargar `skills/viltrum-pxil-design/SKILL.md`.
Las skills complementarias del contrato son: pxil-a11y-qa, pxil-permission-matrix.
Consultar `registry/design-resources.json` y la plantilla de contrato de experiencia.
PXIL aporta trazabilidad y estados; conserva los gates, C1 y revisor de Viltrum.
