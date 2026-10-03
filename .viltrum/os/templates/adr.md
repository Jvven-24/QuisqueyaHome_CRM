---
plantilla: adr
id: ADR-nnn
proyecto: <id del proyecto>
departamento_dueno: D03
revisor: human            # registro: D03 → human
aprobador_humano:         # persona que decide. Vacío hasta que decida; nunca lo rellena un agente
fase: F2                  # también se crean en F4–F8 cuando surge una decisión significativa
gate: G2                  # "ADR escrito para cada decisión irreversible"
estado: propuesto         # propuesto · aceptado · rechazado · obsoleto · reemplazado
version: 0.1.0            # 1.0.0 al aceptarse; un ADR aceptado no se edita: se reemplaza
fecha: AAAA-MM-DD
riesgo: R<n>
rfc_origen:               # RFC-nnn
reemplaza:                # ADR-nnn que este deja obsoleto (vacío si ninguno)
reemplazado_por:          # solo se completa cuando otro ADR lo reemplaza
---

# ADR-nnn · <decisión en imperativo: "Usar X para Y">

> Una decisión significativa, una o dos páginas, numerada y guardada con el código. No se
> reescribe: si la decisión cambia, nace otro ADR que la reemplaza y este solo cambia su
> estado y su enlace. Las alternativas con puntuación completa viven en la RFC de origen.

## Estado

El valor vigente está en el frontmatter (`estado`). Historial:

| Fecha | Cambio de estado | Por quién (persona) | Enlace |
|---|---|---|---|
| AAAA-MM-DD | propuesto | | |

## Contexto

Las fuerzas en juego, en tono neutro: restricciones técnicas, de negocio y de equipo.
Cada hecho con su evidencia (`EV-nnn`); lo que no se pudo verificar se declara.

- Requisitos que lo originan: `RF-nnn` / `NFR-nnn` (con su valor numérico)
- Estado actual verificado: <…>
- Lo que obliga a decidir ahora y no después: <…>

## Decisión

Decidimos <… en voz activa, una decisión por ADR>.

Alcance: <qué módulos, contratos o datos quedan cubiertos> · No cubre: <…>

## Alternativas consideradas

| Alternativa | Por qué no |
|---|---|
| | <una razón concreta> |

Puntuación completa: `RFC-nnn §4`. Si no hubo RFC, se explica aquí por qué la decisión no la necesitó.

## Consecuencias

- **Se vuelve más fácil:** <…>
- **Se vuelve más difícil:** <…>
- **Deuda o riesgo que se acepta a conciencia** (quién lo acepta): <…>

> Un ADR con solo consecuencias positivas está incompleto.

## Reversibilidad

```
CLASE:               reversible (cambio local) · costosa (migración planificada) · irreversible
COSTO DE REVERTIR:   <esfuerzo y plazo; evidencia o supuesto declarado>
PUNTO DE NO RETORNO: <hito a partir del cual revertir exige restaurar desde respaldo o rediseñar>
ESTRATEGIA DE SALIDA: <adaptador a reemplazar, formato de exportación de los datos>
DISPARADOR DE REVISIÓN: <condición medible o fecha que obliga a reabrir esta decisión>
```

Decisión irreversible según D03 (marcar si aplica): `[ ]` motor de base de datos · `[ ]` multi-tenencia · `[ ]` formato del identificador público · `[ ]` auditoría · `[ ]` zona horaria y fechas · `[ ]` estrategia de borrado · `[ ]` moneda y decimales · `[ ]` idioma base

## Cumplimiento

| Regla que impone esta decisión | Cómo se verifica (automático) | Dónde corre | Evidencia |
|---|---|---|---|
| | <prueba, regla de lint o chequeo de dependencias; ruta> | CI · local | EV-nnn |

## Relaciones

`RF-nnn` · `NFR-nnn` · `RFC-nnn` · `ADR-nnn` relacionados · `DEC-nnn` en `.viltrum/decisions.md`

## Criterios de hecho

- [ ] Contexto con hechos verificados y evidencia
- [ ] Una decisión, redactada en voz activa
- [ ] Al menos una alternativa descartada con su razón
- [ ] Consecuencias negativas escritas
- [ ] Reversibilidad clasificada; si es irreversible, aprobación humana registrada
- [ ] Forma de verificar que se respeta (§Cumplimiento) o `N/A: razón`
- [ ] Registrado en el índice de ADR del proyecto (lo mantiene D20)
- [ ] Si reemplaza a otro, el anterior pasó a `reemplazado` y enlaza a este

## Firmas

| Rol | Quién | Fecha | Handoff / revisión (`HND-nnn`) |
|---|---|---|---|
| Produce | D03 | | |
| Revisión independiente (registro) | humano distinto del autor | | |
| Decide | `aprobador_humano` (frontmatter) | | enlace a la decisión |

## Evidencia

> Solo artefactos con ruta y fecha: medición reproducible, prototipo con commit, expediente
> D21, `ruta:línea` verificada. Lo no verificable se escribe `no verificado`
> (`core/evidence-contract.md`).
> Ruta relativa a la raíz del proyecto (normalmente `.viltrum/evidence/…`) y `sha256:<64 hex>`
> (`sha256sum <ruta>`) o SHA de commit. Sin ruta y hash, la fila no es evidencia.

| ID | Respalda | Tipo | Ruta o URL | sha256 / commit | Fecha (UTC) | Generada por |
|---|---|---|---|---|---|---|
| EV-001 | | | | | | |
