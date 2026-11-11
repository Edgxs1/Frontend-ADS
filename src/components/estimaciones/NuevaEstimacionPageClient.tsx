"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, Calculator, Loader2 } from "lucide-react";
import { useSupabaseSession } from "@/providers/supabase-provider";
import { useObra } from "@/providers/obra-provider";
import { SinObraSeleccionada } from "@/components/common/SinObraSeleccionada";
import { EstimacionFormulario } from "@/components/estimaciones/EstimacionFormulario";
import { Button } from "@/components/ui/button";

export function NuevaEstimacionPageClient() {
  const router = useRouter();
  const { rol, loading, loadingPerfil } = useSupabaseSession();
  const { obraActiva } = useObra();

  const esSuperintendente = rol === "Superintendente";

  if (loading || loadingPerfil) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center">
        <Loader2
          className="h-8 w-8 animate-spin text-slate-400"
          aria-hidden="true"
        />
      </div>
    );
  }

  if (!esSuperintendente) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <span>
            Solo el Superintendente puede registrar nuevas estimaciones.
          </span>
        </div>
        <Button asChild variant="outline" className="gap-2">
          <Link href="/dashboard/estimaciones">
            <ArrowLeft className="h-4 w-4" />
            Volver a estimaciones
          </Link>
        </Button>
      </div>
    );
  }

  if (!obraActiva) {
    return <SinObraSeleccionada />;
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <Link
          href="/dashboard/estimaciones"
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver a estimaciones
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/5 text-slate-900">
            <Calculator className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Nueva Estimación
            </h1>
            <p className="text-sm text-slate-500">{obraActiva.nombre}</p>
          </div>
        </div>
      </header>

      <EstimacionFormulario
        idObra={obraActiva.id_obra}
        onSuccess={(estimacion) => {
          router.push(`/dashboard/estimaciones/${estimacion.id_estimacion}`);
          router.refresh();
        }}
      />
    </div>
  );
}
