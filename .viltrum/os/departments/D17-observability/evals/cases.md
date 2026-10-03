# D17 — Casos de evaluación

> Casos donde una IA genérica falla porque confunde "hay un dashboard" con "hay
> observabilidad", o "hubo un culpable" con "se encontró la causa".

## Caso 1 — Alerta configurada pero nunca probada

**Escenario:** el equipo configuró una alerta de "tasa de error > 5%" apuntando a un
canal de Slack que nadie revisó en las últimas dos semanas porque el canal quedó
archivado tras una reorganización. Nadie lo notó porque la tasa de error nunca cruzó el
umbral — hasta que un incidente real ocurrió y la alerta disparó hacia un canal muerto.

**Qué debe detectar/producir D17:**
- Identificar que "la alerta existe en la configuración" no es lo mismo que "la alerta
  funciona" — se necesita un simulacro periódico que fuerce la condición y verifique
  que alguien la recibe.
- Aplicar el principio operativo del departamento: una alerta silenciosa es peor que
  un fallo, porque genera falsa confianza de que hay cobertura cuando no la hay.
- Proponer verificación activa: prueba mensual de cada canal de alerta, no solo
  revisión de que la regla sigue configurada.

**Criterio de aprobado:** la corrección incluye un mecanismo de prueba periódica de los
canales de notificación, no solo mover la alerta al canal correcto una vez.

Una IA genérica corrige el canal y da el caso por cerrado, sin proponer cómo evitar que
vuelva a pasar con el próximo canal que se archive.

---

## Caso 2 — Postmortem que empieza señalando a una persona

**Escenario:** un incidente SEV2 ocurrió porque alguien desplegó una configuración sin
revisar el checklist de pre-release. El borrador de postmortem que trae el equipo dice:
"Causa raíz: el desarrollador no siguió el checklist de despliegue."

**Qué debe detectar/producir D17:**
- Rechazar esa formulación como causa raíz — es una atribución de culpa individual, no
  un análisis de sistema, y viola el método sin culpables.
- Reformular la pregunta: ¿por qué era posible desplegar sin que el checklist se
  verificara? ¿El pipeline permite avanzar sin marcarlo? ¿El checklist es tan largo que
  se salta por hábito? Esas son las causas del sistema.
- Producir acciones de seguimiento sobre el proceso: el checklist se vuelve un gate
  automático del pipeline (bloqueante), no una lista que se confía a la memoria de la
  persona.

**Criterio de aprobado:** el postmortem final no contiene ninguna frase que atribuya el
incidente a una persona por nombre o rol individual; las acciones de seguimiento
cambian el sistema, no piden "tener más cuidado".

Una IA genérica frecuentemente acepta la causa raíz tal como se la entregan porque
suena razonable, sin cuestionar si describe una persona o un proceso.

---

## Caso 3 — SLO propuesto sin dueño de negocio, copiado de un estándar genérico

**Escenario:** al preparar el gate G7, alguien propone "SLO: 99.99% de disponibilidad"
para todo el sistema, citando que "es el estándar de la industria", sin que el dueño de
producto haya participado ni sepa qué implica ese número en tiempo de inactividad
tolerado (52 minutos al año) ni en costo de ingeniería para sostenerlo.

**Qué debe detectar/producir D17:**
- Rechazar el SLO por no tener dueño de negocio ni estar atado a un recorrido crítico
  específico — "todo el sistema" no es un SLI medible de forma útil.
- Traducir el número a consecuencias concretas: cuánto tiempo de inactividad tolera esa
  cifra, qué presupuesto de error resulta, y si el sistema y el equipo actual pueden
  sostenerlo de verdad.
- Convocar al dueño de producto para fijar el número real, por recorrido crítico
  (ej. checkout, login), no un solo SLO global copiado de un estándar ajeno al negocio.

**Criterio de aprobado:** el SLO final está firmado por un dueño de negocio identificado
por nombre, definido por recorrido crítico, y viene acompañado del presupuesto de error
traducido a una unidad que el negocio entiende (minutos/mes, no solo porcentaje).

Una IA genérica tiende a aceptar el número "estándar de la industria" sin cuestionar si
alguien con autoridad de negocio lo acordó o si el sistema puede sostenerlo.
