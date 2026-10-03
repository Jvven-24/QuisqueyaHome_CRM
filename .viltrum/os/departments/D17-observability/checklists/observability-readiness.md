# Checklist — preparación de observabilidad (Gate G7)

> La firma es de D16, nunca de quien instrumentó.

## A. Instrumentación

- [ ] Trazas activas en cada frontera de red, con propagación de contexto entre servicios
- [ ] Métricas RED (Rate, Errors, Duration) por endpoint u operación crítica
- [ ] Logs estructurados en JSON, con id de traza y de petición
- [ ] Los tres pilares correlacionados: desde una métrica anómala se llega a la traza y al log exactos
- [ ] Instrumentación basada en OpenTelemetry o equivalente desacoplado del backend

## B. Datos personales

- [ ] Ningún log contiene contraseña, token, documento de identidad o tarjeta en claro
- [ ] Atributos de traza revisados: ningún dato personal sin enmascarar
- [ ] Política de retención de logs escrita: cuánto se conserva, quién accede
- [ ] Verificación ejecutada: intentar buscar un dato personal conocido en los logs y no encontrarlo

## C. SLI/SLO

- [ ] SLI definido por cada recorrido crítico identificado por D03
- [ ] SLO expresado en términos de negocio, no solo técnicos
- [ ] Ventana de medición declarada (ej. 30 días móviles)
- [ ] Dueño de negocio firmó el SLO
- [ ] Presupuesto de error calculado y visible

## D. Presupuesto de error como política

- [ ] Umbral de consumo que dispara freno de releases, definido
- [ ] Responsable de decidir el freno, identificado
- [ ] Consumo de presupuesto por incidente, registrado históricamente

## E. Alertas

Por cada alerta configurada:
- [ ] Basada en síntoma de usuario, no solo en causa interna
- [ ] Runbook enlazado con el primer paso a ejecutar
- [ ] Urgencia real verificada — si puede esperar, es reporte, no alerta
- [ ] Sin condiciones de ruido conocido sin resolver
- [ ] Canal de escalamiento definido por severidad

- [ ] **Ninguna alerta sin runbook**
- [ ] Ninguna alerta duplicada con otra

## F. Disponibilidad

- [ ] Chequeo de disponibilidad externo a la infraestructura propia, activo
- [ ] Frecuencia acorde al SLO declarado
- [ ] Notificación en canal que el equipo revisa de verdad

## G. Errores de frontend y backend

- [ ] Captura de excepciones no controladas activa en frontend
- [ ] Captura de excepciones no controladas activa en backend
- [ ] Errores agrupados por causa, no como lista plana
- [ ] Umbral de tipo de error nuevo que dispara alerta

## H. Severidad e incidentes

- [ ] Catálogo de severidades (SEV1–SEV4) definido y comunicado al equipo
- [ ] Procedimiento de declaración de incidente escrito
- [ ] Canal único de comunicación por incidente, con línea de tiempo

---

## Veredicto

```
APROBADO      — checklist completa, alertas verificadas con simulacro
CONDICIONAL   — excepciones con dueño y fecha. Nunca sin monitoreo de disponibilidad
RECHAZADO     — vuelve a D17 con hallazgos clasificados
```

**Recordatorio:** un respaldo o una alerta silenciosa es peor que un fallo. Verificar
"la alerta existe" no es suficiente — hay que verificar que suena.

Firma del revisor (D16): _______________________  Fecha: _______________
