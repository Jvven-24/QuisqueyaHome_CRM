# Checklist — catálogo de mensajes de error y componentes

> Verifica la calidad de la redacción de errores y los estados de cada componente.
> Firma D14, nunca quien redactó.

## A. Estructura del mensaje

Por cada mensaje de error del catálogo:
- [ ] Dice qué pasó, en lenguaje humano, sin jerga técnica
- [ ] Dice qué puede hacer el usuario ahora mismo
- [ ] No culpa al usuario cuando el fallo fue del sistema
- [ ] No usa un código como único contenido del mensaje
- [ ] El tono es consistente con la voz de marca definida por D08, cuando existe

## B. Casos obligatorios cubiertos

- [ ] Error de campo individual
- [ ] Error general de formulario con resumen y enlaces
- [ ] Error de servidor (5xx) con código de referencia
- [ ] Timeout
- [ ] Límite de peticiones (429) con indicación de cuándo reintentar
- [ ] Error parcial (se aísla lo que falló, se conserva lo que sí cargó)
- [ ] Sesión expirada con conservación de contenido
- [ ] Permiso insuficiente con explicación de qué falta
- [ ] 404 con rutas útiles
- [ ] 500 sin exponer detalle interno
- [ ] Mantenimiento con alcance y canal de contacto
- [ ] Conflicto de edición concurrente

## C. Reintentos e idempotencia

- [ ] Reintento manual disponible tras error recuperable
- [ ] Reintento automático, si existe, tiene límite y backoff — nunca infinito
- [ ] El reintento no duplica la acción original (coordinado con D10/D19)

## D. Componentes — estados verificados en ejecución

### Botón
- [ ] reposo, hover, foco visible, activo, deshabilitado con razón, cargando con bloqueo de doble clic

### Input
- [ ] vacío, con valor, foco, error con mensaje, deshabilitado, solo lectura

### Tabla
- [ ] cargando con skeleton de filas, vacía, con datos, error parcial por fila o columna, ordenada, filtrada

### Select / combobox
- [ ] cerrado, abierto, buscando, sin resultados, cargando opciones remotas

### Upload de archivo
- [ ] en espera, subiendo con progreso real, éxito, error total, **error parcial por archivo individual**, cancelado por el usuario

### Paginación
- [ ] página actual visible, anterior/siguiente deshabilitados correctamente en los extremos, total conocido vs. desconocido manejado, salto directo si aplica

## E. Verificación cruzada con D07

- [ ] Ningún estado se comunica solo por color
- [ ] Los errores se pueden anunciar a tecnología asistiva (atributos vivos coordinados con D07)
- [ ] El foco no salta de forma inesperada al mostrar un error

---

## Veredicto

```
APROBADO      — catálogo completo, componentes verificados en ejecución
CONDICIONAL   — excepciones listadas, con dueño y fecha. Nunca con un P0
RECHAZADO     — vuelve a D06 con hallazgos clasificados
```

Firma el revisor (D14), **nunca** quien redactó el catálogo.
