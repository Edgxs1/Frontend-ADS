"use client";

import type { Partida } from "@/types";

export function PartidasLista({ partidas }: { partidas: Partida[] }) {
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
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {partidas.map((partida) => (
              <tr key={partida.id_partida}>
                <td className="whitespace-nowrap px-5 py-3 font-medium text-slate-900">
                  {partida.clave}
                </td>
                <td className="px-5 py-3 text-slate-600">{partida.descripcion}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
