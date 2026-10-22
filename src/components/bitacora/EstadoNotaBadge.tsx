import { Lock } from "lucide-react";
import type { EstadoNota } from "@/types";

interface EstadoNotaBadgeProps {
  estado: EstadoNota;
}

export function EstadoNotaBadge({ estado }: EstadoNotaBadgeProps) {
  if (estado === "Firmada") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
        <Lock className="h-3 w-3" aria-hidden="true" />
        Firmada
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
      Abierta
    </span>
  );
}
