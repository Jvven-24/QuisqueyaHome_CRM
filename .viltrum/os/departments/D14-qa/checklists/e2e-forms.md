# Checklist — ataque a formularios

> Se aplica a todo formulario antes de pre-release. Complementa `checklists/form-design.md`
> de D05: aquí no se revisa el diseño, se **ataca** la implementación real.
> Firma D00, nunca quien implementó el formulario.

## A. Máscaras y formato

- [ ] Cada campo con máscara rechaza entrada que no cumple el formato — probado con datos inválidos reales
- [ ] La máscara acepta pegar desde el portapapeles sin romperse — probado pegando un valor con formato distinto
- [ ] Normalización al guardar verificada — el valor en base de datos no lleva separadores de presentación
- [ ] Dígito verificador (cédula, RNC) probado con un valor de dígito incorrecto — debe rechazarse

## B. Validación en tres capas

- [ ] Validación de cliente rechaza lo evidente — probado en la interfaz
- [ ] Validación de servidor rechaza lo mismo **saltándose el cliente** — probado con petición directa a la API sin pasar por la interfaz
- [ ] Restricción de base de datos rechaza lo que llegara a pasar el servidor — probado con inserción directa cuando el entorno lo permite
- [ ] Regla de negocio (fecha fin > fecha inicio, límite de monto, etc.) validada en servidor, no solo en cliente
- [ ] Cada capa tiene su **propia** prueba negativa con el mismo dato inválido (cliente, API directa sin cliente, restricción de BD); que falle en la interfaz no acredita las otras dos

## B2. Retroalimentación (ver "Contrato de retroalimentación de acciones y formularios", `core/doctrine/ux-states.md`)

- [ ] Botón primario deshabilitado sin motivo visible junto a él (o sin nombrar qué falta) — **P2**
- [ ] Campo obligatorio sin marca visible ni `required`/`aria-required` — **P2**
- [ ] Error de servidor (422 con `errors[]`) mostrado solo como mensaje genérico o efímero (toast) — **P2**
- [ ] El error de servidor aparece junto a su campo (y resumen con enlaces), con el dato conservado — probado forzando 422 por API/mock

## C. Conservación de datos

- [ ] Error de un campo conserva el valor de **todos** los campos, no solo el que falló
- [ ] Perder la conexión a mitad de envío no borra lo escrito
- [ ] Sesión expirada a mitad de formulario conserva el contenido al reingresar
- [ ] Recargar accidentalmente durante un formulario largo — si hay guardado parcial, se recupera; si no lo hay, es hallazgo

## D. Envío

- [ ] Doble clic en enviar no crea doble registro — probado con clics rápidos consecutivos
- [ ] Envío con conexión lenta no permite un segundo envío mientras el primero está en curso
- [ ] Formulario de más de un paso permite volver atrás sin perder lo ya escrito
- [ ] Guardado parcial funciona — probado cerrando y reabriendo a mitad de proceso

## E. Catálogos

- [ ] Las opciones mostradas vienen del catálogo real, no de un valor incrustado — probado verificando que un cambio en el catálogo se refleja sin desplegar código
- [ ] Un valor inactivo del catálogo no aparece para elegir en un registro nuevo, pero sí se sigue mostrando en un registro histórico que ya lo tenía

## F. Secuencias

- [ ] Números correlativos (factura, folio) se generan en servidor, no en cliente
- [ ] Dos envíos simultáneos no obtienen el mismo número — probado con envíos concurrentes reales o simulados
- [ ] El identificador visible al usuario está separado del identificador interno

## G. Seguridad del formulario

- [ ] Ningún dato viaja en la URL en un método que debería ser `POST`
- [ ] Campos de contraseña no autocompletan donde no corresponde
- [ ] Formulario público resiste un envío automatizado básico (bot simple) — probado
- [ ] Lo que queda en bitácora tras un envío fallido no incluye dato sensible en claro

---

## Veredicto

```
APROBADO      — todos los ítems probados con evidencia, no solo revisados en el código
CONDICIONAL   — excepciones P2/P3 con dueño y fecha. Nunca conservación de datos ni validación de servidor
RECHAZADO     — vuelve al departamento dueño con hallazgos clasificados
```

Firma D00. Un formulario que solo se probó por la interfaz, sin saltarse el cliente, no
tiene la capa de servidor verificada — se marca como no verificado, no como aprobado.
