# Matriz de trazabilidad — <proyecto>

> Resumen ejecutivo: cada requisito nace de una fuente verificable, se refleja en un
> diseño y se cierra con una prueba. Al terminar F1, las columnas de diseño y prueba están
> vacías a propósito — las llenan F3 (D03/D11) y F5 (D14). Un requisito sin origen o sin
> prueba al cierre del proyecto es un hallazgo, no un detalle administrativo.

| ID requisito | Origen (pregunta / entrevista / documento) | Historia de usuario | Diseño (pantalla / endpoint / tabla) | Prueba (caso / archivo) | Estado |
|---|---|---|---|---|---|
| RF-001 | | | | | |

## Estados válidos

`sin diseño` · `en diseño` · `diseñado` · `en construcción` · `construido` · `en prueba` ·
`verificado` · `no aplica` (con razón)

## Regla de cierre

- Ningún requisito Must llega al Gate G5 en estado distinto de `verificado`.
- Un requisito marcado `no aplica` lleva su razón en una nota al pie de la fila, o no
  cuenta como resuelto.
- Esta matriz la abre D01, la completa D03/D05/D09/D10/D11 en construcción, y la cierra
  D14 en verificación. Cada quien edita solo sus columnas.
