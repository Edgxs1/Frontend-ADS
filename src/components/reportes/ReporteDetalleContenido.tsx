"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useSupabaseSession } from "@/providers/supabase-provider";
import { DatosReporteDetalle } from "@/components/reportes/DatosReporteDetalle";

export function ReporteDetalleContenido() {
  const router = useRouter();
  const params = useParams<{ id_reporte: string }>();
  const { session, loading, loadingPerfil } = useSupabaseSession();

  const idReporte = params?.id_reporte ?? "";

  useEffect(() => {
    if (!loading && !session) {
      router.replace("/login");
    }
  }, [loading, session, router]);

  if (loading || (session && loadingPerfil)) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" aria-hidden="true" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (!idReporte) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
        Reporte no válido.
      </div>
    );
  }

  return <DatosReporteDetalle idReporte={idReporte} />;
}

