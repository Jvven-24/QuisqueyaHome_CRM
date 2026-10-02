# R · Relevo

**Este archivo se reescribe en cada push y describe el commit donde vive.** Si
lo estás leyendo, describe el estado exacto de este commit, no otro.

Para qué sirve: que cualquiera —Codex desde la terminal, una sesión nueva de
Claude, una sesión en la nube, o tú— pueda retomar el trabajo en frío sin
depender de ninguna conversación. El chat se pierde y se compacta; esto no.

Diseño que lo gobierna:
`docs/superpowers/specs/2026-10-02-flujo-claude-codex-y-relevo-design.md`.

---

## 1. Dónde estamos

| | |
|---|---|
| **Rama** | `dev/reestructuracion-solid` |
| **Fecha** | 2026-10-02 |
| **Fase** | R3 (casos de uso de escritura), **6 de 7 issues cerrados** |
| **Pruebas** | **301 en verde**, `typecheck`, `lint` y `build` limpios |

### Módulos ya migrados a `src/application/`

`contactos` (R1.3, piloto) · `pipeline` (R3.1) · `leads` (R3.2) ·
`actividades` (R3.3) · `proyectos` (R3.4) · `usuarios` y `roles` (R3.5) ·
`comisiones`, `metas` y `brokers` (R3.6)

Todos integrados en la rama: comprobado con `git merge-base --is-ancestor`.

### Lo que falta de la reestructuración

- **R3.7** (#51) — catálogos, etapas y papelera con repositorio genérico.
  **Es el siguiente**, y con él cierra la fase R3.
- **R4.1 a R4.3** (#52, #53, #54) — consultas de lectura.
- **R5.2 a R5.8** (#55 a #60, #44) — migración de vistas a Tailwind v4 + shadcn.
- **R6.1** (#45) — cierre y PR a `develop`.

Después de R6.1: limpieza completa del repositorio y, al final, despliegue al
VPS para validación por módulos con el cliente (decisión #17).

---

## 2. Para Codex: qué probar

> Tu única tarea es **romper la interfaz**. No escribes código, no usas `git` ni
> `gh`, y **nunca** ejecutas `npm run dev` ni `npm run build` (dejan archivos en
> `.next/` que Windows no deja borrar). El servidor ya está levantado para ti.

### Pendiente de verificación

| Issue | Módulo | Estado |
|---|---|---|
| #48 | Proyectos, unidades, fases y fotos (R3.4) | `estado:verificar` |
| #49 | Usuarios, invitaciones y permisos (R3.5) | `estado:verificar` |

### Cómo trabajar

1. **Vitrina:** `D:\ViltrumTEK\Quisqueya_Home\crm-codex`, clavada al commit
   `bfc3228`, con el servidor corriendo en **`http://localhost:3001`**. (El 3000
   es el servidor del usuario; no lo toques.) Si el 3001 no responde, dilo y
   para: **no lo levantes tú**.
2. **Guion:** `docs/R_REGRESION.md` tiene el recorrido de los 13 módulos. Haz el
   del módulo que toca, y después sal del guion a propósito: entra con un
   usuario de alcance `own` donde debería ver solo lo suyo, manda formularios
   vacíos y con basura, pulsa dos veces, navega a un `id` que no te pertenece,
   sube un archivo que no sea imagen, recarga a media operación.
3. **Qué cuenta como fallo:** un error 500, una pantalla en blanco, un dato de
   otro usuario a la vista, una operación que se aplica dos veces, un mensaje de
   error que filtre detalles internos, o cualquier cosa que el guion diga que
   debe pasar y no pase.
4. **Dónde escribir:** un archivo por issue en
   `D:\ViltrumTEK\Quisqueya_Home\crm-codex\hallazgos\<issue>.md` —por ejemplo
   `hallazgos\R3.4.md`. Para cada hallazgo: **pasos exactos para reproducirlo**,
   qué esperabas y qué pasó. Sin pasos no sirve. Si no encuentras nada, escríbelo
   igual y dilo.

---

## 3. Qué sigue en código

**Siguiente issue: #50 (R3.6)** — comisiones, metas y brokers como casos de uso.
Depende de R3.5, que está cerrado, así que está listo para empezar.

Patrón a seguir, igual que los cinco módulos ya migrados (ver
`src/application/README.md`):

- `src/application/<modulo>/puertos.ts` — interfaces, sin Drizzle.
- `src/application/<modulo>/casos-de-uso.ts` — la lógica.
- `src/application/<modulo>/en-memoria.ts` — dobles para probar sin base de datos.
- `src/application/<modulo>/casos-de-uso.test.ts` — pruebas.
- `src/infrastructure/db/repos/<modulo>.ts` y
  `src/infrastructure/contenedor/<modulo>.ts`.
- Las rutas de `src/app/api/` quedan delgadas y dejan de importar
  `@/infrastructure/db/*`. `arquitectura.test.ts` lo exige en cuanto existe
  `src/application/<modulo>/`.

### Trampas conocidas

- **`git fetch` tiene que terminar sin error antes de comparar nada.** El 02/10
  un ref corrupto de 41 bytes en ceros rompía todos los fetch y el repositorio
  local pasó días ciego al remoto; se dio por perdido trabajo que estaba
  perfectamente pusheado. Si `fetch` falla, ese es el problema: arreglarlo
  primero. Ver `docs/contexto/errores-conocidos.md`.
- **Nada se prueba si no está pusheado**, y el push y este archivo van en el
  mismo commit.
- **Un issue se cierra solo cuando se vio la corrida de `npm test` en verde**,
  nunca por el informe de otro agente, y solo si su commit es ancestro de
  `dev/reestructuracion-solid`.
- **No se añaden funciones nuevas** (decisión #4) ni se cambia el esquema.
- Toda tabla nueva lleva RLS; toda ruta de API comprueba permisos. `npm test`
  falla si falta cualquiera de las dos.

### Pendiente de decisión del usuario

- **Hallazgo H32** (`docs/R_HALLAZGOS.md`): `editarActividad` asigna
  `cambios.dealId` sin releer el negocio nuevo con el alcance. Es **preexistente**
  —la migración conservó el comportamiento original, como se pidió— y arreglarlo
  es un cambio de comportamiento, que este milestone prohíbe. Hay que decidir si
  entra como excepción de seguridad o se deja para después.

---

## 4. Lo que hay que saber de R3.6 antes de seguir

R3.6 dejó una guarda nueva que conviene replicar, y un agujero que conviene
cerrar. Está en `docs/R_HALLAZGOS.md` como **H33**, y es lo más importante que
salió de esa migración.

Resumen: al migrar comisiones se hizo la prueba de mutación de rigor —quitar el
`{ of: commissions }` del bloqueo de fila— y **no cayó ninguna prueba**. Los
dobles en memoria no tienen concurrencia, así que no pueden ver un `FOR UPDATE`
que falta. Durante seis módulos creímos que sí.

Se cerró con una prueba que **lee el código del adaptador** y exige ese bloqueo,
la misma técnica de `seguridad.test.ts` y `arquitectura.test.ts`. Pero **sigue
abierto en dos adaptadores ya migrados**:

- `repos/pipeline.ts`: el `for("update")` del cierre y el `targetWhere` del
  índice parcial de la meta de compañía.
- `repos/leads.ts`: el `onConflictDoNothing` del webhook con su
  `where: isNull(leads.deletedAt)`.

Quien siga: extender esa guarda a esos dos es trabajo de pruebas, sin riesgo de
comportamiento, y conviene hacerlo **antes de R4 y R5**, porque cada módulo nuevo
añade otra línea cuya desaparición nadie vería.

Y una deuda concreta que **R4.3 debe deshacer**: `exportarComisionesCsv` recibe
la consulta de filas como dependencia (`leerFilas`) porque `consultarFilas` vive
en `app/(crm)/comisiones/_consulta.ts` e `infrastructure/` no puede importar
`app/`. Eso deja `FilaComision` y `FiltrosComisiones` duplicados entre
`application/comisiones/puertos.ts` y la página. R4.3 mueve la consulta a
`consultas.ts`, borra la copia y retira la inyección.
