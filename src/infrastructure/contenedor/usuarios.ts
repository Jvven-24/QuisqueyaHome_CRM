/** Contenedor de Usuarios (`docs/R_ANALISIS_Y_PLAN.md` §7 R3.5; decisión #41). */

import { crearUsuario, editarUsuario, borrarUsuario, reenviarInvitacion } from "../../application/usuarios/casos-de-uso";
import type { AdminAuth } from "../../application/compartido/admin-auth";
import { ConflictError } from "../../domain/errors";
import { adminClient } from "../auth/supabase";
import { getDb } from "../db/client";
import { repositorioUsuarios, reposUsuarios } from "../db/repos/usuarios";
import { unidadDeTrabajoDrizzle } from "../db/repos/compartido";

export function usuariosParaEscritura() {
  const adminAuth: AdminAuth = {
    async invitarPorCorreo(email) {
      const { data, error } = await adminClient().auth.admin.inviteUserByEmail(email);
      if (error) throw new ConflictError(error.message);
      return data.user?.id ?? null;
    },
  };
  return { usuarios: repositorioUsuarios(getDb()), unidad: unidadDeTrabajoDrizzle(reposUsuarios), adminAuth };
}

export { crearUsuario, editarUsuario, borrarUsuario, reenviarInvitacion };
