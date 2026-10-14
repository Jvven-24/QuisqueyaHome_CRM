# T-E1-1c1a-R1 · Retrabajo del Tablero tras la revisión del orquestador

Ficha: M03

Perfil: **D09 Frontend** (skill `patron-consola`). Productor: Antigravity (gemini-3.8-flash-high, HAPI). Revisión: orquestador (DOM real y capturas) + Codex (D07/D14) al recuperar cuota.
Modo: fix en `src/app/(crm)/negocios/**` únicamente. Sin git, sin commit, sin `npm run dev`/`build`, sin tocar backend, migraciones ni pruebas de BD. Máximo 45 min. El servidor de revisión ya corre en `http://localhost:9301` (login de evaluación por rol); **no lo reinicies ni levantes otro**.

## Hallazgos medidos en el navegador con datos reales (184 negocios)
1. **P1 · Doble render.** `document.querySelectorAll('.deal-card').length` = **736** para 184 negocios: se montan dos diseños completos (kanban `hidden md:flex` y acordeón `md:hidden`) y la página de admin pesa **2.1 MB** de HTML. Debe montarse **un solo** diseño (o renderizar el oculto de forma diferida), con una sola copia de cada tarjeta en el DOM. Meta: ≤ 184 tarjetas en el DOM del tablero y HTML de admin muy por debajo de 1 MB (si hace falta, limita las tarjetas por etapa con «Ver más» o carga incremental, mostrando siempre el conteo y el total reales de la etapa).
2. **P2 · Objetivos táctiles < 48 px (CA-17).** En 390 px: el nombre del contacto mide 22 px de alto, «Contactar por WhatsApp» 36×48, las pestañas Tablero/Lista/Análisis 28–30 px de alto, el botón de barra lateral 28×28. Todo control interactivo del módulo debe medir al menos 48×48 (el área clicable puede crecer con padding sin cambiar el aspecto).
3. **P2 · Desplazamiento anidado en móvil.** Cada etapa desplegada tiene su propio contenedor con scroll interno (la primera tarjeta aparece cortada). En 320/390 debe haber una sola superficie de desplazamiento: el acordeón crece con su contenido.
4. **P3 · Datos.** Tarjetas con «Sin fecha de etapa» cuando `stageChangedAt` es nulo: está bien mostrarlo, pero distínguelo visualmente de «0 días».

## Lo que ya está bien y debes conservar
Sin desbordamiento horizontal en 390; etapas desde el catálogo con conteo y total por divisa; filtros en hoja móvil; el DTO por rol (asistente sin montos, broker solo suyos, nadie recibe precio real ni comisión de terceros salvo admin).

## Verificación que debes ejecutar y pegar
`npm run typecheck` · `npm run lint` · `npm test` · `npm run spec:check`, y en el navegador (puede ser con el servidor ya levantado) la cuenta de `.deal-card`, el peso del HTML de `/negocios` para admin y el tamaño de los controles. Entrega `.viltrum/vre-os/evidencia/E1/negocios/D09-c1a-r1-tablero.md` terminando con `ESTADO: ENTREGADO` o `ESTADO: BLOQUEADO — motivo`.
