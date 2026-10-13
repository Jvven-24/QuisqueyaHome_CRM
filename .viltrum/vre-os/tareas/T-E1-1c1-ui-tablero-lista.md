# T-E1-1c1 · Negocios: interfaz de Tablero, Lista y Análisis (6 estados, móvil, gráficas)

Ficha: M03

Perfil: **D09 Frontend** (skill `patron-consola`). Productor: Codex (gpt-6.1-sol, HAPI). Revisión independiente: Antigravity (D14, capturas) + D07 accesibilidad + orquestador con comandos.
Ficha: `M03-negocios.md` (READY) §3 «Contrato común», SCR-NEG-TABLERO, SCR-NEG-LISTA, matriz de seis estados; CA-01, 02, 15, 16, 17, 18, 19. Diseño: `.viltrum/vre-os/design/DS-1-negocios-leads.md`, `docs/DESIGN.md`, `D05-graficas-movil.md`.
Requisito previo: T-E1-1b1 y T-E1-1b2 entregadas y en verde. Sin eso, para y avisa.
Modo: fix, escribes código en `src/app/(crm)/negocios/**` y componentes propios que necesites. **Sin git, sin commit, sin `npm run dev`/`build`**, sin tocar la VPS ni `.env*`. Máximo 45 min.

## Qué construir
1. Tabs **Tablero · Lista · Análisis** con filtro de resultado Todos · Activos · Venta cerrada · No concretado; las siete etapas salen del catálogo (nada fijo en la vista).
2. **Tablero:** columnas por etapa con conteo y suma **por divisa**, tarjetas (contacto, proyecto/rango, responsable, monto autorizado, antigüedad en etapa, próxima acción). **Mover sin arrastre obligatorio** (menú «Mover a…» accesible con teclado) además del arrastre; mover con reglas de etapa muestra el error en su sitio y no cambia nada.
3. **Lista:** tabla semántica en ≥768 px, **tarjetas apiladas** en 320/390 (nunca tabla con scroll horizontal), orden estable, paginación por cursor, filtros en Drawer en móvil.
4. **Análisis:** `ChartCard` con conteos por etapa, valor ponderado, antigüedad y cierre/pérdida, desde `resumirNegocios`; sin serie real, «Sin datos» (jamás probabilidades ni históricos inventados). Alternativa en tabla accesible para cada gráfica; paleta AA.
5. **Seis estados reales** en cada superficie (carga con esqueleto y `aria-busy`, vacío distinguiendo cartera vacía de filtros sin resultados, error con reintento, sin conexión que no envía mutaciones ni anuncia guardado, éxito con foco/aviso, permiso insuficiente) según la matriz de §3. Formularios: obligatorio marcado, botón nunca deshabilitado sin motivo, error en su campo (contrato R1–R8 de `core/doctrine/ux-states.md`).
6. Teclado y foco: todo operable sin ratón, foco visible y devuelto al cerrar, objetivos ≥48×48 px, texto ≥13 px, `prefers-reduced-motion`. Sin «Pipeline», sin confeti, sin Confotur incondicional ni hitos 10/40/50, sin datos de adorno.
7. Reutiliza primitivas locales (`Card`, `Tabs`, `ChartContainer`, `Drawer`, `estados.tsx`, `cargando.tsx`); antes de crear un componente nuevo, busca en la galería PXIL y registra por qué no sirve el existente. Nada de lógica de negocio en el componente.

## Pruebas obligatorias
- Pruebas de render/estado con el patrón existente (`analitica.test.ts`, `estados.tsx`) para cada uno de los seis estados y para los textos visibles (inventario de copy sin «Pipeline»).
- Guarda anti-hardcode vigente en verde; guardas de arquitectura sin debilitar.
- No ejecutas el servidor: las capturas 320/390/768/1440 las toma el orquestador/Antigravity después.

## Hecho cuando (pega la salida real)
`npm run typecheck` · `npm run lint` · `npm test` · `npm run test:db` · `npm run spec:check` sin errores nuevos.

## Entrega
`.viltrum/vre-os/evidencia/E1/negocios/D09-c1-tablero-lista.md`: archivos tocados, decisiones, salida de los cinco comandos, qué falta por capturar/verificar. Termina con `ESTADO: ENTREGADO` o `ESTADO: BLOQUEADO — motivo`.
