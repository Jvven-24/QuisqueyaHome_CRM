# Checklist — integración de webhook

> La firma D12, nunca quien construyó el adaptador.

## A. Verificación de firma

- [ ] El cuerpo de la petición se lee **crudo**, antes de cualquier `JSON.parse` u otro
      middleware que lo transforme
- [ ] El HMAC (u otro esquema del proveedor) se calcula sobre esos bytes crudos
- [ ] El secreto compartido vive fuera del repositorio, cargado desde variable de entorno
      o gestor de secretos
- [ ] La comparación de firmas es en **tiempo constante**, nunca `===` directo
- [ ] Una firma inválida se rechaza sin procesar el evento y sin dar pista de qué parte
      falló
- [ ] El intento con firma inválida queda registrado (IP, timestamp, resultado)
- [ ] Prueba ejecutada: payload con firma **inválida** se rechaza
- [ ] Prueba ejecutada: payload con firma **válida** se acepta
- [ ] Si el proveedor exige handshake de suscripción (reto/challenge), está implementado
      y probado

## B. Ventana de replay

- [ ] Todo evento entrante tiene timestamp de emisión o de recepción
- [ ] Existe una ventana máxima definida (ej. 5 minutos) fuera de la cual un evento con
      firma válida se rechaza igual
- [ ] Prueba ejecutada: evento con firma válida pero timestamp fuera de ventana se rechaza

## C. Deduplicación por ID de evento

- [ ] Todo evento entrante trae un identificador único emitido por el proveedor
- [ ] Ese ID se guarda con restricción **UNIQUE** antes de ejecutar cualquier efecto
- [ ] Un ID repetido responde éxito sin repetir el efecto de negocio
- [ ] La deduplicación **no** se basa en el contenido del payload, solo en el ID
- [ ] Prueba ejecutada: el mismo evento enviado dos veces produce un solo efecto

## D. Cola de mensajes muertos

- [ ] Un evento que agota todos los reintentos se mueve a una cola de mensajes muertos,
      no desaparece
- [ ] La cola conserva el payload completo y el historial de cada intento
- [ ] Existe alerta cuando un evento entra a la cola
- [ ] Está definido quién revisa la cola y con qué frecuencia
- [ ] El reproceso desde la cola es manual y explícito, nunca automático infinito

## E. Trazabilidad

- [ ] Cada evento tiene un ID de correlación único
- [ ] Cada intento de procesamiento queda registrado: timestamp, resultado, latencia
- [ ] El registro no contiene secretos, tokens ni datos sensibles en claro
- [ ] Es posible reconstruir la historia completa de un evento desde el log

## F. Adaptador y contrato

- [ ] El nombre del proveedor no aparece fuera de `adapters/` — verificado por búsqueda
- [ ] El endpoint del webhook vive detrás del puerto que definió D03
- [ ] Existe una prueba que simula el webhook con un adaptador falso, sin red real

---

## Veredicto

```
APROBADO      — checklist completa
CONDICIONAL   — excepciones con dueño y fecha. Nunca con P0
RECHAZADO     — vuelve al adaptador con hallazgos clasificados
```

**Recordatorio:** un webhook sin firma verificada es una puerta abierta, no un detalle de
implementación pendiente.
