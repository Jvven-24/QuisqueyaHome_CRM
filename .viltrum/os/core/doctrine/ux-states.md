# Los seis estados obligatorios

> Ninguna pantalla, módulo o acción se declara terminada sin resolver los seis.
> No es una lista de deseos: es condición de salida del Gate G3 y del Gate G5.

## Matriz obligatoria

Cada elemento se evalúa contra esta tabla. La salida es una matriz **pantalla × estado**.

### 1. CARGA

| Caso | Solución |
|---|---|
| Carga inicial | *Skeleton* con la forma aproximada del contenido real, para evitar saltos de layout |
| Carga de acción | Indicador dentro del botón, bloqueo de doble envío, texto explícito ("Guardando…") |
| Progreso conocido | Barra con porcentaje |
| Carga larga | Explicación, opción de cancelar, estimación solo si es confiable |
| Sincronización de fondo | Indicador discreto que no bloquea la pantalla |
| Actualización optimista | Cambio inmediato con reversión visible si falla |

**Prohibido:** un spinner centrado genérico como única respuesta a todo.

### 2. SIN DATOS

| Caso | Solución |
|---|---|
| Primera vez | Explicar para qué sirve + acción inicial clara |
| Lista vacía | Qué falta y cómo crear el primer registro |
| Búsqueda sin resultados | Conservar los filtros aplicados y sugerir qué cambiar |
| Eliminado o archivado | Explicar el estado y la ruta de recuperación si existe |

**Prohibido:** "No hay datos" a secas.

### 3. ERROR

| Caso | Solución |
|---|---|
| Error de campo | Decir exactamente qué corregir. **Conservar siempre lo escrito** |
| Error general de formulario | Resumen accesible con enlaces a cada campo afectado |
| Error de servidor | Mensaje humano + código de referencia + reintento seguro |
| Timeout | Informar que tardó demasiado, evitar duplicados |
| Límite de peticiones | Informar cuándo se puede reintentar |
| Error parcial | Mostrar lo que sí cargó, aislar lo que falló |
| Sesión expirada | Guardar contexto, pedir acceso, volver al punto exacto |
| Permiso insuficiente | Explicar qué rol o autorización falta |
| 404 | Ofrecer rutas útiles |
| 500 | Nunca exponer detalles internos |
| Mantenimiento | Estado, alcance estimado y canal de contacto |

**Prohibido:** perder lo que el usuario escribió. Es el error más caro y el más común.

### 4. SIN CONEXIÓN

| Caso | Solución |
|---|---|
| Sin internet | Página propia, no el error genérico del navegador |
| Conexión inestable | Avisar y permitir reintentar |
| Datos desactualizados | Mostrar cuándo fue la última sincronización |
| Cola offline | Indicar qué queda pendiente y cuándo se enviará |

### 5. ÉXITO

| Caso | Solución |
|---|---|
| Confirmación | Clara y específica, no solo un color |
| Reversible | Ofrecer deshacer |
| Irreversible | Confirmación reforzada: borrar, pagar, publicar, cambiar permisos |
| Estado final | Visible y persistente, no solo un mensaje que desaparece |

### 6. PERMISOS

| Caso | Solución |
|---|---|
| Sin permiso de lectura | No mostrar el elemento, o mostrarlo deshabilitado con explicación |
| Sin permiso de acción | Deshabilitar con razón visible, nunca fallar después de intentar |
| Permiso revocado en sesión | Detectar y degradar la interfaz sin romperla |

**Regla:** el permiso se verifica **siempre en el servidor**. Ocultar el botón no es seguridad.

---

## Accesibilidad de los estados

- Los cambios dinámicos deben poder anunciarse a tecnologías asistivas
- Ningún estado se comunica **solo** por color
- El foco no salta de forma inesperada
- Los mensajes son texto real, no imágenes ni íconos sueltos

---

## Presupuesto de formularios

> Esto existe porque es el error más repetido: un formulario largo en una sola vista.

### Reglas duras

1. **Máximo 7 campos por vista.** Más de eso se segmenta: pasos, pestañas o secciones
   colapsables. La decisión de segmentar se toma **en el diseño**, no cuando ya duele.

2. **Agrupar por significado, no por tipo de dato.** "Datos de contacto" y "Datos de
   facturación", no "todos los textos" y "todas las fechas".

3. **Cada campo declara su contrato antes de existir:**

   | Atributo | Obligatorio |
   |---|---|
   | Tipo de dato | sí |
   | Máscara o formato | sí, si aplica |
   | Validación cliente | sí |
   | Validación servidor | sí, siempre |
   | Restricción en base de datos | sí, siempre |
   | Obligatorio u opcional | sí |
   | Valor por defecto | explícito, incluso si es vacío |
   | Mensaje de error específico | sí |
   | Catálogo asociado | si es enumerado |

4. **Todo dato estructurado lleva máscara.** Teléfono, cédula, RNC, tarjeta, fecha, moneda,
   porcentaje, placa, código postal. Nunca texto libre para algo con formato conocido.

5. **Toda lista de opciones viene de un catálogo,** no de un array escrito en el componente.

6. **Guardado parcial** en formularios de más de un paso. Perder el progreso es P1.

7. **Validar al salir del campo**, no en cada tecla ni solo al enviar.

8. **Enumeraciones y secuencias** (números de factura, códigos, folios) se generan en el
   servidor con control de concurrencia. Nunca en el cliente.

### Checklist de formulario

- [ ] ≤ 7 campos por vista, o segmentación justificada
- [ ] Agrupación semántica
- [ ] Contrato completo por campo
- [ ] Máscaras aplicadas a todo dato con formato
- [ ] Catálogos en lugar de opciones incrustadas
- [ ] Validación en tres capas
- [ ] Mensajes de error específicos por campo
- [ ] Lo escrito se conserva ante cualquier error
- [ ] Guardado parcial si hay más de un paso
- [ ] Doble envío bloqueado
- [ ] Navegable por teclado en orden lógico
- [ ] Errores anunciados a tecnología asistiva
- [ ] Probado en 390px de ancho
