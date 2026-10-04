<!-- Fuente canónica de la constitución del CRM. Spec Kit la lee para sus puertas. Editar SOLO aquí. -->

# Constitución · Quisqueya Home CRM / Viltrum Real Estate OS

> Aprobada por Wilber (2026-10-04): "configurar el flujo y los no negociables para no trabajar a lo loco:
> esquematizar, validar a qué nivel trabajamos, contemplar el todo antes de codear, trabajar lo menos y bien, sin
> errores, cubriendo apartados y con seguimiento". Aplica a toda persona o agente (Claude, Codex, Gemini, Kimi, Grok).
> Es la constitución de GitHub Spec Kit (MIT) instalado en este repo: los comandos speckit de especificar, planificar,
> crear tareas y analizar la aplican. Flujo por pasadas: `.viltrum/vre-os/FLUJO-PASADAS.md`.

## A. Antes de escribir código
1. **Nada se codifica sin ficha `READY`.** Toda tarea cita su ficha (`spec/modulos/Mxx`, `globales/Gxx`,
   `integraciones/Ixx` o la especificación de Spec Kit en `specs/`) y los criterios de aceptación que cumplirá.
2. **Se declara el nivel.** `L0 idea · L1 especificada · L2 lista (READY) · L3 construida · L4 verificada ·
   L5 publicada`. Ninguna pieza salta un nivel.
3. **Se contempla el todo.** La ficha cubre pantallas, funciones, datos, permisos, seis estados, móvil, eventos,
   integraciones, métricas y pruebas antes de construir. Si falta un apartado, no es `READY`.
4. **Primero se investiga ("todo está creado").** Capacidad nueva → inventario propio (CRM y CMS) → open source con
   licencia verificada en la API → solo entonces se construye.

## B. Mientras se construye
5. **Tareas pequeñas y acotadas**: archivos permitidos explícitos, ≤ 45 min de agente, una ficha por tarea.
6. **Arquitectura fija** (`.viltrum/vre-os/ARQ-VRE-002-integraciones.md`): capas `domain → application →
   infrastructure`, proveedores solo detrás de puertos, selección por `env.ts`, una fuente de verdad por entidad, outbox
   para salir, webhook verificado para entrar. Las guardas de `arquitectura.test.ts`/`seguridad.test.ts` no se debilitan.
7. **Nada hardcodeado**: catálogos en tabla, textos y umbrales en configuración, cero cifras de negocio en vistas.
8. **Si aparece un hueco en la especificación, se para**: se anota la pregunta en la ficha y se sigue con lo que no
   dependa de ella. No se inventa comportamiento.

## C. Para dar algo por terminado
9. **Definición de hecho por módulo**: seis estados, móvil 320/390, permisos en servidor, Zod en las tres capas,
   RLS, auditoría, sin datos fijos, pruebas unitarias + guarda + captura a 320/390/768/1440, criterios demostrados.
10. **Verificación por comandos, no por informes**: `tsc` sin errores, `lint` sin errores, `npm test` verde, captura.
11. **Productor ≠ revisor** (otro proveedor). El orquestador aplica el parche y hace commit en `develop` solo con todo
    verde; el mensaje nombra productor, revisor y evidencia. Nunca push ni producción sin Wilber.

## D. Seguimiento
12. **El estado vive en el repositorio**: cada ficha tiene `estado:` en su cabecera y `spec/00-indice.md` se actualiza
    en el mismo cambio (`npm run spec:check`). Trello lo refleja; si discrepan, gana el repositorio.
13. **Toda afirmación lleva evidencia** (archivo:línea, comando y salida, captura, commit). Lo no verificado = `UNKNOWN`.
14. **Cada fallo deja aprendizaje**: regla nueva aquí, en el plan (§9) o una prueba que lo impida.
15. **Secretos fuera de todo**: nunca en archivos del repo, en salidas ni en prompts a proveedores externos.

**Versión**: 1.0.0 | **Ratificada**: 2026-10-04 | **Última enmienda**: 2026-10-04
