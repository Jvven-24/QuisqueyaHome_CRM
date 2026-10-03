# Checklist — definición de alcance

> Se aplica antes de entregar el backlog priorizado y el MVP a D21/D03.
> Firma el revisor (D01, cruzado), nunca quien priorizó.

Antes de pasar a construcción, D02 prepara C1 en `.viltrum/commercial.md` y un
aprobador humano confirma versión de propuesta, alcance, exclusiones, fecha y evidencia.

## A. MoSCoW

- [ ] Cada requisito tiene su clasificación (Must/Should/Could/Won't) con la prueba DSDM
      escrita ("¿qué pasa si no se cumple?")
- [ ] Ningún Must lo es "porque lo pidió el cliente" sin pasar la prueba
- [ ] Techo de capacidad verificado: Must no supera ~60% de la capacidad del corte
- [ ] Won't está registrado, no simplemente omitido del documento

## B. MVP

- [ ] El MVP es exactamente el conjunto de Must que pasó la prueba DSDM
- [ ] El MVP genera valor por sí solo, sin depender de la fase 2 para tener sentido
- [ ] Ninguna función "bonita de mostrar" se coló en el MVP sin pasar la prueba
- [ ] Fases siguientes ordenadas por valor/esfuerzo, no por orden de llegada del pedido

## C. Exclusiones

- [ ] Toda función esperable según `expected-capabilities.md` que no entra, está escrita
      como exclusión explícita
- [ ] Cada exclusión tiene razón y fecha o hito de revisión
- [ ] Ninguna exclusión importante quedó como silencio en el documento

## D. Definition of Done de negocio

- [ ] Escrita y distinta de la DoD técnica de `core/evidence-contract.md`
- [ ] Incluye qué debe ser verdad para que el negocio considere esto entregado
- [ ] Incluye aprobación explícita de quién tiene autoridad para aceptar

## E. Cotización

- [ ] Cotización por rango, no cifra cerrada sin condición
- [ ] Supuestos que sostienen el rango, escritos
- [ ] Condición que baja al mínimo y condición que sube al máximo, ambas explícitas
- [ ] Hito que cierra el rango a una cifra final, declarado

## F. Riesgo comercial

- [ ] Dependencias del cliente que pueden atrasar el proyecto, identificadas
- [ ] Consecuencia de un atraso del cliente, declarada
- [ ] Dueño de cada riesgo comercial, asignado

---

## Veredicto

```
APROBADO      — toda la checklist marcada, con la prueba DSDM aplicada a cada ítem
CONDICIONAL   — excepciones con dueño y fecha. Nunca con un Must sin la prueba escrita
RECHAZADO     — vuelve a priorización con hallazgos clasificados
```

Firma el revisor (D01), **nunca** quien priorizó.
