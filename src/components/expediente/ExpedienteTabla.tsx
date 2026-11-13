"use client";

import { useState } from "react";
import { ExternalLink, FolderClosed, Loader2, Trash2 } from "lucide-react";
import { eliminarArchivo } from "@/services/archivo";
import { CARPETAS_REPOSITORIO } from "@/lib/repositorio";
import type { CarpetaRepositorio } from "@/lib/repositorio";
import type { ArchivoRepositorio } from "@/types";
import { formatearFecha } from "@/lib/format";

interface ExpedienteTablaProps {
  idObra: string;
  archivos: ArchivoRepositorio[];
  puedeEliminar: boolean;
  onEliminado: (idArchivo: string) => void;
}

interface SeccionCarpeta {
  titulo: string;
  archivos: ArchivoRepositorio[];
}

function agruparPorCarpeta(archivos: ArchivoRepositorio[]): SeccionCarpeta[] {
  const secciones: SeccionCarpeta[] = CARPETAS_REPOSITORIO.map((carpeta) => ({
    titulo: carpeta,
    archivos: archivos.filter(
      (archivo) => archivo.categoria_carpeta === carpeta,
    ),
  }));

  const restantes = archivos.filter(
    (archivo) =>
      !CARPETAS_REPOSITORIO.includes(
        archivo.categoria_carpeta as CarpetaRepositorio,
      ),
  );

  if (restantes.length > 0) {
    secciones.push({ titulo: "General", archivos: restantes });
  }

  return secciones;
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

  const secciones = agruparPorCarpeta(archivos);

  return (
    <div className="space-y-4">
      {secciones.map((seccion) => (
        <section
          key={seccion.titulo}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <div className="flex items-center gap-2">
              <FolderClosed
                className="h-5 w-5 text-slate-500"
                aria-hidden="true"
              />
              <h2 className="font-semibold text-slate-900">{seccion.titulo}</h2>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              {seccion.archivos.length}
            </span>
          </div>

          {seccion.archivos.length === 0 ? (
            <p className="px-5 py-4 text-sm text-slate-500">
              Sin archivos en esta carpeta.
            </p>
          ) : (
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
                  {seccion.archivos.map((archivo) => (
                    <tr
                      key={archivo.id_archivo}
                      className="hover:bg-slate-50/60"
                    >
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
                            <ExternalLink
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
                            Ver / Descargar
                          </a>

                          {puedeEliminar ? (
                            <button
                              type="button"
                              onClick={() =>
                                handleEliminar(archivo.id_archivo)
                              }
                              disabled={eliminando === archivo.id_archivo}
                              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-60"
                            >
                              {eliminando === archivo.id_archivo ? (
                                <Loader2
                                  className="h-4 w-4 animate-spin"
                                  aria-hidden="true"
                                />
                              ) : (
                                <Trash2
                                  className="h-4 w-4"
                                  aria-hidden="true"
                                />
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
          )}
        </section>
      ))}
    </div>
  );
}
