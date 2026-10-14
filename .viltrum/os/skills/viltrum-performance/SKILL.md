---
name: viltrum-performance
description: Mide capacidad y experiencia contra presupuestos acordados, diseña carga segura y traduce límites medidos a arquitectura y SLO.
---

# Rendimiento, carga y confiabilidad · D15

Localiza la raíz del OS Viltrum: este repositorio o el snapshot instalado en `.viltrum/os/`. Lee `departments/D15-performance/AGENTS.md`, `SOUL.md` y `manifest.yaml`; ejecuta [el protocolo específico](../../departments/D15-performance/sops/delivery.md) de esa raíz. `delivery.json` declara entradas, salidas, checks, capacidades y delegaciones opcionales.

Carga solo la sección/artefacto de proyecto necesario. Comprueba mandato, fase, herramientas accesibles y evidencia antes de ejecutar. El revisor es D03; conserva la autonomía del manifest y aprobación humana de producción. Si el snapshot no contiene el protocolo, registra versión incompleta y localiza el paquete fuente antes de afirmar cobertura.

Entrega artefactos y evidencia real con hallazgos, no ejecutados y handoff; no convertir instalación de esta skill en aprobación del proyecto ni permiso para adquirir herramientas/accesos.

## Procedimiento de performance UX

Usa `departments/D15-performance/checklists/performance-budget.md` como checklist y registro por pantalla. Antes de medir, anota pantalla, ruta, build/versión, límites y evidencia esperada. Identifica la imagen candidata a LCP y priorízala; no la difieras. Define tamaños responsive de imagen para los dispositivos previstos, difiere recursos fuera del viewport inicial cuando corresponda y reserva dimensiones para evitar CLS.

En cada corrida registra explícitamente:

- **Fuente:** herramienta o sistema que produjo los datos y su versión, si se conoce.
- **Muestra:** cantidad de cargas/usuarios observados y periodo de captura.
- **Dispositivo y red:** modelo/clase de dispositivo, viewport y condiciones de red usadas.
- **Tipo de medición:** laboratorio o campo (RUM); no presentes laboratorio como resultado de campo.
- **Artefactos:** ruta o enlace al reporte y a la serie temporal/capturas que respaldan la medición.

Marca `(no verificado)` los datos de herramienta o entorno que no hayas podido comprobar. Compara mediciones solo bajo condiciones equivalentes y contra los límites declarados; conserva por separado las corridas de laboratorio y los datos de campo. La revisión y firma corresponden a D03, no al productor.
