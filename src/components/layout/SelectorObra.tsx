"use client";

import { ChevronDown, MapPin } from "lucide-react";
import { useObra } from "@/providers/obra-provider";

export function SelectorObra() {
  const { obras, obraActiva, loadingObras, errorObras, seleccionarObra } = useObra();

  if (loadingObras) {
    return (
      <div className="flex max-w-[150px] items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-500 md:max-w-none">
        <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="truncate">Cargando obras...</span>
      </div>
    );
  }

  if (errorObras) {
    return (
      <div className="flex max-w-[150px] items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 md:max-w-none">
        <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="truncate">{errorObras}</span>
      </div>
    );
  }

  if (obras.length === 0) {
    return (
      <div className="flex max-w-[150px] items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-500 md:max-w-none">
        <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="truncate">Sin obras asignadas</span>
      </div>
    );
  }

  return (
    <div className="relative inline-flex min-w-0 max-w-[150px] items-center md:max-w-none">
      <MapPin className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" aria-hidden="true" />
      <select
        className="w-full appearance-none truncate rounded-xl border border-slate-300 bg-white pl-9 pr-9 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 md:w-auto"
        value={obraActiva?.id_obra ?? ""}
        onChange={(evento) => {
          const id = evento.target.value;
          if (id) {
            seleccionarObra(id);
          }
        }}
        aria-label="Seleccionar obra activa"
      >
        {obras.map((obra) => (
          <option key={obra.id_obra} value={obra.id_obra}>
            {obra.nombre}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-slate-400" aria-hidden="true" />
    </div>
  );
}
