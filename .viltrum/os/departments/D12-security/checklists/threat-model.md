# Checklist — modelo de amenazas (STRIDE por entrada)

> Se aplica a todo sistema R2 o superior, y a cualquier punto de entrada nuevo en un
> sistema existente. Una entrada sin su STRIDE completo es una entrada sin modelar.
> Firma el revisor humano.

## A. Inventario de entradas (prerrequisito)

- [ ] Todo formulario público listado
- [ ] Todo endpoint de API listado, con verbo y autenticación
- [ ] Todo webhook entrante listado, con quién lo firma y cómo se verifica
- [ ] Todo panel administrativo listado, con roles que lo alcanzan
- [ ] Toda integración de terceros listada, con qué datos entran y salen
- [ ] Todo job o cola programada listada, con qué dispara su ejecución

**Sin este inventario completo, el STRIDE que sigue es incompleto por definición.**

## B. Por cada entrada — Spoofing (suplantación)

- [ ] ¿Puede alguien autenticarse como otro usuario? Verificado que no
- [ ] ¿Puede un sistema externo hacerse pasar por el webhook legítimo? Firma/secreto verificado
- [ ] Identidad de servicio a servicio verificada (API key, mTLS, JWT firmado), no solo por IP de origen
- [ ] Control mitigante documentado, o hallazgo abierto con severidad

## C. Por cada entrada — Tampering (alteración)

- [ ] ¿Puede alterarse un dato en tránsito? TLS obligatorio, verificado
- [ ] ¿Puede alterarse un dato en reposo sin detectarse? Integridad verificada (checksum, firma, o restricción de base de datos)
- [ ] ¿Puede manipularse un parámetro (precio, cantidad, rol) desde el cliente? Recalculado y validado en servidor
- [ ] Control mitigante documentado, o hallazgo abierto con severidad

## D. Por cada entrada — Repudiation (repudio)

- [ ] ¿Queda registro de quién hizo la acción, cuándo y desde dónde?
- [ ] ¿El registro es editable por quien lo genera? Si sí, es un hallazgo
- [ ] Acciones irreversibles (borrar, pagar, publicar, cambiar permiso) dejan rastro verificable
- [ ] Control mitigante documentado, o hallazgo abierto con severidad

## E. Por cada entrada — Information disclosure (divulgación)

- [ ] ¿Puede un usuario ver un dato que no le corresponde? Prueba que lo intenta y falla
- [ ] Mensajes de error no revelan información interna (rutas, versión, estructura de datos)
- [ ] Respuestas de API no incluyen campos que el rol no debe ver
- [ ] Metadatos de archivos subidos no exponen información sensible (EXIF, rutas locales)
- [ ] Control mitigante documentado, o hallazgo abierto con severidad

## F. Por cada entrada — Denial of service (denegación de servicio)

- [ ] Límite de tasa por cliente/IP definido y probado
- [ ] Tamaño máximo de payload limitado
- [ ] Consulta costosa identificada y protegida (paginación obligatoria, límite de resultados)
- [ ] Recurso compartido (cola, conexión de base de datos) protegido contra agotamiento por un solo cliente
- [ ] Control mitigante documentado, o hallazgo abierto con severidad

## G. Por cada entrada — Elevation of privilege (escalamiento de privilegio)

- [ ] Rol bajo no puede alcanzar una acción de rol alto cambiando un parámetro o la ruta
- [ ] Verificación de permiso ocurre en cada capa que importa (API, servicio, base de datos), no solo una vez al principio
- [ ] Un usuario no puede asignarse a sí mismo un rol superior
- [ ] Prueba que intenta el escalamiento y falla
- [ ] Control mitigante documentado, o hallazgo abierto con severidad

## H. Consolidación

- [ ] Cada amenaza identificada tiene severidad (P0–P3), control (existente o pendiente) y dueño
- [ ] Las amenazas sin control existente tienen plan y fecha, o riesgo aceptado por escrito
- [ ] El modelo se revisó de nuevo la última vez que el sistema ganó una entrada nueva
- [ ] El modelo se comparte con D14 para que sus pruebas de permisos lo cubran

---

## Veredicto

```
APROBADO      — STRIDE completo en todas las entradas, con evidencia
CONDICIONAL   — amenazas de severidad P2/P3 con plan y dueño. Nunca P0/P1 sin mitigar
RECHAZADO     — inventario de entradas incompleto, o amenaza crítica sin control ni plan
```

Firma el revisor humano. Un modelo de amenazas que solo enumera categorías sin analizar
cada entrada real no cuenta como hecho.
