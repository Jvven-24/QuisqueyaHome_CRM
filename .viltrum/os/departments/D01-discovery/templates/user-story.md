# Historia de usuario — <ID>

**Requisito de origen:** RF-<nnn> · **Módulo:** · **MoSCoW (borrador):**

---

## Historia

**Como** <rol>
**Quiero** <acción o capacidad>
**Para** <valor que obtiene>

---

## Criterios de aceptación (Given / When / Then)

### Camino feliz

```
Dado <contexto inicial>
Cuando <acción del usuario>
Entonces <resultado esperado, verificable>
```

### Casos límite y de error

```
Dado <contexto de borde — vacío, máximo, simultáneo>
Cuando <acción>
Entonces <resultado esperado, verificable>
```

```
Dado <contexto de fallo — sin conexión, permiso insuficiente, dato inválido>
Cuando <acción>
Entonces <resultado esperado, verificable>
```

> Cubrir al menos un caso de cada uno de los seis estados obligatorios
> (`core/doctrine/ux-states.md`) que apliquen a esta historia: carga, vacío, error, sin
> conexión, éxito, permiso insuficiente.

---

## Verificación INVEST

- [ ] **Independiente** — no depende de que otra historia se termine primero para tener sentido
- [ ] **Negociable** — describe el qué y el valor, no impone el cómo
- [ ] **Valiosa** — el rol que la pidió puede explicar qué gana con ella
- [ ] **Estimable** — el equipo técnico puede dar un tamaño, aunque sea aproximado
- [ ] **Pequeña** — cabe en un corte de trabajo, no es una épica disfrazada
- [ ] **Testeable** — cada criterio de aceptación se puede verificar objetivamente

Una historia que falla alguna letra se reescribe o se divide antes de entrar al backlog.

---

## Notas para diseño y construcción

<Lo que D04/D05/D09/D10 necesitan saber que no cabe en el Given/When/Then — por ejemplo,
un catálogo asociado, una máscara de campo, un permiso especial.>
