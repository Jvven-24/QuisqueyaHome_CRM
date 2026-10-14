# Paquete SaaS

**Activación:** varios clientes usan el mismo sistema con suscripción o planes.

## Preguntas
- [ ] ¿Cada cliente es un tenant aislado? ¿Cómo se separan sus datos?
- [ ] ¿Qué planes existen y qué limita cada uno?
- [ ] ¿Qué roles y permisos hay dentro de cada tenant?
- [ ] ¿Facturación mensual o anual? ¿Qué ocurre al no pagar?
- [ ] ¿Qué pasa con los datos cuando un cliente se da de baja (exportación, retención, borrado)?

## Riesgos
Fuga de datos entre tenants (R3: D12 y pruebas de autorización cruzada), límites de plan
evaluados solo en el cliente, cobro recurrente duplicado.

## Pruebas que deberán existir
Un usuario del tenant A no lee ni escribe datos del tenant B por ninguna ruta; los límites
del plan se aplican en el servidor.
