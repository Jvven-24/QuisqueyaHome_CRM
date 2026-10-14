# Mapa maestro — Portal de reservas (ejemplo)

**Meta:** Que el cliente reserve y pague solo, y el equipo vea todo en un panel

Etapa: F3 · Nodos: 11 · Celdas cerradas: 4/52 · Huecos: 45 {'P2': 44, 'P3': 1}

**Listo para tu revisión:** NO (nunca se aprueba solo)

## Lo que decides tú

- REQ-001 tiene riesgo R2: pide tu revisión
- FN-001 tiene riesgo R2: pide tu revisión
- INT-001 tiene riesgo R3: pide tu revisión

## Qué contiene (en lenguaje simple)

- **GOAL-001** (Meta) Reservas en línea — Que el cliente reserve y pague solo, y el equipo vea todo en un panel
  - **REQ-001** (Requisito) Reservar una cita — El cliente elige día y hora y queda confirmada
  - **MOD-001** (Módulo) Reservas — La parte del sistema que agenda y cobra
    - **FN-001** (Función) Crear reserva — Guarda la reserva si el horario sigue libre
      - **BHV-002** (Comportamiento) Horario ocupado — Si el horario ya fue tomado, se avisa junto al campo de la hora y se conserva lo escrito
    - **SCR-001** (Pantalla) Formulario de reserva — La pantalla donde el cliente elige día y hora y deja sus datos ✎ cambiado por ti
      - **BHV-001** (Comportamiento) Guardar explica por qué no puede — Si faltan datos, el botón dice cuáles faltan en vez de quedarse apagado sin motivo
    - **ENT-001** (Entidad de datos) Reserva — El registro de cada cita con cliente, hora y estado
    - **CTR-001** (Contrato API/evento) POST /reservas — La orden que la pantalla le manda al servidor para crear la reserva
    - **INT-001** (Integración) Cobro con tarjeta — Cobrar la reserva con una pasarela de pago
  - **TST-001** (Prueba de aceptación) Reserva de punta a punta — Prueba que una reserva completa funciona de principio a fin

## Huecos — resumen

- P2 · G01: 42
- P2 · G04: 1
- P2 · G17: 1
- P3 · G21: 1

Por departamento: D00 1, D02 4, D03 5, D04 1, D05 1, D06 3, D07 1, D09 3, D10 5, D11 3, D12 3, D13 2, D14 7, D15 1, D16 1, D17 1, D19 1, D21 1, D22 1

## Huecos — detalle (primeros 60; el resto está en gaps.json)

- [P2] G01 · BHV-001 · D06: falta la celda de D06
- [P2] G01 · BHV-001 · D09: falta la celda de D09
- [P2] G01 · BHV-001 · D10: falta la celda de D10
- [P2] G01 · BHV-001 · D14: falta la celda de D14
- [P2] G01 · BHV-002 · D06: falta la celda de D06
- [P2] G01 · BHV-002 · D09: falta la celda de D09
- [P2] G01 · BHV-002 · D10: falta la celda de D10
- [P2] G01 · BHV-002 · D14: falta la celda de D14
- [P2] G01 · CTR-001 · D03: falta la celda de D03
- [P2] G01 · CTR-001 · D14: falta la celda de D14
- [P2] G01 · ENT-001 · D11: falta la celda de D11
- [P2] G01 · ENT-001 · D12: falta la celda de D12
- [P2] G01 · FN-001 · D02: falta la celda de D02
- [P2] G01 · FN-001 · D03: falta la celda de D03
- [P2] G01 · FN-001 · D11: falta la celda de D11
- [P2] G01 · FN-001 · D12: falta la celda de D12
- [P2] G01 · GOAL-001 · D00: falta la celda de D00
- [P2] G01 · GOAL-001 · D02: falta la celda de D02
- [P2] G01 · GOAL-001 · D22: falta la celda de D22
- [P2] G01 · INT-001 · D03: falta la celda de D03
- [P2] G01 · INT-001 · D12: falta la celda de D12
- [P2] G01 · INT-001 · D13: falta la celda de D13
- [P2] G01 · INT-001 · D14: falta la celda de D14
- [P2] G01 · INT-001 · D17: falta la celda de D17
- [P2] G01 · INT-001 · D19: falta la celda de D19
- [P2] G01 · INT-001 · D21: falta la celda de D21
- [P2] G01 · MOD-001 · D02: falta la celda de D02
- [P2] G01 · MOD-001 · D03: falta la celda de D03
- [P2] G01 · MOD-001 · D09: falta la celda de D09
- [P2] G01 · MOD-001 · D10: falta la celda de D10
- [P2] G01 · MOD-001 · D11: falta la celda de D11
- [P2] G01 · MOD-001 · D13: falta la celda de D13
- [P2] G01 · MOD-001 · D14: falta la celda de D14
- [P2] G01 · MOD-001 · D15: falta la celda de D15
- [P2] G01 · MOD-001 · D16: falta la celda de D16
- [P2] G01 · REQ-001 · D02: falta la celda de D02
- [P2] G01 · REQ-001 · D03: falta la celda de D03
- [P2] G01 · REQ-001 · D14: falta la celda de D14
- [P2] G01 · SCR-001 · D04: falta la celda de D04
- [P2] G01 · SCR-001 · D05: falta la celda de D05
- [P2] G01 · SCR-001 · D07: falta la celda de D07
- [P2] G01 · SCR-001 · D14: falta la celda de D14
- [P2] G04 · SCR-001 · D06: estados sin cubrir: sin\_conexion
- [P2] G17 · ENT-001 · D10: D10 aún no aportó (pendiente)
- [P3] G21 · FN-001 · D10: D10 declara entregar a D14, pero D14 no lo declara de vuelta
