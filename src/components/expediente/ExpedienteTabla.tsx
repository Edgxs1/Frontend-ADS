"use client";

import { useState } from "react";
import { Loader2, Trash2, ExternalLink } from "lucide-react";
import { eliminarArchivo } from "@/services/archivo";
import type { ArchivoRepositorio } from "@/types";
import { formatearFecha } from "@/lib/format";

interface ExpedienteTablaProps {
  idObra: string;
  archivos: ArchivoRepositorio[];
  puedeEliminar: boolean;
  onEliminado: (idArchivo: string) => void;
}

export function ExpedienteTabla({
  idObra,
  archivos,
  puedeEliminar,
  onEliminado,
}: ExpedienteTablaProps) {
  const [eliminando, setEliminando] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);

  const handleEliminar = async (idArchivo: string) => {
    setEliminando(idArchivo);
    setErrorId(null);

    try {
      await eliminarArchivo(idObra, idArchivo);
      onEliminado(idArchivo);
    } catch (err) {
      setErrorId(
        err instanceof Error ? err.message : "No se pudo eliminar el archivo.",
      );
    } finally {
      setEliminando(null);
    }
  };

  if (archivos.length === 0) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-900">Expediente de obra</h2>
        <p className="mt-3 text-sm text-slate-500">
          Aún no hay archivos registrados en este expediente.
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="font-semibold text-slate-900">Expediente de obra</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium uppercase tracking-wide text-slate-400">
                Tipo de documento
              </th>
              <th className="px-4 py-2 text-left font-medium uppercase tracking-wide text-slate-400">
                Fecha
              </th>
              <th className="px-4 py-2 text-left font-medium uppercase tracking-wide text-slate-400">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {archivos.map((archivo) => (
              <tr key={archivo.id_archivo} className="hover:bg-slate-50/60">
                <td className="px-4 py-3 font-medium text-slate-900">
                  {archivo.tipo_documento}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatearFecha(archivo.created_at)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={archivo.url_archivo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                      Ver / Descargar
                    </a>

                    {puedeEliminar ? (
                      <button
                        type="button"
                        onClick={() => handleEliminar(archivo.id_archivo)}
                        disabled={eliminando === archivo.id_archivo}
                        className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-60"
                      >
                        {eliminando === archivo.id_archivo ? (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        ) : (
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        )}
                        Eliminar
                      </button>
                    ) : null}
                  </div>

                  {errorId === archivo.id_archivo ? (
                    <p className="mt-2 text-xs text-red-600">{errorId}</p>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
