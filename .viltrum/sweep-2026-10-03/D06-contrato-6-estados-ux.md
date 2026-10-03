# D06 · Contrato de Experiencia y los 6 Estados Obligatorios · QuisqueyaHome CRM

**Fecha:** 2026-10-03  
**Perfil:** D06 Ergonomía y Contrato de Experiencia  
**Revisor Independiente:** D14 QA  
**Estado:** Mandatorio

---

## 1. La Regla de los 6 Estados de Interfaz
Ninguna vista del CRM puede considerarse completa o lista para producción si no contempla de manera explícita y testeada los siguientes 6 estados de interfaz:

| Estado | Comportamiento Esperado | Implementación Técnica |
| :--- | :--- | :--- |
| **1. Carga (`Loading`)** | Estructuras esqueleto (`Skeleton`) que respetan la geometría exacta de las tarjetas o tablas. Prohibidos spinners circulares aislados en el centro de la pantalla. | Componente `<Skeleton>` con pulso sutil `duration-1000`. |
| **2. Vacío (`Empty`)** | Ilustración o icono Lucide monocromático, mensaje motivador explicando la ausencia de registros y botón de acción principal ("Crear primer lead", "Importar contactos"). | Componente `<EmptyState icon={...} title={...} action={...} />`. |
| **3. Desconexión / Offline (`Graceful`)** | Detección de pérdida de túnel o base de datos. Se muestran datos locales de contingencia con un banner no invasivo informando que el sistema opera en modo local/contingencia. | Bloque `try / catch` en repositorios y banner ámbar superior. |
| **4. Error (`Error`)** | Mensaje claro sin stack trace visible para el usuario final, con botón de "Reintentar" y código de trazabilidad para soporte. | Error boundary de React / Next.js (`error.tsx`). |
| **5. Éxito (`Success`)** | Feedback no intrusivo mediante toasts (`sonner`) con confirmación de la mutación realizada (ej. "Cotización Confotur generada con éxito"). | `toast.success(...)` con icono verde oscuro. |
| **6. Permisos Insuficientes (`Forbidden / 403`)** | Pantalla explicativa cuando un broker intenta acceder a recursos globales reservados a administradores (ej. liquidación general o auditoría). | Redirección o vista contextual de permisos denegados. |
