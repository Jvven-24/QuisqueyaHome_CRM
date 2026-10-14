# Paquetes de dominio — D01

> Preguntas propias de un tipo de negocio. Se cargan solo cuando aplican: un paquete no
> activado no consume contexto ni genera preguntas al cliente.

Cada paquete declara: **activación** (términos o decisión explícita), **preguntas**,
**capacidades candidatas** (estado `propuesto` hasta que D02 y el cliente decidan),
**riesgos** y **pruebas** que deberán existir.

| Paquete | Archivo | Se activa con |
|---|---|---|
| E-commerce | `ecommerce.md` | tienda en línea, carrito, checkout, catálogo de productos |
| SaaS | `saas.md` | suscripción, multi-tenant, planes de pago |
| Reservas | `reservas.md` | sistema de reservas, agenda de citas, booking (términos compuestos: "agenda" o "disponibilidad" solos no activan) |
| Financiero (crédito) | `financiero.md` | préstamo, crédito, amortización, tasa de interés, mora, codeudor |

La versión ejecutable de las reglas de activación está en `DOMAIN_PACKS`
(`viltrum_sdk/intake.py`). Si cambias una, cambia la otra en el mismo commit.

Los paquetes no activados se registran como **excluidos** en el reporte de ingesta. Si el
texto no los activa pero el proyecto los necesita, se fuerzan con
`viltrum meeting-intake <archivo> --pack <nombre>`.

Primera tanda de preguntas: de tres a cinco por envío, ordenadas por impacto de decidir mal,
incertidumbre y dependencia del siguiente hito. Lo que se resuelve inspeccionando el código
o investigando no se le pregunta al cliente.
