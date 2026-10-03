/**
 * Contenedor de dependencias para el módulo de Comunicaciones Multicanal.
 */

import type {
  RepositorioComunicaciones,
  ProveedorDespachoCanal,
} from "../../application/comunicaciones/puertos";
import { transaction } from "../db/client";
import { repositorioComunicaciones } from "../db/repos/comunicaciones";
import { ProveedorDespachoMulticanal } from "../comunicaciones/proveedor-despacho";

let instanciaProveedor: ProveedorDespachoCanal | null = null;

export function comunicacionesRepositorio(): {
  ejecutar<T>(operacion: (repo: RepositorioComunicaciones) => Promise<T>): Promise<T>;
} {
  return {
    async ejecutar<T>(
      operacion: (repo: RepositorioComunicaciones) => Promise<T>,
    ): Promise<T> {
      return transaction(async (tx) => {
        const repo = repositorioComunicaciones(tx);
        return operacion(repo);
      });
    },
  };
}

export function proveedorDespacho(): ProveedorDespachoCanal {
  if (!instanciaProveedor) {
    instanciaProveedor = new ProveedorDespachoMulticanal();
  }
  return instanciaProveedor;
}
