# T-E1-2a-R1 · Cierre de la ficha M01 «Leads»: incorporar las decisiones de Wilber y dejarla READY

Perfil: **D01 Discovery + D03 Arquitectura**. Modo: fix, **escribir solo `.viltrum/vre-os/spec/modulos/M01-leads.md`** (edición del archivo existente). Tier: medium.
Revisión: `npm run spec:check` y lectura del orquestador de §8 y §9. Constitución: `.specify/memory/constitution.md`.
Entradas: la propia ficha M01 (REVIEW, 77 KB), `docs/contexto/decisiones.md` **#45, #46 y #47**, `.viltrum/vre-os/MAPA-SISTEMAS-OSS.md`.

## Por qué se repite
Tu ficha quedó en REVIEW por preguntas abiertas, que es correcto. Wilber (decisión firmada #47, 5-oct) respondió las de negocio que bloqueaban:
- **Q-1001 (aprobación del asistente, D-06):** cualquier administrador aprueba o rechaza con motivo, un solo nivel; el asistente no se aprueba a sí mismo; la propuesta caduca a los 7 días.
- **Q-1002:** **solo el administrador reasigna**; el broker **puede tomar** leads no asignados desde una cola; toda asignación queda auditada y genera `LeadAsignado`.
- Q-302 (D-07) aplica también aquí: el broker no ve el precio de lista real ni la comisión de terceros; sí el presupuesto declarado por el prospecto.

## Qué hacer
1. Convierte esas respuestas en **requisitos firmados** (REQ-…, fuente «Decisión #47») y reescribe los criterios de aceptación (asignación, toma de leads no asignados con bloqueo
   concurrente: dos brokers pulsando «tomar» a la vez, solo uno gana), permisos por rol, casos de uso y datos afectados (cola de no asignados, caducidad de propuestas).
2. Para **cada una de las demás preguntas** (Q-1003 a Q-1011): decide un **valor por defecto seguro y reversible**, escríbelo como `SUPUESTO` con responsable, fecha 2026-10-05 y la forma de
   revertirlo, y **no lo conviertas en criterio de aceptación bloqueante**. Para Q-1003 (qué historial entra en la línea de tiempo del lead) el supuesto es: actividades con `lead_id` y
   cambios de estado del propio lead; el contexto del contacto y del negocio se muestra aparte y con sus permisos. Para Q-1006 (reactivar descartado): se reabre el mismo lead conservando motivo e historia.
3. Define en §9 el **«Tramo construible ahora»** y el **«Tramo en espera»**. El construible incluye: bandeja con datos reales y filtros en la URL, inspector con línea de tiempo, asignar/tomar/
   convertir/descartar, aviso de duplicados, WhatsApp/llamar (enlace `wa.me` mientras no haya proveedor de mensajería conectado), y los eventos `LeadCreado` y `LeadAsignado` al outbox.
   Excluye IA, importación masiva y E.164 avanzado (ya fuera de alcance).
4. Mantén las correcciones que ya hiciste a las contradicciones del diseño DS-1 (E.164/CSV, iframe de Formbricks, campos inexistentes, SLA sin regla atribuida, «conectado por defecto»).
5. Cambia `estado:` a **`READY` solo si** `npm run spec:check` está limpio, no queda `UNKNOWN` en §8 (criterios) y todas las preguntas P0 tienen respuesta firmada o un supuesto explícito.
   Si no puedes, deja `REVIEW` y di exactamente qué falta.
6. Termina con `## Verificación` (salida real de `npm run spec:check`).

## Reglas
Escribe solo ese archivo. Sin código, sin git, sin `npm run dev` ni `build`. No pidas confirmación al usuario: nadie responde en una ejecución sin supervisión; decide y etiqueta.
**Vocabulario:** «Negocios» para el módulo de seguimiento comercial; nunca «pipeline» en texto visible.
