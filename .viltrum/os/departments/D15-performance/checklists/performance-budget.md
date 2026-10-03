# Checklist — presupuesto de rendimiento

> Se declara antes de construir (idealmente en Gate G2) y se verifica en cada release.
> Cruzar el presupuesto bloquea el Gate igual que un defecto funcional.
> Firma el revisor (D03), nunca quien optimizó.

## A. Core Web Vitals — umbrales declarados

- [ ] **LCP** objetivo ≤ 2.5 s en p75 (o más estricto si el proyecto lo justifica)
- [ ] **INP** objetivo ≤ 200 ms en p75
- [ ] **CLS** objetivo ≤ 0.1 en p75
- [ ] Umbrales medidos con datos de campo (RUM) cuando el proyecto ya tiene tráfico real, no solo de laboratorio
- [ ] Umbrales verificados en el dispositivo y red representativos del público real del proyecto, no solo en la máquina de desarrollo

## B. Presupuesto de recursos

- [ ] Tamaño máximo de JavaScript crítico (el que bloquea la interactividad) declarado en KB
- [ ] Tamaño máximo de imagen por página o por componente declarado
- [ ] Número máximo de peticiones de red en la carga inicial declarado
- [ ] Fuentes web con estrategia de carga que no bloquea el renderizado del texto

## C. Presupuesto de API

- [ ] Tiempo de respuesta objetivo (p50 y p95) por endpoint crítico
- [ ] Tamaño máximo de payload de respuesta declarado
- [ ] Paginación obligatoria en toda lista que pueda crecer sin límite

## D. Verificación en CI

- [ ] Lighthouse CI configurado con los umbrales de esta checklist como *assertions*
- [ ] El build falla si un umbral se cruza, no solo advierte
- [ ] La comparación se hace contra el mismo conjunto de páginas en cada corrida, para que el número sea comparable
- [ ] El reporte de cada corrida queda enlazado como evidencia, con fecha

## E. Medición de campo (si ya hay producción)

- [ ] Web Vitals reales capturados de usuarios reales (RUM), no solo simulados
- [ ] p75 real comparado contra el umbral declarado, no el promedio
- [ ] Segmentado por tipo de dispositivo si el público es mixto (móvil de gama baja vs. escritorio)

## F. Regresión

- [ ] Cada PR que toca una página o recorrido con presupuesto corre la verificación
- [ ] Una regresión detectada en CI bloquea el merge, no se aprueba "para revisar después"
- [ ] Un aumento de presupuesto (subir el umbral) requiere justificación escrita y aprobación de D03, no se cambia el número para que pase el check

---

## Veredicto

```
APROBADO      — todos los umbrales dentro del presupuesto, con reporte de CI y, si aplica, RUM
CONDICIONAL   — excepción P2/P3 con dueño y fecha. Nunca un umbral de Core Web Vitals cruzado sin plan
RECHAZADO     — vuelve al departamento dueño con hallazgos clasificados y medición adjunta
```

Firma el revisor (D03). Un presupuesto sin verificación en CI no es un presupuesto: es una
intención.
