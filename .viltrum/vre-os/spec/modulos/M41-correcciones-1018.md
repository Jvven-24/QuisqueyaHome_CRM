---
id: M41
nombre: Corrección de defectos verificados de los módulos existentes (auditoría 2026-10-18)
estado: READY
riesgo: R3
owner: D10
productor: D00
revisores: [D14-Haiku, D14-Luna, D12, Wilber]
fuente_de_verdad: PostgreSQL local del CRM
depende_de: [M01, M03, M13, M22]
actualizado: 2026-10-18
---

# M41 · Corrección de defectos verificados (auditoría 2026-10-18)

Ficha de **corrección**, no de funciones nuevas. Autoriza a corregir en código los defectos que dos fuentes independientes
encontraron y documentaron con pasos reproducibles, sin reabrir el diseño de cada módulo. Orden de Wilber del 2026-10-18:
«hay muchas cosas que no funcionan, funcionan mal… todo eso tiene que quedar funcionando». Las fichas de evolución por
módulo (funciones nuevas de la Especificación Maestra) siguen su propio ciclo DRAFT → REVIEW → READY.

## 1. Propósito y usuarios

Que cada pantalla que ya existe haga lo que promete para admin, asistente y broker: sin datos fijos o falsos, con sus seis
estados, validación en tres capas y permisos en servidor. Usuarios: todos los roles del CRM interno.

## 2. Estado actual (AS-IS, del inventario P0)

Evidencia independiente del 18-oct, producida por proveedores distintos del que corrige:
- QA en vivo (Claude Haiku 5.5, perfil D14), con pasos, ancho y captura: `.viltrum/vre-os/auditoria-2026-10-18/qa-G1.md`
  (15 hallazgos), `qa-G2.md` (19), `qa-G3.md` (12), `qa-G4.md` (12 + 3 no concluyentes).
- Conformidad estática contra la spec (Codex GPT-6 Luna, perfil D14) con `archivo:línea`: `matriz-G1.md` … `matriz-G4.md`,
  secciones de bugs/riesgos y hallazgos transversales.
- Comprobado además por D00 en código: `src/app/(crm)/configuracion/page.tsx:148` envía `encryptedCredentials` al cliente;
  `src/app/(crm)/configuracion/_integraciones.tsx:106` muestra «Activo» sin fila de cuenta.

## 3. Pantallas

Solo las existentes: `/inicio`, `/leads`, `/contactos`, `/negocios`, `/propiedades` y su ficha, `/avances`, `/agenda`,
`/tareas`, `/comunicaciones`, `/brokers` y su ficha, `/comisiones`, `/metas`, `/reportes`, `/configuracion` (todas sus
pestañas), la paleta de búsqueda, la campana de notificaciones y la navegación móvil. Además, las rutas de ficha propias
`/leads/[id]`, `/contactos/[id]` y `/negocios/[id]`, que reutilizan los inspectores existentes (UI-006, UI-011, UI-015).
`/academy`: se corrige la fachada (aprobaciones en `useState`, hash fabricado en el cliente, solicitudes y constancias de
ejemplo, IDs fijos que fallan contra la FK, nombre fijo, pestañas a 320 px) leyendo y escribiendo la fuente real: Moodle
por el puerto de aprendizaje y las tablas existentes de Academy. La autoría de cursos se hace en Moodle (editor completo
del sistema open source ya integrado); el CRM enlaza a él y refleja cursos, matrículas y avance reales.

## 4. Funciones (casos de uso)

No se añaden casos de uso. Se corrigen los existentes donde un hallazgo lo exige (validación, permisos, idempotencia,
lectura de la fuente real en lugar de datos fijos). Lógica de negocio fuera de la vista: dominio o casos de uso.

## 5. Datos

Sin tablas nuevas, salvo la persistencia de solicitudes y decisiones de constancia de Academy si las tablas existentes no
la cubren (migración Drizzle con RLS, borrado lógico y auditoría). Se permiten scripts idempotentes de datos de ejemplo de
Academy (curso de inducción en Moodle, usuarios admin y broker enlazados y matriculados) y de limpieza en `scripts/limpieza/` para los registros que dejó el QA
(proyecto `script-alert-1-script`, meta `goals.id = 1000234`), con borrado lógico.

## 6. Integraciones y puertos

Sin integraciones nuevas. El estado de integraciones se lee de su fuente (cuenta, salud del puerto de aprendizaje, outbox).

## 7. Métricas y reportes que alimenta

Las cifras del embudo de `/inicio` y `/reportes` salen de una sola definición compartida.

## 8. Criterios de aceptación (verificables)

1. Cada hallazgo de `qa-G1..G4.md` queda corregido o refutado con evidencia; la reproducción original ya no falla.
2. Cada bug de las matrices que cae en archivos permitidos queda corregido con prueba automatizada si es lógica, permiso o
   validación.
3. Ninguna respuesta al cliente contiene `encryptedCredentials` ni otro campo secreto (prueba que lo impide).
4. Ningún indicador muestra un estado o dato inventado: sin fuente, el estado es «Sin configurar» o vacío.
5. Seis estados en cada pantalla tocada; un `id` inexistente o ajeno muestra el estado propio en español (no el 404 de Next).
6. Sin desborde horizontal ni pestañas inalcanzables de 320 a 1440 px.
7. `npx tsc --noEmit`, `npm run lint` y `npm test` en verde, con el recuento de pruebas pegado.

## 9. Fuera de alcance y preguntas abiertas

Fuera: funciones nuevas de la Especificación Maestra (van en sus fichas: M40 cadena transaccional y siguientes), rediseño
visual (T-DIS-1018) y un editor de cursos propio dentro del CRM (la autoría vive en Moodle). Sin preguntas abiertas: si un hallazgo exige decidir negocio, el corrector lo
deja como «Petición al orquestador» y no lo inventa.

**Acotación D00 tras la verificación R2 (2026-10-18, `auditoria-2026-10-18/verif2-G1-G4.md`: 35/51 corregidos, 0 regresiones):**
pasan a sus fichas de evolución y no bloquean M41: recarga sin conexión (G2-17 → UI-080 PWA), ruta propia de Inbox (G4-11 →
UI-030), registros duplicados Almonte/PNT-11A (G1-07 → decisión de datos D11). Los errores de hidratación (G1-10, H-07, REG-2)
no se reprodujeron en tres verificaciones independientes: se cierran con esa evidencia y se reabren si reaparecen.

**Acotación D00 tras la verificación R3 (`verif3-R3.md`: 5 corregidos, 0 regresiones):** las fichas inexistentes
muestran el estado propio «no encontrado» en español pero responden HTTP 200 en desarrollo (el `loading.tsx` del grupo
`(crm)` empieza a transmitir antes de resolver la ficha). En un CRM autenticado y no indexable no afecta al usuario; se
acepta como limitación conocida y se vuelve a medir en la compilación de producción de la VPS. M41 queda cerrada.
