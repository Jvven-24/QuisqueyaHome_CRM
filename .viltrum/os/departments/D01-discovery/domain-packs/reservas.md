# Paquete reservas

**Activación:** el negocio vende o gestiona citas, reservas o cupos por franjas.

## Preguntas
- [ ] ¿Cómo se define la disponibilidad y la capacidad por franja?
- [ ] ¿Hay clientes o sedes en distintas zonas horarias?
- [ ] ¿Política de cancelación y de no presentación?
- [ ] ¿Qué pasa si dos personas reservan lo mismo a la vez?
- [ ] ¿Se cobra al reservar, al asistir o nunca?

## Riesgos
Doble reserva por concurrencia, horas mal convertidas entre zonas horarias o en cambios de
horario, recordatorios enviados a la hora equivocada.

## Pruebas que deberán existir
Dos reservas simultáneas de la última plaza: exactamente una gana. Horas guardadas en UTC
y mostradas en la zona del usuario.
