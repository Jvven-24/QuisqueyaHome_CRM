---
id: G20
sistema: Normalización de cabeceras, pestañas y secciones + flag de UI demo
estado: READY
riesgo: R1
owner: Wilber (pedido directo 27/10/2026, fase 3 orquestación)
actualizado: 2026-10-27
---
# G20 · Normalización UI (PageHeader / ModuleTabs / Section) y UI demo tras flag
Alcance permitido: src/components/modulo/**, src/lib/flags.ts(+test), src/app/(crm)/** EXCEPTO tareas/** y archivos de auth/login/correo.
Sin cambios de rutas, datos, permisos ni migraciones. Es refactor visual, no función nueva. Pruebas: node22 --test, tsc.
