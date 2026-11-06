# Consolidación publicada en orq/wilber-final-dev

5 de noviembre de 2026 · Mandato directo de Wilber: combinar los worktrees y subir lo pendiente a su rama final. Contrato: `specs/integracion-worktrees-20261105/spec.md`.

## Resultado de integración

La versión completa conserva el historial de OAuth/Meta/Google/Gmail/Calendar de `b7cee93`; añade los commits locales `156e1fb`, `43341de` y `a36ef48` (transiciones asistidas, permisos de gerente y regresiones), el diseño premium `790e794` y UX2 `34e02c6`. El commit de fusión incorpora los deltas seleccionados del checkout principal `develop`, sin alterar sus archivos fuente.

Se unifican filtros con búsqueda en listas largas, matriz por piso, espacios de Posventa y presentación de Automatizaciones. Se mantienen los ajustes más recientes de Tareas/Negocios/Leads, notificaciones, modales móviles, comparador compacto y navegación por URL. El Combobox recuperado utiliza Radix Popover, opciones de 44 px, búsqueda, selección por teclado que omite opciones deshabilitadas, foco visible y límites del viewport. Los mapas de dependencias de dos pruebas de formularios se adaptaron al nuevo componente; todas sus aserciones de negocio se conservaron.

Se corrigieron dos incompatibilidades de la variante recuperada de Automatizaciones: conservar `tab`/ModuleTabs/tabpanel y usar Checkbox compartido. No se reemplazaron por su versión antigua.

El inventario registra 51 ubicaciones, sus HEAD y decisiones en `INVENTARIO.md`. No se incorporaron artefactos de compilación, datos de acceso, capturas privadas ni borradores históricos incompletos como si fueran módulos operativos. Esos orígenes permanecen intactos; hay un respaldo local adicional de variantes de código.

## Verificación observada

- Node 24.13.0. `npm run typecheck`: exit 0.
- `npm run lint`: exit 0, 0 errores y 17 advertencias previas (imports/variables sin uso).
- `npm test -- --test-concurrency=2`: 1295 pruebas, 1293 correctas, 2 omitidas, 0 fallos.
- `npm run prod:build`: exit 0, salida aislada `.next-prod`; incluye verificación TypeScript y compilación de todas las rutas. No se modifica producción.
- Playwright: Combobox real con React/Radix y CSS compilado, búsqueda/teclado/opción deshabilitada/limpieza a 320, 390, 768 y 1440. Cuatro recorridos correctos, objetivos de 44 px, sin overflow ni errores JS (`combobox-ui.json`). Es un harness aislado, no una sesión del CRM.
- Aplicación compilada en `http://127.0.0.1:9303`: login HTTP 200 a 320/390/1440 sin overflow ni errores JS; `/negocios` sin sesión redirige al login (`app-smoke.json`).
- Recorrido autenticado y prueba contra BD en esta consolidación: **pendientes**. Docker Desktop no arranca por fallo del socket local `dockerInference`; Supabase Auth en 54321 no está disponible. No se reseteó Docker, no se alteraron credenciales ni se aplicaron migraciones para forzar el resultado. La evidencia autenticada del 31/10 pertenece a la pasada anterior y no reemplaza esta validación pendiente.

## Seguridad y límites

Revisión del diff: ninguna tabla, migración o dependencia añadida; sin variables de entorno nuevas ni secretos versionados. La ruta de leads conserva requireScope, validación Zod y asignación explícita. El gerente solo reasigna hacia miembros de su equipo, con comprobación de alcance del lead; se conserva el rechazo de actores de solo lectura. Las pruebas de permisos positivas/negativas pasan. Cambios de UI sin HTML inyectado, sin añadir envíos externos ni simular activaciones/persistencia; los módulos de demostración siguen identificados como tales.

GitNexus detectó alcance HIGH: 58 símbolos cambiados y 12 afectados en 35 archivos del diff de la fusión (incluida documentación), con cobertura JSX incompleta del índice registrado. La primera pasada UX2 tiene su evidencia separada. Los ceros de impactos individuales no se interpretan como aislamiento. Revisión formal por otro proveedor pendiente; no se cierran issues ni gates con esta publicación autorizada.

Notificaciones: actualización con el CRM abierto, no Web Push con la aplicación cerrada. No se declara configuración efectiva de OAuth, servicios externos ni funcionalidad de demostración. Publicación de código en GitHub, sin despliegue.
