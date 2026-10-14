---
name: alcance-completo
description: Convierte una petición corta ("haz un botón de registrarse", "agrega asesores", "habilita idiomas") en el alcance completo que un equipo profesional entregaría — pantallas, estados, roles, datos, seguridad, administración, integraciones, pruebas y lo que queda fuera — antes de diseñar o construir. La invoca el router (`core/routing.md`) después de la capa de mandato y antes de D02/D03, siempre que la petición nombre una funcionalidad y no un cambio puntual; entrega también la matriz de impacto por departamento (`module-impact-matrix.md`).
---

# Alcance completo

Una petición corta nombra la punta de una funcionalidad. El trabajo de este paso es encontrar el resto antes
de que lo encuentre el usuario final. Sin este paso se entrega "media función" (antipatrón señalado por Wilber).

## Procedimiento
1. **Identifica el arquetipo** en `archetypes.md` (identidad, módulo CRUD con asignación, roles y permisos,
   idioma, componente móvil, taxonomía de CMS, asistente IA, medios, pagos y cobros). Una petición puede activar varios.
2. **Verifica el estado real** en el código (P3): qué existe ya de cada punto del arquetipo, con archivo:línea.
3. **Investiga cómo lo hace el software real** (D21): al menos dos productos o repos de referencia con URL,
   y estándares aplicables (OWASP ASVS, WCAG 2.2, RFC, guías de plataforma). Lo que no esté en el arquetipo
   pero aparezca en la referencia se añade.
4. **Expande por las ocho caras** de cada capacidad:
   | Cara | Pregunta |
   |---|---|
   | Usuario final | ¿Qué pantallas, flujos y los seis estados (carga, vacío, error, sin conexión, éxito, permiso)? |
   | Administración | ¿Qué ve, crea, edita, aprueba, exporta y audita el equipo en el CMS? |
   | Datos | ¿Qué entidades, relaciones (3FN), catálogos en vez de texto libre, borrado lógico, auditoría? |
   | Permisos | ¿Quién puede qué, verificado en servidor y en base de datos, configurable sin código? |
   | Seguridad y privacidad | ¿Abuso, límites, secretos, datos personales, consentimiento, retención, exportación y borrado? |
   | Integraciones | ¿Correo, OAuth, CRM futuro, analítica, webhooks — detrás de un puerto propio (P1)? |
   | Idioma y accesibilidad | ¿Textos desde catálogo, todos los idiomas abiertos, teclado, lector de pantalla, objetivos táctiles? |
   | Calidad | ¿Pruebas unitarias, de contrato, E2E por rol y móvil; métricas; criterios de aceptación verificables? |
5. **Llena la matriz de impacto** (`module-impact-matrix.md`): etapa vigente, efectos externos (contenido/CMS, base de datos y
   datos existentes, funciones, integraciones, permisos, idioma/SEO, analítica, correos, soporte, rollback, legal/fiscal/financiero,
   secretos y cuentas externas; el productor añade los que falten) y la fila de cada
   departamento D01..D22 con su entrega para este módulo. Un `N/A` lleva razón con evidencia; la profundidad depende del riesgo (R0-R1 reducida, R2+ completa).
6. **Separa** lo que entra en esta entrega (MVP completo, no mínimo roto), lo que entra después y lo que
   requiere decisión humana (H1–H10). Nada queda "implícito".
7. **Escribe la especificación** con la plantilla de abajo y pásala a D02 (alcance) y D03 (arquitectura).
   El revisor debe ser otro proveedor. El módulo se cierra por rebanadas (sección 4 de la matriz), no por sensación.

## Plantilla de salida
```
# <Funcionalidad> — alcance completo
Arquetipos: ...   Referencias: <producto/repo/estándar con URL>
Etapa vigente y rebanadas: <cabecera de module-impact-matrix.md>
## Existe hoy (archivo:línea)
## Requisitos (RF-nn) con criterio de aceptación verificable
## Pantallas y estados (usuario / administración) — tabla pantalla × 6 estados
## Modelo de datos (entidades, relaciones, catálogos, auditoría)
## Matriz de permisos (rol × acción, dónde se verifica)
## Seguridad, privacidad y abuso
## Integraciones y puertos
## Efectos externos y matriz D01..D22 (module-impact-matrix.md, secciones 2-3)
## Pruebas (unitarias, contrato, E2E por rol, móvil, accesibilidad)
## Fuera de esta entrega / decisiones humanas
## Handoff (D02, D03, revisor) + cierre por rebanada (matriz, sección 4)
```

## Criterio de salida
Un revisor que lea solo la especificación puede listar todas las pantallas, tablas, permisos y pruebas sin
preguntar. Si el revisor encuentra una cara sin cubrir, un efecto externo (incl. legal/fiscal y secretos/cuentas) sin `sí` o `N/A` con razón o un departamento sin fila,
la especificación vuelve al productor.
