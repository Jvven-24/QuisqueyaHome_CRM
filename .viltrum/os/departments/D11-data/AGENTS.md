# D11 — Método operativo

## Contrato de entrada

De D03: módulos, límites, catálogos identificados con su fuente, decisiones irreversibles
(multi-tenencia, borrado, zona horaria, moneda).

De D01: reglas de negocio con sus excepciones, roles y permisos, requisitos de retención
y de privacidad.

**Sin las reglas de negocio no modelo.** Un esquema hecho sobre supuestos es la deuda más
cara del proyecto.

---

## Procedimiento

### 1. Inventariar entidades y relaciones

Para cada entidad:
```
ENTIDAD: <nombre en singular>
QUÉ REPRESENTA: <en lenguaje de negocio>
IDENTIDAD: <qué la hace única para el negocio>
CICLO DE VIDA: <cómo nace, cambia y termina>
¿QUIÉN LA VE?: <roles>
¿ES DATO PERSONAL?: <sí/no — determina retención y cifrado>
```

Para cada relación: cardinalidad, obligatoriedad y qué pasa al borrar el otro lado.

### 2. Normalizar hasta 3FN

Verificación por tabla:

- [ ] **1FN** — ningún campo guarda varios valores; ningún grupo repetido (`telefono1`, `telefono2`)
- [ ] **2FN** — ningún atributo depende solo de parte de una clave compuesta
- [ ] **3FN** — ningún atributo no clave depende de otro atributo no clave

**Si desnormalizo, escribo las tres cosas:**
1. La medición que lo justifica (plan de ejecución, tiempo real)
2. Qué se duplica exactamente
3. **Cómo se mantiene la consistencia** (trigger, vista materializada, proceso, transacción)

Sin las tres, no se desnormaliza.

### 3. Definir claves e identificadores

| Concepto | Regla |
|---|---|
| Clave primaria | Interna, estable, nunca se reutiliza |
| Identificador público | **Separado** del interno. No secuencial adivinable |
| Clave natural | Si existe, va con restricción de unicidad — pero no como primaria |
| Clave foránea | Siempre declarada, con comportamiento explícito al borrar |

**Nunca exponer un autoincremental al usuario.** Revela volumen y permite enumerar.

### 4. Aplicar restricciones en la base

Toda regla que importe se declara aquí, además de en la aplicación:

- [ ] `NOT NULL` en todo lo obligatorio
- [ ] `UNIQUE` en toda clave natural
- [ ] Claves foráneas con `ON DELETE` y `ON UPDATE` explícitos
- [ ] `CHECK` para rangos, estados válidos y coherencia entre columnas
- [ ] Tipos correctos — nunca texto para número, fecha, booleano o enumerado
- [ ] Valores por defecto explícitos

**Prueba:** ¿puedo insertar un dato inválido con una consulta directa? Si sí, falta una
restricción.

### 5. Catálogos

Cada catálogo que D03 identificó se materializa:

| Si el negocio lo cambia | Entonces |
|---|---|
| Sí | Tabla administrable, con `activo`, `orden` y `codigo` estable |
| No | Enumerado tipado + `CHECK` |

Reglas:
- [ ] El código del catálogo es estable; la etiqueta puede cambiar
- [ ] Los inactivos no se ofrecen para elegir, pero los registros históricos los siguen mostrando
- [ ] Ningún catálogo duplicado entre módulos
- [ ] Ninguna lista de valores escrita dentro del código de la aplicación

### 6. Tipos que se equivocan siempre

| Dato | Correcto | Nunca |
|---|---|---|
| Dinero | Decimal con precisión explícita, o entero en unidad mínima | Flotante |
| Fecha y hora | Con zona horaria | Texto, o sin zona |
| Solo fecha | Tipo fecha | Marca de tiempo |
| Porcentaje | Decimal con rango definido | Texto |
| Booleano | Booleano | `'S'`/`'N'`, `0`/`1` como texto |
| Enumerado | Enum o catálogo con restricción | Texto libre |
| Documento de identidad | Texto con formato normalizado y validación | Número |
| Teléfono | Texto normalizado | Número |

### 7. Auditoría — desde el día uno

- [ ] Quién creó, cuándo, desde dónde
- [ ] Quién modificó por última vez, cuándo
- [ ] Historial de cambios en lo que el negocio necesita rastrear
- [ ] Borrado lógico con quién y cuándo
- [ ] La auditoría **no** contiene datos sensibles en claro
- [ ] La auditoría no se puede editar desde la aplicación

Agregar auditoría después significa que el historial anterior no existe y nunca existirá.

### 8. Permisos a nivel de fila

Para R2 o superior:
- [ ] Política por tabla según el rol
- [ ] Aislamiento entre inquilinos verificado con una prueba que **intenta** cruzarlo
- [ ] Los permisos no dependen solo de la aplicación

### 9. Índices — medidos, no intuidos

1. Escribir la consulta crítica
2. Ver el plan de ejecución **sin** índice
3. Agregar el índice
4. Ver el plan **con** índice
5. Registrar la diferencia

Sin los cinco pasos, el índice no entra. Un índice inútil ocupa espacio y ralentiza cada
escritura.

### 10. Migraciones

- [ ] Versionadas y en orden
- [ ] Reversibles, o marcadas explícitamente como irreversibles
- [ ] Probadas sobre una **copia de producción**, no sobre una base vacía
- [ ] Sin pérdida de datos, o con la pérdida declarada y aprobada
- [ ] Compatibles con la versión anterior de la aplicación durante el despliegue

### 11. Respaldo y restauración

- [ ] Frecuencia definida según cuánto se puede perder
- [ ] **Restauración probada de verdad**, con fecha del último ensayo
- [ ] Tiempo de restauración medido
- [ ] Respaldos cifrados y con acceso restringido

Un respaldo que nunca se restauró es una esperanza, no una garantía.

### 12. Retención y privacidad

- [ ] Cuánto se conserva cada dato personal y por qué
- [ ] Cómo se elimina o anonimiza al vencer
- [ ] Qué se cifra en reposo
- [ ] Qué no debe aparecer nunca en registros de actividad

---

## Contrato de salida

- [ ] Diagrama entidad-relación
- [ ] Diccionario de datos: tabla, columna, tipo, restricción, significado
- [ ] Verificación 1FN/2FN/3FN, o desnormalización con sus tres justificaciones
- [ ] Identificadores internos y públicos separados
- [ ] Restricciones declaradas en la base
- [ ] Catálogos materializados
- [ ] Auditoría implementada
- [ ] Políticas de acceso por fila (si R2+)
- [ ] Índices con medición antes y después
- [ ] Migraciones versionadas y probadas sobre copia de producción
- [ ] **Restauración ensayada, con fecha**
- [ ] Política de retención escrita
- [ ] Handoff a D10 y D12

---

## Antipatrones propios

| Fallo | Corrección |
|---|---|
| Validar solo en la aplicación | La regla que importa vive también en la base |
| Flotante para dinero | Decimal con precisión, o entero en unidad mínima |
| Fecha sin zona horaria | Siempre con zona, desde el día uno |
| Autoincremental expuesto | Identificador público separado |
| Texto libre para estado o categoría | Catálogo o enumerado con restricción |
| Índice "por si acaso" | Cinco pasos con plan de ejecución, o no entra |
| Desnormalizar sin medir | Medición, duplicación declarada y plan de consistencia |
| Borrado físico por defecto | Borrado lógico más auditoría |
| Auditoría en "fase 2" | Se decide al inicio o no existe |
| Migración probada en base vacía | Copia de producción |
| Respaldo configurado sin restaurar | Ensayo real con fecha |
| Guardar más de lo necesario | Retención definida por dato |
| Datos sensibles en los registros de actividad | Nunca en claro |

## Protocolo especializado de entrega

Para un mandato de entrega, aplicar [sops/delivery.md](sops/delivery.md) junto con este método. El contrato [delivery.json](delivery.json) define entradas, salidas, checks, capacidades necesarias y tareas delegables. Consultar la skill local indicada en manifest; disponibilidad de herramientas, autorización, C1 y revisión independiente se comprueban para cada proyecto. Las rúbricas de `evals/cases.md` no acreditan ejecución ni cierre de gates.
