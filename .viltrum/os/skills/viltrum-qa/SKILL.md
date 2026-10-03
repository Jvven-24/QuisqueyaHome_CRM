---
name: viltrum-qa
description: Diseña y verifica cobertura por riesgo, contratos, recorridos E2E y estados de interfaz con resultados reproducibles.
---

# QA funcional, E2E y bug hunting · D14

Localiza la raíz del OS Viltrum: este repositorio o el snapshot instalado en `.viltrum/os/`. Lee `departments/D14-qa/AGENTS.md`, `SOUL.md` y `manifest.yaml`; ejecuta [el protocolo específico](../../departments/D14-qa/sops/delivery.md) de esa raíz. `delivery.json` declara entradas, salidas, checks, capacidades y delegaciones opcionales.

Carga solo la sección/artefacto de proyecto necesario. Comprueba mandato, fase, herramientas accesibles y evidencia antes de ejecutar. El revisor es D00; conserva la autonomía del manifest y aprobación humana de producción. Si el snapshot no contiene el protocolo, registra versión incompleta y localiza el paquete fuente antes de afirmar cobertura.

Entrega artefactos y evidencia real con hallazgos, no ejecutados y handoff; no convertir instalación de esta skill en aprobación del proyecto ni permiso para adquirir herramientas/accesos.

