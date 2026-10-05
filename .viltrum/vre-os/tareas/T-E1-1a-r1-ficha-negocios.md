# T-E1-1a-R1 · Cierre de la ficha M03 «Negocios»: incorporar las decisiones de Wilber y dejarla READY

Perfil: **D01 Discovery + D03 Arquitectura**. Modo: fix, **escribir solo `.viltrum/vre-os/spec/modulos/M03-negocios.md`** (edición del archivo existente). Tier: medium.
Revisión: `npm run spec:check` y lectura del orquestador de §8 y §9. Constitución: `.specify/memory/constitution.md`.
Entradas: la propia ficha M03 (REVIEW, 83 KB), `docs/contexto/decisiones.md` **#45, #46 y #47**, `.viltrum/vre-os/MAPA-SISTEMAS-OSS.md`.

## Por qué se repite
Tu ficha quedó en REVIEW por preguntas abiertas, que es correcto. Wilber (decisión firmada #47, 5-oct) respondió las de negocio que bloqueaban:
- **Q-301 (aprobación del asistente, D-06):** cualquier administrador aprueba o rechaza con motivo, un solo nivel; el asistente no se aprueba a sí mismo; la propuesta caduca a los 7 días.
- **Q-302 (D-07):** el broker ve y edita el **monto comercial** de sus propios negocios; el **precio de lista real** de la unidad y la comisión de terceros solo los ve el admin.
- **Q-303:** al cerrar es **obligatoria una unidad concreta** (se elige o se crea); el sistema impide venderla dos veces; el inventario fino se completa al vender.

## Qué hacer
1. Convierte esas tres respuestas en **requisitos firmados** (REQ-…, fuente «Decisión #47») y reescribe los criterios de aceptación, permisos por rol, casos de uso y datos afectados
   (caducidad de propuestas, restricción de precio en la consulta, restricción única «una unidad vendida una sola vez» a nivel de base de datos con su prueba concurrente).
2. Para **cada una de las demás preguntas** (Q-304 a Q-315): decide un **valor por defecto seguro y reversible**, escríbelo como `SUPUESTO` con responsable (D01/D02/D03/D11/D12/D15/D19),
   fecha 2026-10-05 y la forma de revertirlo, y **no lo conviertas en criterio de aceptación bloqueante**. Las que requieren de verdad al cliente (retención, KPI de negocio, documentos
   KYC, latencias) quedan como supuesto vigente con la pregunta anotada.
3. Define en §9 el **«Tramo construible ahora»**: lista cerrada de funciones, pantallas y consultas que se pueden construir con lo ya decidido, y el **«Tramo en espera»** con lo que
   depende de una respuesta futura. El tramo construible debe incluir: tablero y lista con datos reales, mover etapa con las reglas, perder con motivo obligatorio y archivar (nada se elimina),
   cierre con unidad obligatoria, ficha del negocio con línea de tiempo, aprobación del asistente, y el evento `NegocioCambioEtapa` al outbox. No incluye plan de pagos ni cotizaciones.
4. Mantén las correcciones que ya hiciste a las contradicciones del diseño DS-1 (campos inexistentes, iframe, «conectado por defecto», simulador fuera de alcance): son correctas.
5. Cambia `estado:` a **`READY` solo si** `npm run spec:check` está limpio, no queda `UNKNOWN` en §8 (criterios) y todas las preguntas P0 tienen respuesta firmada o un supuesto
   explícito. Si no puedes, deja `REVIEW` y di exactamente qué falta.
6. Termina con `## Verificación` (salida real de `npm run spec:check`).

## Reglas
Escribe solo ese archivo. Sin código, sin git, sin `npm run dev` ni `build`. No pidas confirmación al usuario: nadie responde en una ejecución sin supervisión; decide y etiqueta.
**Vocabulario:** «Negocios», nunca «pipeline» en texto visible.
