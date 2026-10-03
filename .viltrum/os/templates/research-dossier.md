# Expediente de investigación — <capacidad>

**Departamento:** D21 · **Fecha:** AAAA-MM-DD · **Autor:** · **Revisor:** D03
**Proyecto:** · **Riesgo:** R<n> · **Caja de tiempo:** <horas>

---

## 1. Capacidad requerida

**Qué debe poder hacer el sistema**
<En lenguaje de negocio. Sin nombres de producto.>

**Qué NO incluye**
<Límites explícitos.>

**Restricciones**
| Restricción | Valor |
|---|---|
| Stack actual | |
| Dónde se despliega | |
| Licencia aceptable | |
| Presupuesto | |
| Plazo | |
| Volumen esperado | |

---

## 2. Búsqueda

| Frente | Buscado | Encontrado |
|---|---|---|
| Ya lo tenemos (Viltrum) | | |
| Nativo del stack | | |
| Open source | | |
| SaaS / API | | |

---

## 3. Descartes rápidos

| Candidato | Enlace | Motivo del descarte |
|---|---|---|

---

## 4. Candidatos evaluados

> Mínimo tres. Si hay menos, escribir aquí por qué.

### Candidato A — <nombre>
- Enlace:
- Licencia:
- Último commit / versión:
- Qué hace:
- Qué no cubre:
- Cómo se integra:
- Cómo se sale (exportación):

### Candidato B — <nombre>
<igual>

### Candidato C — <nombre>
<igual>

---

## 5. Puntuación

| Criterio | Peso | A | B | C |
|---|---:|---:|---:|---:|
| Cobertura funcional | 20 | | | |
| Licencia | 15 | | | |
| Mantenimiento | 15 | | | |
| Seguridad | 15 | | | |
| Integración | 10 | | | |
| Exportación y salida | 10 | | | |
| Costo a 3 años | 10 | | | |
| Experiencia de uso | 5 | | | |
| **TOTAL** | **100** | | | |

---

## 6. Decisión

**Elegido:**
**Puntaje:** → **Decisión:** integrar / configurar / prueba técnica / híbrido / construir

**Estrategia de adopción:** E1 módulo completo · E2 portar por partes · E3 adaptar ejemplo ·
E4 construir estudiando la referencia · E5 construir desde cero
(ver `departments/D21-research/AGENTS.md` paso 5b)

**Si E2 — inventario de piezas**
| Pieza del proyecto de referencia | ¿Se toma? | Razón | Procedencia (repo@commit, licencia) |
|---|---|---|---|

**Por qué es mejor que las alternativas**
<Una razón por cada descartado. No "es el más popular".>

**Si el puntaje cayó en 65–79 — prueba técnica**
| | |
|---|---|
| Qué se prueba | |
| Criterio de éxito | |
| Tiempo máximo | |
| Quién decide al terminar | |

---

## 7. Costo a 3 años

| Concepto | Año 1 | Año 2 | Año 3 |
|---|---:|---:|---:|
| Licencia / suscripción | | | |
| Operación e infraestructura | | | |
| Mantenimiento y actualización | | | |
| **Total** | | | |

---

## 8. Plan de salida

**Si esto falla o deja de servir, cómo salimos**
- Formato de exportación de los datos:
- Alternativa más cercana:
- Esfuerzo estimado de migración:
- Qué quedaría acoplado:

---

## 9. Riesgos asumidos

| Riesgo | Probabilidad | Impacto | Mitigación | Aceptado por |
|---|---|---|---|---|

---

## 10. Handoff

**A D03 (arquitectura):** contrato y adaptador propuestos
**A D12 (seguridad):** <solo si hay implicación de licencia o seguridad>

**Advertencias para quien implemente:**
