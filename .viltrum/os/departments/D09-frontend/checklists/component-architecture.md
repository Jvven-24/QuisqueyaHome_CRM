# Checklist — arquitectura de componentes

> La firma D14, nunca D09 que produjo.
> Se aplica a todo componente o módulo de frontend antes de entregar.

## A. Separación vista / lógica de negocio

- [ ] El componente se describe sin usar "y" — si hace dos cosas, son dos componentes
- [ ] Ninguna regla de negocio (cálculo, condición de permiso, decisión de flujo) vive
      dentro del componente de vista
- [ ] La lógica de negocio del cliente está en una capa de dominio propia, importable y
      probable sin renderizar ningún componente
- [ ] El componente no importa directamente un SDK o cliente de proveedor externo (pagos,
      mapas, analítica) — pasa por un adaptador con contrato propio
- [ ] El nombre del proveedor externo no aparece fuera de la carpeta de adaptadores

## B. Manejo de estado

- [ ] Estado local de UI (modal, pestaña, input antes de enviar) vive en el componente,
      no en un store global
- [ ] Estado de servidor se maneja con una capa de datos con caché e invalidación
      explícita, nunca copiado a mano a una variable global sin revalidación
- [ ] Estado global de cliente (sesión, tema, permisos resueltos) es de solo lectura
      desde la vista
- [ ] Ningún dato de servidor y dato no guardado del usuario comparten la misma fuente de
      verdad de estado

## C. Tipado estricto

- [ ] `strict: true` activo en la configuración de TypeScript del proyecto
- [ ] Cero `any` en el código entregado
- [ ] Tipos que cruzan la frontera con la API generados desde el contrato (OpenAPI,
      esquema compartido, tipos exportados por backend) — no redeclarados a mano
- [ ] Props de cada componente tipadas explícitamente, sin genérico que oculte qué recibe
- [ ] Catálogos tipados como unión literal o enum generado desde la misma fuente del
      servidor

## D. Catálogos desde API

- [ ] Ninguna lista de opciones (`<select>`, radio group, filtro, badge) escrita como
      array literal en el componente
- [ ] Todo catálogo viene de la fuente que D03 identificó, expuesta por API o config
      compartida
- [ ] Valores inactivos no se ofrecen para elegir, pero los registros históricos los
      siguen mostrando
- [ ] Si hay caché de catálogo en cliente, tiene invalidación — no es una copia estática

## E. Rendimiento del cliente

- [ ] División de código por ruta como mínimo
- [ ] Modales pesados, editores, gráficos y librerías grandes de un solo uso cargan bajo
      demanda
- [ ] Imágenes en formato moderno (WebP/AVIF), `loading="lazy"` fuera del viewport inicial
- [ ] Tamaños responsivos declarados (`srcset`/`sizes` o equivalente)
- [ ] Sin layout shift evitable — dimensiones reservadas antes de que cargue el contenido
      asíncrono

## F. Seguridad del cliente

- [ ] Sin `dangerouslySetInnerHTML` / `innerHTML` sin sanitización verificada y razón
      escrita
- [ ] Sin URL `javascript:` o `data:` sin validación específica
- [ ] Sin secretos ni claves de API privadas en el bundle
- [ ] Variables de entorno expuestas al cliente revisadas una por una
- [ ] Dato sensible no vive en `localStorage`/`sessionStorage` sin cifrar cuando existe
      alternativa de cookie `httpOnly`
- [ ] Enlaces externos con `rel="noopener noreferrer"`

## G. Pruebas de componente

- [ ] El componente se prueba aislado de la lógica de negocio real (dominio simulado)
- [ ] Se prueban los seis estados, no solo el estado feliz
- [ ] Se prueba el comportamiento con teclado en interacciones críticas
- [ ] Las pruebas no verifican detalles de implementación que el usuario no percibe

---

## Veredicto

```
APROBADO      — checklist completa
CONDICIONAL   — excepciones con dueño y fecha. Nunca con P0
RECHAZADO     — vuelve a D09 con hallazgos clasificados
```

Firma el revisor (D14), **nunca** quien implementó.
