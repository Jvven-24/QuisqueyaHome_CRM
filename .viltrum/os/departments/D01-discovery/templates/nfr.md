# Requisitos no funcionales — <proyecto>

**Departamento:** D01 · **Fecha:** AAAA-MM-DD · **Base:** ISO/IEC 25010:2023

> Resumen ejecutivo: un NFR sin número no es un NFR. Cada fila de esta tabla exige métrica,
> objetivo y forma de medición. Lo que no se puede medir, no entra aquí — se convierte en
> pregunta abierta hasta que alguien defina el número.

---

## 1. Adecuación funcional

| Sub-característica | Métrica | Objetivo | Cómo se mide |
|---|---|---|---|
| Completitud funcional | % de requisitos del PRD cubiertos | 100% de los Must | Matriz de trazabilidad |
| Corrección funcional | Tasa de defectos funcionales en producción | | Reporte de QA (D14) |

## 2. Eficiencia de desempeño

| Sub-característica | Métrica | Objetivo | Cómo se mide |
|---|---|---|---|
| Tiempo de respuesta | P95 de carga de <pantalla crítica> | | Medición D15 |
| Capacidad | Usuarios concurrentes soportados | | Prueba de carga |
| Utilización de recursos | | | |

## 3. Compatibilidad

| Sub-característica | Métrica | Objetivo | Cómo se mide |
|---|---|---|---|
| Coexistencia | Sistemas con los que debe convivir sin degradar su desempeño | | |
| Interoperabilidad | Formato/API de intercambio con terceros | | |

## 4. Capacidad de interacción (usabilidad)

| Sub-característica | Métrica | Objetivo | Cómo se mide |
|---|---|---|---|
| Reconocibilidad de idoneidad | Tarea crítica completada sin ayuda | % de usuarios en prueba | Test de usabilidad |
| Accesibilidad | Conformidad WCAG | 2.2 AA | Auditoría D07 |
| Inclusividad | | | |

## 5. Fiabilidad

| Sub-característica | Métrica | Objetivo | Cómo se mide |
|---|---|---|---|
| Disponibilidad | Uptime mensual | | Observabilidad D17 |
| Tolerancia a fallos | Comportamiento ante caída de una dependencia | | Prueba de resiliencia |
| Capacidad de recuperación | Tiempo de recuperación tras incidente (RTO) | | Ensayo de restauración |
| Faultlessness (2023) | Tasa de fallos silenciosos aceptable | 0 | Revisión de logs |

## 6. Seguridad

| Sub-característica | Métrica | Objetivo | Cómo se mide |
|---|---|---|---|
| Confidencialidad | Cifrado en tránsito y en reposo | Obligatorio si hay dato personal | Revisión D12 |
| Duración de sesión | Minutos antes de expirar | | Configuración verificada |
| Auditabilidad | % de acciones sensibles con bitácora | 100% | Revisión D11/D12 |

## 7. Mantenibilidad

<Solo si aplica al contrato — por ejemplo, si el código se entrega al cliente para que su
propio equipo lo mantenga.>

| Sub-característica | Métrica | Objetivo | Cómo se mide |
|---|---|---|---|
| Modularidad | Acoplamiento entre módulos | | Revisión D03 |
| Capacidad de prueba | Cobertura de pruebas de lógica de negocio | | Reporte de CI |

## 8. Portabilidad / flexibilidad

| Sub-característica | Métrica | Objetivo | Cómo se mide |
|---|---|---|---|
| Adaptabilidad | Dependencias de entorno específico | | Revisión D03 |
| Escalabilidad (2023) | Crecimiento soportado sin rediseño | | Prueba de carga proyectada |

---

## Regla de cierre

Ningún NFR queda en este documento con la columna "Objetivo" vacía al cerrar el Gate G1.
Si no hay número todavía, la fila se convierte en pregunta abierta en `.viltrum/questions.md`
con `bloquea:G1`.
