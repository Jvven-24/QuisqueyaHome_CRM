# Procedimiento Operativo — Contratos Legales, Acuerdos Comerciales y Documentos Emitidos

> **Misión (D02 Scope & Soporte Legal):** Blindar la relación comercial y técnica entre el equipo de desarrollo y el cliente mediante contratos formales versionados, hitos de pago claros y generación automatizada de documentos jurídicos y financieros válidos.

---

## 1. Jerarquía de Contratos del Ecosistema Viltrum

| Contrato | Denominación | Propósito Jurídico y Operativo | Firmantes | Momento Obligatorio |
| :--- | :--- | :--- | :--- | :--- |
| **C0** | Propuesta Técnica & Estimación de Alcance | Define qué entra, qué queda fuera, stack tecnológico y rango de inversión. | D02 / Cliente | Al cerrar Fase F1 (Gate G1) |
| **C1** | Aceptación Comercial & Plan de Hitos | **Contrato Maestro de Activación.** Fija montos, moneda base, fechas de entrega y penalidades. | Cliente (Humano) / Director Viltrum | **Precede obligatoriamente la construcción (F4)** |
| **C2** | Acuerdo de Confidencialidad & Datos (NDA) | Protege secretos comerciales, código fuente, accesos a VPS y datos de clientes finales. | Ambas partes | Previo al traspaso de credenciales |
| **C3** | Anexo de Infraestructura & Costos Recurrentes | Fija quién asume pagos mensuales de VPS (Hostinger), Supabase, dominios o consumo de APIs (OpenAI/Anthropic). | Ambas partes | En Gate G2 (Arquitectura) |
| **C4** | Acta de Aceptación Definitiva & Garantía | Certifica que el software entregado cumple las pruebas de verificación (Gate G5/G7). Inicia garantía de 90 días. | Cliente / D00 / D14 | En Gate G7 (Puesta en Producción) |

---

## 2. Estructura de Hitos y Acuerdos de Pago

Para evitar descalces financieros y asegurar entregables verificables:

```
Esquema de Pago Estándar (3 Hitos Verificables):
[30% Inicial] Anticipo de Reserva y Aceptación Comercial (C1)
   └── Desbloquea: Levantamiento detallado, Arquitectura (F2), Diseño UI/UX (F3)
[40% Intermedio] Hito de Sandbox Funcional (Gate G5 / F5)
   └── Desbloquea: Despliegue en ambiente de pruebas, flujos E2E en verde, suite de auditoría aprobada
[30% Final] Entrega en Producción y Traspaso de Activos (Gate G7 / F7)
   └── Desbloquea: Puesta en marcha en VPS definitivo, transferencia de repositorio, documentación y capacitación
```

---

## 3. Documentos Legales Generados por el Software (Doctrina Viltrum Finance)

Cuando el software en desarrollo requiere emitir documentos con validez jurídica o contable (como en `APP DE FINANCIAMIENTO`):

1. **Pagaré Notarial / Pagaré Simple:**
   - Debe incluir identificación inequívoca del deudor (Cédula/RNC, dirección física, estado civil).
   - Monto prestado en letras y números.
   - Renuncia expresa a requerimientos de mora y fijación de domicilio legal.
2. **Contrato de Financiamiento o Arrendamiento con Garantías:**
   - Tabla de amortización completa (cuota, capital, interés, saldo, fecha de vencimiento).
   - Cláusula de garantías prendarias o hipotecarias (descripción, número de serie/placa, valor de tasación).
   - Identificación de garantes o codeudores solidarios.
3. **Recibos de Pago y Transacción:**
   - Numeración secuencial consecutiva inmutable.
   - Desglose exacto: abono a capital, abono a interés corriente, interés moratorio, cargos administrativos.
   - Hash criptográfico SHA256 impreso en el pie de página para verificación de autenticidad y no-repudio.
4. **Exportaciones de Auditoría Fiscal:**
   - Reportes en Excel/PDF conciliados automáticamente contra los movimientos bancarios o de pasarela.
