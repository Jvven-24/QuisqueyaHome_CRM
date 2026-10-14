# D17 — Método operativo

## Contrato de entrada

De D16: qué se desplegó, en qué tag, qué cambió de esquema, y el runbook de reversión
listo por si hace falta usarlo.

De D01/D02: métricas de éxito del producto (para derivar el SLO en términos de
negocio, no solo técnicos).

De D03: los recorridos críticos del sistema — dónde vive el riesgo si algo falla.

**Sin recorridos críticos identificados, no defino SLO.** Un SLO sobre "todo el
sistema" en abstracto no orienta ninguna decisión; un SLO sobre "completar una compra"
sí.

---

## Procedimiento

### 1. Instrumentar los tres pilares

Para cada servicio:

```
SERVICIO: <nombre>
TRAZAS:   <spans en cada frontera de red, propagación de contexto entre servicios>
METRICAS: <RED — Rate, Errors, Duration — por endpoint o por operación>
LOGS:     <estructurados JSON, con id de traza y de petición correlacionados>
```

Estándar: OpenTelemetry como capa de instrumentación, independiente del backend de
observabilidad (Sentry, Grafana, el proveedor que sea — la aplicación no importa el
proveedor, principio P1). Cambiar de backend de observabilidad no debe tocar el código
de negocio, solo el exportador.

### 2. Verificar que ningún dato personal viaja en logs o trazas

- [ ] Ningún log contiene contraseña, token, número de documento o tarjeta en claro
- [ ] Atributos de traza revisados: ningún campo de negocio con dato personal sin enmascarar
- [ ] Política de retención de logs definida (cuánto se conservan, quién accede)

### 3. Definir SLI y SLO por recorrido crítico

Para cada recorrido crítico identificado por D03:

```
RECORRIDO:        <ej. completar checkout>
SLI:              <indicador medible — % de peticiones exitosas en <Xms>>
SLO:              <objetivo — 99.9% en ventana de 30 días>
PRESUPUESTO DE ERROR: <1 - SLO, expresado en minutos/mes o peticiones>
DUEÑO DE NEGOCIO: <quién acordó este número>
```

**Regla:** el SLO lo niega o lo aprueba el dueño de producto. Yo lo propongo con datos;
no lo impongo por estándar de industria.

### 4. Configurar el presupuesto de error como política

- [ ] Umbral de consumo del presupuesto que dispara freno de releases (ej. 50% consumido en la ventana)
- [ ] Quién decide frenar el ritmo de cambios cuando el presupuesto se agota
- [ ] Registro de cuánto presupuesto se consumió por incidente, no solo el total

### 5. Diseñar alertas accionables

Toda alerta cumple las cuatro condiciones o no se activa:

| Condición | Verificación |
|---|---|
| Basada en síntoma de usuario, no en causa interna | "Tasa de error > X%", no "CPU alta" solo |
| Accionable | Existe un runbook enlazado con el primer paso a ejecutar |
| Urgente de verdad | Si puede esperar al día siguiente, es reporte, no alerta |
| Sin ruido conocido | No dispara en condiciones normales ya identificadas |

- [ ] Cada alerta enlaza su runbook
- [ ] Alertas duplicadas o redundantes eliminadas
- [ ] Canal de escalamiento definido por severidad

### 6. Monitoreo de disponibilidad

- [ ] Chequeo de disponibilidad externo (fuera de la infraestructura propia) para cada endpoint público crítico
- [ ] Frecuencia de chequeo acorde al SLO declarado
- [ ] Notificación en canal que el equipo revisa de verdad, no un correo que nadie lee

### 7. Errores de frontend y backend

- [ ] Captura de excepciones no controladas en frontend, con contexto de sesión sin datos personales
- [ ] Captura de excepciones no controladas en backend, correlacionada con la traza
- [ ] Agrupación de errores por causa, no solo lista plana de eventos
- [ ] Umbral de nuevos tipos de error que dispara alerta, no solo volumen total

### 8. Clasificar severidad de incidentes

| Severidad | Definición | Respuesta |
|---|---|---|
| **SEV1** | Caída total o pérdida de datos en curso | Respuesta inmediata, todo el equipo relevante |
| **SEV2** | Recorrido crítico degradado o parcialmente caído | Respuesta en el horario acordado, escalamiento activo |
| **SEV3** | Degradación menor, con workaround disponible | Se atiende en el ciclo normal |
| **SEV4** | Cosmético o sin impacto a usuario | Backlog |

- [ ] Severidad asignada en los primeros minutos, no al cierre
- [ ] Cambios de severidad durante el incidente registrados con hora

### 9. Gestionar el incidente en curso

1. Declarar el incidente y su severidad
2. Nombrar un coordinador del incidente (no necesariamente quien lo resuelve)
3. Canal de comunicación único, con línea de tiempo en vivo
4. Mitigar primero (puede ser rollback de D16), diagnosticar causa raíz después
5. Declarar el cierre solo cuando el síntoma desapareció y se verificó, no cuando "parece que sí"

### 10. Escribir el postmortem sin culpables

Uso `templates/postmortem.md`. Dentro de las 48 horas de cerrado el incidente, mientras
el detalle sigue fresco.

- [ ] Línea de tiempo con hora exacta de cada evento
- [ ] Impacto medido: a quién, cuánto tiempo, qué costó
- [ ] Causas contribuyentes del sistema — nunca "fulano cometió un error"
- [ ] Qué funcionó bien durante la respuesta, no solo qué falló
- [ ] Acciones de seguimiento con dueño y fecha, no "mejorar el monitoreo" en genérico

### 11. Revisar el SLO periódicamente

- [ ] Comparar el consumo real de presupuesto de error contra lo acordado
- [ ] Ajustar el SLO solo con el dueño de negocio, nunca unilateralmente
- [ ] Cerrar el ciclo con D22: lecciones que afectan el conocimiento del proyecto

### 12. Handoff a D00 / D16

Entrego: estado de disponibilidad del periodo, incidentes cerrados con postmortem,
deuda operativa detectada (alertas ruidosas, cobertura faltante), y si el gate G7 se
cumple.

---

## Skills y herramientas

| Necesidad | Skill/herramienta |
|---|---|
| Diagramas de arquitectura de observabilidad y línea de tiempo de incidentes | `artifact-diagramming` |
| Dashboards de SLO, presupuesto de error y tendencias de error | `dataviz` |
| Revisión de seguridad de lo que viaja en logs/trazas | `security-review` |
| Rastrear en el código dónde falta instrumentación o dónde se originó un error | `viltrum-repo-map` (explorar) |

---

## Contrato de salida

- [ ] Instrumentación de trazas, métricas y logs activa, correlacionada por id de traza
- [ ] Verificado: ningún dato personal en logs ni trazas
- [ ] SLI/SLO definidos por recorrido crítico, con dueño de negocio
- [ ] Presupuesto de error calculado y con política de freno definida
- [ ] Alertas accionables, cada una con runbook enlazado
- [ ] Monitoreo de disponibilidad externo activo
- [ ] Captura de errores de frontend y backend activa y agrupada
- [ ] Severidades de incidente definidas y aplicadas desde el primer minuto
- [ ] Postmortem sin culpables por cada incidente SEV1/SEV2, con acciones y dueños
- [ ] Handoff a D00/D16 con estado del gate G7

---

## Antipatrones propios

| Fallo | Corrección |
|---|---|
| Dashboard sin alerta accionable | Toda alerta enlaza un runbook con el primer paso |
| SLO definido por el departamento sin negocio | Se negocia con el dueño de producto, con números |
| Log con dato personal en claro | Enmascarado o excluido desde el diseño |
| Alerta que dispara y nadie actúa | Se elimina o se corrige — el ruido entrena a ignorar |
| Severidad asignada al cerrar el incidente | Se asigna en los primeros minutos |
| Postmortem que señala a una persona | Causas del sistema, nunca del individuo |
| "El servidor responde" como única señal de salud | SLI por recorrido crítico de negocio |
| Presupuesto de error agotado sin consecuencia | Freno de releases como política, no como sugerencia |
| Monitoreo solo desde dentro de la propia infraestructura | Chequeo externo independiente |
| Postmortem sin acción con dueño y fecha | Cada acción de seguimiento tiene ambos, o no cuenta |
