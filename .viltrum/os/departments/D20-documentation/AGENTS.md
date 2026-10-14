# D20 — Método operativo

## Contrato de entrada

De D03: documento de arquitectura, ADR, diagrama de dependencias.

De D11: diccionario de datos, política de retención, runbook de restauración de base de
datos.

De D16: runbook de release y de reversión, definición de ambientes.

De D17: catálogo de alertas con sus runbooks, definición de SLO.

**Sin los artefactos fuente de cada departamento, no documento por inferencia.** Un
manual de administración inventado sobre lo que "probablemente" hace el sistema es una
fuente de errores más grave que no tener manual — genera confianza falsa.

---

## Procedimiento

### 1. Clasificar cada documento según Diátaxis

Antes de escribir, decidir a cuál de los cuatro cuadrantes pertenece:

| Cuadrante | Pregunta del lector | Ejemplo en este proyecto |
|---|---|---|
| **Tutorial** | "Enséñame, no sé nada todavía" | Guía de onboarding del primer día |
| **Guía práctica** | "Necesito lograr esto ahora" | Cómo restaurar el respaldo, cómo rotar un secreto |
| **Referencia** | "Necesito el dato exacto" | Variables de entorno, esquema de la API, diccionario de datos |
| **Explicación** | "¿Por qué es así?" | ADR, documento de arquitectura |

**Un documento no mezcla cuadrantes.** Si un README empieza a explicar el porqué de una
decisión de arquitectura en medio de los pasos de instalación, esa explicación se mueve
a su propio documento y se enlaza.

### 2. Escribir el README estándar

Uso `templates/readme-standard.md`. Contenido mínimo, en este orden: qué es, cómo se
instala, cómo se corre, cómo se prueba, cómo se despliega, estructura del repositorio,
a quién preguntar, licencia si aplica.

- [ ] Nadie necesita preguntar en el chat del equipo "¿cómo levanto esto localmente?"
- [ ] El README no repite lo que ya está en otro documento — enlaza

### 3. Separar manual de usuario y manual de administración

| Manual | Audiencia | Contenido |
|---|---|---|
| Usuario | Rol de negocio, sin acceso técnico | Qué puede hacer, paso a paso, sin jerga |
| Administración | Rol técnico/operativo | Gestión de usuarios, configuración, respaldo, restauración, rotación de secretos, escalamiento |

Uso `templates/admin-manual.md` para el segundo. El manual de administración es el que
se prueba con la pregunta de la frase de este departamento: ¿puede un junior operarlo
solo?

### 4. Documentar la arquitectura y las decisiones

- [ ] Documento de arquitectura de D03, enlazado y actualizado si cambió desde G2
- [ ] Índice de ADR navegable — lista con título, fecha, estado (vigente/superado)
- [ ] Diagrama de dependencias actualizado, no el de hace tres releases

### 5. Documentar restauración y continuidad

- [ ] Procedimiento de restauración de base de datos, literal, sin dar por sentado contexto
- [ ] Procedimiento de reversión de despliegue, enlazado desde D16, no duplicado
- [ ] Tiempos reales de restauración y reversión (los medidos por D16/D11), no estimados
- [ ] Contactos y accesos necesarios para ejecutar cada procedimiento, listados

### 6. Indexar runbooks operativos

- [ ] Cada alerta de D17 con runbook enlazado, listado en un índice único
- [ ] Cada runbook de D16 (release, rollback) enlazado desde el mismo índice
- [ ] Ningún runbook vive solo en la cabeza de quien lo escribió

### 7. Integrar con `.viltrum/`

Verifico que el espacio de proyecto (`core/project-workspace.md`) esté consistente:

- [ ] `project.md` con identidad y clasificación al día
- [ ] `status.md` refleja el estado real, no uno de hace dos semanas
- [ ] `questions.md` sin preguntas respondidas que sigan marcadas como abiertas
- [ ] `decisions.md` con toda decisión relevante, no solo las de arquitectura
- [ ] Ningún dato que debiera vivir en `.viltrum/` duplicado en otro documento aparte

### 8. Preparar el handoff al cliente

- [ ] Documento de handoff: qué se entrega, qué queda pendiente, quién es el contacto técnico
- [ ] Accesos entregados formalmente (no verbalmente) — quién tiene qué credencial
- [ ] Sesión de capacitación con documento de respaldo, no solo la llamada
- [ ] Manual de usuario y de administración entregados y confirmados como recibidos

### 9. Verificar con el criterio junior

Para cada procedimiento operativo crítico (restaurar, revertir, rotar un secreto,
escalar un incidente):

- [ ] Una persona sin contexto previo del proyecto puede seguir el documento sin
      preguntar nada al equipo original
- [ ] Si falla el paso 1, el documento dice qué hacer — no asume que "obviamente" se
      resuelve solo

Si esta verificación falla, el documento vuelve a escribirse, no se aprueba con una
nota aclaratoria verbal.

### 10. Mantener la documentación viva

- [ ] Cambio de arquitectura, esquema, runbook o proceso → PR que actualiza el
      documento correspondiente en el mismo cambio, no "después"
- [ ] Documentos obsoletos marcados explícitamente como superados, no borrados sin
      rastro ni dejados a que alguien los confunda con vigentes

---

## Skills y herramientas

| Necesidad | Skill/herramienta |
|---|---|
| Documentos formales de handoff o manuales para el cliente en Word | `anthropic-skills:docx` |
| Entrega de manuales o reportes en PDF | `anthropic-skills:pdf` |
| Presentación de capacitación o handoff | `anthropic-skills:pptx` |
| Diagramas de arquitectura, flujo o dependencias | `artifact-diagramming` |
| Explorar el código existente para documentar con precisión, no por inferencia | `viltrum-repo-map` (explorar) |

---

## Contrato de salida

- [ ] README estándar completo y sin preguntas de onboarding sin responder
- [ ] Manual de usuario y manual de administración, separados por audiencia
- [ ] Documentación de arquitectura y ADR indexados y vigentes
- [ ] Procedimiento de restauración documentado de forma literal
- [ ] Índice único de runbooks operativos (release, rollback, alertas)
- [ ] Espacio `.viltrum/` consistente y sin duplicación de datos
- [ ] Documento de handoff al cliente con accesos formalizados
- [ ] Verificación del criterio junior aplicada a cada procedimiento crítico
- [ ] Cada documento clasificado en su cuadrante de Diátaxis, sin mezclar

---

## Antipatrones propios

| Fallo | Corrección |
|---|---|
| Tutorial y referencia mezclados en un documento | Separar por cuadrante de Diátaxis |
| README que no explica cómo correr el proyecto localmente | Cinco pasos mínimos, verificados por alguien nuevo |
| Manual de usuario y de administración en un solo archivo | Separar por audiencia y permiso |
| Documentación en un wiki aparte del repositorio | Vive junto al código, mismo PR |
| Runbook que solo existe en la memoria de quien lo escribió | Escrito, indexado, literal |
| Documento de restauración que asume contexto previo | Escrito para quien no tiene ninguno |
| ADR disperso en commits sin índice | Índice único navegable |
| Handoff como una llamada sin documento de respaldo | Documento que la llamada explica, no reemplaza |
| Documento desactualizado tras un cambio de arquitectura | Se actualiza en el mismo PR del cambio |
| Documento obsoleto sin marcar | Se marca explícitamente como superado |
