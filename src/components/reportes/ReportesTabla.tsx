"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, Loader2, RotateCcw, ShieldCheck } from "lucide-react";
import { cambiarEstadoReporte } from "@/services/reporte";
import { formatearFecha } from "@/lib/format";
import type { Rol } from "@/providers/supabase-provider";
import type { Reporte } from "@/types";
import { EstadoBadge } from "./EstadoBadge";

interface ReportesTablaProps {
  idObra: string;
  reportes: Reporte[];
  rol: Rol | null;
  onActualizado: (reporte: Reporte) => void;
}

export function ReportesTabla({
  idObra,
  reportes,
  rol,
  onActualizado,
}: ReportesTablaProps) {
  const [cambiando, setCambiando] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);

  const handleCambiarEstado = async (
    reporte: Reporte,
    estado: "Validado" | "Por revisar",
  ) => {
    setCambiando(reporte.id_reporte);
    setErrorId(null);

    try {
      const actualizado = await cambiarEstadoReporte(
        idObra,
        reporte.id_reporte,
        estado,
      );
      onActualizado(actualizado);
    } catch (err) {
      setErrorId(
        err instanceof Error
          ? err.message
          : "No se pudo cambiar el estado del reporte.",
      );
    } finally {
      setCambiando(null);
    }
  };

  if (reportes.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
        Aún no hay reportes registrados para esta obra.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-500">
                Fecha
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">
                Creador
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">
                Avance
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">
                Condicionantes
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-500">
                Estado
              </th>
              <th className="px-4 py-3 text-right font-medium text-slate-500">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {reportes.map((reporte) => {
              const puedeValidar =
                rol === "Residente" && reporte.estado === "Por revisar";
              const puedeReabrir =
                rol === "Administrador" && reporte.estado === "Validado";
              const ocupado = cambiando === reporte.id_reporte;

              return (
                <tr key={reporte.id_reporte} className="align-top hover:bg-slate-50/60">
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {formatearFecha(reporte.created_at)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {reporte.creador_correo ?? "—"}
                  </td>
                  <td className="max-w-xs px-4 py-3 text-slate-700">
                    {reporte.avance_general}
                  </td>
                  <td className="max-w-xs px-4 py-3 text-slate-700">
                    {reporte.condicionantes}
                  </td>
                  <td className="px-4 py-3">
                    <EstadoBadge estado={reporte.estado} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {puedeValidar ? (
                        <button
                          type="button"
                          onClick={() =>
                            handleCambiarEstado(reporte, "Validado")
                          }
                          disabled={ocupado}
                          className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60"
                        >
                          {ocupado ? (
                            <Loader2
                              className="h-4 w-4 animate-spin"
                              aria-hidden="true"
                            />
                          ) : (
                            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                          )}
                          Validar
                        </button>
                      ) : null}

                      {puedeReabrir ? (
                        <button
                          type="button"
                          onClick={() =>
                            handleCambiarEstado(reporte, "Por revisar")
                          }
                          disabled={ocupado}
                          className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700 transition hover:bg-amber-100 disabled:opacity-60"
                        >
                          {ocupado ? (
                            <Loader2
                              className="h-4 w-4 animate-spin"
                              aria-hidden="true"
                            />
                          ) : (
                            <RotateCcw className="h-4 w-4" aria-hidden="true" />
                          )}
                          Reabrir
                        </button>
                      ) : null}

                      <Link
                        href={`/dashboard/reportes/${reporte.id_reporte}`}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        <Eye className="h-4 w-4" aria-hidden="true" />
                        Detalles
                      </Link>
                    </div>

                    {errorId === reporte.id_reporte ? (
                      <p className="mt-2 text-right text-xs text-red-600">
                        {errorId}
                      </p>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
