import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { ReporteDetalleContenido } from "@/components/reportes/ReporteDetalleContenido";

export default function ReporteDetallePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh items-center justify-center bg-slate-50">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" aria-hidden="true" />
        </main>
      }
    >
      <ReporteDetalleContenido />
    </Suspense>
  );
}
