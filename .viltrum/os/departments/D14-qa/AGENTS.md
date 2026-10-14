# D14 — Método operativo

## Contrato de entrada

De D01: criterios de aceptación verificables por requisito. **Sin criterio, no pruebo — la
prueba necesita algo contra qué comparar el resultado.**

De D05: matriz pantalla × estado (los seis estados) y especificación de formularios.

De D03/D12: modelo de amenazas y mapa de permisos por rol — para las pruebas que intentan
cruzar límites.

De D09/D10: el cambio implementado, con sus pruebas unitarias ya corriendo.

---

## Procedimiento

### 1. Priorizar por recorrido crítico

Lista de recorridos que, si fallan, cuestan negocio (compra, registro, pago, entrega de
valor principal). Estos llevan E2E automatizado, siempre. El resto se cubre con
proporcionalidad al riesgo.

### 2. Pruebas E2E — Playwright

- [ ] Cada recorrido crítico tiene al menos un test E2E que lo cubre de punta a punta
- [ ] Los tests usan datos de prueba aislados, no dependen de estado dejado por otro test
- [ ] Selectores estables (rol, texto, `data-testid`), nunca selectores frágiles de CSS generado
- [ ] Tests corren en CI en cada cambio que toca el recorrido, no solo manualmente
- [ ] Fallos intermitentes (*flaky*) se investigan y corrigen — no se silencian con reintentos infinitos

### 3. Los seis estados, verificados en ejecución

Aplico `checklists/e2e-states.md`, uno por uno, sobre el sistema corriendo — no sobre el
diseño de D05:

| Estado | Qué verifico en ejecución |
|---|---|
| Carga | El *skeleton* o indicador aparece; doble envío queda bloqueado |
| Vacío | El mensaje real aparece, no un placeholder genérico |
| Error | El error específico aparece; **lo escrito por el usuario se conserva** |
| Sin conexión | Simulo la red caída; el sistema no muestra el error genérico del navegador |
| Éxito | La confirmación específica aparece; el estado final persiste tras recargar |
| Permiso insuficiente | El rol sin permiso no ve o no puede ejecutar la acción, verificado contra el servidor |

### 4. Formularios — ataque activo

Aplico `checklists/e2e-forms.md`:

- [ ] Máscaras respetan el formato declarado por D05 y rechazan lo que no cumple
- [ ] Validación de servidor rechaza lo que la de cliente dejó pasar (probado saltándose el cliente, vía petición directa)
- [ ] Restricción de base de datos rechaza lo que el servidor dejó pasar (probado con inserción directa cuando es viable)
- [ ] Prueba negativa **por capa** (cliente, API directa sin cliente, restricción de BD) con el mismo dato inválido; una capa sin prueba propia = no verificada
- [ ] Retroalimentación según "Contrato de retroalimentación de acciones y formularios" (`core/doctrine/ux-states.md`): botón primario deshabilitado sin motivo visible = P2; obligatorio sin marca visible/programática = P2; error de servidor solo genérico/efímero = P2; el error del servidor aparece en su campo
- [ ] Al fallar la validación, **todo lo escrito se conserva** — campo por campo
- [ ] Doble envío no crea doble registro
- [ ] Guardado parcial funciona si el formulario tiene más de un paso

### 5. Pruebas de permisos — cruzar el límite, no confiar en la interfaz

- [ ] Por cada límite del modelo de amenazas de D12, una prueba que **intenta cruzarlo** por API directa, no solo por la interfaz
- [ ] Usuario de un tenant no accede a dato de otro (si aplica multi-tenencia)
- [ ] Rol bajo no ejecuta acción de rol alto cambiando parámetros de la petición
- [ ] Sesión expirada o revocada se detecta y degrada correctamente, no falla después de aceptar la acción

### 6. Regresión visual

- [ ] Capturas de referencia de las pantallas y componentes críticos, versionadas
- [ ] Comparación automática en cada cambio que toca UI — diferencia visual inesperada bloquea, no se aprueba "a ojo"
- [ ] Verificado en los puntos de corte definidos en D05 (token 7: de 320 a 1440)
- [ ] Cambios de diseño intencionales actualizan la referencia con aprobación explícita, nunca de forma automática

Para portfolios con narrativa de scroll o temas duales, usa la evidencia adicional de la guía
revisada por D00 (HND-012),
[`core/design-experience-os.md` §9](../../core/design-experience-os.md#portfolio-editorial-motion):
capturas por viewport/tema y con movimiento reducido, build/commit y diferencias revisadas.

### 7. Exploración con carta (*charter*)

Para riesgo alto o área con historial de bugs, sesión acotada en tiempo con misión:

```
CARTA: <misión en una frase — qué área, con qué objetivo>
TIEMPO: <acotado, ej. 45 min>
DATOS USADOS: <qué se probó>
HALLAZGOS: <lista, con severidad preliminar>
ÁREAS NO CUBIERTAS: <qué quedó fuera por tiempo>
```

No reemplaza la automatización — la complementa donde el automatismo no llega
(usabilidad real, combinaciones no previstas).

### 8. Protocolo Exhaustivo de Pantallas, Funciones, Filtros y Módulos ("Nada Abajo")

Aplico rigurosamente `checklists/screen-module-matrix-qa.md` en cada proyecto:

- [ ] **Liveness de cada Pantalla:** Rastreo y monto todas las rutas y pantallas del sistema. Cero 500, cero 404 inesperados y cero *White Screen of Death* (WSOD).
- [ ] **Matriz de Filtros:** Pruebo cada chip, dropdown y toggle on/off. Compruebo que la desactivación devuelva al 100% el catálogo y que los parámetros de URL se sincronicen bidireccionalmente.
- [ ] **Pruebas de Límites y Casos Borde en Búsqueda:** Inyecto valores vacíos, especiales, numéricos extremos y parámetros desconocidos. El sistema debe degradar con fallback limpio (`EmptyState`) sin crashear.
- [ ] **Pruebas Unitarias de Funciones Críticas:** Formateadores de moneda (RD$/USD), parseo de fechas locales (evitando desfases UTC) y algoritmos de cálculo probados con baterías unitarias.
- [ ] **Módulos Interactivos:** Modales, drawers y componentes interactivos abren, cierran con `Escape`/click backdrop, atrapan el foco y limpian event listeners sin fugas de memoria.
- [ ] **Veto D14:** Si una sola pantalla devuelve 500 o queda en blanco, el release queda **inmediatamente bloqueado**.

### 9. Reporte de bug reproducible

Todo hallazgo se documenta así, sin excepción:

```
TÍTULO: <síntoma en una frase>
SEVERIDAD: P0 | P1 | P2 | P3
ENTORNO: <navegador/dispositivo, ambiente, versión/commit>
PASOS PARA REPRODUCIR:
  1. ...
  2. ...
DATO USADO: <el dato exacto que dispara el bug>
RESULTADO ESPERADO: <según el criterio de aceptación>
RESULTADO REAL: <qué pasó>
EVIDENCIA: <captura, video, log, request/response>
FRECUENCIA: <siempre | intermitente — con cuántos intentos>
```

Un reporte sin pasos exactos y sin dato exacto no es un bug: es una sospecha. Se investiga
antes de reportarlo como hallazgo cerrado.

### 9. Severidad — aplico `core/evidence-contract.md`

| Severidad | Criterio en QA |
|---|---|
| P0 | Pérdida de datos, acceso indebido, cobro incorrecto, caída total |
| P1 | Bloquea un recorrido crítico o el lanzamiento |
| P2 | Degrada calidad o experiencia sin bloquear |
| P3 | Mejora recomendable, no bloquea |

### 10. Cierre de bug — la prueba nueva es condición, no cortesía

- [ ] El bug corregido tiene una prueba automatizada que lo hubiera detectado
- [ ] La prueba corre en CI, no solo se ejecutó una vez a mano
- [ ] Si el bug reveló un hueco de cobertura más amplio (una categoría entera sin probar), se registra como hallazgo aparte, no se da por resuelto con un solo caso

### 11. Reconocer lo que funciona

- [ ] El reporte incluye una sección de prácticas sólidas verificadas, no solo defectos
- [ ] Evita dar una imagen distorsionada del estado real del producto


### 12. Pruebas de Resiliencia Catastrófica y Fallback (BD Caída / Cold Boot / Migraciones Faltantes)

- [ ] **Simulación de Cold Boot con BD caída:** Prueba unitaria obligatoria donde el pool de BD rechaza conexiones (`ECONNREFUSED` / timeout). El endpoint de catálogo público DEBE responder HTTP 200 con el snapshot pre-empaquetado y cabeceras `X-Catalog-Fallback: snapshot` y `X-Catalog-Stale: 1`. Cero 503 a visitantes.
- [ ] **Aislamiento de tablas secundarias:** Prueba unitaria donde las tablas auxiliares (`project_videos`, `construction_updates`, `amenities`) arrojan error de tabla inexistente. El catálogo debe resolverse exitosamente con las entidades principales (proyectos y zonas).
- [ ] **Frontend Zero-Empty-State:** Verificación de que el Store del portal se hidrata inmediatamente desde el snapshot base o caché local, impidiendo que el usuario vea un pantallazo de "0 proyectos encontrados" o "Catálogo no disponible" ante fallos de conexión.
- [ ] **Veto de Gate G6:** Si la desconexión de BD provoca que el portal público colapse en 503 o pantalla vacía existiendo un snapshot en disco, el release queda **inmediatamente rechazado (NO-GO)**.

---

## Herramientas y skills

| Situación | Skill |
|---|---|
| Diseñar y escribir pruebas E2E, POM, CI | `playwright-best-practices` |
| Ejecutar pruebas y explorar desde CLI | `playwright-cli` |
| Explorar un sitio para mapear recorridos antes de automatizar | `playwright-explore-website` |
| Automatizar llenado de formularios en pruebas | `playwright-automation-fill-in-form` |
| Verificación visual dirigida por captura, sin depender del DOM | `browser-automation` |
| Revisión de calidad del código bajo prueba | `code-review` |

---

## Contrato de salida

- [ ] Recorridos críticos cubiertos por E2E, corriendo en CI
- [ ] Matriz pantalla × estado verificada en ejecución, no solo en diseño
- [ ] Formularios atacados: máscaras, tres capas de validación con prueba por capa, dato conservado, retroalimentación (obligatorios marcados, motivo del botón, error en su campo)
- [ ] Pruebas de permisos que intentan cruzar límites, con resultado documentado
- [ ] Regresión visual con referencias versionadas y comparación automática
- [ ] Sesiones exploratorias con carta en áreas de riesgo alto, documentadas
- [ ] Todo hallazgo con reporte reproducible y severidad clasificada
- [ ] Todo bug cerrado tiene una prueba nueva corriendo en CI
- [ ] Sección de prácticas sólidas verificadas incluida en el reporte
- [ ] Handoff a D00 (puerta) y al departamento dueño de cada hallazgo abierto

---

## Antipatrones propios

| Fallo | Corrección |
|---|---|
| Cobertura alta en unitarias, cero E2E en recorridos críticos | Trofeo de pruebas: priorizar integración y E2E sobre lo que genera negocio |
| Verificar los seis estados solo en el diseño de D05 | Verificación en ejecución real, sistema corriendo |
| Confiar en que el botón oculto es suficiente permiso | Ataque directo al endpoint, cruzando el límite |
| Reporte de bug sin pasos exactos ni dato exacto | Formato reproducible obligatorio, sin excepción |
| Bug corregido sin prueba nueva | Cierre bloqueado hasta que exista prueba en CI |
| Pruebas E2E con selectores frágiles de CSS generado | Selectores estables: rol, texto, `data-testid` |
| Test *flaky* silenciado con reintentos automáticos | Investigar la causa raíz, no enmascarar la inestabilidad |
| Aprobar diferencia visual "a ojo" | Comparación automática contra referencia versionada |
| Reporte que solo lista defectos | Sección de prácticas sólidas incluida siempre |
| QA corrige el bug que encontró | Reproduce y documenta; corrige el departamento dueño |
| Aceptar un hallazgo como riesgo por cuenta propia | Aceptación de riesgo firmada por el dueño de producto o D00 |


## Integración PXIL (2026-09-30)

Antes de diseño o revisión de experiencia, cargar `skills/viltrum-pxil-design/SKILL.md`.
Las skills complementarias del contrato son: pxil-visual-qa.
Consultar `registry/design-resources.json` y la plantilla de contrato de experiencia.
PXIL aporta trazabilidad y estados; conserva los gates, C1 y revisor de Viltrum.
