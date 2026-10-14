# Paquete financiero (crédito)

*(Inspirado en la doctrina técnica de Viltrum Finance)*

**Activación:** el negocio otorga crédito, cobra intereses, financia pagos diferidos o
gestiona garantías. No se activa por la mera existencia de pagos o precios.

**Responsables:** las fórmulas y reglas de mora las valida una persona competente del
cliente, y la normativa local aplicable se confirma antes de G1. El agente no la presume.

## Preguntas
- [ ] **Reglas de Amortización / Cálculo Financiero:**
  - En préstamos/pagos diferidos: ¿Interés fijo (*flat rate*), saldo decreciente (*declining balance*) o interés compuesto?
  - Frecuencias de pago toleradas: ¿Diario, semanal, quincenal o mensual?
  - Reglas de mora y penalidades: ¿Porcentaje fijo, interés moratorio diario o cargo administrativo?
- [ ] **Garantías y Codeudores:** ¿Se requieren garantías físicas (vehículos, inmuebles con tasación) o garantes solidarios con cédula verificada?
- [ ] **Documentos emitidos:** ¿Pagaré, contrato de préstamo o recibos con valor legal?

## Riesgos
Cálculo de interés o mora mal implementado; redondeo; cambios de tasa a mitad de un
préstamo; datos personales y financieros (R3: D12 y responsable legal nombrado).

## Pruebas que deberán existir
Tabla de amortización contra un caso calculado por el cliente; propiedades (la suma de
capital amortizado iguala el principal); mora en bordes de fecha; redondeo por moneda.
