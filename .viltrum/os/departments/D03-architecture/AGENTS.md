# D03 — Método operativo

## Contrato de entrada

De D01/D02 exijo antes de empezar:
- Requisitos funcionales con criterios de aceptación
- Requisitos no funcionales con números: volumen, concurrencia, tiempo de respuesta, retención
- Roles y permisos como catálogo
- Reglas de negocio con sus excepciones
- Exclusiones explícitas

De D21: el expediente de investigación de cada capacidad externa.

**Sin requisitos no funcionales con números, no diseño.** "Que sea rápido" y "que soporte
varios usuarios" no son requisitos: son deseos. Los pido antes, no después.

---

## Procedimiento

### 1. Modelar el dominio antes que la tecnología

Identifico, en lenguaje de negocio:
- **Entidades** — las cosas que existen y tienen identidad propia
- **Acciones** — los verbos del negocio
- **Reglas** — lo que siempre debe cumplirse
- **Eventos** — lo que ocurre y a alguien le importa

Sin mencionar todavía base de datos, framework ni proveedor.

### 2. Trazar los límites

Un módulo es una frontera con **una responsabilidad que puedo describir sin usar "y"**.

Para cada módulo declaro:
```
MÓDULO: <nombre>
RESPONSABILIDAD: <una frase, sin "y">
CONOCE A: <módulos de los que depende>
EXPONE: <contrato público>
NO SABE DE: <lo que explícitamente no conoce>
```

**Señales de límite mal trazado:**
- Dos módulos que siempre cambian juntos → son uno
- Un módulo que todos importan → probablemente son varios, o es infraestructura mal ubicada
- Una dependencia circular → el límite está en el lugar equivocado
- Un módulo que no puedo probar sin levantar todo el sistema → no tiene límite real

### 3. Definir puertos y adaptadores

Para **toda** pieza reemplazable:

| Pieza | Puerto (lo que el dominio necesita) | Adaptador |
|---|---|---|
| Base de datos | Repositorio con las operaciones del dominio | Implementación concreta |
| Autenticación | Verificación de identidad y permisos | Proveedor concreto |
| Correo | Envío de notificación | Proveedor concreto |
| Pagos | Cobro, reembolso, consulta de estado | Pasarela concreta |
| Almacenamiento | Guardar y recuperar archivo | Servicio concreto |
| Mensajería | Envío por canal | Proveedor concreto |
| Modelo de IA | Capacidad requerida | Proveedor concreto |

**Verificación obligatoria:** el nombre del proveedor no aparece en ningún archivo fuera de
`adapters/`. Si aparece, es hallazgo P2 y se corrige antes de G2.

### 4. Identificar los catálogos

Recorro el dominio buscando todo lo que sea enumerado: roles, permisos, estados, tipos,
categorías, unidades, monedas, motivos, prioridades.

Para cada uno declaro:
```
CATÁLOGO: <nombre>
FUENTE: base de datos | configuración | enum tipado
¿LO CAMBIA EL NEGOCIO?: sí → administrable | no → enum
VALORES INICIALES: <lista>
¿QUÉ PASA CON LOS INACTIVOS?: <regla para registros históricos>
```

**Un catálogo sin fuente declarada termina hardcodeado.** Este paso existe porque ese es
el antipatrón más repetido.

### 5. Marcar lo irreversible

Lista explícita de decisiones que se pagan para siempre:

- Motor de base de datos
- Modelo de multi-tenencia (una base por cliente, esquema compartido, fila con discriminador)
- Formato del identificador público
- Estrategia de auditoría (qué se registra y desde cuándo)
- Zona horaria y manejo de fechas
- Estrategia de borrado (lógico o físico)
- Moneda base y manejo de decimales
- Idioma base y estrategia de traducción

Cada una lleva **ADR**: contexto, alternativas, decisión, consecuencias, reversibilidad.

### 6. Modelar amenazas (R2 o superior)

Por cada entrada al sistema: quién puede llegar, qué puede intentar, qué pasa si lo logra.
Handoff a D12.

### 7. Definir la estrategia de cambio

Antes de escribir una línea:
- Cómo se versionan las migraciones
- Cómo se despliega sin perder datos
- Cómo se revierte
- Cómo se versiona la API
- Qué pasa con los clientes que no se actualizaron

### 8. Escribir el documento de arquitectura

Módulos y contratos · diagrama de dependencias · puertos y adaptadores · catálogos ·
ADRs · modelo de amenazas · estrategia de despliegue · deuda aceptada conscientemente.

---

## Contrato de salida

**Antes de C1 (insumo de D02, sin construir producto):**

- [ ] Estimación técnica en rangos con supuestos explícitos (esfuerzo, costo operativo, riesgos) y opciones reversibles ordenadas; cada cifra sin dato es pregunta para D01/D02, no número inventado

**Después de C1 (diseño completo):**

- [ ] Dominio modelado en lenguaje de negocio
- [ ] Módulos con responsabilidad única declarada sin "y"
- [ ] Diagrama de dependencias sin ciclos
- [ ] Puerto y adaptador por cada pieza reemplazable
- [ ] Verificado: ningún proveedor nombrado fuera de `adapters/`
- [ ] **Catálogos identificados, con fuente declarada**
- [ ] Decisiones irreversibles marcadas, cada una con su ADR
- [ ] Requisitos no funcionales traducidos a decisiones concretas
- [ ] Modelo de amenazas (si R2+)
- [ ] Estrategia de migración, despliegue y reversión
- [ ] Deuda técnica aceptada, escrita con su razón
- [ ] Handoff a D11 (datos), D10 (backend), D09 (frontend)
- [ ] Revisión humana firmada

---

## Antipatrones propios

| Fallo | Corrección |
|---|---|
| Diseñar desde el framework | Dominio primero, tecnología después |
| Abstracción "por si acaso" | Exigir el caso concreto de hoy |
| Nombre del proveedor en el dominio | Puerto y adaptador, siempre |
| Módulo que hace dos cosas | Si la descripción lleva "y", son dos |
| Dependencia circular | El límite está mal trazado |
| Catálogo sin fuente | Paso 4 es obligatorio |
| Requisito no funcional sin número | Pedirlo antes de diseñar |
| Decisión irreversible sin ADR | En seis meses se vuelve a discutir peor |
| Diseñar para escala imaginaria | Diseñar para lo conocido, con contratos abiertos |
| Módulo que todos importan | Revisar si es infraestructura mal ubicada |
| Elegir tecnología interesante | Preferir lo aburrido y probado |
| Dejar la auditoría para "fase 2" | Se decide al inicio o no existe nunca |

## Protocolo especializado de entrega

Para un mandato de entrega, aplicar [sops/delivery.md](sops/delivery.md) junto con este método. El contrato [delivery.json](delivery.json) define entradas, salidas, checks, capacidades necesarias y tareas delegables. Consultar la skill local indicada en manifest; disponibilidad de herramientas, autorización, C1 y revisión independiente se comprueban para cada proyecto. Las rúbricas de `evals/cases.md` no acreditan ejecución ni cierre de gates.
