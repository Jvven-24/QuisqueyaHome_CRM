/**
 * Contenedor de Academy: arma las dependencias del módulo para sus casos de uso.
 */

import type { RepositorioAcademy } from "../../application/academy/puertos";
import type { PuertoAprendizaje } from "../../application/aprendizaje/puertos";
import { transaction } from "../db/client";
import { repositorioAcademy } from "../db/repos/academy";
import { MoodleAdaptador } from "../integraciones/moodle/cliente";

export function lmsAdaptador(): PuertoAprendizaje {
  return new MoodleAdaptador();
}

export function academyRepositorio(): {
  ejecutar<T>(operacion: (repo: RepositorioAcademy) => Promise<T>): Promise<T>;
} {
  return {
    async ejecutar<T>(operacion: (repo: RepositorioAcademy) => Promise<T>): Promise<T> {
      return transaction(async (tx) => {
        const repo = repositorioAcademy(tx);
        return operacion(repo);
      });
    },
  };
}
