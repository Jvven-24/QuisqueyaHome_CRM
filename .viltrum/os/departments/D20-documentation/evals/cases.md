# D20 — Casos de evaluación

> Casos donde una IA genérica falla porque produce documentación que suena completa
> pero no sobrevive al primer uso real bajo presión.

## Caso 1 — README que describe el proyecto pero no permite instalarlo

**Escenario:** se pide un README para un proyecto Node + PostgreSQL en Docker. La
primera entrega típica describe el propósito del proyecto, la arquitectura y las
tecnologías usadas, en prosa extensa, pero no incluye el comando exacto para levantarlo
localmente ni qué variables de entorno se necesitan.

**Qué debe detectar/producir D20:**
- Reconocer que un README que no permite ejecutar `docker compose up` con éxito en el
  primer intento falla su propósito, sin importar cuán bien escrita esté la prosa.
- Reescribir con la secuencia mínima verificable: clonar, copiar `.env.example`,
  variables requeridas listadas, comando de arranque, cómo confirmar que corrió bien
  (ej. un endpoint de salud), cómo correr las pruebas.
- Separar la explicación del propósito (que puede ir en `docs/explicacion/` según
  Diátaxis) de la guía práctica de instalación, en vez de mezclarlas.

**Criterio de aprobado:** una persona sin contexto previo del proyecto, siguiendo solo
el README, levanta el entorno local sin preguntar nada al equipo.

Una IA genérica tiende a producir un README "bonito" y descriptivo que un lector
entiende, pero que un operador no puede ejecutar paso a paso.

---

## Caso 2 — Manual de administración que asume que quien lo lee ya sabe

**Escenario:** se pide documentar el procedimiento de restauración de base de datos
para el manual de administración. El borrador dice: "Restaurar el último respaldo desde
el bucket y ejecutar la migración correspondiente."

**Qué debe detectar/producir D20:**
- Señalar que esa instrucción da por sentado tres cosas que un junior bajo presión no
  sabe: cuál es "el bucket" (nombre exacto, credencial para acceder), qué comando
  ejecuta la restauración, y qué significa "la migración correspondiente" en ese
  contexto.
- Reescribir el procedimiento con cada paso literal: comando exacto, dónde obtener la
  credencial, qué verificar antes de ejecutar (ej. que el ambiente destino no es
  producción por error), y qué verificar después (integridad de los datos restaurados).
- Aplicar la prueba del criterio junior antes de aprobar: ¿alguien sin el contexto del
  proyecto podría seguir esto solo, a las 2 a.m., con el sistema caído?

**Criterio de aprobado:** el procedimiento final no contiene ninguna palabra como
"correspondiente", "el de siempre" o "ya sabes cuál" — cada referencia es explícita y
verificable.

Una IA genérica suele producir instrucciones de alto nivel que suenan correctas para
alguien que ya conoce el sistema, pero que fallan exactamente en el momento en que más
se necesitan: cuando quien restaura no es quien lo diseñó.

---

## Caso 3 — Handoff al cliente entregado como una llamada, sin documento de respaldo

**Escenario:** el proyecto llega a la fase de cierre y el plan es "hacemos una llamada
de una hora con el cliente para explicarle cómo administrar el sitio" como única forma
de capacitación, sin ningún documento entregado antes o después.

**Qué debe detectar/producir D20:**
- Señalar que una capacitación sin documento de respaldo no sobrevive: el cliente
  olvida el 80% de lo explicado en una llamada de una hora, y sin documento no tiene
  cómo recuperarlo sin volver a preguntarle a Viltrum.
- Producir el manual de usuario y de administración *antes* de la llamada, para que la
  llamada explique el documento en vez de reemplazarlo.
- Verificar accesos entregados por escrito (no solo mencionados verbalmente en la
  llamada) y confirmación de recepción del cliente, como parte del checklist de cierre.

**Criterio de aprobado:** el paquete de handoff incluye documento escrito entregado
antes de la sesión, accesos formalizados por escrito con confirmación de recepción, y
la sesión queda registrada con fecha y asistentes — la llamada complementa, no sustituye
al documento.

Una IA genérica tiende a aceptar "hagamos una llamada" como capacitación suficiente,
sin exigir el artefacto escrito que hace que el conocimiento sobreviva a la llamada.
