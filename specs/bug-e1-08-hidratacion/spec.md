---
id: BUG-E1-08
estado: BUILT
nivel: L3
---

# Hidratación determinista de Academy

Tarea autorizada: BUG-E1-08, D09. Corregir fechas y reloj del primer render
sin modificar permisos, datos, navegación, estilos ni reglas de vigencia.

Archivos permitidos: `src/app/(crm)/academy/{page,vista}.tsx`,
`src/lib/academy-fechas{,.test}.ts`, esta ficha.

Aceptación: emisión y sincronización en America/Santo_Domingo, formato estable
entre entornos, vencimiento conserva UTC; SSR y primera hidratación comparten
instante incluso al cruzar el límite de vigencia. Tras montar se usa el reloj
actual como antes. Sin cambios en los seis estados, móvil, eventos, métricas,
integraciones o persistencia. Aprobaciones y Viajes: inspección de su render
inicial y shell compartido, sin fechas dinámicas identificadas en esas vistas.

Verificación: pruebas node:test Node 22 para zonas, límites y guardas de uso;
typecheck. Revisión independiente P4 y reproducción en navegador quedan para
el orquestador; sin dev/build, commit, push, migraciones ni acceso a BD.

Limitación de herramientas: GitNexus MCP/CLI e índice no disponibles en este
worktree. Referencias comprobadas por búsqueda local: AcademyPage es el único
consumidor de AcademyVista; el formateador nuevo es exclusivo de esta vista.

## Evidencia local

- `npx tsc --noEmit -p .`: salida 0, sin errores.
- ESLint sobre los cuatro archivos TypeScript modificados/creados: salida 0.
- `npx -y node@22 --test "src/**/*.test.ts"`: intentado, bloqueado por
  `EAI_AGAIN registry.npmjs.org`. Alternativa con el binario instalado
  `/home/box/.npm/_npx/52027bd8fc0022aa/node_modules/node/bin/node` (v22.23.4)
  y los mismos argumentos: salida 0, 181 archivos aprobados.
- Mismo binario con `--test --experimental-test-isolation=none "src/**/*.test.ts"`:
  1188 pruebas, 1186 aprobadas, 2 omitidas, 0 fallos. Las cuatro regresiones
  nuevas también se ejecutaron directamente: 4 aprobadas.
- Revisión estática de seguridad de los cambios: solo presentación y reloj;
  sin entradas nuevas, HTML sin escapar, credenciales ni cambios en permisos,
  rutas API, autenticación, esquema o persistencia. Sin hallazgos.
- No se declara L4: reproducción intermitente en navegador y revisión P4
  independiente pendientes. No se ejecutó dev/build ni operaciones Git.
