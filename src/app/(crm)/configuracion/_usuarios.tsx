"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";
import { Avatar, Badge } from "../_ui/prototipo-ui";
import { Vacio } from "../_ui/estados";

export type RolOpcion = { id: number; name: string; slug: string; isProtected?: boolean };

export type UsuarioFila = {
  id: number;
  fullName: string;
  email: string;
  jobTitle: string | null;
  phone: string | null;
  isActive: boolean;
  authUserId: string | null;
  roleId: number;
  roleName: string;
  roleSlug: string;
  specialty: string | null;
  handlesRentals: boolean | null;
  monthlyTargetDeals: number | null;
};

/**
 * M13 · Usuarios y roles (F2). Alta con invitación (decisión #28), edición,
 * activar/desactivar y reenvío de invitación — la pantalla que reemplaza las
 * altas manuales por SQL descritas en `docs/contexto/errores-conocidos.md`.
 */
export function UsuariosPanel({ lista, roles, puedeEditar }: { lista: UsuarioFila[]; roles: RolOpcion[]; puedeEditar: boolean }) {
  const router = useRouter();
  const [creando, setCreando] = useState(false);
  const [editando, setEditando] = useState<UsuarioFila | null>(null);
  const [ocupado, setOcupado] = useState<number | null>(null);

  async function reenviarInvitacion(usuario: UsuarioFila) {
    setOcupado(usuario.id);
    const respuesta = await fetch(`/api/usuarios/${usuario.id}/invitacion`, { method: "POST" });
    setOcupado(null);
    const cuerpo = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) {
      alert(cuerpo.error ?? "No se pudo reenviar la invitación.");
      return;
    }
    router.refresh();
  }

  async function alternarActivo(usuario: UsuarioFila) {
    setOcupado(usuario.id);
    const respuesta = await fetch(`/api/usuarios/${usuario.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ isActive: !usuario.isActive }),
    });
    setOcupado(null);
    if (!respuesta.ok) {
      const cuerpo = await respuesta.json().catch(() => ({}));
      alert(cuerpo.error ?? "No se pudo actualizar el usuario.");
      return;
    }
    router.refresh();
  }

  async function eliminar(usuario: UsuarioFila) {
    if (!confirm(`¿Eliminar a ${usuario.fullName}? Podrás verlo en la papelera, no se borra de la base.`)) return;
    setOcupado(usuario.id);
    const respuesta = await fetch(`/api/usuarios/${usuario.id}`, { method: "DELETE" });
    setOcupado(null);
    if (!respuesta.ok) {
      const cuerpo = await respuesta.json().catch(() => ({}));
      alert(cuerpo.error ?? "No se pudo eliminar el usuario.");
      return;
    }
    router.refresh();
  }

  return (
    <>
      <div className="panel-title">
        <div>
          <p className="eyebrow">RBAC</p>
          <h2>Usuarios y roles</h2>
        </div>
        {puedeEditar && (
          <button className="button secondary" type="button" onClick={() => setCreando(true)}>
            Invitar usuario
          </button>
        )}
      </div>
      {lista.length === 0 ? (
        <Vacio titulo="Sin usuarios todavía" texto="Invita al primero con “Invitar usuario”." />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Invitación</th>
                {puedeEditar && <th></th>}
              </tr>
            </thead>
            <tbody>
              {lista.map((usuario) => (
                <tr key={usuario.id}>
                  <td>
                    <span className="table-person">
                      <Avatar name={usuario.fullName} small />
                      <span>
                        <strong>{usuario.fullName}</strong>
                        <small>{usuario.email}</small>
                      </span>
                    </span>
                  </td>
                  <td>{usuario.roleName}</td>
                  <td>
                    <Badge tone={usuario.isActive ? "green" : "neutral"}>{usuario.isActive ? "Activo" : "Inactivo"}</Badge>
                  </td>
                  <td>
                    {usuario.authUserId ? (
                      <Badge tone="green">Aceptada</Badge>
                    ) : (
                      <div className="header-actions-inline">
                        <Badge tone="gold">Pendiente</Badge>
                        {puedeEditar && (
                          <button className="text-button" type="button" disabled={ocupado === usuario.id} onClick={() => void reenviarInvitacion(usuario)}>
                            Reenviar
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  {puedeEditar && (
                    <td className="table-actions">
                      <button className="icon-button" type="button" onClick={() => setEditando(usuario)} aria-label="Editar usuario">
                        ✎
                      </button>
                      <button className="icon-button" type="button" disabled={ocupado === usuario.id} onClick={() => void alternarActivo(usuario)} aria-label={usuario.isActive ? "Desactivar" : "Activar"}>
                        {usuario.isActive ? "⏸" : "▶"}
                      </button>
                      <button className="icon-button" type="button" disabled={ocupado === usuario.id} onClick={() => void eliminar(usuario)} aria-label="Eliminar usuario">
                        🗑
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {creando && <FormularioUsuario roles={roles} onClose={() => setCreando(false)} />}
      {editando && <FormularioUsuario usuario={editando} roles={roles} onClose={() => setEditando(null)} />}
    </>
  );
}

/**
 * Exportado para M7 · Brokers (issue #33, decisión #38): "Invitar broker"
 * reutiliza este mismo formulario en vez de duplicarlo — ya preselecciona el
 * rol "broker" cuando no se edita un usuario existente (línea de `rolId` más
 * abajo), que es exactamente lo que pide el botón de `/brokers`.
 */
export function FormularioUsuario({
  usuario,
  roles,
  onClose,
}: {
  usuario?: UsuarioFila;
  roles: RolOpcion[];
  onClose: () => void;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [rolId, setRolId] = useState(usuario?.roleId ?? roles.find((r) => r.slug === "broker")?.id ?? roles[0]?.id);
  const editando = Boolean(usuario);
  const esBroker = roles.find((r) => r.id === rolId)?.slug === "broker";

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formRef.current) return;
    setEnviando(true);
    setErrores({});

    const form = formRef.current;
    const datos: Record<string, unknown> = Object.fromEntries(new FormData(form).entries());
    // Un checkbox desmarcado no aparece en `FormData.entries()` — sin esto,
    // desactivar un usuario o desmarcar "maneja alquileres" no se enviaría
    // nunca, porque el campo simplemente faltaría en vez de llegar en `false`.
    if (editando) datos.isActive = (form.elements.namedItem("isActive") as HTMLInputElement).checked;
    const handlesRentalsEl = form.elements.namedItem("handlesRentals") as HTMLInputElement | null;
    if (handlesRentalsEl) datos.handlesRentals = handlesRentalsEl.checked;

    const url = editando ? `/api/usuarios/${usuario!.id}` : "/api/usuarios";
    const respuesta = await fetch(url, {
      method: editando ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(datos),
    });
    const cuerpo = await respuesta.json().catch(() => ({}));
    setEnviando(false);

    if (!respuesta.ok) {
      setErrores(cuerpo.fields ?? { _: cuerpo.error ?? "No se pudo guardar el usuario." });
      return;
    }
    if (!editando && cuerpo.invitado === false) {
      alert(`El usuario se creó, pero la invitación no se pudo enviar: ${cuerpo.motivoError ?? "motivo desconocido"}. Usa "Reenviar" desde la lista.`);
    }

    router.refresh();
    onClose();
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="usuario-title">
        <div className="drawer-head">
          <h2 id="usuario-title">{editando ? `Editar a ${usuario!.fullName}` : "Invitar usuario"}</h2>
          <button className="icon-button" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>
        <form className="form-grid" ref={formRef} onSubmit={enviar}>
          <label className="span-2">
            Nombre completo
            <input name="fullName" defaultValue={usuario?.fullName} required />
            {errores.fullName && <small style={{ color: "#b42318" }}>{errores.fullName}</small>}
          </label>
          {!editando && (
            <label className="span-2">
              Correo
              <input name="email" type="email" required />
              {errores.email && <small style={{ color: "#b42318" }}>{errores.email}</small>}
            </label>
          )}
          <label>
            Rol
            <select name="roleId" value={rolId} onChange={(e) => setRolId(Number(e.target.value))}>
              {roles.map((rol) => (
                <option key={rol.id} value={rol.id}>
                  {rol.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Cargo
            <input name="jobTitle" defaultValue={usuario?.jobTitle ?? ""} />
          </label>
          <label className="span-2">
            Teléfono
            <input name="phone" defaultValue={usuario?.phone ?? ""} placeholder="809-555-0184" />
          </label>
          {esBroker && (
            <>
              <label>
                Especialidad
                <input name="specialty" defaultValue={usuario?.specialty ?? ""} placeholder="Proyectos en planos" />
              </label>
              <label>
                Meta mensual (negocios)
                <input name="monthlyTargetDeals" type="number" min="0" defaultValue={usuario?.monthlyTargetDeals ?? 0} />
              </label>
              <label className="span-2 checkbox-inline">
                <input name="handlesRentals" type="checkbox" defaultChecked={usuario?.handlesRentals ?? false} />
                Maneja alquileres
              </label>
            </>
          )}
          {editando && (
            <label className="span-2 checkbox-inline">
              <input name="isActive" type="checkbox" defaultChecked={usuario!.isActive} />
              Activo
            </label>
          )}
          {errores._ && <small style={{ color: "#b42318" }}>{errores._}</small>}
          <div className="form-actions span-2">
            <button className="button" type="button" onClick={onClose}>
              Cancelar
            </button>
            <button className="button primary" type="submit" disabled={enviando}>
              {enviando ? "Guardando…" : editando ? "Guardar cambios" : "Invitar"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
