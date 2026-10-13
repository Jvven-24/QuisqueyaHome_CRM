# T-E1-1a-REV · Revisión independiente de la ficha M03 «Negocios»

Ficha: M03

Perfil: **D02 Alcance** (con mirada D14 de verificabilidad). Productor de la ficha: Codex (D01). Revisor: Antigravity (otro proveedor, regla P4).
Modo: escribir **solo** `.viltrum/reviews/D02-revision-M03-negocios-2026-10-13.md`. No editar la ficha ni ningún otro archivo, sin git, sin servidores, sin secretos.
Tiempo máximo: 45 min. Si algo no se puede verificar, márcalo «NO VERIFICADO», nunca lo des por bueno.

## Entradas
- `.viltrum/vre-os/spec/modulos/M03-negocios.md` (la ficha, estado REVIEW)
- `docs/contexto/decisiones.md` decisiones #45, #46, #47
- `.viltrum/vre-os/NO-NEGOCIABLES.md`, `.viltrum/vre-os/FLUJO-PASADAS.md`
- el código real en `src/` para contrastar las citas archivo:línea de la ficha

## Qué comprobar (cada punto con evidencia archivo:línea o comando)
1. **Fidelidad a #47:** aprobación por cualquier admin en un nivel, sin autoaprobación, caducidad 7 días; broker ve/edita monto comercial propio y el precio real/comisión de terceros es solo admin; unidad concreta obligatoria al cerrar, no vendible dos veces.
2. **Criterios de aceptación (§8, CA-01…):** ¿cada uno es verificable por una prueba o captura concreta? ¿alguno es vago o imposible de probar? ¿cada requisito REQ tiene al menos un CA?
3. **Coherencia interna:** contradicciones entre §3 pantallas, §4 funciones, §5 datos y §9 tramo construible (etapas, roles, estados, nombres).
4. **Citas del código (§2):** toma **10** referencias archivo:línea de la ficha y comprueba que existen y dicen lo que la ficha afirma. Informa cuántas aciertan.
5. **Vocabulario:** ningún texto visible al usuario dice «Pipeline» (solo identificadores técnicos).
6. **Seis estados** (carga, vacío, error, sin conexión, éxito, permiso) y móvil 320/390: ¿están en la ficha como obligaciones?
7. **Tramo construible (§9):** ¿es una lista cerrada que se puede partir en tareas de ≤ 45 min (backend, interfaz, QA)? Propón el corte en 4-6 tareas con orden y dependencias.

## Entrega
Un solo archivo con: resumen en 5 líneas, tabla de hallazgos (ID, severidad P0-P3, evidencia, corrección pedida, dueño), los puntos 1-7 con su resultado, y la última línea exacta:

`VEREDICTO: APROBADO` o `VEREDICTO: APROBADO CON CAMBIOS` o `VEREDICTO: RECHAZADO`

«Aprobado» solo si no hay P0/P1 abiertos. Esto es una revisión de documento; no implica gate, C1 ni aceptación del cliente.
