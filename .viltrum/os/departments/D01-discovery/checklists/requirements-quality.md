# Checklist — calidad de requisitos (Gate G1)

> Aplica ISO/IEC/IEEE 29148:2018 (características de un buen requisito) antes de declarar
> el Gate G1 — Requisitos. Firma el revisor (D02), nunca quien los redactó.

## A. Características de cada requisito individual (ISO/IEC/IEEE 29148)

Por cada requisito funcional o no funcional:

- [ ] **Necesario** — su ausencia deja una carencia real, verificable
- [ ] **No ambiguo** — se interpreta de una sola forma por cualquier lector técnico
- [ ] **Completo** — no depende de "TBD" ni de una decisión pendiente para tener sentido
- [ ] **Singular** — declara una sola cosa, no una lista de funciones disfrazada de una
- [ ] **Factible** — es alcanzable dentro de las restricciones conocidas
- [ ] **Verificable** — existe una forma objetiva de comprobar que se cumplió
- [ ] **Correcto** — refleja lo que el interesado realmente necesita, confirmado con él
- [ ] **Conforme** — usa el vocabulario y las unidades del dominio, sin inventar términos

## B. Historias de usuario

- [ ] Formato Given/When/Then completo, sin pasos implícitos
- [ ] Criterio INVEST verificado: Independiente, Negociable, Valiosa, Estimable, Pequeña,
      Testeable
- [ ] Cada historia enlaza al requisito de origen (para la matriz de trazabilidad)
- [ ] Casos límite y de error incluidos, no solo el camino feliz

## C. Roles y permisos

- [ ] Roles definidos como catálogo (tabla), no como prosa suelta
- [ ] Cada permiso asociado a una acción concreta, no a "acceso general"
- [ ] Jerarquía o solapamiento de roles explicitada si existe
- [ ] Rol por defecto de un usuario nuevo, declarado

## D. Reglas de negocio

- [ ] Cada regla tiene su excepción documentada, o declara explícitamente "sin excepción"
- [ ] Casos límite (cero, uno, muchos, simultáneo, vencido) considerados
- [ ] Quién aprueba una excepción a la regla, identificado
- [ ] Qué pasa cuando la regla no se puede cumplir (falla externa, dato faltante) definido

## E. Requisitos no funcionales (ISO/IEC 25010:2023)

Por cada característica de calidad aplicable al proyecto:

- [ ] Adecuación funcional — cubierta por los requisitos funcionales, sin huecos
- [ ] Eficiencia de desempeño — con número (tiempo, capacidad, uso de recursos)
- [ ] Compatibilidad — sistemas con los que debe convivir o interoperar, listados
- [ ] Capacidad de interacción (usabilidad) — con criterio verificable, no "fácil de usar"
- [ ] Fiabilidad — disponibilidad objetivo, tolerancia a fallo, recuperación
- [ ] Seguridad — con número o estándar (cifrado, tiempo de sesión, intentos de acceso)
- [ ] Mantenibilidad — si aplica al contrato (por ejemplo, código entregado al cliente)
- [ ] Portabilidad / flexibilidad — dependencias de entorno declaradas
- [ ] Cada NFR tiene métrica, objetivo y cómo se mide — no es un adjetivo

## F. Exclusiones y métricas de éxito

- [ ] Exclusiones escritas explícitamente (qué NO se hace en este alcance)
- [ ] Métricas de éxito con valor objetivo y cómo se mide
- [ ] Las métricas de éxito se pueden verificar contra el objetivo medible del problema (A2)

## G. Trazabilidad

- [ ] Matriz de trazabilidad iniciada: cada requisito tiene su identificador estable
- [ ] Ningún requisito sin origen (pregunta respondida, entrevista, documento del cliente)
- [ ] Ningún requisito contradictorio con otro sin resolver

---

## Veredicto

```
APROBADO      — toda la checklist marcada, sin ambigüedad ni contradicción pendiente
CONDICIONAL   — excepciones listadas, con dueño y fecha. Nunca con un requisito sin criterio de aceptación
RECHAZADO     — vuelve a D01 con hallazgos clasificados
```

Firma el revisor (D02), **nunca** quien redactó los requisitos.
