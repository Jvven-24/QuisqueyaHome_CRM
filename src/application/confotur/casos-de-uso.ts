import {
  calcularCotizacionConfotur,
  type ParametrosConfotur,
  type CotizacionConfoturResultado,
} from "../../domain/confotur.ts";

export function generarCotizacionConfotur(params: ParametrosConfotur): CotizacionConfoturResultado {
  return calcularCotizacionConfotur(params);
}
