/** Doble de Usuarios para R3.5 (`docs/R_ANALISIS_Y_PLAN.md` §3 paso 4). */

import type { Reversible } from "../testing/reversible.ts";
import type { EntradaEditarUsuario, PerfilBroker, RepositorioUsuarios, Rol, Usuario } from "./puertos.ts";

const FECHA = new Date("2026-01-01T00:00:00Z");

export function usuariosEnMemoria(iniciales: readonly Usuario[], rolesIniciales: readonly Rol[] = []): RepositorioUsuarios & Reversible & { readonly filas: readonly Usuario[]; readonly operaciones: readonly string[] } {
  let filas = [...iniciales];
  const roles = [...rolesIniciales];
  let siguienteId = Math.max(0, ...filas.map((fila) => fila.id)) + 1;
  let perfiles: { userId: number; specialty: string | null; handlesRentals: boolean; level: PerfilBroker["level"]; monthlyTargetDeals: number }[] = [];
  const operaciones: string[] = [];
  return {
    get filas() { return filas; },
    get operaciones() { return operaciones; },
    async buscarActivoPorCorreo(email) { operaciones.push("buscar-correo"); return filas.find((fila) => fila.email === email && fila.deletedAt === null); },
    async buscarRol(id) { operaciones.push("buscar-rol"); return roles.find((rol) => rol.id === id); },
    async crear(datos) {
      operaciones.push("crear");
      const fila: Usuario = { id: siguienteId++, roleId: datos.roleId, authUserId: null, fullName: datos.fullName, email: datos.email, passwordHash: null, initials: datos.initials, jobTitle: datos.jobTitle, phone: datos.phone, isActive: true, lastLoginAt: null, createdAt: FECHA, updatedAt: FECHA, deletedAt: null };
      filas = [...filas, fila];
      return fila;
    },
    async crearPerfilBroker(datos) { operaciones.push("crear-perfil"); perfiles.push({ userId: datos.userId, specialty: datos.specialty, handlesRentals: datos.handlesRentals, level: datos.level, monthlyTargetDeals: datos.monthlyTargetDeals }); },
    async buscar(id) { operaciones.push("buscar"); return filas.find((fila) => fila.id === id); },
    async contarOtrosAdminsActivos(id) { operaciones.push("contar-admins"); return filas.filter((fila) => fila.id !== id && fila.isActive && fila.deletedAt === null && roles.find((rol) => rol.id === fila.roleId)?.slug === "admin").length; },
    async actualizar(id, cambios: EntradaEditarUsuario) {
      operaciones.push("actualizar");
      const anterior = filas.find((fila) => fila.id === id)!;
      const fila = { ...anterior, ...(cambios.fullName === undefined ? {} : { fullName: cambios.fullName }), ...(cambios.roleId === undefined ? {} : { roleId: cambios.roleId }), ...(cambios.jobTitle === undefined ? {} : { jobTitle: cambios.jobTitle }), ...(cambios.phone === undefined ? {} : { phone: cambios.phone }), ...(cambios.isActive === undefined ? {} : { isActive: cambios.isActive }), updatedAt: FECHA };
      filas = filas.map((actual) => actual.id === id ? fila : actual);
      return fila;
    },
    async buscarPerfilBroker(userId) { operaciones.push("buscar-perfil"); return perfiles.find((perfil) => perfil.userId === userId); },
    async actualizarPerfilBroker(userId, cambios) {
      operaciones.push("actualizar-perfil");
      perfiles = perfiles.map((perfil) => {
        if (perfil.userId !== userId) return perfil;
        const actualizado = {
          userId: perfil.userId,
          specialty: perfil.specialty,
          handlesRentals: perfil.handlesRentals,
          level: perfil.level,
          monthlyTargetDeals: perfil.monthlyTargetDeals,
        };
        if ("specialty" in cambios) actualizado.specialty = cambios.specialty ?? null;
        if (cambios.handlesRentals !== undefined) actualizado.handlesRentals = cambios.handlesRentals;
        if (cambios.monthlyTargetDeals !== undefined) actualizado.monthlyTargetDeals = cambios.monthlyTargetDeals;
        return actualizado;
      });
    },
    async marcarBorrado(id, cuando) { operaciones.push("borrar"); const fila = { ...filas.find((actual) => actual.id === id)!, deletedAt: cuando, isActive: false }; filas = filas.map((actual) => actual.id === id ? fila : actual); return fila; },
    async actualizarAuthUserId(id, authUserId) { operaciones.push("auth-id"); filas = filas.map((fila) => fila.id === id ? { ...fila, authUserId } : fila); },
    async esAdminActivo(usuario) { operaciones.push("es-admin"); return usuario.isActive && usuario.deletedAt === null && roles.find((rol) => rol.id === usuario.roleId)?.slug === "admin"; },
    instantanea() { const filasAntes = filas; const operacionesAntes = operaciones.length; return () => { filas = filasAntes; operaciones.splice(operacionesAntes); }; },
  };
}
