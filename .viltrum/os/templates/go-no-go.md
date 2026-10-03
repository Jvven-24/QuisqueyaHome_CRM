---
plantilla: go-no-go
id: GNG-nnn
proyecto: <id del proyecto>
release: v<X.Y.Z>
artefacto:                # tag · commit SHA completo · digest de la imagen o artefacto que se promueve
departamento_dueno: D16
coautores: [D02]          # criterios de negocio (§4): los redacta D02 y los revisa D01
revisor: D12              # registro: D16 → D12 (aprobación técnica). La aprobación humana de producción es un registro distinto
aprobador_humano:         # OBLIGATORIO. Persona que registra la aprobación final de producción (A4). Vacío en la plantilla y en todo borrador; sin nombre este documento no puede pasar a estado: aprobado. Nunca lo rellena un agente
fase: F6
gate: G6                  # G6 siempre exige revisor humano
estado: borrador          # borrador · en_revision · aprobado · rechazado · superado
version: 0.1.0            # del documento; 1.0.0 = primera versión aprobada
fecha: AAAA-MM-DD
riesgo: R<n>
---

# GNG-nnn · Go / No-Go — <producto> v<X.Y.Z>

> Registro de la decisión de lanzamiento con criterios técnicos y de negocio, aprobadores
> humanos nombrados, plan de reversión y preparación de soporte. Lo preparan D16 y D02; lo
> aprueban personas. Un agente no marca la decisión, no escribe nombres de aprobadores y
> no registra aprobaciones en nombre de nadie.
> La aprobación vale para **este artefacto, este esquema y esta ventana**. Si cambia el
> digest, la migración o la configuración, se revalidan los criterios afectados y se
> renueva la aprobación.

## 0. Datos del release

| Campo | Valor |
|---|---|
| Versión · tag | |
| Commit (SHA completo) | |
| Digest del artefacto | |
| Ambiente destino | |
| Ventana (fecha · hora · zona) | |
| Tráfico crítico en la ventana | |
| Cambios de esquema (fase `expand` · `migrate` · `verify` · `contract`) | |
| Manifiesto del release (ruta · sha256) | |
| Runbook de release · runbook de reversión (rutas) | |
| `PRD-nnn` y métricas del release (`MET-nnn`) | |

## 1. Decisión (la registra una persona)

- [ ] GO · [ ] NO-GO · [ ] GO condicional (con las excepciones de §8)

Fecha y hora (zona): ____________ · Registrada por: ____________ (nombre)

## 2. Aprobadores humanos

| Rol | Nombre | Qué aprueba | Decisión (GO · NO-GO) | Fecha y hora (zona) | Enlace a la aprobación |
|---|---|---|---|---|---|
| Dueño de producto o negocio | | Go de negocio (§4) y `C1` vigente | | | |
| Responsable de operaciones o SRE | | Preparación operativa (§3, §5, §7) y despliegue a producción (A4) | | | |
| Responsable de seguridad o del riesgo | | Aceptación del riesgo residual de seguridad (R2 o superior) | | | |
| Responsable de soporte | | Preparación de soporte (§6) | | | |
| Asesor legal o de privacidad | | Solo si hay pendientes legales abiertos | | | |

**Registro de la aprobación de producción (A4)**

| Aprobador | Fecha y hora (zona) | Ambiente | Commit y digest | Alcance y cambios de esquema | Ventana | Acciones autorizadas (lista cerrada) | Enlace |
|---|---|---|---|---|---|---|---|
| | | | | | | | |

> Quien prepara (D16, D02) no aprueba. La aprobación técnica de D12 y la aprobación
> humana de producción son registros distintos: una no sustituye a la otra.

## 3. Criterios técnicos

> Cada fila se responde `sí`, `no` o `N/A: razón` con evidencia. Una fila sin evidencia cuenta como `no`.

| ID | Criterio | Cumple | Evidencia | Responsable |
|---|---|---|---|---|
| CT-001 | G5 aprobado con evidencia vigente; cero P0 abiertos; cada P1 con plan, dueño, fecha y aceptación independiente | | EV-nnn | D14 |
| CT-002 | El artefacto que se promueve es el mismo (digest) que pasó las pruebas en staging | | | D16 |
| CT-003 | Migración ensayada sobre copia autorizada y representativa, con tiempos; código anterior compatible durante la transición | | | D11 · D16 |
| CT-004 | Restauración real ejecutada, con fecha, integridad verificada y RPO/RTO medidos frente al objetivo | | | D16 |
| CT-005 | Reversión ensayada con tiempo medido; punto de no retorno declarado | | | D16 |
| CT-006 | Observabilidad y alertas activas antes de recibir tráfico; runbook probado | | | D17 |
| CT-007 | Secretos por ambiente, dominio, DNS y TLS verificados con herramienta externa | | | D16 · D12 |
| CT-008 | Pipeline endurecido (acciones fijadas por SHA, permisos mínimos, sin secretos en logs) | | | D16 |
| CT-009 | Escaneos de secretos, dependencias y código sin críticos ni altos sin mitigación (y dinámico si R2 o superior) | | | D12 |
| CT-010 | Presupuesto de error por debajo del umbral de freno de releases de la política de D17; si se superó, solo procede un hotfix o una corrección de fiabilidad aprobada por quien decide el freno | | | D17 |
| CT-011 | Documentación mínima y notas de versión (`release-notes.md`) entregadas | | | D20 |

## 4. Criterios de negocio

| ID | Criterio | Cumple | Evidencia | Responsable (persona) |
|---|---|---|---|---|
| CN-001 | `C1` vigente en `.viltrum/commercial.md` y el alcance del release está dentro de lo aceptado | | | |
| CN-002 | Definition of Done de negocio de D02 cumplida | | | |
| CN-003 | Aceptación del incremento por el dueño de producto contra los criterios de aceptación (UAT) | | | |
| CN-004 | Métricas de éxito del `PRD-nnn` medibles desde el primer día: eventos validados y tablero listo | | | |
| CN-005 | Pendientes legales o de privacidad cerrados o aceptados por una persona con autoridad | | | |
| CN-006 | Comunicación a clientes aprobada por una persona (§9) | | | |
| CN-007 | Capacitación del cliente o del equipo realizada, o pendiente explícito con fecha | | | |

## 5. Plan de reversión

| Campo | Valor |
|---|---|
| Criterio de disparo (medible: salud en rojo > ___ min · tasa de error sobre el presupuesto · corrupción de datos · P0 confirmado) | |
| Decide revertir (persona nombrada y suplente) | |
| Tiempo ensayado (min) y fecha del ensayo | |
| Punto de no retorno | |
| Pérdida de datos posible y conciliación (RPO) | |
| Runbook de reversión (ruta) | |
| Evidencia del ensayo | EV-nnn |

Un "down migration" que borra datos no es una reversión segura: se exige restauración o corrección hacia adelante diseñada por D11 y autorizada.

## 6. Preparación de soporte

| Elemento | Estado | Responsable (persona) | Evidencia |
|---|---|---|---|
| Base de conocimiento y respuestas tipo publicadas | | | |
| Capacitación de soporte (fecha · asistentes) | | | |
| Problemas conocidos (`KI-nnn` de `release-notes.md`) con alternativa | | | |
| Matriz de escalamiento con nombres | | | |
| Canal de incidentes y quién habla con clientes | | | |
| Guardia nombrada durante la ventana y las 48 h posteriores | | | |
| Página de estado lista | | | |

## 7. Publicación y verificación posterior

- **Estrategia** (rolling · blue-green · progresiva): <…> · Si exige indisponibilidad: ventana y aprobación de negocio explícita: <…>
- **Verificación a los 30 minutos:** salud · tasa de error · latencia · métrica de negocio clave → <quién observa>
- **Observación 48 h** (D17): <ventana · quién · criterio de aborto>

## 8. Excepciones (solo si la decisión es GO condicional)

> Nunca con un P0 abierto. Cada excepción tiene dueño, fecha límite y aceptación por escrito.

| ID | Criterio no cumplido | Riesgo | Mitigación | Dueño (persona) | Fecha límite | Aceptado por (persona) | Enlace |
|---|---|---|---|---|---|---|---|
| EXC-001 | | | | | | | |

## 9. Comunicación

| Audiencia | Canal | Borrador (D20) | Aprueba (persona) | Envía (persona) | Fecha y hora |
|---|---|---|---|---|---|
| Interna | | | | | |
| Clientes | | `release-notes.md` | | | |

Un agente redacta el borrador; aprobar y enviar un mensaje externo es de una persona.

## 10. Criterios de hecho (G6)

- [ ] Todos los criterios técnicos y de negocio respondidos con evidencia, o `N/A: razón` revisada
- [ ] Reversión ensayada, con disparo, decisor y punto de no retorno
- [ ] Preparación de soporte completa
- [ ] Aprobadores humanos nombrados en §2, cada uno con fecha y enlace a su aprobación
- [ ] Registro A4 con ambiente, digest, alcance, ventana y acciones autorizadas
- [ ] Excepciones (si hay) con dueño, fecha y aceptación
- [ ] Cero P0 abiertos
- [ ] Campo `aprobador_humano` completado por la persona; si está vacío, el documento sigue en borrador

## 11. Firmas

| Secciones | Redacta | Revisa (independiente) | Fecha | Handoff / revisión (`HND-nnn`) |
|---|---|---|---|---|
| §0, §3, §5–§7, §9 | D16 | D12 | | |
| §4 | D02 | D01 | | |
| Decisión y aprobación de producción | — | `aprobador_humano` (frontmatter) y los aprobadores de §2 | | enlace |

Declara la puerta G6 quien no produjo el trabajo; G6 exige además revisor humano.

## Evidencia

> Solo artefactos generados por herramienta o aportados por una persona con fecha:
> ejecución de CI con digest, acta de restauración con tiempos, ensayo de reversión,
> aceptación escrita con fecha y alcance. "El cliente aprobó" sin registro escrito no cuenta
> (`core/evidence-contract.md`). Lo no verificado se escribe `no verificado`.
> Ruta relativa a la raíz del proyecto (normalmente `.viltrum/evidence/…`) y `sha256:<64 hex>`
> (`sha256sum <ruta>`) o SHA de commit o digest. Sin ruta y hash, la fila no es evidencia.

| ID | Respalda | Tipo | Ruta o URL | sha256 / commit | Fecha (UTC) | Generada por |
|---|---|---|---|---|---|---|
| EV-001 | | | | | | |
