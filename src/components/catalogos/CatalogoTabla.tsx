"use client";

import type { ConceptoConPartida } from "@/types";
import { formatearMoneda } from "@/lib/format";

const ENCABEZADOS = [
  "Clave Partida",
  "Clave Concepto",
  "Descripción",
  "Unidad",
  "Cantidad",
  "P.U.",
  "Importe",
] as const;

interface CatalogoTablaProps {
  titulo: string;
  conceptos: ConceptoConPartida[];
}

export function CatalogoTabla({ titulo, conceptos }: CatalogoTablaProps) {
  if (conceptos.length === 0) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-900">{titulo}</h2>
        <p className="mt-3 text-sm text-slate-500">
          No hay conceptos registrados en esta categoría.
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-200 px-5 py-4">
        <h2 className="font-semibold text-slate-900">{titulo}</h2>
        <span className="text-xs font-medium text-slate-400">
          {conceptos.length} concepto{conceptos.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              {ENCABEZADOS.map((encabezado) => (
                <th
                  key={encabezado}
                  className="whitespace-nowrap px-4 py-2 text-left font-medium uppercase tracking-wide text-slate-400"
                >
                  {encabezado}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {conceptos.map((concepto) => (
              <tr key={concepto.id_concepto} className="hover:bg-slate-50/60">
                <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                  {concepto.partida_clave ?? "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                  {concepto.clave}
                </td>
                <td className="max-w-xs px-4 py-3 text-slate-600">
                  {concepto.descripcion}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                  {concepto.unidad_medida}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-600">
                  {concepto.cantidad}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-600">
                  {formatearMoneda(concepto.precio_unitario)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums text-slate-900">
                  {formatearMoneda(concepto.importe_total)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-slate-200 bg-slate-50">
            <tr>
              <td
                colSpan={ENCABEZADOS.length - 1}
                className="px-4 py-3 text-right font-semibold uppercase tracking-wide text-slate-500"
              >
                Total
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums text-slate-900">
                {formatearMoneda(
                  conceptos.reduce((suma, c) => suma + Number(c.importe_total), 0),
                )}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
