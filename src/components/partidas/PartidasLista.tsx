"use client";

import { Pencil, Trash2 } from "lucide-react";
import type { Partida } from "@/types";

interface PartidasListaProps {
  partidas: Partida[];
  puedeGestionar?: boolean;
  onEditar?: (partida: Partida) => void;
  onEliminar?: (partida: Partida) => void;
}

export function PartidasLista({
  partidas,
  puedeGestionar = false,
  onEditar,
  onEliminar,
}: PartidasListaProps) {
  if (partidas.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
        Aún no hay partidas registradas para esta obra.
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="font-semibold text-slate-900">Partidas registradas</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-5 py-2 text-left font-medium uppercase tracking-wide text-slate-400">
                Clave
              </th>
              <th className="px-5 py-2 text-left font-medium uppercase tracking-wide text-slate-400">
                Descripción
              </th>
              {puedeGestionar ? (
                <th className="px-5 py-2 text-right font-medium uppercase tracking-wide text-slate-400">
                  Acciones
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {partidas.map((partida) => (
              <tr key={partida.id_partida}>
                <td className="whitespace-nowrap px-5 py-3 font-medium text-slate-900">
                  {partida.clave}
                </td>
                <td className="px-5 py-3 text-slate-600">{partida.descripcion}</td>
                {puedeGestionar ? (
                  <td className="whitespace-nowrap px-5 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onEditar?.(partida)}
                        className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                        aria-label={`Editar partida ${partida.clave}`}
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEliminar?.(partida)}
                        className="rounded-lg p-1.5 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                        aria-label={`Eliminar partida ${partida.clave}`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
