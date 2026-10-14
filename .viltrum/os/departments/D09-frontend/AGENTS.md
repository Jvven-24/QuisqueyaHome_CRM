# D09 — Método operativo

## Contrato de entrada

De D05 exijo antes de empezar:
- Tokens (tipografía, espaciado, color semántico, radios, sombras, duraciones)
- Componentes con todas sus variantes y estados (reposo, hover, foco, activo,
  deshabilitado, cargando)
- **Matriz pantalla × estado completa**, con mensajes reales (no "TBD")
- Checklist de formularios de D05 aprobada, si hay formularios
- Composición verificada en los puntos de corte de D05 (paso 2, token 7: de 320 a 1440)

De D03 exijo:
- Contrato del módulo: responsabilidad, qué expone, qué no conoce
- Catálogos identificados con su fuente (API, configuración, enum tipado)
- Puertos y adaptadores si el componente habla con un proveedor externo (pagos, mapas,
  analítica) — nunca importo el SDK del proveedor directamente en un componente de vista

**Bloqueante — no empiezo sin:**
- Matriz de estados de D05 (si falta, no hay seis estados que implementar: se inventan
  mal o se omiten)
- Contrato de módulo de D03 (si falta, no sé qué conoce el componente y qué no)
- Esquema de datos o contrato de API cuando el componente consume un endpoint (si el
  backend no tiene contrato publicado, escalo a D10 antes de tipar a ciegas)

Sin estos tres, no implemento. Construir sobre un diseño o un contrato que no existe es
la misma deuda que P0 prohíbe construir sin investigar.

---

## Procedimiento

### 1. Arquitectura de componentes y capas

La vista es la capa más externa y la más desechable. Todo lo demás vive detrás.

```
Vista (componente)       → renderiza, captura interacción, no decide nada
Hooks / composables       → conectan vista con estado y con dominio
Capa de dominio           → reglas de negocio del cliente (validaciones derivadas,
                             cálculos de presentación, políticas de UI)
Capa de datos             → acceso a API, caché, normalización de respuesta
Adaptador                 → SDK o cliente HTTP concreto del proveedor
```

Regla de ubicación:

| Si es... | Vive en... |
|---|---|
| Marcado, estilos, manejo de evento de UI puro (abrir/cerrar, hover) | Componente |
| "¿Puedo enviar este formulario?", "¿qué total muestro?" | Capa de dominio del cliente; "¿puedo enviar?" devuelve `{ ok, reasons[] }` con `{ field, code, messageKey }`, nunca solo un booleano |
| "¿Este usuario puede ver este botón?" | Capa de dominio, verificado también en servidor |
| Llamada HTTP, transformación de payload | Capa de datos |
| Nombre de librería de terceros, credenciales de SDK | Adaptador, nunca en el componente |

**Motivos de acción (específico de D09):** la vista muestra los `reasons[]` del dominio; mapea `errors[]` del servidor a su campo por `field`; bloquea el doble envío en vuelo. Las reglas viven en `core/doctrine/ux-states.md` § "Contrato de retroalimentación de acciones y formularios" y no se copian aquí.

**Prueba de salida:** describir qué hace el componente sin usar "y". Si un componente
"muestra el formulario y calcula el descuento y decide si el botón está habilitado", son
tres responsabilidades separables. La vista solo debería quedar con la primera.

Un componente que importa un cliente de pagos, un SDK de mapas o una librería de
analítica directamente rompe P1 (bajo acoplamiento) igual que lo rompería el backend. Ese
import va en un adaptador con contrato propio.

### 2. Manejo de estado

Tres categorías, y cada una tiene un lugar. Mezclarlas es el error más caro después del
texto incrustado.

| Tipo de estado | Ejemplo | Dónde vive |
|---|---|---|
| **Local de UI** | Modal abierto, pestaña activa, valor de un input antes de enviar | Estado del componente, nunca global |
| **De servidor** | Lista de productos, perfil del usuario, cualquier dato que "es dueño" el backend | Capa de datos con caché, invalidación y revalidación explícitas — nunca copiado a mano en estado global |
| **Global de cliente** | Sesión activa, tema claro/oscuro, carrito antes de confirmar, permisos resueltos | Store global, con acceso de solo lectura desde la vista |

Señales de estado mal ubicado:
- Un dato que vino de la API vive en el mismo store que un dato que el usuario escribió
  y no se guardó — mézclalos y pierdes cuál es la fuente de verdad
- Dos componentes sin relación que necesitan el mismo estado local — normalmente indica
  que el estado debería subir a un ancestro común o pasar a estado de servidor, no que
  hace falta una store global
- Estado de servidor copiado a estado global "para no repetir la consulta" sin invalidación:
  se desincroniza en la primera actualización desde otra pestaña o usuario

**Regla dura:** el estado de servidor no se duplica a mano en estado global. Se usa una
capa de datos con revalidación (caché con invalidación por clave, no un `useEffect` que
copia la respuesta a una variable global una sola vez).

### 3. Formularios con esquema de validación compartido con el servidor

**Nunca reimplemento la validación en el cliente con reglas distintas a las del
servidor.** El mismo esquema declara el contrato una sola vez.

Patrón de referencia (Zod es el ejemplo verificado, no la única opción válida): el
esquema vive en un paquete compartido entre cliente y servidor —o se genera desde el
contrato de API (OpenAPI/JSON Schema)— y ambos lados lo importan. El cliente lo usa para
feedback inmediato; el servidor lo usa como autoridad final. Zod expone conversión a JSON
Schema y resolvers para librerías de formularios (p. ej. React Hook Form), lo que permite
mantener un único esquema declarado y conectarlo tanto al formulario como a la capa de
validación de API. Fuente: `https://zod.dev/` (consultado 2026-09-24).

Procedimiento:
1. Verifico que el esquema exista en el paquete/carpeta compartida, no que lo haya
   escrito yo mismo dentro del componente
2. Si D10 no publicó el esquema compartido, **no lo invento por mi cuenta** — escalo,
   porque un esquema de cliente que no coincide con el de servidor es el antipatrón que
   este mismo punto existe para prevenir
3. Aplico el esquema al formulario vía su integración oficial (resolver), no reescribo
   las reglas a mano en el `onSubmit`
4. Verifico que cada mensaje de error del esquema sea el mismo texto (vía i18n, nunca
   incrustado) que ve el usuario, no un código interno

**Antipatrón que detecto y rechazo:** un esquema Zod (u otro) declarado dentro del
archivo del componente, usado solo en el cliente, sin equivalente en el servidor. Es
validación de cliente disfrazada de validación robusta — el servidor queda sin defensa
real.

### 4. Máscaras

D09 implementa máscaras, no las inventa. La fuente es `core/doctrine/ux-states.md` §
Presupuesto de formularios y `departments/D05-ui-design-system/checklists/form-design.md`
§ C (catálogo de máscaras por tipo de dato).

- [ ] La máscara aplicada es la que D05 especificó para ese campo, no una que decidí yo
- [ ] La máscara no bloquea pegar desde el portapapeles
- [ ] El valor se normaliza al guardar (sin separadores) y se formatea solo al mostrar
- [ ] Si D05 no especificó máscara para un campo con formato conocido (teléfono, cédula,
      RNC, moneda, fecha), no lo dejo en texto libre por defecto: escalo antes de
      implementar

### 5. Tipado estricto

- [ ] `strict: true` en la configuración de TypeScript del proyecto, sin excepciones por
      carpeta
- [ ] Cero `any`. Un tipo desconocido se modela como `unknown` y se afina con guardas de
      tipo, nunca se silencia con `any`
- [ ] Los tipos de dato que cruzan la frontera con la API se generan desde el contrato
      (OpenAPI, esquema compartido, tipos exportados por el backend), no se escriben a
      mano por duplicado — un tipo a mano que diverge del contrato real es un bug
      esperando a que el backend cambie
- [ ] Las props de cada componente están tipadas explícitamente, sin `PropsWithChildren`
      genérico que oculte qué recibe realmente
- [ ] Los catálogos (enums de estado, roles, categorías) se tipan como unión literal o
      enum generado desde la misma fuente que usa el servidor, nunca redeclarados a mano

### 6. i18n sin textos incrustados en componentes

**Lección aplicada de Quisqueya Home (hallazgo H2, `projects/quisqueya-home/audit-2026-09-20.md`):**
tres componentes (`Appointment.jsx`, `detail.jsx`, `DetailSections.jsx`) llevaban su
propio `const COPY = { es: {...}, en: {...} }` en vez de usar `src/i18n/`. Mientras el
idioma nuevo estaba bloqueado no se notó. El día que se activó habría dejado exactamente
esas dos pantallas —las de decisión de compra— en el idioma equivocado, sin aviso, porque
el sistema oficial no sabía que esas tablas existían.

Regla dura, sin excepción:
- [ ] Existe **un solo** sistema de traducción por proyecto. Cero `const COPY`, `const
      TEXTS`, `const LABELS` u objeto equivalente declarado dentro de un componente
- [ ] Todo texto visible —incluye mensajes de error, `aria-label`, `title`, texto
      alternativo, texto de confirmación— sale del sistema de i18n oficial, con clave con
      espacio de nombres por pantalla (`appointment.title`, no una clave plana que choque
      con otra pantalla)
- [ ] Si un componente necesita un texto que el sistema de i18n no tiene, se agrega la
      clave al catálogo oficial en el mismo cambio, nunca como objeto local "temporal"
- [ ] El script de auditoría de i18n del proyecto (si existe) pasa sin claves huérfanas
      ni faltantes antes de dar el componente por terminado
- [ ] Un idioma nuevo se activa quitando un flag de bloqueo, no tocando componentes — si
      activar un idioma obliga a tocar un componente, hay un diccionario incrustado en
      algún lugar y es un hallazgo

### 7. Catálogos desde API, nunca arrays hardcodeados

- [ ] Ninguna lista de opciones de `<select>`, radio group, filtro o badge está escrita
      como array literal en el JSX o en un archivo del componente
- [ ] Todo catálogo (estados, roles, categorías, tipos, motivos) se obtiene de la misma
      fuente que D03 identificó y D11/D10 expone — vía API, config compartida o tipo
      generado
- [ ] Los valores inactivos del catálogo no se ofrecen para elegir, pero un registro
      histórico que ya los tiene los sigue mostrando correctamente
- [ ] Si el catálogo cambia con poca frecuencia, se permite cachear en cliente, pero
      **nunca copiarlo a mano como literal** — la caché tiene invalidación, el literal no

### 8. Manejo de errores y los seis estados obligatorios, a nivel de componente

Aplico `core/doctrine/ux-states.md` como implementador, no como diseñador — la solución
visual ya la definió D05, yo la conecto a datos reales.

| Estado | Qué implemento en el componente |
|---|---|
| **Carga** | Skeleton con la forma real del contenido (no spinner genérico), indicador dentro del botón en acciones, bloqueo de doble envío mientras la petición está en vuelo |
| **Vacío** | Rama de render explícita cuando la colección viene vacía — nunca inferida de "si el array tiene longitud 0 no renderizo nada" |
| **Error** | Captura el error de la capa de datos, muestra el mensaje humano que D05 definió, conserva lo que el usuario escribió (nunca se limpia el formulario al fallar) |
| **Sin conexión** | Detecta la pérdida de red y muestra la pantalla propia, no deja que el navegador muestre la suya; encola o avisa según lo que D05 especificó |
| **Éxito** | Estado final visible y persistente, no un toast que desaparece sin dejar rastro en la UI si la acción era importante |
| **Permiso insuficiente** | El componente oculta o deshabilita con razón visible **basado en el permiso que devuelve el servidor**, nunca en una suposición del cliente — el rol se verifica de nuevo del lado servidor siempre |

**Prohibido:** un solo `if (loading) return <Spinner />` como respuesta a los seis
estados. Cada estado tiene su propia rama verificable.

### 9. Accesibilidad técnica (lo que le toca a D09; D07 audita)

D09 implementa la semántica; D07 la audita con herramienta automática y manual. División:

| Responsabilidad de D09 | Responsabilidad de D07 |
|---|---|
| Usar elemento HTML semántico correcto (`button`, no `div` con `onClick`) | Verificar cobertura de la auditoría automática (axe u otra) |
| Rol y atributos ARIA correctos cuando no hay elemento nativo equivalente | Navegación completa con lector de pantalla real |
| Gestionar el foco tras navegación en SPA (mover foco al contenido principal o al título de la nueva vista) | Verificación de contraste en contexto de marca |
| Gestionar el foco tras una acción asíncrona (error de formulario → foco al primer campo con error o al resumen de errores; modal → foco atrapado dentro, devuelto al disparador al cerrar) | Declaración de conformidad WCAG del proyecto |
| Anunciar cambios dinámicos con `aria-live` cuando el cambio no está en el foco del usuario | Verificación manual solo-teclado del recorrido completo |
| Etiqueta real asociada a cada campo (`label` con `for`/`htmlFor`, no solo `placeholder`) | — |

Referencia técnica: WCAG 2.2, W3C Recommendation (consultado 2026-09-24,
`https://www.w3.org/TR/WCAG22/`). Criterios que D09 implementa directamente:
- **2.4.7 Foco visible (AA)** — el indicador de foco existe y no se elimina con CSS
- **4.1.2 Nombre, rol, valor (A)** — todo componente interactivo expone nombre y rol
  programáticos, no solo apariencia visual
- **4.1.3 Mensajes de estado (AA)** — los mensajes de error y confirmación se anuncian a
  tecnología asistiva sin requerir que el usuario mueva el foco

### 10. Rendimiento del cliente

- [ ] División de código por ruta como mínimo; división adicional para modales pesados,
      editores, gráficos o librerías grandes usadas en una sola pantalla
- [ ] Nada de una librería completa importada para usar una función — import específico o
      alternativa más liviana
- [ ] Imágenes en formato moderno (WebP/AVIF con `<img>`/`picture` o el componente de
      imagen del framework), con `loading="lazy"` fuera del viewport inicial
- [ ] Tamaños responsivos declarados (`srcset`/`sizes` o equivalente del framework) —
      nunca una sola imagen grande servida a todos los anchos
- [ ] Sin layout shift evitable: dimensiones reservadas para imágenes y contenido
      asíncrono antes de que carguen
- [ ] Medición real antes de optimizar más allá de esto — presupuesto y medición son de
      D15; D09 no adivina qué es lento

### 11. Seguridad del cliente

Referencia verificada: OWASP Cheat Sheet Series — Cross Site Scripting Prevention Cheat
Sheet (consultado 2026-09-24,
`https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html`).
Reglas centrales que aplico: codificar la salida según el contexto (HTML, atributo,
JavaScript, CSS, URL) y nunca confiar en que el framework sanea todo — el propio cheat
sheet nombra `dangerouslySetInnerHTML` en React, `bypassSecurityTrustAs*` en Angular y
`unsafeHTML` en Lit como escapes explícitos de esa protección.

- [ ] `dangerouslySetInnerHTML` / `innerHTML` / equivalentes: bandera roja. Si aparecen,
      exijo razón escrita y sanitización verificada con una librería mantenida (no una
      expresión regular casera) — nunca se acepta HTML de usuario o de API externa sin
      sanitizar
- [ ] Ninguna URL de `javascript:` ni `data:` sin validación específica
- [ ] Ningún secreto ni clave de API privada en el bundle del cliente — si una función
      necesita una clave privada, esa función vive en el servidor, no se llama directo al
      proveedor desde el navegador
- [ ] Variables de entorno expuestas al cliente revisadas una por una: solo lo que es
      seguro que cualquier visitante vea
- [ ] Dato sensible (token de sesión, dato personal) nunca en `localStorage` sin cifrar
      cuando existe alternativa de cookie `httpOnly`; si debe estar en almacenamiento de
      cliente, se justifica por escrito y se documenta qué pasa si el dispositivo se
      comparte
- [ ] Enlaces externos con `rel="noopener noreferrer"` cuando abren en pestaña nueva

### 12. Pruebas de componentes

- [ ] Cada componente se prueba **aislado de la lógica de negocio real** — la lógica de
      dominio ya tiene sus propias pruebas unitarias en su propia capa; el componente
      prueba que renderiza y reacciona a la interacción, con esa lógica simulada
- [ ] Se prueban los seis estados del componente, no solo el estado feliz
- [ ] Se prueba el comportamiento con teclado en interacciones críticas (formulario,
      modal, menú)
- [ ] No se prueban detalles de implementación (nombre de una clase CSS, estructura
      interna del DOM que el usuario no percibe) — se prueba lo que el usuario ve y hace
- [ ] Las pruebas end-to-end de recorridos completos no son de D09: eso es D14. D09
      entrega el componente probable de forma aislada; D14 verifica el recorrido real

---

### 13. Hidratación resiliente y Cero Pantallas Vacías (Zero-Empty-State)

- [ ] **Hidratación inmediata:** La tienda de datos del portal público debe hidratar de inmediato desde el snapshot pre-empaquetado o caché local (localStorage) para renderizado instantáneo sin pantallas de bloqueo.
- [ ] **Preservación de datos ante fallo:** Si una sincronización en segundo plano falla (red caída, error 503 del backend o cold boot), la interfaz DEBE conservar el catálogo existente en memoria y en pantalla. Queda prohibido vaciar el catálogo o sustituir una interfaz con proyectos por una pantalla de bloqueo "0 proyectos encontrados" o "Catálogo no disponible".
- [ ] **Aviso no destructivo:** Ante caídas transitorias del backend, el sistema degrada con avisos discretos (toasts/banners informativos), permitiendo al visitante continuar explorando y consultando.

---

## Skills y herramientas aplicables

| Situación | Skill / herramienta |
|---|---|
| Instalar o buscar un componente ya existente antes de crear uno | `21st-cli-use`, Magic MCP de 21st.dev |
| Construir UI de producción sobre la especificación de D05 | `21st-ui-build`, `shadcn-ui` |
| Aplicar rendimiento y patrones React mantenibles | `vercel-react-best-practices` |
| Verificar visualmente y contra estándares web | `browser-automation`, `playwright-cli`, `web-design-guidelines` |
| Pruebas de componente y de comportamiento | `playwright-best-practices` |
| Remediar accesibilidad antes del handoff a D07 | `accessibility` |
| Entender impacto de un cambio en código ya existente | `viltrum-repo-map` (impacto) |
| Explorar cómo está armado un módulo antes de tocarlo | `viltrum-repo-map` (explorar) |
| Depurar un bug de interfaz con trazabilidad | `viltrum-repo-map` (depurar) |
| Refactor seguro de un componente o de su estructura de archivos | `viltrum-repo-map` (refactor) |
| Revisión de código propio antes de entregar a D14 | `code-review` |
| Revisión de seguridad puntual (XSS, secretos en bundle) | `security-review` |
| Simplificar código repetido entre componentes | `simplify` |
| Datos con Supabase cuando el frontend consume directo (solo si D03 lo autorizó como adaptador) | `supabase` |
| Consumir un modelo de IA desde el cliente | `claude-api` |

**Regla de uso:** la skill acelera el trabajo mecánico; el criterio de separación de
capas, tipado y seguridad sigue siendo mío. Ninguna skill me exime de rechazar una
especificación incompleta o un catálogo hardcodeado.

---

## Contrato de salida

- [ ] Componentes implementados según especificación de D05, sin desviación no acordada
- [ ] Vista sin lógica de negocio — verificable describiendo cada componente sin "y"
- [ ] Estado clasificado correctamente: local, de servidor o global — ninguno mezclado
- [ ] Formularios con esquema de validación compartido con el servidor, no reimplementado
- [ ] Máscaras aplicadas según `form-design.md`, ninguna inventada por D09
- [ ] TypeScript estricto, cero `any`, tipos de API generados desde el contrato
- [ ] Cero texto visible incrustado — un solo sistema de i18n, verificado contra H2
- [ ] Cero catálogo como array literal — todo desde API o fuente compartida
- [ ] Los seis estados implementados y verificables en ejecución, no solo en diseño
- [ ] Foco gestionado en navegación SPA y tras acciones asíncronas
- [ ] División de código aplicada donde corresponde; imágenes modernas y responsivas
- [ ] Hidratación resiliente activa: tienda con snapshot base, sin bloqueo ante 503 o caída de red
- [ ] Sin `dangerouslySetInnerHTML`/`innerHTML` sin sanitizar y sin razón escrita
- [ ] Sin secretos ni claves privadas en el bundle
- [ ] Pruebas de componente cubriendo los seis estados, aisladas de la lógica de negocio
- [ ] Checklists `component-architecture.md` y `forms-i18n-states.md` completas
- [ ] Handoff a D14 con lo anterior más los riesgos abiertos declarados

## Protocolo especializado de entrega

Para un mandato de entrega, aplicar [sops/delivery.md](sops/delivery.md) junto con este método. El contrato [delivery.json](delivery.json) define entradas, salidas, checks, capacidades necesarias y tareas delegables. Consultar la skill local indicada en manifest; disponibilidad de herramientas, autorización, C1 y revisión independiente se comprueban para cada proyecto. Las rúbricas de `evals/cases.md` no acreditan ejecución ni cierre de gates.


## Integración PXIL (2026-09-30)

Antes de diseño o revisión de experiencia, cargar `skills/viltrum-pxil-design/SKILL.md`.
Las skills complementarias del contrato son: pxil-compose.
Consultar `registry/design-resources.json` y la plantilla de contrato de experiencia.
PXIL aporta trazabilidad y estados; conserva los gates, C1 y revisor de Viltrum.

Para implementar narrativa de scroll o temas duales, sigue la guía común revisada por D00
(HND-012) de
[`core/design-experience-os.md` §9](../../core/design-experience-os.md#portfolio-editorial-motion);
mantén scroll nativo y fallback accesible según la especificación aprobada por D05/D07.
