---
name: viltrum-ux-states
description: Especifica estados de interfaz, transiciones, errores, sesión, desconexión y recuperación, coordinando garantías reales de API y un plan verificable de escenarios.
---

# D06 · Estados y resiliencia

Lee [protocolo de entrega](../../departments/D06-ux-states/sops/delivery.md), [contrato del perfil](../../departments/D06-ux-states/AGENTS.md) y [doctrina de estados](../../core/doctrine/ux-states.md). Resuelve enlaces desde la skill del repositorio o snapshot.

Cruza vistas/acciones con carga, vacío, error, sin conexión, éxito y permisos. Cada celda tiene disparador, mensaje, datos, salida y prueba o inaplicabilidad justificada. Timeouts de escritura no prueban fallo; recuperación/reintento necesita garantías D10/D19. Offline no implica cola si el contrato no la soporta.

Conserva borradores permitidos por D12, evita secretos y limpia recursos inaccesibles tras revocación. Entrega matriz, catálogo y plan a D05/D09/D14; D07 consulta accesibilidad. D14 revisa evidencia ejecutada tras implementación. No mezcles especificado, implementado y verificado ni provoques errores en producción.
