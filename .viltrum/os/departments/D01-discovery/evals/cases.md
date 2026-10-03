# Casos de evaluación — D01 Descubrimiento y requisitos

> Casos donde una IA genérica produciría un PRD plausible pero incompleto. El criterio de
> aprobado exige que el hallazgo aparezca **sin que el cliente lo mencione primero**.

---

## Caso 1 — "Necesito un sistema de facturación para mi negocio"

**Escenario de entrada**
Cliente dominicano con negocio de distribución, pide "un sistema de facturación" sin más
detalle.

**Qué debe detectar D01**
- Que "facturación" en República Dominicana implica e-CF (Ley 32-23) y no una factura en
  PDF cualquiera.
- La clasificación del contribuyente (Grande/Mediano/Pequeño) porque define el plazo legal.
- Si ya tiene certificado digital vigente y autorización de la DGII.
- Retención de comprobantes por 10 años.
- Qué pasa si el servicio de la DGII está caído (contingencia).
- El presupuesto de campos y la máscara de RNC/cédula en cualquier formulario relacionado.

**Criterio de aprobado**
Las preguntas de la sección "Facturación electrónica" de `question-bank.md` aparecen en
`.viltrum/questions.md` sin que el cliente las haya pedido, todas con `bloquea:` correcto,
y `expected-capabilities.md` — sección e-CF — está incorporada al PRD como línea base. Una
IA genérica typically solo pregunta "¿qué debe incluir la factura?" y se detiene ahí.

---

## Caso 2 — "Una app para reservar citas"

**Escenario de entrada**
Cliente de una clínica pequeña pide una app de reservas, sin mencionar reglas de negocio.

**Qué debe detectar D01**
- Qué pasa cuando dos personas intentan reservar el mismo horario a la vez (concurrencia).
- Política de cancelación y de "no-show", y si hay penalidad.
- Zona horaria si hay pacientes o sedes en más de una ciudad.
- Si un mismo profesional atiende en más de una sede y cómo se evita el doble agendamiento.
- Retención del historial de citas y datos de salud asociados (dato sensible).
- Qué pasa si el paciente llega tarde — hay tolerancia, se reasigna el turno.

**Criterio de aprobado**
El PRD incluye reglas de negocio para solapamiento, cancelación y no-show con sus
excepciones documentadas, y una pregunta explícita sobre tratamiento de datos de salud
(`a:cliente`, `bloquea:G0`) por ser dato personal sensible. Una IA genérica típicamente
modela solo "crear cita" y "cancelar cita" sin las reglas de concurrencia ni retención.

---

## Caso 3 — "Un CRM para mi equipo de ventas"

**Escenario de entrada**
Cliente con 12 vendedores, usa actualmente una hoja de Excel compartida, pide "un CRM
como Salesforce pero más simple".

**Qué debe detectar D01**
- Volumen real de contactos y oportunidades a migrar, con número — no "bastantes".
- Formato exacto del Excel actual y qué campos son obligatorios aunque estén vacíos hoy.
- Si cada vendedor ve solo su cartera o puede ver la de otros (permiso granular, no binario).
- Qué pasa con un lead que nadie atiende en X días (regla de negocio, no solo función).
- La línea base de `expected-capabilities.md` para CRM: auditoría por registro, papelera,
  búsqueda global, exportación — ninguna mencionada por el cliente pero esperada.
- Quién aprueba el borrado definitivo de un contacto.

**Criterio de aprobado**
`client-inputs.md` incluye el CI de "acceso a la hoja de Excel actual" como insumo
bloqueante de G1. El PRD incorpora auditoría, papelera y búsqueda global como línea base
sin que el cliente las pidiera, y existe al menos una pregunta sobre reasignación de leads
sin atender. Una IA genérica típicamente modela solo "contactos, oportunidades, tareas" sin
tocar migración, permisos granulares ni la regla de leads desatendidos.

---

## Caso 4 — Dos reuniones se contradicen

**Entrada:** una transcripción dice que no habrá pagos; otra posterior propone pagos
sin confirmar si sustituye la decisión inicial.

**Aprobado si:** D01 conserva ambas fuentes, marca la segunda como propuesta no aprobada,
abre `Q-nnn` que bloquea G1 y advierte a D02/D00 del posible cambio de riesgo. Suspendido
si trata la segunda frase como aceptación o borra la decisión previa.
