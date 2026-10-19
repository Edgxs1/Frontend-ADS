"use client";

import { ChevronRight, UsersRound } from "lucide-react";
import type { Obra } from "@/types";

interface ObrasTablaProps {
  obras: Obra[];
  obraSeleccionada: string | null;
  onSeleccionar: (obra: Obra) => void;
}

export function ObrasTabla({
  obras,
  obraSeleccionada,
  onSeleccionar,
}: ObrasTablaProps) {
  if (obras.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
        Aún no hay obras registradas.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-slate-500">
              Nombre
            </th>
            <th className="px-4 py-3 text-left font-medium text-slate-500">
              Tipo de edificación
            </th>
            <th className="px-4 py-3 text-left font-medium text-slate-500">
              Habitaciones
            </th>
            <th className="px-4 py-3 text-right font-medium text-slate-500">
              Equipo
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {obras.map((obra) => {
            const activa = obraSeleccionada === obra.id_obra;

            return (
              <tr
                key={obra.id_obra}
                className={activa ? "bg-slate-50" : undefined}
              >
                <td className="px-4 py-3 font-medium text-slate-900">
                  {obra.nombre}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {obra.tipo_edificacion ?? "—"}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {obra.num_habitaciones ?? "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => onSeleccionar(obra)}
                    className={[
                      "inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm font-medium transition",
                      activa
                        ? "border-slate-900 bg-slate-900 text-white hover:bg-slate-800"
                        : "border-slate-300 text-slate-700 hover:bg-slate-100",
                    ].join(" ")}
                  >
                    <UsersRound className="h-4 w-4" aria-hidden="true" />
                    {activa ? "Ocultar equipo" : "Ver equipo"}
                    <ChevronRight
                      className={[
                        "h-4 w-4 transition",
                        activa ? "rotate-90" : "",
                      ].join(" ")}
                      aria-hidden="true"
                    />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
