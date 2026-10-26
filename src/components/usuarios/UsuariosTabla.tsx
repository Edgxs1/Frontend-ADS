"use client";

import { useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import {
  actualizarEstadoUsuario,
  actualizarRolUsuario,
} from "@/services/usuario";
import { Switch } from "@/components/ui/switch";
import { ROLES_SISTEMA } from "@/types";
import type { UsuarioAdmin } from "@/types";

interface UsuariosTablaProps {
  usuarios: UsuarioAdmin[];
  onRolActualizado: (usuario: UsuarioAdmin) => void;
  onEstadoActualizado: (usuario: UsuarioAdmin) => void;
}

export function UsuariosTabla({
  usuarios,
  onRolActualizado,
  onEstadoActualizado,
}: UsuariosTablaProps) {
  const [guardandoId, setGuardandoId] = useState<string | null>(null);
  const [estadoId, setEstadoId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);

  const handleCambiarRol = async (usuario: UsuarioAdmin, idRol: number) => {
    if (idRol === usuario.id_rol) {
      return;
    }

    setGuardandoId(usuario.id_usuario);
    setErrorId(null);

    try {
      const actualizado = await actualizarRolUsuario(usuario.id_usuario, idRol);
      onRolActualizado(actualizado);
    } catch (err) {
      setErrorId(
        err instanceof Error ? err.message : "No se pudo actualizar el rol.",
      );
    } finally {
      setGuardandoId(null);
    }
  };

  const handleCambiarEstado = async (
    usuario: UsuarioAdmin,
    activo: boolean,
  ) => {
    setEstadoId(usuario.id_usuario);
    setErrorId(null);

    try {
      const actualizado = await actualizarEstadoUsuario(
        usuario.id_usuario,
        activo,
      );
      onEstadoActualizado(actualizado);
    } catch (err) {
      setErrorId(
        err instanceof Error ? err.message : "No se pudo actualizar el estado.",
      );
    } finally {
      setEstadoId(null);
    }
  };

  if (usuarios.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
        Aún no hay usuarios registrados.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-slate-500">
              Correo
            </th>
            <th className="px-4 py-3 text-left font-medium text-slate-500">
              Rol
            </th>
            <th className="px-4 py-3 text-left font-medium text-slate-500">
              Estado
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {usuarios.map((usuario) => (
            <tr key={usuario.id_usuario} className="align-middle">
              <td className="px-4 py-3 font-medium text-slate-900">
                {usuario.correo}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <select
                    value={usuario.id_rol ?? ""}
                    onChange={(evento) =>
                      void handleCambiarRol(usuario, Number(evento.target.value))
                    }
                    disabled={guardandoId === usuario.id_usuario}
                    className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 disabled:opacity-60"
                  >
                    <option value="" disabled>
                      Sin rol
                    </option>
                    {ROLES_SISTEMA.map((rol) => (
                      <option key={rol.id} value={rol.id}>
                        {rol.nombre}
                      </option>
                    ))}
                  </select>

                  {guardandoId === usuario.id_usuario ? (
                    <Loader2
                      className="h-4 w-4 animate-spin text-slate-400"
                      aria-hidden="true"
                    />
                  ) : null}
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={usuario.activo}
                    onCheckedChange={(activo) =>
                      void handleCambiarEstado(usuario, activo)
                    }
                    disabled={estadoId === usuario.id_usuario}
                    aria-label={`${
                      usuario.activo ? "Desactivar" : "Activar"
                    } a ${usuario.correo}`}
                  />
                  <span
                    className={`text-xs font-medium ${
                      usuario.activo ? "text-emerald-700" : "text-slate-500"
                    }`}
                  >
                    {usuario.activo ? "Activo" : "Inactivo"}
                  </span>
                  {estadoId === usuario.id_usuario ? (
                    <Loader2
                      className="h-4 w-4 animate-spin text-slate-400"
                      aria-hidden="true"
                    />
                  ) : null}
                  {errorId === usuario.id_usuario ? (
                    <span className="flex items-center gap-1 text-xs text-red-600">
                      <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                      Error al guardar
                    </span>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
