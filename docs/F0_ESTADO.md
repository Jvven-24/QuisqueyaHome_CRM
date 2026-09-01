# F0 · Estado — qué quedó hecho y qué falta

Corte del **1 de septiembre de 2026**, tras verificar contra la base de datos
real. Rama `dev/jvven`, [PR #11](https://github.com/Jvven-24/QuisqueyaHome_CRM/pull/11)
contra `develop`.

Milestone F0 cierra el **20 de septiembre de 2026**.

---

## Estado por capa

| Capa | Estado | Verificado con |
|---|---|---|
| **T0** Scaffold | ✅ Terminado | CI |
| **T1** Datos | ✅ **Terminado** | 29 tablas y catálogos aplicados en Supabase |
| **T2** Auth | ✅ **Terminado** | Login real de punta a punta |
| **T3** RBAC | ✅ **Terminado** | 14 pruebas + comprobación contra datos reales |
| **T4** Acceso a datos | ✅ Terminado | Typecheck y uso real en T2 |
| **T7** Rutas | ✅ Terminado | Build: 24 rutas |
| **T8** Entorno | ➡️ **Movido fuera de F0** | Decisión #17 |

**F0 está cerrada.** Las cinco capas que le quedaban —T1, T2, T3, T4 y T7— están
terminadas y verificadas contra la base real.

T8 ya no forma parte de F0: por decisión del 1 de septiembre de 2026 (#17 de
`docs/contexto/decisiones.md`), el despliegue al VPS de Hostinger se hace al
final, en una sola operación, cuando el programa esté terminado. Dejarlo dentro
de F0 habría mantenido la fase abierta durante meses por un trabajo que se
decidió no hacer todavía.

---

## Lo que se verificó, y cómo

### T1 · Datos — contra el proyecto real de Supabase

| Comprobación | Resultado |
|---|---|
| Migración aplicada | 29 tablas en `public` |
| Matriz de permisos | admin 126 · assistant 35 · broker 22 |
| Catálogos | 7 etapas, 7 motivos de pérdida, 8 canales, 3 roles |
| Etapas con su `kind` | 6 `open`, Cierre `won`, Perdido `lost` |
| Idempotencia del seed | Corrido dos veces, sin duplicados |

### T2 · Auth — flujo completo por HTTP

| Caso | Esperado | Resultado |
|---|---|---|
| `/`, `/inicio`, `/pipeline` sin sesión | Redirección a login | 307 → `/login?destino=…` |
| `/login` sin sesión | Accesible | 200 |
| Credenciales incorrectas | 401 sin revelar si el correo existe | 401, mensaje único |
| Entrada inválida | 400 con error por campo | 400, en español |
| Credenciales correctas | Sesión en cookies | 200 + cookie de Supabase |
| Ruta privada con sesión | Contenido | 200 |

### T3 · RBAC — el criterio de terminado #1

Es el criterio que dice que un usuario no autorizado no puede leer ni modificar
datos restringidos, **verificado en servidor y no ocultando botones** (§16).

**Con un broker real, sesión real y datos reales:**

| Comprobación | Resultado |
|---|---|
| Módulos que ve en la navegación | 13 de 15 — sin Reportes ni Configuración, exactamente lo que concede el seed |
| `/reportes` y `/configuracion` | **403**, no 500 ni contenido |
| Contactos de otro responsable | No aparecen en su consulta |
| Registros en papelera | No aparecen, ni para el broker ni para el administrador |
| Sus propios contactos | Sí aparecen |

**14 pruebas automáticas** (`npm test`), sin base de datos: 8 sobre la decisión
de permiso y 6 sobre el filtro SQL que la aplica. Cubren que un recurso sin
permiso nace cerrado, que `none` no devuelve nada aunque alguien se salte el
403, y que la papelera se descarta también con alcance `all` — el caso que se
olvida.

---

## Tres cosas que solo aparecieron al conectar de verdad

Ninguna se veía con typecheck, lint ni build. Las tres están corregidas.

**1. La conexión directa de Supabase es solo IPv6.** `db.<ref>.supabase.co` no
tiene registro A. En la máquina de desarrollo daba **1 conexión buena de cada
8**, con `ENOTFOUND` en el resto. Se cambió al *session pooler*, que responde por
IPv4: 10 de 10. Queda anotado en `DESPLIEGUE.md` como comprobación obligatoria
antes de desplegar: **si el VPS de Hostinger no lleva IPv6, la conexión directa
no funciona y el fallo no aparece hasta el primer despliegue.**

**2. Una página sin permiso devolvía 500 en vez de 403.** El dato no se
filtraba, pero la excepción escapaba y salía la pantalla de error genérica: ni el
código de estado correcto ni una explicación para el usuario. Ahora responde 403
con `forbidden()` de Next.

**3. Un mensaje de validación salía en inglés.** `z.string().min(1, "…")` solo
traduce el error de cadena vacía, no el de campo ausente.

---

## Lo que falta

### T8 · Despliegue — aplazado a propósito, ya no es de F0

Por decisión #17: el despliegue y la migración al VPS se hacen **al final, en una
sola operación**, con el programa ya terminado y funcionando. Hasta entonces no
existen staging ni producción, y es deliberado.

Queda pendiente, con fecha en la fase de entrega:

- Despliegue de la aplicación al VPS de Hostinger.
- Proyectos de Supabase de staging y producción.
- **Prueba de restauración de respaldo.** Es lo que cierra el criterio de
  terminado #10 (§16), y no se puede cumplir antes: no hay entorno de producción
  sobre el que probarla. Pendiente explícitamente, no olvidado.
- Monitoreo y alertas.

Ya está hecho por adelantado lo que no dependía de desplegar: contrato de
variables de entorno, procedimiento de respaldo y restauración, y la lista de
comprobaciones para ese día (`DESPLIEGUE.md` §5) — versión de Node, memoria para
el build, y si el VPS lleva IPv6.

### Fricción conocida, no bloqueante

- **Las altas de usuario son a mano** (crear en Supabase Auth + `INSERT` en
  `users`) hasta que exista M13, en la fase F2. Documentado en `SUPABASE.md` §5.
- **`scripts/crear-broker-prueba.mjs` es una fixture de desarrollo.** Crea el
  usuario directamente en `auth.users` porque Supabase rechaza los dominios de
  prueba y un `signUp` con dominio real le mandaría un correo a un tercero. No
  se corre en producción.

### Nada de F1

T5 (estados de interfaz) y T6 (auditoría) son de F1 y no se tocaron, igual que
M1, M2 y M3. Las carpetas de ruta existen con marcadores.

La pantalla 403 que se añadió va **sin diseño a propósito**: maquetar los estados
de interfaz es T5. Lo que corresponde a T3 es que el servidor responda 403.

---

## Lo siguiente, en orden

1. **Mergear el PR #11** a `develop`. De paso arregla el auto-labeler, que hoy no
   corre porque `pull_request_target` lee el workflow desde la rama base.
2. **Empezar F1 por M1 Contactos.** No depende de nada pendiente.

El despliegue queda para el final del proyecto, en su propia operación.
