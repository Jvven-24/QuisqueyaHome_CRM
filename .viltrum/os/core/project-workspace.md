# Espacio de proyecto — el formato que leen los agentes, el humano y el dashboard

> Un proyecto instalado lleva su estado en Markdown dentro del propio repositorio.
> Ese Markdown es a la vez memoria del agente, documento para el humano y fuente del
> dashboard. Nadie mantiene tres versiones del mismo estado.

## Principio: el archivo es el protocolo

El dashboard no le pregunta nada a la IA. Lee y escribe Markdown. La IA tampoco necesita
que le expliquen el estado: lee los mismos archivos. La comunicación entre ambos cuesta
cero tokens hasta que alguien le pide trabajo a la IA — y entonces ella lee solo el
archivo que cambió.

Por eso el formato tiene que poder leerse **sin IA**: con una expresión regular sobre
Markdown estándar (GFM). Si un dato solo se entiende interpretando prosa, está mal
escrito.

---

## Estructura

```
<repositorio del proyecto>/
└── .viltrum/                   nombre provisional; lo fija research/sdk-distribution.md
    ├── project.md              identidad y clasificación (frontmatter)
    ├── status.md               resumen ejecutivo, bloqueos, siguiente acción — lo escribe D00
    ├── questions.md            preguntas abiertas y respondidas
    ├── client-inputs.md        lo que debe entregar el cliente (logos, accesos, textos…)
    ├── config.md               configuraciones pendientes — nunca valores secretos
    ├── decisions.md            registro de decisiones
    ├── commercial.md           aceptación humana C1 antes de construir
    ├── sources.md              procedencia de transcripciones y documentos recibidos
    ├── requests.md             pedidos del humano a la IA hechos desde el dashboard
    ├── os/                     copia de solo lectura del núcleo, la escribe el instalador
    ├── mandates/
    │   └── M-nnn.md            encargo de ingeniería derivado de cada petición sustancial
    ├── phases/
    │   ├── F0-intake.md        checklist de la puerta G0, con evidencia por ítem
    │   ├── F1-requisitos.md
    │   └── …  F8-mejora.md
    ├── departments/
    │   └── Dxx-slug.md         hallazgos y entregables del departamento en ESTE proyecto
    └── evidence/               capturas, reportes, exportaciones
```

---

## `project.md`

```markdown
---
id: quisqueya-home
nombre: Quisqueya Home Portal Web
cliente: Quisqueya Home
tipo: portal/CMS
riesgo: R2
fase: F5
departamento_activo: D14
actualizado: 2026-09-24
---

# Quisqueya Home Portal Web

<Una línea: qué problema resuelve y para quién.>
```

Los valores de `tipo`, `riesgo` y `fase` vienen de `core/routing.md` y
`core/lifecycle.md`. Nada fuera de esos catálogos.

---

## `questions.md` — el formato más importante

Una pregunta es un ítem de lista de tareas. Marcado = respondida.

```markdown
## Abiertas

- [ ] Q-014 ¿Quién aprueba los precios antes de publicarlos? · a:cliente · bloquea:G1 · dep:D01 · prioridad:P1
- [ ] Q-015 ¿El inventario se sincroniza o se carga a mano? · a:cliente · bloquea:G2 · dep:D19

## Respondidas

- [x] Q-003 ¿Se captura el contacto en el portal? · a:cliente · bloquea:G0 · dep:D01
  - R: No. La conversación se deriva a WhatsApp. (2026-09-06, Ismael)
  - Consecuencia: el riesgo queda en R2.
```

| Etiqueta | Valores | Obligatoria |
|---|---|---|
| `Q-nnn` | identificador estable, nunca se reutiliza | sí |
| `a:` | `cliente` · `equipo` · `proveedor` | sí |
| `bloquea:` | `G0`…`G8` o `ninguna` | sí |
| `dep:` | departamento que la necesita | sí |
| `prioridad:` | `P0`…`P3` | no, por defecto P2 |

La respuesta va en una sublínea `- R:` con fecha y quién respondió. Una respuesta sin
fuente no cierra la pregunta.

**Regla:** una pregunta que bloquea una puerta y sigue abierta impide aprobar esa puerta.
D00 lo verifica leyendo este archivo, no preguntando.

---

## `client-inputs.md` y `config.md`

Mismo formato de lista de tareas:

```markdown
- [ ] CI-004 Logotipo en vectorial · dep:D05 · bloquea:G3
- [x] CI-001 Acceso a Google Drive con los dossiers · dep:D01
  - Recibido: 2026-09-05

- [ ] CFG-007 Registro DNS del dominio apuntando al VPS · dep:D16 · bloquea:G6
- [ ] CFG-008 Clave de API de Mixpanel en el gestor de secretos · dep:D17
```

**`config.md` nunca contiene el valor de un secreto.** Dice qué falta y dónde debe vivir,
no cuál es.

---

## `phases/Fn-*.md`

La checklist de la puerta, copiada de `core/lifecycle.md` al abrir la fase, con la
evidencia enlazada en cada ítem:

```markdown
---
fase: F2
puerta: G2
estado: en_revision        # no_iniciada · en_curso · en_revision · aprobada · condicional · rechazada
revisor: humano
---

- [x] Expediente de D21 cerrado · evidencia: ../departments/D21-research.md#pagos
- [ ] Modelo de amenazas para R2 o superior · dep:D12
- [x] N/A: Versionado de API pública · razón: la API no es pública
```

- **Progreso** = ítems marcados / ítems totales. Lo calcula el dashboard contando casillas.
- **No aplica** se marca como hecho con el prefijo `N/A:` y una razón. Sin razón, no cuenta.
- **Un ítem marcado sin `evidencia:`** se muestra como dudoso. No bloquea la lectura, pero
  D00 no aprueba la puerta con ítems dudosos.

---

## `requests.md` — el canal del dashboard hacia la IA

El dashboard no llama a ningún modelo. Cuando el humano quiere pedir algo, el dashboard
añade una línea aquí. La IA revisa este archivo al empezar cada sesión y convierte cada
pedido pendiente en trabajo, pasando por la capa de mandato.

```markdown
- [ ] REQ-007 Revisar por qué el mapa no carga en móvil · dep:D09 · 2026-09-24
- [x] REQ-006 Preparar las preguntas para la reunión del jueves · dep:D01 · 2026-09-23
  - Hecho: M-012, 14 preguntas añadidas a questions.md
```

Hasta que alguien abre una sesión con la IA, el pedido cuesta cero tokens.

---

## `decisions.md`

```markdown
### DEC-009 · 2026-09-12 · Cartografía nocturna nativa en lugar de invertir mosaicos
- Decide: D05 · Revisa: humano · Reversible: sí
- Alternativas descartadas: filtro CSS de inversión (deformaba mar y etiquetas)
- Consecuencia: la CSP admite server.arcgisonline.com
```

## `commercial.md` — corte entre propuesta y construcción

```markdown
---
puerta: C1
estado: pendiente           # pendiente · aceptada · rechazada
version_propuesta: pendiente
aprobador: pendiente
fecha: pendiente
evidencia: pendiente        # enlace al correo, acta o contrato aceptado
---

# Aceptación comercial

Alcance, exclusiones, precio y condiciones aceptadas se enlazan aquí.
```

Solo `aceptada` con todos los campos completos abre D09/D10/D11/D16. D02 prepara el
registro; una persona autorizada confirma la aceptación. D00 lo verifica.

## `sources.md`

El CLI `viltrum intake` agrega `SRC-nnn`, fecha, responsable, ruta y SHA-256 del archivo
original. El texto de la transcripción permanece en su ubicación original: el registro
no equivale a una decisión aprobada ni expone automáticamente el contenido en Git.

---

## Qué escribe cada quién

| Archivo | Escribe | Lee |
|---|---|---|
| `project.md` | D00 | todos |
| `status.md` | D00 | humano, dashboard |
| `questions.md` | cualquier departamento añade; el humano o el dashboard responde | D00 para las puertas |
| `client-inputs.md` | D01, D02 | humano, dashboard |
| `config.md` | D16, D12 | humano, dashboard |
| `decisions.md` | el departamento que decide | todos |
| `commercial.md` | D02 prepara; humano confirma | D00, dashboard, perfiles de construcción |
| `sources.md` | CLI de intake o D22 | D01, D22, D00 |
| `phases/*` | D00 abre la fase; cada departamento marca sus ítems | D00 declara la puerta |
| `departments/*` | solo su departamento | D00, revisores |

---

## Reglas

1. **Un dato, un archivo.** El estado de una pregunta vive en `questions.md` y en ningún
   otro lugar. `status.md` resume, no duplica.
2. **Identificadores estables.** `Q-`, `CI-`, `CFG-`, `DEC-`, `M-`, `REQ-` nunca se renumeran.
3. **Nada que solo entienda una IA.** Si el dashboard no puede leerlo con una expresión
   regular, se reescribe.
4. **Ningún secreto**, nunca, en ningún archivo de `.viltrum/`.
5. **La IA edita casillas, no reescribe archivos.** Marcar un ítem es una edición de un
   carácter; reescribir el archivo entero es gastar tokens y arriesgar pisar cambios del
   humano.
