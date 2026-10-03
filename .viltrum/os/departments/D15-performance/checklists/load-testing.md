# Checklist — pruebas de carga (k6)

> Se aplica antes de cualquier release que cambie capacidad esperada, y ante escalamiento
> reportado. Las cuatro formas de prueba son complementarias, no intercambiables.
> Firma el revisor (D03), nunca quien diseñó la prueba.

## A. Prerrequisitos

- [ ] Perfil de tráfico esperado obtenido de D01/D02: usuarios concurrentes normales, pico esperado, geografía
- [ ] Ambiente de prueba lo más parecido posible a producción en capacidad de infraestructura
- [ ] **Nunca contra producción real sin coordinación explícita con D16 y aprobación** — el impacto de una prueba de carga mal acotada es en sí mismo un incidente
- [ ] Datos de prueba aislados, que no contaminen datos reales ni disparen efectos secundarios reales (correos, cobros, notificaciones)

## B. Carga sostenida (*load*)

- [ ] Simula el tráfico normal esperado, sostenido por el tiempo representativo de uso real (no solo unos segundos)
- [ ] Latencia p95 y p99 registradas
- [ ] Tasa de error registrada — debe mantenerse en el umbral aceptable declarado
- [ ] Uso de CPU, memoria y conexiones de base de datos observado durante la corrida completa

## C. Estrés (*stress*)

- [ ] Carga incrementada progresivamente por encima de lo normal hasta encontrar degradación
- [ ] Punto donde la latencia empieza a crecer de forma no lineal, identificado
- [ ] Comportamiento del sistema al degradarse observado — ¿falla con error claro o se cuelga sin respuesta?
- [ ] Recuperación verificada: al bajar la carga, ¿el sistema vuelve a la normalidad sin reinicio manual?

## D. Picos (*spike*)

- [ ] Aumento súbito y masivo de tráfico simulado (de tráfico normal a varias veces ese volumen en segundos)
- [ ] Comportamiento durante el pico registrado — colas, rechazo controlado, o caída
- [ ] Sistema de *rate limiting* o *backpressure* verificado bajo el pico, no solo bajo carga normal
- [ ] Recuperación tras el pico verificada

## E. Resistencia (*soak*)

- [ ] Carga normal sostenida por horas, no minutos
- [ ] Fugas de memoria detectadas o descartadas — memoria observada a lo largo de toda la corrida, no solo al inicio
- [ ] Conexiones (base de datos, sockets) verificadas como liberadas correctamente, sin acumulación
- [ ] Degradación gradual de latencia a lo largo del tiempo descartada o documentada

## F. Punto de quiebre (*breakpoint*)

- [ ] Carga incrementada hasta el fallo real del sistema, en ambiente aislado
- [ ] Límite exacto documentado (usuarios concurrentes, peticiones por segundo) donde el sistema deja de responder correctamente
- [ ] Causa del quiebre identificada (CPU, memoria, conexiones de base de datos, límite de un servicio externo)

## G. Reporte

- [ ] Métricas de cada tipo de prueba: latencia p50/p95/p99, tasa de error, throughput
- [ ] Comparación contra el presupuesto declarado en `performance-budget.md`
- [ ] Gráfico o serie de tiempo de la corrida adjunto, no solo el resumen final
- [ ] Recomendación de capacidad para D16 basada en el punto de quiebre, con margen de seguridad

---

## Veredicto

```
APROBADO      — las cuatro pruebas corridas, dentro del presupuesto, con reporte completo
CONDICIONAL   — excepción P2/P3 con dueño y fecha. Nunca un quiebre por debajo del pico esperado real
RECHAZADO     — vuelve a infraestructura o arquitectura con hallazgos clasificados
```

Firma el revisor (D03). Una sola prueba de carga corrida no cubre las cuatro formas — el
sistema puede pasar carga sostenida y fallar en el primer pico real.
