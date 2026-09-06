import { Esqueleto } from "./_ui/cargando";

/**
 * Estado de carga de reserva para los módulos de `(crm)` que todavía no
 * tienen su propio `loading.tsx` (T5). Contactos, Leads y Pipeline —los tres
 * módulos de F1— tienen el suyo, más específico; el resto cae aquí hasta que
 * su fase los construya.
 */
export default function Loading() {
  return <Esqueleto filas={5} />;
}
