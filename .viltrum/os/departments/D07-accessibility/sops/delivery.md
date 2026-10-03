# D07 · Entrega de auditoría de accesibilidad

Versión 1 · 2026-09-29 · F3 con verificación de ejecución en F5 · revisor D14. D07 revisa D05; para D06 actúa como consultor, cuyo revisor de cierre es D14 según registry.

Leer `../AGENTS.md`, `../SOUL.md`, checklists locales y criterios normativos aplicables de WCAG 2.2 A/AA. Las recomendaciones AAA deben identificarse como tales; no se convierten en requisito AA por citarse. APG guía patrones de interacción; no es certificado de conformidad.

## Entradas y alcance

D04: recorridos/vistas/roles; D05: componentes, temas y composición; D06: estados y mensajes. Registrar versión/commit, rutas, procesos completos, idioma, dispositivo, navegador, tecnología asistiva, ambiente y permisos de prueba. Un diseño Figma permite revisar intención/contraste; HTML, teclado y anuncios reales requieren implementación. Cada criterio tiene resultado `cumple`, `incumple`, `no_aplica` o `no_verificado`, método y localizador.

## Procedimiento

1. **Plan de cobertura.** Priorizar procesos críticos y estados dinámicos, además de componentes compartidos. Incluir formularios, autenticación, modales, tablas, gráficos, documentos/media y componentes de terceros. Una muestra de rutas documenta alcance limitado; no declarar cumplimiento de todas las páginas o procesos con una muestra incompleta.
2. **Automatización.** Con axe-core o integración Playwright existente registrar versión, reglas/tags, URL, estado/rol y reporte sin omitir resultados `incomplete` que requieren juicio humano. No tomar cero infracciones como conformidad. No asignar un porcentaje universal de problemas detectables.
3. **Teclado y foco.** Ejecutar recorridos solo con teclado. Comprobar alcance, orden, foco visible, apertura/cierre y retorno desde overlays, ausencia de trampas y alternativas al arrastre. WCAG 2.4.11 AA exige que el componente con foco no quede totalmente oculto por contenido creado por autor; la exigencia de no ocultar ninguna parte corresponde a 2.4.12 AAA. Medir objetivos según 2.5.8 y sus excepciones.
4. **Lector de pantalla.** Con combinación real disponible documentar lector/navegador/OS y escuchar nombres, roles, estados, estructuras, orden y mensajes dinámicos. Verificar error, éxito, carga y cambios de página; DOM/ARIA inspeccionados sin lector quedan como revisión estructural, no prueba manual de anuncios.
5. **Percepción y adaptación.** Medir contraste según tipo y excepciones; registrar colores/ratio y tema. Verificar zoom 200%, reflow equivalente 320 CSS px con excepciones aplicables, espaciado de texto, orientación, contenido hover/foco y señales no basadas solo en color. Revisar subtítulos/descripciones o alternativas de media según el requisito. Movimiento reducido es práctica del proyecto; 2.3.3 es AAA y se etiqueta, mientras 2.2.2 y 2.3.1 tienen obligaciones A aplicables.
6. **Ayuda, formularios y autenticación.** Verificar labels e instrucciones, autocomplete de propósito cuando aplica, identificación/sugerencias de errores, confirmación de operaciones legales/financieras/datos, ayuda consistente, no repetir datos sin excepción y login compatible con ayudas. Un captcha o tercero requiere verificar alternativa en el proceso completo.
7. **Hallazgos y retest.** Por defecto registrar ID, criterio/nivel, componente/estado/rol, pasos, esperado/real, severidad, evidencia, dueño y propuesta. La severidad operativa y el incumplimiento normativo son campos distintos. Corrección va a D04/D05/D06/D09; retest de la misma versión y condiciones produce cierre verificable revisado por D14. Registrar todos los criterios no verificados.

## Salidas y handoff

`.viltrum/design/accessibility-plan.md`, `accessibility-matrix.md`, `accessibility-findings.md`; reportes automáticos y registros manuales enlazados en `.viltrum/departments/D07-accessibility.md`. El paquete declara alcance, excepciones, herramientas, versión y pendientes; un resultado parcial no autoriza una declaración pública de conformidad.

**D05** recibe revisión del diseño; **D06/D09** reciben hallazgos aplicables; **D14** recibe evidencia y revisa cierre independiente; **D00** decide avance de gates con ese paquete. Una auditoría externa o VPAT contractual requiere especialista con alcance acordado, sin atribuir capacidad legal al agente.

## Checklist de aceptación

- [ ] Alcance, procesos completos, versión y combinaciones de navegador/lector están explícitos.
- [ ] Reporte automático conserva reglas y pendientes de revisión humana.
- [ ] Teclado y lector tienen evidencia ejecutada o estado no verificado, sin sustituirlos por capturas.
- [ ] Contraste, foco, zoom, reflow, formularios y estados se relacionan con criterio y nivel correctos.
- [ ] Cada hallazgo es reproducible, asignado y retesteable; severidad separada del resultado WCAG.
- [ ] Criterios no aplicables incluyen motivo; los no verificados permanecen visibles.
- [ ] D14 revisa cierre y limitaciones; una declaración de conformidad solo se considera con alcance y requisitos normativos satisfechos.

## Dependencias y delegación

axe-core y `@axe-core/playwright` son candidatos reales, no instalados por este protocolo. Requieren paquete/runtime compatible y una aplicación accesible. NVDA/VoiceOver u otro lector exige dispositivo y acceso operativo; si falta, registrar pendiente y escalar al revisor. Un plugin Figma no sustituye pruebas con lector del producto.

Delegar `a11y-scan-batch` para lotes de rutas/estados con versión y roles acotados; recibir informes completos, incluidos `incomplete`. El agente principal deduplica por causa manteniendo ocurrencias. Verificación manual asistiva requiere especialista cuando no hay herramientas o experiencia suficiente; evaluación con personas con discapacidad aporta evidencia de uso, sin sustituir cobertura normativa. D00 limita concurrencia; D14 conserva revisión independiente.

## Fuentes oficiales consultadas el 2026-09-29

- [W3C · WCAG 2.2](https://www.w3.org/TR/WCAG22/).
- [W3C · ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/).
- [Deque · axe-core](https://github.com/dequelabs/axe-core).
- [Playwright · Accessibility testing](https://playwright.dev/docs/accessibility-testing).
