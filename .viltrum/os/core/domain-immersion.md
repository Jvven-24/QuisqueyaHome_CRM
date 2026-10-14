# Inmersión de dominio — cada perfil se vuelve experto en el negocio del proyecto

> Los perfiles saben trabajar (doctrina, contratos, checklists). Al iniciar un proyecto, además deben saber **de qué trata ese negocio**:
> qué espera su mercado, cómo lo resuelven los mejores, qué riesgos tiene y qué necesitan para trabajarlo. Sin esto, el alcance, el diseño
> y las pruebas son correctos pero genéricos. La inmersión ocurre antes de sembrar el mapa maestro y se refresca cuando el proyecto cambia.

## Cuándo
- Al iniciar un proyecto (después de G0 y antes de cerrar requisitos y mapa).
- Al cambiar de forma material: nueva vertical, nuevo país o mercado, nueva integración, rediseño, cambio de marca.
- Cada perfil declara su propio disparador de refresco (`refresh` en `registry/domain-immersion.json`).

## Qué produce
| Artefacto | Dónde | Qué contiene |
|---|---|---|
| Perfil del dominio | `.viltrum/expertise/DOMINIO.md` | vertical, tipo de producto, mercado/país, audiencias, marca, competidores, normativa, glosario |
| Expediente por departamento | `.viltrum/expertise/Dxx.md` | respuestas a sus preguntas, investigación con fuentes, expectativas del mercado, riesgos, propuesta concreta para el proyecto |
| Capacidades necesarias | `.viltrum/capabilities.json` | qué skill/herramienta/conexión/acceso/stack necesita cada perfil, con estado `available`, `missing` o `unknown`, cómo se comprobó y quién debe resolverlo |
| Síntesis para Wilber | `.viltrum/expertise/EXPERTISE.md` | lo esencial del negocio en lenguaje simple, lo que el mercado espera y nosotros daremos de más, y "lo que decides tú" |

## Profundidad
- **Profunda** (perfiles de producto: requisitos, alcance, UX, UI, contenido, datos del negocio, IA): se vuelven expertos del vertical.
- **Adaptada** (transversales: seguridad, QA, DevOps, observabilidad, documentación): ajustan su foco al riesgo del dominio (p. ej. pagos → PCI y conciliación;
  datos personales → Ley 172-13 y retención; inmobiliaria → fichas, precios y cumplimiento antilavado si aplica).

## Reglas
- Cada afirmación del expediente lleva fuente o se marca `(no verificado)`. Los competidores y sitios de referencia se citan con URL.
- La inmersión **no** inventa alcance: lo que el mercado espera entra al mapa como requisito propuesto con prioridad, y Wilber decide.
- Las capacidades `missing` no se instalan solas: se listan con costo y licencia, y adoptar herramientas externas sigue `buy-vs-build` y la decisión humana.
- Los paquetes de dominio reutilizables (`departments/D01-discovery/domain-packs/`) se alimentan de las inmersiones: lo aprendido en un proyecto sirve al siguiente.
- Modelo barato primero: la inmersión de cada perfil corre con el modelo pequeño (`--tier small`); el host consolida y revisa.

Procedimiento: skill `inmersion-de-dominio`. Protocolos por departamento: `registry/domain-immersion.json`.
