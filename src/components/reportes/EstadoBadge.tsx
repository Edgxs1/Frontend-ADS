import type { EstadoReporte } from "@/types";

interface EstadoBadgeProps {
  estado: EstadoReporte;
}

export function EstadoBadge({ estado }: EstadoBadgeProps) {
  const estilos =
    estado === "Validado"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : "bg-amber-50 text-amber-700 ring-amber-200";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${estilos}`}
    >
      {estado}
    </span>
  );
}
