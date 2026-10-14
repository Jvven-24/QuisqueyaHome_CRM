# D06 · Entrega de estados y resiliencia de experiencia

Versión 1 · 2026-09-29 · F3 · revisor D14; D07 consulta accesibilidad. Leer `../AGENTS.md`, `../SOUL.md`, `../../../core/doctrine/ux-states.md`, contratos de API y políticas D12 de datos/borradores.

## Entradas

D04: vistas, roles, recorridos, errores y datos. D05: componentes/composición. D10/D19: códigos de error, garantías de idempotencia, cancelación, límites y timeouts definidos o propuestos. D11/D12: conflictos, retención, datos sensibles y sesión. No deducir éxito de una animación ni idempotencia de bloquear el botón.

En F3 se entrega comportamiento y escenarios reproducibles. Tras F4 se ejecutan en ambiente autorizado y D14 revisa el resultado en F5. No afirmar estados verificados en ejecución con solo un prototipo.

## Procedimiento

1. **Matriz trazable.** Por vista y acción, registrar los seis estados, disparador, precondición, señal visual/textual, anuncio accesible, datos preservados, acción disponible y salida. Justificar `no_aplica` con requisito y explicación; no dejar celdas vacías. Añadir estados parciales y por fila/archivo además del estado global.
2. **Transiciones.** Especificar origen → evento → destino, respuesta antigua, cancelación y prioridad cuando coinciden error, carga y permiso. Definir qué pasa al navegar, recargar o repetir acción. En cargas largas distinguir progreso real de indeterminado y no prometer cancelación que el backend no soporta.
3. **Errores y recuperación.** Catálogo estable con código interno, tipo, mensaje humano, acción, dueño y referencia de soporte sin stack ni datos privados. Validación incluye resumen enlazable y foco; 429 respeta espera declarada; 5xx y fallos parciales mantienen datos permitidos. Timeouts de escritura pueden tener resultado desconocido: consultar estado antes de reintentar si falta idempotencia.
4. **Red y consistencia.** Declarar si existe soporte offline real. Sin él, mostrar última actualización y restricción de acciones; no añadir cola automática. Si existe cola, definir persistencia permitida, estado visible, orden, deduplicación, expiración, conflictos, cancelación y sincronización. D10/D19/D11 deciden contratos de reintento e integridad, D06 los presenta.
5. **Sesión y permisos.** Reautenticación recupera borradores solo conforme a política D12. No conservar contraseñas, tokens de sesión ni campos sensibles prohibidos; en revocación o cierre limpiar datos a los que ya no se tiene acceso. Mostrar restricción sin filtrar recursos o nombres privados. El servidor autoriza siempre, y una UI deshabilitada no prueba el control.
6. **Mutaciones y concurrencia.** Distinguir actualización optimista de confirmación del servidor; revertir con explicación al rechazo. Pago, publicación y otras acciones de alto impacto usan confirmación verificable. Deshacer necesita contrato real y ventana explícita. Ante conflicto, versión/ETag o regla acordada evita sobrescritura; las reglas ausentes vuelven a D01/D11.
7. **Escenarios de comprobación.** Preparar fixtures por error 4xx/5xx, latencia, desconexión, respuesta fuera de orden, doble envío, cierre de pestaña, sesión vencida, permiso revocado y cambio concurrente. D14 ejecuta o revisa ejecución tras implementación con datos sintéticos y sin afectar producción. Captura, resultado esperado/real y estado quedan vinculados a la matriz.

   **Trazabilidad por estado** (una fila por estado aplicable; `N/A` requiere justificación):

   | Matriz (pantalla/estado) | Story / test | Fixture MSW | Clasificación | Esperado | Real | Evidencia de ejecución |
   |---|---|---|---|---|---|---|
   | `<referencia>` | `<ID / ruta>` | `<ID / ruta o N/A>` | `mock` / `backend real` | `<resultado>` | `<resultado o pendiente>` | `<ruta / captura / log o pendiente>` |

   MSW verifica el comportamiento de interfaz con respuestas simuladas; clasificarlo como `mock`, no como backend real. Usar `backend real` solo cuando la ejecución alcanzó un servicio real autorizado; registrar por separado cada nivel y no presentar una simulación como verificación de servidor.

## Salidas y handoff

`.viltrum/design/states-matrix.md`: matriz y transiciones. `error-catalog.md`: mensajes/códigos/acciones. `state-verification-plan.md`: disparadores y fixtures. Tras ejecución, enlazar reportes en `.viltrum/departments/D06-ux-states.md`, distinguiendo especificado, implementado, ejecutado y revisado.

Entregar comportamiento a **D05/D09**, requisitos contractuales a **D10/D11/D19**, textos a **D08**, barreras a **D07** y paquete de revisión a **D14**. D00 conserva gates; una dependencia de integridad sin resolver bloquea ese flujo.

## Checklist de aceptación

- [ ] Matriz cubre todas las vistas/acciones y seis estados con referencias o inaplicabilidad razonada.
- [ ] Errores tienen recuperación, datos preservados permitidos y anuncio/foco definido.
- [ ] Timeout, reintentos, cola offline y deshacer reflejan garantías reales del contrato.
- [ ] Sesión vencida y permiso revocado protegen borradores, secretos y recursos inaccesibles conforme a D12.
- [ ] Conflictos y respuestas fuera de orden tienen comportamiento definido o pregunta bloqueante asignada.
- [ ] Plan reproduce estados con fixtures seguros; ejecuciones pendientes no aparecen como aprobadas.
- [ ] D14 revisa de forma independiente la evidencia ejecutada para G5; D07 revisa anuncios y navegación.

## Herramientas, límites y delegación

Playwright puede simular red y emular offline si está disponible con runtime, paquetes y navegadores. Un navegador manual puede verificar desconexión pero no demostrar garantías del servidor. Service workers pueden requerir configuración explícita en el entorno de pruebas para interceptar tráfico; conservar configuración original. No inyectar fallos a producción. Sin entorno ejecutable entregar plan y marcar evidencia pendiente.

Delegar `state-scenario-runner` para conjuntos independientes de escenarios en sandbox con fixtures y límites de limpieza; devuelve captura/log, esperado/real y recurso afectado. Solicitar especialista D10/D11 ante transacciones, colas o concurrencia; D12 ante sesión/retención; D07 ante tecnología asistiva. D06 consolida comportamiento y D14 mantiene revisión independiente.

## Fuentes oficiales consultadas el 2026-09-29

- [Playwright · Network](https://playwright.dev/docs/network) para interceptar y simular respuestas.
- [Playwright · Emulation](https://playwright.dev/docs/emulation) para red offline y preferencias.
- [W3C · ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/) para interacción de componentes.
