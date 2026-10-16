"use client";

import { MapPin } from "lucide-react";

export function SinObraSeleccionada() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
      <MapPin className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <span>
        Por favor selecciona una obra en el menú superior para visualizar esta
        sección.
      </span>
    </div>
  );
}
