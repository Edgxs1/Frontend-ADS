import type { EstadoEstimacion } from "@/types/estimacion";

const ESTADO_CLASS: Record<EstadoEstimacion, string> = {
  Borrador: "bg-slate-100 text-slate-700",
  "Revision Supervisor": "bg-blue-100 text-blue-800",
  "Revision Residente": "bg-yellow-100 text-yellow-800",
  Autorizada: "bg-green-100 text-green-800",
  Rechazada: "bg-red-100 text-red-800",
};

export function EstadoEstimacionBadge({ estado }: { estado: EstadoEstimacion }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ESTADO_CLASS[estado]}`}
    >
      {estado}
    </span>
  );
}
