# E1 · Cinco entregas completas (plan de alto impacto)

> D00 (Claude), 2026-10-04, a petición de Wilber: "prefiero cinco completas pero completas bien que noventa parciales;
> acciones de alto impacto, funcionales y robustas, con integración, y los perfiles bien asignados".
> Regla de esta etapa: **solo se abren cinco frentes; ningún otro se empieza hasta cerrar uno.** Un frente cuenta como
> hecho solo si cumple la definición de hecho de abajo entera. Estado en `npm run avance` (fase E1).

## 1. Por qué estas cinco (datos reales, no gusto)
Base: 648 leads, 184 negocios, 400 unidades, 12 brokers y 1 800 actividades ya sembrados; inventario AS-IS del CRM.

| # | Entrega | Qué se ve | Qué integra | Por qué ahora |
|---|---|---|---|---|
| E1.1 | **Pipeline** (kanban real) | 184 negocios en 7 etapas, mover/perder con reglas, lista, móvil por columnas | emite `NegocioCambioEtapa` al outbox (F2.5) | es el corazón de venta; hoy con SQL dentro de la página |
| E1.2 | **Leads** (tabla + inspector + línea de tiempo) | 648 leads con filtros, ficha con historial, WhatsApp/llamar, asignar/convertir | emite `LeadCreado`/`LeadAsignado` al outbox | mayor volumen de uso diario; hoy SQL en página |
| E1.3 | **Propiedades** (inventario) | 20 proyectos, 400 unidades por estado, matriz torre/piso, zona y Confotur | — (datos propios) | lo que el broker enseña al cliente |
| E1.4 | **Brokers** (ranking y perfil) | ranking real por volumen/cierres/conversión, perfil con pestañas y rendimiento | — | hoy es una tarjeta plana y perfil de solo lectura |
| E1.5 | **Integraciones** (Configuración) | salud de cada puerto, cola de salida (pendientes/fallidos), reintentar y descartar con motivo | `CrmPort`, outbox, DLQ; listo para Twenty | convierte la arquitectura en algo visible y operable |

Fuera de E1 (a propósito): Comisiones, Agenda, Academy, Rentas, Cotizaciones/Reservas, Twenty vivo. Entran en E2.

## 2. Definición de hecho (todas, sin excepción; si una falla, el frente NO está hecho)
1. Ficha en `spec/modulos/` con estado `READY` y `npm run spec:check` en verde.
2. Datos 100 % reales: cero cifras ni listas fijas en vista; lecturas migradas a `application/<modulo>/consultas.ts`.
3. `tsc` sin errores, `lint` sin errores, `npm test` verde, **`npm run test:db` verde** con pruebas de las consultas del frente.
4. **Prueba de mutación** de una regla clave del frente (se rompe a propósito y la prueba cae).
5. Seis estados (carga, vacío, error, sin conexión, éxito, permiso) visibles y probados.
6. Móvil 320/390 y escritorio 768/1440: **capturas** del orquestador con datos reales, sin scroll horizontal, sin subrayados ni siglas.
7. Permisos en servidor, Zod en entrada, RLS en tablas nuevas, auditoría de cada mutación; lo comprueban `seguridad.test.ts`/`arquitectura.test.ts`.
8. Accesibilidad: teclado y foco en lo interactivo; contraste AA de la paleta de gráficas.
9. Verificación independiente: QA con capturas de **otro proveedor** (Gemini) y revisión de diff + comandos del orquestador.
10. Commit en `develop` con productor, revisor y evidencia; frente marcado en `roadmap.json` con commit.

## 3. Pasos por frente (cada uno es una tarea acotada, ≤ 45 min de agente)
`a` Ficha → `b` Backend (consultas a `application/`, outbox, `test:db`) → `c` Frontend (patrón consola, Chart/Drawer/Tabs) →
`d` QA independiente con capturas y cierre. Orden de ejecución: ficha de los cinco (en paralelo) → **Pipeline + Integraciones** →
**Leads + Propiedades** → **Brokers**. Máximo 2 Codex y 1 Gemini a la vez.

## 4. Asignación de perfiles (estado real de proveedores, 4-oct)
Kimi y Grok **sin cuota** (sondas fallidas hoy). Operan Codex (gpt-6.1-sol / luna) y Gemini (antigravity). Claude orquesta y revisa.

| Paso | Perfil | Productor | Revisor independiente |
|---|---|---|---|
| a Ficha (alcance, criterios) | D01 + D02 | Codex Sol | `spec:check` + lectura del orquestador de §8 |
| a Contrato y límites | D03 | Codex Sol | Claude (decisión estructural → Wilber si cambia ARQ) |
| b Datos y consultas | D11 | Codex Sol | `test:db` + Claude (SQL) |
| b Casos de uso, rutas, outbox | D10 / D19 | Codex Sol | Claude (diff + guardas) |
| c Interfaz | D09 (+D05 diseño, D06 estados) | Codex Sol | Gemini D14 con capturas |
| c Diseño visual y componentes | D05 | Gemini (UX con capturas) | D07 (Codex) accesibilidad |
| d QA con navegador | D14 | Gemini | Claude (abre la pantalla con datos reales) |
| Seguridad (R2) | D12 | Codex (Grok no disponible) | Claude revisa el diff con el checklist de AGENTS.md |

**Limitación declarada:** con solo dos proveedores, "productor ≠ revisor" se cumple así: lo que produce Codex lo verifica Gemini
(comportamiento, capturas) y Claude (diff y comandos); lo que produce Gemini lo revisa Codex. Cuando Kimi/Grok vuelvan, D01/D05/D09
vuelven a Kimi y D12/D21 a Grok según `registry/provider-routing.json`.

## 5. Qué se reporta al cerrar cada frente (formato fijo)
Hecho / no hecho contra las 10 condiciones, con evidencia (commit, salida de comandos, capturas en
`.viltrum/vre-os/evidencia/E1/<frente>/`). Lo parcial se declara parcial y **no suma** en el avance.
