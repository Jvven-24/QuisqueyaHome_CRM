---
name: inmersion-de-dominio
description: Procedimiento de D00 para que cada perfil se vuelva experto en el negocio de un proyecto al iniciarlo (o cuando cambia de vertical, mercado, marca o integración) — perfil del dominio, expediente por departamento, capacidades necesarias frente a las disponibles y síntesis para Wilber. Úsala antes de sembrar el mapa maestro y de cerrar requisitos.
---

# Inmersión de dominio — procedimiento de D00

Doctrina: `core/domain-immersion.md`. Protocolo de cada departamento: `registry/domain-immersion.json` (preguntas, investigación, expectativas del mercado,
capacidades típicas, salidas, a quién avisa y cuándo refresca).

## 1. Perfil del dominio (D00 con D01 y D02)
Escribe `.viltrum/expertise/DOMINIO.md` con: vertical y subvertical, tipo de producto (portal, CRM, ecommerce, app, landing…), mercado y país, audiencias,
marca (tono, valores, nivel de lujo/precio), competidores directos e indirectos con URL, normativa aplicable y glosario del negocio. Lo que no sepas va a
`questions.md` con dueño; no se inventa.

## 2. Inmersión por departamento (en paralelo, modelo barato)
Para cada departamento activo según `core/routing.md`, genera su tarea con su protocolo del registro + `DOMINIO.md` y despáchala con
`tools/profile_dispatch.py --tier small --slim-profile`. Cada uno entrega su expediente `.viltrum/expertise/Dxx.md` (respuestas, investigación con fuentes,
expectativas del mercado, propuesta concreta, riesgos) y su lista de capacidades necesarias. Los de producto van a fondo; los transversales adaptan su foco.

## 3. Capacidades: necesitar frente a tener
Fusiona las capacidades pedidas en `.viltrum/capabilities.json` con estado `available` (comprobado con su `check`: `viltrum doctor`, archivo, comando),
`missing` o `unknown`, quién la pidió y quién la resuelve. Lo `missing` se presenta a Wilber con licencia y costo; nada se instala sin decisión (buy-vs-build).

## 4. Síntesis y mapa
Escribe `.viltrum/expertise/EXPERTISE.md` en lenguaje simple: qué es el negocio, qué espera el mercado, qué daremos de más, riesgos y "lo que decides tú".
Las expectativas del mercado entran al mapa maestro como requisitos **propuestos** (prioridad y fuente); los avisos entre departamentos van a sus celdas
(`needs_from`/`delivers_to`). Lo aprendido que sirva a otros proyectos se propone para `departments/D01-discovery/domain-packs/`.

## 5. Refresco
Cada departamento declara cuándo vuelve a investigar. Cambio de alcance, de mercado, de marca o una integración nueva reabren la inmersión de los afectados;
el mapa marca sus celdas para revisión.

## Reglas
Fuentes con URL o `(no verificado)`. Ningún perfil aprueba su propio expediente: lo revisa su revisor de `registry/departments.yaml`. Sin secretos ni datos
reales de clientes en el material enviado a modelos externos.
