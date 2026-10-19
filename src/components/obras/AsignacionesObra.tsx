"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Loader2, UserPlus } from "lucide-react";
import { asignarUsuarioAObra, getAsignacionesObra } from "@/services/obra";
import { getUsuarios } from "@/services/usuario";
import { formatearFecha } from "@/lib/format";
import type { AsignacionObra, Obra, UsuarioAdmin } from "@/types";

interface AsignacionesObraProps {
  obra: Obra;
}

export function AsignacionesObra({ obra }: AsignacionesObraProps) {
  const [asignaciones, setAsignaciones] = useState<AsignacionObra[] | null>(null);
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState("");
  const [asignando, setAsignando] = useState(false);
  const [errorAsignacion, setErrorAsignacion] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;

    getAsignacionesObra(obra.id_obra)
      .then((data) => {
        if (activo) {
          setAsignaciones(data);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (activo) {
          setAsignaciones([]);
          setError(
            err instanceof Error ? err.message : "Ocurrió un error inesperado.",
          );
        }
      });

    return () => {
      activo = false;
    };
  }, [obra.id_obra]);

  useEffect(() => {
    let activo = true;

    getUsuarios()
      .then((data) => {
        if (activo) setUsuarios(data);
      })
      .catch(() => {
        if (activo) setUsuarios([]);
      });

    return () => {
      activo = false;
    };
  }, []);

  const handleAsignar = async () => {
    if (!usuarioSeleccionado) {
      return;
    }

    setAsignando(true);
    setErrorAsignacion(null);

    try {
      await asignarUsuarioAObra(obra.id_obra, usuarioSeleccionado);
      setUsuarioSeleccionado("");
      const data = await getAsignacionesObra(obra.id_obra);
      setAsignaciones(data);
      setError(null);
    } catch (err) {
      setErrorAsignacion(
        err instanceof Error ? err.message : "No se pudo asignar el usuario.",
      );
    } finally {
      setAsignando(false);
    }
  };

  const cargando = asignaciones === null;
  const activos = (asignaciones ?? []).filter(
    (asignacion) => asignacion.estado === "ACTIVO" && !asignacion.fecha_fin,
  );

  const yaAsignados = new Set(activos.map((a) => a.id_usuario));
  const disponibles = usuarios.filter(
    (usuario) => !yaAsignados.has(usuario.id_usuario),
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <UserPlus className="h-5 w-5 text-slate-500" aria-hidden="true" />
        <h2 className="font-semibold text-slate-900">
          Equipo — {obra.nombre}
        </h2>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="block flex-1">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Asignar usuario existente
          </span>
          <select
            value={usuarioSeleccionado}
            onChange={(evento) => setUsuarioSeleccionado(evento.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
          >
            <option value="">Selecciona un usuario</option>
            {disponibles.map((usuario) => (
              <option key={usuario.id_usuario} value={usuario.id_usuario}>
                {usuario.correo}
                {usuario.rol ? ` — ${usuario.rol}` : ""}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={() => void handleAsignar()}
          disabled={!usuarioSeleccionado || asignando}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          {asignando ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <UserPlus className="h-4 w-4" aria-hidden="true" />
          )}
          Asignar a la obra
        </button>
      </div>

      {errorAsignacion ? (
        <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorAsignacion}
        </p>
      ) : null}

      <div className="mt-5">
        {cargando ? (
          <div className="flex items-center justify-center rounded-xl border border-slate-200 py-10">
            <Loader2
              className="h-5 w-5 animate-spin text-slate-400"
              aria-hidden="true"
            />
          </div>
        ) : null}

        {!cargando && error ? (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        ) : null}

        {!cargando && !error ? (
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-500">
                  Usuario
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">
                  Rol
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">
                  Estado
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">
                  Desde
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {asignaciones && asignaciones.length > 0 ? (
                asignaciones.map((asignacion) => (
                  <tr key={asignacion.id_asignacion}>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {asignacion.correo}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {asignacion.rol ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={[
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          asignacion.estado === "ACTIVO" && !asignacion.fecha_fin
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500",
                        ].join(" ")}
                      >
                        {asignacion.estado === "ACTIVO" &&
                        !asignacion.fecha_fin
                          ? "Activo"
                          : "Finalizado"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatearFecha(asignacion.fecha_inicio)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-center text-sm text-slate-500"
                  >
                    Esta obra no tiene usuarios asignados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : null}
      </div>
    </section>
  );
}
