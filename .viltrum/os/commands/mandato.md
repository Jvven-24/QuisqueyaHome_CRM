---
description: Convierte una petición simple en un mandato de ingeniería verificado contra el código, antes de ejecutar
argument-hint: "[lo que quieres hacer, en tus palabras]"
---

# Mandato

Petición recibida: **$ARGUMENTS**

No ejecutes todavía. Aplica `core/doctrine/mandate-layer.md`.

## 1. Dimensiona
Decide si la petición es trivial, acotada o sustancial según la tabla de la capa.
- **Trivial:** dilo en una línea y hazla. Fin.
- **Acotada:** mandato breve (5–10 líneas) en la respuesta y ejecuta.
- **Sustancial:** sigue con los pasos 2–6.

## 2. Extrae la intención
Una frase con el resultado buscado. Si hay dos lecturas que llevan a trabajos
materialmente distintos, anótalas: es una pregunta bloqueante.

## 3. Verifica en el código
Antes de proponer:
- Busca lo que ya existe relacionado (componentes, tablas, endpoints, catálogos, pruebas)
- Identifica las convenciones del proyecto
- Revisa `.viltrum/status.md`, `.viltrum/questions.md` y `.viltrum/decisions.md` si existen
- Si el cambio toca código compartido, haz análisis de impacto (`viltrum repo-impact`)

Si la exploración es amplia, delégala a un subagente con modelo pequeño y pide solo la
conclusión con rutas y líneas.

## 4. Elige el enfoque
Chequeo P0 (¿ya existe?), al menos una alternativa descartada con su razón, y el enfoque
que respeta la doctrina.

## 5. Escribe el mandato
Con `templates/mandate.md`. Guárdalo en `.viltrum/mandates/M-nnn.md` del proyecto
(siguiente número libre). Si el proyecto aún no tiene `.viltrum/`, guárdalo en
`projects/<proyecto>/mandates/` de este repositorio.

## 6. Confirma o ejecuta
- **Con preguntas bloqueantes:** muestra intención, alcance, enfoque y las preguntas.
  Espera respuesta. Mientras, avanza en lo que no dependa de ellas.
- **Sin preguntas bloqueantes:** muestra el mandato en resumen (intención, alcance,
  enfoque, criterios) y ejecútalo siguiendo el plan y los departamentos indicados.

## 7. Cierra contra el mandato
Al terminar, recorre cada criterio de aceptación y la petición original. Completa la
sección "Cierre" del mandato. Lo no cumplido se dice explícitamente.
