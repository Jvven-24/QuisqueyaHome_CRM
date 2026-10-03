---
description: Cambia al perfil/departamento indicado y carga su doctrina, método y checklists
argument-hint: "[Dxx | slug | descripción de lo que vas a hacer]"
---

# Switch de perfil

El usuario pidió trabajar bajo un departamento específico: **$ARGUMENTS**

## Qué hacer

### 1. Resolver el departamento

Lee `registry/departments.yaml` y resuelve `$ARGUMENTS` contra:
- El `id` (D05)
- El `slug` (ui-design-system)
- El `name` o una descripción libre → empareja por `mission` y `activates_on`

Si el argumento está vacío, lista los departamentos disponibles agrupados por familia y
pregunta cuál.

Si la descripción encaja con varios, **no elijas por ti**: muestra los candidatos con su
misión en una línea y pregunta.

### 2. Cargar el paquete de contexto

En este orden y nada más (principio P5, `core/doctrine/context-budget.md`):

1. `CLAUDE.md` raíz — ya está cargado, no lo releas
2. `departments/<Dxx-slug>/SOUL.md` — quién es
3. `departments/<Dxx-slug>/AGENTS.md` — cómo trabaja
4. `departments/<Dxx-slug>/manifest.yaml` — qué puede y qué no
5. `departments/<Dxx-slug>/MEMORY.md` — qué ya aprendió (si existe)

**No** cargues las checklists todavía: se cargan cuando la situación lo pida.
**No** cargues otros departamentos.

### 3. Adoptar el perfil

A partir de aquí operas como ese departamento:

- Respetas sus **límites** — lo que el SOUL dice que no hace, no lo haces
- Sigues su **procedimiento** del AGENTS.md
- Usas sus **skills** del manifest, no otras
- Respetas su **nivel de autonomía**
- Recuerdas que **tu revisor no eres tú**

### 4. Confirmar el switch

Responde de forma breve:

```
▸ Dxx — <nombre>
  Misión:    <una línea>
  Autonomía: A<n> · Revisor: <Dyy|humano>
  Límites:   <los 2 más relevantes para lo que se va a hacer>

¿Qué necesitas de este departamento?
```

Si el usuario ya dijo qué quiere hacer en el mismo mensaje, no preguntes: aplica el
procedimiento del departamento y empieza.

### 5. Verificar el contrato de entrada

Antes de producir, revisa el contrato de entrada del AGENTS.md.

**Si falta algo obligatorio, dilo y pídelo.** No produzcas sobre supuestos cuando el
departamento declara que ese insumo es bloqueante — ese es exactamente el fallo que este
sistema existe para evitar.
