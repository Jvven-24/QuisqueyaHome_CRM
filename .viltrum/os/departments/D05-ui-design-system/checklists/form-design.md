# Checklist — diseño de formularios

> Se aplica a **todo** formulario, sin excepción, antes de entregar.
> Un ítem sin marcar es un formulario no terminado.

## A. Estructura

- [ ] **≤ 7 campos por vista.** Si hay más, está segmentado en pasos, pestañas o secciones
- [ ] La segmentación se decidió **en el diseño**, no después de una queja
- [ ] Agrupación por significado ("Datos de contacto"), no por tipo de dato
- [ ] Cada paso o pestaña tiene un título que dice qué se pide y por qué
- [ ] Progreso visible si hay más de un paso
- [ ] Se puede volver atrás sin perder lo escrito
- [ ] **Guardado parcial** si hay más de un paso — perder el progreso es P1
- [ ] Orden de los campos coincide con el orden mental de la tarea, no con el de la tabla
- [ ] Marca de obligatorio visible y programática en cada campo obligatorio, según `core/doctrine/ux-states.md` § "Contrato de retroalimentación de acciones y formularios" (R1); los opcionales se rotulan solo si evita ambigüedad
- [ ] Una sola acción primaria, visualmente inequívoca; si puede quedar deshabilitada, el diseño incluye el motivo junto al botón (R2)

## B. Contrato por campo

Cada campo tiene esta ficha completa **antes** de existir en pantalla:

| Atributo | Estado |
|---|---|
| Tipo de dato | [ ] |
| Máscara o formato | [ ] |
| Longitud mínima y máxima | [ ] |
| Validación en cliente | [ ] |
| Validación en servidor | [ ] |
| Restricción en base de datos | [ ] |
| Obligatorio u opcional (con marca visible y `required`/`aria-required`, R1) | [ ] |
| Valor por defecto (explícito, aunque sea vacío) | [ ] |
| Mensaje de error específico (por clave de catálogo, localizable; R3) | [ ] |
| Texto de ayuda, si el campo no es obvio | [ ] |
| Catálogo asociado, si es enumerado | [ ] |
| Permiso: quién puede verlo y editarlo | [ ] |

**Un campo sin ficha no entra al formulario.**

## C. Máscaras y formatos

- [ ] Todo dato estructurado lleva máscara — nunca texto libre

### Catálogo base (República Dominicana)

| Dato | Formato | Validación adicional |
|---|---|---|
| Cédula | `000-0000000-0` | Dígito verificador |
| RNC | `0-00-00000-0` (9 dígitos) | Dígito verificador |
| Teléfono RD | `(000) 000-0000` | Prefijos 809 / 829 / 849 |
| NCF / e-CF | Según tipo de comprobante | Secuencia autorizada, vigencia |
| Moneda | `RD$ 0,000.00` | Separador de miles, 2 decimales, sin negativos si no aplica |
| Fecha | `DD/MM/AAAA` | Rango válido, no futura si no corresponde |
| Porcentaje | `0.00 %` | Rango 0–100 salvo justificación |
| Placa vehicular | Según categoría | — |
| Código postal | 5 dígitos | — |
| Correo | — | Formato + normalización a minúsculas |
| Tarjeta | `0000 0000 0000 0000` | Luhn, y **nunca se almacena** |

- [ ] La máscara **no** impide pegar desde el portapapeles
- [ ] Se normaliza al guardar (sin separadores en base de datos, con formato al mostrar)
- [ ] El formato de almacenamiento está documentado y es único

## D. Validación

- [ ] **Tres capas:** cliente, servidor y restricción en base de datos
- [ ] La validación de cliente es para comodidad; **la de servidor es la que manda**
- [ ] Se valida al salir del campo, no en cada tecla ni solo al enviar
- [ ] Mensaje específico por campo: qué está mal y cómo corregirlo
- [ ] Resumen de errores accesible al inicio, con enlace a cada campo, y foco al primer campo inválido al enviar (R2)
- [ ] Preferencia por **no deshabilitar** el envío por validación incompleta; se permite enviar y se explican los errores (R2)
- [ ] Mensajes de error y de ayuda por clave de catálogo, no texto en el componente (R3)
- [ ] Validaciones cruzadas identificadas (fecha fin > fecha inicio, etc.)
- [ ] Reglas de negocio validadas en servidor, nunca solo en cliente

## E. Estados

- [ ] **Carga:** indicador en el botón, texto explícito, doble envío bloqueado
- [ ] **Vacío:** el formulario limpio explica para qué sirve
- [ ] **Error de campo:** se conserva **todo** lo escrito
- [ ] **Error de servidor:** mensaje humano, código de referencia, reintento seguro
- [ ] **Sin conexión:** el intento no se pierde; se encola o se avisa
- [ ] **Éxito:** confirmación específica y estado final visible
- [ ] **Permisos:** campos que el rol no puede editar están deshabilitados con razón visible
- [ ] **Botón primario:** estados y motivo de deshabilitado diseñados según el Contrato de retroalimentación de acciones y formularios (R2, R6)
- [ ] **Guardar:** éxito con confirmación específica; en error no se pierde lo escrito (R7)
- [ ] **Sesión expirada:** se guarda el contenido y se recupera tras reingresar

## F. Catálogos y enumeraciones

- [ ] Ninguna lista de opciones está escrita dentro del componente
- [ ] Cada catálogo tiene una única fuente
- [ ] Los catálogos son administrables si el negocio los cambia
- [ ] Los valores inactivos no aparecen para elegir, pero los registros históricos los siguen mostrando
- [ ] Listas de más de ~10 opciones tienen búsqueda
- [ ] Listas de más de ~50 opciones cargan por demanda

## G. Secuencias y numeración

- [ ] Los números correlativos (factura, folio, código) se generan **en el servidor**
- [ ] Con control de concurrencia — dos usuarios simultáneos no obtienen el mismo número
- [ ] El identificador visible al usuario está separado del identificador interno
- [ ] Los huecos en la secuencia están contemplados por la regla de negocio
- [ ] Si la numeración es fiscal, su vigencia y autorización están validadas

## H. Accesibilidad

- [ ] Cada campo tiene etiqueta real asociada, no solo texto de marcador
- [ ] Orden de tabulación lógico
- [ ] Foco visible en todos los campos
- [ ] Errores anunciados a tecnología asistiva
- [ ] El error no se comunica solo por color
- [ ] Campos agrupados tienen su agrupación anunciada
- [ ] Funciona completo solo con teclado

## I. Responsive

- [ ] Verificado en 320 y 390 px — los anchos que más duelen
- [ ] Verificado en 768px y 1024px
- [ ] Los campos no se desbordan ni se comprimen a ilegibles
- [ ] El teclado apropiado se abre en móvil (numérico, correo, teléfono)
- [ ] La acción primaria es alcanzable con el pulgar

## J. Seguridad

- [ ] Ningún dato sensible viaja en la URL
- [ ] Los campos de contraseña no se autocompletan donde no corresponde
- [ ] Los datos de tarjeta no se almacenan
- [ ] Protección contra envío automatizado en formularios públicos
- [ ] Los permisos se verifican en servidor, no solo ocultando el botón
- [ ] Lo que se registra en bitácora no incluye datos sensibles

---

## Veredicto

```
APROBADO      — toda la checklist marcada
CONDICIONAL   — excepciones listadas, con dueño y fecha. Nunca con un P0
RECHAZADO     — vuelve al diseño con hallazgos clasificados
```

Firma el revisor (D07), **nunca** quien diseñó.
