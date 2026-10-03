# Checklist — revisión del modelo de datos

> La firma D12, nunca quien modeló.

## A. Formas normales

Por cada tabla:

- [ ] **1FN** — ningún campo con varios valores; ningún grupo repetido (`telefono1`, `telefono2`)
- [ ] **2FN** — ningún atributo depende solo de parte de una clave compuesta
- [ ] **3FN** — ningún atributo no clave depende de otro atributo no clave

Si hay desnormalización, las tres justificaciones están escritas:
- [ ] Medición que lo justifica (plan de ejecución, tiempo real)
- [ ] Qué se duplica exactamente
- [ ] Cómo se mantiene la consistencia

## B. Claves e identificadores

- [ ] Clave primaria interna, estable, nunca reutilizada
- [ ] **Identificador público separado del interno**
- [ ] El identificador público no es secuencial adivinable
- [ ] Claves naturales con restricción de unicidad
- [ ] Toda clave foránea declarada, con `ON DELETE` y `ON UPDATE` explícitos

## C. Restricciones en la base

- [ ] `NOT NULL` en todo lo obligatorio
- [ ] `UNIQUE` en toda clave natural
- [ ] `CHECK` para rangos, estados válidos y coherencia entre columnas
- [ ] Valores por defecto explícitos
- [ ] **Prueba ejecutada: intentar insertar un dato inválido con consulta directa falla**

## D. Tipos

- [ ] Dinero: decimal con precisión explícita o entero en unidad mínima — **nunca flotante**
- [ ] Fecha y hora **con zona horaria**
- [ ] Solo fecha: tipo fecha, no marca de tiempo
- [ ] Booleano real, no `'S'`/`'N'`
- [ ] Enumerados como enum o catálogo con restricción, no texto libre
- [ ] Documento de identidad y teléfono como texto normalizado, no número
- [ ] Ningún texto guardando número, fecha o booleano

## E. Catálogos

- [ ] Todo catálogo de D03 está materializado
- [ ] Administrable si el negocio lo cambia; enum si no
- [ ] Código estable, etiqueta modificable
- [ ] Campo de activo/inactivo y de orden
- [ ] Los inactivos no se ofrecen, pero los históricos los siguen mostrando
- [ ] Ningún catálogo duplicado entre módulos

## F. Auditoría

- [ ] Creado por, cuándo, desde dónde
- [ ] Modificado por última vez por, cuándo
- [ ] Historial de cambios en lo que el negocio necesita rastrear
- [ ] Borrado lógico con quién y cuándo
- [ ] La auditoría no contiene datos sensibles en claro
- [ ] La auditoría no es editable desde la aplicación

## G. Permisos (R2 o superior)

- [ ] Política de acceso por fila definida por tabla
- [ ] **Prueba que intenta cruzar el aislamiento entre inquilinos y falla**
- [ ] Los permisos no dependen solo de la aplicación
- [ ] Rol de la aplicación con privilegios mínimos

## H. Índices

Por cada índice, los cinco pasos:
- [ ] Consulta crítica escrita
- [ ] Plan de ejecución sin índice, registrado
- [ ] Índice creado
- [ ] Plan de ejecución con índice, registrado
- [ ] Diferencia medida y anotada

- [ ] Ningún índice sin medición
- [ ] Ningún índice redundante con otro

## I. Migraciones

- [ ] Versionadas y ordenadas
- [ ] Reversibles, o marcadas explícitamente como irreversibles
- [ ] **Probadas sobre copia de producción**, no sobre base vacía
- [ ] Sin pérdida de datos, o pérdida declarada y aprobada por escrito
- [ ] Compatibles con la versión anterior de la aplicación durante el despliegue
- [ ] Tiempo de ejecución medido sobre volumen real

## J. Respaldo y recuperación

- [ ] Frecuencia definida según cuánto se puede perder
- [ ] **Restauración ensayada de verdad, con fecha del último ensayo**
- [ ] Tiempo de restauración medido
- [ ] Respaldos cifrados
- [ ] Acceso a los respaldos restringido y auditado

## K. Retención y privacidad

- [ ] Cada dato personal tiene plazo de conservación y razón
- [ ] Procedimiento de eliminación o anonimización al vencer
- [ ] Qué se cifra en reposo, definido
- [ ] Qué nunca aparece en registros de actividad, definido
- [ ] Datos de tarjeta: no se almacenan

---

## Veredicto

```
APROBADO      — checklist completa
CONDICIONAL   — excepciones con dueño y fecha. Nunca con P0
RECHAZADO     — vuelve al modelado con hallazgos clasificados
```

**Recordatorio:** la aplicación se reescribe; los datos, no. Un CONDICIONAL aquí cuesta
más que en cualquier otro departamento.
