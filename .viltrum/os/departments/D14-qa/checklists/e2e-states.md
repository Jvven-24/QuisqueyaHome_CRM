# Checklist — verificación E2E de los seis estados

> Se aplica a toda pantalla y acción de un recorrido crítico. Verificado en el sistema
> **corriendo**, no en el diseño. Un estado que solo existe en Figma no cuenta.
> Firma D00 (puerta), nunca quien escribió las pruebas.

## A. Carga

- [ ] *Skeleton* o indicador aparece en carga inicial, con prueba que lo captura
- [ ] Acción con carga muestra indicador dentro del control y bloquea doble envío — probado enviando dos veces rápido
- [ ] Carga con progreso conocido muestra el porcentaje real, no uno simulado
- [ ] Sincronización de fondo no bloquea la interacción con el resto de la pantalla

## B. Vacío / sin datos

- [ ] Primera vez sin datos explica para qué sirve la pantalla, con texto real verificado
- [ ] Lista vacía tras filtrar conserva los filtros aplicados — probado aplicando y verificando que siguen visibles
- [ ] Búsqueda sin resultados sugiere qué cambiar, no solo "sin resultados"
- [ ] Elemento archivado o eliminado muestra su estado y ruta de recuperación si existe

## C. Error

- [ ] Error de campo: **lo escrito se conserva** — probado provocando el error y verificando que el valor sigue en el campo
- [ ] Error general de formulario: resumen accesible con enlace a cada campo afectado
- [ ] Error de servidor: mensaje humano y código de referencia visibles, sin traza técnica expuesta
- [ ] Timeout: mensaje específico, sin duplicar la acción al reintentar
- [ ] Error parcial: lo que cargó bien permanece visible; solo lo que falló se marca
- [ ] Sesión expirada durante una acción: contenido se conserva, se solicita acceso, se vuelve al punto exacto
- [ ] 404: ofrece ruta útil, no una página en blanco
- [ ] 500: no expone detalle interno del sistema

## D. Sin conexión

- [ ] Sin internet muestra página propia del sistema, no el error genérico del navegador — probado con la red desconectada en el test
- [ ] Reconexión detectada y comunicada
- [ ] Dato desactualizado indica cuándo fue la última sincronización
- [ ] Cola offline (si aplica) indica qué queda pendiente de enviar

## E. Éxito

- [ ] Confirmación específica y no solo un color — probado verificando el texto, no solo un indicador visual
- [ ] Acción reversible ofrece deshacer, funcional (probado deshaciendo)
- [ ] Acción irreversible pide confirmación reforzada — probado que no ejecuta con un solo clic accidental
- [ ] Estado final visible y persiste tras recargar la página

## F. Permisos

- [ ] Elemento sin permiso de lectura no aparece, o aparece deshabilitado con explicación — verificado con sesión de un rol sin ese permiso
- [ ] Acción sin permiso deshabilitada con razón visible — **y también bloqueada en servidor**, probado llamando el endpoint directo con ese rol
- [ ] Permiso revocado a mitad de sesión degrada la interfaz sin romperla — probado revocando y repitiendo la acción

---

## Veredicto

```
APROBADO      — los seis estados verificados en ejecución, con prueba por cada ítem marcado
CONDICIONAL   — estados P2/P3 pendientes con dueño y fecha. Nunca el estado de error o permisos
RECHAZADO     — vuelve al departamento dueño con hallazgos clasificados
```

Firma D00. Un ítem marcado sin prueba que lo respalde se trata como no verificado.
