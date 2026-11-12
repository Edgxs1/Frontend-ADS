import type { EstadoEstimacion } from "@/types/estimacion";

const ESTADO_CLASS: Record<EstadoEstimacion, string> = {
  Creada: "bg-slate-100 text-slate-700",
  "Por revisar": "bg-blue-100 text-blue-800",
  Revisada: "bg-yellow-100 text-yellow-800",
  Rechazada: "bg-red-100 text-red-800",
  Aprobada: "bg-green-100 text-green-800",
};

export function EstadoEstimacionBadge({ estado }: { estado: EstadoEstimacion }) {
  const clase = ESTADO_CLASS[estado] ?? "bg-slate-100 text-slate-700";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${clase}`}
    >
      {estado}
    </span>
  );
}
