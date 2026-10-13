# T-E1-1c2 · Negocios: ficha 360, diálogos de pérdida/cierre y revisión de propuestas

Ficha: M03

Perfil: **D09 Frontend** (skill `patron-consola`) con D06 estados. Productor: Codex (gpt-6.1-sol, HAPI). Revisión independiente: Antigravity (D14) + D12 permisos + orquestador.
Ficha: `M03-negocios.md` (READY) §3 SCR-NEG-FICHA y «Diálogos de transición», CA-07, 08, 10, 11, 12, 14, 15, 16, 17. Requisito previo: b1, b2 y c1 entregadas y en verde; si no, para y avisa.
Modo: fix en `src/app/(crm)/negocios/**` (+ rutas/acciones que haga falta para consumir b2). **Sin git, sin commit, sin `npm run dev`/`build`**, sin `.env*`. Máximo 45 min.

## Qué construir
1. **Ficha** en inspector (400–440 px en escritorio) / hoja inferior en móvil, con tabs **Resumen · Seguimiento · Propiedades**: línea de tiempo semántica con actor y fecha, intereses con principal y baja lógica (nunca borrar), próxima acción, nota (vía M06). Documentos: solo el enlace de proyecto ya autorizado, sin KYC ni subida.
2. **Diálogo No concretado:** motivo activo del catálogo + comentario no en blanco; un error conserva lo escrito; éxito «Negocio no concretado, archivado» y contacto accesible.
3. **Diálogo de cierre:** resumen, monto comercial, selector **Elegir unidad / Crear unidad** dentro del proyecto autorizado; unidad obligatoria; el **409 de doble venta** se muestra saneado y deja el negocio abierto.
4. **Propuestas del asistente:** el asistente envía una propuesta sin efectos (estado «pendiente», caduca a 7 días); cualquier admin activo distinto del autor aprueba o rechaza con **motivo obligatorio** desde la ficha; broker y asistente no resuelven; una propuesta pendiente nunca se muestra como cambio aplicado.
5. Por rol: el broker ve/edita su monto comercial; el precio real y la comisión de terceros **no existen** en el DOM/RSC del broker ni del asistente.
6. Seis estados en ficha y diálogos, `409` por conflicto, sesión expirada conserva solo la entrada no publicada, proveedor externo caído muestra «sincronización pendiente» sin impedir trabajar. Foco devuelto, Esc cierra, trampa de foco correcta en diálogos, sin doble envío (botón en ocupado + guarda).

## Pruebas obligatorias
- Render/estado por rol (admin/broker/asistente) con valores centinela: ausencia de precio real y comisión de terceros en la salida del broker/asistente.
- Doble clic en confirmar no duplica la operación; diálogo conserva el estado ante error; propuesta pendiente ≠ aplicada.
- Guardas de arquitectura/seguridad en verde.

## Hecho cuando (pega la salida real)
`npm run typecheck` · `npm run lint` · `npm test` · `npm run test:db` · `npm run spec:check` sin errores nuevos.

## Entrega
`.viltrum/vre-os/evidencia/E1/negocios/D09-c2-ficha-dialogos.md` con archivos tocados, decisiones, salida de los comandos y lo no verificado. Termina con `ESTADO: ENTREGADO` o `ESTADO: BLOQUEADO — motivo`.
