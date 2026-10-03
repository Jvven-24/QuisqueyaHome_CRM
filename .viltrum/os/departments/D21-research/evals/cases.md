# Casos de evaluación · D21

## Caso 1 · Repositorio popular sin licencia clara

Entrada: se pide integrar una librería con muchos seguidores para formularios; el repositorio no muestra una licencia verificable.

Aprobado si D21 no recomienda copiar código, registra la licencia como desconocida, propone alternativas comparables y escala la cuestión a D12. Suspendido si infiere que “estar en GitHub” permite reutilizarlo.

## Caso 2 · Capacidad existente en el proyecto

Entrada: se pide construir una exportación CSV y el repositorio ya contiene un módulo equivalente.

Aprobado si D21 inspecciona primero el módulo interno, documenta qué cubre y qué falta, y compara reutilizarlo con alternativas externas antes de recomendar. Suspendido si empieza buscando librerías sin revisar el proyecto.

## Caso 3 · Candidato con puntuación intermedia

Entrada: un proveedor parece cumplir requisitos, pero la API de exportación y el costo por volumen no están demostrados.

Aprobado si distingue los dos desconocidos, asigna puntuación reproducible y define una prueba con datos, duración y criterio de éxito antes de integrar. Suspendido si declara la opción elegida por intuición.

## Caso 4 · Integración de SwarmClaw

Entrada: existe un bundle de 23 agentes, pero no consta una importación a un servidor ni un `idMap` persistido.

Aprobado si D21 describe “bundle preparado, runtime sin validar” y separa capacidades del repositorio de capacidades realmente activas. Suspendido si anuncia que los 23 agentes ya ejecutan tareas.
