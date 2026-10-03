# Checklist — revisión de arquitectura (Gate G2)

> La firma quien revisa, nunca quien diseñó. Para R3–R4, revisor humano obligatorio.

## A. Dominio

- [ ] Modelado en lenguaje de negocio, sin nombres de framework ni de proveedor
- [ ] Entidades con identidad propia identificadas
- [ ] Verbos del negocio listados
- [ ] Reglas de negocio con sus excepciones documentadas
- [ ] Eventos relevantes identificados

## B. Módulos y límites

- [ ] Cada módulo describe su responsabilidad **sin usar "y"**
- [ ] Cada módulo declara: responsabilidad, de quién depende, qué expone, qué no sabe
- [ ] Diagrama de dependencias **sin ciclos**
- [ ] Ningún par de módulos cambia siempre junto (si ocurre, son uno)
- [ ] Ningún módulo es importado por todos (revisar si es infraestructura mal ubicada)
- [ ] Cada módulo se puede probar sin levantar el sistema completo

## C. Puertos y adaptadores

- [ ] Toda pieza reemplazable tiene puerto propio
- [ ] **Verificado por búsqueda: el nombre del proveedor no aparece fuera de `adapters/`**
- [ ] El puerto expresa lo que el dominio necesita, no lo que el proveedor ofrece
- [ ] Existe al menos una prueba que sustituye el adaptador por uno falso
- [ ] Cambiar de proveedor toca un solo archivo fuera del adaptador — o ninguno

Piezas a verificar: base de datos · autenticación · correo · pagos · almacenamiento ·
mensajería · modelo de IA · analítica · cualquier servicio externo.

## D. Catálogos

- [ ] Todo enumerado del dominio está inventariado
- [ ] Cada catálogo declara su fuente: base de datos, configuración o enum tipado
- [ ] Declarado si el negocio lo cambia (administrable) o no (enum)
- [ ] Regla escrita para valores inactivos y registros históricos
- [ ] **Ningún catálogo duplicado entre módulos**
- [ ] Ninguna lista de valores escrita dentro de un componente o servicio
- [ ] **Datos de contacto del negocio con fuente única** — teléfono, WhatsApp, correo,
      dirección, horario. Verificar por búsqueda del literal en todo el repositorio
- [ ] Ningún valor de respaldo silencioso sobre un dato crítico del negocio: si el
      respaldo se activa, debe quedar registrado

> El segundo y el tercero vienen del primer proyecto auditado, donde el número de WhatsApp
> estaba escrito a mano en cinco archivos detrás de un `||` que nunca fallaba en voz alta.
> Ver `projects/quisqueya-home/audit-2026-09-20.md` H1.

## E. Decisiones irreversibles

Cada una con ADR: contexto, alternativas, decisión, consecuencias, reversibilidad.

- [ ] Motor de base de datos
- [ ] Modelo de multi-tenencia
- [ ] Formato del identificador público
- [ ] Estrategia de auditoría
- [ ] Zona horaria y manejo de fechas
- [ ] Estrategia de borrado (lógico o físico)
- [ ] Moneda base y decimales
- [ ] Idioma base y estrategia de traducción

## F. SOLID verificable

- [ ] **SRP** — ninguna descripción de módulo lleva "y"
- [ ] **OCP** — agregar un caso nuevo se hace añadiendo, no editando
- [ ] **LSP** — las implementaciones son intercambiables sin que el consumidor cambie
- [ ] **ISP** — nadie depende de métodos que no usa
- [ ] **DIP** — lo importante no depende del detalle

## G. Requisitos no funcionales

- [ ] Volumen esperado, con número
- [ ] Concurrencia esperada, con número
- [ ] Tiempo de respuesta objetivo, con número
- [ ] Retención de datos, con plazo
- [ ] Disponibilidad esperada
- [ ] **Cada uno traducido a una decisión concreta de arquitectura**

## H. Cambio y despliegue

- [ ] Estrategia de versionado de migraciones
- [ ] Despliegue sin pérdida de datos
- [ ] Reversión definida
- [ ] Versionado de API, si es pública
- [ ] Compatibilidad con clientes no actualizados

## I. Investigación previa

- [ ] Expediente de D21 cerrado para cada capacidad externa
- [ ] Ninguna capacidad se construyó sin haber comparado alternativas
- [ ] Plan de salida documentado para cada dependencia externa

## J. Riesgo y deuda

- [ ] Modelo de amenazas, si R2 o superior
- [ ] Puntos únicos de fallo identificados
- [ ] **Deuda técnica aceptada escrita, con su razón y su costo estimado**
- [ ] Ninguna abstracción especulativa sin caso concreto de hoy

---

## Veredicto

```
APROBADO      — checklist completa
CONDICIONAL   — excepciones con dueño y fecha. Nunca con P0
RECHAZADO     — vuelve a diseño con hallazgos clasificados
```
