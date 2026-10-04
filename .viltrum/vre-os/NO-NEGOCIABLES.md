# VRE-OS · Constitución de trabajo (no negociables)

> Aprobada por petición de Wilber (2026-10-04): "configurar el flujo y los no negociables para no trabajar a lo loco:
> esquematizar, validar a qué nivel trabajamos, contemplar el todo antes de codear, trabajar lo menos y bien, sin
> errores, cubriendo apartados y con seguimiento". Aplica a toda persona o agente (Claude, Codex, Gemini, Kimi, Grok).
> Compatible con GitHub Spec Kit (MIT): este archivo cumple el papel de su `constitution.md`.

## A. Antes de escribir código
1. **Nada se codifica sin ficha `READY`.** Toda tarea cita su ficha (`spec/modulos/Mxx`, `globales/Gxx`,
   `integraciones/Ixx`) y los criterios de aceptación que va a cumplir. Sin ficha, primero se especifica.
2. **Se declara el nivel.** Cada pieza vive en uno: `L0 idea · L1 especificada · L2 lista (READY) · L3 construida ·
   L4 verificada · L5 publicada`. Ninguna pieza salta un nivel.
3. **Se contempla el todo.** La ficha cubre pantallas, funciones, datos, permisos, seis estados, móvil, eventos,
   integraciones, métricas y pruebas antes de construir. Si falta un apartado, la ficha no es `READY`.
4. **Primero se investiga (P0 "todo está creado").** Capacidad nueva → inventario propio (¿ya existe en el CRM o en
   el CMS?) → open source con licencia verificada en la API → solo entonces se construye.

## B. Mientras se construye
5. **Tareas pequeñas y acotadas**: archivos permitidos explícitos, ≤ 45 min de agente, una ficha por tarea.
6. **Arquitectura fija** (`ARQ-VRE-002`): capas `domain → application → infrastructure`, proveedores solo detrás de
   puertos, selección por `env.ts`, una fuente de verdad por entidad, outbox para salir, webhook verificado para
   entrar. Las guardas de `arquitectura.test.ts`/`seguridad.test.ts` no se debilitan nunca.
7. **Nada hardcodeado**: catálogos en tabla, textos y umbrales en configuración, cero cifras de negocio en vistas.
8. **Si aparece un hueco en la especificación, se para**: se anota la pregunta en la ficha y se sigue con lo que no
   dependa de ella. No se inventa comportamiento.

## C. Para dar algo por terminado
9. **Definición de hecho por módulo**: seis estados, móvil 320/390, permisos en servidor, Zod en las tres capas,
   RLS, auditoría, sin datos fijos, pruebas unitarias + guarda + captura a 320/390/768/1440, criterios de aceptación
   demostrados.
10. **Verificación por comandos, no por informes**: `tsc` sin errores, `lint` sin errores, `npm test` verde, captura.
11. **Productor ≠ revisor** (otro proveedor). El orquestador aplica el parche y hace commit en `develop` solo con todo
    verde; el mensaje nombra productor, revisor y evidencia. Nunca push ni producción sin Wilber.

## D. Seguimiento
12. **El estado vive en el repositorio**: cada ficha tiene `estado:` en su cabecera y `spec/00-indice.md` se actualiza
    en el mismo cambio. Trello refleja ese estado para lectura humana; si discrepan, gana el repositorio.
13. **Toda afirmación lleva evidencia** (archivo:línea, comando y su salida, captura, commit). Lo no verificado se marca
    `UNKNOWN`.
14. **Cada fallo deja aprendizaje**: regla nueva en este archivo, en el plan (§9) o una prueba que lo impida.
15. **Secretos fuera de todo**: nunca en archivos del repo, en salidas ni en prompts a proveedores externos.
