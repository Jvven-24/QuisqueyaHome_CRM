---
id: M-nnn
fecha: AAAA-MM-DD
proyecto: <id del proyecto>
estado: borrador      # borrador · esperando_confirmacion · en_ejecucion · cerrado
riesgo: R<n>
---

# M-nnn · <título en una línea, en términos de resultado>

## Petición original
> <texto exacto del humano>

## Intención
<Una frase: el resultado que se busca, no la acción.>

## Hechos verificados
- <hecho> · evidencia: `ruta/archivo.ext:línea`
- <hecho> · evidencia: <comando o búsqueda que lo muestra>

## Supuestos
- <supuesto> — se asume porque <razón>. Si es falso: <qué cambia>.

## Preguntas bloqueantes
- [ ] Q-nnn <pregunta> · a:<cliente|equipo> · bloquea:<paso del plan>

<Si no hay: "Ninguna.">

## Clasificación
```
INTENCIÓN: <de core/routing.md>
TIPO:      <tipo de solución>
RIESGO:    R<n> — <razón en una línea>
FASE:      F<n>
DEPARTAMENTOS: Dxx → Dyy → Dzz
```

## Alcance
**Incluye**
- 

**No incluye**
- 

## Enfoque
**Elegido:** <qué se hará y por qué>

**Descartado:**
| Alternativa | Por qué no |
|---|---|

**¿Ya existe?** <resultado del chequeo P0: dónde se buscó y qué se encontró>

## Plan
| # | Paso | Departamento | Modelo | Salida |
|---|---|---|---|---|
| 1 | | | | |

## Criterios de aceptación
- [ ] <verificable, uno por línea>

## Verificación
- <prueba, build, captura o medición que demostrará cada criterio>

## Riesgos y reversión
| Riesgo | Mitigación | Cómo se revierte |
|---|---|---|

## Cierre
<Se completa al terminar: criterio por criterio, qué se cumplió, qué no y por qué.>
