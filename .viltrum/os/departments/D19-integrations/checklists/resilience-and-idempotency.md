# Checklist — resiliencia e idempotencia

> La firma D12, nunca quien construyó el adaptador.

## A. Backoff exponencial y jitter

- [ ] La fórmula de espera es exponencial: `min(cap, base * 2^intento)`
- [ ] Se aplica jitter completo (aleatorio entre 0 y el valor calculado), no un ruido
      simbólico
- [ ] `base` y `cap` están declarados explícitamente para esta integración
- [ ] Existe un número máximo de reintentos declarado, no infinito
- [ ] Se desiste antes del máximo si el error es permanente (4xx de validación,
      credencial inválida) en vez de agotar reintentos en un fallo que no va a cambiar
- [ ] Si el proveedor envía `Retry-After`, ese valor tiene prioridad sobre el cálculo
      propio
- [ ] Prueba ejecutada: una secuencia de fallos produce esperas crecientes, no
      constantes

## B. Idempotencia en llamadas salientes

- [ ] Toda llamada que muta estado externo (cobrar, facturar, enviar) lleva clave de
      idempotencia propia
- [ ] La clave se genera **una vez** por operación de negocio y se reutiliza en cada
      reintento — nunca una clave nueva por intento
- [ ] La clave se deriva de un identificador estable del dominio, no de un timestamp o
      UUID por llamada
- [ ] Si el proveedor no soporta idempotencia nativa, el adaptador implementa su propia
      verificación de "ya ejecutado" antes de reintentar
- [ ] Prueba ejecutada: la misma operación reintentada dos veces no duplica el efecto
      externo

## C. Límites del proveedor y backpressure

- [ ] El límite real del proveedor está documentado con fuente y fecha de verificación
- [ ] El sistema encola y drena al ritmo permitido en vez de disparar todo el volumen de
      una vez
- [ ] Existe margen entre el volumen esperado y el límite documentado, no operación al
      borde del límite
- [ ] El adaptador reacciona a un código de límite excedido (429 u homólogo) con espera,
      no con reintento inmediato

## D. Sincronización y conflictos

- [ ] Está definida la estrategia para cuando el mismo dato cambia en ambos lados: última
      escritura gana, versión comparada, o resolución manual
- [ ] La estrategia la definió el negocio (D01/D02), no se improvisó en el adaptador
- [ ] Todo conflicto detectado se registra: qué versión ganó, cuál se descartó, cuándo
- [ ] Si la estrategia es resolución manual, existe un canal real para hacerlo, no solo
      un campo "pendiente" que nadie revisa

## E. Adaptador sin fugas del proveedor

- [ ] El nombre del proveedor no aparece en ningún archivo fuera de `adapters/` —
      verificado por búsqueda del literal en el repositorio
- [ ] El dominio invoca el puerto propio, nunca el SDK o cliente HTTP del proveedor
      directamente
- [ ] Cambiar de proveedor implica tocar solo el adaptador, o ningún archivo fuera de él
- [ ] Existe una prueba que sustituye el adaptador real por uno falso para probar el
      dominio sin red

## F. Secretos y configuración

- [ ] Ningún secreto, token o clave de API está en el repositorio
- [ ] Los secretos se cargan desde variable de entorno o gestor de secretos
- [ ] Ningún límite, endpoint o umbral del proveedor está hardcodeado — vive en
      configuración con una sola fuente

---

## Veredicto

```
APROBADO      — checklist completa
CONDICIONAL   — excepciones con dueño y fecha. Nunca con P0
RECHAZADO     — vuelve al adaptador con hallazgos clasificados
```
