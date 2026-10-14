# Checklist — formularios, i18n y los seis estados

> La firma D14, nunca D09 que produjo.
> Se aplica a todo formulario, todo texto visible y toda pantalla antes de entregar.

## A. Formularios — esquema compartido con el servidor

- [ ] El esquema de validación del formulario es el **mismo esquema** que usa el
      servidor (paquete compartido o generado desde el contrato de API), no uno
      reimplementado dentro del componente
- [ ] Si D10 no publicó el esquema compartido, el hallazgo está escalado y registrado —
      no se inventó un esquema propio de cliente para salir del paso
- [ ] La integración con el formulario usa el mecanismo oficial (resolver de la librería
      de esquemas), no reglas reescritas a mano en el `onSubmit`
- [ ] Los mensajes de error del esquema están conectados al sistema de i18n, no son texto
      fijo del esquema

## B. Máscaras

- [ ] Cada campo con dato estructurado (teléfono, cédula, RNC, moneda, fecha, porcentaje,
      tarjeta) tiene la máscara que D05 especificó en `form-design.md` § C
- [ ] Ningún campo con formato conocido quedó en texto libre sin máscara ni escalamiento
      registrado
- [ ] La máscara no bloquea pegar desde el portapapeles
- [ ] El valor se normaliza al guardar y se formatea solo al mostrar
- [ ] Secuencias y numeración correlativa (factura, folio) se generan en el servidor, el
      cliente nunca las calcula ni las propone

## C. i18n sin texto incrustado (antipatrón H2 — Quisqueya Home)

- [ ] Cero `const COPY`, `const TEXTS`, `const LABELS` u objeto de traducción declarado
      dentro de un componente
- [ ] Todo texto visible —incluye `aria-label`, `title`, texto alternativo, mensajes de
      error y de confirmación— sale del sistema de i18n oficial del proyecto
- [ ] Las claves usan espacio de nombres por pantalla (`appointment.title`), no claves
      planas que puedan chocar entre pantallas
- [ ] Ningún texto nuevo se agregó como objeto local "temporal" — toda clave nueva entró
      al catálogo oficial en el mismo cambio
- [ ] El script de auditoría de i18n del proyecto (si existe) corrió sin claves huérfanas
      ni faltantes
- [ ] **Prueba directa del antipatrón:** activar (o simular) un idioma nuevo no requiere
      tocar ningún componente de este cambio — si lo requiere, hay un diccionario
      incrustado sin detectar

## D. Los seis estados, por pantalla o componente

- [ ] **Carga** — skeleton con la forma real del contenido; indicador dentro del botón en
      acciones; doble envío bloqueado mientras la petición está en vuelo
- [ ] **Vacío** — rama de render explícita, no inferida de longitud de array; explica qué
      falta y cómo generar el primer registro
- [ ] **Error** — mensaje humano definido por D05, código de referencia si es de
      servidor; **lo que el usuario escribió se conserva siempre**
- [ ] **Sin conexión** — pantalla propia, no el error genérico del navegador; se avisa o
      se encola según lo especificado
- [ ] **Éxito** — confirmación específica, estado final visible y persistente
- [ ] **Permiso insuficiente** — deshabilitado o ausente con razón visible, verificado
      contra el permiso real que devuelve el servidor, nunca una suposición del cliente
- [ ] **Obligatorio y acción deshabilitada** — cumple R1–R2 de `core/doctrine/ux-states.md`
      § "Contrato de retroalimentación de acciones y formularios"

## E. Accesibilidad técnica

- [ ] Cada campo tiene etiqueta real asociada (`label`/`for`), no solo `placeholder`
- [ ] Elemento HTML semántico correcto (`button`, no `div` con `onClick`)
- [ ] Rol y atributos ARIA correctos donde no hay elemento nativo equivalente
- [ ] Foco gestionado tras navegación en SPA (foco al contenido principal o al título de
      la vista nueva)
- [ ] Foco gestionado tras acción asíncrona: error de formulario mueve el foco al primer
      campo con error o al resumen de errores; modal atrapa el foco y lo devuelve al
      cerrar
- [ ] Cambios dinámicos fuera del foco del usuario se anuncian con `aria-live`
- [ ] Ningún estado se comunica solo por color
- [ ] Recorrido completo funciona solo con teclado

## F. Pruebas de componente

- [ ] El formulario o pantalla se prueba con la lógica de negocio simulada, no real
- [ ] Los seis estados están cubiertos por prueba, no solo el estado feliz
- [ ] La interacción con teclado del formulario está probada

---

## Veredicto

```
APROBADO      — checklist completa
CONDICIONAL   — excepciones con dueño y fecha. Nunca con P0
RECHAZADO     — vuelve a D09 con hallazgos clasificados
```

Firma el revisor (D14), **nunca** quien implementó.
