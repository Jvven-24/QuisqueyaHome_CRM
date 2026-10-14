# Checklist — contenido, conversión y cumplimiento legal

> Se aplica a todo embudo y a todo formulario que capture datos personales.
> Firma D02, nunca quien redactó o instrumentó.

## A. Contenido y microcopy

- [ ] Cada página responde la pregunta que trajo al usuario sin relleno previo
- [ ] Encabezados describen el contenido real de su sección
- [ ] Botones dicen qué hacen, no "Aceptar" o "Enviar" sin contexto
- [ ] Mensajes de error y confirmación coordinados con el catálogo de D06 — mismo tono
- [ ] Sin texto de relleno ni placeholders en la entrega final
- [ ] Números, fechas y moneda con formato local correcto

## B. CTA y jerarquía

- [ ] Una acción primaria por pantalla o sección, visualmente inequívoca
- [ ] El texto del CTA describe el resultado, no el mecanismo
- [ ] CTA secundarios no compiten visualmente con el primario

## C. Eventos de conversión

- [ ] Cada paso relevante del embudo tiene su evento, no solo la conversión final
- [ ] Nombres de evento estables, documentados en un catálogo único
- [ ] Ningún evento captura más dato personal del necesario para medir
- [ ] Cada evento indica si depende de consentimiento

## D. Consentimiento de cookies

- [ ] Ningún script de analítica o marketing se carga antes del consentimiento
- [ ] El banner distingue categorías (esencial, analítica, marketing)
- [ ] Rechazar es tan fácil como aceptar — sin patrón oscuro
- [ ] La decisión se recuerda y hay panel de preferencias accesible para cambiarla

## E. Ley 172-13 (República Dominicana)

- [ ] Todo formulario con datos personales indica para qué se usan y por cuánto tiempo
- [ ] Datos sensibles (salud, origen racial, afiliación sindical, creencias religiosas, orientación sexual) solo con consentimiento expreso y por escrito, y solo si son necesarios
- [ ] Transferencia internacional de datos (hosting o proveedor extranjero) documentada con su base legal
- [ ] Existe canal para que el titular ejerza acceso y corrección sobre su información (habeas data)
- [ ] Si el sector es financiero o crediticio, contempla la supervisión de la Superintendencia de Bancos

## F. Alcance internacional (si aplica)

- [ ] Se señaló explícitamente si el proyecto tiene usuarios en UE o California como riesgo a evaluar con asesoría legal externa
- [ ] No se declaró conformidad GDPR/CCPA sin esa asesoría

## G. Política de privacidad

- [ ] Describe qué se recolecta, para qué, cuánto se conserva y con quién se comparte
- [ ] Alineada con la retención real documentada por D11, no una plantilla genérica

## H. Landing, narrativa y medición

Aplicar `core/design-experience-os.md` (§5 y flujo DG); esta checklist concreta la evidencia D08 sin sustituir los gates ni las decisiones de D02/D05.

- [ ] La secuencia narrativa de §5 está vinculada a audiencia, preguntas del usuario, promesa dominante y objetivo D02; omisiones o cambios de orden tienen razón documentada
- [ ] Cada afirmación y pieza de prueba social (testimonio, cifra, logo o caso) tiene fuente, propietario y fecha; su uso está autorizado y el texto corresponde a la fuente, sin presentar contenido no verificado como prueba
- [ ] La variante móvil conserva una historia comprensible y el CTA principal; documenta contenido omitido/reordenado con capturas de la versión en los puntos de corte vigentes de D05
- [ ] Cada idioma/variante regional tiene revisión lingüística en pantalla: formatos, expansión de texto y ausencia de truncado que elimine promesa, prueba, condiciones u objeciones
- [ ] Evidencia de comprensión comprueba propuesta y siguiente paso con la misma tarea para baseline y variante; una checklist completa no demuestra por sí sola calidad del copy
- [ ] Versión, eventos, denominador, periodo, muestra y consentimiento de la medición están registrados; si se experimenta, existe la ficha del SOP con hipótesis, métrica primaria, guardrails, asignación, duración/parada y decisión, sin afirmar causalidad con datos insuficientes

---

## Veredicto

```
APROBADO      — contenido, conversión y cumplimiento legal verificados
CONDICIONAL   — excepciones listadas, con dueño y fecha. Nunca con un P0
RECHAZADO     — vuelve a D08 con hallazgos clasificados
```

Firma el revisor (D02), **nunca** quien redactó o instrumentó.
