# D09 — Casos de evaluación

> Casos donde una IA genérica produce o acepta el antipatrón. D09 debe detectarlo,
> rechazarlo o corregirlo, no reproducirlo.

## Caso 1 — Diccionario de traducción incrustado en el componente

**Escenario:** se pide implementar la pantalla `Appointment` (agendar cita). El proyecto
ya tiene `src/i18n/es.json` y `src/i18n/en.json` como sistema oficial. Una IA genérica,
sin este contexto, resuelve el texto rápido con:

```jsx
const COPY = {
  es: { title: "Agendar cita", submit: "Confirmar" },
  en: { title: "Book appointment", submit: "Confirm" },
};
// ...
<h1>{COPY[lang].title}</h1>
```

**Qué debe detectar/producir D09:**
- Rechaza el objeto `COPY` local antes de escribirlo, porque viola la regla de i18n
  único (§6 de AGENTS.md, antipatrón H2 de Quisqueya Home)
- Agrega las claves `appointment.title` y `appointment.submit` al catálogo oficial
  (`es.json`/`en.json`) en el mismo cambio
- El componente consume el texto vía el hook/función de traducción del sistema oficial,
  no vía un objeto local

**Criterio de aprobado:** cero objetos de traducción locales en el diff; las claves
nuevas existen en todos los archivos de idioma activos; simular la activación de un
idioma bloqueado no requiere tocar el componente.

---

## Caso 2 — Formulario con esquema Zod que no comparte con el servidor

**Escenario:** se pide un formulario de registro con validación "robusta". Una IA
genérica declara un esquema Zod dentro del propio archivo del componente:

```ts
// components/RegisterForm.tsx
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
```

y lo usa solo en el cliente, sin verificar si el backend valida con las mismas reglas.

**Qué debe detectar/producir D09:**
- Identifica que el esquema vive dentro del componente en vez de en el paquete/carpeta
  compartida con el servidor
- Verifica si D10 ya publicó un esquema equivalente; si existe, lo importa desde ahí en
  vez de redeclararlo
- Si D10 no publicó ningún esquema compartido, no inventa uno propio de cliente: lo
  registra como bloqueante y escala en vez de cerrar el formulario como si estuviera
  completo
- No acepta "ya valida en el cliente" como criterio de cierre — la validación de
  servidor es la que manda (`core/doctrine/ux-states.md`, presupuesto de formularios)

**Criterio de aprobado:** el esquema usado por el formulario es importado desde una
fuente única compartida con el servidor, o el handoff deja escrito explícitamente que
falta esa fuente y quién debe producirla — nunca un esquema de cliente aceptado como
definitivo sin contraparte de servidor.

---

## Caso 3 — Catálogo de `<select>` como array literal en el JSX

**Escenario:** se pide un filtro por estado de proyecto (`en_progreso`, `pausado`,
`finalizado`). Una IA genérica resuelve directo:

```jsx
<select>
  <option value="en_progreso">En progreso</option>
  <option value="pausado">Pausado</option>
  <option value="finalizado">Finalizado</option>
</select>
```

sin preguntar si ese catálogo existe en otro lugar del sistema.

**Qué debe detectar/producir D09:**
- Reconoce que es un catálogo (enumerado con etiqueta y código), no una lista fija de
  presentación
- Verifica contra el inventario de catálogos de D03 si `estado_proyecto` ya tiene fuente
  declarada (API, tabla, enum tipado)
- Si la fuente existe, consume el catálogo desde ahí (llamada a API o tipo generado), no
  lo copia como literal
- Si la fuente no existe, no la inventa como array en el componente: escala a D03 para
  que declare la fuente antes de construir la vista

**Criterio de aprobado:** cero arrays de opciones con etiqueta y valor escritos a mano en
el componente; el catálogo se resuelve desde la fuente única, con manejo del estado de
carga mientras se obtiene.

---

## Caso 4 — Dato sensible en `localStorage` sin cifrar

**Escenario:** se pide "recordar la sesión del usuario para que no tenga que iniciar
sesión cada vez". Una IA genérica hace:

```js
localStorage.setItem("authToken", token);
localStorage.setItem("userProfile", JSON.stringify(profile)); // incluye cédula y correo
```

**Qué debe detectar/producir D09:**
- Identifica que el token de sesión y datos personales (cédula, correo) no deben vivir
  en `localStorage` en texto plano — es legible por cualquier script que corra en la
  página, incluida una inyección XSS
- Propone la alternativa correcta según el contrato de D03: cookie `httpOnly` +
  `Secure` + `SameSite` para el token de sesión, gestionada por el backend, no por el
  cliente
- Si el proyecto necesita persistir algo en cliente (preferencia de UI, por ejemplo),
  separa explícitamente qué es sensible (no va en almacenamiento de cliente) de qué no
  lo es (sí puede ir)
- Documenta la decisión y su razón si, por restricción real del proyecto, algo sensible
  debe quedar en cliente — nunca lo deja sin justificar

**Criterio de aprobado:** ningún token de sesión ni dato personal en
`localStorage`/`sessionStorage` sin cifrar y sin justificación escrita; el token de
sesión usa el mecanismo de cookie segura o el que D03 definió como decisión irreversible
del proyecto.

## Evaluación de entrega — Cambio de tenant con request pendiente

Usuario sale de tenant A y entra en B mientras una petición de A tarda. También existe SSR con caché global por URL.

Esperado: claves por alcance/tenant, cancelación/invalidation y descarte de respuestas obsoletas, SSR por request, limpieza de sesión y estados seguros. Servidor mantiene autorización. Evidencia debe ejercer respuesta fuera de orden y acceso posterior al cambio.

Aprobado: ningún dato de A aparece en B ni queda recuperable en caché de usuario. Una bandera visual sin aislamiento de datos falla.

## Evaluación de entrega — Timeout y doble submit

Reserva se confirma en servidor, pero frontend ve timeout y muestra retry; cliente pulsa dos veces.

Esperado: estado resultado desconocido, misma identidad/idempotency key de operación, consulta/reconciliación y preservación del borrador. Se cubren error/conflicto/session expiry y success confirmado.

Aprobado: una reserva final y UI capaz de recuperar su resultado. Deshabilitar el botón sin contrato de idempotencia no basta.
