# Paquete e-commerce

**Activación:** venta en línea de productos o servicios con carrito o checkout.

## Preguntas
- [ ] ¿Qué se vende: productos físicos, digitales o servicios? ¿Con qué variantes (talla, color)?
- [ ] ¿Precios con o sin impuestos? Los impuestos son un requisito a validar con el contador del cliente, no una suposición.
- [ ] ¿Cómo se controla el stock y quién lo actualiza?
- [ ] ¿Qué métodos de pago y pasarela? ¿Se permite comprar como invitado?
- [ ] ¿Cómo se entrega (envío, retiro) y cuál es la política de devoluciones?
- [ ] ¿Quién administra pedidos y qué comunicaciones recibe el cliente (confirmación, envío)?

## Capacidades candidatas (estado `propuesto`)
Catálogo, carrito, checkout, pagos, pedidos, inventario, envíos, devoluciones, panel de
administración, correos transaccionales.

## Riesgos
Cobro duplicado, pedido pagado sin registrar, stock negativo, webhook de pago fuera de
orden (ver D19), datos de tarjeta (nunca almacenarlos: R3 con D12).

## Primera entrega vertical sugerida
Producto visible → pedido creado → pago de sandbox confirmado → pedido actualizado →
prueba E2E → estado visible. Front y back separados no son una entrega: el recorrido
integrado sí.
