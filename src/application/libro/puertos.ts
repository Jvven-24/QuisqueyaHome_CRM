/** Contrato mínimo de b1g/M40 §6.0. No habilita cobros del producto. */
export type MonedaLibro = "USD" | "DOP";

export type MovimientoLibro = Readonly<{
  clave: string;
  origen: string;
  desde: string;
  hasta: string;
  moneda: MonedaLibro;
  centavos: string;
  compensa?: string;
}>;

/** La fábrica se liga a la transacción del llamador; nunca abre otra conexión. */
export interface LibroPort {
  crearCuenta(nombre: string, moneda: MonedaLibro, permiteNegativo?: boolean): Promise<string>;
  registrar(movimiento: MovimientoLibro): Promise<string>;
}
