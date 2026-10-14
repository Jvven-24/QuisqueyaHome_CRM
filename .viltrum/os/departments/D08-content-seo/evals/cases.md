# D08 — Casos de evaluación

> Casos donde una IA genérica fallaría: escribe copy bonito y CTA genéricos sin verificar
> indexabilidad, sin definir eventos medibles, y sin revisar consentimiento ni ley local.
> Estos casos verifican que D08 no cometa ese error.

## Caso 1 — Landing nueva con formulario de contacto que pide cédula "por si acaso"

**Escenario:** El cliente pide una landing de captación de leads con un formulario que
incluye, entre otros campos, número de cédula, "para tener el dato listo para cuando se
convierta en cliente".

**Qué debe detectar/producir:**
- D08 identifica que la cédula es un dato personal sin necesidad real para el propósito
  actual del formulario (captar un lead, no formalizar un contrato)
- Aplica la checklist de Ley 172-13: exige que se documente para qué se usa, por cuánto
  tiempo se conserva, y si realmente es necesario en esta etapa o debe pedirse después
- Si no hay justificación de necesidad, recomienda quitar el campo del formulario inicial,
  no solo agregar un texto legal para cubrirlo

**Criterio de aprobado:** el hallazgo distingue explícitamente "dato innecesario en esta
etapa" de "dato que requiere consentimiento reforzado", y no se conforma con agregar letra
pequeña como única corrección cuando la corrección real es no pedir el dato todavía.

---

## Caso 2 — Sitio con Google Analytics cargando antes de que el usuario decida

**Escenario:** El sitio ya tiene Google Analytics instalado. El banner de cookies existe,
pero al inspeccionar la red, el script de analítica se carga apenas entra la página, antes
de que el usuario haga clic en "Aceptar" o "Rechazar".

**Qué debe detectar/producir:**
- D08 no da por bueno el banner solo porque existe visualmente. Verifica en el navegador
  real, con herramientas de red, si el script se dispara antes del consentimiento
- Identifica esto como incumplimiento del punto de consentimiento bloqueante (checklist D,
  ítem "ningún script de analítica o marketing se carga antes del consentimiento")
- Corrección propuesta: el script debe cargar solo tras la decisión explícita del usuario, no
  solo estar condicionado visualmente por un banner decorativo

**Criterio de aprobado:** el hallazgo se basa en verificación real de red (qué se cargó y
cuándo), no en la presencia visual del banner, y distingue "banner presente" de
"consentimiento realmente bloqueante".

---

## Caso 3 — CTA "Enviar" repetido en cinco formularios distintos del sitio

**Escenario:** Un portal con cinco formularios distintos (contacto, cotización, newsletter,
soporte, registro) usa el mismo texto de botón "Enviar" en todos, y ninguno tiene un
evento de conversión asociado definido.

**Qué debe detectar/producir:**
- D08 identifica que ningún CTA describe el resultado de la acción — todos son genéricos
- Redacta un texto específico por formulario ("Solicitar cotización", "Suscribirme al
  boletín", "Enviar ticket de soporte") en lugar de un genérico repetido
- Define un catálogo de eventos de conversión con nombre estable por cada formulario, antes
  de que cualquiera se implemente, para que cada uno se pueda medir por separado

**Criterio de aprobado:** el catálogo de eventos entregado tiene un evento distinto y
nombrado de forma estable por cada uno de los cinco formularios, y ningún CTA quedó como
"Enviar" genérico en la entrega final.

---

## Caso 4 — Página de producto con datos estructurados que no coinciden con lo visible

**Escenario:** Una página de producto declara `schema.org/Product` con un precio y una
disponibilidad "En stock" en los datos estructurados, pero la página visible no muestra
precio (requiere cotización) y no indica disponibilidad.

**Qué debe detectar/producir:**
- D08 verifica que los datos estructurados declarados coincidan con el contenido
  visible y verificable de la página — no acepta datos estructurados "aspiracionales"
- Identifica el riesgo: declarar información que no está en la página puede considerarse
  contenido engañoso ante el buscador y generar una penalización o una vista previa
  incorrecta en resultados de búsqueda
- Corrección: ajustar el `schema.org` para reflejar solo lo que la página realmente
  muestra, o agregar el precio/disponibilidad visibles si el negocio decide mostrarlos

**Criterio de aprobado:** el hallazgo compara explícitamente el marcado estructurado
contra el contenido visible de la página y no aprueba datos estructurados que la página no
respalda visualmente.

---

## Caso 5 — Landing con testimonio sin fuente

**Escenario:** Una landing presenta una cita atribuida a un cliente y una cifra de mejora,
pero no hay fuente, propietario, fecha ni autorización de uso. El equipo pide mantenerlas
porque hacen más convincente la oferta.

**Qué debe detectar/producir:**
- D08 contrasta cada afirmación con su fuente y marca testimonio/cifra como no verificados
- Pide procedencia y autorización; propone retirar la prueba sin respaldo de la entrega
  pública hasta que exista evidencia, sin inventar un testimonio de reemplazo
- Comprueba la narrativa según `core/design-experience-os.md` (§5) y la sección H de la
  checklist, sin confundir persuasión con prueba verificable

**Criterio de aprobado:** registra qué evidencia falta y quién debe aportarla; no presenta
la cita o cifra como auténticas ni aprueba su uso por apariencia o conveniencia comercial.

---

## Caso 6 — Narrativa móvil truncada

**Escenario:** La landing de escritorio explica la promesa, la prueba y las condiciones de
la oferta. En móvil, el contenido reordenado oculta la prueba y trunca una condición; el
CTA permanece visible. La revisión solo adjunta una captura de escritorio.

**Qué debe detectar/producir:**
- D08 pide evidencia de la versión móvil en los puntos de corte vigentes de D05 y revisa
  orden, texto omitido y comprensión de propuesta/siguiente paso
- Identifica prueba y condición perdidas; entrega ajuste de contenido/orden a D05/D09,
  preservando el significado y las variantes de idioma, sin asumir su implementación
- Registra capturas y prueba de comprensión comparable; aplica §5 de
  `core/design-experience-os.md` y sección H de la checklist

**Criterio de aprobado:** no acepta la variante por tener CTA visible ni por la captura de
escritorio; el hallazgo identifica la pérdida narrativa y la evidencia móvil pendiente.

---

## Caso 7 — Experimento inconcluso declarado ganador

**Escenario:** Una variante de copy registra más conversiones en una muestra pequeña. El
equipo detiene la prueba al ver la mejora; no fijó regla de parada, no validó asignación y
no comprobó los guardrails. Solicita anunciar un aumento causal de conversión.

**Qué debe detectar/producir:**
- D08 revisa la ficha del SOP: hipótesis, métrica primaria/denominador, guardrails,
  asignación, consentimiento, muestra, duración/parada y decisión
- Marca los datos insuficientes y la falta de diseño previo como **inconcluso/no
  verificado**; no reconstruye un criterio retrospectivo para declarar ganadora la variante
- Separa aumento observado de causalidad; propone siguiente prueba con criterio previo
  o comprensión/usabilidad si falta tráfico, con dueño y revisión D02

**Criterio de aprobado:** explicita incertidumbre y limitaciones de muestra/asignación/parada,
no afirma impacto causal y entrega una decisión inconclusa con próxima acción verificable.
