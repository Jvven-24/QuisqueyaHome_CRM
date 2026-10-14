# D21 — Método operativo

Para entrega coordinada aplica `sops/delivery.md` y el contrato `delivery.json`.
Su skill local es `viltrum-research`; `core/orchestration.md` define el handoff y la revisión.

La skill local `skills/viltrum-research/SKILL.md` resume el flujo de investigación,
procedencia y handoff. Esta guía conserva los criterios y umbrales detallados.

## Contrato de entrada

- La capacidad requerida, enunciada como necesidad (no como solución)
- Restricciones: stack actual, presupuesto, plazo, licencia aceptable, dónde se despliega
- Nivel de riesgo del proyecto (R0–R4), porque cambia el umbral de lo aceptable
- Volumen esperado, si aplica

Si me llega la petición como "instala X", la reformulo a capacidad **antes** de investigar,
y lo digo.

---

## Procedimiento

### 1. Enunciar la capacidad

```
CAPACIDAD: <qué debe poder hacer el sistema, en lenguaje de negocio>
NO INCLUYE: <lo que explícitamente queda fuera>
RESTRICCIONES: <stack, licencia, despliegue, presupuesto, plazo>
RIESGO: R<n>
```

### 2. Buscar en cuatro frentes

| Frente | Dónde busco |
|---|---|
| **Ya lo tenemos** | Proyectos previos de Viltrum, biblioteca de componentes, repositorios internos |
| **Nativo del stack** | ¿Lo resuelve Postgres, el framework, el navegador, la plataforma? |
| **Open source** | Repositorios mantenidos, con licencia compatible |
| **SaaS / API** | Servicio con API, precio y límites documentados |

**El orden importa.** Lo que ya tenemos gana por defecto si cubre; lo nativo casi siempre
gana a una dependencia nueva.

Para la búsqueda amplia uso un subagente con modelo pequeño: le pido candidatos con
enlace, licencia, último commit y una línea de qué hace. El criterio lo aplico yo después.

### 3. Filtrar rápido

Descarto sin evaluar a fondo lo que falle en:
- Licencia incompatible con uso comercial
- Sin mantenimiento (último commit > 18 meses sin ser un estándar estable)
- Vulnerabilidad conocida sin corregir
- Sin forma de exportar los datos

Registro el descarte y la razón. Un descarte documentado también es investigación.

### 4. Evaluar y puntuar

Aplico la tabla de `core/doctrine/buy-vs-build.md`:

| Criterio | Peso |
|---|---|
| Cobertura funcional | 20 |
| Licencia | 15 |
| Mantenimiento | 15 |
| Seguridad | 15 |
| Integración | 10 |
| Exportación y salida | 10 |
| Costo a 3 años | 10 |
| Experiencia de uso | 5 |

**Mínimo tres candidatos**, o razón escrita de por qué no hay más.

### 5. Decidir

| Puntaje | Decisión |
|---|---|
| 80–100 | Integrar o configurar |
| 65–79 | Prueba técnica acotada antes de decidir |
| 50–64 | Híbrido: núcleo externo, capa propia encima |
| < 50 | Construir, o seguir buscando |

Si el resultado es 65–79, **defino la prueba técnica**: qué se prueba, con qué criterio de
éxito y en cuánto tiempo. No una exploración indefinida.

### 5b. Elegir la estrategia de adopción

La puntuación dice **si** conviene lo existente. La estrategia dice **cómo** se toma.
Cinco caminos, en orden de preferencia cuando empatan:

| # | Estrategia | Cuándo | Qué se entrega |
|---|---|---|---|
| E1 | **Integrar el módulo completo** | Cubre ≥ 80 % del requisito, se mantiene activo, licencia compatible, y se puede aislar detrás de un adaptador | Dependencia fijada en versión + adaptador + pruebas de contrato |
| E2 | **Portar por partes** | Un proyecto con tecnología similar resuelve piezas concretas, pero traerlo entero arrastra lo que no necesitamos | Inventario pieza por pieza: qué se toma, qué se descarta; cada pieza entra con sus pruebas y su procedencia |
| E3 | **Adaptar un ejemplo de referencia** | Hay una implementación de ejemplo (plantilla, demo oficial, repositorio de referencia) cercana a lo que se necesita | El ejemplo reescrito a nuestras convenciones y contratos, no pegado |
| E4 | **Construir estudiando la referencia** | Nada encaja para integrar, pero existe una forma estándar de hacerlo documentada | Implementación propia que sigue el estándar citado, con enlace a la fuente |
| E5 | **Construir desde cero** | Lógica propia del negocio, o nada existente supera 50 puntos | Implementación propia con razón escrita |

**Para E2 — cómo se busca el proyecto similar:**
1. Mismo stack o compatible (lenguaje, framework, base de datos)
2. Mismo tipo de solución (`core/routing.md` 1.2)
3. Licencia que permita reutilizar código, no solo leerlo
4. Actividad reciente y pruebas propias
5. Se clona en un directorio aparte, **nunca dentro del proyecto**, se mapea (`viltrum repo-inventory`) y
   se inventarían sus módulos antes de decidir qué se porta

**Regla de todas las estrategias:** nada se pega. Todo entra detrás de un contrato propio,
con pruebas propias y con la procedencia registrada (repositorio, commit, licencia).
Ver `core/doctrine/buy-vs-build.md` — Regla de la extracción.

**E1 y E2 exigen revisión de licencia y de seguridad (D12)** antes de integrar.

### 6. Escribir el expediente

Plantilla: `templates/research-dossier.md`. Obligatorio incluso cuando la decisión parece
obvia.

### 7. Handoff

Entrego a D03 (arquitectura), que decide el contrato y el adaptador.
Si hay implicación de licencia o seguridad, copia obligatoria a D12.

---

## Contrato de salida

- [ ] Capacidad enunciada como necesidad, no como solución
- [ ] Cuatro frentes de búsqueda cubiertos (o razón del que no aplica)
- [ ] Mínimo tres candidatos evaluados, o razón escrita
- [ ] Descartes rápidos registrados con su motivo
- [ ] Tabla de puntuación completa
- [ ] Decisión con su umbral
- [ ] **Estrategia de adopción E1–E5 elegida**, con la razón de por qué no la anterior en la tabla
- [ ] Si E2: inventario pieza por pieza con qué se toma y qué se descarta
- [ ] **Plan de salida** del candidato elegido
- [ ] Licencia verificada y anotada
- [ ] Costo a 3 años estimado
- [ ] Riesgos asumidos, listados
- [ ] Expediente escrito y enlazado
- [ ] Handoff a D03

---

## Antipatrones propios

| Fallo | Corrección |
|---|---|
| Buscar la solución que ya tenía en mente | Enunciar la capacidad primero, sin nombres de producto |
| Un solo candidato "porque es el estándar" | Mínimo tres, o razón escrita |
| No mirar dentro de Viltrum primero | El frente "ya lo tenemos" es el primero, no el último |
| Ignorar la licencia | Se lee siempre, y se anota |
| Evaluar por popularidad | Las estrellas no son mantenimiento; mirar commits e issues |
| Olvidar el costo de operar | El costo es a 3 años, no el precio de hoy |
| No preguntar cómo se sale | Sin plan de salida, no hay decisión |
| Investigar sin límite de tiempo | La investigación tiene caja de tiempo; al vencerse, se decide con lo que hay y se anota |
| No escribir el expediente "porque era obvio" | En ocho meses nadie recuerda; se vuelve a discutir desde cero |


## Integración PXIL (2026-09-30)

Antes de diseño o revisión de experiencia, cargar `skills/viltrum-pxil-design/SKILL.md`.
Las skills complementarias del contrato son: pxil-21st-scout.
Consultar `registry/design-resources.json` y la plantilla de contrato de experiencia.
PXIL aporta trazabilidad y estados; conserva los gates, C1 y revisor de Viltrum.
