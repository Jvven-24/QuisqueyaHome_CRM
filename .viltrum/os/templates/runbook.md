---
plantilla: runbook
id: RB-nnn
proyecto: <id del proyecto>
servicio: <servicio o recorrido crítico que cubre>
alerta: ALR-nnn           # alerta que lo dispara; toda alerta enlaza su runbook
departamento_dueno: D17
coautores: [D16]          # solo §7 (reversión): D16 enlaza su runbook de reversión, no lo duplica
revisor: D16              # registro: D17 → D16. Lo que redacta D16 (§7) lo revisa D12
aprobador_humano:         # responsable de operaciones o dueño del servicio que aprueba este runbook y su lista de acciones con aprobación. Vacío hasta que la persona apruebe; nunca lo rellena un agente
fase: F7
gate: G7                  # "runbook disponible para el equipo de soporte"; se prueba en staging durante F6
estado: borrador          # borrador · en_revision · aprobado · rechazado · superado
version: 0.1.0            # del documento; 1.0.0 = primera versión aprobada
fecha: AAAA-MM-DD
riesgo: R<n>
---

# RB-nnn · Runbook — <síntoma o alerta, en una frase>

> Procedimiento literal para quien no tiene contexto previo del proyecto. Cada paso dice
> qué hacer, qué debería verse y qué hacer si no se ve. Las credenciales se citan por
> referencia al gestor de secretos, nunca por valor. Los pasos de **solo lectura** (`L`) pueden
> ejecutarse sin aprobación dentro del acceso autorizado; todo lo que cambia estado va a §5
> y exige aprobación humana registrada, sin excepción por urgencia.

## 0. Ficha

| Campo | Valor |
|---|---|
| Servicio o recorrido crítico (`JRN-nnn`) | |
| SLO afectado (`slo-definition`) | |
| Alerta que lo dispara (`ALR-nnn`) y canal | |
| Severidad inicial (SEV1–SEV4) | |
| Dueño del servicio (persona) | |
| Guardia y escalamiento | ver §6 |
| Versión del servicio o release al que aplica | |
| Última verificación (fecha · quién · versión) | ver §10 |

## 1. Cuándo se usa

- **Disparador:** <condición de la alerta y ventana>
- **Qué NO cubre** (y a qué runbook va): <…>

## 2. Síntomas y confirmación (solo lectura)

| ID | Síntoma (lo que ve el usuario o el monitor) | Cómo confirmarlo (consulta o panel literal) | Valor que lo confirma | Si no se confirma |
|---|---|---|---|---|
| SYM-001 | | | | falsa alarma: registrar y ajustar la alerta |

## 3. Impacto y severidad

| SEV | Criterio | Respuesta |
|---|---|---|
| SEV1 | Caída total o pérdida de datos en curso | Inmediata, todo el equipo relevante; incident commander **humano** |
| SEV2 | Recorrido crítico degradado o parcialmente caído | Según horario acordado, escalamiento activo; incident commander **humano** |
| SEV3 | Degradación menor con alternativa disponible | Ciclo normal |
| SEV4 | Cosmético o sin impacto a usuarios | Backlog |

La severidad se asigna en los primeros minutos y cada cambio se registra con hora. SEV1 y SEV2 exigen `postmortem.md`.

## 4. Diagnóstico (solo lectura)

> `L` = no cambia ningún estado: consulta, listado, lectura de logs o métricas. Si un paso
> cambia algo, no es `L`: pasa a §5.

| Paso | Qué buscar | Consulta o comando literal (sin secretos) | Resultado esperado si es esta causa | Si coincide, ir a | Si no, ir a | Clase |
|---|---|---|---|---|---|---|
| 1 | | | | | 2 | L |

Permisos y referencias necesarias: <rol, panel, ruta del secreto en el gestor — nunca el valor>

## 5. Acciones que requieren aprobación humana

> Lista mínima que siempre exige aprobación humana registrada antes de ejecutarse
> (el proyecto puede ampliarla, no reducirla): despliegue o reversión en producción ·
> migración · DROP, DELETE o UPDATE masivo · cambio de permisos o roles · rotación o
> revocación de secretos · reinicio o escalado que afecte a usuarios · cambio de DNS o TLS ·
> comunicación externa a clientes · cualquier acción sobre datos reales de personas.
> Un agente puede preparar la acción y dejarla lista; no la ejecuta sin la aprobación.

| ID | Acción (literal) | Efecto | Reversible (sí · no — cómo) | Aprueba (rol y persona) | Registro de la aprobación (quién · cuándo · sobre qué recurso o versión) | Verificación posterior | Escalar si no se logra en |
|---|---|---|---|---|---|---|---|
| ACC-001 | | | | | | | min |

## 6. Escalamiento y comunicación

| Condición | Escala a (rol y persona) | Canal | Plazo máximo |
|---|---|---|---|
| | | | |

- **Canal único del incidente** y línea de tiempo en vivo: <…>
- **Comunicación a clientes:** un agente redacta el borrador; la aprobación y el envío son de una persona autorizada. Página de estado: <quién la actualiza>.
- **Sospecha de intrusión o filtración:** se remite a D12 y se preserva la evidencia; no se mutan los sistemas afectados sin aprobación.

## 7. Reversión (D16)

> No se duplica: se enlaza el runbook de reversión del release vigente
> (`departments/D16-devops/templates/runbook-rollback.md`, instanciado por release).

| Release | Runbook de reversión (ruta) | Criterio de disparo | Punto de no retorno | Tiempo ensayado (min) | Decide revertir (persona) |
|---|---|---|---|---|---|
| | | | | | |

## 8. Verificación de recuperación

- [ ] El SLI del recorrido volvió al objetivo durante la ventana acordada: `<consulta · valor · ventana>`
- [ ] La transacción sintética de negocio pasa
- [ ] La alerta no se volvió a disparar durante la ventana de observación
- [ ] Una gráfica que volvió a verde no basta: se cierra cuando el síntoma desapareció y se verificó

## 9. Cierre y aprendizaje

- [ ] SEV1 o SEV2: `postmortem.md` abierto dentro de las 48 h del cierre
- [ ] Este runbook corregido si faltó un paso o un dato
- [ ] Lección escrita en `MEMORY.md` del departamento responsable, o convertida en prueba, alerta o SOP

## 10. Ensayo por una persona sin contexto (criterio junior)

| Fecha | Quién (persona sin contexto previo del servicio) | Entorno (staging · sandbox) | Pasos donde se bloqueó | Corregido en la versión |
|---|---|---|---|---|
| | | | | |

Un runbook sin ensayo es una hipótesis: no pasa a `aprobado`.

## 11. Criterios de hecho (G7)

- [ ] Alerta enlazada, con síntoma de usuario, severidad, dueño y canal; el aviso diferible está separado del que despierta a alguien
- [ ] Cada paso de diagnóstico es de solo lectura y literal; ninguno contiene secretos
- [ ] Toda acción que cambia estado está en §5 con aprobador nombrado
- [ ] Reversión enlazada al runbook de D16 vigente, con tiempo ensayado
- [ ] Escalamiento con nombres, canal y plazos
- [ ] Verificación de recuperación por SLI y ventana, no por intuición
- [ ] Ensayado por una persona sin contexto, con bloqueos corregidos
- [ ] Probada la cadena condición → alerta → ruta → recepción → actuación en staging o sandbox; lo no probado, marcado como evidencia parcial

## 12. Firmas

| Secciones | Redacta | Revisa (independiente) | Fecha | Handoff / revisión (`HND-nnn`) |
|---|---|---|---|---|
| §0–§6, §8–§11 | D17 | D16 | | |
| §7 | D16 | D12 | | |
| Aprobación del runbook | — | `aprobador_humano` (frontmatter) | | enlace a la aprobación |

Declara la puerta G7 quien no produjo el trabajo.

## Evidencia

> Solo artefactos generados por herramienta o por una persona con fecha: salida de la
> consulta de diagnóstico (redactada), prueba de la alerta con recepción, acta del ensayo.
> "Funciona" sin ejecución no cuenta (`core/evidence-contract.md`). Una regla en YAML no
> acredita que alguien recibió la alerta. Lo no probado se escribe `no verificado`.
> Ruta relativa a la raíz del proyecto (normalmente `.viltrum/evidence/…`) y `sha256:<64 hex>`
> (`sha256sum <ruta>`) o SHA de commit. Sin ruta y hash, la fila no es evidencia.

| ID | Respalda | Tipo | Ruta o URL | sha256 / commit | Fecha (UTC) | Generada por |
|---|---|---|---|---|---|---|
| EV-001 | | | | | | |
